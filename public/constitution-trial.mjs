import { createTrialRehearsal } from './constitution-trial-model.mjs';

const rehearsal = createTrialRehearsal();
const actions = ['run', 'share', 'review', 'open-ballot', 'vote', 'close-ballot', 'expire'];

export function handleTrialAction(action, actor, value) {
  const command = action.startsWith('trial-') && action.slice(6);
  if (!actions.includes(command)) return false;
  rehearsal.act(command, actor, value);
  return true;
}

export function trialAuditRecord() {
  const {permissions, hasVoted, ...record} = rehearsal.view(null);
  return {kind: 'fictional-c-hour-rule-trial', formatVersion: 1, ...record};
}

export function trialView(state, { e, heading, actionButton }) {
  const actor = state.actor;
  const trial = rehearsal.view(actor);
  const { proposal, traces, review, decision, stage, day, permissions } = trial;
  const { variants, fixture, ballotRule, timeline } = proposal;
  const privateEvidence = trial.privateEvidence ?? [];
  const bothRun = Boolean(traces.A && traces.B);
  let trialStatus = privateEvidence.length ? 'Prepare private drafts' : 'Awaiting approved summaries';
  if (bothRun) trialStatus = 'Drafts ready to approve';
  if (trial.shared) trialStatus = 'Awaiting independent review';
  const stageLabels = {
    trial: trialStatus,
    reviewed: 'Evidence reviewed',
    ballot: 'Ballot open',
    decided: 'Decision recorded',
    expired: 'Trial expired',
  };

  function rolePrompt(label, role) {
    return actionButton(label, `demo-${role}`, '', 'secondary');
  }

  function variantCard(id) {
    const version = variants[id];
    const trace = traces[id];
    return `<article class="trial-variant">
      <div class="trial-variant-meta"><span class="eyebrow">${e(version.version)}</span>${id === proposal.baseline ? '<span class="chip">Baseline</span>' : ''}</div>
      <h3>${e(version.title)}</h3>
      <p>${e(version.rule)}</p>
      ${trace ? `<p class="trial-trace-label">${trial.shared ? 'Shared summary' : 'Private L0 draft'}</p><dl class="trial-trace">
        <div><dt>Elapsed time</dt><dd>${e(trace.minutes)} min</dd></div>
        <div><dt>Activity labels</dt><dd>${e(trace.labels.join(' · '))}</dd></div>
      </dl>` : ''}
      ${permissions[`run${id}`] ? actionButton(`Replay version ${id}`, 'trial-run', id, 'secondary') : ''}
    </article>`;
  }

  function reviewControls() {
    if (review) return `<div class="trial-finding">
      <p><strong>Reviewed by ${e(review.reviewer)}</strong> · Day ${e(review.day)}</p>
      <p>${e(review.reason)}</p>
    </div>`;
    if (!trial.shared) return '<p class="muted">The reviewer receives the summaries after the member approves sharing.</p>';
    if (permissions.review) return `<p>Check that both approved summaries count the elapsed time once and that Version B retains the additional activity label.</p>
      ${actionButton('Record independent review', 'trial-review', '', '')}`;
    return rolePrompt('Continue as organiser', 'organiser');
  }

  function ballotControls() {
    if (decision) return `<div class="trial-finding">
      <p><strong>Version ${e(decision.rule)} ${decision.quorumMet && decision.counts.A !== decision.counts.B ? 'selected' : 'retained'}</strong> · Day ${e(decision.day)}</p>
      <p>${e(decision.reason)}</p>
      <dl class="trial-tally">
        <div><dt>Version A</dt><dd>${e(decision.counts.A)}</dd></div>
        <div><dt>Version B</dt><dd>${e(decision.counts.B)}</dd></div>
        <div><dt>Quorum</dt><dd>${decision.quorumMet ? 'Met' : 'Unmet'}</dd></div>
      </dl>
    </div>`;
    if (stage === 'trial') return '<p class="muted">The ballot opens after evidence review.</p>';
    if (stage === 'reviewed') {
      return permissions.openBallot ? actionButton('Open demo ballot', 'trial-open-ballot', '', '') : rolePrompt('Continue as organiser', 'organiser');
    }
    return `<p class="trial-ballot-count"><strong>${e(trial.votesCast)} of ${e(ballotRule.eligibleCount)}</strong> demo ballots cast. The tally appears at close.</p>
      ${permissions.vote ? `<p>Choose the version you would adopt for this example. Each demo voter can cast one ballot.</p>
        <div class="button-row">${actionButton('Cast for version A', 'trial-vote', 'A', 'secondary')}${actionButton('Cast for version B', 'trial-vote', 'B', 'secondary')}</div>` : ''}
      ${trial.hasVoted ? '<p>Your demo ballot is recorded.</p>' : ''}
      ${!actor ? `<div class="button-row">${rolePrompt('Continue as member', 'member')}${rolePrompt('Continue as organiser', 'organiser')}</div>` : ''}
      ${permissions.closeBallot ? `<div class="trial-ballot-close">
        <p class="muted">Closing advances to day ${e(timeline.closeDay)}.${trial.votesCast < ballotRule.quorum ? ` With fewer than ${e(ballotRule.quorum)} ballots, the baseline is retained.` : ''}</p>
        ${actionButton('Close demo ballot', 'trial-close-ballot', '', '')}
      </div>` : ''}`;
  }

  return `<div class="trial-workbench">
    <a class="trial-back" href="#constitution">← Constitution workbench</a>
    ${heading('Worked proposal', proposal.title, proposal.question)}
    <div class="trial-status" id="trial-status" tabindex="-1">
      <strong>${e(stageLabels[stage])}</strong>
      <span>Simulated day ${e(day)} · Example rule ${e(trial.activeRule)}</span>
    </div>
    <p class="trial-session-note">This fictional rehearsal uses a fixed example and resets on reload.</p>

    <section class="panel trial-panel" aria-labelledby="trial-compare">
      <div class="trial-section-heading">
        <h2 id="trial-compare">Compare Aura’s capture rules</h2>
        <span class="chip">Proposal v${e(proposal.version)}</span>
      </div>
      <p>${e(proposal.principle)}</p>
      <div class="trial-fixture">
        <strong>${e(fixture.title)}</strong>
        <p>Aura prepares each draft from the same fictional session context and corroboration.</p>
      </div>
      ${privateEvidence.length ? `<details class="trial-private" open>
        <summary>Private inputs in L0</summary>
        <dl>${privateEvidence.map(source => `<div><dt>${e(source.label)}</dt><dd>${e(source.text)}</dd></div>`).join('')}</dl>
      </details>` : ''}
      <div class="trial-versions">${variantCard('A')}${variantCard('B')}</div>
      ${permissions.share ? `<div class="trial-share">
        <p>This approval sends both summaries above to the L1 reviewer and makes those same summaries visible in the public-view audit. The private inputs stay in L0.</p>
        ${actionButton('Approve and share both summaries', 'trial-share', '', '')}
      </div>` : ''}
      ${!trial.shared && !privateEvidence.length ? `<div class="button-row">${rolePrompt('Preview Aura’s drafts as a member', 'member')}</div>` : ''}
    </section>

    <section class="panel trial-panel" aria-labelledby="trial-review-heading">
      <h2 id="trial-review-heading" tabindex="-1">Review the shared summaries</h2>
      <p>${e(proposal.evaluation.method)}</p>
      <p class="muted">${e(proposal.evaluation.limitation)}</p>
      <div class="trial-next">${reviewControls()}</div>
    </section>

    <section class="panel trial-panel" aria-labelledby="trial-ballot-heading">
      <h2 id="trial-ballot-heading" tabindex="-1">Decide by ballot</h2>
      <p>${e(ballotRule.description)}</p>
      <p class="muted">The member and organiser demo roles represent the two eligible voters. The audit record includes the aggregate tally and leaves individual choices out.</p>
      <div class="trial-next">${ballotControls()}</div>
    </section>

    <section class="panel trial-panel" aria-labelledby="trial-sunset-heading">
      <h2 id="trial-sunset-heading" tabindex="-1">Sunset and fallback</h2>
      <p>Day ${e(timeline.sunsetDay)} ends this example’s trial authority. Version ${e(proposal.baseline)} is the fallback. The decision and evidence remain in the audit record.</p>
      ${stage === 'expired' ? `<p class="trial-finding"><strong>Sunset applied.</strong> Version ${e(trial.activeRule)} is current on simulated day ${e(day)}.</p>` : ''}
      ${permissions.expire ? actionButton(`Advance to day ${timeline.sunsetDay} and apply sunset`, 'trial-expire', '', '') : ''}
    </section>

    <section class="panel trial-panel" aria-labelledby="trial-audit-heading">
      <div class="trial-section-heading">
        <h2 id="trial-audit-heading">Audit record</h2>
        ${actionButton('Download audit record', 'trial-export', '', 'secondary')}
      </div>
      <p>${e(proposal.scope)}</p>
      <ol class="trial-history">${trial.history.map(entry => `<li><span>Day ${e(entry.day)}</span><p>${e(entry.text)}</p></li>`).join('')}</ol>
      <details class="trial-references">
        <summary>Sources and authority</summary>
        <ul>${proposal.references.map(ref => `<li><a href="${e(ref.url)}"${ref.url.startsWith('https://') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${e(ref.label)}</a><p>${e(ref.note)}</p></li>`).join('')}</ul>
      </details>
    </section>
  </div>`;
}
