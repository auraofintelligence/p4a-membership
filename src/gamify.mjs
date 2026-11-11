import { AppError } from './errors.mjs';

const fail = (message, status = 400) => { throw new AppError(message, status); };
const find = (items, id, label) => items.find(item => item.id === id) || fail(`${label} was not found.`, 404);
const text = (value, label, max, required = true) => {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) fail(`${label} is required and must be no more than ${max} characters.`);
  return value.trim();
};
const bool = (value, label) => typeof value === 'boolean' ? value : fail(`${label} must be a yes or no choice.`);
const choose = (value, choices, label) => choices.includes(value) ? value : fail(`Choose a valid ${label}.`);
const cents = value => Number.isSafeInteger(value) && value > 0 && value <= 1_000_000_000 ? value : fail('Use an AUD amount between $0.01 and $10,000,000, in whole cents.');
const today = now => new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Brisbane', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
const day = (value, now) => {
  const parsed = new Date(value);
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value || value > today(now)) fail('Choose a valid date that has already happened.');
  return value;
};
const referenceKey = value => value.normalize('NFKC').trim().toLowerCase();
const refunded = receipt => (receipt.refunds || []).reduce((sum, refund) => sum + refund.amountCents, 0);
const net = receipt => receipt.amountCents - refunded(receipt);
const independent = (actor, receipt) => {
  if (actor.role !== 'organiser') fail('This action needs an organiser.', 403);
  if (receipt.personId === actor.id || receipt.createdBy === actor.id) fail('Another organiser must independently review a contribution you made or recorded.', 403);
};
const recordHistory = (receipt, actor, action, reason, at) => {
  const { history, ...before } = structuredClone(receipt);
  receipt.history ??= [];
  receipt.history.push({ action, reason, actorId: actor.id, at, before });
};
const references = receipt => [receipt.reference, ...(receipt.refunds || []).map(refund => refund.reference), ...(receipt.history || []).flatMap(event => [event.before?.reference, ...(event.before?.refunds || []).map(refund => refund.reference)])].filter(value => typeof value === 'string');
function uniqueReference(state, reference, exceptId) {
  const key = referenceKey(reference);
  if (state.financialContributions.some(receipt => receipt.id !== exceptId && references(receipt).some(value => referenceKey(value) === key))) fail('This payment or adjustment reference has already been recorded.', 409);
}
function publicSharing(state, receipt, data, actor) {
  const publicConsent = bool(data.publicConsent ?? false, 'Public totals consent');
  const namedConsent = bool(data.namedConsent ?? false, 'Named recognition consent');
  if (receipt.personId !== actor.id && (publicConsent || namedConsent)) fail('Only the contributor can choose public recognition.', 403);
  if (namedConsent && !state.projects.some(project => project.id === receipt.projectId && project.public === true)) fail('Named recognition requires a public project.');
  return { publicConsent, namedConsent };
}
function financialFields(state, data, now, exceptId) {
  const project = find(state.projects, data.projectId, 'Project');
  const reference = text(data.reference, 'Private payment reference', 120);
  uniqueReference(state, reference, exceptId);
  return { projectId: project.id, date: day(data.date, now), amountCents: cents(data.amountCents), currency: 'AUD', category: choose(data.category, ['donation', 'sponsorship', 'project-funding'], 'contribution category'), reference, description: text(data.description, 'Private description', 1000) };
}
function canUseProject(state, actor, projectId) {
  const project = find(state.projects, projectId, 'Project');
  if (actor.role !== 'organiser' && !state.groups.find(group => group.id === project.groupId)?.memberIds.includes(actor.id)) fail('Join the working group before recording support for its project.', 403);
}
function resetReview(receipt) {
  receipt.status = 'pending';
  receipt.verifierId = null;
  delete receipt.reviewedAt;
  delete receipt.reviewReason;
  delete receipt.settled;
  receipt.publicConsent = false;
  receipt.namedConsent = false;
}

export function financialProjection(receipt) {
  return { ...structuredClone(receipt), refundedCents: refunded(receipt), netCents: net(receipt) };
}

