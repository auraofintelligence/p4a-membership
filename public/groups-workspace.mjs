const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rows=value=>Array.isArray(value)?value:[];
const route=(area,id,tail='')=>'#'+area+'/'+encodeURIComponent(id)+(tail?'/'+tail:'');
const plural=(n,one,many=one+'s')=>n+' '+(n===1?one:many);

// Work only with the caller's already-authorised bootstrap projection.
// Relationships organise records; they never supply additional access.
export function groupWorkspaceData(state,groupId){
  const group=rows(state?.groups).find(g=>g?.id===groupId);
  if(!group)return null;
  return {
    group,
    projects:rows(state.projects).filter(p=>p?.groupId===group.id),
    committees:rows(state.committeeDirectory?.committees).filter(c=>c?.groupId===group.id),
    charters:rows(state.constitutions).filter(d=>d?.scope==='local-charter'&&d.groupId===group.id),
  };
}

export function groupWorkspace(state,groupId,{icon=()=>'',projectCard,readOnly=false,canCreateProject=false,canProposeCommittee=false,canCreateCharter=false}={}){
  const data=groupWorkspaceData(state,groupId);
  if(!data)return '<section class="panel group-workspace"><h1>Working group unavailable</h1><p>This group is not available in your current view.</p><a class="button secondary" href="#groups">Back to working groups</a></section>';
  const {group,projects,committees,charters}=data;
  const action=(name,title,allowed)=>allowed?'<button class="button secondary small" type="button" data-action="'+name+'" data-id="'+esc(group.id)+'"'+(readOnly?' disabled aria-disabled="true"':'')+'>'+esc(title)+'</button>':'';
  const step=(number,title,copy,present,key)=>'<li class="group-setup-step" data-connected="'+present+'"><span class="group-step-icon">'+icon(key)+'</span><div><span class="group-step-number">'+number+'</span><h3>'+esc(title)+'</h3><p>'+esc(copy)+'</p></div><span class="group-step-state">'+(present?'Connected here':'Ready when needed')+'</span></li>';
  const projectItem=p=>'<a class="group-record-card" href="'+route('project',p.id)+'"><span class="chip">'+esc(p.status||'proposed')+'</span><h3>'+esc(p.title)+'</h3><p>'+esc(p.summary)+'</p><span class="group-record-meta">'+plural(rows(p.tasks).filter(t=>t.done).length,'action')+' complete · '+rows(p.tasks).length+' total <span aria-hidden="true">→</span></span></a>';
  const committeeItem=c=>'<a class="group-record-card group-committee-card" href="'+route('committee',c.id,c.working?'overview':'released')+'">'+icon('committees')+'<div><span class="chip">'+esc(c.status||'proposed')+'</span><h3>'+esc(c.name)+'</h3><p>'+esc(c.working?'Meetings, shared duties and the working record.':'The committee records shared with your role.')+'</p><span class="group-record-meta">'+(c.working?'Open committee room':'View shared records')+' <span aria-hidden="true">→</span></span></div></a>';
  const charterItem=d=>'<a class="group-record-card group-charter-card" href="'+route('constitution',d.id)+'">'+icon('constitution')+'<div><span class="chip">Working draft</span><h3>'+esc(d.title)+'</h3><p>Version '+esc(d.version)+' · '+plural(rows(d.clauses).length,'clause')+'</p><span class="group-record-meta">Open the existing charter <span aria-hidden="true">→</span></span></div></a>';
  const memberCount=Number.isSafeInteger(group.memberCount)&&group.memberCount>=0?'<span>'+plural(group.memberCount,'participant')+'</span>':'';
  return '<section class="group-workspace"><a class="group-return" href="#groups">← Back to working groups</a>'+
    '<header class="group-workspace-heading"><span class="group-heading-icon">'+icon('groups')+'</span><div><span class="eyebrow">Your local working space</span><h1>'+esc(group.name)+'</h1><p>'+esc(group.description||'Bring useful work, local organising and your shared rules together.')+'</p><div class="group-context">'+(group.place?'<span>'+esc(group.place)+'</span>':'')+'<span>'+esc(group.level||'Working group')+'</span>'+memberCount+'<span>'+(group.public===true?'Publicly listed group':'Private group')+'</span></div></div></header>'+
    '<section class="group-setup" aria-labelledby="group-setup-title"><div class="section-heading"><div><h2 id="group-setup-title">Getting organised, together</h2><p>Start with useful work. Add the organising tools your group needs, and connect with other groups when you choose.</p></div></div><ol class="group-setup-steps">'+
      step('01','Shared projects',projects.length?plural(projects.length,'project')+' available to work on.':'Choose a practical idea and organise its next steps.',projects.length>0,'projects')+
      step('02','Your committee',committees.length?plural(committees.length,'committee')+' connected to this group.':'Prepare a place for meetings and responsibilities.',committees.length>0,'committees')+
      step('03','Local charter',charters.length?plural(charters.length,'working draft')+' linked to this group.':'Shape rules that fit your people and purpose.',charters.length>0,'constitution')+
    '</ol><p class="group-setup-note">This shows records available in your view. Committee proposals and charter drafts remain work in progress.</p></section>'+
    '<section class="group-work-section" aria-labelledby="group-projects-title"><div class="section-heading"><div><span class="eyebrow">Useful work</span><h2 id="group-projects-title">Shared projects</h2><p>Keep the tasks and conversations with the project they belong to.</p></div>'+action('new-project','Start a project',canCreateProject)+'</div>'+
    (projects.length?'<div class="group-project-grid">'+projects.map(p=>projectCard?projectCard(p):projectItem(p)).join('')+'</div>':'<div class="group-empty"><span>'+icon('projects')+'</span><div><h3>A good place to begin</h3><p>'+esc(canCreateProject?'Choose one useful thing your group could do and give it a first step.':'Projects will appear here when they are available to your role.')+'</p></div></div>')+'</section>'+
    '<div class="group-organising-grid"><section class="group-work-section panel" aria-labelledby="group-committee-title"><div class="section-heading"><div><span class="eyebrow">Organising</span><h2 id="group-committee-title">Your committee</h2></div>'+action('plan-group-committee','Plan a committee',canProposeCommittee)+'</div><p class="group-section-copy">A shared place for meetings, duties, working papers and follow-up.</p>'+
    (committees.length?'<div class="group-record-list">'+committees.map(committeeItem).join('')+'</div>':'<div class="group-empty"><span>'+icon('committees')+'</span><div><h3>No committee is available here yet</h3><p>'+esc(canProposeCommittee?'Save a proposal around this group, with the prospective offices left vacant.':'A committee will appear here when its records are shared with your role.')+'</p></div></div>')+'</section>'+
    '<section class="group-work-section panel" aria-labelledby="group-charter-title"><div class="section-heading"><div><span class="eyebrow">Shared rules</span><h2 id="group-charter-title">Local charter</h2></div>'+action('constitution-create','Create a local charter',canCreateCharter)+'</div><p class="group-section-copy">Use the existing constitution workbench to discuss and review wording for this group.</p>'+
    (charters.length?'<div class="group-record-list">'+charters.map(charterItem).join('')+'</div>':'<div class="group-empty"><span>'+icon('constitution')+'</span><div><h3>No local charter is available here yet</h3><p>'+esc(canCreateCharter?'Start a linked working draft, then shape its clauses together.':'Linked drafts will appear when you have permission to view them.')+'</p></div></div>')+'</section></div></section>';
}
