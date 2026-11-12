import { gamifyView } from './gamify.mjs';
import { teamGamesIndex } from './team-games-index.mjs';

const number = new Intl.NumberFormat('en-AU');

export function memberParticipation(state, h) {
  if (!state.actor) return '';
  const plays = state.myGamePlays || [];
  const learning = state.myLearning || [];
  const actorId = state.actor.id;
  const projects = state.projects.filter(project => project.participantIds?.includes(actorId)).length;
  const groups = state.groups.filter(group => group.memberIds?.includes(actorId)).length;
  const hours = state.contributions.filter(entry => entry.personId === actorId && entry.status === 'verified')
    .reduce((total, entry) => total + entry.hours, 0);
  const progress = h.trainingProgress;
  const metrics = [
    ['Modules completed', progress ? `${progress.completed} of ${progress.total}` : number.format(learning.length), h.civicTools ? '#training' : '#onboarding', 'training'],
    ['Game sessions logged', number.format(plays.length), '#gamify/games', 'gamify'],
    ['Working groups joined', number.format(groups), '#groups', 'groups'],
    ['Projects joined', number.format(projects), '#projects', 'projects'],
    ['Verified C-Hours', number.format(hours), '#hours', 'hours'],
  ];
  const milestones = [
    ['First module complete', (progress?.completed ?? learning.length) > 0],
    ['First team game', plays.length > 0],
    ['Joined shared work', groups > 0 || projects > 0],
    ['First verified C-Hour', hours >= 1],
  ].filter(([, achieved]) => achieved);
  return `<section class="panel member-participation" aria-labelledby="member-participation-title">
    <h2 id="member-participation-title">Your participation</h2>
    <p>See what you’ve done in your first three months and as you keep taking part.</p>
    <div class="participation-metrics">${metrics.map(([label, value, href, image]) => `<a href="${href}">${h.icon(image)}<strong${image === 'training' ? ' data-training-progress' : ''}>${value}</strong><span>${label}</span></a>`).join('')}</div>
    ${milestones.length ? `<h3>Your milestones</h3><ul class="participation-milestones">${milestones.map(([label]) => `<li>${h.icon('check')}${label}</li>`).join('')}</ul>` : ''}
    <div class="button-row"><a class="button secondary" href="#onboarding">Membership onboarding</a><a class="button quiet" href="#gamify/games">Browse team games →</a></div>
  </section>`;
}

function gameHistory(state, h) {
  if (!state.actor) return '';
  const plays = state.myGamePlays || [];
  return `<section class="panel participation-history" aria-labelledby="participation-games-title">
    <h2 id="participation-games-title">Your games played</h2>
    <p>After a session, log the game and date to keep track of what you’ve tried. This is your private list.</p>
    ${plays.length ? `<details><summary>Show your game log (${number.format(plays.length)})</summary><ul class="participation-list">${plays.map(play => `<li><div><strong>${h.e(play.title)}</strong><p><time datetime="${h.e(play.playedOn)}">${h.dateText(play.playedOn)}</time></p></div>${h.actionButton('Remove entry', 'team-game-remove', play.id, 'secondary', `aria-label="Remove ${h.e(play.title)} from your game log"`)}</li>`).join('')}</ul></details>` : ''}
  </section>`;
}

function ideaBoard(state, h) {
  const ideas = state.gamifyIdeas || [];
  return `<section class="panel participation-ideas" aria-labelledby="participation-ideas-title">
    <div class="section-heading"><div><h2 id="participation-ideas-title">Gamify Joyful Responsible Abundance</h2><p>What would make it more rewarding to learn together, share skills or get useful civic work done?</p></div>
    ${state.actor ? h.actionButton('Suggest an idea', 'participation-idea', '', '') : '<a class="button secondary" href="#onboarding">Explore membership</a>'}</div>
    ${state.actor ? ideas.length ? `<ul class="participation-list">${ideas.map(idea => `<li><div><h3>${h.e(idea.title)}</h3><p class="participation-idea-description">${h.e(idea.description)}</p><small>${h.dateText(idea.createdAt)}${idea.mine ? ' · Your idea' : ''}</small></div>${idea.mine ? h.actionButton('Withdraw', 'participation-idea-withdraw', idea.id, 'secondary', `aria-label="Withdraw ${h.e(idea.title)}"`) : ''}</li>`).join('')}</ul>` : '<p>Ideas shared by members will appear here.</p>' : '<p>Members can suggest ideas and see what others want to try.</p>'}
  </section>`;
}

export function gamifyPage(state, id, h) {
  const games = id === 'games';
  return `<div class="gamify-page">${h.heading('P4A workspace', 'Gamify Democracy', 'Build skills together and see what you’ve contributed.')}
    <nav class="participation-tabs" aria-label="Gamify Democracy">
      <a class="button secondary" href="#gamify" ${games ? '' : 'aria-current="page"'}>Participation</a>
      <a class="button secondary" href="#gamify/games" ${games ? 'aria-current="page"' : ''}>Team games</a>
    </nav>
    ${games ? `${gameHistory(state, h)}${teamGamesIndex({ ...h, actor: state.actor })}` : `${memberParticipation(state, h)}${ideaBoard(state, h)}${gamifyView(state, h)}`}
  </div>`;
}