// All writes enter through executeCommand, which supplies revision and replay protection.
export function executeGamifyCommand(state, actor, type, data, now) {
  const at = now.toISOString();
  switch (type) {
    case 'financial.log': {
      const personId = data.personId ?? actor.id;
      if (personId !== actor.id && actor.role !== 'organiser') fail('Only organisers can record a receipt for another contributor.', 403);
      find(state.people, personId, 'Contributor');
      canUseProject(state, actor, data.projectId);
      const fields = financialFields(state, data, now);
      const sharing = publicSharing(state, { personId, projectId: fields.projectId }, data, actor);
      state.financialContributions.push({ id: crypto.randomUUID(), personId, organisationId: 'p4a-movement', ...fields, ...sharing, status: 'pending', verifierId: null, createdBy: actor.id, createdAt: at, refunds: [], history: [] });
      return 'Recorded an AUD contribution for independent receipt review; no money was collected.';
    }
    case 'financial.review': {
      const receipt = find(state.financialContributions, data.contributionId, 'Financial contribution');
      independent(actor, receipt);
      if (receipt.status !== 'pending') fail('This receipt has already been reviewed.', 409);
      const status = choose(data.status, ['verified', 'rejected'], 'review outcome');
      const reason = text(data.reason, 'Review reason', 1000);
      if (status === 'verified' && data.settled !== true) fail('Confirm that the receipt has settled and its evidence has been checked.');
      recordHistory(receipt, actor, 'review', reason, at);
      Object.assign(receipt, { status, verifierId: actor.id, reviewedAt: at, reviewReason: reason, settled: status === 'verified' });
      return 'Independently reviewed an AUD contribution receipt.';
    }
    case 'financial.refund': {
      const receipt = find(state.financialContributions, data.contributionId, 'Financial contribution');
      independent(actor, receipt);
      if (receipt.status !== 'verified') fail('Only a verified receipt can record a refund or chargeback.', 409);
      const amountCents = cents(data.amountCents);
      if (amountCents > net(receipt)) fail('The adjustment exceeds this receipt’s remaining amount.');
      const reference = text(data.reference, 'Private adjustment reference', 120);
      uniqueReference(state, reference);
      const reason = text(data.reason, 'Adjustment reason', 1000);
      recordHistory(receipt, actor, 'refund', reason, at);
      receipt.refunds ??= [];
      receipt.refunds.push({ id: crypto.randomUUID(), amountCents, reference, reason, actorId: actor.id, at });
      return 'Recorded a verified refund or chargeback adjustment; no money was transferred.';
    }
    case 'financial.revoke':
    case 'contribution.revoke': {
      const monetary = type.startsWith('financial.');
      const receipt = find(monetary ? state.financialContributions : state.contributions, data.contributionId, 'Contribution');
      independent(actor, receipt);
      if (receipt.status !== 'verified') fail('Only verified contributions can have verification revoked.', 409);
      const reason = text(data.reason, 'Revocation reason', 1000);
      recordHistory(receipt, actor, 'revoke', reason, at);
      Object.assign(receipt, { status: 'revoked', revokedBy: actor.id, revokedAt: at, revocationReason: reason });
      return 'Revoked contribution verification with a recorded reason; earlier evidence remains in its history.';
    }
    case 'financial.sharing':
    case 'contribution.sharing': {
      const receipt = find(type.startsWith('financial.') ? state.financialContributions : state.contributions, data.contributionId, 'Contribution');
      if (receipt.personId !== actor.id) fail('Only the contributor can choose public recognition.', 403);
      const sharing = publicSharing(state, receipt, data, actor);
      recordHistory(receipt, actor, 'sharing', 'Contributor changed public totals and named recognition choices.', at);
      Object.assign(receipt, sharing);
      return 'Updated your contribution’s public recognition choices.';
    }
    case 'financial.correct': {
      const receipt = find(state.financialContributions, data.contributionId, 'Financial contribution');
      if (receipt.personId !== actor.id && receipt.createdBy !== actor.id) fail('Only the contributor or original recorder can correct this receipt.', 403);
      if (refunded(receipt) > 0) fail('An adjusted receipt cannot be rewritten. Ask an independent organiser to revoke it and reconcile a replacement.');
      canUseProject(state, actor, data.projectId);
      const fields = financialFields(state, data, now, receipt.id);
      const reason = text(data.reason, 'Correction reason', 1000);
      recordHistory(receipt, actor, 'correct', reason, at);
      Object.assign(receipt, fields);
      resetReview(receipt);
      receipt.correctedAt = at;
      receipt.correctedBy = actor.id;
      return 'Corrected a financial receipt and returned it for independent review; public recognition choices were cleared.';
    }
    case 'contribution.correct': {
      const receipt = find(state.contributions, data.contributionId, 'Contribution');
      if (receipt.personId !== actor.id) fail('Only the contributor can correct their voluntary receipt.', 403);
      const date = day(data.date, now);
      const hours = data.hours;
      if (typeof hours !== 'number' || !Number.isFinite(hours) || hours < 0.25 || hours > 24) fail('Record between 0.25 and 24 hours.');
      const description = text(data.description, 'Contribution description', 1000);
      const reason = text(data.reason, 'Correction reason', 1000);
      const others = state.contributions.filter(item => item.id !== receipt.id && item.personId === actor.id && !['rejected', 'revoked'].includes(item.status));
      if (others.filter(item => item.date === date).reduce((sum, item) => sum + item.hours, 0) + hours > 24) fail('Recorded contributions cannot exceed 24 hours in one day.');
      if (others.some(item => item.projectId === receipt.projectId && item.date === date && item.hours === hours && item.description === description)) fail('This contribution has already been recorded.', 409);
      recordHistory(receipt, actor, 'correct', reason, at);
      Object.assign(receipt, { date, hours, description, correctedAt: at, correctedBy: actor.id });
      resetReview(receipt);
      return 'Corrected voluntary time and returned it for independent review; public recognition choices were cleared.';
    }
    default: return null;
  }
}

