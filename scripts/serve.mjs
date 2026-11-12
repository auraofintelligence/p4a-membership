import http from 'node:http';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { webcrypto, randomBytes } from 'node:crypto';
import { api, json, securityHeaders } from '../src/http.mjs';
import { actorFor } from '../src/domain.mjs';
import { createDemoState, migrateDemoState } from '../src/seed.mjs';
import { localApplication } from './local-application.mjs';

globalThis.crypto ??= webcrypto;
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const statePath = path.join(root, '.local', 'state.json');
await mkdir(path.dirname(statePath), { recursive: true });
let state;
try { state = JSON.parse(await readFile(statePath, 'utf8')); } catch (error) {
  if (error.code !== 'ENOENT') throw new Error('Local review data could not be read. Preserve the file and repair it before starting.');
  state = createDemoState(); await writeFile(statePath, JSON.stringify(state, null, 2));
}
const upgradedState = migrateDemoState(state);
if (upgradedState !== state) {
  state = upgradedState;
  await writeFile(`${statePath}.tmp`, JSON.stringify(state, null, 2));
  await rename(`${statePath}.tmp`, statePath);
}
let writeQueue = Promise.resolve();
const store = {
  read: async () => structuredClone(state),
  compareAndSwap(expected, next) {
    const work = writeQueue.then(async () => {
      if (state.revision !== expected) return false;
      await writeFile(`${statePath}.tmp`, JSON.stringify(next, null, 2));
      await rename(`${statePath}.tmp`, statePath);
      state = structuredClone(next); return true;
    });
    writeQueue = work.catch(() => {}); return work;
  },
};
const sessions = new Map();
const mime = { '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.json': 'application/json' };
const demoActor = (request, snapshot) => {
  const token = request.headers.get('cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith('p4a_demo='))?.slice(9);
  return actorFor(snapshot, sessions.get(token));
};
async function serveAsset(directory, pathname, { htmlNotice } = {}) {
  const relative = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  const publicRoot = path.join(root, directory);
  const target = path.resolve(publicRoot, `.${relative}`);
  if (!target.startsWith(`${publicRoot}${path.sep}`) || relative.includes('\\') || relative.includes('\0')) {
    return json({ error: 'Not found.' }, 404);
  }
  try {
    const file = await readFile(target);
    const extension = path.extname(target);
    const body = htmlNotice && extension === '.html'
      ? file.toString('utf8').replace('<main id="main" tabindex="-1">', `<main id="main" tabindex="-1"><p class="notice">${htmlNotice}</p>`)
      : file;
    return new Response(body, { headers: { ...securityHeaders, 'Content-Type': mime[extension] || 'application/octet-stream', 'Cache-Control': 'no-store' } });
  } catch { return json({ error: 'Not found.' }, 404); }
}
const applications = localApplication(root, serveAsset);
const port = Number(process.env.P4A_PREVIEW_PORT || 8791);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('P4A_PREVIEW_PORT must be a valid local port.');
const server = http.createServer(async (req, res) => {
  let response;
  try {
    if (![ `127.0.0.1:${port}`, `localhost:${port}` ].includes(req.headers.host)) { response = json({ error: 'Use the local preview address.' }, 403); }
    else {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const request = new Request(url, { method: req.method, headers: req.headers, ...(['GET', 'HEAD'].includes(req.method) ? {} : { body: req, duplex: 'half' }) });
      if (url.pathname === '/apply' || url.pathname.startsWith('/apply/')) {
        response = await applications.form(request);
      } else if (url.pathname === '/api/applications') {
        response = await applications.review(request, demoActor(request, state));
      } else if (url.pathname.startsWith('/api/')) {
        response = await api(request, {
          store, mode: 'demo', workspace: false,
          getActor: demoActor,
          demoSession: async body => {
            if (!['member', 'organiser', 'public'].includes(body?.role)) return json({ error: 'Choose a review role.' }, 400);
            const token = randomBytes(32).toString('hex');
            const id = body.role === 'member' ? 'person-1' : body.role === 'organiser' ? 'person-2' : null;
            if (id) sessions.set(token, id);
            return json({ actor: actorFor(state, id) }, 200, { 'Set-Cookie': `p4a_demo=${id ? token : ''}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${id ? 28800 : 0}` });
          },
        });
      } else if (!['GET', 'HEAD'].includes(req.method)) response = json({ error: 'Method not allowed.' }, 405);
      else response = await serveAsset('public', url.pathname);
    }
  } catch { response = json({ error: 'The local preview could not handle this request.' }, 500); }
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(req.method === 'HEAD' ? undefined : Buffer.from(await response.arrayBuffer()));
});
server.listen(port, '127.0.0.1', () => console.log(`P4A local review: http://127.0.0.1:${port}/\nApplication: http://127.0.0.1:${port}/apply/\nUse sample details. Cloudflare, Workspace and payments are not connected.`));
process.on('SIGINT', () => server.close(() => process.exit(0)));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
