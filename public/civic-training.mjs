import { trainingTracks } from './civic-training-data.mjs';
import { trainingPathways } from './civic-training-pathways.mjs';

const modules = [...trainingTracks.flatMap(track => track.modules), ...trainingPathways];
const moduleIds = new Set(modules.map(module => module.id));
const completedThisVisit = new Set();
const progressKey = (actorId, moduleId) => `p4a-training-v1/${encodeURIComponent(actorId)}/${moduleId}`;

function isLocallyComplete(actorId, moduleId) {
  const key = progressKey(actorId, moduleId);
  try {
    return localStorage.getItem(key) === 'complete' || completedThisVisit.has(key);
  } catch {
    return completedThisVisit.has(key);
  }
}

function completedModules(actorId, sharedIds) {
  const completed = new Set(sharedIds);
  return new Set([...moduleIds].filter(id => completed.has(id) || isLocallyComplete(actorId, id)));
}

export function trainingProgress(actorId, sharedIds = []) {
  return { completed: completedModules(actorId, sharedIds).size, total: moduleIds.size };
}

function moduleCard(module, completed, e) {
  return `<li><a href="#training/${e(module.id)}">
    <span><strong>${e(module.title)}</strong><span>${e(module.summary)}</span></span>
    <small>${completed.has(module.id) ? 'Complete' : `${e(module.minutes)} min`}</small>
  </a></li>`;
}

function pathwayCard(module, completed, e) {
  const level = module.id === 'federal' ? 'House and Senate'
    : module.id === 'act' ? 'Legislative Assembly'
    : module.id === 'nt' ? 'Territory and local elections'
    : 'State and local elections';
  return `<li><a href="#training/${e(module.id)}">
    <strong>${e(module.title)}</strong>
    <span>${e(level)}${completed.has(module.id) ? ' · Complete' : ''}</span>
  </a></li>`;
}

function electionPathways(completed, e) {
  return `<nav class="panel training-pathways" aria-labelledby="training-pathways-title">
    <h2 id="training-pathways-title">Election guides by place</h2>
    <p>Check who runs the election, how candidates get on the ballot and which campaign rules apply.</p>
    <ul>${trainingPathways.map(module => pathwayCard(module, completed, e)).join('')}</ul>
  </nav>`;
}

function completionCount(track, completed) {
  const count = track.modules.filter(module => completed.has(module.id)).length;
  return `${count} of ${track.modules.length} complete`;
}

function trainingSources(sources, e) {
  return `<ul class="training-sources">${sources.map(([label, url]) => {
    const internal = url.startsWith('#');
    return `<li><a href="${e(url)}"${internal ? '' : ' target="_blank" rel="noopener noreferrer"'}>${e(label)}${internal ? '' : ' ↗'}</a></li>`;
  }).join('')}</ul>`;
}

