import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import worker from '../src/application-intake.mjs';
import { APPLICATION_POLICY_VERSION, validateApplication, submitApplication, listApplications, updateApplicationStatus } from '../src/application-store.mjs';

const when = new Date('2026-11-12T06:00:00Z');
const actor = { id: 'verified-reviewer-subject', role: 'organiser' };
const fields = { name: 'Example Applicant', email: 'EXAMPLE@example.invalid', jurisdiction: 'QLD', contactPhone: '0412 345 678', localArea: 'Example neighbourhood', electoralEnrolment: 'unsure', membershipIntent: 'Research and community gardening', suggestedGames: 'Cooperative puzzle', declaration: 'yes', consent: 'yes', policyVersion: APPLICATION_POLICY_VERSION };
const html = '<section id="application-entry" aria-labelledby="application-title">Form</section><section id="application-success" hidden>Received</section>';
const result = changes => ({ success: true, meta: { changes } });

// Isolated D1 contract double: batches commit together or restore all changes.
function databaseDouble() {
  const db = { rows: [], audit: [], failAudit: false, calls: [] };
  function execute(statement) {
    const { sql, values: v } = statement;
    if (sql.startsWith('INSERT INTO applications')) {
      assert.match(sql, /contact_phone, local_area, electoral_enrolment, membership_intent/);
      if (db.rows.some(row => row.email === v[2])) return result(0);
      db.rows.push({ id: v[0], name: v[1], email: v[2], jurisdiction: v[3], policyVersion: v[4], suggestedGames: v[5], contactPhone: v[6], localArea: v[7], electoralEnrolment: v[8], membershipIntent: v[9], status: 'received', submittedAt: v[10], updatedAt: v[10] });
      return result(1);
    }
    if (sql.startsWith('UPDATE applications')) {
      const row = db.rows.find(row => row.id === v[3] && row.status === v[4]);
      if (!row) return result(0);
      Object.assign(row, { status: v[0], updatedAt: v[1], lastTransitionId: v[2] });
      return result(1);
    }
    if (sql.startsWith('INSERT INTO application_audit')) {
      if (db.failAudit) throw new Error('Simulated private database error');
      if (!db.rows.some(row => row.id === v[6] && row.lastTransitionId === v[0])) return result(0);
      db.audit.push({ id: v[0], applicationId: v[6], fromStatus: v[1], toStatus: v[2], reason: v[3], actorId: v[4], createdAt: v[5] });
      return result(1);
    }
    throw new Error(`Unexpected test statement: ${sql}`);
  }
  db.prepare = sql => {
    const statement = { sql: sql.trim(), values: [], bind(...values) { this.values = values; return this; },
      async run() { db.calls.push(this); return execute(this); },
      async all() {
        db.calls.push(this);
        assert.match(this.sql, /ORDER BY submitted_at ASC, id ASC LIMIT/);
        for (const [column, field] of [['contact_phone', 'contactPhone'], ['local_area', 'localArea'], ['electoral_enrolment', 'electoralEnrolment'], ['membership_intent', 'membershipIntent']]) assert.ok(this.sql.includes(`${column} AS ${field}`));
        let rows = db.rows;
        if (this.sql.includes('WHERE status = ?1')) rows = rows.filter(row => row.status === this.values[0]);
        else if (this.sql.includes("WHERE status <> 'closed'")) rows = rows.filter(row => row.status !== 'closed');
        return { success: true, results: structuredClone(rows).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt) || a.id.localeCompare(b.id)).slice(0, this.values.at(-1)).map(({ lastTransitionId, ...row }) => row) };
      },
    };
    return statement;
  };
  db.batch = async statements => {
    const before = structuredClone({ rows: db.rows, audit: db.audit });
    try { db.calls.push(...statements); return statements.map(execute); }
    catch (error) { db.rows = before.rows; db.audit = before.audit; throw error; }
  };
  return db;
}
function envFor(database = databaseDouble()) {
  return { APPLICATIONS: database, APPLY_RATE_LIMIT: { limit: async () => ({ success: true }) }, ASSETS: { fetch: async () => new Response(html, { headers: { 'Content-Type': 'text/html', ETag: 'old-page' } }) } };
}
function post(values = fields, headers = {}, body) {
  return new Request('https://join.example.test/apply', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: 'https://join.example.test', 'CF-Connecting-IP': '192.0.2.1', ...headers }, body: body ?? new URLSearchParams(values).toString() });
}

