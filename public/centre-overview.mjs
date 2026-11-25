const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const committeePath = (id, tab = 'overview') => id ? `committee/${encodeURIComponent(id)}/${tab}` : 'committee';

const catalogue = [
  {id:'together', title:'People & projects', copy:'Find your people and move shared work forward.', items:[
    ['projects','Shared projects','Ideas, tasks and project conversations.','projects','member'],
    ['groups','Working groups','Local groups and the people taking part.','groups','member'],
    ['people','People & relationships','Find collaborators and manage your contacts.','people','chair'],
    ['priority','What matters now','Review urgency, importance and the next step.','priority','chair'],
    ['nodes','Local nodes','Discover places and connected community initiatives.','nodes','member'],
  ]},
  {id:'committee',title:'Committee room',copy:'Meet, share responsibilities and keep the working record together.',items:[
    ['committee','Committee overview','See the next meeting, duties and messages.','committees','chair','overview'],
    ['committee','Meetings & calendar','Agenda, attendance, notes and meeting follow-up.','meetings','secretary','meetings'],
    ['committee','Duties','Assigned responsibilities and linked project tasks.','duties','secretary','duties'],
    ['committee','Committee inbox','Internal notices, acknowledgements and reviews.','inbox','secretary','notices'],
    ['committee','Documents','Working papers, versions and review history.','documents','secretary','library'],
    ['committee','Newsletters','Contributions, draft editions and independent review.','editions','secretary','editions'],
    ['committee','Partnership proposals','Discuss scope, responsibilities and proposed collaboration.','partnerships','chair','partnerships'],
    ['committee','Treasurer desk','Recorded receipts, expenses, budgets and reconciliation.','treasury','treasurer','finance'],
    ['committee','Office holders','Current office records and proposed transitions.','office-holders','secretary','offices'],
  ]},
  {id:'learning',title:'Membership & learning',copy:'Your participation, learning and contribution.',items:[
    ['onboarding','Membership pathway','Understand the steps and review your progress.','onboarding','applicant'],
    ['training','Civic training','Practical lessons for taking part in civic life.','training','member'],
    ['gamify/games','Team games','Activities for learning and building relationships.','team-games','member'],
    ['gamify','Gamify Democracy','Participation, contribution records and recognition.','gamify','member'],
    ['hours','Voluntary contributions','Your time, evidence and independent receipt reviews.','hours','member'],
    ['profile','Your profile','Your details, preferences and membership information.','profile','member'],
  ]},
  {id:'planning',title:'Planning & calculators',copy:'Explore scenarios. These tools do not move money.',items:[
    ['campaigns','Campaign workspace','Organise ideas, places and practical campaign planning.','campaigns','member'],
    ['readiness','Electoral readiness','Explore dates, requirements and planning context.','readiness','member'],
    ['finance','Membership income calculator','Model member numbers and membership income across electorates.','membership-calculator','member'],
    ['finance/detail','Detailed budget planner','Build operating and campaign budget scenarios.','budget-planner','member'],
    ['merch','Merch calculator','Explore sales volumes and profit assumptions.','merch','member'],
    ['hours/calculator','Giving calculator','Model donation schedules and potential bequests.','giving','member'],
    ['finance/compare','Compare funding scenarios','Bring the membership, giving and merch estimates together.','funding-compare','member'],
  ]},
  {id:'knowledge',title:'Rules, ideas & transparency',copy:'Work on shared rules and explore the wider civic tools.',items:[
    ['constitution','Constitution workbench','Discussion drafts, amendments and review history.','constitution','chair'],
    ['transparency','Transparency','View the reporting information available to you.','transparency','member'],
    ['resources','Connected ideas & public tools','Household Bill Check, Legal Engine, Aura and more.','resources','member'],
  ]},
];

