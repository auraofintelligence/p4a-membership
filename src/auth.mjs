// Optional production adapter. No development identity reaches this verifier.
const keyCache = new Map();
const decoder = new TextDecoder('utf-8', { fatal: true });

function decodePart(part) {
  if (!/^[A-Za-z0-9_-]+$/.test(part)) throw new Error('Malformed token');
  return Uint8Array.from(atob(part.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - part.length % 4) % 4)), c => c.charCodeAt(0));
}

function issuerOrigin(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(url.hostname) || url.port || url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) {
    throw new Error('Invalid Access issuer');
  }
  return url.origin;
}

async function getKeys(issuer) {
  const existing = keyCache.get(issuer);
  if (existing?.expires > Date.now()) return existing.keys;
  const response = await fetch(`${issuer}/cdn-cgi/access/certs`, { redirect: 'error', signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('Identity verification unavailable');
  const body = await response.text();
  if (body.length > 65536) throw new Error('Invalid identity key set');
  const result = JSON.parse(body);
  if (!Array.isArray(result.keys) || result.keys.length > 32) throw new Error('Invalid identity key set');
  if (keyCache.size >= 10) keyCache.clear();
  keyCache.set(issuer, { expires: Date.now() + 300000, keys: result.keys });
  return result.keys;
}

export async function authenticate(request, env, state) {
  if (!env.ACCESS_ISSUER || !env.ACCESS_AUD) return null;
  try {
    const issuer = issuerOrigin(env.ACCESS_ISSUER);
    const cookie = (request.headers.get('Cookie') || '').split(';').map(x => x.trim()).find(x => x.startsWith('CF_Authorization='))?.slice(17);
    const token = request.headers.get('Cf-Access-Jwt-Assertion') || cookie;
    if (!token || token.length > 16384) return null;
    const pieces = token.split('.');
    if (pieces.length !== 3) return null;
    const header = JSON.parse(decoder.decode(decodePart(pieces[0])));
    const claims = JSON.parse(decoder.decode(decodePart(pieces[1])));
    if (header.alg !== 'RS256' || typeof header.kid !== 'string' || header.kid.length > 200) return null;
    const now = Math.floor(Date.now() / 1000);
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (claims.iss !== issuer || !audiences.includes(env.ACCESS_AUD) || !Number.isSafeInteger(claims.exp) || claims.exp <= now ||
      (claims.nbf !== undefined && (!Number.isSafeInteger(claims.nbf) || claims.nbf > now)) ||
      (claims.iat !== undefined && (!Number.isSafeInteger(claims.iat) || claims.iat > now + 30)) ||
      typeof claims.sub !== 'string' || !claims.sub || claims.sub.length > 512) return null;
    const keys = await getKeys(issuer);
    const jwk = keys.find(k => k.kid === header.kid && k.kty === 'RSA' && (!k.use || k.use === 'sig') && (!k.alg || k.alg === 'RS256'));
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    if (!await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decodePart(pieces[2]), new TextEncoder().encode(`${pieces[0]}.${pieces[1]}`))) return null;
    const matches = (state.people || []).filter(p => p.authSubject === claims.sub && ['member', 'organiser'].includes(p.role));
    if (matches.length !== 1) return null;
    const person = matches[0];
    return { id: person.id, name: person.name, role: person.role };
  } catch {
    return null;
  }
}