test('public submissions and duplicates have the same receipt and store only minimum private fields', async () => {
  const env = envFor();
  const first = await worker.fetch(post({ ...fields, extraIdentityDocument: 'do not save', suggestedGames: 'Cooperative puzzle\r\n  Team storytelling  ' }), env);
  const duplicate = await worker.fetch(post({ ...fields, email: 'example@EXAMPLE.invalid', name: 'Replacement name', contactPhone: '+61 7 1234 5678', localArea: 'Other place', electoralEnrolment: 'enrolled', membershipIntent: 'Do not overwrite', suggestedGames: 'Do not overwrite' }), env);
  for (const response of [first, duplicate]) {
    assert.equal(response.status, 303);
    assert.equal(response.headers.get('Location'), '/application.html?submitted=1');
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(await response.text(), '');
  }
  assert.equal(env.APPLICATIONS.rows.length, 1);
  const record = env.APPLICATIONS.rows[0];
  assert.equal(record.email, 'example@example.invalid');
  assert.equal(record.jurisdiction, 'qld');
  assert.equal(record.name, fields.name);
  assert.equal(record.suggestedGames, 'Cooperative puzzle\nTeam storytelling');
  assert.equal(record.policyVersion, 'p4a-application-2026-11-12-v6');
  for (const field of ['contactPhone', 'localArea', 'electoralEnrolment', 'membershipIntent']) assert.equal(record[field], fields[field]);
  assert.equal(record.status, 'received');
  assert.match(record.id, /^[\da-f-]{36}$/);
  assert.match(record.submittedAt, /^\d{4}-\d\d-\d\dT.*Z$/);
  assert.equal(JSON.stringify(record).includes('do not save'), false);
  assert.equal(JSON.stringify(record).includes('192.0.2.1'), false);
});

test('validation handles current notice, consent, bounded names/emails and all jurisdiction aliases', async () => {
  for (const jurisdiction of ['ACT', 'nsw', 'NT', 'qld', 'SA', 'tas', 'VIC', 'wa', 'outside', 'overseas']) {
    assert.equal(validateApplication({ ...fields, jurisdiction }).jurisdiction, jurisdiction === 'overseas' ? 'outside' : jurisdiction.toLowerCase());
  }
  for (const invalid of [{ name: '' }, { name: 'x'.repeat(121) }, { name: 'Name\u0000' }, { email: 'invalid' }, { email: 'x'.repeat(255) }, { jurisdiction: 'unknown' }, { consent: 'on' }, { consent: '' }, { policyVersion: 'p4a-application-2026-11-12' }, { policyVersion: 'p4a-application-2026-11-12-v3' }, { policyVersion: 'p4a-application-2026-11-12-v4' }, { policyVersion: 'p4a-application-2026-11-12-v5' }]) {
    const env = envFor();
    const response = await worker.fetch(post({ ...fields, ...invalid }), env);
    assert.equal(response.status, 400);
    assert.equal(env.APPLICATIONS.rows.length, 0);
    assert.equal((await response.text()).includes(fields.email), false);
  }
});

