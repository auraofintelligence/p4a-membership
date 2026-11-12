import {rememberScrollPositions, restoreScrollPositions, focusSelectedClause} from './scroll-memory.mjs';
import {civicIcon, compactLabels} from './civic-icons.mjs';
import {homeDoors, campaignsView, campaignReplicationPrompt, localNodesView, redlandsCivicLab} from './local-nodes.mjs';
import {constitutionView, selectClause, draftMarkdown} from './constitution.mjs';
import {trialView, handleTrialAction, trialAuditRecord} from './constitution-trial.mjs';
import {gamifyView, loadGamify, handleGamifyClick, handleGamifySubmit, handleGamifyChange} from './gamify.mjs';
import {jraSource, jraValues} from './jra-values.mjs';
import {onboardingView} from './onboarding.mjs';
const $ = (s, root = document) => root.querySelector(s);
const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths = {arrow:'M5 12h14 M13 6l6 6-6 6',plus:'M12 5v14 M5 12h14',out:'M14 3h7v7 M21 3 10 14 M10 3H3v18h18v-7',check:'M5 12l4 4L19 6'};
const icon = key => civicIcon(key) || (paths[key] ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[key]}"/></svg>` : '');
const themes = {'everyday-life':'Everyday life','missing-middle':'Missing Middle','verse-box':'Verse Box','civic-evidence':'Civic evidence','local-care':'Local care'};
const workspaceRoutes = [['home','Your workspace'],['onboarding','Membership onboarding'],['training','Civic training'],['projects','Shared projects'],['priority','What matters now'],['people','People & relationships'],['groups','Working groups'],['nodes','Local nodes'],['campaigns','Campaign Command Centre'],['readiness','Electoral readiness'],['hours','Contributions'],['gamify','Gamify Democracy']];
const accountabilityRoutes = [['transparency','Open transparency'],['resources','Connected ideas'],['constitution','Constitution workbench'],['profile','Your membership']];
const resources = [
  {icon:'abundance',name:'Joyful Responsible Abundance',label:'Purpose & perspective',description:'Explore how truth, responsibility and shared capacity can widen people’s opportunities as AI advances.',url:jraSource},
  {icon:'missing-middle',name:'Installing the Missing Middle',label:'Local infrastructure',description:'Explore community compute, useful workloads, ownership and renewal.',url:'https://auraofintelligence.github.io/installing-the-missing-middle/'},
  {icon:'verse-box',name:'The Verse Box',label:'An assisted way in',description:'A proposed place to learn, try something useful and take your work home.',url:'https://auraofintelligence.github.io/aura-verse-box/'},
  {icon:'relevance',name:'Your Relevance',label:'Start with your life',description:'Optional private reflection, with a choice about what you share.',url:'https://p4a.xyz/pages/your-relevance.html'},
  {icon:'bills',name:'Household Bill Check',label:'Free public tool',description:'Investigate contracts and fees, and keep your case files in your control.',url:'https://auraofintelligence.github.io/household-bill-check/'},
  {icon:'legal',name:'Australian Legal Engine',label:'Free local research',description:'Explore the source project for provision retrieval and cited research.',url:'https://github.com/auraofintelligence/australian-legal-engine'},
  {icon:'committees',name:'Committees & inquiries',label:'Public participation',description:'Follow the separately maintained public project and official invitations.',url:'https://auraofintelligence.github.io/p4a-xyz-committees-inquiries/'},
  {icon:'twins',name:'Straddie Twins',label:'Place & possibility',description:'Explore two distinct approaches to local observations and simulations.',url:'https://auraofintelligence.github.io/straddie-twins/'},
  {icon:'scan',name:'Scan to Twin',label:'Local 3D modelling',description:'Turn a phone scan into a measured 3D model or drawing on your own machine.',url:'https://auraofintelligence.github.io/straddie-digital-twin-explainer/scan-to-twin.html'},
  redlandsCivicLab,
  {icon:'hours',name:'C-Hours',label:'Freely given contribution',description:'One verified hour, counted once. Time retains its own meaning.',url:'https://auraofintelligence.github.io/C-Hour-introduction/'},
  {icon:'genesis',name:'Aura Genesis & Truth Engine',label:'HBOT & personal digital twins',description:'The proposed protocol starts with a retrofit of a standard mask-fed HBOT chamber to support detailed digital twins of body and mind. The crystalline Geode pictured is a future concept.',url:'https://auraofintelligence.github.io/aura-genesis-geode-atlas/'}
];
let state = {people:[],groups:[],projects:[],memberships:[],contributions:[],decisions:[],activity:[],actor:null,billing:{enabled:false},integrations:{}};
let noticeTimer, dialogReturnFocus;
const pendingCommands = new Map();
const initials = name => String(name || '?').split(/\s+/).slice(0,2).map(s=>s[0]).join('');
const person = id => state.people.find(p=>p.id===id);
const group = id => state.groups.find(g=>g.id===id);
const project = id => state.projects.find(p=>p.id===id);
const isOrganiser = () => state.actor?.role === 'organiser';
const isPilot = () => state.mode === 'pilot';
const isLocalReview = () => state.mode === 'demo' && !state.preview;
const hasCivicTools = () => isPilot() || isLocalReview();
const isParticipant = p => isOrganiser() || p.participantIds?.includes(state.actor?.id);
const dateText = date => date ? new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'short',year:'numeric',timeZone:'Australia/Brisbane'}).format(new Date(date.length === 10 ? `${date}T00:00:00+10:00` : date)) : 'Not set';
const today = () => new Date().toLocaleDateString('en-CA',{timeZone:'Australia/Brisbane'});
const tag = (label,tone='') => `<span class="chip ${tone}">${e(label)}</span>`;
const statusTone = status => ['active','verified','accepted','complete'].includes(status) ? 'green' : ['pending','review'].includes(status) ? 'orange' : 'gray';
const safeUrl = value => {try {const u=new URL(value);return u.protocol==='https:'?u.href:null;}catch{return null;}};
const sourceLink = value => safeUrl(value) ? `<a class="source-link" href="${e(safeUrl(value))}" target="_blank" rel="noopener noreferrer">Read the supporting source ↗</a>` : '';
const actionButton = (label, action, id='', classes='secondary', extra='') => `<button class="button ${classes}" data-action="${action}" data-id="${e(id)}" ${extra}>${e(label)}</button>`;
const canEdit = p => isOrganiser() || p.ownerId === state.actor?.id;

