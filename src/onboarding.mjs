import { AppError } from './errors.mjs';

// A fictional rehearsal policy, not adopted membership terms or identity checks.
export const onboardingPolicyVersion = 'onboarding-rehearsal-2026-11-12';
export const onboardingQuestions = Object.freeze([
  {
    id: 'evidence',
    prompt: 'A claim in a group discussion has no source. What would you do next?',
    options: [
      { id: 'check-source', label: 'Ask for the source and check it before repeating the claim.' },
      { id: 'share-uncertainty', label: 'Explain what is uncertain and invite help checking it.' },
      { id: 'discuss-support', label: 'Ask someone to help me work through how to check it.' },
    ],
  },
  {
    id: 'privacy',
    prompt: 'A neighbour shares a private household document while asking for help. What would you do next?',
    options: [
      { id: 'ask-permission', label: 'Ask what they want help with and agree what, if anything, may be shared.' },
      { id: 'use-example', label: 'Work with a fictional example and keep their document private.' },
      { id: 'discuss-support', label: 'Ask for guidance on protecting their privacy before proceeding.' },
    ],
  },
  {
    id: 'disagreement',
    prompt: 'You disagree with a proposal in your working group. How would you take part?',
    options: [
      { id: 'explain-concerns', label: 'Explain my concerns, listen to other views and suggest a change.' },
      { id: 'seek-review', label: 'Ask for a fair review of the evidence and decision process.' },
      { id: 'discuss-support', label: 'Ask for help joining the discussion in a way that works for me.' },
    ],
  },
].map(question => Object.freeze({ ...question, options: Object.freeze(question.options.map(option => Object.freeze(option))) })));

const fail = (message, status = 400) => { throw new AppError(message, status); };
const checkPolicy = version => {
  if (version !== onboardingPolicyVersion) fail('The rehearsal questions or acknowledgement changed. Refresh before continuing.', 409);
};

export function requireOnboardingDemo(mode) {
  if (mode !== 'demo') fail('Onboarding rehearsal is available only in the fictional demo.', 403);
}

function completeAnswers(answers) {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) fail('Answer every rehearsal question.');
  const keys = Object.keys(answers);
  if (keys.length !== onboardingQuestions.length || keys.some(key => !onboardingQuestions.some(question => question.id === key))) {
    fail('Submit exactly the current rehearsal questions.');
  }
  const result = {};
  for (const question of onboardingQuestions) {
    if (!Object.hasOwn(answers, question.id) || !question.options.some(option => option.id === answers[question.id])) {
      fail('Choose one of the listed answers for every rehearsal question.');
    }
    result[question.id] = answers[question.id];
  }
  return result;
}

export function executeOnboardingCommand(state, actor, type, data, now, { mode } = {}) {
  if (typeof type !== 'string' || !type.startsWith('onboarding.')) return null;
  requireOnboardingDemo(mode);
  const at = now.toISOString();
  if (type === 'onboarding.start') {
    checkPolicy(data.policyVersion);
    if (data.acknowledged !== true) fail('Acknowledge that this is a fictional onboarding rehearsal before starting.');
    if (state.onboardingCases.some(record => record.personId === actor.id && record.status !== 'withdrawn')) {
      fail('You already have an active onboarding rehearsal.', 409);
    }
    state.onboardingCases.push({ id: crypto.randomUUID(), personId: actor.id, status: 'draft', policyVersion: onboardingPolicyVersion, createdAt: at, reviews: [] });
    return 'Started a fictional onboarding rehearsal; no membership or identity check was created.';
  }
  if (!['onboarding.submit', 'onboarding.review', 'onboarding.withdraw'].includes(type)) return null;
  const record = state.onboardingCases.find(item => item.id === data.caseId);
  if (!record) fail('This onboarding rehearsal was not found.', 404);

  if (type === 'onboarding.review') {
    if (actor.role !== 'organiser') fail('An organiser must review this rehearsal.', 403);
    if (record.personId === actor.id) fail('Another organiser must review your own rehearsal.', 403);
    if (record.status !== 'submitted') fail('Only a submitted rehearsal can be reviewed.', 409);
    checkPolicy(record.policyVersion);
    if (!['ready-for-checks', 'changes-requested'].includes(data.outcome)) fail('Choose a valid rehearsal review outcome.');
    if (typeof data.reason !== 'string' || !data.reason.trim() || data.reason.length > 1000) fail('A review reason is required and must be no more than 1000 characters.');
    record.reviews ??= [];
    record.reviews.push({ outcome: data.outcome, reason: data.reason.trim(), reviewerId: actor.id, reviewedAt: at });
    record.status = data.outcome;
    return data.outcome === 'ready-for-checks'
      ? 'Reviewed a fictional rehearsal as ready for separate checks; no membership or verification was granted.'
      : 'Requested changes to a fictional onboarding rehearsal.';
  }

  if (record.personId !== actor.id) fail('You can only change your own onboarding rehearsal.', 403);
  if (type === 'onboarding.withdraw') {
    if (record.status === 'withdrawn') fail('This rehearsal has already been withdrawn.', 409);
    record.status = 'withdrawn';
    return 'Withdrew an onboarding rehearsal; membership and account access are unchanged.';
  }

  checkPolicy(data.policyVersion);
  if (record.policyVersion !== data.policyVersion) fail('This rehearsal uses different questions. Start a new rehearsal with the current version.', 409);
  if (!['draft', 'changes-requested'].includes(record.status)) fail('Only a draft or a rehearsal needing changes can be submitted.', 409);
  record.answers = completeAnswers(data.answers);
  record.status = 'submitted';
  record.submittedAt = at;
  return 'Submitted fictional rehearsal answers for independent review.';
}

export function onboardingProjection(state, actor, mode) {
  const enabled = mode === 'demo';
  return {
    enabled,
    policyVersion: onboardingPolicyVersion,
    questions: structuredClone(onboardingQuestions),
    cases: enabled && actor
      ? state.onboardingCases.filter(record => actor.role === 'organiser' || record.personId === actor.id).map(record => structuredClone(record))
      : [],
  };
}