export function centreToolGroups({canOpen, civicTools, previewRole, perspectiveUrl, committeeId, committeeAllows=()=>true}) {
  const inspection = previewRole === 'webmaster';
  return catalogue.map(group => ({...group,items:group.items.flatMap(([route,title,description,icon,role,tab]) => {
    const key=route.split('/')[0];
    if ((!inspection && (!canOpen(key) || (tab && !committeeAllows(tab)))) || (['training','readiness'].includes(key) && !civicTools)) return [];
    const target=key==='committee'?committeePath(inspection?'committee-1':committeeId,tab):route;
    const href=inspection?perspectiveUrl(role).split('#')[0]+'#'+target:'#'+target;
    return [{route:target,title,description,icon,href,role:inspection?role:null}];
  })})).filter(group=>group.items.length);
}

export function toolsDirectory(options, {icon}) {
  const groups=centreToolGroups(options), count=groups.reduce((n,g)=>n+g.items.length,0);
  return `<section class="centre-tools"><div class="page-heading"><div><span class="eyebrow">Everything in its place</span><h1>All tools</h1><p>Choose the kind of work you want to do.</p></div></div>
    ${options.previewRole==='webmaster'?'<p class="centre-context-note">Each example opens in the relevant fictional role. The role is shown on the card and in the page header.</p>':''}
    <div class="centre-tool-filter"><label for="centre-tool-search">Find a tool</label><input id="centre-tool-search" type="search" placeholder="Try meetings, expenses, learning…" maxlength="120" autocomplete="off"><span id="centre-tool-count" role="status">${count} tools</span></div>
    <nav class="centre-category-links" aria-label="Tool categories">${groups.map(g=>`<a href="#tools" data-tool-category="${g.id}">${esc(g.title)}</a>`).join('')}</nav>
    ${groups.map(g=>`<section class="centre-tool-group" id="tools-${g.id}"><div class="section-heading"><div><h2>${esc(g.title)}</h2><p>${esc(g.copy)}</p></div></div><div class="centre-tool-grid">${g.items.map(t=>`<a class="centre-tool-card" href="${esc(t.href)}" data-tool-search="${esc((t.title+' '+t.description+' '+g.title).toLowerCase())}">${icon(t.icon)}<div><h3>${esc(t.title)} <span aria-hidden="true">→</span></h3><p>${esc(t.description)}</p>${t.role?`<small>${esc(t.role.replaceAll('-',' '))} example</small>`:''}</div></a>`).join('')}</div></section>`).join('')}
    <div class="centre-search-empty panel" hidden><h2>No matching tools</h2><p>Try a shorter word, or clear the search to see everything.</p></div>
  </section>`;
}

export function mountToolsDirectory(root,{snapshot={},onChange=()=>{}}={}) {
  const input=root.querySelector('#centre-tool-search');
  if(!input)return;
  input.value=snapshot.query||'';
  root.dataset.toolCategory=snapshot.category||'';
  const markCategory=()=>root.querySelectorAll('[data-tool-category]').forEach(link=>{
    if(link.dataset.toolCategory===root.dataset.toolCategory)link.setAttribute('aria-current','location');
    else link.removeAttribute('aria-current');
  });
  const filter=()=>{
    const query=input.value.trim().toLowerCase();let visible=0;
    root.querySelectorAll('[data-tool-search]').forEach(card=>{card.hidden=!card.dataset.toolSearch.includes(query);if(!card.hidden)visible++;});
    root.querySelectorAll('.centre-tool-group').forEach(group=>{group.hidden=!group.querySelector('[data-tool-search]:not([hidden])');});
    root.querySelector('#centre-tool-count').textContent=`${visible} ${visible===1?'tool':'tools'}`;
    root.querySelector('.centre-search-empty').hidden=visible>0;
  };
  input.addEventListener('input',()=>{root.dataset.toolCategory='';markCategory();filter();onChange();});
  root.querySelectorAll('[data-tool-category]').forEach(link=>link.addEventListener('click',event=>{
    event.preventDefault();input.value='';filter();
    root.dataset.toolCategory=link.dataset.toolCategory;markCategory();
    const section=root.querySelector('#tools-'+link.dataset.toolCategory);
    section.scrollIntoView({block:'start'});const title=section.querySelector('h2');title.tabIndex=-1;title.focus({preventScroll:true});onChange();
  }));
  filter();markCategory();
}

