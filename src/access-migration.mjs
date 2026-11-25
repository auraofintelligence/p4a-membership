import { accessRegistry, legacyPersonAllowed, scopedIdentity, can } from './scoped-access.mjs';
import { normaliseState } from './domain.mjs';
import { AppError } from './errors.mjs';

// Offline, non-writing preparation only. The caller must inspect the private
// backup, verified Access subjects, authority references and migration plan.
// No invitation, account creation, deployment or database write occurs here.
export function prepareAccessMigration(state, plan, now = new Date()) {
  if (!state || Object.hasOwn(state,'accessControl') || !Array.isArray(state.people) || !Number.isSafeInteger(state.revision)) throw new AppError('A fresh existing workspace snapshot is required.',409);
  if (!plan || !Array.isArray(plan.accounts) || !Array.isArray(plan.grants) || !Array.isArray(plan.reservations)) throw new AppError('An explicit access migration plan is required.',400);
  const snapshot = normaliseState(structuredClone(state));
  const next = {...snapshot,accessControl:{version:1,accounts:structuredClone(plan.accounts),grants:structuredClone(plan.grants),reservations:structuredClone(plan.reservations),audit:[],receipts:[]}};
  accessRegistry(next);
  // Existing authenticated people must either remain untouched or have their
  // known subject preserved. Never silently move a subject to another person.
  for (const person of snapshot.people) {
    const account = next.accessControl.accounts.find(row=>row.personId===person.id);
    if (account && person.authSubject && !account.identities.some(identity=>identity.subject===person.authSubject)) throw new AppError('The plan omits an existing sign-in identity.',409);
  }
  // The operator must confirm the known legacy pilot aliases before migrating
  // that organiser. If not migrated, the existing legacy owner remains intact.
  const owner = snapshot.people.find(row=>row.id==='pilot-organiser');
  const migrated = owner && !legacyPersonAllowed(next,owner.id);
  if (migrated) {
    const account = next.accessControl.accounts.find(row=>row.personId===owner.id);
    const aliases = plan.verifiedOwnerAliases;
    if (!Array.isArray(aliases) || !aliases.length || aliases.some(alias=>!account.identities.some(identity=>identity.issuer===alias.issuer&&identity.subject===alias.subject))) throw new AppError('Retain every verified owner alias before migrating the pilot organiser.',409);
    const actor = scopedIdentity(next,{...aliases[0],iss:aliases[0].issuer,sub:aliases[0].subject,type:'app'}).actor;
    if (!can(next,actor,'access.view','system','p4a',now)) throw new AppError('The migrated owner requires reviewed technical access.',409);
  }
  return {snapshot:next, expectedRevision:state.revision, activation:'not-authorised', legacyOwnerPreserved:!migrated, requiresReview:['Complete identity inventory and verified aliases','Independent authority references and scoped grants','Owner access and existing workflow regression','Backup and isolated restore','Explicit activation approval']};
}
