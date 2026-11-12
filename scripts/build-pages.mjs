import { readFile, writeFile, mkdir, copyFile, readdir, lstat, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const output = path.join(root, 'dist');
const publicFiles = [
  'index.html', 'app.mjs', 'styles.css', 'civic-icons.css', 'civic-icons.mjs',
  'constitution.mjs', 'gamify.mjs', 'gamify.css', 'local-nodes.mjs', 'scroll-memory.mjs', 'jra-values.mjs', 'onboarding.mjs',
  'constitution-trial.mjs', 'constitution-trial-model.mjs', 'constitution-trial.css',
  'electorate-finance.mjs', 'electorate-finance.css', 'electorate-budget.mjs', 'electorate-merch.mjs', 'electorate-referendum.mjs',
  'membership-quick.mjs', 'merch-quick.mjs',
  'electoral-readiness-data.mjs', 'electoral-funding-data.mjs', 'electoral-funding.mjs',
  'finance-federal-data.mjs', 'finance-state-enrolments.mjs', 'finance-state-demographics.mjs',
  'favicon.svg', 'robots.txt', 'LICENCE.md',
  'artwork/p4a-civic-icons-v1.png', 'artwork/gamify-democracy.svg', 'artwork/campaign-command-centre.png',
  'artwork/connected-ideas-icons.png', 'artwork/aura-genesis-geode.png', 'artwork/p4a-membership.png',
  'artwork/p4a-membership-mark.png',
];
const domainFiles = ['domain.mjs', 'gamify.mjs', 'errors.mjs', 'seed.mjs', 'constitution-seed.mjs', 'onboarding.mjs'];
// The guide is the landing page. Do not copy the source index alias: it exists
// only to help people opening the source folder directly, not for publication.
const applicationFiles = [
  { source: 'guide.html', destination: 'index.html' },
  { source: 'guide.html', destination: 'guide.html' },
  { source: 'application.html', destination: 'application.html' },
  { source: 'styles.css', destination: 'styles.css' },
];
const applicationPolicy = "default-src &#39;none&#39;; script-src &#39;none&#39;; style-src &#39;self&#39;; img-src &#39;self&#39;; font-src &#39;self&#39;; connect-src &#39;none&#39;; object-src &#39;none&#39;; frame-src &#39;none&#39;; base-uri &#39;none&#39;; form-action &#39;none&#39;";

function replaceOnce(content, expression, replacement, label) {
  const matches = content.match(expression);
  if (!matches || matches.length !== 1) throw new Error(`Pages build could not identify ${label}. Review the source before publishing.`);
  return content.replace(expression, replacement);
}

// The live form is a separate Worker. This static copy is deliberately inert:
// no script, submission endpoint, successful named fields, or payment service.
// Fail when the reviewed markup changes rather than publish a live form by mistake.
export function applicationPreviewHtml(contents, page) {
  if (!['application.html', 'guide.html'].includes(page)) throw new Error('Unexpected application preview page.');
  if (/<(?:script|iframe|object|embed|base)\b|\s(?:on[a-z]+|formaction)\s*=|http-equiv\s*=|(?:href|src)\s*=\s*["']\s*(?:javascript|data|vbscript):/i.test(contents)) {
    throw new Error('Application preview contains unreviewed executable markup.');
  }
  contents = replaceOnce(contents, /<meta charset="utf-8">/g, `<meta charset="utf-8">\n  <meta http-equiv="Content-Security-Policy" content="${applicationPolicy}">\n  <meta name="referrer" content="no-referrer">`, 'the application preview security policy');
  contents = replaceOnce(contents, /<main id="main" tabindex="-1">/g, '<main id="main" tabindex="-1">\n    <aside class="notice application-preview-notice" id="application-preview-notice" role="note"><strong>APPLICATION AND GUIDE PREVIEW</strong><p>Explore the form and membership pathway using made-up details only. This preview cannot submit an application or take a payment. Nothing you type is sent or saved by P4A.</p><a href="../">Return to the civic workspace preview</a></aside>', 'the application preview notice');
  contents = contents.replace(/\b(href|src)="\/(?!\/)/g, '$1="./');
  if (page === 'application.html') {
    if ((contents.match(/<form\b/gi) || []).length !== 1 || (contents.match(/<\/form>/gi) || []).length !== 1) throw new Error('Expected exactly one application preview form.');
    contents = replaceOnce(contents, /<form method="post" action="\.\/apply">/g, '<form aria-describedby="application-preview-notice" autocomplete="off">', 'the live application form');
    contents = replaceOnce(contents, /<button class="button" type="submit">Submit application<\/button>/g, '<button class="button" type="submit" disabled aria-describedby="application-preview-notice">Submission unavailable in preview</button>', 'the application submit button');
    contents = contents.replace('<p>Anyone can submit this form without a login.</p>', '<p>Explore these fields with made-up details. Submitting is disabled in this preview.</p>');
    contents = contents.replace(/<(?:input|select|textarea)\b[^>]*>/gi, tag => tag.replace(/\sname="[^"]*"/g, '').replace(/\sautocomplete="[^"]*"/g, ' autocomplete="off"'));
    const buttons = contents.match(/<button\b[^>]*>/gi) || [];
    if (buttons.length !== 1 || !/\sdisabled(?:\s|>)/.test(buttons[0]) || /<(?:input|select|textarea)\b[^>]*\bname\s*=|<input\b[^>]*\btype\s*=\s*["'](?:submit|image)["']/i.test(contents)) {
      throw new Error('Application preview contains an unreviewed submission control.');
    }
  } else if (/<(?:form|input|select|textarea|button)\b/i.test(contents)) {
    throw new Error('Application guide must remain a read-only page.');
  }
  return contents;
}

// Never recursively enumerate the checkout. Only these reviewed source paths
// are inputs, so .local, credentials and server adapters cannot enter the site.
async function source(relative) {
  const filename = path.join(root, relative);
  if (!(await lstat(filename)).isFile()) throw new Error(`Expected a regular source file: ${relative}`);
  return filename;
}

export async function buildPages() {
  if (path.resolve(output) !== path.resolve(root, 'dist')) throw new Error('Unexpected Pages output directory.');
  try {
    const info = await lstat(output);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Pages output must be a regular dist directory.');
    await rm(output, { recursive: true });
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await mkdir(path.join(output, 'demo-domain'), { recursive: true });
  for (const relative of publicFiles) {
    const input = await source(path.join('public', relative));
    const destination = path.join(output, relative);
    await mkdir(path.dirname(destination), { recursive: true });
    if (relative.endsWith('.png')) { await copyFile(input, destination); continue; }
    let contents = await readFile(input, 'utf8');
    if (relative.endsWith('.html')) {
      contents = contents.replace(/\b(href|src)="\/(?!\/)/g, '$1="./');
      contents = contents.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n  <meta http-equiv="Content-Security-Policy" content="default-src &#39;self&#39;; script-src &#39;self&#39;; style-src &#39;self&#39;; img-src &#39;self&#39; data:; font-src &#39;self&#39;; connect-src &#39;none&#39;; object-src &#39;none&#39;; base-uri &#39;self&#39;; form-action &#39;none&#39;">\n  <meta name="referrer" content="no-referrer">');
      contents = contents.replace('People, local projects and accountable participation. The P4A membership and community workspace.', 'Public interactive preview of the P4A membership and civic workspace. Fictional examples only; no live membership, identity verification or payments.');
    }
    if (relative.endsWith('.css')) contents = contents.replace(/url\((['"]?)\/(?!\/)/g, 'url($1./');
    if (relative === 'app.mjs') {
      contents = replaceOnce(contents, /async function api\(path, options=\{\}\) \{[\s\S]*?\n\}\n(?=async function load\()/g, 'async function api(path, options={}) { return demoApi(path, options); }\n', 'the application API function');
      contents = "import {demoApi} from './demo-api.mjs';\n" + contents;
      contents = replaceOnce(contents, /<strong>LOCAL WORKING DEMO<\/strong> Fictional people, groups and records\. Changes stay on this computer; no emails or payments are sent\./g, '<strong>PUBLIC INTERACTIVE PREVIEW</strong> Fictional people and records. Changes last only until this page reloads. Use sample information only. No live membership, payments or ID verification.', 'the preview disclosure');
    }
    if (relative.endsWith('.mjs')) contents = contents.replaceAll('local review', 'public preview').replaceAll('local demo', 'public preview').replaceAll('local records', 'fictional preview records');
    await writeFile(destination, contents);
  }
  for (const relative of domainFiles) await copyFile(await source(path.join('src', relative)), path.join(output, 'demo-domain', relative));
  const adapter = (await readFile(await source('preview/demo-api.mjs'), 'utf8')).replaceAll("'../src/", "'./demo-domain/");
  await writeFile(path.join(output, 'demo-api.mjs'), adapter);
  await mkdir(path.join(output, 'apply'), { recursive: true });
  for (const entry of applicationFiles) {
    let contents = await readFile(await source(path.join('application-public', entry.source)), 'utf8');
    if (entry.source.endsWith('.html')) contents = applicationPreviewHtml(contents, entry.source);
    else {
      if (/@import\b|url\(\s*['"]?(?:https?:|\/\/|data:)/i.test(contents)) throw new Error('Application preview CSS contains an unreviewed external dependency.');
      contents = contents.replace(/url\((['"]?)\/(?!\/)/g, 'url($1./');
      contents += '\n.application-preview-notice { margin-bottom: 1.5rem; border: 2px solid var(--purple); }\n.application-preview-notice p { margin-block: 0.5rem; }\n.button:disabled { opacity: 0.7; cursor: not-allowed; }\n';
    }
    await writeFile(path.join(output, 'apply', entry.destination), contents);
  }
  await writeFile(path.join(output, '.nojekyll'), '');
  return { directory: output, files: publicFiles.length + domainFiles.length + applicationFiles.length + 2 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await buildPages();
  console.log(`Built ${result.files} reviewed public preview files in ${result.directory}`);
}