export function workspaceHome({state, canOpen, previewRole, perspectiveUrl, committee, projectCard, icon, dateText, startAction, purpose}) {
  const inspection=previewRole==='webmaster';
  const projects=(state.projects||[]).filter(p=>p.participantIds?.includes(state.actor.id)||p.ownerId===state.actor.id);
  const tasks=(state.projects||[]).flatMap(p=>(p.tasks||[]).filter(t=>!t.done&&t.assigneeId===state.actor.id).map(t=>({...t,project:p})));
  const links=[];
  if(inspection)links.push({title:'Explore the centre',copy:'Browse the tools in their relevant example roles.',href:'#tools',icon:'tools'});
  else if(canOpen('committee'))links.push({title:committee?.name||'Your committees',copy:'Meetings, duties and the work you share.',href:'#'+committeePath(committee?.id),icon:'committees'});
  if(canOpen('projects'))links.push({title:'Shared projects',copy:projects.length?`${projects.length} ${projects.length===1?'project':'projects'} you are taking part in.`:'Find a project or start with your working group.',href:'#projects',icon:'projects'});
  if(canOpen('training'))links.push({title:'Learning & participation',copy:'Build skills and find ways to contribute.',href:'#training',icon:'training'});
  if(canOpen('webmaster'))links.push({title:'Webmaster',copy:'Manage access and inspect the centre.',href:'#webmaster',icon:'webmaster'});
  if(!links.length||(!inspection&&links.length<3))links.push({title:'Your membership pathway',copy:'Your details, progress and next steps.',href:'#onboarding',icon:'onboarding'});
  const greeting=inspection?'Explore your Membership Centre':`Welcome, ${state.actor.name.split(' ')[0]}.`;
  return `<section class="centre-home"><div class="page-heading"><div><span class="eyebrow">People, place & possibility</span><h1>${esc(greeting)}</h1><p>${inspection?'A guided look at the tools, with connected fictional examples.':'Pick up your work, connect with your group, or learn something new.'}</p></div><a class="button secondary" href="#tools">Browse all tools ${icon('arrow')}</a></div>
    <div class="centre-shortcuts">${links.slice(0,4).map(l=>`<a class="centre-shortcut" href="${esc(l.href)}">${icon(l.icon)}<div><h2>${esc(l.title)}</h2><p>${esc(l.copy)}</p></div><span aria-hidden="true">→</span></a>`).join('')}</div>
    ${inspection?`<section class="centre-feature"><div><span class="eyebrow">See how it fits together</span><h2>Start in the committee room</h2><p>Follow a meeting into its agenda, shared duties, working papers and budget. Switch roles to see how each person takes part.</p><div class="button-row"><a class="button" href="${esc(perspectiveUrl('chair'))}">Open the Chair example</a><a class="button secondary" href="${esc(perspectiveUrl('member'))}">Open the Member example</a></div></div>${icon('committees')}</section>`:committee?`<section class="centre-committee-snapshot" data-home-committee="${esc(committee.id)}" aria-label="Your committee at a glance"><p class="muted" role="status">Opening your committee overview…</p></section>`:''}
    ${!inspection?`<div class="centre-home-columns"><section class="panel centre-task-panel"><div class="section-heading"><h2>Your project tasks</h2><span class="chip">${tasks.length} open</span></div>${tasks.length?`<ul class="centre-work-list">${tasks.slice(0,5).map(t=>`<li><a href="${t.committeeAction?'#'+committeePath(t.committeeId,'duties'):'#project/'+encodeURIComponent(t.project.id)}"><strong>${esc(t.title)}</strong><small>${esc(t.project.title)}${t.committeeAction?' · Committee duty':''}</small></a></li>`).join('')}</ul>`:`<p class="muted">No project tasks are assigned to you yet.</p><a class="button quiet" href="${canOpen('projects')?'#projects':'#onboarding'}">${canOpen('projects')?'Find shared work':'Open your membership pathway'} →</a>`}</section><section class="panel"><div class="section-heading"><h2>Pick up your work</h2>${canOpen('projects')?'<a href="#projects">All projects →</a>':''}</div>${projects.length?`<ul class="centre-work-list">${projects.slice(0,4).map(p=>`<li><a href="#project/${encodeURIComponent(p.id)}"><strong>${esc(p.title)}</strong><small>${(p.tasks||[]).filter(t=>t.done).length} of ${(p.tasks||[]).length} actions complete · ${esc(p.status)}</small></a></li>`).join('')}</ul>`:`<p class="muted">${canOpen('groups')?'Start with a working group, then organise a useful project together.':'Your workspace will grow as you take part.'}</p>${canOpen('groups')?'<a class="button quiet" href="#groups">Open working groups →</a>':'<a class="button quiet" href="#onboarding">See your next step →</a>'}`}</section></div>`:''}
    ${canOpen('projects')&&state.projects.length?`<section class="centre-projects"><div class="section-heading"><h2>Work worth doing, together</h2>${startAction||''}</div><div class="centre-project-grid">${state.projects.slice(0,3).map(projectCard).join('')}</div></section>`:''}
    ${state.activity?.length&&!inspection?`<details class="centre-disclosure"><summary>Recent workspace activity <span>${Math.min(state.activity.length,5)} updates</span></summary><ul class="centre-work-list">${state.activity.slice(-5).reverse().map(a=>`<li><strong>${esc(a.summary)}</strong><small>${esc(dateText(a.at))}</small></li>`).join('')}</ul></details>`:''}
    <details class="centre-disclosure centre-purpose"><summary>${icon('abundance')}<span>Our shared purpose</span><small>Joyful Responsible Abundance</small></summary><div class="centre-purpose-content">${purpose}</div></details>
  </section>`;
}

