import { classicGames } from './team-games-classics.mjs';
import { sportGames } from './team-games-sports.mjs';

const formats = {
  board: 'Board games',
  card: 'Card games',
  sport: 'Sports',
  computer: 'Computer games',
  escape: 'Escape rooms',
  conversation: 'Conversation and reflection',
};

const styles = {
  cooperative: 'Cooperative',
  competitive: 'Competitive',
  individual: 'Individual strategy',
};

const selectedFilters = { format: '', style: '' };

export const teamGames = [
  ...classicGames,
  ...sportGames,
  {
    id: 'eco', title: 'Eco', format: 'computer', style: 'cooperative', players: 'Online multiplayer',
    url: 'https://www.play.eco/',
    aim: 'Draft a rule the people affected can understand, challenge and amend.',
    setup: 'Use a prepared world with a working government. Give each player a livelihood and show the group the same watershed data. Draft and vote on a rule about polluting near shared water, with a review date and a clear test for changing it.',
    debrief: 'What would you put in a real policy brief so affected people could check the evidence, contest the rule and propose a change?',
  },
  {
    id: 'democracy-4', title: 'Democracy 4', format: 'computer', style: 'individual', players: 'Single-player',
    url: 'https://positech.co.uk/democracy4/index.html',
    aim: 'Compare policy trade-offs and spot what a simulation assumes about people.',
    setup: 'Start from the same save on two runs. Try a different transport policy in each while keeping other settings as steady as possible. Run three turns and compare the budget, congestion and who benefits in the model.',
    debrief: 'Which assumptions would you verify with Australian evidence before recommending either policy?',
  },
  {
    id: 'suzerain', title: 'Suzerain', format: 'computer', style: 'individual', players: 'Single-player',
    url: 'https://www.suzeraingame.com/',
    aim: 'Practise cabinet deliberation and negotiating constitutional reform in a fictional republic.',
    setup: 'Pause a Sordland run at a constitutional reform decision. Assign people to present competing cabinet or community perspectives before the operator chooses. Record one point each side could accept and one they would take back for consultation.',
    debrief: 'How would you record concessions and dissent so members can see what was agreed and why?',
  },
  {
    id: 'cities-skylines-ii', title: 'Cities: Skylines II', format: 'computer', style: 'individual', players: 'Single-player',
    url: 'https://www.paradoxinteractive.com/games/cities-skylines-ii/about',
    aim: 'Balance access to services, town planning and ongoing costs.',
    setup: 'Load the same established town twice. Use the same spending limit to compare a new bus route with a road expansion. Check who can reach jobs and services, the running cost and which part of town still has a problem.',
    debrief: 'What would you ask residents and planners to check before a council backed either option?',
  },
  {
    id: 'railway-empire-2', title: 'Railway Empire 2', format: 'computer', style: 'cooperative', players: '2–4 online players',
    url: 'https://www.railway-empire2.com/en/',
    aim: 'Design a shared regional network and make the case for the route you fund first.',
    setup: 'Open a prepared PC co-op map with a small rail network. Give the team a budget to link one more town and a freight destination. Split route planning, construction and operating costs, then run the network and fix one connection that fails.',
    debrief: 'Which place or traveller did a focus on profitable routes leave out? How would you show that gap to a regional planning group?',
  },
  {
    id: 'victoria-3', title: 'Victoria 3', format: 'computer', style: 'individual', players: 'Single-player exercise',
    url: 'https://www.paradoxinteractive.com/games/victoria-3/about',
    aim: 'Trace how industrial policy affects jobs, living costs and political support.',
    setup: 'Start twice from the same prepared save. In one run put the next investment into consumer goods, in the other into an industry that supplies businesses. Compare the price of basic goods, changes in employment and which groups gain influence after a year in the game.',
    debrief: 'Which measure would you put beside output growth to show who actually benefited?',
  },
  {
    id: 'offworld-trading-company', title: 'Offworld Trading Company', format: 'computer', style: 'competitive', players: '2–8 online competitors',
    url: 'https://store.steampowered.com/app/271240/Offworld_Trading_Company/',
    aim: 'See what happens when competitors depend on the same market for essentials.',
    setup: 'Run a private match after the tutorial. Pick one shared input and have each player track its price and who supplies it. Pause for a group review after the match and reconstruct what led to the biggest price jump.',
    debrief: 'What signs would justify a closer look at supply concentration in a real community market?',
  },
  {
    id: 'factorio', title: 'Factorio', format: 'computer', style: 'cooperative', players: 'Online or LAN multiplayer',
    url: 'https://factorio.com/game/content',
    aim: 'Find bottlenecks and improve a system that several teams depend on.',
    setup: 'Use a prepared co-op factory with a backed-up production line. Assign supply, assembly and output to different players. Record output for five minutes, fix one bottleneck together, then measure again and hand the system to a different operator.',
    debrief: 'Where does work pile up in a real membership process? What would show that a fix helped the whole team?',
  },
  {
    id: 'overcooked-all-you-can-eat', title: 'Overcooked! All You Can Eat', format: 'computer', style: 'cooperative', players: '2–4 local or online',
    url: 'https://www.team17.com/games/overcooked-all-you-can-eat',
    aim: 'Coordinate an event crew when priorities change and tasks pile up.',
    setup: 'Play the same kitchen twice. First play with your usual roles, then name who is on orders, preparation and service and agree how to call for help. Use Assist Mode if it suits the group.',
    debrief: 'Which signal or handover would carry over to a community stall, public meeting or event crew?',
  },
  {
    id: 'keep-talking-and-nobody-explodes', title: 'Keep Talking and Nobody Explodes', format: 'computer', style: 'cooperative', players: '2+ players, one copy',
    url: 'https://keeptalkinggame.com/',
    aim: 'Give precise briefings and confirm instructions when people can see different things.',
    setup: 'Play an introductory puzzle with one person at the screen and the others using the game manual. Swap roles for a second round. Ask the operator to repeat back the instruction before acting and flag anything ambiguous.',
    debrief: 'What would you say differently on a volunteer support call if you could not see the caller’s screen?',
  },
  {
    id: 'we-were-here-forever', title: 'We Were Here Forever', format: 'computer', style: 'cooperative', players: '2 online players',
    url: 'https://totalmayhemgames.com/games/we-were-here-forever',
    aim: 'Build a shared picture when two people have different information.',
    setup: 'Use separate screens and microphones. Play the opening Castle Rock puzzles as a pair and agree on names for confusing symbols and directions as you encounter them.',
    debrief: 'What did you have to ask before you could act? What shared terms would help two working groups compare notes?',
  },
  {
    id: 'forza-horizon-5', title: 'Forza Horizon 5', format: 'computer', style: 'cooperative', players: 'Online convoy co-op',
    url: 'https://forza.net/forzahorizon5',
    aim: 'Practise fair play and help a mixed-experience team finish together.',
    setup: 'Set up an invite-only convoy and replay a short co-op race with comparable cars. Agree how you will give teammates room and help newcomers recover after a mistake. Compare the two runs for avoidable contact and how many teammates finished.',
    debrief: 'What helped new players stay involved when experienced players could have gone ahead?',
  },
  {
    id: 'hegemony', title: 'Hegemony: Lead Your Class to Victory', format: 'board', style: 'competitive', players: '2–4 players',
    url: 'https://hegemonicproject.com/games/hegemony/hegemony/',
    aim: 'Negotiate a policy when the people affected have competing interests.',
    setup: 'Play the opening round with all four roles if possible. For one proposed policy, have each player explain who would pay, who would benefit and what they would need to change their position.',
    debrief: 'Which interest was missing from the discussion? How would you bring it into a policy workshop?',
  },
  {
    id: 'daybreak', title: 'Daybreak', format: 'board', style: 'cooperative', players: '1–4 players',
    url: 'https://www.daybreakgame.org/',
    aim: 'Coordinate climate action and resilience across jurisdictions.',
    setup: 'Play the first two rounds as different world powers. Explain one local investment and one global project. Check what each did for emissions and which communities are still exposed to crises.',
    debrief: 'When would separate regional projects work better with a shared budget or common plan?',
  },
  {
    id: 'pandemic', title: 'Pandemic', format: 'board', style: 'cooperative', players: '2–4 players',
    url: 'https://www.zmangames.com/game/pandemic/',
    aim: 'Coordinate specialised roles and adapt a shared plan under pressure.',
    setup: 'Give each player a different role. Before the first round, agree where to concentrate your efforts. At the first epidemic card, pause between turns and have each player explain what changed and how they can help.',
    debrief: 'What would a real emergency team need to hear in the first minute of a handover?',
  },
  {
    id: 'spirit-island', title: 'Spirit Island', format: 'board', style: 'cooperative', players: '1–4 players',
    url: 'https://shop.greaterthangames.com/products/spirit-island',
    aim: 'Plan interventions with different powers and deadlines.',
    setup: 'Play two opening rounds with different spirits. Agree which threatened land each player can cover, then call out which powers need to resolve first to make the plan work.',
    debrief: 'Which dependencies would your working groups need to communicate before launching a shared project?',
  },
  {
    id: 'sky-team', title: 'Sky Team', format: 'board', style: 'cooperative', players: '2 players',
    url: 'https://www.scorpionmasque.com/en/sky-team',
    aim: 'Agree on a plan before two people have to act independently.',
    setup: 'Play the first airport scenario with one pilot and one co-pilot. Use the planning phase to agree which tasks come first. Follow the game’s communication limits after rolling, then swap roles for another landing.',
    debrief: 'Which decisions need an agreed signal or a fallback plan when two volunteers work apart?',
  },
  {
    id: 'power-grid-recharged', title: 'Power Grid: Recharged', format: 'board', style: 'competitive', players: '2–6 players',
    url: 'https://www.riograndegames.com/games/power-grid-recharged/',
    aim: 'Explore how fuel markets and infrastructure costs affect access to energy.',
    setup: 'Play the opening three rounds, noting what happens to fuel prices as players bid for new plants and connect cities. At a break, compare how much unused capacity each network is paying for.',
    debrief: 'What would a public energy plan need to account for alongside profit and the number of connections?',
  },
  {
    id: 'the-kings-dilemma', title: 'The King’s Dilemma', format: 'board', style: 'competitive', players: '3–5 players',
    url: 'https://horribleguild.com/eu/product/the-kings-dilemma/',
    aim: 'Practise tracking commitments and reasons during a council vote.',
    setup: 'Play the opening dilemmas. For one vote, record the reason each house gave, a deal that changed the outcome and a consequence revealed by the game.',
    debrief: 'Which parts of the vote, dissent and follow-up should a real decision register make visible?',
  },
  {
    id: 'the-crew-mission-deep-sea', title: 'The Crew: Mission Deep Sea', format: 'card', style: 'cooperative', players: '2–5 players',
    url: 'https://www.thamesandkosmos.co.uk/product/the-crew-mission-deep-sea/',
    aim: 'Coordinate interdependent jobs with a limited way to communicate.',
    setup: 'Play three opening missions. If a mission fails, trace which task depended on a particular trick and identify a signal allowed by the rules that might have helped before you retry.',
    debrief: 'What one-line status update would let a teammate act at the right time?',
  },
  {
    id: 'hanabi', title: 'Hanabi', format: 'card', style: 'cooperative', players: '2–5 players',
    url: 'https://rnrgames.com/hanabi',
    aim: 'Choose what to communicate when you see information your teammates cannot.',
    setup: 'Play a round with everyone’s hand facing out as the rules specify. Afterwards, reconstruct a moment where a colour or number clue was read differently from what the giver intended.',
    debrief: 'Which assumption would you write down before acting on someone else’s update?',
  },
  {
    id: 'fox-in-the-forest-duet', title: 'Fox in the Forest Duet', format: 'card', style: 'cooperative', players: '2 players',
    url: 'https://renegadegamestudios.com/fox-in-the-forest-duet/',
    aim: 'Plan ahead so a move that helps you now also helps your partner next.',
    setup: 'Play the first round, tracking when the winner of a trick moves the team marker further than you intended. Between rounds, compare where you each thought the other was trying to go.',
    debrief: 'When should a team hand over control so the shared task stays on track?',
  },
  {
    id: 'regicide', title: 'Regicide', format: 'card', style: 'cooperative', players: '1–4 players',
    url: 'https://www.regicidegame.com/',
    aim: 'Allocate limited resources between immediate results and team capacity.',
    setup: 'Play through the opening jacks with the published rules. Between turns, compare a moment when drawing cards for the group would help more than taking the strongest immediate action.',
    debrief: 'Which kind of support would make a real working group better able to handle the next task?',
  },
  {
    id: 'codenames-duet', title: 'Codenames: Duet', format: 'card', style: 'cooperative', players: '2+ players',
    url: 'https://www.czechgames.com/games/codenames-duet',
    aim: 'Choose words that mean the same thing to someone with different information.',
    setup: 'Play two grids using the published rules. Compare which clue led your teammate to an unintended word and which clue made an unfamiliar connection clear.',
    debrief: 'What is one plain-language edit you would make to a civic briefing?',
  },
  {
    id: 'the-emerald-flame', title: 'The Emerald Flame', format: 'escape', style: 'cooperative', players: 'Solo or team, best with 2–4',
    url: 'https://www.getpostcurious.com/game-library/the-emerald-flame',
    aim: 'Piece together evidence and explain where a conclusion came from.',
    setup: 'Play the first episode of the boxed puzzle adventure. Keep a list of unresolved clues and hand over a finding with its source before switching to another thread.',
    debrief: 'Which details would help someone new pick up a real inquiry without repeating your work?',
  },
  {
    id: 'exit-the-pharaohs-tomb', title: 'EXIT: The Pharaoh’s Tomb', format: 'escape', style: 'cooperative', players: '1–4 players',
    url: 'https://thamesandkosmos.com/products/exit-pharaohs-tomb',
    aim: 'Make a timely decision while giving a second person a chance to check it.',
    setup: 'Play the boxed escape room. Agree when the group will use a hint, and have a second player check what supports a proposed solution before you enter it on the decoder.',
    debrief: 'How could you keep independent review fast on a real deadline?',
  },
  {
    id: 'unlock-epic-adventures', title: 'Unlock! Epic Adventures', format: 'escape', style: 'cooperative', players: '1–6 players',
    url: 'https://www.asmodeenordics.com/product/unlock-epic-adventures/',
    aim: 'Keep track of parallel clue threads when several people are working at once.',
    setup: 'Play Mission #07 using the companion app. Have one person keep track of open leads, then ask another to explain why two objects belong together before trying a combination.',
    debrief: 'What would help several people check evidence on a deadline without losing a promising lead?',
  },
  {
    id: 'wavelength', title: 'Wavelength', format: 'conversation', style: 'competitive', players: '4–12 for team play',
    url: 'https://www.cmyk.games/products/wavelength',
    aim: 'Find out where people use the same words to mean different things.',
    setup: 'Play the boxed game in two teams. After a round with a split opinion, ask each person what the ends of the spectrum meant to them before you discuss what the clue giver intended.',
    debrief: 'Which phrase in a draft policy would benefit from a concrete example or a shared definition?',
  },
  {
    id: 'just-one', title: 'Just One', format: 'conversation', style: 'cooperative', players: '3–7 players',
    url: 'https://www.rprod.com/en/games/just-one',
    aim: 'Explain an unfamiliar idea in words another person can understand.',
    setup: 'Play the standard clue rounds and rotate who guesses. Note a case where duplicate clues were removed and an unexpected clue did more to help the guesser.',
    debrief: 'What example or plain word would make a membership briefing easier for someone new to follow?',
  },
];

