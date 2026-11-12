import { classicGames } from './team-games-classics.mjs';
import { sportGames } from './team-games-sports.mjs';

const formats = {
  board: 'Board games',
  sport: 'Sports',
  conversation: 'Social and reflection',
};

const styles = {
  cooperative: 'Cooperative',
  competitive: 'Competitive',
};

const selectedFilters = { format: '', style: '' };

export const teamGames = [...classicGames, ...sportGames];

function filterOptions(values, all, selected, e) {
  return `<option value="">${all}</option>${Object.entries(values).map(([value, label]) => `<option value="${e(value)}"${value === selected ? ' selected' : ''}>${e(label)}</option>`).join('')}`;
}

function gameCard(game, { e, actionButton, actor }) {
  const sourceLabel = game.sourceLabel || (game.format === 'sport' ? 'Rules' : 'Game site');
  return `<article class="panel team-game-card" data-team-game data-format="${e(game.format)}" data-style="${e(game.style)}" aria-labelledby="team-game-${e(game.id)}">
    <div class="team-game-meta"><span>${e(formats[game.format])}</span><span>${e(styles[game.style])}</span><span>${e(game.players)}</span></div>
    <h3 id="team-game-${e(game.id)}">${e(game.title)}</h3>
    <p>${e(game.aim)}</p>
    <details class="team-game-instructions"><summary>Setup and debrief</summary><p>${e(game.setup)}</p><p><strong>After the game</strong> ${e(game.debrief)}</p></details>
    <div class="button-row">
      <a class="button quiet" href="${e(game.url)}" target="_blank" rel="noopener noreferrer" aria-label="${e(game.title)} ${e(sourceLabel.toLowerCase())} (opens in a new tab)">${e(sourceLabel)} ↗</a>
      ${actor ? actionButton('Record a game played', 'team-game-played', game.id) : ''}
    </div>
  </article>`;
}

export function teamGamesIndex({ e, actionButton, actor, civicTools }) {
  const trainingLink = civicTools
    ? '<a href="#training/first-quarter-team-games">First-quarter team games lesson</a>'
    : '<a href="#onboarding">First-quarter team games in onboarding</a>';
  return `<section class="team-games-index" data-team-games-index aria-labelledby="team-games-title">
    <div class="section-heading"><div><h2 id="team-games-title">Team games index</h2><p>We’re starting with a few familiar games and activities. Tell us what you’d bring when you apply, or use Suggest a game as a member.</p></div></div>
    <div class="button-row">${trainingLink}${actor ? actionButton('Suggest a game', 'participation-idea', 'game', 'secondary') : ''}</div>
    <details class="panel team-games-host"><summary>Set up an accessible session</summary>
      <p>Ask about access needs and check any game and venue rules on full-game recording. Mix people who are new to the game with people who know it. Make most sessions cooperative and rotate who teaches, leads and observes.</p>
      <p>Use the first check-in to agree what clear communication, fair treatment and teamwork should look like. Keep that check-in off the recording. Agree who can see recordings and how long they’ll be kept, then confirm everyone’s consent before recording the full game with audio, video and screen capture as suited to the activity.</p>
      <p>After the game, revisit those same expectations. Point to a specific moment that helped the team and one that got in its way. Ask what the team would do differently at its next session or in civic work.</p>
    </details>
    <div class="team-games-controls">
      <label class="field">Game format<select data-team-game-filter="format">${filterOptions(formats, 'All formats', selectedFilters.format, e)}</select></label>
      <label class="field">Play style<select data-team-game-filter="style">${filterOptions(styles, 'All styles', selectedFilters.style, e)}</select></label>
      <p class="metric-explainer" data-team-game-count role="status">${teamGames.length} games</p>
    </div>
    <p data-team-game-empty hidden>Choose a different format or play style to see more games.</p>
    <div class="team-games-grid">${teamGames.map(game => gameCard(game, { e, actionButton, actor })).join('')}</div>
  </section>`;
}

export function mountTeamGamesIndex(root) {
  const index = root.querySelector('[data-team-games-index]');
  if (!index) return;
  const filters = [...index.querySelectorAll('[data-team-game-filter]')];
  const games = [...index.querySelectorAll('[data-team-game]')];
  const count = index.querySelector('[data-team-game-count]');
  const empty = index.querySelector('[data-team-game-empty]');
  const update = () => {
    let visible = 0;
    for (const game of games) {
      game.hidden = filters.some(filter => filter.value && game.dataset[filter.dataset.teamGameFilter] !== filter.value);
      if (!game.hidden) visible++;
    }
    count.textContent = `${visible} ${visible === 1 ? 'game' : 'games'}`;
    empty.hidden = visible > 0;
  };
  index.addEventListener('change', event => {
    if (!filters.includes(event.target)) return;
    selectedFilters[event.target.dataset.teamGameFilter] = event.target.value;
    update();
  });
  update();
}