let readiness;
let readinessTimer;
let training;
let applicationReview;
async function api(path, options={}) {
  const response = await fetch(path,{credentials:'same-origin',...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...options.headers}});
  const data = await response.json();
  if(!response.ok) {const err=new Error(data.error || 'We could not complete that action.');err.status=response.status;throw err;}
  return data;
}
async function load(){state=await api('/api/bootstrap');for(const key of ['people','groups','projects','memberships','contributions','financialContributions','decisions','activity'])state[key] ||= [];if(!isPilot())await loadGamify(api);}
function notify(message){clearTimeout(noticeTimer);$('#notice').textContent=message;$('#notice').hidden=false;noticeTimer=setTimeout(()=>$('#notice').hidden=true,6000);}
async function command(type,data){
  const key=JSON.stringify({actorId:state.actor?.id,type,data});
  const id=pendingCommands.get(key)||crypto.randomUUID();pendingCommands.set(key,id);
  try {await api('/api/commands',{method:'POST',body:JSON.stringify({id,revision:state.revision,type,data})});await load();render();pendingCommands.delete(key);}
  catch(err){if(err.status===409){await load();if(err.message.toLowerCase().includes('workspace changed'))throw new Error('The workspace changed while you were editing. Your draft is still here. Review it and save again.');}throw err;}
}
function resourceCard(r){return `<a class="resource-card" href="${e(r.url)}" target="_blank" rel="noopener noreferrer">${r.icon?icon(r.icon):''}<small>${e(r.label)} <span class="arrow">↗</span></small><h3>${e(r.name)}</h3><p>${e(r.description)}</p></a>`;}
function heading(eyebrow,title,copy,button=''){return `<div class="page-heading"><div><span class="eyebrow">${e(eyebrow)}</span><h1>${e(title)}</h1><p>${e(copy)}</p></div>${button}</div>`;}
function requireMember() {
  if (isPilot()) return `<div class="panel wide-panel"><h2>Workspace sign-in required</h2><p class="muted">Sign in with your invited account.</p></div>`;
  return `<div class="panel wide-panel"><h2>A place to participate</h2><p class="muted">Sign in to manage your details, work with a group and contribute to shared projects.</p>${state.mode==='demo'?`<div class="button-row subheading">${actionButton('Explore as a member','demo-member','','')}${actionButton('Explore as an organiser','demo-organiser')}</div><p class="muted">This local review uses fictional people and projects.</p>`:'<div class="callout">Member sign-in is awaiting configuration. Public resources and transparency remain open.</div>'}</div>`;
}
function projectCard(p){const done=(p.tasks||[]).filter(t=>t.done).length;return `<a class="project-card" href="#project/${e(p.id)}"><div class="project-top">${tag(themes[p.theme]||p.theme)}${tag(p.status,statusTone(p.status))}</div><h3>${e(p.title)}</h3><p>${e(p.summary)}</p><div class="card-bottom"><span class="mini-avatar">${e(initials(person(p.ownerId)?.name||'P4A'))}</span><span>${e(group(p.groupId)?.name||'Working group')}</span><span class="push">${state.actor?`${done}/${(p.tasks||[]).length} tasks`:'Public overview'}</span>${icon('arrow')}</div></a>`;}
function matrix(compact=false){if(!state.actor)return '<p class="muted">Open a member workspace to view its project assessments. The public source explains the wider purpose and evidence.</p>';const quadrants=[{name:'Act together',subtitle:'Urgent · Important',cls:'now',filter:p=>p.urgency>=4&&p.importance>=4},{name:'Build the foundations',subtitle:'Less urgent · Important',cls:'plan',filter:p=>p.urgency<4&&p.importance>=4},{name:'Respond with care',subtitle:'Urgent · Lower importance',cls:'',filter:p=>p.urgency>=4&&p.importance<4},{name:'Keep in view',subtitle:'Less urgent · Lower importance',cls:'',filter:p=>p.urgency<4&&p.importance<4}];return `<div class="matrix ${compact?'':'big-matrix'}">${quadrants.map(q=>{const records=state.projects.filter(p=>p.status!=='complete'&&q.filter(p));return `<div class="quadrant ${q.cls}"><strong>${q.name}</strong><span>${q.subtitle}</span>${compact?`<b>${records.length}</b>`:records.map(p=>`<a class="matrix-item" href="#project/${e(p.id)}">${e(p.title)}<small>Urgency ${p.urgency}/5 · Importance ${p.importance}/5</small></a>`).join('')||'<p class="muted">No current projects</p>'}</div>`;}).join('')}</div>`;}

function jraQuestions(showExamples = false) {
  return `<dl class="jra-questions">${jraValues.map(({title, question, example}) => `<div><dt>${e(title)}</dt><dd>${e(question)}${showExamples ? `<p>${e(example)}</p>` : ''}</dd></div>`).join('')}</dl>`;
}

