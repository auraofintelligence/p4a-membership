import { AppError } from './errors.mjs';

export const APPLICATION_POLICY_VERSION = 'p4a-application-2026-11-12-v6';
export const APPLICATION_JURISDICTIONS = Object.freeze(['act', 'nsw', 'nt', 'qld', 'sa', 'tas', 'vic', 'wa', 'outside']);
const statuses = ['received', 'contacted', 'verification-pending', 'closed'];
const transitions = { received: ['contacted', 'closed'], contacted: ['verification-pending', 'closed'], 'verification-pending': ['closed'], closed: [] };
const fail = (message, status = 400) => { throw new AppError(message, status); };
const requireDatabase = database => {
  if (!database || typeof database.prepare !== 'function') fail('The applications register is temporarily unavailable.', 503);
};
const requireOrganiser = actor => {
  if (actor?.role !== 'organiser' || typeof actor.id !== 'string' || !actor.id.trim() || actor.id.length > 512) fail('Organiser access is required.', 403);
};
const cleanText = (value, label, maximum) => {
  if (typeof value !== 'string') fail(`Enter a valid ${label}.`);
  const result = value.trim();
  if (!result || result.length > maximum || /[\u0000-\u001f\u007f]/u.test(result)) fail(`Enter a valid ${label} of no more than ${maximum} characters.`);
  return result;
};

function suggestedGamesText(value) {
  if (typeof value !== 'string') fail('Name at least one game you’d bring or like to try.');
  const normalised = value.replace(/\r\n?/g, '\n');
  if (normalised.length > 400 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(normalised)) fail('Keep game suggestions to 400 characters of plain text.');
  const titles = normalised.split('\n').map(line => line.replace(/\t/g, ' ').trim()).filter(Boolean).join('\n');
  if (!titles) fail('Name at least one game you’d bring or like to try.');
  return titles;
}

function contactPhoneText(value) {
  const phone = cleanText(value, 'phone number', 32);
  const digits = phone.replace(/\D/g, '');
  if (!/^\+?[\d(][\d ().-]*$/u.test(phone) || digits.length < 7 || digits.length > 15) fail('Enter a phone number using Australian or international formatting.');
  let depth = 0;
  for (const character of phone) {
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    if (depth < 0 || depth > 1) fail('Check the phone number formatting.');
  }
  if (depth !== 0) fail('Check the phone number formatting.');
  return phone;
}

function membershipIntentText(value = '') {
  if (typeof value !== 'string') fail('Describe skills or areas of work as plain text.');
  const normalised = value.replace(/\r\n?/g, '\n');
  if (normalised.length > 600 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(normalised)) fail('Keep skills or areas of work to 600 characters of plain text.');
  return normalised.split('\n').map(line => line.replace(/\t/g, ' ').trim()).join('\n').trim();
}

export function validateApplication(fields) {
  if (!fields || typeof fields !== 'object') fail('Complete the application form.');
  const name = cleanText(fields.name, 'name', 120);
  const email = cleanText(fields.email, 'email address', 254).toLowerCase();
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/u.test(email)) fail('Enter a valid email address.');
  const suppliedJurisdiction = typeof fields.jurisdiction === 'string' ? fields.jurisdiction.trim().toLowerCase() : '';
  const jurisdiction = suppliedJurisdiction === 'overseas' ? 'outside' : suppliedJurisdiction;
  if (!APPLICATION_JURISDICTIONS.includes(jurisdiction)) fail('Choose your state, territory or outside Australia.');
  const contactPhone = contactPhoneText(fields.contactPhone);
  const localArea = cleanText(fields.localArea, 'local area', 120);
  if (/[\r\n\u2028\u2029]/u.test(fields.localArea)) fail('Enter your local area on one line.');
  const electoralEnrolment = fields.electoralEnrolment;
  if (!['enrolled', 'not-enrolled', 'unsure'].includes(electoralEnrolment)) fail('Choose your electoral enrolment status.');
  if (fields.declaration !== 'yes') fail('Confirm that your details are accurate and that you wish to apply.');
  if (fields.consent !== 'yes') fail('Confirm the application privacy notice before submitting.');
  if (fields.policyVersion !== APPLICATION_POLICY_VERSION) fail('The application notice has changed. Reload the form before submitting.');
  return { name, email, jurisdiction, contactPhone, localArea, electoralEnrolment, membershipIntent: membershipIntentText(fields.membershipIntent), suggestedGames: suggestedGamesText(fields.suggestedGames), policyVersion: APPLICATION_POLICY_VERSION };
}

