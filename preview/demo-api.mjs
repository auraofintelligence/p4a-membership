import { actorFor, executeCommand, projectState, publicProjection, gamifyProjection, AppError } from '../src/domain.mjs';
import { createDemoState } from '../src/seed.mjs';

// This module is packaged only into the separate public Pages demonstration.
// Every visitor receives fresh fictional source fixtures in page memory.
// There is no network API, browser storage, cookie, identity or payment service.
export function createPreviewApi({ now = () => new Date() } = {}) {
  let state = createDemoState();
  let actorId = null;
  const seedTime = now();
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Brisbane', year: 'numeric', month: '2-digit', day: '2-digit' }).format(seedTime);
  const apply = (id, type, data) => {
    const outcome = executeCommand(state, actorFor(state, id), { id: crypto.randomUUID(), revision: state.revision, type, data }, seedTime, { mode: 'demo' });
    state = outcome.state;
  };
  // These are illustrative fixtures, never the user's local review register.
  state.contributions[0].date = date;
  apply('person-1', 'contribution.sharing', { contributionId: 'contribution-1', publicConsent: false, namedConsent: true });
  apply('person-2', 'contribution.review', { contributionId: 'contribution-1', status: 'verified', reason: 'Fictional preview: independently reviewed the sample voluntary research.' });
  apply('person-1', 'financial.log', { projectId: 'project-1', date, amountCents: 12000, category: 'donation', reference: 'FICTIONAL-PREVIEW-RECEIPT-001', description: 'Fictional demonstration of support for shared research. No payment was made.', publicConsent: false, namedConsent: true });
  const receiptId = state.financialContributions[0].id;
  apply('person-2', 'financial.review', { contributionId: receiptId, status: 'verified', settled: true, reason: 'Fictional preview: simulated settlement and independent evidence review.' });
  apply('person-2', 'financial.refund', { contributionId: receiptId, amountCents: 2000, reference: 'FICTIONAL-PREVIEW-REFUND-001', reason: 'Fictional preview refund adjustment. No funds were transferred.' });

  const bodyOf = options => {
    if (typeof options.body !== 'string' || new TextEncoder().encode(options.body).length > 32768) throw new AppError('Send a valid preview request.', 400);
    try { return JSON.parse(options.body); } catch { throw new AppError('Send valid JSON request data.', 400); }
  };

  return async function previewApi(path, options = {}) {
    const url = new URL(path, 'https://preview.invalid');
    if (url.origin !== 'https://preview.invalid') throw new AppError('This preview has no external API.', 404);
    const method = options.method || 'GET';
    if (!['GET', 'POST'].includes(method)) throw new AppError('Method not allowed.', 405);
    if (url.pathname === '/api/demo/session') {
      if (method !== 'POST') throw new AppError('Use POST for this action.', 405);
      const { role } = bodyOf(options) || {};
      if (!['member', 'organiser', 'public'].includes(role)) throw new AppError('Choose a review perspective.', 400);
      actorId = role === 'member' ? 'person-1' : role === 'organiser' ? 'person-2' : null;
      return { actor: actorFor(state, actorId) };
    }
    const actor = actorFor(state, actorId);
    if (method === 'GET' && url.pathname === '/api/public') return structuredClone(publicProjection(state, 'demo'));
    if (method === 'GET' && url.pathname === '/api/gamify') return structuredClone(gamifyProjection(state, { period: url.searchParams.get('period') ?? 'all', groupId: url.searchParams.get('groupId') ?? '', projectId: url.searchParams.get('projectId') ?? '' }, 'demo', now()));
    if (method === 'GET' && url.pathname === '/api/bootstrap') return { ...projectState(state, actor, 'demo', false), preview: true };
    if (!actor) throw new AppError('Choose a fictional member or organiser perspective to explore this preview.', 401);
    if (method === 'GET' && url.pathname === '/api/export') return { ...projectState(state, actor, 'demo', false), preview: true };
    if (method === 'POST' && url.pathname === '/api/commands') {
      const outcome = executeCommand(state, actor, bodyOf(options), now(), { mode: 'demo' });
      state = outcome.state;
      return structuredClone(outcome.result);
    }
    throw new AppError('This preview route was not found.', 404);
  };
}

let sessionApi;
export function demoApi(path, options) {
  sessionApi ??= createPreviewApi();
  return sessionApi(path, options);
}
