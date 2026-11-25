// Private committee workspace. The Pages preview never imports this module.
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=value=>String(value||'').replaceAll('-',' ');
const href=(id,tab='',item='')=>'#committee/'+encodeURIComponent(id)+(tab?'/'+tab:'')+(item?'/'+encodeURIComponent(item):'');
const link=(id,tab,title,item='')=>'<a class="button secondary small" href="'+href(id,tab,item)+'">'+esc(title)+'</a>';
const card=(title,body)=>'<section class="panel"><h2>'+esc(title)+'</h2>'+body+'</section>';
const status=v=>'<span class="chip">'+esc(label(v))+'</span>';
const option=(v,t,selected=false)=>'<option value="'+esc(v)+'"'+(selected?' selected':'')+'>'+esc(t)+'</option>';
const field=(title,name,value='',type='text',required=true,max=180)=>'<label class="field">'+esc(title)+'<input type="'+type+'" name="'+esc(name)+'" value="'+esc(value)+'"'+(required?' required':'')+' maxlength="'+max+'"></label>';
const area=(title,name,value='',max=2000,required=false)=>'<label class="field">'+esc(title)+'<textarea name="'+esc(name)+'" maxlength="'+max+'"'+(required?' required':'')+'>'+esc(value)+'</textarea></label>';
const select=(title,name,opts,required=true)=>'<label class="field">'+esc(title)+'<select name="'+esc(name)+'"'+(required?' required':'')+'>'+opts.join('')+'</select></label>';
const hidden=(name,value)=>'<input type="hidden" name="'+esc(name)+'" value="'+esc(value)+'">';
const form=(type,body,button,meta={})=>'<form data-committee-form="'+esc(type)+'" class="subheading">'+Object.entries(meta).map(([k,v])=>hidden(k,v)).join('')+body+'<div class="form-error" role="alert"></div><button type="submit" class="button">'+esc(button)+'</button></form>';
const permitted=(d,p,ro)=>!ro&&d.permissions[p]===true;
const heading=(title,copy)=>'<div class="page-heading"><div><span class="eyebrow">Scoped committee workspace</span><h1>'+esc(title)+'</h1><p>'+esc(copy)+'</p></div></div>';
function name(d,id){return d.officePeople.find(p=>p.id===id)?.name||id||'Not assigned';}
function dateText(m){return esc(m.date)+' · '+esc(m.time)+' AEST';}
function meetingList(d,ro){
  const c=d.committee.id,can=permitted(d,'committee.meeting.manage',ro);
  const items=d.meetings.slice().sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  return card('Meeting register',items.map(m=>'<article class="activity-line"><div><h3><a href="'+href(c,'meeting',m.id)+'">'+esc(m.title)+'</a></h3><p>'+dateText(m)+' · '+esc(m.location)+' · '+status(m.status)+'</p><p>'+esc(label(m.kind))+' · revision '+m.version+'</p></div></article>').join('')||'<p>No scheduled working meetings.</p>')+
    (items.length?'<div class="button-row"><button type="button" class="button secondary" data-committee-calendar>Download private calendar (.ics)</button><button type="button" class="button quiet" data-committee-print>Print register</button></div>':'')+
    (can?card('Schedule a proposed working meeting',form('meeting.schedule',
      field('Meeting title','title')+select('Meeting type','kind',['committee','formation','agm','special','informal'].map(v=>option(v,label(v))))+
      field('Date','date','','date')+field('Brisbane time','time','','time')+field('Proposed location','location'),'Save schedule')):'');
}
function attendance(d,m,ro){
  const a=m.attendance,can=permitted(d,'committee.attendance',ro)&&m.status==='open';
  const list=values=>values.map(i=>esc(name(d,i))).join(', ')||'None recorded';
  const details='<p>Present: '+list(a.present)+'</p><p>Apologies: '+list(a.apologies)+'</p><p>Recused: '+list(a.recused)+'</p><p>'+esc(a.conflicts)+'</p><p>'+esc(m.quorum.status==='not-established'?'Formal quorum is not established.':m.quorum.status+' · '+m.quorum.present+' of '+m.quorum.required+' fictional quorum threshold')+'</p>';
  if(!can)return card('Attendance and conflicts',details);
  const checks=d.officePeople.map(p=>'<fieldset><legend>'+esc(p.name)+' · '+esc(p.roles.map(label).join(', '))+'</legend>'+['present','apologies','recused'].map(k=>'<label class="check-field"><input type="checkbox" name="'+k+'" value="'+esc(p.id)+'"'+(a[k].includes(p.id)?' checked':'')+'> '+esc(label(k))+'</label>').join('')+'</fieldset>').join('');
  return card('Attendance and conflicts',details+form('meeting.attendance',checks+area('Conflicts or observations','conflicts',a.conflicts,1000),'Save attendance',{meetingId:m.id}));
}
function motionView(d,m,item,ro,actor){
  const editable=['scheduled','open'].includes(m.status),can=editable&&permitted(d,'committee.motion.write',ro);
  const projects=()=>[option('','No linked project'),...d.projects.map(p=>option(p.id,p.title))];
  const drafts=()=>[option('','No linked constitution draft'),...d.constitutions.map(p=>option(p.id,p.title+' · version '+p.version))];
  return item.motions.map(v=>'<article class="panel"><h4>Proposed motion · version '+v.version+'</h4><p>'+esc(v.text)+'</p><p>Proposed by '+esc(name(d,v.authorId))+'</p>'+
    (v.projectId&&d.projects.some(p=>p.id===v.projectId)?'<p><a href="#project/'+esc(v.projectId)+'">Open linked project</a></p>':'')+
    (v.constitutionId&&d.constitutions.some(p=>p.id===v.constitutionId)?'<p><a href="#constitution/'+esc(v.constitutionId)+'">Open existing constitution draft</a> · referenced version '+v.constitutionVersion+'</p>':'')+
    (v.ballot?'<p>Fictional rehearsal ballot: '+status(v.ballot.status)+(v.ballot.outcome?' · '+esc(label(v.ballot.outcome)):'')+'</p>':'<p>Draft proposal only. No vote or formal decision recorded.</p>')+
    (v.history.length?'<details><summary>Earlier wording</summary>'+v.history.map(h=>'<p>Version '+h.version+' · '+esc(h.reason)+'<br>'+esc(h.text)+'</p>').join('')+'</details>':'')+
    (can&&v.authorId===actor.id&&!v.ballot?form('motion.amend',area('Revised wording','text',v.text,2000,true)+area('Reason','reason','',500,true),'Save revision',{meetingId:m.id,motionId:v.id,version:v.version}):'')+'</article>').join('')+
    (can&&m.kind!=='informal'?form('motion.propose',area('Proposed wording','text','',2000,true)+select('Related project','projectId',projects(),false)+select('Related constitution draft','constitutionId',drafts(),false),'Save motion as draft',{meetingId:m.id,itemId:item.id}):'');
}
function minutes(d,m,ro,actor){
  const n=m.minutes,write=permitted(d,'committee.minutes.write',ro)&&['open','closed'].includes(m.status)&&n.status!=='reviewed';
  const review=permitted(d,'committee.minutes.review',ro)&&m.status==='closed'&&n.status==='draft'&&n.text&&n.editedBy!==actor.id;
  return card('Working minutes',status(n.status)+' · version '+n.version+'<p>'+esc(n.text||'No minutes recorded. Manual notes only. No recording or AI upload is enabled.')+'</p>'+
    (n.editedBy?'<p>Last saved by '+esc(name(d,n.editedBy))+'</p>':'')+
    (n.reviewedBy?'<p>Reviewed by '+esc(name(d,n.reviewedBy))+' · '+esc(n.reviewReason)+'</p>':'')+
    (n.history.length?'<details><summary>Previous saved versions</summary>'+n.history.map(h=>'<p>Version '+h.version+' · '+esc(h.editedBy||'Initial')+'<br>'+esc(h.text)+'</p>').join('')+'</details>':'')+
    (write?form('minutes.save',area('Working minutes','text',n.text,12000,true),'Save working minutes',{meetingId:m.id,version:n.version}):'')+
    (review?form('minutes.review',area('Independent review reason','reason','',1000,true),'Review working minutes',{meetingId:m.id,version:n.version}):'')+
    '<p class="muted">Review confirms a working record only. Release to members, recording, AI processing and formal governance decisions remain disabled.</p>');
}
function dutyForm(d,ro,m=null){
  if(!permitted(d,'committee.task.assign',ro)||!d.officePeople.length||(m&&!['open','closed'].includes(m.status)))return '';
  const owner=select('Assigned office participant','ownerId',d.officePeople.map(p=>option(p.id,p.name+' · '+p.roles.map(label).join(', '))));
  const project=select('Existing project (optional)','projectId',[option('','Committee-only duty'),...d.projects.map(p=>option(p.id,p.title))],false);
  const motion=m?select('Related motion (optional)','motionId',[option('','General follow-up'),...m.agenda.flatMap(i=>i.motions).map(v=>option(v.id,v.text.slice(0,100)))],false):'';
  return card('Assign a working duty',form('duty.assign',field('Task title','title','', 'text',true,200)+area('Private instructions','details','',1000)+owner+field('Due date','dueDate','','date',false)+project+motion,'Assign duty',m?{meetingId:m.id}:{}));
}
function meetingPage(d,m,ro,actor){
  if(!m)return card('Meeting unavailable','<p>Choose a meeting in this committee register.</p>');
  const can=permitted(d,'committee.meeting.manage',ro),editable=['scheduled','open'].includes(m.status);
  let actions='';
  if(can&&m.status==='scheduled'){
    actions+=form('meeting.reschedule',field('New date','date',m.date,'date')+field('Brisbane time','time',m.time,'time')+field('Proposed location','location',m.location)+area('Reason','reason','',500,true),'Reschedule',{meetingId:m.id});
    actions+=form('meeting.cancel',area('Cancellation reason','reason','',500,true),'Cancel proposed meeting',{meetingId:m.id});
    if(Date.parse(m.date+'T'+m.time+':00+10:00')<=Date.now())actions+=form('meeting.open','','Open working meeting',{meetingId:m.id});
  }
  if(can&&m.status==='open')actions+=form('meeting.close','','Close working meeting',{meetingId:m.id});
  const agenda=m.agenda.map(item=>'<article class="panel"><h3>'+esc(item.title)+'</h3><p>'+esc(item.notes)+'</p>'+
    (can&&editable?form('agenda.edit',field('Heading','title',item.title)+area('Discussion notes','notes',item.notes,2000),'Save agenda item',{meetingId:m.id,itemId:item.id}):'')+
    motionView(d,m,item,ro,actor)+'</article>').join('');
  return '<a href="'+href(d.committee.id,'meetings')+'">Back to meeting register</a>'+
    card(m.title,'<p>'+dateText(m)+' · '+esc(m.location)+'</p><p>'+status(m.status)+' · '+esc(label(m.kind))+' · revision '+m.version+'</p>'+actions)+
    attendance(d,m,ro)+card('Agenda and draft motions',agenda+(can&&editable?form('agenda.add',field('New agenda heading','title')+area('Notes','notes'),'Add agenda item',{meetingId:m.id}):''))+
    minutes(d,m,ro,actor)+dutyForm(d,ro,m)+card('Meeting follow-ups',duties(d,ro,actor,d.actions.filter(a=>a.meetingId===m.id)))+
    card('Revision history','<details><summary>View recorded changes</summary>'+m.history.map(h=>'<p>Revision '+h.version+' · '+esc(label(h.action))+' · '+esc(name(d,h.actorId))+' · '+esc(h.at)+'</p>').join('')+'</details>');
}
function duties(d,ro,actor,rows=d.actions){
  return rows.map(a=>{
    const own=a.ownerId===actor.id&&permitted(d,'committee.task.own',ro);
    return '<article class="activity-line"><div><h3>'+esc(a.title)+'</h3><p>'+status(a.done?'complete':a.acknowledgedAt?'acknowledged':'assigned')+' · '+esc(name(d,a.ownerId))+' · Due '+esc(a.dueDate||'not set')+'</p><p>'+esc(a.details)+'</p>'+
      (a.projectId&&d.projects.some(p=>p.id===a.projectId)?'<p><a href="#project/'+esc(a.projectId)+'">Open original project task</a></p>':'')+
      (a.meetingId?'<p>'+link(d.committee.id,'meeting','Source meeting',a.meetingId)+'</p>':'')+
      (own&&!a.done?form(a.acknowledgedAt?'duty.complete':'duty.acknowledge','',a.acknowledgedAt?'Complete duty':'Acknowledge duty',{actionId:a.id}):'')+
      (a.completedBy?'<p>Completed by '+esc(name(d,a.completedBy))+' · '+esc(a.completedAt)+'</p>':'')+'</div></article>';
  }).join('')||'<p>No duties in your authorised view.</p>';
}
function notices(d,ro){
  return card('Internal inbox',d.notices.map(n=>'<article class="activity-line"><div><h3>'+esc(n.title)+'</h3><p>'+status(n.resolved?'resolved':n.unread?'unread':'seen')+' · '+(n.reviewed?'Reviewed':'Not reviewed')+' · revision '+n.version+'</p>'+
    (n.kind==='meeting'?link(d.committee.id,'meeting','Open meeting',n.sourceId):n.kind==='task'?link(d.committee.id,'duties','Open duty list'):'')+
    (!ro&&!n.retracted&&n.unread?form('notice.read','','Mark as read',{noticeId:n.id,version:n.version}):'')+
    (!ro&&!n.retracted&&!n.reviewed?form('notice.review','','Record review',{noticeId:n.id,version:n.version}):'')+'</div></article>').join('')||'<p>No internal notices.</p>')+
    (permitted(d,'committee.notice.write',ro)?card('Post an internal notice',form('notice.post',field('Notice','title','','text',true,240),'Save in-app notice')+'<p>Visible within this committee only. No email, invitation or external message is sent.</p>'):'');
}
function released(d){return card('Released minutes',d.releasedMinutes.map(m=>'<article><h3>'+esc(m.title)+'</h3><p>'+esc(m.date)+' · Fictional member excerpt · version '+m.version+'</p><p>'+esc(m.text)+'</p></article>').join('')||'<p>No member excerpts are released. Formal release is not enabled.</p>');}
function home(d,ro){
  return card('Prospective office register',d.committee.offices.map(o=>'<p>'+esc(label(o.role))+' · '+status(o.status)+' '+(o.personId?esc(name(d,o.personId)):'')+'</p>').join('')+
    '<p>Office reservations are not appointments. Current technical grants and actual office authority are separate.</p>')+
    card('Connected work',d.constitutions.map(p=>'<p><a href="#constitution/'+esc(p.id)+'">'+esc(p.title)+'</a> · working version '+p.version+'</p>').join('')+
    d.projects.map(p=>'<p><a href="#project/'+esc(p.id)+'">'+esc(p.title)+'</a></p>').join('')+
    '<p>These are existing workspace records, not copies.</p>')+
    card('Current desk overview','<p>'+d.meetings.filter(m=>m.status==='scheduled').length+' proposed meetings · '+d.actions.filter(a=>!a.done).length+' open visible duties · '+d.notices.filter(n=>n.unread&&!n.resolved).length+' unread open notices.</p>');
}
function directory(d,ro){
  const entries=d.committees.map(c=>'<article class="panel"><h2><a href="'+href(c.id,'overview')+'">'+esc(c.name)+'</a></h2><p>'+esc(label(c.kind))+' · '+status(c.status)+' · '+(c.working?'Working desk':'Limited view')+'</p></article>').join('');
  return heading('My Committee','Committee access requires an explicit scope grant; ordinary working-group participation is not an office.')+
    (entries||'<p>No committees in your current authorised view.</p>')+
    (!ro&&d.proposalGroups.length?card('Propose a committee',form('committee.propose',field('Proposed name','name')+select('Scope','kind',['local','state','territory','national'].map(v=>option(v,label(v))))+select('Connected working group','groupId',d.proposalGroups.map(g=>option(g.id,g.name))),'Save proposal')+'<p>This creates a draft with vacant offices. It does not establish a committee or grant anyone new access.</p>'):'');
}
function detail(d,tab,item,ro,actor){
  const c=d.committee;
  let content;
  if(!d.working)content=card('Limited committee view','<p>Working records and technical office permissions are not included in this account.</p>')+released(d);
  else if(tab==='meetings')content=meetingList(d,ro);
  else if(tab==='meeting')content=meetingPage(d,d.meetings.find(m=>m.id===item),ro,actor);
  else if(tab==='duties')content=card('Officer duties',duties(d,ro,actor)+'<button class="button secondary" data-committee-print type="button">Print visible duties</button>')+dutyForm(d,ro);
  else if(tab==='notices')content=notices(d,ro);
  else if(tab==='released')content=released(d);
  else content=home(d,ro);
  const nav=d.working?'<nav class="button-row" aria-label="Committee desks">'+[['overview','Overview'],['meetings','Meeting register'],['duties','Officer duties'],['notices','Internal inbox'],['released','Released minutes']].map(([k,t])=>link(c.id,k,t)).join('')+'</nav>':'';
  return '<a href="#committee">My Committee directory</a>'+heading(c.name,'Working proposals only. No adopted rules, formal vote or external communications are enabled.')+nav+content;
}
function calendar(rows){
  const escIcs=v=>String(v??'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
  const stamp=new Date().toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//P4A//Private working calendar//EN','CALSCALE:GREGORIAN'];
  for(const m of rows.filter(m=>m.status==='scheduled'||m.status==='open')){
    const start=new Date(m.date+'T'+m.time+':00+10:00').toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
    lines.push('BEGIN:VEVENT','UID:'+escIcs(m.id)+'@p4a-workspace','DTSTAMP:'+stamp,'DTSTART:'+start,'SUMMARY:'+escIcs('Proposed: '+m.title),'LOCATION:'+escIcs(m.location),'CLASS:PRIVATE','STATUS:TENTATIVE','END:VEVENT');
  }
  lines.push('END:VCALENDAR','');
  return lines.join('\r\n');
}
const pending=new Map();
function payload(formEl){
  const fd=new FormData(formEl),d=Object.fromEntries(fd);
  if(formEl.dataset.committeeForm==='meeting.attendance')for(const k of ['present','apologies','recused'])d[k]=fd.getAll(k);
  if('version'in d)d.version=Number(d.version);
  return d;
}
export async function mountCommittee(root,{api,actor,readOnly,route,onSaved}){
  const [,id,tab='overview',item]=route.split('/');
  const d=await api('/api/committee'+(id?'?id='+encodeURIComponent(id):''));
  if(location.hash.slice(1)!==route)return;
  const ro=readOnly||d.readOnly||d.fictional;
  root.innerHTML=(ro?'<div class="callout"><strong>Fictional, read-only committee preview.</strong> No changes, downloads or printing from the demo.</div>':'')+(id?detail(d,tab,item,ro,actor):directory(d,ro));
  if(ro){root.querySelectorAll('[data-committee-calendar],[data-committee-print]').forEach(el=>el.remove());return;}
  root.querySelector('[data-committee-calendar]')?.addEventListener('click',()=>{
    const blob=new Blob([calendar(d.meetings)],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='p4a-private-working-calendar.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  root.querySelectorAll('[data-committee-print]').forEach(b=>b.addEventListener('click',()=>window.print()));
  for(const f of root.querySelectorAll('[data-committee-form]'))f.addEventListener('submit',async ev=>{
    ev.preventDefault();const b=f.querySelector('button[type=submit]'),error=f.querySelector('.form-error');
    const type=f.dataset.committeeForm,data=payload(f);if(id)data.committeeId=id;
    const key=JSON.stringify({actorId:actor.id,type,data}),commandId=pending.get(key)||crypto.randomUUID();
    pending.set(key,commandId);b.disabled=true;error.textContent='';
    try{
      const out=await api('/api/committee',{method:'POST',body:JSON.stringify({id:commandId,type,data,revision:d.revision})});
      pending.delete(key);
      await onSaved(type,out);
    }catch(err){error.textContent=err.message+(err.status===409?' Your input is retained; refresh the workspace before retrying.':'');b.disabled=false;}
  });
}