function rankedRows(receipts, state, monetary) {
  const people = new Map();
  const valueKey = monetary ? 'totalCents' : 'totalHours';
  for (const receipt of receipts.filter(item => item.namedConsent === true)) {
    const person = state.people.find(item => item.id === receipt.personId);
    const project = state.projects.find(item => item.id === receipt.projectId);
    if (!person || !project) continue;
    const value = monetary ? net(receipt) : receipt.hours;
    const row = people.get(person.id) || { name: person.name, [valueKey]: 0, receiptCount: 0, projects: new Map() };
    row[valueKey] += value;
    row.receiptCount += 1;
    const summary = row.projects.get(project.id) || { id: project.id, title: project.title, [valueKey]: 0, receiptCount: 0 };
    summary[valueKey] += value;
    summary.receiptCount += 1;
    row.projects.set(project.id, summary);
    people.set(person.id, row);
  }
  const round = value => monetary ? value : Math.round((value + Number.EPSILON) * 1e6) / 1e6;
  const rows = [...people.entries()].map(([personId, row]) => ({ personId, ...row, [valueKey]: round(row[valueKey]), projects: [...row.projects.values()].map(project => ({ ...project, [valueKey]: round(project[valueKey]) })).sort((a, b) => a.title.localeCompare(b.title, 'en-AU') || a.id.localeCompare(b.id)) }));
  rows.sort((a, b) => b[valueKey] - a[valueKey] || a.name.localeCompare(b.name, 'en-AU') || a.personId.localeCompare(b.personId));
  let lastValue, rank;
  return rows.map(({ personId, ...row }, index) => {
    if (lastValue !== row[valueKey]) rank = index + 1;
    lastValue = row[valueKey];
    return { rank, ...row };
  });
}

export function gamifyProjection(state, filters = {}, mode = 'live', now = new Date()) {
  const period = choose(filters.period ?? 'all', ['all', 'year'], 'reporting period');
  const groupId = text(filters.groupId ?? '', 'Working group', 100, false);
  const projectId = text(filters.projectId ?? '', 'Project', 100, false);
  const publicProjects = state.projects.filter(project => project.public === true);
  const groupIds = new Set(publicProjects.map(project => project.groupId));
  const publicGroups = state.groups.filter(group => group.public === true && groupIds.has(group.id));
  const publishedGroupIds = new Set(publicGroups.map(group => group.id));
  if (groupId && !publicGroups.some(group => group.id === groupId)) fail('Choose a public working group.');
  if (projectId && !publicProjects.some(project => project.id === projectId && (!groupId || project.groupId === groupId))) fail('Choose a public project in the selected working group.');
  const date = today(now), year = Number(date.slice(0, 4));
  const scopedProjects = new Set(publicProjects.filter(project => (!groupId || project.groupId === groupId) && (!projectId || project.id === projectId)).map(project => project.id));
  const eligible = receipt => receipt.status === 'verified' && (receipt.publicConsent === true || receipt.namedConsent === true) && scopedProjects.has(receipt.projectId) && receipt.date <= date && (period === 'all' || receipt.date.startsWith(`${year}-`));
  const money = (state.financialContributions || []).filter(receipt => eligible(receipt) && receipt.settled === true && receipt.currency === 'AUD' && net(receipt) > 0);
  const hours = state.contributions.filter(eligible);
  const moneyCents = money.reduce((sum, receipt) => sum + net(receipt), 0);
  if (!Number.isSafeInteger(moneyCents)) fail('Financial totals exceed the supported reporting range.', 503);
  const totalHours = Math.round(hours.reduce((sum, receipt) => sum + receipt.hours, 0) * 1e6) / 1e6;
  return {
    mode, sampleData: mode === 'demo' || mode === 'pilot', updatedAt: now.toISOString(), period, year, filters: { groupId, projectId },
    options: { groups: publicGroups.map(({ id, name }) => ({ id, name })), projects: publicProjects.map(({ id, title, groupId, status }) => ({ id, title, groupId: publishedGroupIds.has(groupId) ? groupId : '', status })) },
    totals: { moneyCents, hours: totalHours, moneyReceipts: money.length, hourReceipts: hours.length },
    money: rankedRows(money, state, true), hours: rankedRows(hours, state, false),
    method: { version: 'gamify-v1', currency: 'AUD', money: 'Verified original AUD receipts less recorded refunds and chargebacks; transaction fees are not deducted from recognition. Adjustments restate the original receipt period.', hours: 'One verified voluntary human hour counted once, with no monetary conversion.', totals: 'Public totals include receipts with aggregate or named publication consent. Named ranks include only separately opted-in receipts for public projects.', ranks: 'Descending totals; equal totals share a competition rank. Names provide a stable display order within ties.', scope: 'Working-group labels require explicit group publication and a public project. Project status is a working record, not independent proof of an outcome. Public-project totals may differ from the legacy global voluntary aggregate, which can include consented private-project time.' },
  };
}
