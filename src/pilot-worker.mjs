import { api, json, securityHeaders } from './http.mjs';
import { getPilotIdentity, pilotActorForRole } from './pilot-auth.mjs';
import { pilotStore } from './pilot-store.mjs';
import { reviewApplications } from './application-review.mjs';

const pilotHeaders = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
};

export default {
  async fetch(request, env) {
    if (env.PILOT_MODE !== 'private') {
      return json({ error: 'The private pilot is not configured.' }, 503, pilotHeaders);
    }
    const identity = await getPilotIdentity(request, env);
    if (!identity) return json({ error: 'Sign in with an invited Cloudflare Access account.' }, 401, pilotHeaders);

    const path = new URL(request.url).pathname;
    if (path === '/api/applications') return reviewApplications(request, env.APPLICATIONS, identity, pilotHeaders);
    if (path.startsWith('/api/')) {
      if (path.startsWith('/api/demo/')) return json({ error: 'Not found.' }, 404, pilotHeaders);
      try {
        const response = await api(request, {
          store: pilotStore(env, { id: 'pilot-organiser', name: env.PILOT_ORGANISER_NAME }),
          getActor: async (_request, state) => pilotActorForRole(identity.role, state),
          mode: 'pilot',
          workspace: false,
        });
        const secured = new Response(response.body, response);
        secured.headers.set('X-Robots-Tag', pilotHeaders['X-Robots-Tag']);
        return secured;
      } catch {
        return json({ error: 'The pilot database is unavailable.' }, 503, pilotHeaders);
      }
    }

    if (!['GET', 'HEAD'].includes(request.method)) return json({ error: 'Method not allowed.' }, 405, pilotHeaders);
    if (!env.ASSETS) return json({ error: 'The pilot interface is unavailable.' }, 503, pilotHeaders);
    const response = await env.ASSETS.fetch(request);
    const secured = new Response(response.body, response);
    for (const [key, value] of Object.entries({ ...securityHeaders, ...pilotHeaders })) secured.headers.set(key, value);
    return secured;
  },
};