function home(){const verified=state.contributions.filter(c=>c.status==='verified').reduce((n,c)=>n+Number(c.hours),0);const mine=state.projects.filter(p=>p.participantIds?.includes(state.actor?.id));return `${heading('People & possibility',state.actor?`Good to have you here, ${state.actor.name.split(' ')[0]}.`:'A movement grows through its people.','Find a way to contribute and work with others on issues that matter to you.',state.actor?projectStartAction():actionButton('Explore the public work','resources','','secondary'))}
<section class="hero"><div><h2>Truth, trust and a fair go for all</h2><p>Rise above the fray. Check what we say, treat people fairly and share what we learn so others can build on it.</p><div class="button-row">${state.actor?'<a class="button" href="#projects">Find a project '+icon('arrow')+'</a>':state.mode==='demo'?actionButton('Open the member demo','demo-member','',''):'<a class="button" href="#resources">Explore the connected ideas</a>'}<a class="button quiet" href="#priority">What matters now ↗</a></div></div><div class="hero-art" aria-hidden="true"><div class="orbit"><div class="orbit-center">People.<br>Place.<br>Possibility.</div><span class="orbit-label">Joy</span><span class="orbit-label">Responsibility</span><span class="orbit-label">Abundance</span></div></div></section>
<section class="panel jra-home" aria-labelledby="jra-home-title"><div class="jra-heading">${icon('abundance')}<h2 id="jra-home-title">Joyful Responsible Abundance</h2></div><p>As AI advances and the possibility of superintelligence comes into view, take time to know ourselves and remember why we want to do better. Make room for friendships and families to thrive, and build alliances with people who bring different strengths.</p><p>A rising tide can lift all ships when people share in what we build. Ask these questions, act together and improve what we can, day by day.</p>${jraQuestions(true)}<div class="button-row"><a class="button secondary" href="${e(jraSource)}" target="_blank" rel="noopener noreferrer">Explore Joyful Responsible Abundance ↗</a>${isPilot() ? '<a class="button quiet" href="#training/joyful-responsible-abundance">Try the values lesson →</a>' : ''}</div></section>
${homeDoors(icon, hasCivicTools())}
<div class="stats"><div class="stat"><div class="stat-top">${state.actor?'Your shared projects':'Visible projects'}${icon('projects')}</div><strong>${state.actor?mine.length:state.projects.length}</strong><small>Ideas becoming shared work</small></div><div class="stat"><div class="stat-top">Working circles${icon('groups')}</div><strong>${state.groups.length}</strong><small>${state.mode==='demo'?'Illustrative groups':'Groups in this workspace'}</small></div><div class="stat"><div class="stat-top">Verified contribution${icon('hours')}</div><strong>${verified.toLocaleString()}<small> hours</small></strong><small>${isOrganiser()?'Across this workspace':'Visible to you'} · counted once</small></div><div class="stat"><div class="stat-top">Your next step${icon('check')}</div><strong class="next-step">${state.actor?'Take part':'Explore'}</strong><small>Choose a useful contribution</small></div></div>
<div class="grid-main"><section><div class="section-heading"><h2>Work worth doing, together</h2><a href="#projects">All projects →</a></div>${state.projects.slice(0,3).map(projectCard).join('')||(isPilot()?'<div class="panel"><p class="muted">No projects yet. Projects are organised by working group.</p><a class="button quiet" href="#groups">Open working groups</a></div>':'<div class="panel"><p class="muted">Shared projects appear here when you join the workspace.</p></div>')}</section><div><section class="panel"><div class="section-heading"><h2>What matters now</h2><a href="#priority" aria-label="Open urgency and importance assessment">↗</a></div>${matrix(true)}<div class="matrix-note"><span>HUMAN JUDGEMENT</span><span>OPEN TO REVIEW</span></div><p class="muted">Urgency and importance, informed by Joyful Responsible Abundance.</p></section><section class="panel"><span class="eyebrow">A movement from the ground up</span><h3>Grow through relationships.</h3><div class="path"><div class="path-step current">People</div><div class="path-step current">Local groups</div><div class="path-step">State</div><div class="path-step">Federal</div></div><p class="muted">Build shared capacity locally. Future parties will have their own rules, consent and governance.</p></section></div></div><div class="quick-links">${resources.slice(0,3).map(resourceCard).join('')}</div>`;}
function projects(){return `${heading('Shared work','From a good idea to something useful.','Gather people, agree the next actions and keep a record of what changes.',projectStartAction())}<div class="filters"><label class="sr-only" for="project-search">Search projects</label><input id="project-search" type="search" placeholder="Search projects, purposes and places…"><label class="sr-only" for="theme-filter">Project pathway</label><select id="theme-filter"><option value="">All pathways</option>${Object.entries(themes).map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select><label class="sr-only" for="status-filter">Project status</label><select id="status-filter"><option value="">All stages</option>${['proposed','active','review','complete'].map(s=>`<option>${s}</option>`).join('')}</select></div><div class="projects-grid" id="project-results">${state.projects.map(projectCard).join('')||(isPilot()?'<div class="empty">No projects yet. Projects are organised by working group.</div>':'<div class="empty">No projects to show yet.</div>')}</div><div class="callout">Missing Middle and Verse Box projects begin as proposals. A planning record does not establish a host agreement, operating installation or confirmed event.</div>`;}
function priorities(){return `${heading('Joyful Responsible Abundance','What matters now. And what matters next.','Show your reasons and revisit them as evidence and circumstances change.')}<div class="grid-main"><section>${matrix()}</section><aside class="panel jra-priorities"><h2>How we assess the work</h2><p><strong>Urgency.</strong> What is happening now, when does a decision need to be made and what would delay cost?</p><p><strong>Importance.</strong> How much could this change people’s lives, and what benefit might last?</p>${jraQuestions()}<p>Use 1–5 for urgency and importance. Ratings of 4 or 5 appear in the higher band. Record separately what the project needs before it can go ahead.</p><a href="${e(jraSource)}" target="_blank" rel="noopener noreferrer">Explore Joyful Responsible Abundance ↗</a></aside></div>`;}
function projectDetail(id){const p=project(id);if(!p)return `${heading('Shared work','Project unavailable','This project may be outside your groups, or the link may have changed.')}<a href="#projects">Back to projects</a>`;if(!state.actor)return `${heading(themes[p.theme]||'Public project',p.title,p.summary)}${requireMember()}`;const participating=isParticipant(p);return `<a class="back-link" href="#projects">← Shared projects</a>${heading(themes[p.theme]||'Shared project',p.title,p.summary,state.actor&&!p.participantIds?.includes(state.actor.id)?actionButton('Take part','join-project',p.id,''):tag(p.status,statusTone(p.status)))}<div class="button-row">${tag(group(p.groupId)?.name||'Working circle')}${tag(p.status,statusTone(p.status))}${canEdit(p)?actionButton('Update project stage','project-stage',p.id,'secondary small'):''}</div><div class="detail-grid"><div><section class="panel"><div class="section-heading"><h2>Next actions</h2><small class="muted">${(p.tasks||[]).filter(t=>t.done).length}/${(p.tasks||[]).length} complete</small></div>${(p.tasks||[]).map(t=>`<label class="task-row ${t.done?'done':''}"><input type="checkbox" data-task="${e(t.id)}" data-project="${e(p.id)}" ${t.done?'checked':''} ${!participating?'disabled':''}><span>${e(t.title)}</span></label>`).join('')||'<p class="muted">Agree a useful next action together.</p>'}${participating?`<form class="inline-form" data-form="task" data-id="${e(p.id)}"><label class="sr-only" for="new-task">New task</label><input id="new-task" name="title" placeholder="Add a clear next action…" maxlength="160" required><button class="button" type="submit">Add</button></form>`:'<p class="muted metric-explainer">Take part in the project to add actions and join the discussion.</p>'}</section>${pathwayPanel(p)}<section class="panel"><h2>The conversation</h2>${(p.comments||[]).map(c=>`<div class="comment"><strong>${e(person(c.personId)?.name||'Project participant')}</strong> <small>${dateText(c.createdAt)}</small><p>${e(c.text)}</p></div>`).join('')||'<p class="muted">Bring an observation, a useful question or an update.</p>'}${participating?`<form data-form="comment" data-id="${e(p.id)}"><label class="field subheading">Your contribution<textarea name="text" placeholder="Keep private household, legal and health details in your own files." maxlength="2000" required></textarea></label><button class="button" type="submit">Add to the conversation</button></form>`:''}</section></div><aside><section class="panel"><div class="section-heading"><h2>Why this matters</h2>${canEdit(p)?actionButton('Review','priority',p.id,'quiet small'):''}</div><div class="scores"><div><div class="score">${p.urgency}<small>Urgency / 5</small></div></div><div><div class="score">${p.importance}<small>Importance / 5</small></div></div></div><p class="muted">${e(p.reason||'Assessment awaiting a reason.')}</p>${['joy','responsibility','abundance'].filter(k=>p[k]).map(k=>`<p class="muted"><strong>${e(k[0].toUpperCase()+k.slice(1))}:</strong> ${e(p[k])}</p>`).join('')}<div class="meta-row"><span>Review due</span><strong>${dateText(p.reviewDate)}</strong></div><div class="meta-row"><span>Readiness</span><strong>${e(p.readiness||'To discuss')}</strong></div>${p.uncertainty?`<p class="muted"><strong>Open questions:</strong> ${e(p.uncertainty)}</p>`:''}<div class="subheading">${sourceLink(p.evidenceUrl)}</div>${(p.assessmentHistory||[]).length?`<details class="assessment-history"><summary>Previous assessments (${p.assessmentHistory.length})</summary>${p.assessmentHistory.slice().reverse().map(a=>`<div class="activity-line"><div><strong>Urgency ${a.urgency}/5 · Importance ${a.importance}/5</strong><p>${e(a.reason)}</p><small>${dateText(a.assessedAt)}</small></div></div>`).join('')}</details>`:''}</section><section class="panel"><h2>People & contribution</h2><div class="meta-row"><span>Coordinated by</span><strong>${e(person(p.ownerId)?.name||'Project coordinator')}</strong></div><div class="meta-row"><span>Participants</span><strong>${p.participantIds?.length||0}</strong></div><p class="muted">${isPilot()?'Contribution capture will open when Aura-assisted intake is ready.':'Record time freely given and submit it for independent verification.'}</p>${participating&&!isPilot()?actionButton('Record a contribution','log-hours',p.id,'secondary') : ''}</section></aside></div>`;}
function pathwayPanel(p){if(p.theme==='missing-middle')return `<section class="panel"><span class="eyebrow">Missing Middle · Local opportunity</span><h2>Make the opportunity concrete.</h2><p class="muted">Agree the host, useful workloads and local responsibilities before treating an installation as confirmed.</p><div class="button-row subheading">${['Host & place','Workloads & users','Power, connection & heat','Ownership & renewal','Skills & maintenance'].map(s=>tag(s)).join('')}</div><p class="muted">Use the next actions and discussion to identify unknowns, agree an owner and record evidence. Commercial and co-operative relationships remain distinct from P4A membership.</p><a class="source-link" target="_blank" rel="noopener noreferrer" href="${resources[1].url}">Read the Missing Middle proposal ↗</a></section>`;if(p.theme==='verse-box')return `<section class="panel"><span class="eyebrow">Verse Box · Assisted participation</span><h2>Try something useful. Take it with you.</h2><p class="muted">Begin with a participant-chosen question, a learning task or a local project. Use sample material, inspect the result together, then let the participant choose what to keep and share.</p><div class="path"><div class="path-step current">Choose a task</div><div class="path-step">Try & review</div><div class="path-step">Take it home</div></div><p class="muted">Planning includes a host agreement, accessibility, assistance, consent, a tested handover and clearing public equipment. Personal Aura and Genesis records stay separate.</p><div class="button-row subheading">${actionButton('Make a take-home note','handover',p.id,'secondary')}<a class="source-link" target="_blank" rel="noopener noreferrer" href="${resources[2].url}">Explore the Verse Box ↗</a></div></section>`;return '';}
function people() {
  if (!state.actor) return requireMember();
  const pilot = isPilot();
  const applications = state.memberships.filter(m => m.status === 'pending' && m.personId !== state.actor.id);
  return `${heading('Relationships', 'People make the movement.', pilot ? 'See the people and contacts available to your workspace role.' : 'Profiles are shared by choice. Joining a working group and joining an organisation are separate actions.', isOrganiser() ? actionButton('Add a contact', 'new-person', '', '') : '')}
    <div class="filters"><label class="sr-only" for="people-search">Find a person</label><input id="people-search" type="search" placeholder="Search visible names, places or skills…"></div>
    <div class="table-wrap" data-scroll-key="people-table"><table><thead><tr><th>Person</th><th>Place</th><th>Skills & interests</th><th>Sharing</th></tr></thead><tbody id="people-results">${peopleRows(state.people)}</tbody></table></div>
    ${isOrganiser() ? `${isLocalReview() && state.onboarding?.enabled ? '<p class="subheading"><a class="button secondary" href="#onboarding/review">Review practice applications</a></p>' : ''}${isLocalReview() && state.onboarding?.enabled && applications.length ? `<h2 class="subheading">Earlier demo applications</h2>
      <div class="panel">${applications.map(m => `<div class="membership-status"><div><strong>${e(person(m.personId)?.name || 'Applicant')}</strong><p>Movement participation · Applied ${dateText(m.createdAt)}</p></div>
        <div class="button-row">${actionButton('Accept', 'accept-membership', m.id, 'secondary small')}${actionButton('Close application', 'close-membership', m.id, 'secondary small')}</div>
      </div>`).join('')}</div>` : ''}
      <section class="panel subheading"><h2>Recent changes</h2>${state.activity.slice(0,12).map(a=>`<div class="activity-line"><div>${e(a.summary)}<small>${e(person(a.actorId)?.name||'Workspace participant')} · ${dateText(a.at)}</small></div></div>`).join('')||'<p class="muted">Changes will appear here.</p>'}</section>` :
      '<div class="callout">The member directory includes only people who chose to appear. Organisers have a separate, restricted relationship view.</div>'}`;
}
function peopleRows(list){return list.map(p=>`<tr><td><div class="person-cell"><span class="avatar">${e(initials(p.name))}</span><div><strong>${e(p.name)}</strong><small>${e(p.email||'Contact details private')}</small></div></div></td><td>${e(p.place||'Not shared')}</td><td>${e([p.skills,p.interests].filter(Boolean).join(' · ')||'Not shared')}</td><td>${tag(p.directoryConsent?'Directory opt-in':'Private',p.directoryConsent?'green':'gray')}</td></tr>`).join('')||'<tr><td colspan="4" class="empty">No visible people match.</td></tr>';}
function groups(){return `${heading('People → Place → Possibility','Find a circle. Build something together.','Working groups connect people around a place or purpose. They are distinct from formal party branches.', isPilot() && isOrganiser() ? actionButton('Create a working group','new-group','','') : '')}<div class="projects-grid">${state.groups.map(g=>`<section class="panel group-card"><div class="section-heading"><span class="avatar">${icon('groups')}</span>${tag(g.level||'local')}</div><h2 class="subheading">${e(g.name)}</h2><p>${e(g.description)}</p><div class="meta-row"><span>Place</span><strong>${e(g.place)}</strong></div><div class="meta-row"><span>Working projects</span><strong>${state.projects.filter(p=>p.groupId===g.id).length}</strong></div>${state.actor?actionButton(g.memberIds?.includes(state.actor.id)?'Leave working group':'Join working group',g.memberIds?.includes(state.actor.id)?'leave-group':'join-group',g.id,'secondary'):''}</section>`).join('')||(isPilot()?`<div class="panel"><h2>No working groups yet</h2><p class="muted">${isOrganiser()?'Create a group to organise your first project.':'An organiser can create the first group.'}</p></div>`:'<div class="panel"><p class="muted">Groups will appear here as the movement develops.</p></div>')}</div>`;}
function hours(){if(!state.actor)return requireMember();const pilot=isPilot();const canReview=isOrganiser()&&!pilot;const verified=state.contributions.filter(c=>c.status==='verified').reduce((n,c)=>n+Number(c.hours),0);return `${heading('What was given freely','Make contribution visible.',pilot?'View voluntary contribution receipts. Capture will open when Aura-assisted intake is ready.':'Record useful work, keep the context and have another person verify the receipt.',pilot?'':actionButton('Record a contribution','log-hours','',''))}<div class="stats"><div class="stat"><div class="stat-top">Verified hours${icon('hours')}</div><strong>${verified}</strong><small>Counted once · No money conversion</small></div><div class="stat"><div class="stat-top">Awaiting verification</div><strong>${state.contributions.filter(c=>c.status==='pending').length}</strong><small>Independent review required</small></div></div><div class="table-wrap" data-scroll-key="contributions-table"><table><thead><tr><th>Contribution</th><th>Date / hours</th><th>Receipt status</th>${canReview?'<th>Review</th>':''}</tr></thead><tbody>${state.contributions.map(c=>`<tr><td><strong>${e(c.description)}</strong><br><small class="muted">${e(person(c.personId)?.name||'Contributor')} · ${e(project(c.projectId)?.title||'Shared project')}</small></td><td>${dateText(c.date)}<br><strong>${e(c.hours)} hours</strong></td><td>${tag(c.status,statusTone(c.status))}<br><small class="muted">${c.publicConsent?(pilot?'Shared within the workspace':'Aggregate publication allowed'):'Kept private'}</small></td>${canReview?`<td>${c.status==='pending'&&c.personId!==state.actor.id?`<div class="button-row">${actionButton('Verify','verify-hours',c.id,'secondary small')}${actionButton('Reject','reject-hours',c.id,'secondary small')}</div>`:'<small class="muted">'+(c.personId===state.actor.id?'Another organiser must review':'Reviewed')+'</small>'}</td>`:''}</tr>`).join('')||`<tr><td colspan="${pilot?3:4}" class="empty">${pilot?'No contribution receipts yet.':'Your first contribution can start with a shared project.'}</td></tr>`}</tbody></table></div><div class="callout">Paid work, financial support, voluntary time and outcomes have separate records. A verified hour does not create a financial entitlement or extra political rights.</div>`;}
function transparency() {
  const pilot = isPilot();
  return `${heading(pilot ? 'Private workspace' : 'Open to everyone', pilot ? 'Restricted transparency' : 'Trust grows through an open record.', pilot ? 'View the contribution totals and decisions shared within this workspace.' : 'What it cost. What was given freely. What changed. Public reporting protects private lives.')}
    <div class="quick-links transparency-accounts">
      <section class="panel"><span class="eyebrow">01 · What it cost</span><h2>Money & decisions</h2><p class="muted">${pilot ? 'Payment collection and financial reporting are unavailable in this workspace.' : 'Live collections are not enabled. Prices, operator and payment arrangements have not been set.'}</p></section>
      <section class="panel"><span class="eyebrow">02 · What was given freely</span><h2>Verified contribution</h2><p class="muted">${pilot ? 'Totals include only independently verified receipts marked for sharing.' : 'Only independently verified, publication-consented receipts enter the public aggregate.'}</p><p id="public-hours" class="metric-explainer">${pilot ? 'Loading shared totals…' : 'Loading the public record…'}</p></section>
      <section class="panel"><span class="eyebrow">03 · What changed</span><h2>Evidence & outcomes</h2><p class="muted">Record decisions with their context. Public claims need sources, review and a correction path.</p></section>
    </div>
    <div class="grid-main">
      <section class="panel"><h2>${pilot ? 'Shared decisions' : 'Published decisions'}</h2><div id="public-decisions"><p class="muted">${pilot ? 'Loading shared decisions…' : 'Loading published decisions…'}</p></div></section>
      <section class="panel"><span class="eyebrow">Governance in formation</span><h2>Clear about where we are.</h2><p class="muted">P4A is not a registered political party and has no adopted constitution. Its public constitutional work is a drafting process.</p><p class="muted">Future state and federal parties need their own membership consent, governing rules, officers and financial records.</p><p class="muted">${pilot ? 'Only people with invited workspace accounts can see these totals and decisions.' : 'This page is a public view, not a lodged regulatory return. Private membership records and contact details are excluded.'}</p><a class="button quiet" href="https://p4a.xyz/pages/constitution.html" target="_blank" rel="noopener noreferrer">Visit the public drafting workbench ↗</a></section>
    </div>`;
}
async function loadPublic() {
  const pilot = isPilot();
  try {
    const data = await api('/api/public');
    const hours = Number(data.totals?.verifiedHours ?? 0);
    const totalLabel = pilot ? 'verified hours shared within this workspace' : 'verified hours approved for public aggregation';
    if ($('#public-hours')) $('#public-hours').textContent = `${hours} ${totalLabel}${state.mode === 'demo' ? ' · fictional demonstration data' : ''}`;
    if ($('#public-decisions')) $('#public-decisions').innerHTML = (data.decisions || []).map(d => `<div class="activity-line"><div><strong>${e(d.title)}</strong><p>${e(d.summary)}</p><small>${dateText(d.date)} · ${e(d.status || (pilot ? 'Shared' : 'Published'))}</small></div></div>`).join('') || `<p class="muted subheading">${pilot ? 'No decisions have been shared.' : 'No decisions have been published.'}</p>`;
  } catch {
    if ($('#public-decisions')) $('#public-decisions').textContent = pilot ? 'Shared decisions are temporarily unavailable.' : 'The public record is temporarily unavailable.';
  }
}
function connected(){return `${heading('One connected civic vision','Follow the ideas. Keep your choices.','Explore the public tools and proposals. Each project retains its own purpose, sources and hosting.')}<div class="resources-grid">${resources.map(resourceCard).join('')}</div><div class="callout">Household Bill Check, the Legal Engine and public civic information retain free access. Sharing anything from your private work into a group remains an explicit choice.</div>`;}
function profile() {
  if (!state.actor) return requireMember();
  const pilot = isPilot();
  const me = person(state.actor.id) || state.actor;
  const membership = state.memberships.find(m => m.personId === state.actor.id && m.status !== 'withdrawn');
  const participation = `<section class="panel">
    <h2>Membership onboarding</h2>
    <p class="muted">${pilot ? 'Your invitation gives you access to groups, projects and drafts. See what applying to the movement would involve.' : 'See how to prepare for induction, identity checks and an independent review.'}</p>
    <a class="button quiet" href="#onboarding">Open membership onboarding →</a>
    ${membership ? `<div class="membership-status"><div>${tag(membership.status, statusTone(membership.status))}</div>${actionButton('Withdraw', 'withdraw-membership', membership.id, 'secondary small')}</div>` : ''}
  </section>`;
  return `${heading(pilot ? 'Private workspace' : 'Your participation', pilot ? 'Your workspace profile' : 'Your details. Your choices.', pilot ? 'Manage your profile and sharing choices within the workspace.' : 'Choose what is shared, manage your participation and take a copy of your records.')}
    <div class="detail-grid">
      <section class="panel">
        <h2>Your profile</h2>
        <form data-form="profile">
          <div class="form-grid subheading">
            ${field('Name', 'name', me.name, { required: true })}${field('Place', 'place', me.place)}
            <label class="field full">Email<input type="email" value="${e(me.email || '')}" readonly><small>${pilot ? 'Email associated with this workspace profile.' : 'Identity changes require a verified sign-in process.'}</small></label>
            ${field('Skills you would like to contribute', 'skills', me.skills, { full: true })}${field('Interests', 'interests', me.interests, { full: true })}
            <label class="check-field field full"><input type="checkbox" name="directoryConsent" ${me.directoryConsent ? 'checked' : ''}><span>${pilot ? 'Show my name, place, skills and interests in the private workspace directory.' : 'Show my name, place, skills and interests to other members.'}<small>Email stays private. You can change this choice.</small></span></label>
            <label class="check-field field full"><input type="checkbox" name="contactConsent" ${me.contactConsent ? 'checked' : ''}><span>I would like organisers to contact me about participation.<small>This does not authorise public publication or unrelated marketing.</small></span></label>
          </div>
          <div class="form-error" role="alert"></div><button class="button" type="submit">Save my choices</button>
        </form>
      </section>
      <aside>
        ${participation}
        <section class="panel"><h2>${pilot ? 'Workspace records' : 'Your records, with you.'}</h2><p class="muted">${pilot ? 'Download the private records available to your workspace role.' : 'Download the records available to your role. Member exports include your own details and authorised shared work.'}</p><div class="subheading">${actionButton(pilot ? 'Download workspace records' : 'Download my records', 'export', '', 'secondary')}</div></section>
        ${pilot ? '' : `<section class="panel"><h2>Paid tools & workspaces</h2><p class="muted">Paid benefits and prices are still to be agreed. No subscription is being sold or charged in this build.</p>${tag('Payments not connected', 'gray')}<p class="muted">Public resources and transparency stay open.</p></section>`}
      </aside>
    </div>`;
}
function field(label,name,value='',options={}){return `<label class="field ${options.full?'full':''}">${e(label)}<input name="${e(name)}" value="${e(value)}" type="${options.type||'text'}" ${options.required?'required':''} ${options.max?`max="${options.max}"`:''} maxlength="${options.length||(name==='name'?100:200)}"></label>`;}

