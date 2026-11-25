import { AppError } from './errors.mjs';

// Proposed technical access policy, not adopted political rules. An absent
// registry preserves existing accounts. An invalid registry fails closed.
const fail = (message = 'This action is outside your authorised scope.', status = 403) => { throw new AppError(message, status); };
const key = value => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9:._-]{0,159}$/.test(value);
const instant = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
const active = (record, at) => record.status === 'active' && instant(record.startsAt) && instant(record.endsAt) && Date.parse(record.startsAt) <= at && at < Date.parse(record.endsAt);
const groupBase = ['group.view','group.join','group.leave','project.view','project.create','project.join','project.priority','project.status','task.add','task.toggle','comment.add','contribution.log','financial.log'];
const groupOffice = ['group.view','project.view','project.create','project.join','task.add','task.toggle','comment.add'];
const constitutionBase = ['constitution.view','constitution.propose','constitution.comment','constitution.withdraw'];
// Committee scopes are explicit, never inherited from group membership.
const committeeRead = ['committee.view','committee.task.own','committee.notice.read','committee.motion.write','committee.library.view'];
const committeeVote = [...committeeRead,'committee.vote.rehearsal'];
const committeeSecretary = [...committeeVote,'committee.meeting.manage','committee.attendance','committee.minutes.write','committee.task.assign','committee.notice.write','committee.office.plan','committee.library.write'];
const grantRules = Object.freeze({
  member: { group: groupBase, constitution: constitutionBase, committee: ['committee.minutes.released','committee.library.released'] },
  committee: { group: groupOffice, constitution: constitutionBase, committee: committeeVote },
  chair: { group: [...groupOffice,'project.priority','project.status','scope.delegate','committee.propose'], constitution: [...constitutionBase,'scope.delegate','constitution.structure'], committee: [...committeeVote,'committee.meeting.manage','committee.attendance','committee.minutes.review','scope.delegate','committee.office.review','committee.finance.view','committee.finance.review','committee.library.review'] },
  deputy: { group: groupOffice, constitution: constitutionBase, committee: committeeVote },
  secretary: { group: [...groupOffice,'scope.delegate','committee.propose'], constitution: [...constitutionBase,'constitution.review','scope.delegate','constitution.structure'], committee: [...committeeSecretary,'scope.delegate'] },
  'assistant-secretary': { group: groupOffice, constitution: constitutionBase, committee: committeeSecretary },
  treasurer: { group: ['group.view','project.view','financial.view','financial.log','financial.review','financial.refund','financial.revoke','contribution.view','contribution.review','contribution.revoke'], committee: [...committeeVote,'committee.finance.view','committee.finance.write'] },
  reviewer: { group: ['group.view','project.view','contribution.view','contribution.review','contribution.revoke'], constitution: [...constitutionBase,'constitution.review'], committee: [...committeeRead,'committee.minutes.review','committee.office.review','committee.finance.view','committee.finance.review','committee.library.review'] },
  applicant: { person: ['application.own'] },
  webmaster: { system: ['access.view','access.reserve','access.revoke'] },
});
export const officeRoles = Object.freeze(Object.keys(grantRules));
const identityKey = row => JSON.stringify([row.issuer,row.subject]);
const validIdentity = row => row && typeof row.subject === 'string' && row.subject.length > 0 && row.subject.length <= 512 &&
  typeof row.issuer === 'string' && /^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(row.issuer);
