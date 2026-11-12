import test from 'node:test';
import assert from 'node:assert/strict';
import { electoralJurisdictions } from '../public/electoral-readiness-data.mjs';
import { countdown, readinessView, refreshClocks, shiftCalendarMonths } from '../public/electoral-readiness.mjs';
import { administrativeEstimate, electionEstimate } from '../public/electoral-funding.mjs';
import { fundingByJurisdiction, regionalEnrolment } from '../public/electoral-funding-data.mjs';
import { trainingPathways } from '../public/civic-training-pathways.mjs';
import { trainingView } from '../public/civic-training.mjs';
import { officeTrainingTrack } from '../public/civic-office-training.mjs';
import { trainingTracks } from '../public/civic-training-data.mjs';

const helpers = {
  e: value => String(value),
  heading: (_section, title) => `<h1>${title}</h1>`,
  icon: () => '',
};

test('the six-month readiness target uses calendar months, clamped at month end', () => {
  assert.equal(shiftCalendarMonths('2028-08-31', -6), '2028-02-29');
  assert.equal(shiftCalendarMonths('2027-08-31', -6), '2027-02-28');
  assert.equal(shiftCalendarMonths('2027-02-24', -6), '2026-08-24');
});

test('a countdown distinguishes the date, local cutoff, and closure', () => {
  assert.deepEqual(countdown('2026-11-09', '12:00', { date: '2026-11-08', minutes: 0 }, 'Closed'), { label: '1 day to go', tone: 'future' });
  assert.deepEqual(countdown('2026-11-09', '12:00', { date: '2026-11-09', minutes: 719 }, 'Closed'), { label: '1 min to go', tone: 'today' });
  assert.deepEqual(countdown('2026-11-09', '12:00', { date: '2026-11-09', minutes: 720 }, 'Closed'), { label: 'Closed', tone: 'past' });
  assert.equal(countdown('2026-11-09', '', { date: '2026-11-09', minutes: 1439 }, 'Date passed').label, 'Today');
});

test('the same instant uses the jurisdiction’s local day and cutoff', () => {
  const now = new Date('2026-11-08T23:30:00Z');
  const timer = { dataset: { readinessCountdown: '2026-11-09', cutoff: '10:00', pastLabel: 'Closed' } };
  const root = timeZone => ({ querySelector: () => ({
    dataset: { readinessTimeZone: timeZone }, querySelectorAll: () => [timer],
  }) });
  refreshClocks(root('Australia/Melbourne'), now);
  assert.equal(timer.textContent, 'Closed');
  refreshClocks(root('Australia/Perth'), now);
  assert.equal(timer.textContent, '2 hr 30 min to go');
});

test('all nine jurisdictions show sourced stages and doubled eligible-member targets', () => {
  assert.deepEqual(electoralJurisdictions.map(item => item.id).sort(), ['act', 'federal', 'nsw', 'nt', 'qld', 'sa', 'tas', 'vic', 'wa']);
  for (const jurisdiction of electoralJurisdictions) {
    const markup = readinessView(jurisdiction.id, helpers, new Date('2026-11-12T00:00:00Z'));
    const dated = jurisdiction.stages.filter(stage => stage.date);
    assert.equal((markup.match(/data-readiness-countdown=/g) || []).length, dated.length * 2, jurisdiction.id);
    assert.ok(markup.includes(`<strong>${(jurisdiction.minimum * 2).toLocaleString('en-AU')}</strong>`), jurisdiction.id);
    assert.ok(jurisdiction.stages.every(stage => stage.source.startsWith('https://')), jurisdiction.id);
    assert.ok(markup.includes(jurisdiction.switching), jurisdiction.id);
    assert.equal(markup.includes('How the Senate ballot works'), jurisdiction.id === 'federal', jurisdiction.id);
  }
  const federal = readinessView('federal', helpers);
  assert.match(federal, /Ungrouped<\/strong> column below the line/);
  assert.match(federal, /practice-senate\.htm/);
  const tasmania = readinessView('tas', helpers);
  assert.match(tasmania, /Assembly voting day<\/h3><span[^>]*>Date to be confirmed/);
  assert.match(tasmania, /Scheduled end of Assembly term/);
});

test('the training catalogue and election guides link to an exercise for every jurisdiction', () => {
  const catalogue = trainingView(undefined, 'test-actor', helpers);
  const pathwayRegions = trainingPathways.map(module => module.id === 'queensland-council-nomination' ? 'qld' : module.id);
  assert.deepEqual(pathwayRegions.sort(), electoralJurisdictions.map(region => region.id).sort());
  for (const module of trainingPathways) {
    const region = module.id === 'queensland-council-nomination' ? 'qld' : module.id;
    assert.ok(catalogue.includes(`href="#training/${module.id}"`), module.id);
    assert.ok(readinessView(region, helpers).includes(`href="#training/${region}"`), region);
    const lesson = trainingView(region, 'test-actor', helpers);
    assert.ok(lesson.includes(`<h1>${module.title}</h1>`), module.id);
    assert.ok(lesson.includes(`data-training-module="${module.id}"`), module.id);
    assert.ok(lesson.includes(`href="#readiness/${region}"`), module.id);
    assert.equal(module.exercise.options.filter(option => option.correct).length, 1, module.id);
    assert.ok(module.sources.length > 0 && module.sources.every(([, url]) => url.startsWith('https://')), module.id);
  }
});

