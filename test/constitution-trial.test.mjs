import test from 'node:test';
import assert from 'node:assert/strict';
import { createTrialRehearsal, trialProposal } from '../public/constitution-trial-model.mjs';

const member = { id: 'person-1', role: 'member' };
const organiser = { id: 'person-2', role: 'organiser' };

function openRehearsalBallot() {
  const rehearsal = createTrialRehearsal();
  rehearsal.act('run', member, 'A');
  rehearsal.act('run', member, 'B');
  rehearsal.act('share', member);
  rehearsal.act('review', organiser);
  rehearsal.act('open-ballot', organiser);
  return rehearsal;
}

test('agent drafts count overlapping intervals once and stay private until the member shares their summaries', () => {
  const rehearsal = createTrialRehearsal();
  assert.throws(() => rehearsal.act('run', null, 'A'), /member can replay/);
  assert.throws(() => rehearsal.act('open-ballot', organiser), /after evidence review/);
  rehearsal.act('run', member, 'B');
  assert.throws(() => rehearsal.act('share', member), /after replaying the two/);
  assert.throws(() => rehearsal.act('run', member, 'B'), /once/);
  rehearsal.act('run', member, 'A');
  const memberView = rehearsal.view(member);
  assert.match(memberView.privateEvidence[1].text, /minutes 30–60/);
  assert.equal(memberView.permissions.share, true);
  for (const viewer of [null, organiser]) {
    const unshared = rehearsal.view(viewer);
    assert.equal(unshared.shared, false);
    assert.deepEqual(unshared.traces, { A: null, B: null });
    assert.equal(Object.hasOwn(unshared, 'privateEvidence'), false);
    assert.deepEqual(Object.keys(unshared.proposal.fixture), ['id', 'title']);
    assert.doesNotMatch(JSON.stringify(unshared), /Preparing a community event|Mentoring a newcomer/);
    assert.equal(unshared.history.length, 1);
    assert.equal(unshared.permissions.review, false);
  }
  assert.throws(() => rehearsal.act('review', organiser), /after the member shares/);
  assert.throws(() => rehearsal.act('share', organiser), /member can share/);
  rehearsal.act('share', member);
  const audit = rehearsal.view(null);
  assert.equal(audit.shared, true);
  assert.equal(audit.traces.A.minutes, 60);
  assert.equal(audit.history.at(-1).event, 'summaries-shared');
  assert.doesNotMatch(JSON.stringify(audit), /privateEvidence|minutes 30–60|during the final half/);
  assert.throws(() => rehearsal.act('share', member), /member can share/);
  assert.throws(() => rehearsal.act('review', member), /independent organiser/);
  assert.throws(() => rehearsal.act('review', { ...member, role: 'organiser' }), /independent organiser/);
  const reviewed = rehearsal.act('review', organiser);
  assert.equal(reviewed.traces.A.fixtureId, reviewed.traces.B.fixtureId);
  assert.equal(reviewed.traces.A.minutes, 60);
  assert.equal(reviewed.traces.B.minutes, 60);
  assert.deepEqual(reviewed.traces.A.labels, [trialProposal.fixture.primary]);
  assert.deepEqual(reviewed.traces.B.labels, [trialProposal.fixture.primary, trialProposal.fixture.secondary]);
  assert.equal(reviewed.stage, 'reviewed');
});

test('the ballot accepts one choice per perspective and reveals only aggregate totals after close', () => {
  const rehearsal = openRehearsalBallot();
  assert.throws(() => rehearsal.act('vote', null, 'A'), /eligible perspective/);
  assert.throws(() => rehearsal.act('vote', { id: 'person-3', role: 'member' }, 'B'), /eligible perspective/);
  assert.throws(() => rehearsal.act('vote', member, 'C'), /Choose Version/);
  rehearsal.act('vote', member, 'B');
  assert.equal(rehearsal.view(member).hasVoted, true);
  assert.equal(rehearsal.view(organiser).hasVoted, false);
  assert.throws(() => rehearsal.act('vote', member, 'A'), /one ballot/);
  rehearsal.act('vote', organiser, 'B');
  assert.equal(rehearsal.view(null).decision, null);
  assert.equal(rehearsal.view(null).hasVoted, false);
  assert.equal(rehearsal.view(null).votesCast, 2);
  assert.throws(() => rehearsal.act('close-ballot', member), /organiser can close/);

  const closed = rehearsal.act('close-ballot', organiser);
  assert.equal(closed.activeRule, 'B');
  assert.deepEqual(closed.decision.counts, { A: 0, B: 2 });
  assert.equal(closed.decision.quorumMet, true);
  const publicAudit = JSON.stringify(rehearsal.view(null));
  assert.doesNotMatch(publicAudit, /person-[123]|"ballots"|"voterId"|"choice"/);
  assert.throws(() => rehearsal.act('vote', organiser, 'A'), /while voting is open/);
});

test('missing quorum and a tie both retain the baseline rule', () => {
  const incomplete = openRehearsalBallot();
  incomplete.act('vote', member, 'B');
  const noQuorum = incomplete.act('close-ballot', organiser);
  assert.equal(noQuorum.activeRule, 'A');
  assert.equal(noQuorum.decision.quorumMet, false);
  assert.match(noQuorum.decision.reason, /did not reach quorum/);

  const split = openRehearsalBallot();
  split.act('vote', member, 'B');
  split.act('vote', organiser, 'A');
  const tie = split.act('close-ballot', organiser);
  assert.equal(tie.activeRule, 'A');
  assert.equal(tie.decision.quorumMet, true);
  assert.match(tie.decision.reason, /tied/);
});

test('sunset restores the baseline and preserves the reviewed evidence and decision', () => {
  const rehearsal = openRehearsalBallot();
  assert.throws(() => rehearsal.act('expire', organiser), /after the ballot closes/);
  rehearsal.act('vote', member, 'B');
  rehearsal.act('vote', organiser, 'B');
  const closed = rehearsal.act('close-ballot', organiser);
  assert.equal(closed.day, trialProposal.timeline.closeDay);
  assert.throws(() => rehearsal.act('expire', member), /organiser can advance/);
  const expired = rehearsal.act('expire', organiser);
  assert.equal(expired.stage, 'expired');
  assert.equal(expired.day, trialProposal.timeline.sunsetDay);
  assert.equal(expired.activeRule, 'A');
  assert.deepEqual(expired.decision, closed.decision);
  assert.deepEqual(expired.traces, closed.traces);
  assert.deepEqual(expired.history.slice(0, -1), closed.history);
  assert.equal(expired.history.at(-1).event, 'sunset');

  expired.traces.A.minutes = 120;
  expired.decision.counts.B = 0;
  expired.history.length = 0;
  const preserved = rehearsal.view(null);
  assert.equal(preserved.traces.A.minutes, 60);
  assert.equal(preserved.decision.counts.B, 2);
  assert.equal(preserved.history.at(-1).event, 'sunset');
  assert.equal(createTrialRehearsal().view(null).stage, 'trial');
});
