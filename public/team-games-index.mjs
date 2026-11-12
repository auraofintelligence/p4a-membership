const formats = {
  escape: 'Escape rooms',
  board: 'Board games',
  card: 'Card games',
  computer: 'Computer games',
  conversation: 'Conversation games',
};

const styles = {
  cooperative: 'Cooperative',
  competitive: 'Competitive',
  individual: 'Individual strategy',
};

const selectedFilters = { format: '', style: '' };

export const teamGames = [
  {
    id: 'shared-room-escape', title: 'Shared-room escape', format: 'escape', style: 'cooperative', players: '3–6 players',
    aim: 'Share clues, check assumptions and ask for help under time pressure.',
    setup: 'Give the team a set of connected puzzles and a shared place to log clues. Rotate clue finder, puzzle solver and recorder after each lock or checkpoint.',
    debrief: 'Which clue changed your plan, and how did it reach the whole team?',
  },
  {
    id: 'tabletop-clue-relay', title: 'Tabletop clue relay', format: 'escape', style: 'cooperative', players: '3–8 players',
    aim: 'Practise giving a useful handover when the next person has different information.',
    setup: 'Put clues in three envelopes. Each small group solves one stage and hands over a short written or spoken summary. Open the final envelope together.',
    debrief: 'What did the next group need that your handover left unclear?',
  },
  {
    id: 'build-a-mini-room', title: 'Build a mini escape room', format: 'escape', style: 'cooperative', players: '4–8 players',
    aim: 'Design something another team can understand and improve.',
    setup: 'Work in two groups. Each creates a short chain of clues from paper, common objects or a shared document. Swap, play and revise one clue based on the other group’s feedback.',
    debrief: 'Where did you assume a player knew what you knew?',
  },
  {
    id: 'rescue-route', title: 'Rescue route', format: 'board', style: 'cooperative', players: '2–6 players',
    aim: 'Agree on priorities when resources and information are limited.',
    setup: 'Draw a map with safe points and blocked paths. Give each person a different piece of information. Take turns moving a shared token towards safety with a limited number of moves.',
    debrief: 'How did you decide whose information mattered at each turn?',
  },
  {
    id: 'shared-map', title: 'Shared map', format: 'board', style: 'cooperative', players: '3–6 players',
    aim: 'Help everyone see the current plan as the situation changes.',
    setup: 'Take turns adding a road, obstacle or destination to a paper grid. At each checkpoint, ask a different player to restate the route and invite corrections.',
    debrief: 'When did restating the route save the team time or confusion?',
  },
  {
    id: 'route-challenge', title: 'Route challenge', format: 'board', style: 'competitive', players: 'Two teams of 2–4',
    aim: 'Make a fair decision quickly while giving everyone a turn.',
    setup: 'Give each team the same grid, obstacles and movement rules. Each team takes turns planning moves towards the destination. Swap the person who calls the next move between rounds.',
    debrief: 'Which decision rule helped your team when two people disagreed?',
  },
  {
    id: 'clues-in-hand', title: 'Clues in hand', format: 'card', style: 'cooperative', players: '3–6 players',
    aim: 'Ask precise questions and check that everyone can contribute.',
    setup: 'Write parts of a pattern on separate cards and deal them out. Give each player a turn to describe or show a clue, then have the group agree on the full pattern.',
    debrief: 'Which question brought a quiet or overlooked clue into the discussion?',
  },
  {
    id: 'build-a-hand', title: 'Build a hand', format: 'card', style: 'competitive', players: '2–6 players',
    aim: 'Explain a strategy and respond fairly to a change in the rules.',
    setup: 'Use a standard deck or paper number cards. Set a shared objective, such as building a sequence, and let each person draw or swap once per turn. Ask a different player to explain the rules each round.',
    debrief: 'What did you do when a move that helped you made it harder for someone else?',
  },
  {
    id: 'digital-puzzle-handover', title: 'Digital puzzle handover', format: 'computer', style: 'cooperative', players: '2–5 players',
    aim: 'Pass a partly solved problem to someone who can pick it up confidently.',
    setup: 'Open a shared grid puzzle or digital map. One person operates the controls while the others suggest moves. Rotate the operator after a checkpoint, with a short handover each time.',
    debrief: 'What made it easy for the next operator to resume the work?',
  },
  {
    id: 'shared-build', title: 'Shared build', format: 'computer', style: 'cooperative', players: '2–6 players',
    aim: 'Divide work, check dependencies and put the pieces together.',
    setup: 'Choose a shared digital board, grid or building game. Agree on a simple object or layout, give each player a piece to make and test how the pieces join. Swap roles for the next build.',
    debrief: 'Which early agreement helped the pieces fit together?',
  },
  {
    id: 'two-solutions', title: 'Two ways to solve it', format: 'computer', style: 'individual', players: '1 player at a time, then compare',
    aim: 'Show your reasoning and learn from a different approach.',
    setup: 'Give everyone the same small digital logic or route puzzle. Each person tries it on their own, then pairs up to explain one decision and try an alternative.',
    debrief: 'What would you change after hearing someone else’s reasoning?',
  },
  {
    id: 'teach-a-game', title: 'Teach a game', format: 'conversation', style: 'cooperative', players: '2–8 players',
    aim: 'Explain clearly, check understanding and share a skill.',
    setup: 'Ask a member to teach a short game they know. Let someone else explain it back, then play a practice turn. Invite a new teacher for the next round.',
    debrief: 'Which part of the explanation made the rules click?',
  },
  {
    id: 'plan-compare', title: 'Plan and compare', format: 'conversation', style: 'individual', players: '1 player at a time, then compare',
    aim: 'Notice how people weigh the same trade-off differently.',
    setup: 'Give each person the same harmless task with a limit, such as planning a picnic around three transport options. Ask them to pick a plan individually, then explain their priorities to a partner.',
    debrief: 'Which priority did someone else spot that you had missed?',
  },
];