function filterOptions(values, all, selected, e) {
  return `<option value="">${all}</option>${Object.entries(values).map(([value, label]) => `<option value="${e(value)}"${value === selected ? ' selected' : ''}>${e(label)}</option>`).join('')}`;
}

function gameCard(game, { e, actionButton, actor }) {
  const sourceLabel = game.format === 'sport' ? 'Rules' : 'Game site';
  return `<article class="panel team-game-card" data-team-game data-format="${e(game.format)}" data-style="${e(game.style)}" aria-labelledby="team-game-${e(game.id)}">
    <div class="team-game-meta"><span>${e(formats[game.format])}</span><span>${e(styles[game.style])}</span><span>${e(game.players)}</span></div>
    <h3 id="team-game-${e(game.id)}">${e(game.title)}</h3>
    <p>${e(game.aim)}</p>
    <details class="team-game-instructions"><summary>Setup and debrief</summary><p>${e(game.setup)}</p><p><strong>After the game</strong> ${e(game.debrief)}</p></details>
    <div class="button-row">
      <a class="button quiet" href="${e(game.url)}" target="_blank" rel="noopener noreferrer" aria-label="${e(game.title)} ${sourceLabel.toLowerCase()} (opens in a new tab)">${sourceLabel} ↗</a>
      ${actor ? actionButton('Record a game played', 'team-game-played', game.id) : ''}
    </div>
  </article>`;
}

export function teamGamesIndex({ e, actionButton, actor, civicTools }) {
  const trainingLink = civicTools
    ? '<a href="#training/first-quarter-team-games">First-quarter team games lesson</a>'
    : '<a href="#onboarding">First-quarter team games in onboarding</a>';
  return `<section class="team-games-index" data-team-games-index aria-labelledby="team-games-title">
    <div class="section-heading"><div><h2 id="team-games-title">Team games index</h2><p>Pick a classic, a newer game or a sport for your next session. Applicants can name games during onboarding, and members can suggest them at any time.</p></div></div>
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
