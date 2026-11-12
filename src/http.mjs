import { AppError, executeCommand, projectState, publicProjection, gamifyProjection } from './domain.mjs';

export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
export function json(value, status = 200, extra = {}) {
  return new Response(JSON.stringify(value), { status, headers: { ...securityHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra } });
}
export async function readBody(request) {
  if ((request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase() !== 'application/json') throw new AppError('Send JSON request data.', 415);
  if (Number(request.headers.get('content-length')) > 32768) throw new AppError('This request is too large.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new AppError('Request details are required.');
  let size = 0; const parts = [];
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > 32768) { await reader.cancel(); throw new AppError('This request is too large.', 413); }
    parts.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new AppError('The request was not valid JSON.'); }
}
export function requireSameOrigin(request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) throw new AppError('Changes must come from this workspace.', 403);
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && !['same-origin', 'none'].includes(fetchSite)) throw new AppError('Cross-site changes are not accepted.', 403);
}
export async function api(request, { store, getActor, mode, workspace, demoSession }) {
  try {
    const url = new URL(request.url);
    if (request.method === 'POST') requireSameOrigin(request);
    if (url.pathname === '/api/demo/session') {
      if (!demoSession) return json({ error: 'Not found.' }, 404);
      if (request.method !== 'POST') return json({ error: 'Use POST for this action.' }, 405);
      return demoSession(await readBody(request));
    }
    if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Method not allowed.' }, 405);
    const state = await store.read();
    if (url.pathname === '/api/gamify' && request.method === 'GET') return json(gamifyProjection(state, { period: url.searchParams.get('period') ?? 'all', groupId: url.searchParams.get('groupId') ?? '', projectId: url.searchParams.get('projectId') ?? '' }, mode));
    if (url.pathname === '/api/public' && request.method === 'GET') return json(publicProjection(state, mode));
    const actor = await getActor(request, state);
    if (url.pathname === '/api/bootstrap' && request.method === 'GET') return json(projectState(state, actor, mode, workspace));
    if (!actor) return json({ error: 'Sign in before opening private workspace records.' }, 401);
    if (url.pathname === '/api/export' && request.method === 'GET') return json(projectState(state, actor, mode, workspace), 200, { 'Content-Disposition': 'attachment; filename="p4a-workspace-export.json"' });
    if (url.pathname === '/api/commands' && request.method === 'POST') {
      const command = await readBody(request);
      if (mode !== 'demo' && ['membership.apply', 'membership.review'].includes(command?.type)) {
        throw new AppError('Membership admission is not available until the required checks are in place.', 403);
      }
      const outcome = executeCommand(state, actor, command, new Date(), { mode });
      if (!outcome.result.replayed && !(await store.compareAndSwap(state.revision, outcome.state))) return json({ error: 'The workspace changed. Refresh and try again.' }, 409);
      return json(outcome.result);
    }
    return json({ error: 'Not found.' }, 404);
  } catch (error) {
    if (error instanceof AppError) return json({ error: error.message }, error.status);
    return json({ error: 'The workspace is temporarily unavailable. No successful change has been confirmed.' }, 503);
  }
}
