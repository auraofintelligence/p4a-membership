import { accessTokenFromRequest, verifyAccessToken } from './auth.mjs';

const pilotFixtures = new Map([
  ['organiser', { id: 'person-2', email: 'sam@example.invalid' }],
  ['member', { id: 'person-1', email: 'alex@example.invalid' }],
]);

function normalisedEmail(value) {
  return typeof value === 'string' && value.length <= 254 && value.trim() === value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ? value.toLowerCase()
    : null;
}

function parseAllowlist(value) {
  if (typeof value !== 'string') return null;
  try {
    const entries = JSON.parse(value);
    if (!Array.isArray(entries)) return null;
    const emails = entries.map(normalisedEmail);
    return emails.includes(null) ? null : new Set(emails);
  } catch {
    return null;
  }
}

export async function getPilotRole(request, env) {
  const organisers = parseAllowlist(env.PILOT_ORGANISER_EMAILS);
  const members = parseAllowlist(env.PILOT_MEMBER_EMAILS ?? '[]');
  if (!organisers?.size || !members || members.size > 1 || [...members].some(email => organisers.has(email))) return null;

  const claims = await verifyAccessToken(accessTokenFromRequest(request), env);
  if (claims?.type !== 'app') return null;
  const email = normalisedEmail(claims.email);
  if (organisers.has(email)) return 'organiser';
  if (members.has(email)) return 'member';
  return null;
}

// The Worker must pass a role returned by getPilotRole, never a client-supplied role.
export function pilotActorForRole(role, state) {
  const fixture = pilotFixtures.get(role);
  if (!fixture || !Array.isArray(state?.people)) return null;
  const matches = state.people.filter(person => person?.id === fixture.id);
  const person = matches[0];
  if (matches.length !== 1 || person.role !== role || person.email !== fixture.email || person.authSubject) return null;
  return { id: person.id, name: person.name, role: person.role };
}

export async function authenticatePilot(request, env, state) {
  return pilotActorForRole(await getPilotRole(request, env), state);
}
