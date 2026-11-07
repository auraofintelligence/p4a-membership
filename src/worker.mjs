import { api, securityHeaders, json } from './http.mjs';
import { emptyState } from './domain.mjs';
import { workspaceStore } from './workspace-store.mjs';
import { authenticate } from './auth.mjs';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      if (url.pathname.startsWith('/api/demo/')) return json({ error: 'Not found.' }, 404);
      const configured = Boolean(env.WORKSPACE_URL && env.WORKSPACE_SECRET && env.ACCESS_ISSUER && env.ACCESS_AUD);
      try {
        const store = configured ? workspaceStore(env) : { read: async () => emptyState(), compareAndSwap: async () => false };
        return await api(request, { store, getActor: configured ? (req, state) => authenticate(req, env, state) : async () => null, mode: 'live', workspace: configured });
      } catch {
        return json({ error: 'The workspace connection is not ready.' }, 503);
      }
    }
    if (!['GET', 'HEAD'].includes(request.method)) return json({ error: 'Method not allowed.' }, 405);
    if (!env.ASSETS) return json({ error: 'The public application has not been configured.' }, 503);
    const response = await env.ASSETS.fetch(request);
    const secured = new Response(response.body, response);
    for (const [key, value] of Object.entries(securityHeaders)) secured.headers.set(key, value);
    return secured;
  },
};