test('phone, local area, enrolment and application declaration are required and must occur once', async () => {
  for (const contactPhone of ['0412 345 678', '(07) 1234 5678', '+61 412 345 678', '+1 (212) 555-0123', '020.1234.5678']) assert.equal(validateApplication({ ...fields, contactPhone }).contactPhone, contactPhone);
  for (const electoralEnrolment of ['enrolled', 'not-enrolled', 'unsure']) assert.equal(validateApplication({ ...fields, electoralEnrolment }).electoralEnrolment, electoralEnrolment);
  assert.equal(validateApplication({ ...fields, localArea: '  Example place  ' }).localArea, 'Example place');
  assert.equal(validateApplication({ ...fields, localArea: 'x'.repeat(120) }).localArea.length, 120);
  for (const key of ['contactPhone', 'localArea', 'electoralEnrolment', 'declaration']) {
    const omitted = { ...fields }; delete omitted[key];
    assert.throws(() => validateApplication(omitted), { status: 400 });
    const env = envFor();
    assert.equal((await worker.fetch(post(omitted), env)).status, 400);
    assert.equal((await worker.fetch(post({ ...fields, [key]: '' }), env)).status, 400);
    assert.equal((await worker.fetch(post(fields, {}, `${new URLSearchParams(fields)}&${key}=${encodeURIComponent(fields[key])}`), env)).status, 400);
    assert.equal(env.APPLICATIONS.rows.length, 0);
  }
  for (const invalid of [{ contactPhone: 'phone me' }, { contactPhone: '123' }, { contactPhone: '+1'.repeat(8) }, { contactPhone: '(07 1234 5678' }, { contactPhone: '1'.repeat(16) }, { contactPhone: '0 '.repeat(17) }, { localArea: 'x'.repeat(121) }, { localArea: 'Place\nElsewhere' }, { localArea: 'Place\u0000' }, { localArea: 'Place\u2028Elsewhere' }, { electoralEnrolment: 'verified' }, { declaration: 'on' }, { declaration: true }]) {
    assert.throws(() => validateApplication({ ...fields, ...invalid }), { status: 400 });
    const env = envFor();
    const response = await worker.fetch(post({ ...fields, ...invalid }), env);
    assert.equal(response.status, 400);
    assert.equal(env.APPLICATIONS.rows.length, 0);
    assert.equal((await response.text()).includes(fields.email), false);
  }
});

test('skills or areas of work are optional plain multiline text, limited to 600 characters', async () => {
  const omitted = { ...fields }; delete omitted.membershipIntent;
  assert.equal(validateApplication(omitted).membershipIntent, '');
  for (const membershipIntent of ['', '  ', '\r\n\t']) assert.equal(validateApplication({ ...fields, membershipIntent }).membershipIntent, '');
  assert.equal(validateApplication({ ...fields, membershipIntent: '  Research\r\n\r\n  Community\tgardening  ' }).membershipIntent, 'Research\n\nCommunity gardening');
  assert.equal(validateApplication({ ...fields, membershipIntent: 'x'.repeat(600) }).membershipIntent.length, 600);
  for (const membershipIntent of ['x'.repeat(601), 'Work\u0000', 'Work\u000b', null, []]) assert.throws(() => validateApplication({ ...fields, membershipIntent }), { status: 400 });
  const env = envFor();
  assert.equal((await worker.fetch(post(fields, {}, `${new URLSearchParams(fields)}&membershipIntent=Other`), env)).status, 400);
  assert.equal(env.APPLICATIONS.rows.length, 0);
  assert.equal((await worker.fetch(post(omitted), env)).status, 303);
  assert.equal(env.APPLICATIONS.rows[0].membershipIntent, '');
});