const unique = (rows, field) => new Set(rows.map(row => row[field])).size === rows.length;
const scopeKey = scope => scope.kind + ':' + scope.id;
function validScope(state, scope) {
  if (!scope || !key(scope.id)) return false;
  switch (scope.kind) {
    case 'system': return scope.id === 'p4a';
    case 'person': return state.people.some(row => row.id === scope.id);
    case 'group': return state.groups.some(row => row.id === scope.id);
    case 'constitution': return state.constitutions.some(row => row.id === scope.id);
    case 'committee': return Array.isArray(state.governance?.committees) && state.governance.committees.some(row=>row?.id===scope.id);
    default: return false;
  }
}
function validGrant(state, registry, grant) {
  const account = registry.accounts.find(row => row.id === grant?.accountId);
  const allowed = grant && Object.hasOwn(grantRules, grant.role) && grantRules[grant.role][grant.scope?.kind];
  return Boolean(account && key(grant.id) && allowed && validScope(state, grant.scope) &&
    (grant.scope.kind !== 'person' || grant.scope.id === account.personId) &&
    Array.isArray(grant.permissions) && grant.permissions.length > 0 && new Set(grant.permissions).size === grant.permissions.length &&
    grant.permissions.every(permission => allowed.includes(permission)) &&
    ['active','revoked'].includes(grant.status) && instant(grant.startsAt) && instant(grant.endsAt) &&
    grant.startsAt < grant.endsAt && key(grant.authorityRef) && (grant.delegatedFrom === undefined || key(grant.delegatedFrom)));
}
function validDelegation(registry, grant) {
  if (!grant.delegatedFrom) return true;
  const parent = registry.grants.find(row => row.id === grant.delegatedFrom);
  return Boolean(parent && !parent.delegatedFrom && parent.accountId !== grant.accountId &&
    scopeKey(parent.scope) === scopeKey(grant.scope) && parent.permissions.includes('scope.delegate') &&
    !grant.permissions.includes('scope.delegate') && grant.permissions.every(action => parent.permissions.includes(action)) &&
    parent.startsAt <= grant.startsAt && grant.endsAt <= parent.endsAt);
}
export function accessRegistry(state) {
  if (!Object.hasOwn(state, 'accessControl')) return null;
  const registry = state.accessControl;
  if (!registry || registry.version !== 1 || !['accounts','grants','reservations','audit','receipts'].every(name => Array.isArray(registry[name]))) fail('The access register is invalid.', 503);
  if (!registry.accounts.every(row => row && key(row.id) && key(row.personId) &&
      state.people.filter(person => person.id === row.personId).length === 1 &&
      Array.isArray(row.identities) && row.identities.length > 0 && row.identities.every(identity => validIdentity(identity) && !state.people.some(person => person.id !== row.personId && person.authSubject === identity.subject)) &&
      ['active','disabled'].includes(row.status)) ||
      !unique(registry.accounts,'id') || !unique(registry.accounts,'personId') ||
      new Set(registry.accounts.flatMap(row => row.identities.map(identityKey))).size !== registry.accounts.reduce((count,row) => count + row.identities.length,0) ||
      !registry.grants.every(grant => validGrant(state, registry, grant)) || !unique(registry.grants,'id') || !registry.grants.every(grant=>validDelegation(registry,grant)) ||
      !registry.reservations.every(row => row && key(row.id) && officeRoles.includes(row.role) && validScope(state,row.scope) &&
        Object.hasOwn(grantRules[row.role],row.scope.kind) && ['reserved','cancelled'].includes(row.status) && !row.accountId) ||
      !unique(registry.reservations,'id')) fail('The access register is invalid.', 503);
  return registry;
}
// Only verified issuer/subject claims enter this function. Never accept a
// client-supplied role or infer an account from an email, contribution or game.
export function scopedIdentity(state, claims) {
  const registry = accessRegistry(state);
  if (!registry) return { managed: false, actor: null };
  const account = registry.accounts.find(row => row.identities.some(identity => identity.subject === claims?.sub && identity.issuer === claims?.iss));
  if (!account) return { managed: false, actor: null };
  if (account.status !== 'active' || claims.type !== 'app') return { managed: true, actor: null };
  const person = state.people.find(row => row.id === account.personId);
  return { managed: true, actor: { id: person.id, name: person.name, role: 'member', access: 'scoped', accountId: account.id } };
}
export function legacyPersonAllowed(state, personId) {
  const registry = accessRegistry(state);
  // An account that was explicitly migrated never regains legacy privileges,
  // including through a different alias after account suspension.
  return !registry || !registry.accounts.some(row => row.personId === personId);
}
function grantsFor(state, actor, now = new Date()) {
  const registry = accessRegistry(state);
  if (!registry || actor?.access !== 'scoped') return [];
  const account = registry.accounts.find(row => row.id === actor.accountId && row.personId === actor.id && row.status === 'active');
  return account ? registry.grants.filter(grant => {
    if (grant.accountId !== account.id || !active(grant,now.getTime())) return false;
    if (!grant.delegatedFrom) return true;
    const parent = registry.grants.find(row => row.id === grant.delegatedFrom);
    return active(parent,now.getTime()) && registry.accounts.some(row=>row.id===parent.accountId&&row.status==='active');
  }) : [];
}
export function can(state, actor, action, kind, id, now = new Date()) {
  return grantsFor(state, actor, now).some(grant => grant.scope.kind === kind && grant.scope.id === id && grant.permissions.includes(action));
}
const ownCommands = new Set(['profile.update','profile.influence.add','profile.influence.update','profile.influence.remove','training.complete','team-game.record','team-game.remove','membership.withdraw']);
const projectCommands = new Set(['project.join','project.priority','project.status','task.add','task.toggle','comment.add','contribution.log']);
const draftCommands = new Set(['constitution.propose','constitution.comment','constitution.withdraw','constitution.review','constitution.structure']);
const receiptCommands = new Set(['contribution.review','contribution.revoke','contribution.sharing','contribution.correct','financial.review','financial.refund','financial.revoke','financial.sharing','financial.correct']);
const groupScope = (state, projectId) => state.projects.find(row => row.id === projectId)?.groupId;

