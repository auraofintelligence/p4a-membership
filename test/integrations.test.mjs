import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto, createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { authenticate } from '../src/auth.mjs';
import { workspaceStore } from '../src/workspace-store.mjs';

globalThis.crypto ??= webcrypto;
const utf8 = new TextEncoder();
const encode = value => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');
const secret = 'isolated-test-secret-with-at-least-32-characters';
const emptyState = () => ({ revision: 0, people: [], groups: [], projects: [], memberships: [], contributions: [], decisions: [], activity: [], processed: [] });

test('Access verifies signatures and claims, maps only a unique preprovisioned subject', async () => {
  const key = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const publicKey = { ...await crypto.subtle.exportKey('jwk', key.publicKey), kid: 'integration-key', alg: 'RS256', use: 'sig' };
  const env = { ACCESS_ISSUER: 'https://integration-test.cloudflareaccess.com', ACCESS_AUD: 'members-app' };
  const claims = { iss: env.ACCESS_ISSUER, aud: [env.ACCESS_AUD], sub: 'verified-person', exp: Math.floor(Date.now() / 1000) + 300, email: 'spoof@example.test' };
  const state = { people: [{ id: 'p1', authSubject: 'verified-person', name: 'Test Member', role: 'member' }] };
  const sign = async (data = claims, header = { alg: 'RS256', kid: 'integration-key' }) => {
    const unsigned = `${encode(header)}.${encode(data)}`;
    return `${unsigned}.${Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key.privateKey, utf8.encode(unsigned))).toString('base64url')}`;
  };
  const req = token => new Request('https://membership.example.test/api/bootstrap', { headers: { 'Cf-Access-Jwt-Assertion': token } });
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async url => {
    assert.equal(url, `${env.ACCESS_ISSUER}/cdn-cgi/access/certs`);
    requests++;
    return Response.json({ keys: [publicKey] });
  };
  try {
    const token = await sign();
    assert.deepEqual(await authenticate(req(token), env, state), { id: 'p1', name: 'Test Member', role: 'member' });
    assert.deepEqual(await authenticate(new Request('https://membership.example.test', { headers: { Cookie: `other=x; CF_Authorization=${token}` } }), env, state), { id: 'p1', name: 'Test Member', role: 'member' });
    assert.equal(requests, 1, 'key set should be cached');
    assert.equal(await authenticate(req(await sign({ ...claims, aud: 'wrong-app' })), env, state), null);
    assert.equal(await authenticate(req(await sign({ ...claims, exp: 1 })), env, state), null);
    assert.equal(await authenticate(req(await sign({ ...claims, nbf: claims.exp })), env, state), null);
    assert.equal(await authenticate(req(await sign({ ...claims, iss: 'https://wrong.cloudflareaccess.com' })), env, state), null);
    assert.equal(await authenticate(req(await sign({ ...claims, sub: 'unprovisioned-subject' })), env, state), null);
    assert.equal(await authenticate(req(await sign(claims, { alg: 'none', kid: 'integration-key' })), env, state), null);
    const parts = token.split('.');
    parts[1] = encode({ ...claims, sub: 'tampered' });
    assert.equal(await authenticate(req(parts.join('.')), env, state), null);
    assert.equal(await authenticate(req(token), env, { people: [...state.people, { ...state.people[0], id: 'duplicate' }] }), null);
    assert.equal(await authenticate(req(token), {}, state), null);
    assert.equal(await authenticate(req(token), { ...env, ACCESS_ISSUER: 'https://untrusted.example' }, state), null);
    assert.equal(await authenticate(req(token), env, { people: [{ ...state.people[0], role: 'administrator' }] }), null);
  } finally { globalThis.fetch = originalFetch; }
});

async function makeBridge() {
  let stored = JSON.stringify(emptyState());
  let writes = 0;
  let held = false;
  const cache = new Map();
  const blob = text => ({ getBytes: () => [...Buffer.from(text)], getDataAsString: () => text });
  const context = vm.createContext({
    ContentService: { MimeType: { JSON: 'application/json' }, createTextOutput: text => ({ text, setMimeType() { return this; } }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => ({ WORKSPACE_SECRET: secret, STATE_FILE_ID: 'private-test-file' })[key] }) },
    Utilities: { Charset: { UTF_8: 'UTF-8' }, newBlob: blob, computeHmacSha256Signature: (payload, key) => [...createHmac('sha256', key).update(payload).digest()] },
    CacheService: { getScriptCache: () => ({ get: key => cache.get(key), put: (key, value) => cache.set(key, value) }) },
    LockService: { getScriptLock: () => ({ tryLock: () => { if (held) return false; held = true; return true; }, hasLock: () => held, releaseLock: () => { held = false; } }) },
    DriveApp: { getFileById: id => { assert.equal(id, 'private-test-file'); return { getBlob: () => blob(stored), setContent: text => { stored = text; writes++; } }; } },
  });
  vm.runInContext(await readFile(new URL('../integrations/google-workspace/Code.gs', import.meta.url), 'utf8'), context);
  return {
    call: body => JSON.parse(context.doPost({ postData: { contents: body } }).text),
    state: () => JSON.parse(stored), writes: () => writes,
  };
}