test('serving in office covers staffing in every jurisdiction and links to the official role explainers', () => {
  const catalogue = trainingView('serving-in-office', 'test-actor', helpers);
  const [staffing, roles] = officeTrainingTrack.modules;
  assert.ok(catalogue.includes('Serving in office'));
  const running = trainingTracks.find(track => track.id === 'running-for-office');
  assert.equal(running.modules[0].id, 'state-and-federal-ballots');
  assert.equal(running.modules.some(module => module.id === 'what-councillors-do'), false);
  assert.match(trainingView('what-councillors-do', 'test-actor', helpers), /What does a local councillor do\?/);
  assert.deepEqual(staffing.regions.map(area => area.title).sort(), electoralJurisdictions.map(region => region.id === 'federal' ? 'Federal Parliament' : region.name).sort());
  for (const module of [staffing, roles]) {
    assert.ok(catalogue.includes(`href="#training/${module.id}"`));
    assert.equal(module.exercise.options.filter(option => option.correct).length, 1);
  }
  const staffingLesson = trainingView(staffing.id, 'test-actor', helpers);
  assert.equal((staffingLesson.match(/<details>/g) || []).length, 9);
  const rolesLesson = trainingView(roles.id, 'test-actor', helpers);
  assert.match(rolesLesson, /Usher of the Black Rod/);
  assert.match(rolesLesson, /https:\/\/www\.gg\.gov\.au\/about-governor-general\/civics-and-democracy/);
});

test('civic training offers four entry points and practical volunteer training from preparation to office', () => {
  const actor = 'test-actor';
  const catalogue = trainingView(undefined, actor, helpers);
  const entryTracks = ['member-induction', 'volunteering', 'running-for-office', 'serving-in-office'];
  assert.deepEqual(trainingTracks.map(track => track.id), entryTracks);
  for (const id of entryTracks) {
    assert.ok(catalogue.includes(`href="#training/${id}"`));
    assert.match(trainingView(id, actor, helpers), /Put the values into practice/);
  }
  const volunteerIds = ['find-volunteer-role', 'prepare-to-volunteer', 'volunteer-during-campaign', 'volunteer-during-voting', 'close-out-campaign', 'volunteer-after-election'];
  const volunteering = trainingTracks.find(track => track.id === 'volunteering');
  assert.deepEqual(volunteering.modules.map(module => module.id), volunteerIds);
  for (const module of volunteering.modules) {
    const lesson = trainingView(module.id, actor, helpers);
    assert.ok(lesson.includes(`data-training-module="${module.id}"`));
    assert.ok(lesson.includes('href="#training/volunteering"'));
    assert.equal(module.exercise.options.filter(option => option.correct).length, 1);
  }
  const valuesLesson = trainingView('joyful-responsible-abundance', actor, helpers);
  assert.match(valuesLesson, /superintelligence/);
  assert.match(valuesLesson, /fair chance to thrive/);
});

test('statewide references reconcile to the official federal enrolment snapshot', () => {
  const { federal, ...regions } = regionalEnrolment;
  assert.equal(Object.values(regions).reduce((sum, region) => sum + region.enrolled, 0), federal.enrolled);
});

test('election estimates use formal votes and distinguish capped, direct and unavailable funding', () => {
  const scenario = { enrolled: 100000, formalPercent: 90, voteShare: 4, scope: 'single', spend: 3000 };
  const queensland = electionEstimate(fundingByJurisdiction.qld.schemes[0], scenario);
  assert.equal(queensland.formalVotes, 90000);
  assert.equal(queensland.votes, 3600);
  assert.equal(queensland.estimate, 3000);
  assert.equal(electionEstimate(fundingByJurisdiction.wa.schemes[0], scenario).qualified, false);
  assert.equal(electionEstimate(fundingByJurisdiction.act.schemes[0], scenario).estimate, 3600 * 7.57412);
  assert.equal(electionEstimate(fundingByJurisdiction.nt.schemes[0], scenario).estimate, 0);
});

test('federal automatic funding is included once and SA tapers above 10% of all formal votes', () => {
  const scenario = { enrolled: 100000, formalPercent: 100, voteShare: 20, scope: 'qualifying', spend: 50000 };
  const federal = fundingByJurisdiction.federal.schemes[2];
  assert.equal(electionEstimate(federal, scenario).estimate, 50000);
  assert.equal(electionEstimate(federal, { ...scenario, spend: 1000 }).estimate, 12379);
  const southAustralia = fundingByJurisdiction.sa.schemes[0];
  assert.equal(electionEstimate(southAustralia, { ...scenario, scope: 'single', spend: 200000 }).estimate, 121000);
});

test('administrative funding follows the chamber, stepped and banded ceilings', () => {
  assert.equal(administrativeEstimate(fundingByJurisdiction.federal.administration, 2, 3), 26250);
  assert.equal(administrativeEstimate(fundingByJurisdiction.vic.administration, 3), 469370);
  assert.equal(administrativeEstimate(fundingByJurisdiction.nsw.administration, 4), 279200);
  assert.equal(administrativeEstimate(fundingByJurisdiction.tas.administration, 5), 23100);
  assert.equal(administrativeEstimate(fundingByJurisdiction.tas.administration, 6), 39400);
});
