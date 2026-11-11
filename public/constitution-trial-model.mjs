const eligibleVoters = Object.freeze({ 'person-1': 'member', 'person-2': 'organiser' });

// Only the member's projection includes the details of this fictional evidence.
const observations = Object.freeze([
  Object.freeze({ start: 0, end: 60, label: 'Preparing a community event' }),
  Object.freeze({ start: 30, end: 60, label: 'Mentoring a newcomer' }),
]);
const privateEvidence = Object.freeze([
  Object.freeze({
    label: 'Agreed activity information',
    text: 'The participant agreed their agent could use the event preparation brief, session observations and the host’s account for a private C-Hour draft.',
  }),
  Object.freeze({
    label: 'Sample observations',
    text: observations.map(({ start, end, label }) => `${label}, minutes ${start}–${end}.`).join(' '),
  }),
  Object.freeze({
    label: 'Confirming debrief',
    text: 'In the debrief the participant confirmed the host’s account that they mentored a newcomer during the final half of the same voluntary preparation session.',
  }),
]);

export const trialProposal = Object.freeze({
  id: 'overlapping-c-hours',
  version: '1',
  title: 'Recording overlapping voluntary work',
  question: 'Should the agent’s draft show one primary activity or also name a confirmed activity that happened at the same time?',
  scope: 'A fictional working group testing how it describes one verified voluntary session.',
  principle: 'One verified hour of voluntary human contribution counts once, with no monetary equivalent.',
  baseline: 'A',
  variants: Object.freeze({
    A: Object.freeze({
      id: 'A',
      title: 'Primary activity',
      version: 'A.1',
      rule: 'The agent counts the elapsed time once and labels the primary activity.',
    }),
    B: Object.freeze({
      id: 'B',
      title: 'Primary and secondary activities',
      version: 'B.1',
      rule: 'The agent counts the elapsed time once and adds a secondary label when the evidence confirms an overlapping activity.',
    }),
  }),
  fixture: Object.freeze({
    id: 'community-session-v1',
    title: 'A fictional event preparation session',
    minutes: 60,
    primary: observations[0].label,
    secondary: observations[1].label,
  }),
  evidenceSources: Object.freeze(privateEvidence.map(({ label }) => label)),
  references: Object.freeze([
    Object.freeze({
      label: 'Constitution workbench, draft clause 8',
      url: '#constitution',
      note: 'Community Hours and recognition, starter wording v1. One verified hour counts once across activities.',
    }),
    Object.freeze({
      label: 'C-Hour Introduction',
      url: 'https://auraofintelligence.github.io/C-Hour-introduction/community-hours.html',
      note: 'Describes personally chosen sources, a confirming conversation and the option to share a confirmation while keeping its supporting details private.',
    }),
    Object.freeze({
      label: 'ABS Time Use Survey',
      url: 'https://www.abs.gov.au/statistics/people/people-and-communities/how-australians-use-their-time/2024',
      note: 'The 2024 survey provides context for recording activities people do at the same time.',
    }),
  ]),
  ballotRule: Object.freeze({
    eligibleCount: Object.keys(eligibleVoters).length,
    quorum: 2,
    description: 'The two fictional participants each have one ballot. Both must vote to reach quorum. A strict majority selects the version. A tie or missing quorum retains Version A.',
  }),
  timeline: Object.freeze({ openDay: 1, closeDay: 7, sunsetDay: 30 }),
  evaluation: Object.freeze({
    method: 'Replay both agent rules on the same agreed evidence and compare the drafted minutes and labels.',
    limitation: 'This fictional replay illustrates how the rules handle overlap. A field trial would check participant corrections, missed contributions and reviewer agreement.',
  }),
});

function voterId(actor) {
  return actor && Object.hasOwn(eligibleVoters, actor.id) && eligibleVoters[actor.id] === actor.role
    ? actor.id
    : null;
}

function elapsedMinutes(intervals) {
  let minutes = 0;
  let coveredUntil = -Infinity;
  const ordered = [...intervals].sort((a, b) => a.start - b.start);
  for (const { start, end } of ordered) {
    minutes += Math.max(0, end - Math.max(start, coveredUntil));
    coveredUntil = Math.max(coveredUntil, end);
  }
  return minutes;
}

