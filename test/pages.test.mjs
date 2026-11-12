import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPreviewApi } from '../preview/demo-api.mjs';
import { applicationPreviewHtml, buildPages } from '../scripts/build-pages.mjs';

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
  const sourceNames = ['public/app.mjs', 'src/worker.mjs', 'application-public/application.html', 'application-public/guide.html', 'application-public/styles.css', 'application-public/index.html'];
  const originals = await Promise.all(sourceNames.map(name => readFile(path.join(root, name))));
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
  assert.equal(names.length, 37);
  assert.equal(built.files, names.length);
  for (const name of [
    'constitution-trial.mjs', 'constitution-trial-model.mjs', 'constitution-trial.css', 'jra-values.mjs', 'onboarding.mjs',
    'artwork/campaign-command-centre.png', 'artwork/connected-ideas-icons.png', 'artwork/aura-genesis-geode.png',
    'artwork/p4a-membership.png', 'artwork/p4a-membership-mark.png',
  ]) {
    assert.ok(names.includes(name), `Preview must include ${name}`);
  }
  assert.equal(names.some(name => /\.local|\.env|workspace-store|worker\.mjs|auth\.mjs|http\.mjs|state\.json|connection\.json|application-(?:intake|store|review)|migrations\//.test(name)), false);
  assert.equal(names.some(name => /^civic-(?:training|office-training|volunteering-training)/.test(name)), false);
  assert.deepEqual(names.filter(name => name.startsWith('apply/')).sort(), ['apply/application.html', 'apply/guide.html', 'apply/index.html', 'apply/styles.css']);
  assert.deepEqual(names.filter(name => name.startsWith('demo-domain/')).sort(), ['constitution-seed.mjs', 'domain.mjs', 'errors.mjs', 'gamify.mjs', 'onboarding.mjs', 'seed.mjs'].map(name => `demo-domain/${name}`).sort());
  const html = await readFile(path.join(built.directory, 'index.html'), 'utf8');
  const app = await readFile(path.join(built.directory, 'app.mjs'), 'utf8');
  const css = await readFile(path.join(built.directory, 'civic-icons.css'), 'utf8');
  const adapter = await readFile(path.join(built.directory, 'demo-api.mjs'), 'utf8');
  assert.match(html, /connect-src &#39;none&#39;/);
  assert.match(html, /<link rel="icon" href="\.\/artwork\/p4a-membership-mark\.png" type="image\/png" sizes="128x128"/);
  assert.equal(/(?:src|href)="\/(?!\/)/.test(html), false);
  assert.equal(/url\(['"]?\/(?!\/)/.test(css), false);
  assert.match(app, /PUBLIC INTERACTIVE PREVIEW/);
  assert.match(app, /Changes last only until this page reloads/);
  assert.match(app, /return demoApi\(path, options\)/);
  assert.equal(/fetch\(/.test(app), false);
  assert.equal(/localStorage|sessionStorage|document\.cookie|\bfetch\(/.test(adapter), false);
  assert.match(adapter, /from '\.\/demo-domain\/domain\.mjs'/);
  const application = await readFile(path.join(built.directory, 'apply/application.html'), 'utf8');
  const guide = await readFile(path.join(built.directory, 'apply/guide.html'), 'utf8');
  const landing = await readFile(path.join(built.directory, 'apply/index.html'), 'utf8');
  const applicationCss = await readFile(path.join(built.directory, 'apply/styles.css'), 'utf8');
  assert.equal(landing, guide, 'The landing page serves the guide directly, without a redirect or source-folder alias');
  assert.equal(landing, applicationPreviewHtml(originals[3].toString(), 'guide.html'));
  for (const page of [application, guide]) {
    assert.match(page, /<aside class="notice application-preview-notice" id="application-preview-notice" role="note"><strong>APPLICATION AND GUIDE PREVIEW<\/strong>/);
    assert.match(page, /cannot submit an application or take a payment/);
    assert.match(page, /Nothing you type is sent or saved by P4A/);
    assert.match(page, /<link rel="stylesheet" href="\.\/styles\.css">/);
    assert.match(page, /href="\.\.\/">Return to the civic workspace preview/);
    for (const directive of ['script-src', 'connect-src', 'form-action', 'object-src', 'base-uri', 'frame-src']) assert.match(page, new RegExp(`${directive} &#39;none&#39;`));
    assert.equal((page.match(/http-equiv="Content-Security-Policy"/g) || []).length, 1);
    assert.equal(/<(?:script|iframe|object|embed|base)\b|\s(?:on[a-z]+|formaction)\s*=/i.test(page), false);
    assert.equal(/(?:href|src)="\/(?!\/)/.test(page), false);
    assert.match(page, /<header class="site-header" id="top"(?: tabindex="-1")?>/);
    const footer = page.match(/<footer class="page-footer">[\s\S]*?<\/footer>/)?.[0];
    assert.ok(footer, 'Each page keeps its footer navigation');
    assert.match(footer, /<nav class="page-footer-nav" aria-label="[^"]+">/);
    assert.doesNotMatch(footer, /class="back-to-top"/);
    const backToTop = page.match(/<a class="back-to-top" href="#top" aria-label="Back to top">[\s\S]*?<\/a>/)?.[0];
    assert.ok(backToTop, 'Each page keeps an accessible back-to-top link');
    assert.match(backToTop, /↑/);
    assert.ok(page.indexOf('class="back-to-top"') > page.indexOf('</footer>'), 'The back-to-top control is separate from footer navigation');
    for (const [, target] of page.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(?:https:\/\/|#)/.test(target)) continue;
      const resolved = path.resolve(built.directory, 'apply', target.split(/[?#]/)[0]);
      assert.ok(resolved === built.directory || resolved.startsWith(`${built.directory}${path.sep}`), `Preview link escapes the publication: ${target}`);
      const relative = path.relative(built.directory, resolved).replaceAll(path.sep, '/');
      assert.ok(!relative || names.includes(relative), `Missing relative preview asset: ${target}`);
    }
  }
  assert.match(application, /<form aria-describedby="application-preview-notice" autocomplete="off">/);
  assert.match(application, /<button class="button" type="submit" disabled aria-describedby="application-preview-notice">Submission unavailable in preview<\/button>/);
  assert.doesNotMatch(application, /Anyone can submit this form/);
  assert.equal((application.match(/<button\b/g) || []).length, 1);
  assert.equal(/<form\b[^>]*\b(?:action|method)\s*=|<(?:input|select|textarea)\b[^>]*\bname\s*=/i.test(application), false);
  for (const id of ['name', 'email', 'contact-phone', 'jurisdiction', 'local-area', 'electoral-enrolment', 'membership-intent', 'suggested-games']) {
    const control = application.match(new RegExp(`<(?:input|select|textarea)\\b[^>]*id="${id}"[^>]*>`))?.[0];
    assert.ok(control, `Preview keeps the ${id} field available to explore`);
    assert.doesNotMatch(control, /\sdisabled(?:\s|>)/);
  }
  assert.equal(/<(?:form|input|select|textarea|button)\b/i.test(guide), false);
  assert.match(guide, /href="\.\/application\.html(?:#form-title)?"/);
  assert.doesNotMatch(guide, /href="\.\/index\.html#form-title"/);
  assert.match(application, /href="\.\/guide\.html"/);
  const applicationFooter = application.match(/<footer class="page-footer">[\s\S]*?<\/footer>/)[0];
  const guideFooter = guide.match(/<footer class="page-footer">[\s\S]*?<\/footer>/)[0];
  assert.match(applicationFooter, /<a class="page-footer-link" href="\.\/guide\.html"(?: [^>]*)?>/);
  assert.match(guideFooter, /<a class="page-footer-link" href="\.\/application\.html(?:#form-title)?"(?: [^>]*)?>/);
  assert.match(guideFooter, /href="https:\/\/p4a\.xyz\/"/);
  assert.match(applicationCss, /\.application-preview-notice\s*\{/);
  assert.match(applicationCss, /\.button:disabled\s*\{/);
  assert.equal(/url\(['"]?\/|@import\b/.test(applicationCss), false);
  assert.match(originals[2].toString(), /<form method="post" action="\.\/apply">/);
  assert.match(originals[2].toString(), /<button class="button" type="submit">Submit application<\/button>/);
  const unchanged = await Promise.all(sourceNames.map(name => readFile(path.join(root, name))));
  assert.deepEqual(unchanged, originals);
});

test('Application preview refuses changed live-form anchors and newly executable content', async () => {
  const html = await readFile(path.join(root, 'application-public/application.html'), 'utf8');
  for (const [description, changed] of [
    ['changed submission URL', html.replace('action="./apply"', 'action="https://example.invalid/apply"')],
    ['changed submit control', html.replace('type="submit">Submit application', 'type="submit">Send application')],
    ['second form', html.replace('</body>', '<form action="./apply"></form></body>')],
    ['extra button', html.replace('</form>', '<button>Send</button></form>')],
    ['image submit', html.replace('</form>', '<input type="image" src="./submit.png"></form>')],
    ['unreviewed named field syntax', html.replace('</form>', '<input name=unreviewed></form>')],
    ['script', html.replace('</body>', '<script src="./collect.mjs"></script></body>')],
    ['inline handler', html.replace('id="name"', 'id="name" oninput="send(this.value)"')],
    ['submit override', html.replace('type="submit"', 'type="submit" formaction="./apply"')],
    ['refresh redirect', html.replace('</head>', '<meta http-equiv="refresh" content="0;url=./apply"></head>')],
    ['embedded page', html.replace('</body>', '<iframe src="./apply"></iframe></body>')],
  ]) assert.throws(() => applicationPreviewHtml(changed, 'application.html'), /preview|Pages build/i, description);
  assert.throws(() => applicationPreviewHtml(html, 'guide.html'), /read-only/);
  assert.throws(() => applicationPreviewHtml(html, 'index.html'), /Unexpected/, 'The source index alias is not a form build input');
  assert.throws(() => applicationPreviewHtml(html, '../index.html'), /Unexpected/);
});
