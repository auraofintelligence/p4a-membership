import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { authenticate } from '../src/auth.mjs';
import { authenticatePilot, getPilotRole, pilotActorForRole } from '../src/pilot-auth.mjs';
import { createDemoState } from '../src/seed.mjs';
import pilotWorker from '../src/pilot-worker.mjs';

globalThis.crypto ??= webcrypto;

test('Pilot authentication uses verified Access identities and maps only to fictional actors', async t => {
  const algorithm = { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' };
  const keys = await crypto.subtle.generateKey(algorithm, true, ['sign', 'verify']);
  const publicKey = { ...await crypto.subtle.exportKey('jwk', keys.publicKey), kid: 'pilot-test-key', alg: 'RS256', use: 'sig' };
  const env = {
    ACCESS_ISSUER: 'https://pilot-auth-test.cloudflareaccess.com',
    ACCESS_AUD: 'pilot-test-audience',
    PILOT_ORGANISER_EMAILS: '["Owner@Example.test","alias@example.test"]',
    PILOT_MEMBER_EMAILS: '["tester@example.test"]',
  };
  const claims = { iss: env.ACCESS_ISSUER, aud: [env.ACCESS_AUD], type: 'app', sub: 'verified-access-subject', email: 'OWNER@example.test', exp: Math.floor(Date.now() / 1000) + 300 };
  const encode = data => Buffer.from(JSON.stringify(data)).toString('base64url');
  const sign = async (extra = {}) => {
    const unsigned = `${encode({ alg: 'RS256', kid: publicKey.kid })}.${encode({ ...claims, ...extra })}`;
    const signature = await crypto.subtle.sign(algorithm.name, keys.privateKey, new TextEncoder().encode(unsigned));
    return `${unsigned}.${Buffer.from(signature).toString('base64url')}`;
  };
  const request = (token, headers = {}) => new Request('https://pilot.example.test/', {
    headers: token ? { ...headers, 'Cf-Access-Jwt-Assertion': token } : headers,
  });
  const ownerToken = await sign();
  const aliasToken = await sign({ email: 'alias@example.test', sub: 'second-access-subject' });
  const memberToken = await sign({ email: 'tester@example.test', sub: 'tester-access-subject' });
  const state = createDemoState();
  const fetchBefore = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, `${env.ACCESS_ISSUER}/cdn-cgi/access/certs`);
    assert.equal(options.redirect, 'manual');
    return Response.json({ keys: [publicKey] });
  };
  t.after(() => { globalThis.fetch = fetchBefore; });

  await t.test('both organiser aliases share one fixture and the optional member has a different role', async () => {
    const organiser = { id: 'person-2', name: 'Sam Taylor', role: 'organiser' };
    assert.equal(await getPilotRole(request(ownerToken), env), 'organiser');
    assert.deepEqual(await authenticatePilot(request(ownerToken), env, state), organiser);
    assert.deepEqual(await authenticatePilot(request(aliasToken), env, state), organiser);
    assert.deepEqual(await authenticatePilot(request(memberToken), env, state), { id: 'person-1', name: 'Alex River', role: 'member' });
    assert.equal(await getPilotRole(request(memberToken), { ...env, PILOT_MEMBER_EMAILS: undefined }), null);
    assert.equal(await authenticate(request(ownerToken), env, state), null);
  });

  await t.test('forged, unverified and non-application identities are denied', async () => {
    const unknownToken = await sign({ email: 'new-owner@example.test' });
    const [header, , signature] = unknownToken.split('.');
    const modifiedToken = `${header}.${encode(claims)}.${signature}`;
    const bareEmail = { 'Cf-Access-Authenticated-User-Email': claims.email };
    assert.equal(await getPilotRole(request(undefined, bareEmail), env), null);
    assert.equal(await getPilotRole(request(unknownToken, bareEmail), env), null);
    assert.equal(await getPilotRole(request(modifiedToken), env), null);
    for (const change of [
      { iss: 'https://other.cloudflareaccess.com' }, { aud: ['other-app'] }, { exp: 1 },
      { type: 'org' }, { email: undefined }, { sub: '' }, { email: 'OWNER@example.test\n' },
    ]) {
      assert.equal(await getPilotRole(request(await sign(change)), env), null);
    }
  });

  await t.test('a signed application cookie can carry a browser session when the assertion header is absent', async () => {
    const cookie = token => ({ Cookie: `theme=violet; CF_Authorization=${token}` });
    assert.equal(await getPilotRole(request(undefined, cookie(ownerToken)), env), 'organiser');
    assert.equal(await getPilotRole(request(undefined, cookie(memberToken)), env), 'member');
    assert.equal(await getPilotRole(request(undefined, cookie(await sign({ exp: 1 }))), env), null);
    assert.equal(await getPilotRole(request(undefined, cookie(await sign({ aud: ['other-app'] }))), env), null);
    assert.equal(await getPilotRole(request('invalid-assertion', cookie(ownerToken)), env), null);
  });

  await t.test('missing, malformed or overlapping role configuration fails closed', async () => {
    for (const changes of [
      { ACCESS_ISSUER: undefined }, { ACCESS_AUD: undefined }, { PILOT_ORGANISER_EMAILS: undefined },
      { PILOT_ORGANISER_EMAILS: '"owner@example.test"' }, { PILOT_ORGANISER_EMAILS: '[]' },
      { PILOT_MEMBER_EMAILS: '["owner@example.test"]' }, { PILOT_MEMBER_EMAILS: '[42]' },
      { PILOT_MEMBER_EMAILS: '["tester@example.test","second@example.test"]' },
    ]) {
      assert.equal(await getPilotRole(request(ownerToken), { ...env, ...changes }), null);
    }
  });

  await t.test('the role resolver only accepts a unique fictional fixture with the matching role', () => {
    const organiser = state.people.find(person => person.id === 'person-2');
    assert.equal(pilotActorForRole('organiser', { people: [] }), null);
    assert.equal(pilotActorForRole('organiser', { people: [organiser, organiser] }), null);
    assert.equal(pilotActorForRole('organiser', { people: [{ ...organiser, role: 'member' }] }), null);
    assert.equal(pilotActorForRole('organiser', { people: [{ ...organiser, authSubject: 'live-subject' }] }), null);
    assert.equal(pilotActorForRole('organiser', { people: [{ ...organiser, email: 'live@example.test' }] }), null);
    assert.equal(pilotActorForRole('unknown', state), null);
  });

  await t.test('the hosted Worker protects assets and persists a practice application and independent review', async () => {
    let snapshot = structuredClone(state);
    let assetRequests = 0;
    const pilotEnv = {
      ...env,
      PILOT_MODE: 'fictional',
      ASSETS: { fetch: async () => { assetRequests++; return new Response('Pilot assets'); } },
      PILOT_DB: {
        prepare(sql) {
          if (sql.startsWith('SELECT')) {
            return { first: async () => ({ revision: snapshot.revision, snapshot_json: JSON.stringify(snapshot), data_mode: 'fictional' }) };
          }
          assert.ok(sql.startsWith('UPDATE'));
          return { bind: (nextRevision, payload, revision) => ({
            run: async () => {
              if (snapshot.revision !== revision) return { success: true, meta: { changes: 0 } };
              snapshot = JSON.parse(payload);
              assert.equal(snapshot.revision, nextRevision);
              return { success: true, meta: { changes: 1 } };
            },
          }) };
        },
      },
    };
    const call = (path, token, data) => {
      const origin = 'https://pilot.example.test';
      const headers = token ? { 'Cf-Access-Jwt-Assertion': token } : {};
      if (data) Object.assign(headers, { origin, 'content-type': 'application/json' });
      return pilotWorker.fetch(new Request(origin + path, data ? { method: 'POST', body: JSON.stringify(data), headers } : { headers }), pilotEnv);
    };
    const command = (token, type, data) => call('/api/commands', token, { id: crypto.randomUUID(), revision: snapshot.revision, type, data });

    assert.equal((await call('/')).status, 401);
    assert.equal((await call('/api/public')).status, 401);
    assert.equal(assetRequests, 0);
    const assets = await call('/', ownerToken);
    assert.equal(assets.status, 200);
    assert.equal(assets.headers.get('cache-control'), 'no-store');
    assert.equal(assets.headers.get('x-robots-tag'), 'noindex, nofollow');
    assert.equal((await call('/api/demo/session', ownerToken, { role: 'member' })).status, 404);
    const bootstrap = await (await call('/api/bootstrap', aliasToken)).json();
    assert.equal(bootstrap.mode, 'pilot');
    assert.equal(bootstrap.actor.id, 'person-2');
    assert.equal(bootstrap.public.sampleData, true);
    assert.equal(bootstrap.integrations.workspace, false);
    assert.equal((await (await call('/api/gamify', ownerToken)).json()).sampleData, true);

    assert.equal((await command(memberToken, 'membership.apply', { acknowledged: true })).status, 200);
    const application = snapshot.memberships.find(membership => membership.personId === 'person-1');
    assert.equal(application.status, 'pending');
    assert.equal((await command(memberToken, 'membership.review', { membershipId: application.id, status: 'accepted' })).status, 403);
    assert.equal((await command(aliasToken, 'membership.review', { membershipId: application.id, status: 'accepted' })).status, 200);
    assert.equal((await command(memberToken, 'group.join', { groupId: 'group-2' })).status, 200);
    const draft = snapshot.constitutions[0];
    const clause = draft.clauses[0];
    assert.equal((await command(memberToken, 'constitution.propose', {
      constitutionId: draft.id, clauseId: clause.id, baseVersion: clause.version,
      title: 'Practice amendment', body: 'A fictional change for the pilot.', reason: 'Exercise the hosted review journey.',
    })).status, 200);
    const reloaded = await (await call('/api/bootstrap', memberToken)).json();
    assert.equal(reloaded.memberships[0].status, 'accepted');
    assert.ok(reloaded.groups.find(group => group.id === 'group-2').memberIds.includes('person-1'));
    assert.equal(reloaded.constitutions[0].proposals.at(-1).title, 'Practice amendment');
  });
});