// Enforce before idempotency replay and before the existing domain handler.
// The one-command effective organiser is internal, never a session or actor
// projection, and cannot authorise an unrelated operation.
export function authorisedDomainActor(state, actor, command, now = new Date()) {
  if (actor?.access !== 'scoped') return actor;
  const registry = accessRegistry(state);
  if (!registry?.accounts.some(row => row.id === actor.accountId && row.personId === actor.id && row.status === 'active')) fail();
  const type = command?.type, data = command?.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail();
  const member = { id: actor.id, name: actor.name, role: 'member' };
  const elevated = { ...member, role: 'organiser' };
  const has = (action, kind, id) => can(state, actor, action, kind, id, now);
  const group = (action, id, project = false) => Boolean(id && has('group.view','group',id) && (!project || has('project.view','group',id)) && has(action,'group',id));
  if (ownCommands.has(type)) return member;
  if (type === 'group.join' || type === 'group.leave') {
    if (group(type,data.groupId)) return member;
    fail();
  }
  if (type === 'project.create') {
    if (group(type,data.groupId,true)) return member;
    fail();
  }
  if (projectCommands.has(type)) {
    const id = groupScope(state,data.projectId);
    if (!group(type,id,true)) fail();
    // An explicitly granted chair may manage a project in that exact group.
    // Other participants keep the existing domain ownership and participation checks.
    if (['project.priority','project.status'].includes(type) && grantsFor(state,actor,now).some(g=>g.role==='chair'&&g.scope.kind==='group'&&g.scope.id===id&&g.permissions.includes(type))) return elevated;
    return member;
  }
  if (draftCommands.has(type)) {
    const id = data.constitutionId;
    if (!state.constitutions.some(row => row.id === id) || !has('constitution.view','constitution',id) || !has(type,'constitution',id)) fail();
    return ['constitution.review','constitution.structure'].includes(type) ? elevated : member;
  }
  if (type === 'financial.log') {
    const id = groupScope(state,data.projectId);
    if (!group(type,id,true) || (data.personId && data.personId !== actor.id)) fail();
    return member;
  }
  if (receiptCommands.has(type)) {
    const money = type.startsWith('financial.');
    const receipt = (money ? state.financialContributions : state.contributions).find(row => row.id === data.contributionId);
    if (!receipt) fail();
    if (type.endsWith('.sharing') || type.endsWith('.correct')) {
      if (receipt.personId !== actor.id) fail();
      if (type === 'financial.correct' && !group('financial.log',groupScope(state,data.projectId),true)) fail();
      return member;
    }
    const id = groupScope(state,receipt.projectId);
    if (!group(type,id,true) || !has(money ? 'financial.view' : 'contribution.view','group',id) || receipt.personId === actor.id || receipt.createdBy === actor.id) fail();
    return elevated;
  }
  // No grants for live enrolment, admission, formal adoption, voting,
  // invitations, global CRM creation or unreviewed commands.
  fail();
}

export function scopedCollections(state, actor, now = new Date()) {
  const has = (action, kind, id) => can(state,actor,action,kind,id,now);
  const groups = state.groups.filter(row => has('group.view','group',row.id));
  const ids = new Set(groups.map(row => row.id));
  const projects = state.projects.filter(row => ids.has(row.groupId) && has('project.view','group',row.groupId));
  const projectIds = new Set(projects.map(row => row.id));
  const peopleIds = new Set(groups.flatMap(row => row.memberIds));
  return {
    groups, projects,
    people: state.people.filter(row => row.id === actor.id || (peopleIds.has(row.id) && row.directoryConsent === true)),
    constitutions: state.constitutions.filter(row => has('constitution.view','constitution',row.id)),
    contributions: state.contributions.filter(row => row.personId === actor.id || (projectIds.has(row.projectId) && has('contribution.view','group',groupScope(state,row.projectId)))),
    financialContributions: state.financialContributions.filter(row => row.personId === actor.id || (projectIds.has(row.projectId) && has('financial.view','group',groupScope(state,row.projectId)))),
    memberships: state.memberships.filter(row => row.personId === actor.id),
    activity: state.activity.filter(row => row.actorId === actor.id),
  };
}