export function trainingView(id, actorId, { e, heading, sharedCompleted }) {
  const completed = completedModules(actorId, sharedCompleted || []);
  const progressNote = sharedCompleted
    ? 'New completions save to your profile. Earlier progress in this browser also counts here.'
    : 'Progress is saved in this browser.';
  const selectedTrack = trainingTracks.find(item => item.id === id);
  if (selectedTrack) {
    const electionGuides = selectedTrack.id === 'running-for-office' || selectedTrack.id === 'volunteering';
    return `<div class="civic-training-page"><a href="#training" class="back-link">← Civic training</a>
      ${heading('Civic training', selectedTrack.title, selectedTrack.description)}
      <section class="panel wide-panel training-track" aria-labelledby="training-${e(selectedTrack.id)}">
        <div class="training-track-heading"><h2 id="training-${e(selectedTrack.id)}">Lessons</h2><small>${completionCount(selectedTrack, completed)}</small></div>
        <ul class="training-module-list">${selectedTrack.modules.map(module => moduleCard(module, completed, e)).join('')}</ul>
      </section>
      <section class="panel wide-panel training-practice"><h2>Put the values into practice</h2><p>${e(selectedTrack.practice)}</p>
        ${selectedTrack.id === 'member-induction' ? '' : '<p><a href="#training/joyful-responsible-abundance">Explore Joyful Responsible Abundance →</a></p>'}
      </section>
      ${electionGuides ? electionPathways(completed, e) : ''}
      <p class="training-note">${progressNote}</p></div>`;
  }
  const track = trainingTracks.find(item => item.modules.some(module => module.id === id));
  const pathway = trainingPathways.find(module => module.id === id || (id === 'qld' && module.id === 'queensland-council-nomination'));
  if (!track && !pathway) {
    return `<div class="civic-training-page">${heading('P4A workspace', 'Civic training', 'Learn to contribute in ways that inspire truth, build trust and give everyone a fair go.')}
      <nav class="training-entry" aria-labelledby="training-entry-title">
        <h2 id="training-entry-title">What would you like to do?</h2>
        <ul class="training-tracks">${trainingTracks.map(item => `<li><a href="#training/${e(item.id)}">
          <h3>${e(item.entryTitle || item.title)}</h3>
          <p>${e(item.description)}</p>
          <small>${completionCount(item, completed)}</small>
        </a></li>`).join('')}</ul>
      </nav>
      <section class="panel training-practice"><h2>Joyful Responsible Abundance</h2><p>Look for what makes life better, take responsibility for the effects of your work and leave something others can use.</p><p><a href="#training/joyful-responsible-abundance">Try the values lesson →</a></p></section>
      ${electionPathways(completed, e)}
      <p class="training-note">${progressNote} If an election requires training, use the official provider linked in its guide.</p></div>`;
  }

  const index = track?.modules.findIndex(module => module.id === id);
  const module = pathway || track.modules[index];
  const next = track?.modules[index + 1];
  const region = module.id === 'queensland-council-nomination' ? 'qld' : module.id;
  const status = completed.has(module.id) ? 'Complete' : '';
  const backUrl = track ? `#training/${track.id}` : '#training';
  const backLabel = track?.title || 'All election guides';
  return `<div class="civic-training-page"><a href="${e(backUrl)}" class="back-link">← ${e(backLabel)}</a>
    ${heading(track?.title || 'Election pathway', module.title, module.summary)}
    <article class="panel wide-panel training-lesson">
      <p class="training-note">${e(module.minutes)} min${track ? ` · Module ${index + 1} of ${track.modules.length}` : ''}</p>
      ${module.sections.map(section => `<section><h2>${e(section.title)}</h2><p>${e(section.body)}</p></section>`).join('')}
      ${module.quote ? `<section><h2>Keep commitments over time</h2><figure class="training-quote"><blockquote>${module.quote.lines.map(line => `<p>${e(line)}</p>`).join('')}</blockquote><figcaption>${e(module.quote.credit)}</figcaption></figure><p>${e(module.quote.reflection)}</p></section>` : ''}
      <form class="training-exercise" data-training-module="${e(module.id)}">
        <h2>Try a scenario</h2>
        <fieldset><legend>${e(module.exercise.question)}</legend>
          ${module.exercise.options.map((option, optionIndex) => `<label><input type="radio" name="answer" value="${optionIndex}" required><span>${e(option.label)}</span></label>`).join('')}
        </fieldset>
        <div class="button-row"><button type="submit" class="button secondary">Check my answer</button><small data-training-status>${status}</small></div>
        <p class="training-feedback" data-training-feedback role="status" aria-atomic="true"></p>
      </form>
      ${module.regions ? `<section class="training-regions"><h2>Staffing arrangements around Australia</h2>
        <p>Sources checked <time datetime="2026-11-12">12 November 2026</time>. Check the current rules for your office before hiring.</p>
        ${module.regions.map(area => `<details><summary>${e(area.title)}</summary><p>${e(area.body)}</p>${trainingSources(area.sources, e)}</details>`).join('')}
      </section>` : ''}
      ${module.sources.length ? `<section><h2>Read more</h2>${trainingSources(module.sources, e)}</section>` : ''}
      <div class="button-row training-next"><a href="${e(backUrl)}" class="button quiet">${e(backLabel)}</a>${module.id === 'first-quarter-team-games' ? '<a href="#gamify/games" class="button secondary">Browse team games →</a>' : ''}${pathway
        ? `<a href="#training/volunteering" class="button secondary">Volunteer in a campaign →</a><a href="#readiness/${e(region)}" class="button secondary">See election dates and funding →</a>`
        : next ? `<a href="#training/${e(next.id)}" class="button">Next module →</a>` : ''}</div>
    </article></div>`;
}

export function mountTraining(root, actorId, { sharedCompleted = [], completeModule } = {}) {
  const form = root.querySelector('[data-training-module]');
  if (!form) return;
  const module = modules.find(item => item.id === form.dataset.trainingModule);
  if (!module) return;
  const shared = new Set(sharedCompleted);
  const submit = form.querySelector('button[type="submit"]');
  const status = form.querySelector('[data-training-status]');
  const feedback = form.querySelector('[data-training-feedback]');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    const option = module.exercise.options[form.elements.answer.value];
    if (!option) return;
    feedback.textContent = `${option.correct ? 'Correct.' : 'Try again.'} ${option.feedback}`;
    feedback.dataset.correct = String(option.correct);
    if (!option.correct) return;

    const key = progressKey(actorId, module.id);
    completedThisVisit.add(key);
    let localStatus = 'Complete';
    try {
      localStorage.setItem(key, 'complete');
    } catch {
      localStatus = 'Complete for this visit';
    }
    if (!completeModule || shared.has(module.id)) {
      status.textContent = shared.has(module.id) ? 'Complete' : localStatus;
      return;
    }

    submit.disabled = true;
    status.textContent = 'Saving to your profile…';
    try {
      await completeModule(module.id);
      shared.add(module.id);
      status.textContent = 'Complete';
    } catch {
      status.textContent = localStatus === 'Complete' ? 'Complete in this browser' : localStatus;
      feedback.textContent += ' Your profile could not be updated. Check your answer again to retry.';
    } finally {
      submit.disabled = false;
    }
  });
}