function filterOptions(values, all, selected, e) {
  return `<option value="">${all}</option>${Object.entries(values).map(([value, label]) => `<option value="${e(value)}"${value === selected ? ' selected' : ''}>${e(label)}</option>`).join('')}`;
}

function gameCard(game, { e, actionButton, actor }) {
  return `<article class="panel team-game-card" data-team-game data-format="${e(game.format)}" data-style="${e(game.style)}" aria-labelledby="team-game-${e(game.id)}">
    <div class="team-game-meta"><span>${e(formats[game.format])}</span><span>${e(styles[game.style])}</span><span>${e(game.players)}</span></div>
    <h3 id="team-game-${e(game.id)}">${e(game.title)}</h3>
    <p>${e(game.aim)}</p>
    <details class="team-game-instructions"><summary>Setup and debrief</summary><p>${e(game.setup)}</p><p><strong>After the game</strong> ${e(game.debrief)}</p></details>
    ${actor ? actionButton('Record a game played', 'team-game-played', game.id) : ''}
  </article>`;
}

export function teamGamesIndex({ e, actionButton, actor, civicTools }) {
  const trainingLink = civicTools
    ? '<a href="#training/first-quarter-team-games">First-quarter team games lesson</a>'
    : '<a href="#onboarding">First-quarter team games in onboarding</a>';
  return `<section class="team-games-index" data-team-games-index aria-labelledby="team-games-title">
    <div class="section-heading"><div><h2 id="team-games-title">Team games index</h2><p>Choose a game for your first three months or bring one to a later team session. Use the debrief to see what the team can apply to its civic work.</p></div>${trainingLink}</div>
    <details class="panel team-games-host"><summary>Set up an accessible session</summary>
      <p>Ask people about access needs and offer a seated, spoken, typed or large-print option where it fits. Make most rounds cooperative. Swap roles so everyone can try leading, helping and observing.</p>
      <p>Do the first check-in before recording. Agree who can see recordings and how long they’ll be kept, then confirm everyone’s consent before recording the full game with audio, video and screen capture as suited to the activity.</p>
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