export function effectiveAccess(state, actor, now = new Date()) {
  return grantsFor(state,actor,now).map(({ id,role,scope,permissions,startsAt,endsAt }) => ({ id,role,scope:{...scope},permissions:[...permissions],startsAt,endsAt }));
}
export function accessOverview(state, actor, now = new Date()) {
  if (!can(state,actor,'access.view','system','p4a',now)) fail();
  const registry = accessRegistry(state);
  // Metadata only; never expose sign-in subjects, credentials or raw records.
  return {
    revision: state.revision,
    currentAccountId: actor.accountId,
    capabilities: { reserve:can(state,actor,'access.reserve','system','p4a',now), revoke:can(state,actor,'access.revoke','system','p4a',now) },
    accounts: registry.accounts.map(({id,personId,status}) => ({id,personId,status})),
    grants: registry.grants.map(({id,accountId,role,scope,permissions,startsAt,endsAt,status,authorityRef,delegatedFrom}) => ({id,accountId,role,scope,permissions,startsAt,endsAt,status,authorityRef,delegatedFrom})),
    reservations: registry.reservations.map(({id,role,scope,status,createdBy,createdAt,cancelledBy,cancelledAt}) => ({id,role,scope,status,createdBy,createdAt,cancelledBy,cancelledAt})),
    audit: registry.audit.slice(-100).map(({id,actorId,type,targetId,at,reason}) => ({id,actorId,type,targetId,at,reason})),
    scopes: { groups: state.groups.map(({id,name}) => ({id,name})), constitutions: state.constitutions.map(({id,title}) => ({id,title})), committees: (state.governance?.committees||[]).map(({id,name})=>({id,name})), system:[{id:'p4a',name:'Technical workspace'}] },
    activation: 'Office reservations are not appointments. New account activation and grants require separate authorisation.',
  };
}
export function changeAccess(state, actor, command, now = new Date()) {
  const type = command?.type, data = command?.data;
  const permission = ['access.reserve','access.cancel-reservation'].includes(type) ? 'access.reserve' : ['access.revoke-grant','access.disable-account'].includes(type) ? 'access.revoke' : null;
  if (!permission || !can(state,actor,permission,'system','p4a',now)) fail();
  if (!key(command.id) || !data || typeof data !== 'object' || Array.isArray(data) || typeof data.reason !== 'string' || !data.reason.trim() || data.reason.length > 500) fail('A command ID and reason are required.',400);
  const registry = accessRegistry(state);
  const fingerprint = JSON.stringify({type,data});
  const previous = registry.receipts.find(row => row.id === command.id);
  if (previous) {
    if (previous.actorId !== actor.id || previous.fingerprint !== fingerprint) fail('This access command ID is already in use.',409);
    return {state,result:{ok:true,revision:state.revision,replayed:true}};
  }
  if (command.revision !== state.revision) fail('Refresh the access register before changing it.',409);
  const next = structuredClone(state), access = next.accessControl, at = now.toISOString();
  let targetId;
  if (type === 'access.reserve') {
    const {role,scope} = data;
    if (!Object.hasOwn(grantRules,role) || !validScope(state,scope) || !Object.hasOwn(grantRules[role],scope.kind) || role === 'applicant' || role === 'member') fail('Choose a prospective office and exact scope.',400);
    if (access.reservations.some(row => row.status === 'reserved' && row.role === role && scopeKey(row.scope) === scopeKey(scope))) fail('That office is already reserved.',409);
    targetId = crypto.randomUUID();
    access.reservations.push({id:targetId,role,scope:{kind:scope.kind,id:scope.id},status:'reserved',createdBy:actor.id,createdAt:at});
  } else if (type === 'access.cancel-reservation') {
    const row = access.reservations.find(item => item.id === data.id && item.status === 'reserved');
    if (!row) fail('No active reservation was found.',404);
    Object.assign(row,{status:'cancelled',cancelledBy:actor.id,cancelledAt:at}); targetId = row.id;
  } else if (type === 'access.revoke-grant') {
    const row = access.grants.find(item => item.id === data.id && item.status === 'active');
    if (!row || row.accountId === actor.accountId || row.role === 'webmaster') fail('Technical custody cannot be changed here.',403);
    Object.assign(row,{status:'revoked',revokedAt:at,revokedBy:actor.id}); targetId = row.id;
  } else {
    const row = access.accounts.find(item => item.id === data.id && item.status === 'active');
    if (!row || row.id === actor.accountId || access.grants.some(grant => grant.accountId === row.id && grant.role === 'webmaster')) fail('Technical custody cannot be changed here.',403);
    Object.assign(row,{status:'disabled',disabledAt:at,disabledBy:actor.id}); targetId = row.id;
  }
  next.revision += 1;
  access.audit.push({id:crypto.randomUUID(),actorId:actor.id,type,targetId,at,reason:data.reason.trim()});
  access.receipts.push({id:command.id,actorId:actor.id,fingerprint});
  return {state:next,result:{ok:true,revision:next.revision}};
}
