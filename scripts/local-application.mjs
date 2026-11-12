import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import applicationWorker from '../src/application-intake.mjs';
import { reviewApplications } from '../src/application-review.mjs';
import { json } from '../src/http.mjs';

async function createRegister(root) {
  const { DatabaseSync } = await import('node:sqlite');
  const database = new DatabaseSync(':memory:');
  const directory = path.join(root, 'migrations', 'applications');
  const migrations = (await readdir(directory)).filter(name => name.endsWith('.sql')).sort();
  for (const name of migrations) database.exec(await readFile(path.join(directory, name), 'utf8'));
  return {
    prepare(sql) {
      const statement = database.prepare(sql);
      return {
        bind: (...values) => ({
          run: () => ({ success: true, meta: { changes: Number(statement.run(...values).changes) } }),
          all: () => ({ success: true, results: statement.all(...values) }),
        }),
      };
    },
    batch(statements) {
      database.exec('BEGIN');
      try {
        const results = statements.map(statement => statement.run());
        database.exec('COMMIT');
        return results;
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    },
  };
}

export function localApplication(root, serveAsset) {
  let register;
  const getRegister = () => register ??= createRegister(root);
  const unavailable = () => json({ error: 'Use Node.js 24 to try application submission and review on this computer.' }, 503);
  return {
    async form(request) {
      const url = new URL(request.url);
      if (url.pathname === '/apply') return Response.redirect(new URL('/apply/', url), 308);
      url.pathname = url.pathname.slice('/apply'.length);
      const headers = new Headers(request.headers);
      headers.set('CF-Connecting-IP', '127.0.0.1');
      const localRequest = new Request(url, {
        method: request.method,
        headers,
        ...(request.body ? { body: request.body, duplex: 'half' } : {}),
      });
      let database;
      if (request.method === 'POST' && url.pathname === '/apply') {
        try { database = await getRegister(); }
        catch { return unavailable(); }
      }
      const response = await applicationWorker.fetch(localRequest, {
        APPLICATIONS: database,
        APPLY_RATE_LIMIT: { limit: async () => ({ success: true }) },
        ASSETS: { fetch: asset => serveAsset('application-public', new URL(asset.url).pathname, {
          htmlNotice: 'Local preview. Use sample details. Applications clear when this preview closes. Payments are shown for review.',
        }) },
      });
      const location = response.headers.get('Location');
      if (!location) return response;
      const redirected = new Response(response.body, response);
      redirected.headers.set('Location', `/apply${location}`);
      return redirected;
    },
    async review(request, actor) {
      if (actor?.role !== 'organiser') return json({ error: 'Choose Organiser demo to see sample applications.' }, 403);
      let database;
      try { database = await getRegister(); }
      catch { return unavailable(); }
      return reviewApplications(request, database, { role: actor.role, subject: actor.id });
    },
  };
}