test('at least one game is required, with clean lines, bounded text and no repeated form field', async () => {
  assert.equal(validateApplication(fields).suggestedGames, 'Cooperative puzzle');
  assert.equal(validateApplication({ ...fields, suggestedGames: '\r\n  Puzzle  \r\n\rTeam\tstory \n' }).suggestedGames, 'Puzzle\nTeam story');
  assert.equal(validateApplication({ ...fields, suggestedGames: 'x'.repeat(400) }).suggestedGames.length, 400);
  for (const suggestedGames of [undefined, '', '   ', '\r\n\t \n', 'x'.repeat(401), 'Game\u0000', 'Game\u000b', null, []]) {
    assert.throws(() => validateApplication({ ...fields, suggestedGames }), { status: 400 });
  }
  const env = envFor();
  assert.equal((await worker.fetch(post(fields, {}, `${new URLSearchParams(fields)}&suggestedGames=Other`), env)).status, 400);
  assert.equal((await worker.fetch(post(fields, {}, `${new URLSearchParams(fields)}&email=other%40example.invalid`), env)).status, 400);
  assert.equal(env.APPLICATIONS.rows.length, 0);
  const withoutGames = { ...fields };
  delete withoutGames.suggestedGames;
  assert.throws(() => validateApplication(withoutGames), { status: 400 });
  assert.equal((await worker.fetch(post(withoutGames), env)).status, 400);
  for (const suggestedGames of ['', '   ', '\r\n\t \n']) {
    assert.equal((await worker.fetch(post({ ...fields, suggestedGames }), env)).status, 400);
  }
  assert.equal(env.APPLICATIONS.rows.length, 0, 'missing or blank games cannot create an application');
});

test('request boundary enforces origin, form format and actual body size even with a false length', async () => {
  const env = envFor();
  for (const origin of ['', 'null', 'https://elsewhere.test']) assert.equal((await worker.fetch(post(fields, { Origin: origin }), env)).status, 403);
  assert.equal((await worker.fetch(post(fields, { 'sec-fetch-site': 'cross-site' }), env)).status, 403);
  assert.equal((await worker.fetch(post(fields, { 'Content-Type': 'application/json' }), env)).status, 415);
  assert.equal((await worker.fetch(post(fields, { 'Content-Length': '16385' }), env)).status, 413);
  assert.equal((await worker.fetch(post(fields, { 'Content-Length': '0' }, 'x'.repeat(16385)), env)).status, 413);
  assert.equal((await worker.fetch(new Request('https://join.example.test/apply'), env)).status, 405);
  assert.equal((await worker.fetch(new Request('https://join.example.test/elsewhere', { method: 'POST' }), env)).status, 405);
  assert.equal(env.APPLICATIONS.rows.length, 0);
});

test('the 16 KiB boundary permits fully URL-encoded non-ASCII details within every field limit', async () => {
  const env = envFor();
  const unicode = { ...fields, name: '界'.repeat(120), localArea: '區'.repeat(120), membershipIntent: '學'.repeat(600), suggestedGames: '棋'.repeat(400) };
  const body = new URLSearchParams(unicode).toString();
  assert.ok(new TextEncoder().encode(body).length > 6144);
  assert.ok(new TextEncoder().encode(body).length < 16384);
  const response = await worker.fetch(post(unicode), env);
  assert.equal(response.status, 303);
  assert.equal(await response.text(), '');
  assert.equal(env.APPLICATIONS.rows[0].membershipIntent, unicode.membershipIntent);
  assert.equal(env.APPLICATIONS.rows[0].localArea, unicode.localArea);
});

test('rate limiting and storage fail closed without private error details', async () => {
  for (const binding of [undefined, {}, { limit: async () => ({}) }, { limit: async () => { throw new Error('secret configuration'); } }]) {
    const env = { ...envFor(), APPLY_RATE_LIMIT: binding };
    const response = await worker.fetch(post(), env);
    assert.equal(response.status, 503);
    assert.equal((await response.text()).includes('secret'), false);
    assert.equal(env.APPLICATIONS.rows.length, 0);
  }
  const limited = await worker.fetch(post(), { ...envFor(), APPLY_RATE_LIMIT: { limit: async () => ({ success: false }) } });
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('Retry-After'), '60');
  assert.equal((await worker.fetch(post(fields, { 'CF-Connecting-IP': '' }), envFor())).status, 503);
  assert.equal((await worker.fetch(post(), { ...envFor(), APPLICATIONS: undefined })).status, 503);
  const unavailable = { ...envFor(), APPLICATIONS: { prepare() { throw new Error('private SQL and contact data'); } } };
  const response = await worker.fetch(post(), unavailable);
  assert.equal(response.status, 503);
  assert.equal((await response.text()).includes('private SQL'), false);
});

