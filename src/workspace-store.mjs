import { normaliseState } from './domain.mjs';
// Workspace owns the authoritative document. Only the signed bridge may write it.
const encoder = new TextEncoder();
const MAX_BYTES = 1024 * 1024;

function configuredUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'script.google.com' || !/^\/macros\/s\/[\w-]+\/exec$/.test(url.pathname) || url.search || url.hash || url.username || url.password) {
    throw new Error('Workspace bridge URL must be a Google Apps Script deployment URL.');
  }
  return url.href;
}

export function workspaceStore(env) {
  if (!env.WORKSPACE_URL || !env.WORKSPACE_SECRET || env.WORKSPACE_SECRET.length < 32) {
    throw new Error('Workspace storage is not configured.');
  }
  const url = configuredUrl(env.WORKSPACE_URL);
  const secret = env.WORKSPACE_SECRET;

  async function call(action, extra = {}) {
    const payload = JSON.stringify({ version: 1, action, timestamp: Date.now(), nonce: crypto.randomUUID(), ...extra });
    if (encoder.encode(payload).length > MAX_BYTES) throw new Error('Workspace document exceeds the configured size limit.');
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = [...new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)))].map(x => x.toString(16).padStart(2, '0')).join('');
    let response;
    try {
      response = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payload, signature }),
        redirect: 'follow', signal: AbortSignal.timeout(25000),
      });
    } catch {
      throw new Error('Workspace storage is unavailable. Retry with the same command ID.');
    }
    if (!response.ok) throw new Error('Workspace storage is unavailable.');
    const content = await response.text();
    if (encoder.encode(content).length > MAX_BYTES + 8192) throw new Error('Workspace response exceeds the configured size limit.');
    let result;
    try { result = JSON.parse(content); } catch { throw new Error('Workspace returned an invalid response.'); }
    if (!result?.ok) throw new Error('Workspace rejected the request. Check the private bridge configuration.');
    return result;
  }

  return {
    async read() {
      const result = await call('read');
      if (!Number.isSafeInteger(result.state?.revision) || result.state.revision < 0 ||
        !['people', 'groups', 'projects', 'memberships', 'contributions', 'decisions', 'activity', 'processed'].every(key => Array.isArray(result.state[key]))) {
        throw new Error('Workspace state is invalid.');
      }
      return normaliseState(result.state);
    },
    async compareAndSwap(expectedRevision, nextState) {
      if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0 || nextState?.revision !== expectedRevision + 1) {
        throw new Error('Invalid Workspace state revision.');
      }
      const result = await call('cas', { expectedRevision, state: nextState });
      if (typeof result.swapped !== 'boolean') throw new Error('Workspace returned an invalid revision result.');
      return result.swapped;
    },
  };
}
