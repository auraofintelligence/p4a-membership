import { AppError } from './errors.mjs';
import { submitApplication } from './application-store.mjs';

const APPLICATION_BODY_LIMIT = 16 * 1024;
const headers = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'; script-src 'none'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
const plain = (message, status, extra = {}) => new Response(message, { status, headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8', ...extra } });

async function formFields(request) {
  if ((request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase() !== 'application/x-www-form-urlencoded') throw new AppError('Submit the application using the form.', 415);
  if (Number(request.headers.get('content-length')) > APPLICATION_BODY_LIMIT) throw new AppError('The application is too large.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new AppError('Complete the application form.');
  let size = 0; const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > APPLICATION_BODY_LIMIT) { await reader.cancel(); throw new AppError('The application is too large.', 413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let encoded;
  try { encoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { throw new AppError('The application could not be read. Submit it again.'); }
  const parameters = new URLSearchParams(encoded), fields = {};
  for (const key of ['name', 'email', 'jurisdiction', 'contactPhone', 'localArea', 'electoralEnrolment', 'declaration', 'consent', 'policyVersion']) {
    if (parameters.getAll(key).length !== 1) throw new AppError('Complete each application field once.');
    fields[key] = parameters.get(key);
  }
  if (parameters.getAll('suggestedGames').length > 1) throw new AppError('Complete the game suggestions field once.');
  fields.suggestedGames = parameters.get('suggestedGames');
  if (parameters.getAll('membershipIntent').length > 1) throw new AppError('Complete the skills or areas of work field once.');
  fields.membershipIntent = parameters.get('membershipIntent') ?? '';
  return fields;
}

async function limitSubmission(request, env) {
  const ip = request.headers.get('CF-Connecting-IP');
  if (!env.APPLY_RATE_LIMIT || typeof env.APPLY_RATE_LIMIT.limit !== 'function' || !ip || !/^[\da-f:.]{3,64}$/iu.test(ip)) {
    throw new AppError('Applications are temporarily unavailable. Please try again later.', 503);
  }
  // This edge-provided address is used only for rate limiting, not stored with
  // an application or accepted from a form field / X-Forwarded-For header.
  const result = await env.APPLY_RATE_LIMIT.limit({ key: `application:${ip}` });
  if (result?.success === false) throw new AppError('Please wait a minute before trying again.', 429);
  if (result?.success !== true) throw new AppError('Applications are temporarily unavailable. Please try again later.', 503);
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (request.method === 'POST' && url.pathname === '/apply') {
        if (request.headers.get('origin') !== url.origin || (request.headers.has('sec-fetch-site') && !['same-origin', 'none'].includes(request.headers.get('sec-fetch-site')))) {
          return plain('Submit the application from this website.', 403);
        }
        await limitSubmission(request, env);
        await submitApplication(env.APPLICATIONS, await formFields(request));
        return new Response(null, { status: 303, headers: { ...headers, Location: '/?submitted=1' } });
      }
      if (!['GET', 'HEAD'].includes(request.method)) return plain('Method not allowed.', 405);
      if (url.pathname === '/apply') return plain('Use the application form to submit.', 405);
      if (!env.ASSETS || typeof env.ASSETS.fetch !== 'function') return plain('The application form is temporarily unavailable.', 503);
      const asset = await env.ASSETS.fetch(request);
      const outgoingHeaders = new Headers(asset.headers);
      for (const [name, value] of Object.entries(headers)) outgoingHeaders.set(name, value);
      let body = asset.body;
      if (request.method === 'GET' && url.pathname === '/' && url.searchParams.get('submitted') === '1' && asset.ok && (asset.headers.get('content-type') || '').includes('text/html')) {
        // Only this fixed marker changes; no URL or submitted value enters HTML.
        body = (await asset.text())
          .replace('<section id="application-success" hidden>', '<section id="application-success">')
          .replace('<section id="application-entry" aria-labelledby="application-title">', '<section id="application-entry" hidden aria-labelledby="application-title">');
        outgoingHeaders.delete('Content-Length');
        outgoingHeaders.delete('ETag');
      }
      return new Response(request.method === 'HEAD' ? null : body, { status: asset.status, headers: outgoingHeaders });
    } catch (error) {
      if (error instanceof AppError) return plain(error.message, error.status, error.status === 429 ? { 'Retry-After': '60' } : {});
      return plain('Applications are temporarily unavailable. Please try again later.', 503);
    }
  },
};
