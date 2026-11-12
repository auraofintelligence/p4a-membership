import { accessTokenFromRequest, verifyAccessToken } from './auth.mjs';

const organiserId = 'pilot-organiser';

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

export async function getPilotIdentity(request, env) {
  const organisers = parseAllowlist(env.PILOT_ORGANISER_EMAILS);
  if (!organisers?.size) return null;

  const claims = await verifyAccessToken(accessTokenFromRequest(request), env);
  if (claims?.type !== 'app') return null;
  if (!organisers.has(normalisedEmail(claims.email))) return null;
  return { role: 'organiser', subject: claims.sub };
}

export async function getPilotRole(request, env) {
  return (await getPilotIdentity(request, env))?.role ?? null;
}

// The Worker must pass a role returned by getPilotRole, never a client-supplied role.
export function pilotActorForRole(role, state) {
  if (role !== 'organiser' || !Array.isArray(state?.people)) return null;
  const matches = state.people.filter(person => person?.id === organiserId);
  const person = matches[0];
  if (matches.length !== 1 || person.role !== role) return null;
  return { id: person.id, name: person.name, role: person.role };
}

export async function authenticatePilot(request, env, state) {
  return pilotActorForRole(await getPilotRole(request, env), state);
}
