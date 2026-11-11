import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPreviewApi } from '../preview/demo-api.mjs';
import { buildPages } from '../scripts/build-pages.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const now = () => new Date('2026-11-07T08:00:00Z');
const post = data => ({ method: 'POST', body: JSON.stringify(data) });
const role = (api, value) => api('/api/demo/session', post({ role: value }));
async function command(api, type, data, overrides = {}) {
  const state = await api('/api/bootstrap');
  return api('/api/commands', post({ id: crypto.randomUUID(), revision: state.revision, type, data, ...overrides }));
}

test('Pages demo begins with fictional verified samples and a public projection, without network calls', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Unexpected network access'); };
  try {
    const api = createPreviewApi({ now });
    const initial = await api('/api/bootstrap');
    assert.equal(initial.actor, null);
    assert.equal(initial.preview, true);
    assert.equal(initial.mode, 'demo');
    assert.deepEqual(initial.people, []);
    assert.deepEqual(initial.financialContributions, []);
    const board = await api('/api/gamify?period=year');
    assert.equal(board.totals.moneyCents, 10000);
    assert.equal(board.totals.hours, 1.5);
    assert.equal(board.money[0].name, 'Alex River');
    assert.equal(JSON.stringify(board).includes('FICTIONAL-PREVIEW-RECEIPT'), false);
    await assert.rejects(api('https://example.invalid/api/bootstrap'), { status: 404 });
    await assert.rejects(api('/api/export'), { status: 401 });
  } finally { globalThis.fetch = originalFetch; }
});

test('Pages visitors have independent volatile sessions and projections do not expose mutable state', async () => {
  const first = createPreviewApi({ now });
  const second = createPreviewApi({ now });
  await role(first, 'member');
  await role(second, 'member');
  await command(first, 'profile.update', { name: 'Fictional Preview Visitor' });
  assert.equal((await first('/api/bootstrap')).actor.name, 'Fictional Preview Visitor');
  const isolated = await second('/api/bootstrap');
  assert.equal(isolated.actor.name, 'Alex River');
  isolated.people[0].name = 'External mutation';
  assert.equal((await second('/api/bootstrap')).actor.name, 'Alex River');
  const reloaded = createPreviewApi({ now });
  assert.equal((await reloaded('/api/gamify')).money[0].name, 'Alex River');
});

test('Pages commands retain independent review, revision and permission rules', async () => {
  const api = createPreviewApi({ now });
  await role(api, 'member');
  await command(api, 'financial.log', { projectId: 'project-1', date: '2026-11-07', amountCents: 5000, category: 'donation', reference: 'FICTIONAL-SECOND-RECEIPT', description: 'Fictional review only.', publicConsent: false, namedConsent: true });
  let state = await api('/api/bootstrap');
  const receipt = state.financialContributions.find(item => item.reference === 'FICTIONAL-SECOND-RECEIPT');
  await assert.rejects(command(api, 'financial.review', { contributionId: receipt.id, status: 'verified', reason: 'Cannot self verify', settled: true }), { status: 403 });
  await assert.rejects(command(api, 'profile.update', { name: 'Stale' }, { revision: state.revision - 1 }), { status: 409 });
  await role(api, 'organiser');
  await command(api, 'financial.review', { contributionId: receipt.id, status: 'verified', reason: 'Fictional independent review', settled: true });
  assert.equal((await api('/api/gamify')).totals.moneyCents, 15000);
  await role(api, 'member');
  await command(api, 'financial.sharing', { contributionId: receipt.id, publicConsent: false, namedConsent: false });
  assert.equal((await api('/api/gamify')).totals.moneyCents, 10000);
  await role(api, 'public');
  await assert.rejects(command(api, 'profile.update', { name: 'Anonymous' }), { status: 401 });
});

test('Pages build contains only reviewed static and pure-domain files and leaves production source intact', async () => {
  const originals = await Promise.all(['public/app.mjs', 'src/worker.mjs'].map(name => readFile(path.join(root, name))));
  const built = await buildPages();
  const names = [];
  async function walk(directory, prefix = '') {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const name = `${prefix}${item.name}`;
      if (item.isDirectory()) await walk(path.join(directory, item.name), `${name}/`);
      else names.push(name);
    }
  }
  await walk(built.directory);
  assert.equal(names.length, 29);
  for (const name of [
    'constitution-trial.mjs', 'constitution-trial-model.mjs', 'constitution-trial.css',
    'artwork/campaign-command-centre.png', 'artwork/connected-ideas-icons.png', 'artwork/aura-genesis-geode.png',
    'artwork/p4a-membership.png',
  ]) {
    assert.ok(names.includes(name), `Preview must include ${name}`);
  }
  assert.equal(names.some(name => /\.local|\.env|workspace-store|worker\.mjs|auth\.mjs|http\.mjs|state\.json|connection\.json/.test(name)), false);
  assert.deepEqual(names.filter(name => name.startsWith('demo-domain/')).sort(), ['constitution-seed.mjs', 'domain.mjs', 'errors.mjs', 'gamify.mjs', 'seed.mjs'].map(name => `demo-domain/${name}`).sort());
  const html = await readFile(path.join(built.directory, 'index.html'), 'utf8');
  const app = await readFile(path.join(built.directory, 'app.mjs'), 'utf8');
  const css = await readFile(path.join(built.directory, 'civic-icons.css'), 'utf8');
  const adapter = await readFile(path.join(built.directory, 'demo-api.mjs'), 'utf8');
  assert.match(html, /connect-src &#39;none&#39;/);
  assert.match(html, /<link rel="icon" href="\.\/artwork\/p4a-membership\.png"/);
  assert.equal(/(?:src|href)="\/(?!\/)/.test(html), false);
  assert.equal(/url\(['"]?\/(?!\/)/.test(css), false);
  assert.match(app, /PUBLIC INTERACTIVE PREVIEW/);
  assert.match(app, /Changes last only until this page reloads/);
  assert.match(app, /return demoApi\(path, options\)/);
  assert.equal(/fetch\(/.test(app), false);
  assert.equal(/localStorage|sessionStorage|document\.cookie|\bfetch\(/.test(adapter), false);
  assert.match(adapter, /from '\.\/demo-domain\/domain\.mjs'/);
  const unchanged = await Promise.all(['public/app.mjs', 'src/worker.mjs'].map(name => readFile(path.join(root, name))));
  assert.deepEqual(unchanged, originals);
});