export function createTrialRehearsal() {
  const { baseline, variants, fixture, ballotRule, timeline } = trialProposal;
  const traces = { A: null, B: null };
  const ballots = new Map();
  const history = [];
  let stage = 'trial';
  let day = 0;
  let shared = false;
  let review = null;
  let decision = null;

  function record(event, text) {
    history.push({ day, event, text });
  }

  record('proposal-recorded', 'The fictional group proposes two ways to describe the same voluntary session.');

  function permissions(actor) {
    const id = voterId(actor);
    const tester = id === 'person-1';
    const organiser = id === 'person-2';
    return {
      runA: tester && stage === 'trial' && !traces.A,
      runB: tester && stage === 'trial' && !traces.B,
      share: tester && stage === 'trial' && !shared && Boolean(traces.A && traces.B),
      review: organiser && stage === 'trial' && shared,
      openBallot: organiser && stage === 'reviewed',
      vote: Boolean(id) && stage === 'ballot' && !ballots.has(id),
      closeBallot: organiser && stage === 'ballot',
      expire: organiser && stage === 'decided',
    };
  }

  function view(actor) {
    // This projection is also the public audit export. Individual choices stay
    // in the rehearsal closure even after the aggregate tally is published.
    const isParticipant = voterId(actor) === 'person-1';
    return structuredClone({
      proposal: isParticipant ? trialProposal : {
        ...trialProposal,
        fixture: { id: fixture.id, title: fixture.title },
      },
      stage,
      day,
      shared,
      traces: shared || isParticipant ? traces : { A: null, B: null },
      ...(isParticipant ? { privateEvidence } : {}),
      review,
      votesCast: ballots.size,
      hasVoted: ballots.has(voterId(actor)),
      decision,
      activeRule: stage === 'decided' ? decision.rule : baseline,
      history,
      permissions: permissions(actor),
    });
  }

  function act(action, actor, value) {
    const allowed = permissions(actor);
    switch (action) {
      case 'run': {
        if (value !== 'A' && value !== 'B') throw new Error('Choose Version A or Version B.');
        if (!(value === 'A' ? allowed.runA : allowed.runB)) {
          throw new Error('The member can replay each agent rule once before sharing.');
        }
        const labels = observations.map(({ label }) => label).slice(0, value === 'A' ? 1 : 2);
        traces[value] = {
          variant: value,
          version: variants[value].version,
          fixtureId: fixture.id,
          minutes: elapsedMinutes(observations),
          labels,
        };
        break;
      }
      case 'share': {
        if (!allowed.share) throw new Error('The member can share both summaries after replaying the two agent rules.');
        shared = true;
        record('summaries-shared', 'The member approved both prepared summaries for L1 review and the rehearsal audit.');
        break;
      }
      case 'review': {
        if (!allowed.review) throw new Error('The independent organiser can review after the member shares both summaries.');
        stage = 'reviewed';
        review = {
          day,
          reviewer: 'Fictional organiser',
          reason: 'Both prepared summaries use the same session and count its elapsed time once. Version B also retains the mentoring label. The sample is ready for the rehearsal ballot.',
        };
        record('evidence-reviewed', review.reason);
        break;
      }
      case 'open-ballot': {
        if (!allowed.openBallot) throw new Error('The organiser can open the ballot after evidence review.');
        stage = 'ballot';
        day = timeline.openDay;
        record('ballot-opened', 'The organiser opened the ballot on the two reviewed versions.');
        break;
      }
      case 'vote': {
        if (value !== 'A' && value !== 'B') throw new Error('Choose Version A or Version B.');
        if (!allowed.vote) throw new Error('Each eligible perspective can cast one ballot while voting is open.');
        ballots.set(voterId(actor), value);
        record('ballot-cast', 'A ballot was cast.');
        break;
      }
      case 'close-ballot': {
        if (!allowed.closeBallot) throw new Error('The organiser can close the open ballot.');
        const counts = { A: 0, B: 0 };
        for (const choice of ballots.values()) counts[choice]++;
        const quorumMet = ballots.size >= ballotRule.quorum;
        const winner = Object.keys(counts).find(option => counts[option] > ballots.size / 2);
        const rule = quorumMet && winner ? winner : baseline;
        let reason = `Version ${rule} received a majority with quorum met.`;
        if (!quorumMet) reason = 'The ballot did not reach quorum. Version A stays in effect.';
        else if (!winner) reason = 'The ballot was tied. Version A stays in effect.';
        stage = 'decided';
        day = timeline.closeDay;
        decision = { day, rule, version: variants[rule].version, reason, counts, votesCast: ballots.size, quorumMet };
        record('ballot-closed', reason);
        break;
      }
      case 'expire': {
        if (!allowed.expire) throw new Error('The organiser can advance to sunset after the ballot closes.');
        stage = 'expired';
        day = timeline.sunsetDay;
        record('sunset', 'The decision period ended. Version A applies to new entries and the decision stays in the history.');
        break;
      }
      default:
        throw new Error('Unknown rehearsal action.');
    }
    return view(actor);
  }

  return { view, act };
}