export function committeeHomeSummary(data, {actor, dateText, now=new Date()}) {
  const c=data?.committee;
  if(!c||typeof c.id!=='string'||!c.id)return '';
  if(data.working===false)return `<div class="section-heading"><div><span class="eyebrow">Committee updates</span><h2>${esc(c.name)}</h2></div></div><p class="muted">Read the meeting excerpts and documents shared with members.</p><a class="button quiet" href="#${committeePath(c.id,'released')}">Open shared committee records →</a>`;
  const rows=value=>Array.isArray(value)?value:[];
  const meetingTime=m=>Date.parse(m.date+'T'+m.time+':00+10:00');
  const meetings=rows(data.meetings).filter(m=>m&&typeof m.id==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(m.date)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(m.time)&&Number.isFinite(meetingTime(m))&&(m.status==='open'||m.status==='scheduled'&&meetingTime(m)>=now.getTime())).sort((a,b)=>Number(b.status==='open')-Number(a.status==='open')||meetingTime(a)-meetingTime(b));
  const meeting=meetings[0];
  const duties=rows(data.actions).filter(a=>a&&actor?.id&&a.ownerId===actor.id&&!a.done&&!a.cancelled);
  const unread=rows(data.notices).filter(n=>n?.unread===true&&!n.resolved&&!n.retracted);
  return `<div class="section-heading"><div><span class="eyebrow">Your committee at a glance</span><h2>${esc(c.name)}</h2></div><a href="#${committeePath(c.id)}">Open committee →</a></div><div class="centre-snapshot-grid"><a href="#${committeePath(c.id,meeting?'meeting/'+encodeURIComponent(meeting.id):'meetings')}"><span>${meeting?.status==='open'?'Meeting in progress':'Next meeting'}</span><strong>${esc(meeting?meeting.title:'No upcoming meeting')}</strong><small>${meeting?esc(dateText(meeting.date)+' · '+meeting.time):'Open the meeting calendar'}</small></a><a href="#${committeePath(c.id,'duties')}"><span>Your duties</span><strong>${duties.length} open</strong><small>${esc(duties[0]?.title||'Review shared responsibilities')}</small></a><a href="#${committeePath(c.id,'notices')}"><span>Committee inbox</span><strong>${unread.length} unread</strong><small>${esc(unread[0]?.title||'Open internal notices')}</small></a></div>`;
}