test('the membership entrance opens the guide first and the form remains a separate page', async () => {
  const env = {
    ...envFor(),
    ASSETS: { fetch: request => new Response(new URL(request.url).pathname === '/guide.html' ? '<h1>Membership guide</h1>' : html, {
      headers: { 'Content-Type': 'text/html' },
    }) },
  };
  for (const route of ['/', '/index.html', '/guide.html']) {
    const response = await worker.fetch(new Request(`https://join.example.test${route}`), env);
    assert.equal(await response.text(), '<h1>Membership guide</h1>');
  }
  assert.equal(await (await worker.fetch(new Request('https://join.example.test/application.html'), env)).text(), html);
});

test('GET success changes fixed markers only and never exposes private records or user input', async () => {
  const env = envFor();
  const original = await worker.fetch(new Request('https://join.example.test/application.html'), env);
  assert.equal(await original.text(), html);
  const success = await worker.fetch(new Request('https://join.example.test/application.html?submitted=1&name=PRIVATE'), env);
  const body = await success.text();
  assert.match(body, /id="application-entry" hidden/);
  assert.match(body, /<section id="application-success">/);
  assert.equal(body.includes('PRIVATE'), false);
  assert.equal(success.headers.get('ETag'), null);
  assert.equal(success.headers.get('Cache-Control'), 'no-store');
  assert.match(success.headers.get('Content-Security-Policy'), /form-action 'self'/);
  assert.equal((await worker.fetch(new Request('https://join.example.test/', { method: 'HEAD' }), env)).body, null);
  assert.equal(env.APPLICATIONS.calls.length, 0);
});

test('private list requires organiser access, is bounded, hides closed cases by default and returns games privately', async () => {
  const db = databaseDouble();
  await submitApplication(db, { ...fields, suggestedGames: 'Team puzzle' }, when);
  const firstId = db.rows[0].id;
  await submitApplication(db, { ...fields, email: 'second@example.invalid' }, new Date(when.valueOf() + 1000));
  await updateApplicationStatus(db, actor, { id: firstId, expectedStatus: 'received', status: 'closed', reason: 'Applicant requested closure.' }, when);
  for (const invalid of [null, { role: 'member', id: 'member' }, { role: 'organiser' }]) await assert.rejects(listApplications(db, invalid), { status: 403 });
  for (const limit of [0, 101, 1.5, '10']) await assert.rejects(listApplications(db, actor, { limit }), { status: 400 });
  assert.equal((await listApplications(db, actor)).length, 1);
  const all = await listApplications(db, actor, { includeClosed: true });
  assert.equal(all[0].id, firstId);
  assert.equal(all[0].suggestedGames, 'Team puzzle');
  for (const field of ['contactPhone', 'localArea', 'electoralEnrolment', 'membershipIntent']) assert.equal(all[0][field], fields[field]);
  assert.equal(all[0].submittedAt, when.toISOString());
  assert.equal(Object.hasOwn(all[0], 'lastTransitionId'), false);
  assert.equal((await listApplications(db, actor, { status: 'closed' })).length, 1);
  assert.equal((await listApplications(db, actor, { includeClosed: true, limit: 1 })).length, 1);
  await assert.rejects(listApplications(db, actor, { status: 'accepted' }), { status: 400 });
});

