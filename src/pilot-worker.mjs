import { api, json, securityHeaders } from './http.mjs';
import { getPilotRole, pilotActorForRole } from './pilot-auth.mjs';
import { pilotStore } from './pilot-store.mjs';

const pilotHeaders = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
};

export default {
  async fetch(request, env) {
    if (env.PILOT_MODE !== 'fictional') {
      return json({ error: 'The private pilot is not configured.' }, 503, pilotHeaders);
    }
    const role = await getPilotRole(request, env);
    if (!role) return json({ error: 'Sign in with an invited Cloudflare Access account.' }, 401, pilotHeaders);

    const path = new URL(request.url).pathname;
    if (path.startsWith('/api/')) {
      if (path.startsWith('/api/demo/')) return json({ error: 'Not found.' }, 404, pilotHeaders);
      try {
        const response = await api(request, {
          store: pilotStore(env),
          getActor: async (_request, state) => pilotActorForRole(role, state),
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
