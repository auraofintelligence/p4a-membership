import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { authenticate } from '../src/auth.mjs';
import { authenticatePilot, getPilotRole, pilotActorForRole } from '../src/pilot-auth.mjs';
import { emptyState } from '../src/domain.mjs';
import pilotWorker from '../src/pilot-worker.mjs';

globalThis.crypto ??= webcrypto;

test('Pilot authentication uses verified Access identities and maps them to the existing organiser', async t => {
  const algorithm = { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' };
  const keys = await crypto.subtle.generateKey(algorithm, true, ['sign', 'verify']);
  const publicKey = { ...await crypto.subtle.exportKey('jwk', keys.publicKey), kid: 'pilot-test-key', alg: 'RS256', use: 'sig' };
  const env = {
    ACCESS_ISSUER: 'https://pilot-auth-test.cloudflareaccess.com',
    ACCESS_AUD: 'pilot-test-audience',
    PILOT_ORGANISER_EMAILS: '["Owner@Example.test","alias@example.test"]',
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
  const uninvitedToken = await sign({ email: 'tester@example.test', sub: 'tester-access-subject' });
  const organiser = { id: 'pilot-organiser', name: 'Test Owner', role: 'organiser' };
  const state = { ...emptyState(), people: [{ ...organiser, email: 'owner@example.test', directoryConsent: false, contactConsent: false }] };
  const fetchBefore = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, `${env.ACCESS_ISSUER}/cdn-cgi/access/certs`);
    assert.equal(options.redirect, 'manual');
    return Response.json({ keys: [publicKey] });
  };
  t.after(() => { globalThis.fetch = fetchBefore; });

  await t.test('both authorised email aliases share one organiser profile', async () => {
    assert.equal(await getPilotRole(request(ownerToken), env), 'organiser');
    assert.deepEqual(await authenticatePilot(request(ownerToken), env, state), organiser);
    assert.deepEqual(await authenticatePilot(request(aliasToken), env, state), organiser);
    assert.equal(await authenticatePilot(request(uninvitedToken), env, state), null);
    assert.equal(await getPilotRole(request(uninvitedToken), { ...env, PILOT_MEMBER_EMAILS: '["tester@example.test"]' }), null);
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
    assert.equal(await getPilotRole(request(undefined, cookie(uninvitedToken)), env), null);
    assert.equal(await getPilotRole(request(undefined, cookie(await sign({ exp: 1 }))), env), null);
    assert.equal(await getPilotRole(request(undefined, cookie(await sign({ aud: ['other-app'] }))), env), null);
    assert.equal(await getPilotRole(request('invalid-assertion', cookie(ownerToken)), env), null);
  });

  await t.test('missing or malformed organiser configuration fails closed', async () => {
    for (const changes of [
      { ACCESS_ISSUER: undefined }, { ACCESS_AUD: undefined }, { PILOT_ORGANISER_EMAILS: undefined },
      { PILOT_ORGANISER_EMAILS: '"owner@example.test"' }, { PILOT_ORGANISER_EMAILS: '[]' },
      { PILOT_ORGANISER_EMAILS: '[42]' },
    ]) {
      assert.equal(await getPilotRole(request(ownerToken), { ...env, ...changes }), null);
    }
  });

  await t.test('the role resolver requires a unique existing organiser record with the exact ID', () => {
    assert.equal(pilotActorForRole('organiser', { people: [] }), null);
    assert.equal(pilotActorForRole('organiser', { people: [organiser, organiser] }), null);
    assert.equal(pilotActorForRole('organiser', { people: [{ ...organiser, role: 'member' }] }), null);
    assert.equal(pilotActorForRole('organiser', { people: [{ ...organiser, id: 'person-2' }] }), null);
    assert.equal(pilotActorForRole('member', state), null);
  });

  await t.test('the hosted Worker protects assets and persists new work across both organiser aliases', async () => {
    let snapshot = structuredClone(state);
    let assetRequests = 0;
    const pilotEnv = {
      ...env,
      PILOT_MODE: 'private',
      PILOT_ORGANISER_NAME: organiser.name,
      ASSETS: { fetch: async () => { assetRequests++; return new Response('Pilot assets'); } },
      PILOT_DB: {
        prepare(sql) {
          if (sql.startsWith('SELECT')) {
            return { first: async () => ({ revision: snapshot.revision, snapshot_json: JSON.stringify(snapshot), data_mode: 'private' }) };
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
    assert.equal((await call('/api/bootstrap', uninvitedToken)).status, 401);
    assert.equal(assetRequests, 0);
    const assets = await call('/', ownerToken);
    assert.equal(assets.status, 200);
    assert.equal(assets.headers.get('cache-control'), 'no-store');
    assert.equal(assets.headers.get('x-robots-tag'), 'noindex, nofollow');
    assert.equal((await call('/api/demo/session', ownerToken, { role: 'member' })).status, 404);
    const bootstrap = await (await call('/api/bootstrap', aliasToken)).json();
    assert.equal(bootstrap.mode, 'pilot');
    assert.deepEqual(bootstrap.actor, organiser);
    assert.deepEqual(bootstrap.people.map(person => person.id), [organiser.id]);
    for (const collection of ['projects', 'groups', 'memberships', 'contributions', 'decisions', 'constitutions']) {
      assert.deepEqual(bootstrap[collection], []);
    }
    assert.equal(bootstrap.public.sampleData, false);
    assert.equal(bootstrap.integrations.workspace, false);
    assert.equal((await (await call('/api/gamify', ownerToken)).json()).sampleData, false);

    const draft = { title: 'New working draft', scope: 'movement' };
    assert.equal((await command(uninvitedToken, 'constitution.create', draft)).status, 401);
    assert.equal((await command(ownerToken, 'constitution.create', draft)).status, 200);

    const group = { name: 'Local research group', place: 'Test neighbourhood', description: 'Organise local public evidence.' };
    assert.equal((await command(aliasToken, 'group.create', group)).status, 200);
    const groupId = snapshot.groups[0].id;
    const project = {
      groupId, title: 'First local research project', summary: 'Collect links to official reports.',
      theme: 'civic-evidence', urgency: 2, importance: 3, reason: 'Make the source material easier to review.',
      reviewDate: '2026-12-01',
    };
    assert.equal((await command(ownerToken, 'project.create', project)).status, 200);

    const reloaded = await (await call('/api/bootstrap', aliasToken)).json();
    assert.equal(reloaded.constitutions[0].title, draft.title);
    assert.equal(reloaded.constitutions[0].createdBy, organiser.id);
    assert.equal(reloaded.groups[0].name, group.name);
    assert.equal(reloaded.projects[0].title, project.title);
    assert.equal(reloaded.projects[0].groupId, groupId);
    assert.equal(reloaded.projects[0].ownerId, organiser.id);
  });
});