function signed(action, extras = {}) {
  const payload = JSON.stringify({ version: 1, action, timestamp: Date.now(), nonce: crypto.randomUUID(), ...extras });
  return JSON.stringify({ payload, signature: createHmac('sha256', secret).update(payload).digest('hex') });
}

test('Apps Script bridge rejects tampering, stale requests and replays; CAS prevents lost updates', async () => {
  const bridge = await makeBridge();
  const read = signed('read');
  assert.equal(bridge.call(read).ok, true);
  assert.equal(bridge.call(read).ok, false, 'nonce replay rejected');
  const tampered = JSON.parse(signed('read'));
  tampered.payload = tampered.payload.replace('read', 'cas');
  assert.equal(bridge.call(JSON.stringify(tampered)).ok, false);
  assert.equal(bridge.call(signed('read', { timestamp: Date.now() - 61000 })).ok, false);
  assert.equal(bridge.call(signed('read', { timestamp: Date.now() + 61000 })).ok, false);
  assert.equal(bridge.call(signed('unknown')).ok, false);
  const next = { ...emptyState(), revision: 1 };
  assert.deepEqual(bridge.call(signed('cas', { expectedRevision: 0, state: next })), { ok: true, swapped: true });
  assert.deepEqual(bridge.call(signed('cas', { expectedRevision: 0, state: next })), { ok: true, swapped: false });
  assert.equal(bridge.call(signed('cas', { expectedRevision: 1, state: { ...next, revision: 3 } })).ok, false);
  assert.equal(bridge.call(signed('cas', { expectedRevision: 1, state: { revision: 2 } })).ok, false);
  assert.equal(bridge.writes(), 1);
  assert.equal(bridge.state().revision, 1);
});

test('Workspace adapter and Apps Script bridge interoperate without exposing credentials in URL', async () => {
  const bridge = await makeBridge();
  const env = { WORKSPACE_URL: 'https://script.google.com/macros/s/test-deployment/exec', WORKSPACE_SECRET: secret };
  const store = workspaceStore(env);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, env.WORKSPACE_URL);
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, undefined);
    assert.equal(options.body.includes(secret), false);
    return Response.json(bridge.call(options.body));
  };
  try {
    const legacyState = await store.read();
    assert.equal(legacyState.revision, 0);
    assert.deepEqual(legacyState.constitutions, [], 'older live registers gain an empty draft collection in memory');
    assert.equal(bridge.state().constitutions, undefined, 'a read does not write a migration to Google storage');
    assert.equal(await store.compareAndSwap(0, { ...emptyState(), revision: 1 }), true);
    assert.equal(await store.compareAndSwap(0, { ...emptyState(), revision: 1 }), false);
    assert.equal((await store.read()).revision, 1);
    await assert.rejects(store.compareAndSwap(1, emptyState()), /revision/);
  } finally { globalThis.fetch = originalFetch; }
  assert.throws(() => workspaceStore({ ...env, WORKSPACE_URL: 'https://attacker.example/exec' }), /URL/);
  assert.throws(() => workspaceStore({ ...env, WORKSPACE_SECRET: 'too-short' }), /configured/);
});

test('Workspace adapter fails closed on failed or malformed service responses', async () => {
  const store = workspaceStore({ WORKSPACE_URL: 'https://script.google.com/macros/s/test-deployment/exec', WORKSPACE_SECRET: secret });
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({ ok: false, error: 'private message' });
    await assert.rejects(store.read(), /rejected/);
    globalThis.fetch = async () => new Response('<html>login required</html>');
    await assert.rejects(store.read(), /invalid response/);
    globalThis.fetch = async () => Response.json({ ok: true, state: { revision: -1 } });
    await assert.rejects(store.read(), /invalid/);
    globalThis.fetch = async () => { throw new Error('network'); };
    await assert.rejects(store.read(), /unavailable/);
  } finally { globalThis.fetch = originalFetch; }
});
