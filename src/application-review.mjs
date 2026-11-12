import { listApplications, updateApplicationStatus } from './application-store.mjs';
import { AppError } from './errors.mjs';
import { json, readBody, requireSameOrigin } from './http.mjs';

export async function reviewApplications(request, database, identity, headers = {}) {
  if (identity?.role !== 'organiser' || !identity.subject) return json({ error: 'Organiser access is required.' }, 403, headers);
  if (!database) return json({ error: 'The applications register is awaiting setup.' }, 503, headers);
  const actor = { id: identity.subject, role: identity.role };
  try {
    if (request.method === 'GET') {
      const status = new URL(request.url).searchParams.get('status') || undefined;
      const records = await listApplications(database, actor, { status });
      return json({ records }, 200, headers);
    }
    if (request.method === 'POST') {
      requireSameOrigin(request);
      const update = await readBody(request);
      await updateApplicationStatus(database, actor, update);
      return json({ saved: true }, 200, headers);
    }
    return json({ error: 'Method not allowed.' }, 405, headers);
  } catch (error) {
    if (error instanceof AppError) return json({ error: error.message }, error.status, headers);
    return json({ error: 'The applications register is temporarily unavailable.' }, 503, headers);
  }
}