function confirmedChanges(result) {
  if (result?.success !== true || ![0, 1].includes(result.meta?.changes)) fail('The applications register could not confirm the change.', 503);
  return result.meta.changes;
}

// Email uniqueness makes a retry or duplicate submission harmless. The public
// response must never reveal whether this address was already in the register.
export async function submitApplication(database, fields, now = new Date()) {
  requireDatabase(database);
  const record = validateApplication(fields);
  const id = crypto.randomUUID(), submittedAt = now.toISOString();
  const result = await database.prepare(`INSERT INTO applications
    (id, name, email, jurisdiction, policy_version, suggested_games, contact_phone, local_area, electoral_enrolment, membership_intent, status, submitted_at, updated_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 'received', ?11, ?11)
    ON CONFLICT(email) DO NOTHING`).bind(id, record.name, record.email, record.jurisdiction, record.policyVersion, record.suggestedGames, record.contactPhone, record.localArea, record.electoralEnrolment, record.membershipIntent, submittedAt).run();
  confirmedChanges(result);
  return { received: true };
}

export async function listApplications(database, actor, { limit = 100, includeClosed = false, status } = {}) {
  requireOrganiser(actor);
  requireDatabase(database);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || typeof includeClosed !== 'boolean') fail('Choose a list limit from 1 to 100.');
  if (status !== undefined && !statuses.includes(status)) fail('Choose a valid application status.');
  const filter = status !== undefined ? 'WHERE status = ?1' : includeClosed ? '' : "WHERE status <> 'closed'";
  const query = database.prepare(`SELECT id, name, email, jurisdiction,
    policy_version AS policyVersion, suggested_games AS suggestedGames, contact_phone AS contactPhone,
    local_area AS localArea, electoral_enrolment AS electoralEnrolment, membership_intent AS membershipIntent,
    status, submitted_at AS submittedAt, updated_at AS updatedAt
    FROM applications ${filter} ORDER BY submitted_at ASC, id ASC LIMIT ${status !== undefined ? '?2' : '?1'}`);
  const result = await (status !== undefined ? query.bind(status, limit) : query.bind(limit)).all();
  if (result?.success !== true || !Array.isArray(result.results)) fail('The applications register is temporarily unavailable.', 503);
  return result.results;
}

// The actor must come from the private Worker's verified identity, never from
// a public form or client-supplied role. Each change and its reason commit together.
export async function updateApplicationStatus(database, actor, { id, expectedStatus, status, reason } = {}, now = new Date()) {
  requireOrganiser(actor);
  requireDatabase(database);
  if (typeof database.batch !== 'function') fail('The applications register cannot safely save this review.', 503);
  const applicationId = cleanText(id, 'application ID', 80);
  if (!statuses.includes(expectedStatus) || !transitions[expectedStatus].includes(status)) fail('Choose an allowed next application status.');
  if (typeof reason !== 'string' || !reason.trim() || reason.length > 500 || /\u0000/u.test(reason)) fail('Give a reason of no more than 500 characters.');
  const transitionId = crypto.randomUUID(), changedAt = now.toISOString();
  const results = await database.batch([
    database.prepare(`UPDATE applications SET status = ?1, updated_at = ?2, last_transition_id = ?3
      WHERE id = ?4 AND status = ?5`).bind(status, changedAt, transitionId, applicationId, expectedStatus),
    database.prepare(`INSERT INTO application_audit
      (id, application_id, from_status, to_status, reason, actor_id, created_at)
      SELECT ?1, id, ?2, ?3, ?4, ?5, ?6 FROM applications
      WHERE id = ?7 AND last_transition_id = ?1`).bind(transitionId, expectedStatus, status, reason.trim(), actor.id, changedAt, applicationId),
  ]);
  if (!Array.isArray(results) || results.length !== 2) fail('The applications register could not confirm the change.', 503);
  const changed = confirmedChanges(results[0]), audited = confirmedChanges(results[1]);
  if (!changed && !audited) fail('This application changed or is no longer available. Refresh before reviewing it.', 409);
  if (changed !== 1 || audited !== 1) fail('The applications register could not confirm the review history.', 503);
  return { id: applicationId, status, updatedAt: changedAt };
}