function render() {
  rememberScrollPositions(document);
  const [route = 'home', id] = (location.hash.slice(1) || 'home').split('/');
  const pilot = isPilot();
  const civicTools = hasCivicTools();
  const trainingActor = state.actor?.id || 'local-public';
  $('.shell').classList.toggle('private-workspace', pilot);
  const availableWorkspaceRoutes = workspaceRoutes.filter(([key]) => civicTools || (key !== 'readiness' && key !== 'training'));
  const pilotLabels = { profile: 'Your profile', transparency: 'Restricted transparency' };
  const current = [...availableWorkspaceRoutes, ...accountabilityRoutes].find(r => r[0] === route) || ['home', 'Your workspace'];
  const currentLabel = pilot ? pilotLabels[current[0]] || current[1] : current[1];
  document.title = `${currentLabel} · P4A`;
  const navLink = ([key, label]) => {
    const text = pilot ? pilotLabels[key] || label : label;
    const active = route === key || (route === 'project' && key === 'projects');
    return `<a class="nav-link ${active ? 'active' : ''}" href="#${key}" ${route === key ? 'aria-current="page"' : ''} aria-label="${text}" title="${text}">${icon(key)}<span class="nav-full-label">${text}</span><span class="nav-short-label" aria-hidden="true">${pilot && key === 'profile' ? 'Profile' : compactLabels[key]}</span></a>`;
  };
  const roleLabel = state.actor?.role || 'Everyone is welcome';
  $('#sidebar').innerHTML = `<a class="brand" href="#home" aria-label="P4A workspace home"><span class="brand-mark">P4A</span><span><strong>People & possibility</strong><small>A shared civic workspace</small></span></a>
    ${pilot ? '<button type="button" id="workspace-menu" aria-controls="workspace-links" aria-expanded="false">Workspace menu</button>' : ''}<nav id="workspace-links" aria-label="Workspace pages"><div class="nav-label">${pilot ? 'Private workspace' : 'Your movement'}</div>${availableWorkspaceRoutes.map(navLink).join('')}<div class="nav-label">Open & accountable</div>${accountabilityRoutes.map(navLink).join('')}</nav>
    <div class="sidebar-foot"><div class="sidebar-note"><strong>Many places. A shared possibility.</strong>Build from people and local groups, with room for the whole vision.<br><a href="https://p4a.xyz/" target="_blank" rel="noopener noreferrer">Explore P4A ↗</a></div>
    <div class="identity"><span class="avatar">${e(initials(state.actor?.name || 'Public'))}</span><div>${e(state.actor?.name || 'Public visitor')}<small>${e(roleLabel)}</small></div></div></div>`;
  let accountControl = `<span class="muted"><span class="status-dot"></span>${state.actor ? 'Signed in' : 'Public view'}</span>`;
  if (state.mode === 'demo') {
    accountControl = `<label class="sr-only" for="demo-role">Review perspective</label><select id="demo-role"><option value="public" ${!state.actor ? 'selected' : ''}>Public view</option><option value="member" ${state.actor?.role === 'member' ? 'selected' : ''}>Member demo</option><option value="organiser" ${isOrganiser() ? 'selected' : ''}>Organiser demo</option></select>`;
  } else if (pilot) {
    accountControl = '<a class="button secondary small pilot-signout" href="/cdn-cgi/access/logout">Sign out</a>';
  }
  $('#topbar').innerHTML = `<div class="breadcrumb"><span>${pilot ? 'Private workspace' : 'P4A workspace'}</span><span>/</span><strong>${e(currentLabel)}</strong></div><div class="top-actions"><a class="public-link source-link" href="https://p4a.xyz/" target="_blank" rel="noopener noreferrer">Public website ↗</a>${accountControl}</div>`;
  const banner = $('#demo-banner');
  banner.hidden = state.mode !== 'demo' && !pilot;
  banner.classList.toggle('pilot-banner', pilot);
  banner.innerHTML = pilot
    ? '<strong>PRIVATE WORKSPACE</strong> Access is limited to invited accounts. Your working groups, projects and drafts are saved here.'
    : '<strong>LOCAL WORKING DEMO</strong> Fictional people, groups and records. Changes stay on this computer; no emails or payments are sent.';
  const views = { onboarding: () => onboardingView(state, id, { e, heading, icon, civicTools }), gamify: () => gamifyView(state, gamifyHelpers()), nodes: () => localNodesView({ heading, icon }), campaigns: () => campaignsView({ heading, icon, pilot: civicTools }), constitution: () => constitutionPage(id), home, projects, priority: priorities, people, groups, hours, transparency, resources: connected, profile };
  const isApplicationsPage = route === 'onboarding' && id === 'applications' && civicTools && isOrganiser();
  if (isApplicationsPage) {
    views.onboarding = () => applicationReview?.applicationReviewView({ heading }) || '<p role="status">Opening the applications register…</p>';
  }
  clearInterval(readinessTimer);
  if (route === 'readiness' && civicTools) {
    views.readiness = () => readiness?.readinessView(id, { e, heading, icon }) || '<div class="panel"><p role="status">Opening the electoral readiness calendar…</p></div>';
  }
  if (route === 'training' && civicTools) {
    views.training = () => training?.trainingView(id, trainingActor, { e, heading }) || '<div class="panel"><p role="status">Opening civic training…</p></div>';
  }
  $('#main').innerHTML = route === 'project' ? projectDetail(id) : (views[route] || home)();
  const trainingTitle = route === 'training' ? $('#main .civic-training-page h1')?.textContent : null;
  if (trainingTitle && trainingTitle !== currentLabel) document.title = `${trainingTitle} · Civic training · P4A`;
  restoreScrollPositions(document);
  if (isApplicationsPage) {
    if (applicationReview) {
      applicationReview.mountApplicationReview($('[data-applications]'), { api, e });
    } else {
      import('./application-review.mjs').then(module => {
        applicationReview = module;
        if (location.hash === '#onboarding/applications') {
          render();
          focusPage();
        }
      }).catch(() => {
        if (location.hash === '#onboarding/applications') $('#main').innerHTML = '<p role="alert">The applications register could not open. Reload the workspace to try again.</p>';
      });
    }
  }
  if (route === 'transparency') void loadPublic();
  if (route === 'training' && civicTools) {
    if (training) {
      training.mountTraining($('#main'), trainingActor);
    } else {
      import('./civic-training.mjs').then(module => {
        training = module;
        if (location.hash.split('/')[0] === '#training') {
          const focusWasInMain = document.activeElement === $('#main');
          render();
          if (focusWasInMain) focusPage();
        }
      }).catch(() => {
        if (location.hash.split('/')[0] === '#training') $('#main').innerHTML = '<div class="panel"><h1>Civic training</h1><p>The modules could not open. Reload the workspace to try again.</p></div>';
      });
    }
  }
  if (route === 'readiness' && civicTools) {
    if (readiness) {
      readiness.mountFundingCalculator($('#main'));
      const refresh = () => readiness.refreshClocks($('#main'));
      refresh();
      readinessTimer = setInterval(refresh, 30000);
    } else {
      import('./electoral-readiness.mjs').then(module => {
        readiness = module;
        if (location.hash.split('/')[0] === '#readiness') render();
      }).catch(() => {
        if (location.hash.split('/')[0] === '#readiness') $('#main').innerHTML = '<div class="panel"><h1>Electoral readiness</h1><p>The calendar could not open. Reload the workspace to try again.</p></div>';
      });
    }
  }
}
function focusPage() {
  const target = $('#main :is(.civic-training-page, .onboarding-page) h1') || $('#main');
  target.tabIndex = -1;
  target.focus({ preventScroll: true });
}
function constitutionPage(documentId) {
  const helpers = {e,heading,tag,person,dateText,actionButton,sourceLink,requireMember};
  if (state.mode === 'demo' && documentId === 'trial') {
    document.title = 'C-Hour rule trial · P4A';
    return trialView(state, helpers);
  }
  const trialEntry = state.mode === 'demo' ? `
    <section class="panel constitution-trial-entry">
      <div>
        <h2>Try a C-Hour rule before voting on it</h2>
        <p class="muted">See how Aura could prepare a C-Hour record from agreed evidence. Compare two rules, choose what to share, then follow a fictional review, ballot and sunset.</p>
      </div>
      <a class="button secondary" href="#constitution/trial">Open the worked proposal</a>
    </section>` : '';
  return constitutionView(state, {...helpers, trialEntry}, documentId);
}
function gamifyHelpers(){return {e,heading,tag,person,dateText,actionButton,field,showDialog,command,notify,closeDialog,today,api,render,logHours};}
function showDialog(title,intro,body,form,submit='Save',id=''){dialogReturnFocus=document.activeElement;$('#dialog').innerHTML=`<div class="dialog-heading"><h2 id="dialog-title">${e(title)}</h2><button class="close" data-action="close-dialog" aria-label="Close dialog">×</button></div><p class="dialog-intro">${e(intro)}</p><form data-form="${form}" data-id="${e(id)}"><div class="form-grid">${body}</div><div class="form-error" role="alert"></div><div class="form-actions"><button type="button" class="button secondary" data-action="close-dialog">Cancel</button><button class="button" type="submit">${e(submit)}</button></div></form>`;$('#dialog').showModal();}
function closeDialog(){$('#dialog').close();if(dialogReturnFocus?.isConnected)dialogReturnFocus.focus();else $('#main').focus({preventScroll:true});}
function priorityFields(p={}){return `<label class="field">Urgency<select name="urgency">${[1,2,3,4,5].map(n=>`<option ${Number(p.urgency||3)===n?'selected':''}>${n}</option>`).join('')}</select><small>1: can wait · 5: immediate decision or harm</small></label><label class="field">Importance<select name="importance">${[1,2,3,4,5].map(n=>`<option ${Number(p.importance||3)===n?'selected':''}>${n}</option>`).join('')}</select><small>1: limited change · 5: substantial lasting change</small></label><label class="field full">Reasons for this assessment<textarea name="reason" required maxlength="1800">${e(p.reason)}</textarea></label>${jraValues.map(({title, question}) => { const key = title.toLowerCase(); return field(title + " · " + question, key, p[key], {full:true,length:500}); }).join("")}${field('Supporting source (https://)','evidenceUrl',p.evidenceUrl,{type:'url',full:true,length:1000})}${field('Next review','reviewDate',p.reviewDate||today(),{type:'date',required:true})}${field('Readiness','readiness',p.readiness||'Exploring')}${field('Uncertainty and dependencies','uncertainty',p.uncertainty,{full:true,length:500})}`;}
function projectGroups() {
  return state.groups.filter(g => isOrganiser() || g.memberIds?.includes(state.actor?.id));
}
function projectStartAction() {
  if (!state.actor) return '';
  if (isPilot() && !projectGroups().length) {
    return isOrganiser() ? actionButton('Create a working group', 'new-group', '', '') : '<a class="button secondary" href="#groups">View working groups</a>';
  }
  return actionButton('Start a project', 'new-project', '', '');
}
function newGroup() {
  if (!isPilot() || !isOrganiser()) return;
  return showDialog('Create a working group', 'Give the group a place or purpose. It starts private.', `
    ${field('Group name','name','',{required:true,full:true,length:120})}
    ${field('Place','place','',{full:true,length:120})}
    <label class="field full">Purpose<textarea name="description" maxlength="1000"></textarea></label>
  `, 'group', 'Create working group');
}
function newProject(){if(!state.actor){notify('Open the member demo to create a project.');return;}const available=projectGroups();if(!available.length){notify(isPilot()&&isOrganiser()?'Create a working group before starting a project.':'Join a working group before starting a project.');location.hash='groups';return;}showDialog('Start something useful.','Give it a purpose, a working group and a reviewable sense of priority.',`${field('Project name','title','',{required:true,full:true,length:140})}<label class="field full">What would change?<textarea name="summary" required maxlength="1800"></textarea></label><label class="field">Working group<select name="groupId">${available.map(g=>`<option value="${e(g.id)}">${e(g.name)}</option>`).join('')}</select></label><label class="field">Pathway<select name="theme">${Object.entries(themes).map(([key,title])=>`<option value="${key}">${title}</option>`).join('')}</select></label>${priorityFields()}`,'project','Create project');}
function logHours(id=''){if(isPilot())return;const available=state.projects.filter(isParticipant);if(!available.length){notify('Take part in a project before recording a contribution.');return;}showDialog('Record a contribution','Log freely given time. Another organiser must verify it before it counts as verified.',`<label class="field full">Project<select name="projectId">${available.map(p=>`<option value="${e(p.id)}" ${p.id===id?'selected':''}>${e(p.title)}</option>`).join('')}</select></label>${field('Date','date',today(),{type:'date',max:today(),required:true})}<label class="field">Hours<input type="number" name="hours" value="1" step="0.25" min="0.25" max="24" required></label><label class="field full">What did you contribute?<textarea name="description" required maxlength="1000"></textarea></label><label class="check-field field full"><input type="checkbox" name="publicConsent"><span>Include verified time in the public aggregate.<small>Your name and description stay out of that aggregate.</small></span></label>`,'hours','Submit for verification');}
function handover(id){showDialog('A note to take with you','Write only what you choose to keep. This note downloads to your device and is not saved in the CRM.',`${field('My question or task','task','',{full:true,required:true})}<label class="field full">What I want to keep<textarea name="result" maxlength="4000" required></textarea></label>${field('A source I can revisit','source','',{full:true,type:'url',length:1000})}${field('My next step','next','',{full:true,length:500})}<label class="check-field field full"><input type="checkbox" name="reviewed" required><span>I reviewed this note and chose what to include.</span></label>`,'handover','Download my note',id);}
function download(name,text,type='application/json'){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function setRole(role) {
  if (state.mode !== 'demo') return;
  const focusWasInOnboarding = Boolean(document.activeElement?.closest('.onboarding-page'));
  await api('/api/demo/session', { method: 'POST', body: JSON.stringify({ role }) });
  await load();
  render();
  if (focusWasInOnboarding) focusPage();
  notify(role === 'public' ? 'Now showing the public view.' : `Now exploring as a fictional ${role}.`);
}

document.addEventListener('click',async event=>{if(event.target.closest('.skip-link')){event.preventDefault();$('#main').focus();return;}const menu=event.target.closest('#workspace-menu');if(menu){menu.setAttribute('aria-expanded',String(menu.getAttribute('aria-expanded')==='false'));return;}const button=event.target.closest('[data-action]');if(!button)return;const {action,id,subid}=button.dataset;try{
  if (action === 'copy-campaign-prompt') {
    const prompt = $('#campaign-prompt');
    try {
      await navigator.clipboard.writeText(prompt.value);
      notify('Campaign prompt copied.');
    } catch {
      prompt.focus();
      prompt.select();
      notify('Prompt selected. Use your device’s copy shortcut.');
    }
    return;
  }
  if (action.startsWith('trial-')) {
    if (state.mode !== 'demo' || location.hash !== '#constitution/trial') return;
    if (action === 'trial-export') {
      download('p4a-c-hour-rule-trial-demo.json', JSON.stringify(trialAuditRecord(), null, 2));
      notify('Fictional audit record downloaded.');
      return;
    }
    if (handleTrialAction(action, state.actor, id)) {
      render();
      const next = {
        'trial-run': '[data-action="trial-run"], [data-action="trial-share"]',
        'trial-share': '#trial-review-heading',
        'trial-review': '[data-action="trial-open-ballot"]',
        'trial-open-ballot': '[data-action="trial-vote"]',
        'trial-vote': '#trial-ballot-heading',
        'trial-close-ballot': '#trial-ballot-heading',
        'trial-expire': '#trial-sunset-heading',
      }[action];
      ($(next) || $('#trial-status'))?.focus();
    }
    return;
  }
  if(await handleGamifyClick(action,id,state,gamifyHelpers()))return;
  if(action==='constitution-clause'){selectClause(id,subid);render();focusSelectedClause($('#main'));return;}
  if(action==='constitution-create')return showDialog('Open a working draft','Each document has its own scope and history. Creating one does not establish a party or adopt rules.',`${field('Document title','title','',{full:true,required:true,length:160})}<label class="field full">Scope<select name="scope"><option value="movement">Movement</option><option value="local-charter">Local charter</option><option value="state">Future state or territory party</option><option value="federal">Future federal party</option></select></label>`,'constitution-create','Create working draft');
  if(action==='constitution-add'){showDialog('Propose a new clause','Add a new section through discussion and independent review. Existing clauses remain intact.',`${field('Amendment title','title','',{full:true,required:true,length:160})}${field('New clause heading','heading','',{full:true,required:true,length:160})}<label class="field full">Proposed clause wording<textarea class="long-text" name="body" maxlength="10000" required></textarea></label><label class="field full">Why add this clause?<textarea name="reason" maxlength="2000" required></textarea></label>${field('Supporting source (https://)','evidenceUrl','',{type:'url',full:true,length:1000})}`,'constitution-add','Submit for discussion',id);return;}
  if(action==='constitution-export'){const draft=state.constitutions.find(d=>d.id===id);download('p4a-working-constitution.md',draftMarkdown(draft),'text/markdown');notify('Working draft downloaded, clearly marked as not adopted.');return;}
  if(action==='constitution-propose'){const draft=state.constitutions.find(d=>d.id===id),clause=draft.clauses.find(c=>c.id===subid);showDialog('Propose an amendment','Your proposal will be shared with workspace members for discussion. The current clause remains until independent review.',`<input type="hidden" name="clauseId" value="${e(subid)}"><input type="hidden" name="baseVersion" value="${clause.version}">${field('Amendment title','title','',{full:true,required:true,length:160})}<label class="field full">Proposed clause wording<textarea class="long-text" name="body" maxlength="10000" required>${e(clause.body)}</textarea></label><label class="field full">Why should this change?<textarea name="reason" maxlength="2000" required></textarea></label>${field('Supporting source (https://)','evidenceUrl','',{type:'url',full:true,length:1000})}`,'constitution-propose','Submit for discussion',id);return;}
  if(action==='constitution-review'){showDialog('Review an amendment','Acceptance merges this wording into a working draft. Formal adoption remains a separate human governance process.',`<input type="hidden" name="proposalId" value="${e(subid)}"><label class="field full">Review outcome<select name="status"><option value="accepted">Accept into working draft</option><option value="declined">Decline amendment</option></select></label><label class="field full">Reasons for this review<textarea name="reason" maxlength="2000" required></textarea></label>`,'constitution-review','Record review',id);return;}
  if(action==='constitution-withdraw'){await command('constitution.withdraw',{constitutionId:id,proposalId:subid});notify('Proposal withdrawn; the current draft is unchanged.');return;}

  if(action==='close-dialog')return closeDialog();
  if(action==='new-group')return newGroup();
  if(action==='new-project')return newProject();
  if(action==='resources'){location.hash='resources';return;}
  if(action.startsWith('demo-'))return await setRole(action.slice(5));
  if(action==='priority'){const p=project(id);return showDialog('Review what matters','Make the judgement and its reasons visible. This is a proposed P4A working scale.',priorityFields(p),'priority','Save assessment',id);}
  if(action==='new-person')return showDialog(isPilot()?'Add a contact':'Add a relationship',isPilot()?'Save a contact for your work. The contact starts private.':'A contact is not automatically a member. New records remain private until the person chooses otherwise.',`${field('Name','name','',{full:true,required:true})}${field('Email','email','',{type:'email',required:true})}${field('Place','place')}${field('Skills','skills','',{full:true})}${field('Interests','interests','',{full:true})}`,'person','Add contact');
  if(action==='log-hours')return logHours(id);
  if(action==='handover')return handover(id);
  if(action==='project-stage'){const p=project(id);return showDialog('Update the project stage','Record the present stage of the work.',`<label class="field full">Stage<select name="status">${['proposed','active','review','complete'].map(s=>`<option ${p.status===s?'selected':''}>${s}</option>`).join('')}</select></label>`,'stage','Update stage',id);}
  if (action === 'withdraw-membership') {
    return showDialog('Withdraw movement participation', 'Your membership record will show that you have withdrawn. Your account and working group choices remain separate.', '<p class="field full">This updates your participation status and retains its history.</p>', 'withdraw', 'Withdraw', id);
  }
  if(action==='export'){const data=await api('/api/export');download(isPilot()?'p4a-pilot-records.json':'p4a-my-records.json',JSON.stringify(data,null,2));notify('Your records have been downloaded.');return;}
  const actions={'join-project':['project.join',{projectId:id}],'join-group':['group.join',{groupId:id}],'leave-group':['group.leave',{groupId:id}],'accept-membership':['membership.review',{membershipId:id,status:'accepted'}],'close-membership':['membership.review',{membershipId:id,status:'withdrawn'}],'verify-hours':['contribution.review',{contributionId:id,status:'verified'}],'reject-hours':['contribution.review',{contributionId:id,status:'rejected'}]};
  if(actions[action]){button.disabled=true;await command(...actions[action]);notify('The record has been updated.');}
}catch(err){notify(err.message);}finally{button.disabled=false;}});

document.addEventListener('submit',async event=>{const form=event.target.closest('form[data-form]');if(!form)return;event.preventDefault();const kind=form.dataset.form, id=form.dataset.id;const fd=new FormData(form);const data=Object.fromEntries(fd);const submit=form.querySelector('[type=submit]');const error=form.querySelector('.form-error');if(error)error.textContent='';if(submit)submit.disabled=true;
  try{if(await handleGamifySubmit(form,state,gamifyHelpers()))return;let type,payload=data;
    if(kind==='handover'){download('verse-box-take-home-note.md',`# My Verse Box take-home note\n\nPrepared ${today()}. Chosen and reviewed by the participant.\n\n## My question\n${data.task}\n\n## What I chose to keep\n${data.result}\n\n## Source to revisit\n${data.source||'None recorded'}\n\n## My next step\n${data.next||'My choice'}\n`,'text/markdown');closeDialog();notify('Your note was downloaded. It was not saved to the CRM.');return;}
    if(kind==='constitution-create')type='constitution.create';
    if(kind==='constitution-add'){type='constitution.propose';payload={...data,constitutionId:id,clauseId:null,baseVersion:0};}
    if(kind==='constitution-propose'){type='constitution.propose';payload={...data,constitutionId:id,baseVersion:Number(data.baseVersion)};}
    if(kind==='constitution-review'){type='constitution.review';payload={...data,constitutionId:id};}
    if(kind==='constitution-comment'){type='constitution.comment';payload={constitutionId:id,proposalId:form.dataset.subid,text:data.text};}
    if(kind==='profile'){type='profile.update';payload={...data,directoryConsent:fd.has('directoryConsent'),contactConsent:fd.has('contactConsent')};}
    if(kind==='group'&&isPilot()&&isOrganiser())type='group.create';
    if(kind==='project'||kind==='priority'){type=kind==='project'?'project.create':'project.priority';payload={...data,urgency:Number(data.urgency),importance:Number(data.importance),...(kind==='priority'?{projectId:id}:{})};}
    if(kind==='person')type='person.create';
    if(kind==='task'){type='task.add';payload={projectId:id,title:data.title};}
    if(kind==='comment'){type='comment.add';payload={projectId:id,text:data.text};}
    if(kind==='stage'){type='project.status';payload={projectId:id,status:data.status};}
    if(kind==='hours'){type='contribution.log';payload={...data,hours:Number(data.hours),publicConsent:fd.has('publicConsent')};}
    if(kind==='withdraw'){type='membership.withdraw';payload={membershipId:id};}
    if (kind === 'onboarding-start') { type = 'onboarding.start'; payload = { policyVersion: data.policyVersion, acknowledged: fd.has('acknowledged') }; }
    if (kind === 'onboarding-submit') {
      type = 'onboarding.submit';
      const answers = Object.fromEntries(Object.entries(data).filter(([key]) => key.startsWith('answer.')).map(([key, value]) => [key.slice(7), value]));
      payload = { caseId: id, policyVersion: data.policyVersion, answers };
    }
    if (kind === 'onboarding-review') { type = 'onboarding.review'; payload = { caseId: id, outcome: data.outcome, reason: data.reason }; }
    if (kind === 'onboarding-withdraw') { type = 'onboarding.withdraw'; payload = { caseId: id }; }
    if(!type)throw new Error('Unknown action.');await command(type,payload);if($('#dialog').open)closeDialog();
    if (type.startsWith('onboarding.')) { focusPage(); notify('Saved in the practice application.'); }
    else notify(kind==='hours'?'Contribution submitted for independent review.':'Saved. Your workspace is up to date.');
  }catch(err){if(error)error.textContent=err.message;else notify(err.message);}finally{if(submit)submit.disabled=false;}
});
document.addEventListener('change',async event=>{try{if(await handleGamifyChange(event.target,api,render))return;if(event.target.id==='constitution-select'){location.hash=`constitution/${event.target.value}`;return;}if(event.target.id==='demo-role')await setRole(event.target.value);if(event.target.matches('[data-task]')){const input=event.target;input.disabled=true;await command('task.toggle',{projectId:input.dataset.project,taskId:input.dataset.task});}if(['theme-filter','status-filter'].includes(event.target.id))filterProjects();}catch(err){notify(err.message);render();}});
function filterProjects(){const query=($('#project-search')?.value||'').toLowerCase(),theme=$('#theme-filter')?.value,status=$('#status-filter')?.value;const matches=state.projects.filter(p=>(!theme||p.theme===theme)&&(!status||p.status===status)&&`${p.title} ${p.summary} ${group(p.groupId)?.name}`.toLowerCase().includes(query));$('#project-results').innerHTML=matches.map(projectCard).join('')||'<div class="empty">No projects match. Try another word or pathway.</div>';}
document.addEventListener('input', event => {
  if (!event.target.matches('[data-campaign-field]')) return;
  const panel = $('#campaign-prompt-panel');
  const fields = Object.fromEntries(Array.from(panel.querySelectorAll('[data-campaign-field]'), field => [field.dataset.campaignField, field.value]));
  $('#campaign-prompt').value = campaignReplicationPrompt(fields);
});
document.addEventListener('input',event=>{if(event.target.id==='project-search')filterProjects();if(event.target.id==='people-search'){$('#people-results').innerHTML=peopleRows(state.people.filter(p=>`${p.name} ${p.place} ${p.skills} ${p.interests}`.toLowerCase().includes(event.target.value.toLowerCase())));}});
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);focusPage();});
$('#dialog').addEventListener('click',event=>{if(event.target===$('#dialog')){const r=$('#dialog').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog();}});
try{await load();render();}catch(err){$('#main').innerHTML=`<div class="panel"><h1>The workspace could not open.</h1><p class="muted subheading">${e(err.message)}</p><button class="button" id="retry">Try again</button></div>`;$('#retry').onclick=()=>location.reload();}