test('private status transitions are guarded, reasoned, audited and atomic without granting membership', async () => {
  const db = databaseDouble();
  await submitApplication(db, fields, when);
  const id = db.rows[0].id;
  const change = { id, expectedStatus: 'received', status: 'contacted', reason: '  Follow-up arranged.  ' };
  await assert.rejects(updateApplicationStatus(db, { id: 'applicant', role: 'member' }, change), { status: 403 });
  for (const status of ['accepted', 'verified', 'verification-pending', 'received']) await assert.rejects(updateApplicationStatus(db, actor, { ...change, status }), { status: 400 });
  for (const reason of ['', ' ', 'x'.repeat(501), null]) await assert.rejects(updateApplicationStatus(db, actor, { ...change, reason }), { status: 400 });
  const outcomes = await Promise.allSettled([updateApplicationStatus(db, actor, change, when), updateApplicationStatus(db, actor, change, when)]);
  assert.equal(outcomes.filter(item => item.status === 'fulfilled').length, 1);
  assert.equal(outcomes.find(item => item.status === 'rejected').reason.status, 409);
  assert.equal(db.audit.length, 1);
  assert.equal(db.audit[0].actorId, actor.id);
  assert.equal(db.audit[0].reason, 'Follow-up arranged.');
  const next = { id, expectedStatus: 'contacted', status: 'verification-pending', reason: 'Further checks still required.' };
  db.failAudit = true;
  await assert.rejects(updateApplicationStatus(db, actor, next));
  assert.equal(db.rows[0].status, 'contacted');
  assert.equal(db.audit.length, 1);
  db.failAudit = false;
  await updateApplicationStatus(db, actor, next, when);
  await updateApplicationStatus(db, actor, { id, expectedStatus: 'verification-pending', status: 'closed', reason: 'Closed on request.' }, when);
  assert.equal(db.audit.length, 3);
  await assert.rejects(updateApplicationStatus(db, actor, { id, expectedStatus: 'closed', status: 'received', reason: 'Reopen' }), { status: 400 });
});

test('forward migration defaults old game answers without changing notice versions or duplicate records', async () => {
  const migration = await readFile(new URL('../migrations/applications/0002_suggested_games.sql', import.meta.url), 'utf8');
  assert.match(migration, /ALTER TABLE applications ADD COLUMN suggested_games TEXT NOT NULL DEFAULT ''/);
  assert.equal(/UPDATE\s+applications|DROP\s|DELETE\s/i.test(migration), false);
  const db = databaseDouble();
  await submitApplication(db, fields, when);
  db.rows[0].policyVersion = 'p4a-application-2026-11-12';
  db.rows[0].suggestedGames = '';
  const old = structuredClone(db.rows[0]);
  assert.deepEqual(await submitApplication(db, { ...fields, suggestedGames: 'New game' }, when), { received: true });
  assert.deepEqual(db.rows[0], old, 'anonymous repeats cannot overwrite a previous notice or answer');
  assert.equal(db.rows[0].suggestedGames, '', 'the required game rule does not backfill older applications');
});

test('details migration defaults legacy fields without rewriting data, notice or declaration history', async () => {
  const migration = await readFile(new URL('../migrations/applications/0003_application_details.sql', import.meta.url), 'utf8');
  for (const column of ['contact_phone', 'local_area', 'electoral_enrolment', 'membership_intent']) assert.ok(migration.includes(`ADD COLUMN ${column} TEXT NOT NULL DEFAULT ''`));
  assert.equal(/UPDATE\s+applications|DROP\s|DELETE\s/i.test(migration), false);
  const db = databaseDouble();
  await submitApplication(db, fields, when);
  Object.assign(db.rows[0], { policyVersion: 'p4a-application-2026-11-12-v4', contactPhone: '', localArea: '', electoralEnrolment: '', membershipIntent: '' });
  const old = structuredClone(db.rows[0]);
  assert.deepEqual(await submitApplication(db, fields, when), { received: true });
  assert.deepEqual(db.rows[0], old, 'an anonymous repeat does not backfill personal details or v5 consent');
  const [listed] = await listApplications(db, actor);
  assert.equal(listed.policyVersion, 'p4a-application-2026-11-12-v4');
  for (const field of ['contactPhone', 'localArea', 'electoralEnrolment', 'membershipIntent']) assert.equal(listed[field], '');
  assert.equal(Object.hasOwn(listed, 'declaration'), false);
});
