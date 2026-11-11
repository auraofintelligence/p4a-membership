import { readFile, writeFile, mkdir, copyFile, readdir, lstat, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const output = path.join(root, 'dist');
const publicFiles = [
  'index.html', 'app.mjs', 'styles.css', 'civic-icons.css', 'civic-icons.mjs',
  'constitution.mjs', 'gamify.mjs', 'gamify.css', 'local-nodes.mjs', 'scroll-memory.mjs',
  'constitution-trial.mjs', 'constitution-trial-model.mjs', 'constitution-trial.css',
  'favicon.svg', 'robots.txt', 'LICENCE.md',
  'artwork/p4a-civic-icons-v1.png', 'artwork/gamify-democracy.svg',
];
const domainFiles = ['domain.mjs', 'gamify.mjs', 'errors.mjs', 'seed.mjs', 'constitution-seed.mjs'];

function replaceOnce(content, expression, replacement, label) {
  const matches = content.match(expression);
  if (!matches || matches.length !== 1) throw new Error(`Pages build could not identify ${label}. Review the source before publishing.`);
  return content.replace(expression, replacement);
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
  await writeFile(path.join(output, '.nojekyll'), '');
  return { directory: output, files: publicFiles.length + domainFiles.length + 2 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await buildPages();
  console.log(`Built ${result.files} reviewed public preview files in ${result.directory}`);
}
