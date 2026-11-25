// Private committee workspace. The Pages preview never imports this module.
import { civicIcon } from './civic-icons.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=value=>String(value||'').replaceAll('-',' ');
const href=(id,tab='',item='')=>'#committee/'+encodeURIComponent(id)+(tab?'/'+tab:'')+(item?'/'+encodeURIComponent(item):'');
const link=(id,tab,title,item='')=>'<a class="button secondary small" href="'+href(id,tab,item)+'">'+esc(title)+'</a>';
const card=(title,body)=>'<section class="panel"><h2>'+esc(title)+'</h2>'+body+'</section>';
const status=v=>'<span class="chip committee-status" data-status="'+esc(v)+'">'+esc(label(v))+'</span>';
const fold=(title,body,open=false)=>'<details class="panel committee-disclosure"'+(open?' open':'')+'><summary>'+esc(title)+'</summary><div class="committee-disclosure-body">'+body+'</div></details>';
const option=(v,t,selected=false)=>'<option value="'+esc(v)+'"'+(selected?' selected':'')+'>'+esc(t)+'</option>';
const field=(title,name,value='',type='text',required=true,max=180)=>'<label class="field">'+esc(title)+'<input type="'+type+'" name="'+esc(name)+'" value="'+esc(value)+'"'+(required?' required':'')+' maxlength="'+max+'"></label>';
const area=(title,name,value='',max=2000,required=false)=>'<label class="field">'+esc(title)+'<textarea name="'+esc(name)+'" maxlength="'+max+'"'+(required?' required':'')+'>'+esc(value)+'</textarea></label>';
const select=(title,name,opts,required=true)=>'<label class="field">'+esc(title)+'<select name="'+esc(name)+'"'+(required?' required':'')+'>'+opts.join('')+'</select></label>';
const hidden=(name,value)=>'<input type="hidden" name="'+esc(name)+'" value="'+esc(value)+'">';
const form=(type,body,button,meta={})=>'<form data-committee-form="'+esc(type)+'" class="subheading">'+Object.entries(meta).map(([k,v])=>hidden(k,v)).join('')+body+'<div class="form-error" role="alert"></div><button type="submit" class="button">'+esc(button)+'</button></form>';
const permitted=(d,p,ro)=>d.permissions[p]===true;
const heading=(title,copy)=>'<div class="page-heading"><div><span class="eyebrow">Organising committee</span><h1>'+esc(title)+'</h1><p>'+esc(copy)+'</p></div></div>';
function name(d,id){return d.officePeople.find(p=>p.id===id)?.name||id||'Not assigned';}
function dateLabel(value,options={day:'numeric',month:'short',year:'numeric'}){const date=new Date(value+'T12:00:00+10:00');return Number.isNaN(date.getTime())?String(value||'Date to be set'):new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Brisbane',...options}).format(date);}
function dateText(m){const date=new Date(m.date+'T'+m.time+':00+10:00');return esc(dateLabel(m.date,{weekday:'short',day:'numeric',month:'short'}))+' · '+esc(Number.isNaN(date.getTime())?m.time:new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Brisbane',hour:'numeric',minute:'2-digit'}).format(date))+' AEST';}
function dateTile(m){return '<div class="committee-date" aria-hidden="true"><span>'+esc(dateLabel(m.date,{month:'short'}))+'</span><strong>'+esc(dateLabel(m.date,{day:'numeric'}))+'</strong><span>'+esc(dateLabel(m.date,{weekday:'short'}))+'</span></div>';}
function meetingList(d,ro){
  const c=d.committee.id,can=permitted(d,'committee.meeting.manage',ro);
  const items=d.meetings.slice().sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  const current=items.filter(m=>['scheduled','open'].includes(m.status)),past=items.filter(m=>!['scheduled','open'].includes(m.status)).reverse();
  const rows=list=>list.map(m=>'<article class="committee-meeting-row">'+dateTile(m)+'<div><h3><a href="'+href(c,'meeting',m.id)+'">'+esc(m.title)+'</a></h3><p>'+dateText(m)+' · '+esc(m.location)+'</p><div class="committee-meeting-meta">'+status(m.status)+'<span>'+esc(label(m.kind))+'</span><span>'+m.agenda.length+' agenda '+(m.agenda.length===1?'item':'items')+'</span></div></div><a class="button secondary small" href="'+href(c,'meeting',m.id)+'">Open<span class="sr-only"> '+esc(m.title)+'</span></a></article>').join('');
  return card('Working meetings',rows(current)||'<p class="committee-empty">No working meetings are scheduled. Add a proposed date to start planning together.</p>')+
    (items.length?'<div class="button-row committee-register-actions"><button type="button" class="button secondary small" data-committee-calendar>Download calendar</button><button type="button" class="button quiet small" data-committee-print>Print meetings</button></div>':'')+
    (can?fold('Plan a meeting',form('meeting.schedule',
      field('Meeting title','title')+select('Meeting type','kind',['committee','formation','agm','special','informal'].map(v=>option(v,label(v))))+
      field('Date','date','','date')+field('Brisbane time','time','','time')+field('Proposed location','location'),'Save proposed meeting'),!current.length):'')+
    (past.length?fold('Past and cancelled meetings ('+past.length+')',rows(past)): '');
}

function attendance(d,m,ro){
  const a=m.attendance,can=permitted(d,'committee.attendance',ro)&&m.status==='open';
  const list=values=>values.map(i=>esc(name(d,i))).join(', ')||'None recorded';
  const details='<p>Present: '+list(a.present)+'</p><p>Apologies: '+list(a.apologies)+'</p><p>Recused: '+list(a.recused)+'</p><p>'+esc(a.conflicts)+'</p><p>'+esc(m.quorum.status==='not-established'?'Formal quorum is not established.':m.quorum.status+' · '+m.quorum.present+' of '+m.quorum.required+' fictional quorum threshold')+'</p>';
  if(!can)return m.status==='scheduled'?fold('Attendance and conflicts',details):card('Attendance and conflicts',details);
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
    (can&&v.authorId===actor.id&&!v.ballot?fold('Revise this motion',form('motion.amend',area('Revised wording','text',v.text,2000,true)+area('Reason','reason','',500,true),'Save revision',{meetingId:m.id,motionId:v.id,version:v.version})): '')+'</article>').join('')+
    (can&&m.kind!=='informal'?fold('Draft a motion',form('motion.propose',area('Proposed wording','text','',2000,true)+select('Related project','projectId',projects(),false)+select('Related constitution draft','constitutionId',drafts(),false),'Save motion as draft',{meetingId:m.id,itemId:item.id})): '');
}
function minutes(d,m,ro,actor){
  const n=m.minutes,write=permitted(d,'committee.minutes.write',ro)&&['open','closed'].includes(m.status)&&n.status!=='reviewed';
  const review=permitted(d,'committee.minutes.review',ro)&&m.status==='closed'&&n.status==='draft'&&n.text&&n.editedBy!==actor.id&&!n.history.some(h=>h.editedBy===actor.id);
  return (m.status==='scheduled'&&!n.text?fold:card)('Working minutes',status(n.status)+' · version '+n.version+'<p>'+esc(n.text||'No minutes recorded. Manual notes only. No recording or AI upload is enabled.')+'</p>'+
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
  return fold('Assign a duty',form('duty.assign',field('Task title','title','', 'text',true,200)+area('Private instructions','details','',1000)+owner+field('Due date','dueDate','','date',false)+project+motion,'Assign duty',m?{meetingId:m.id}:{}));
}
function planning(d,m,ro){
  const template=d.planningTemplates?.[m.kind];
  if(!template)return '';
  const plan=m.plan,can=permitted(d,'committee.meeting.manage',ro)&&permitted(d,'committee.task.assign',ro)&&m.status==='scheduled';
  const summary=plan?'<p>Working plan version '+plan.version+' · '+esc(plan.basis)+'</p>'+plan.jobs.map(j=>{
    const a=d.actions.find(a=>a.id===j.actionId);
    return '<p>'+esc(template.find(k=>k.key===j.key)?.title||j.key)+' · '+esc(j.offsetDays)+' days from meeting'+(a?' · '+esc(a.dueDate)+' · '+status(a.cancelled?'cancelled':a.done?'complete':'open'):'')+'</p>';
  }).join(''):'<p>No planning basis selected yet.</p>';
  const fields=template.map(job=>{
    const previous=plan?.jobs.find(j=>j.key===job.key),action=d.actions.find(a=>a.id===previous?.actionId);
    const owners=[option('','Choose owner'),...d.officePeople.map(p=>option(p.id,p.name,action?.ownerId===p.id))];
    return '<fieldset><legend>'+esc(job.title)+'</legend>'+select('Owner','owner.'+job.key,owners)+
      '<label class="field">Chosen days relative to meeting (negative = before)<input type="number" name="offset.'+esc(job.key)+'" min="-365" max="365" step="1" required value="'+esc(previous?.offsetDays??'')+'"></label></fieldset>';
  }).join('');
  return fold(m.kind==='agm'?'Annual meeting checklist':'Formation checklist',
    '<p>Choose dates and record why they matter. Notices and nominations stay in your working plan.</p>'+summary+
    (can&&d.officePeople.length?form('meeting.plan',area('Proposed date basis and source reference','basis',plan?.basis||'',1000,true)+fields,'Save checklist and linked duties',{meetingId:m.id,version:plan?.version||0}):'')+
    (plan?.history?.length?'<details><summary>Earlier planning bases</summary>'+plan.history.map(h=>'<p>Version '+h.version+' · '+esc(h.basis)+' · '+esc(h.actorId)+'</p>').join('')+'</details>':''));
}
function meetingPage(d,m,ro,actor){
  if(!m)return card('Meeting unavailable','<p>Choose a meeting in this committee register.</p>');
  const can=permitted(d,'committee.meeting.manage',ro),editable=['scheduled','open'].includes(m.status);
  let actions='';
  if(can&&m.status==='scheduled'){
    actions+=fold('Change the date or location',form('meeting.reschedule',field('New date','date',m.date,'date')+field('Brisbane time','time',m.time,'time')+field('Proposed location','location',m.location)+area('Reason','reason','',500,true),'Save revised schedule',{meetingId:m.id}));
    actions+=fold('Cancel this meeting',form('meeting.cancel',area('Cancellation reason','reason','',500,true),'Cancel proposed meeting',{meetingId:m.id}));
    if(Date.parse(m.date+'T'+m.time+':00+10:00')<=Date.now())actions+=form('meeting.open','','Open working meeting',{meetingId:m.id});
  }
  if(can&&m.status==='open')actions+=form('meeting.close','','Close working meeting',{meetingId:m.id});
  const agenda=m.agenda.map(item=>'<article class="panel"><h3>'+esc(item.title)+'</h3><p>'+esc(item.notes)+'</p>'+
    (can&&editable?fold('Edit this agenda item',form('agenda.edit',field('Heading','title',item.title)+area('Discussion notes','notes',item.notes,2000),'Save agenda item',{meetingId:m.id,itemId:item.id})): '')+
    motionView(d,m,item,ro,actor)+'</article>').join('');
  return '<a class="committee-back" href="'+href(d.committee.id,'meetings')+'">← All meetings</a>'+
    card(m.title,'<p>'+dateText(m)+' · '+esc(m.location)+'</p><p>'+status(m.status)+' · '+esc(label(m.kind))+' · revision '+m.version+'</p>'+actions)+
    planning(d,m,ro)+attendance(d,m,ro)+card('Agenda and draft motions',agenda+(can&&editable?fold('Add an agenda item',form('agenda.add',field('New agenda heading','title')+area('Notes','notes'),'Add agenda item',{meetingId:m.id})): ''))+
    minutes(d,m,ro,actor)+dutyForm(d,ro,m)+(d.actions.some(a=>a.meetingId===m.id)?card:fold)('Meeting follow-ups',duties(d,ro,actor,d.actions.filter(a=>a.meetingId===m.id)))+
    fold('Meeting history',m.history.map(h=>'<p>Revision '+h.version+' · '+esc(label(h.action))+' · '+esc(name(d,h.actorId))+' · '+esc(h.at)+'</p>').join('')||'<p>No earlier changes.</p>');
}
function duties(d,ro,actor,rows=d.actions){
  return rows.map(a=>{
    const own=a.ownerId===actor.id&&permitted(d,'committee.task.own',ro);
    return '<article class="activity-line"><div><h3>'+esc(a.title)+'</h3><p>'+status(a.cancelled?'cancelled':a.done?'complete':a.acknowledgedAt?'acknowledged':'assigned')+' · '+esc(name(d,a.ownerId))+' · Due '+esc(a.dueDate||'not set')+'</p><p>'+esc(a.details)+'</p>'+
      (a.projectId&&d.projects.some(p=>p.id===a.projectId)?'<p><a href="#project/'+esc(a.projectId)+'">Open original project task</a></p>':'')+
      (a.meetingId?'<p>'+link(d.committee.id,'meeting','Source meeting',a.meetingId)+'</p>':'')+
      (own&&!a.done&&!a.cancelled?form(a.acknowledgedAt?'duty.complete':'duty.acknowledge','',a.acknowledgedAt?'Complete duty':'Acknowledge duty',{actionId:a.id}):'')+
      (a.completedBy?'<p>Completed by '+esc(name(d,a.completedBy))+' · '+esc(a.completedAt)+'</p>':'')+'</div></article>';
  }).join('')||'<p>No duties in your authorised view.</p>';
}
function notices(d,ro){
  const active=d.notices.filter(n=>!n.resolved&&!n.retracted).sort((a,b)=>Number(b.unread)-Number(a.unread));
  const earlier=d.notices.filter(n=>n.resolved||n.retracted);
  const rows=items=>items.map(n=>'<article class="activity-line"><div><h3>'+esc(n.title)+'</h3><p>'+status(n.retracted?'retracted':n.resolved?'resolved':n.unread?'unread':'seen')+' · '+(n.reviewed?'Reviewed':'Not reviewed')+'</p>'+
    (n.kind==='meeting'?link(d.committee.id,'meeting','Open meeting',n.sourceId):n.kind==='task'?link(d.committee.id,'duties','Open duties'):n.kind==='handover'?link(d.committee.id,'offices','Open handover'):'')+
    (!ro&&!n.retracted&&n.unread?form('notice.read','','Mark as read',{noticeId:n.id,version:n.version}):'')+
    (!ro&&!n.retracted&&!n.reviewed?form('notice.review','','Record review',{noticeId:n.id,version:n.version}):'')+'</div></article>').join('');
  return card('Committee inbox',rows(active)||'<p class="committee-empty">No open notices. You are up to date.</p>')+
    (permitted(d,'committee.notice.write',ro)?fold('Add a notice',form('notice.post',field('Notice','title','','text',true,240),'Save in-app notice')+'<p class="committee-footnote">Appears in this committee inbox.</p>'):'')+
    (earlier.length?fold('Resolved and retracted notices ('+earlier.length+')',rows(earlier)):'');
}
function dutyDesk(d,ro,actor){
  const open=d.actions.filter(a=>!a.done&&!a.cancelled).sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999'));
  const closed=d.actions.filter(a=>a.done||a.cancelled);
  return card('Duties and follow-ups',duties(d,ro,actor,open)+'<button class="button secondary small" data-committee-print type="button">Print open duties</button>')+dutyForm(d,ro)+
    (closed.length?fold('Completed and cancelled duties ('+closed.length+')',duties(d,ro,actor,closed)):'');
}

function released(d){return card('Released minutes',d.releasedMinutes.map(m=>'<article><h3>'+esc(m.title)+'</h3><p>'+esc(m.date)+' · Fictional member excerpt · version '+m.version+'</p><p>'+esc(m.text)+'</p></article>').join('')||'<p>No member excerpts are released. Formal release is not enabled.</p>')+card('Released document excerpts',(d.operations?.released||[]).map(x=>'<article><h3>'+esc(x.title)+'</h3><p>Fictional member excerpt · version '+x.version+'</p><p>'+esc(x.text)+'</p></article>').join('')||'<p>No document excerpts released.</p>')+card('Released editions',(d.communications?.released||[]).map(x=>'<article><h3>'+esc(x.title)+'</h3><p>'+esc(x.month)+' · Fictional edition</p><p>'+esc(x.text)+'</p></article>').join('')||'<p>No editions released.</p>');}

const aud=n=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(n/100);
const centsField=(title,name,value='')=>'<label class="field">'+esc(title)+' (whole AUD cents)<input type="number" name="'+esc(name)+'" min="0" max="1000000000" step="1" required value="'+esc(value)+'"></label>';
const checkField=(title,name)=>'<label class="check-field"><input type="checkbox" name="'+esc(name)+'" required> '+esc(title)+'</label>';
const independentReview=()=>area('Independent review reason','reason','',1000,true)+checkField('I have no conflicting interest in this review','noConflict');
const docRoute=(c,id,v)=>href(c,'library',id+'~'+v);
function offices(d,ro,actor){
  const p=d.operations,can=permitted(d,'committee.office.plan',ro),review=permitted(d,'committee.office.review',ro);
  const seatRows=d.committee.offices.map(o=>'<article class="activity-line"><div><h3>'+esc(label(o.role))+'</h3><p>'+status(o.effectiveStatus||o.status)+' · '+esc(o.personId?name(d,o.personId):'Vacant')+'</p>'+(o.term?'<p>Term: '+esc(dateLabel(o.term.startsAt.slice(0,10)))+' to '+esc(dateLabel(o.term.endsAt.slice(0,10)))+'</p>':'')+(o.authorityRef?'<p>Authority reference: '+esc(o.authorityRef)+'</p>':'')+(o.history?.length?'<details><summary>Prior occupants</summary>'+o.history.map(h=>'<p>'+esc(h.personId||'Vacant')+' · '+esc(h.endedAt)+'</p>').join('')+'</details>':'')+'</div></article>').join('');
  const rows=p.handovers.map(h=>'<article class="panel"><h3>'+esc(label(h.role))+' handover</h3><p>'+status(h.status)+' · revision '+h.version+'</p><p>'+esc(name(d,h.fromId))+' → '+esc(name(d,h.toId))+'</p><p>Proposed term: '+esc(h.termStart)+' to '+esc(h.termEnd)+' · review '+esc(h.reviewDate)+'</p><p>'+esc(h.reason)+'</p><p>Proposed authority: '+esc(h.authorityNote)+'</p><p>'+h.dutyIds.length+' visible linked duties · '+h.documentIds.length+' accessible linked documents</p>'+
    (h.reviewReason?'<p>Independent review: '+esc(h.reviewReason)+'</p>':'')+
    (!ro&&h.status==='proposed'&&h.toId===actor.id?form('office.accept',checkField('I acknowledge the proposed handover and existing scope. This is not an appointment.','acknowledged'),'Acknowledge proposal',{id:h.id,version:h.version}):'')+
    (review&&h.status==='accepted'&&![h.createdBy,h.fromId,h.toId].includes(actor.id)?form('office.review',independentReview(),'Review proposal',{id:h.id,version:h.version}):'')+
    (can&&['proposed','accepted','reviewed'].includes(h.status)?form('office.cancel',area('Reason','reason','',500,true),'Cancel proposal',{id:h.id,version:h.version}):'')+
    (h.history.length?'<details><summary>Transition history</summary>'+h.history.map(v=>'<p>'+esc(label(v.action))+' · '+esc(v.actorId)+' · '+esc(v.at)+'</p>').join('')+'</details>':'')+'</article>').join('');
  const fields=select('Prospective office','role',d.committee.offices.map(o=>option(o.role,label(o.role))))+
    select('Successor with an existing grant','toId',[option('','Choose existing participant'),...p.candidates.map(x=>option(x.id,x.name+' · '+x.roles.map(label).join(', ')))])+
    field('Proposed term start','termStart','','date')+field('Proposed term end','termEnd','','date')+field('Review date','reviewDate','','date')+
    area('Reason','reason','',1000,true)+area('Proposed authority reference','authorityNote','',500,true)+
    '<fieldset><legend>Outstanding duties to transfer in a later authorised transition</legend>'+d.actions.filter(a=>!a.done&&!a.cancelled).map(a=>'<label class="check-field"><input type="checkbox" name="dutyIds" value="'+esc(a.id)+'"> '+esc(a.title)+' · '+esc(name(d,a.ownerId))+'</label>').join('')+'</fieldset>'+
    '<fieldset><legend>Existing accessible documents (no new access granted)</legend>'+p.library.map(doc=>'<label class="check-field"><input type="checkbox" name="documentIds" value="'+esc(doc.id)+'"> '+esc(doc.title)+'</label>').join('')+'</fieldset>';
  return card('Office holders','<div class="committee-office-grid">'+seatRows+'</div><p class="committee-footnote">Proposed offices and technical access are separate. A handover proposal does not appoint anyone or change access.</p>')+
    card('Handover register',rows||'<p>No handover proposals in your scope.</p>')+
    (can?fold('Plan an office handover',form('office.plan',fields,'Save proposed handover')+'<p>Actual appointments and technical transitions are held. Choose someone who already has access to the role.</p>'):'');
}
function budgetFields(r={}){
  return field('Budget title','title',r.title||'')+field('Period start','start',r.start||'','date')+field('Period end','end',r.end||'','date')+
    centsField('Proposed review limit','reviewLimitCents',r.reviewLimitCents??'')+area('Budget lines, one per line: label | whole AUD cents','linesText',(r.lines||[]).map(l=>l.label+' | '+l.amountCents).join('\n'),3000,true)+area('Basis and source reference','basis',r.basis||'',1000,true);
}
function expenseFields(r={},d){
  return field('Existing expense date','date',r.date||'','date')+centsField('Recorded expense','amountCents',r.amountCents??'')+
    field('External receipt reference','reference',r.reference||'','text',true,120)+area('Evidence description (no payment credentials)','description',r.description||'',500,true)+
    select('Participant payee, if applicable','payeeId',[option('','Not specified'),...d.officePeople.map(p=>option(p.id,p.name,p.id===r.payeeId))],false)+
    checkField('This is an existing settled expense, not a payment instruction','settled')+(r.id?area('Correction reason','reason','',500,true):'');
}
function financeDesk(d,ro,actor){
  const f=d.operations.finance;if(!f)return card('Treasurer desk','<p>This account does not have scoped financial review access.</p>');
  const write=permitted(d,'committee.finance.write',ro),review=permitted(d,'committee.finance.review',ro);
  const conflict=r=>[r.createdBy,r.updatedBy,r.payeeId].includes(actor.id)||(r.history||[]).some(h=>h.actorId===actor.id&&h.action.endsWith('.save'));
  const budget=f.budgets.map(r=>'<article class="panel"><h3>'+esc(r.title)+'</h3><p>'+status(r.status)+' · revision '+r.version+' · '+esc(r.start)+' to '+esc(r.end)+'</p>'+
    r.lines.map(l=>'<p>'+esc(l.label)+': '+esc(aud(l.amountCents))+'</p>').join('')+'<p>Draft total: '+esc(aud(r.lines.reduce((n,l)=>n+l.amountCents,0)))+' · Proposed review limit '+esc(aud(r.reviewLimitCents))+'</p><p>'+esc(r.basis)+'</p>'+
    (r.reviewReason?'<p>Review: '+esc(r.reviewReason)+'</p>':'')+
    (write&&r.status==='draft'?'<details><summary>Revise working budget</summary>'+form('budget.save',budgetFields(r),'Save revision',{id:r.id,version:r.version})+'</details>':'')+
    (review&&!conflict(r)&&r.status==='draft'?form('budget.review',independentReview(),'Review working budget',{id:r.id,version:r.version}):'')+'</article>').join('');
  const expenses=f.expenses.map(r=>'<article class="panel"><h3>'+esc(r.description)+'</h3><p>'+esc(r.date)+' · '+esc(aud(r.amountCents))+' · '+status(r.status)+' · revision '+r.version+'</p><p>Evidence reference: '+esc(r.reference)+'</p>'+
    (r.reviewReason?'<p>Review: '+esc(r.reviewReason)+'</p>':'')+
    (write&&r.createdBy===actor.id?'<details><summary>Prepare correction</summary>'+form('expense.save',expenseFields(r,d),'Save corrected evidence',{id:r.id,version:r.version})+'</details>':'')+
    (review&&!conflict(r)&&r.status==='pending'?form('expense.review',select('Outcome','outcome',[option('verify','Verify recorded evidence'),option('reject','Reject evidence')])+independentReview(),'Record independent review',{id:r.id,version:r.version}):'')+'</article>').join('');
  const recon=f.reconciliations.map(r=>'<article class="panel"><h3>'+esc(r.start)+' to '+esc(r.end)+'</h3><p>'+status(r.status)+(r.stale?' · Source records changed':'')+'</p><p>Opening '+esc(aud(r.openingCents))+' · Expected closing '+esc(aud(r.expectedClosingCents))+' · Statement '+esc(aud(r.statementClosingCents))+'</p><p>Difference '+esc(aud(r.differenceCents))+' · '+r.sources.received.length+' source receipts · '+r.sources.expenses.length+' reviewed expenses</p><p>'+esc(r.basis)+'</p>'+
    (r.reviewReason?'<p>'+esc(r.reviewReason)+'</p>':'')+
    (review&&!conflict(r)&&r.status==='draft'?form('reconcile.review',select('Outcome','outcome',[...(r.stale||r.differenceCents!==0?[]:[option('confirm','Confirm zero-difference reconciliation')]),option('return','Return for correction')])+independentReview(),'Review reconciliation',{id:r.id,version:r.version}):'')+'</article>').join('');
  return '<div class="committee-finance-summary">'+[['Verified income',f.income.reduce((n,r)=>n+r.amountCents,0)],['Reviewed expenses',f.expenses.filter(r=>r.status==='reviewed').reduce((n,r)=>n+r.amountCents,0)]].map(([title,value])=>'<div><span>'+title+'</span><strong>'+esc(aud(value))+'</strong></div>').join('')+'</div><p class="committee-footnote">Amounts are in AUD. These are working records; saving them does not make a payment or approve spending.</p>'+
    card('Existing independently verified income',f.income.map(r=>'<p>'+esc(r.date)+' · '+esc(aud(r.amountCents))+' · '+esc(r.id)+'</p>').join('')||'<p>No verified AUD receipts in this scope.</p>')+
    card('Working budgets',budget||'<p>No draft budgets.</p>')+(write?fold('Prepare a budget',form('budget.save',budgetFields(),'Save working budget')):'')+
    card('Recorded expense evidence',expenses||'<p>No recorded expenses.</p>')+(write?fold('Record an expense',form('expense.save',expenseFields({},d),'Save evidence for review')):'')+
    card('Reconciliation history',recon||'<p>No reconciliations.</p>')+
    (write?fold('Reconcile a statement period',form('reconcile.save',field('Period start','start','','date')+field('Period end','end','','date')+centsField('Opening balance','openingCents')+centsField('Statement closing balance','statementClosingCents')+area('Statement and opening balance evidence reference','basis','',1000,true),'Calculate and save reconciliation')):'');
}
function libraryDesk(d,ro,actor,document){
  const p=d.operations,write=permitted(d,'committee.library.write',ro),review=permitted(d,'committee.library.review',ro);
  const fields=(v={})=>field('Source date','sourceDate',v.sourceDate||'','date')+area('Source note','sourceNote',v.sourceNote||'',500,true)+area('Plain text or Markdown (no raw identity, banking, medical or credential evidence)','body',v.body||'',6000,true);
  const versions=p.library.map(doc=>'<article class="activity-line"><div><h3>'+esc(doc.title)+'</h3><p>'+status(doc.status)+' · '+esc(label(doc.classification))+' · '+doc.versionCount+' content versions</p>'+doc.versions.map(v=>'<p><a href="'+docRoute(d.committee.id,doc.id,v.version)+'">Open version '+v.version+'</a> · '+esc(v.sourceDate)+'</p>').join('')+'</div></article>').join('');
  let selected='';
  if(document){
    const m=p.library.find(row=>row.id===document.document.id),current=m&&m.contentVersion===document.version,owner=m?.createdBy===actor.id;
    const access=owner&&write&&m.classification==='restricted'?'<details><summary>Restricted access list</summary>'+((m.access||[]).map(g=>'<p>'+esc(name(d,g.personId))+' · '+esc(g.status)+' · expires '+esc(g.expiresAt)+'</p>').join('')||'<p>Owner only.</p>')+
      form('library.access',select('Participant','personId',d.officePeople.filter(p=>p.id!==actor.id).map(p=>option(p.id,p.name)))+
      select('Action','action',[option('grant','Grant or renew read access'),option('revoke','Revoke read access')])+field('Expiry (UTC date, required for grant)','expiresOn','','date',false)+area('Reason','reason','',500,true),'Save access change',{id:m.id,version:m.version})+'</details>':'';
    selected=card(document.document.title,'<p>Content version '+document.version+' · '+esc(document.sourceDate)+' · '+esc(document.sourceNote)+'</p><div class="clause-text">'+esc(document.body)+'</div>'+
      (!ro?'<button type="button" class="button secondary" data-committee-document-download>Download this text version</button>':'')+
      (current&&owner&&write?'<details><summary>Prepare new version</summary>'+form('library.revise',fields(document),'Save next version',{id:m.id,version:m.version})+'</details>':'')+
      (current&&review&&!owner&&m.status==='draft'?form('library.review',independentReview(),'Review working version',{id:m.id,version:m.version}):'')+
      (current?access:'')+(current&&owner&&write?form('library.withdraw',area('Withdrawal reason','reason','',500,true),'Withdraw document',{id:m.id,version:m.version}):''));
  }
  return card('Documents','<p>Working papers, reports and earlier versions available to your committee role.</p>'+(versions||'<p class="committee-empty">No working documents are available yet.</p>'))+selected+
    (write?fold('Add a working document',form('library.create',field('Title','title')+select('Classification','classification',[option('working','Committee working'),option('restricted','Restricted readers only')])+select('Document type','kind',['minutes','working-paper','evidence-summary','constitution-note','report'].map(k=>option(k,label(k))))+select('Source meeting','meetingId',[option('','None'),...d.meetings.map(m=>option(m.id,m.title))],false)+select('Linked constitution','constitutionId',[option('','None'),...d.constitutions.map(x=>option(x.id,x.title))],false)+fields(),'Save first version')):'');
}

function committeeDesks(d){
  const p=d.permissions||{};
  return [
    {key:'overview',title:'Overview',icon:'home',copy:'The next meeting, duties and updates.'},
    {key:'meetings',title:'Meetings',icon:'readiness',copy:'Dates, agendas, working minutes and follow-ups.'},
    {key:'duties',title:'Duties',icon:'projects',copy:'Responsibilities, due dates and shared project tasks.'},
    {key:'notices',title:'Inbox',icon:'people',copy:'Committee notices and updates for you.'},
    {key:'offices',title:'Office holders',icon:'committees',copy:'The office register, terms and proposed handovers.'},
    ...(d.operations?.finance?[{key:'finance',title:'Treasurer',icon:'finance',copy:'Working budgets, receipts, expenses and reconciliation.'}]:[]),
    ...(p['committee.library.view']?[{key:'library',title:'Documents',icon:'constitution',copy:'Working papers, source notes and earlier versions.'}]:[]),
    ...(p['committee.edition.contribute']||p['committee.edition.edit']||p['committee.edition.review']?[{key:'editions',title:'Editions',icon:'resources',copy:'Contribute, assemble and review member updates.'}]:[]),
    ...(p['committee.partnership.propose']||p['committee.partnership.review']?[{key:'partnerships',title:'Partnerships',icon:'groups',copy:'Proposed cooperation, responsibilities and review.'}]:[]),
    {key:'released',title:'Shared records',icon:'transparency',copy:'Excerpts and editions released for this audience.'},
  ];
}
function reviewItems(d,actor){
  const p=d.permissions||{},ops=d.operations||{},comms=d.communications||{},items=[];
  const add=(title,tab,item,kind)=>items.push({title,tab,item,kind});
  if(p['committee.minutes.review'])for(const m of d.meetings.filter(m=>m.status==='closed'&&m.minutes.status==='draft'&&m.minutes.text&&m.minutes.editedBy!==actor.id&&!(m.minutes.history||[]).some(h=>h.editedBy===actor.id)))add(m.title,'meeting',m.id,'Minutes');
  if(p['committee.office.review'])for(const h of (ops.handovers||[]).filter(h=>h.status==='accepted'&&![h.createdBy,h.fromId,h.toId].includes(actor.id)))add(label(h.role)+' handover','offices','','Handover');
  if(p['committee.finance.review']&&ops.finance){
    const conflict=r=>[r.createdBy,r.updatedBy,r.payeeId].includes(actor.id)||(r.history||[]).some(h=>h.actorId===actor.id&&String(h.action).endsWith('.save'));
    for(const b of ops.finance.budgets.filter(b=>b.status==='draft'&&!conflict(b)))add(b.title,'finance','','Budget');
    for(const e of ops.finance.expenses.filter(e=>e.status==='pending'&&!conflict(e)))add(e.description,'finance','','Expense evidence');
    for(const r of ops.finance.reconciliations.filter(r=>r.status==='draft'&&!conflict(r)&&!r.sources.received.some(x=>[x.personId,x.createdBy].includes(actor.id))&&!r.sources.expenses.some(x=>[x.createdBy,x.payeeId].includes(actor.id))))add(dateLabel(r.start)+' to '+dateLabel(r.end),'finance','','Reconciliation');
  }
  if(p['committee.library.review'])for(const doc of (ops.library||[]).filter(doc=>doc.status==='draft'&&doc.createdBy!==actor.id&&doc.updatedBy!==actor.id&&!(doc.versions||[]).some(v=>v.actorId===actor.id)))add(doc.title,'library',doc.id+'~'+doc.contentVersion,'Working document');
  if(p['committee.edition.review'])for(const e of (comms.editions||[]).filter(e=>e.status==='review'&&!(e.editorIds||[]).includes(actor.id)&&!(e.draft?.articles||[]).some(a=>a.actorId===actor.id)))add(e.title,'editions','','Edition');
  if(p['committee.partnership.review'])for(const p of (comms.partnerships||[]).filter(p=>p.status==='proposed'&&p.createdBy!==actor.id))add(p.partner,'partnerships','','Partnership proposal');
  return items;
}
function home(d,ro,actor){
  const c=d.committee.id,open=d.actions.filter(a=>!a.done&&!a.cancelled).sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999'));
  const own=open.filter(a=>a.ownerId===actor.id),shown=own.length?own:open,unread=d.notices.filter(n=>n.unread&&!n.resolved&&!n.retracted),reviews=reviewItems(d,actor);
  const meetings=d.meetings.filter(m=>m.status==='scheduled'||m.status==='open').sort((a,b)=>(a.status==='open'?-1:b.status==='open'?1:0)||(a.date+a.time).localeCompare(b.date+b.time));
  const next=meetings[0],today=new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Brisbane',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const metric=(value,title,tab,tone)=>'<a class="committee-metric" data-tone="'+tone+'" href="'+href(c,tab)+'"><strong>'+value+'</strong><span>'+esc(title)+'</span><span class="committee-arrow" aria-hidden="true">→</span></a>';
  const meeting=next?'<section class="committee-next panel"><div class="committee-panel-heading"><div><span class="eyebrow">'+(next.status==='open'?'Meeting in progress':Date.parse(next.date+'T'+next.time+':00+10:00')<Date.now()?'Meeting to follow up':'Next working meeting')+'</span><h2><a href="'+href(c,'meeting',next.id)+'">'+esc(next.title)+'</a></h2></div>'+dateTile(next)+'</div><p class="committee-meeting-time">'+dateText(next)+'</p><p>'+esc(next.location)+'</p><div class="committee-meeting-meta">'+status(next.status)+'<span>'+next.agenda.length+' agenda '+(next.agenda.length===1?'item':'items')+'</span><span>'+esc(label(next.kind))+'</span></div><div class="button-row">'+link(c,'meeting','Open meeting',next.id)+link(c,'meetings','All meetings')+'</div></section>':
    '<section class="committee-next panel"><span class="eyebrow">Next working meeting</span><h2>Make space to work together</h2><p>No working meeting is scheduled yet.</p><div class="button-row">'+link(c,'meetings',d.permissions['committee.meeting.manage']?'Plan a meeting':'View meetings')+'</div></section>';
  const dutiesList=shown.slice(0,4).map(a=>'<li><div><a href="'+href(c,'duties')+'">'+esc(a.title)+'</a><small>'+esc(name(d,a.ownerId))+(a.dueDate?' · '+esc(dateLabel(a.dueDate,{day:'numeric',month:'short'})):' · No due date')+'</small></div>'+status(a.dueDate&&a.dueDate<today?'overdue':a.acknowledgedAt?'underway':'assigned')+'</li>').join('');
  const dutyPanel='<section class="panel"><div class="committee-panel-heading"><h2>'+(own.length?'Your next duties':'Open duties')+'</h2><a href="'+href(c,'duties')+'">View all</a></div>'+(dutiesList?'<ul class="committee-work-list">'+dutiesList+'</ul>':'<p class="committee-empty">No open duties in your view. Meeting follow-ups and assigned work will appear here.</p>')+'</section>';
  const noticePanel='<section class="panel"><div class="committee-panel-heading"><h2>Committee inbox</h2><a href="'+href(c,'notices')+'">Open inbox</a></div>'+(unread.length?'<ul class="committee-work-list">'+unread.slice(0,3).map(n=>'<li><div><a href="'+href(c,'notices')+'">'+esc(n.title)+'</a><small>'+esc(label(n.kind))+' · Unread</small></div></li>').join('')+'</ul>':'<p class="committee-empty">You are up to date. New notices and meeting updates will appear here.</p>')+'</section>';
  const reviewRows=items=>items.map(r=>'<li><div><a href="'+href(c,r.tab,r.item)+'">'+esc(r.title)+'</a><small>'+esc(r.kind)+'</small></div><span aria-hidden="true">→</span></li>').join('');
  const reviewPanel=reviews.length?'<section class="panel committee-review"><div class="committee-panel-heading"><h2>Ready for review</h2><span class="committee-count">'+reviews.length+'</span></div><ul class="committee-work-list">'+reviewRows(reviews.slice(0,4))+'</ul>'+(reviews.length>4?'<details class="committee-review-more"><summary>Show '+(reviews.length-4)+' more to review</summary><ul class="committee-work-list">'+reviewRows(reviews.slice(4))+'</ul></details>':'')+'<p class="committee-footnote">Open the record to check its evidence and any conflict of interest.</p></section>':'';
  const connected='<section class="panel committee-connected"><h2>Connected work</h2>'+ (d.constitutions.length?'<h3>Constitution drafts</h3><ul>'+d.constitutions.map(p=>'<li><a href="#constitution/'+esc(p.id)+'">'+esc(p.title)+'</a><small>Working version '+p.version+'</small></li>').join('')+'</ul>':'')+(d.projects.length?'<h3>Shared projects</h3><ul>'+d.projects.map(p=>'<li><a href="#project/'+esc(p.id)+'">'+esc(p.title)+'</a></li>').join('')+'</ul>':'')+(!d.constitutions.length&&!d.projects.length?'<p class="committee-empty">Related projects and constitution drafts will appear when they are available in your view.</p>':'')+'</section>';
  const tools=committeeDesks(d).filter(x=>!['overview','meetings','duties','notices'].includes(x.key));
  return '<div class="committee-metrics" aria-label="Committee at a glance">'+metric(meetings.length,'Working meetings','meetings','purple')+metric(open.length,'Open duties','duties','green')+metric(unread.length,'Unread notices','notices','blue')+metric(reviews.length,'Ready for review',reviews[0]?.tab||'overview','gold')+'</div><div class="committee-dashboard"><div class="committee-main-column">'+meeting+dutyPanel+reviewPanel+'</div><div class="committee-side-column">'+noticePanel+connected+'</div></div><section class="committee-tools"><div class="committee-panel-heading"><h2>Your committee tools</h2><p>Find the right place for each part of the work.</p></div><div class="committee-tool-grid">'+tools.map(t=>'<a class="committee-tool" href="'+href(c,t.key)+'">'+civicIcon(t.icon)+'<div><h3>'+esc(t.title)+'</h3><p>'+esc(t.copy)+'</p></div><span class="committee-arrow" aria-hidden="true">→</span></a>').join('')+'</div></section>';
}
function directory(d,ro){
  const entries=d.committees.map(c=>'<a class="committee-directory-card panel" href="'+href(c.id,'overview')+'">'+civicIcon('committees')+'<div><span class="eyebrow">'+esc(label(c.kind))+' committee</span><h2>'+esc(c.name)+'</h2><p>'+esc(c.working?'Meetings, duties and shared work':'Released records available to you')+'</p><span class="committee-directory-meta">'+status(c.status)+'<span>'+(c.working?'Open committee':'View shared records')+' <span aria-hidden="true">→</span></span></span></div></a>').join('');
  return heading('My committees','A place for meetings, responsibilities and shared work.')+
    (entries?'<div class="committee-directory-grid">'+entries+'</div>':'<section class="panel committee-welcome">'+civicIcon('groups')+'<h2>Start with the people around you</h2><p>Create or join a working group, then plan a committee around its shared purpose.</p><a class="button" href="#groups">Open working groups</a></section>')+
    (!ro&&d.proposalGroups.length?fold('Plan a committee', '<p>Choose an existing working group and give the proposed committee a name.</p>'+form('committee.propose',field('Proposed name','name')+select('Scope','kind',['local','state','territory','national'].map(v=>option(v,label(v))))+select('Connected working group','groupId',d.proposalGroups.map(g=>option(g.id,g.name))),'Save proposal')+'<p class="committee-footnote">This creates a draft with vacant offices. Appointments and access are handled separately.</p>',!d.committees.length):'');
}

function editionsDesk(d,ro,actor){
 const edit=permitted(d,'committee.edition.edit',ro),review=permitted(d,'committee.edition.review',ro),contribute=permitted(d,'committee.edition.contribute',ro);
 const rows=d.communications.editions.map(e=>{
  const mine=e.contributions.find(x=>x.actorId===actor.id);
  const submitted=e.contributions.filter(x=>x.status==='submitted');
  const own=mine?'<p>My contribution: '+esc(mine.title)+' · '+status(mine.status)+'</p><p>'+esc(mine.text)+'</p>':'';
  const contribution=e.status==='draft'&&contribute?(!mine||mine.status==='draft'?form('edition.contribute',field('Title','title',mine?.title||'')+area('Member-safe draft text','text',mine?.text||'',3000,true),'Save my contribution',{id:e.id,version:e.version}):'')+(mine?.status==='draft'?form('edition.submit-contribution','','Submit my contribution',{id:e.id,version:e.version}):''):'';
  const assemble=edit&&e.status==='draft'&&submitted.length?form('edition.assemble',field('Edition title','title',e.draft?.title||e.title)+area('Editor introduction','intro',e.draft?.intro||'',1500,true)+'<fieldset><legend>Submitted articles</legend>'+submitted.map(x=>'<label class="check-field"><input type="checkbox" name="contributionIds" value="'+esc(x.id)+'"'+(e.draft?.articles?.some(a=>a.id===x.id)?' checked':'')+'> '+esc(x.title)+' · '+esc(name(d,x.actorId))+'</label>').join('')+'</fieldset>','Save assembled draft',{id:e.id,version:e.version}):'';
  const draft=e.draft?'<details><summary>Assembled edition</summary><h4>'+esc(e.draft.title)+'</h4><p>'+esc(e.draft.intro)+'</p>'+e.draft.articles.map(x=>'<h4>'+esc(x.title)+'</h4><p>'+esc(x.text)+'</p>').join('')+'</details>':'';
  return '<article class="panel"><h3>'+esc(e.month)+' · '+esc(e.title)+'</h3><p>'+status(e.status)+' · revision '+e.version+'</p>'+own+contribution+submitted.filter(x=>x.actorId!==actor.id).map(x=>'<details><summary>'+esc(x.title)+' · submitted by '+esc(name(d,x.actorId))+'</summary><p>'+esc(x.text)+'</p></details>').join('')+draft+assemble+
    (edit&&e.status==='draft'&&e.draft?form('edition.submit','','Submit assembled edition for independent review',{id:e.id,version:e.version}):'')+
    (review&&e.status==='review'&&!(e.editorIds||[]).includes(actor.id)&&!e.draft.articles.some(x=>x.actorId===actor.id)?form('edition.review',select('Review outcome','outcome',[option('approve','Review and approve working edition'),option('return','Return for edits')])+independentReview(),'Record independent review',{id:e.id,version:e.version}):'')+
    (e.reviewReason?'<p>Review: '+esc(e.reviewReason)+'</p>':'')+'</article>';
 }).join('');
 return card('Internal editions','<p>Office contributions remain private until submitted. Independent review precedes any release. No email or live member distribution is enabled.</p>'+rows+(edit?form('edition.create',field('Edition month','month','','month')+field('Working title','title'),'Create working edition'):''));
}
function partnershipsDesk(d,ro,actor){
 const write=permitted(d,'committee.partnership.propose',ro),review=permitted(d,'committee.partnership.review',ro);
 const rows=d.communications.partnerships.map(p=>'<article class="panel"><h3>'+esc(p.partner)+'</h3><p>'+status(p.effectiveStatus||p.status)+' · revision '+p.version+'</p><p><strong>Proposed scope:</strong> '+esc(p.work)+'</p><p><strong>Retained responsibilities:</strong> '+esc(p.retained)+'</p><p>Proposed cost '+esc(aud(p.costCents))+' · review date '+esc(p.reviewDate)+'</p>'+
 (p.projectId&&d.projects.some(x=>x.id===p.projectId)?'<p><a href="#project/'+esc(p.projectId)+'">Existing project</a></p>':'')+
 (p.reviewReason?'<p>Independent review: '+esc(p.reviewReason)+'</p>':'')+
 (review&&p.status==='proposed'&&p.createdBy!==actor.id?form('partnership.review',select('Outcome','outcome',[option('review','Review proposal'),option('decline','Decline proposal')])+independentReview(),'Record review',{id:p.id,version:p.version}):'')+'</article>').join('');
 return card('Partnership proposals','<p>Plan cooperation and record what each organisation would be responsible for. Proposals still need the other organisation’s agreement.</p>'+(rows||'<p class="committee-empty">No partnership proposals yet.</p>'))+
 (write?fold('Draft a partnership proposal',form('partnership.propose',field('Proposed partner','partner')+area('Proposed work','work','',1500,true)+area('Responsibilities retained by P4A','retained','',1500,true)+centsField('Proposed cost','costCents')+field('Review date','reviewDate','','date')+select('Existing project','projectId',[option('','None'),...d.projects.map(p=>option(p.id,p.title))],false)+checkField('This is an internal proposal, not consent from the other party','acknowledged'),'Save internal proposal')):'');
}

function detail(d,tab,item,ro,actor,document){
  const c=d.committee,active=tab==='meeting'?'meetings':tab;
  let content;
  if(!d.working)content=card('Shared committee records','<p>You can read the excerpts and editions made available to you here.</p>'+(d.proposedOffices||[]).map(o=>'<p>'+esc(label(o.role))+' · '+status(o.status)+'</p>').join(''))+released(d);
  else if(tab==='meetings')content=meetingList(d,ro);
  else if(tab==='meeting')content=meetingPage(d,d.meetings.find(m=>m.id===item),ro,actor);
  else if(tab==='duties')content=dutyDesk(d,ro,actor);
  else if(tab==='notices')content=notices(d,ro);
  else if(tab==='offices')content=offices(d,ro,actor);
  else if(tab==='finance')content=financeDesk(d,ro,actor);
  else if(tab==='library')content=libraryDesk(d,ro,actor,document);
  else if(tab==='editions')content=editionsDesk(d,ro,actor);
  else if(tab==='partnerships')content=partnershipsDesk(d,ro,actor);
  else if(tab==='released')content=released(d);
  else content=home(d,ro,actor);
  const desks=committeeDesks(d),selected=desks.find(x=>x.key===active)||desks[0];
  const navLink=desk=>'<a href="'+href(c.id,desk.key)+'"'+(active===desk.key?' aria-current="page"':'')+'>'+esc(desk.title)+'</a>';
  const more=desks.slice(4),inMore=more.some(t=>t.key===active);
  const nav=d.working?'<nav class="committee-nav" aria-label="Committee tools"><div class="committee-nav-primary">'+desks.slice(0,4).map(navLink).join('')+'</div><details class="committee-more"'+(inMore?' data-active="true"':'')+'><summary>'+(inMore?esc(selected.title):'More tools')+'</summary><div class="committee-more-menu">'+more.map(t=>'<a href="'+href(c.id,t.key)+'"'+(active===t.key?' aria-current="page"':'')+'>'+civicIcon(t.icon)+'<span><strong>'+esc(t.title)+'</strong><small>'+esc(t.copy)+'</small></span></a>').join('')+'</div></details></nav>':'';
  return '<div class="committee-context"><a href="#committee">← My committees</a><span>'+esc(label(c.kind))+' committee</span>'+(ro?'<span class="committee-example">Read-only examples</span>':'')+'</div>'+heading(c.name,d.working?selected.copy:'Read the records shared with your current role.')+nav+'<div class="committee-content" data-desk="'+esc(active)+'">'+content+'</div>';
}

export function privateCommitteeCalendar(rows){
  const escIcs=v=>String(v??'').replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
  const stamp=new Date().toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//P4A//Private working calendar//EN','CALSCALE:GREGORIAN'];
  for(const m of rows.filter(m=>m.status==='scheduled'||m.status==='open')){
    const start=new Date(m.date+'T'+m.time+':00+10:00').toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
    lines.push('BEGIN:VEVENT','UID:'+escIcs(m.id)+'@p4a-workspace','DTSTAMP:'+stamp,'DTSTART:'+start,'SUMMARY:'+escIcs('Proposed: '+m.title),'LOCATION:'+escIcs(m.location),'CLASS:PRIVATE','STATUS:TENTATIVE','END:VEVENT');
  }
  lines.push('END:VCALENDAR','');
  const encoder=new TextEncoder();
  const fold=line=>{
    let result='',segment='',bytes=0;
    for(const ch of line){
      const size=encoder.encode(ch).length;
      if(bytes+size>75){result+=segment+'\r\n';segment=' ';bytes=1;}
      segment+=ch;bytes+=size;
    }
    return result+segment;
  };
  return lines.map(fold).join('\r\n');
}
const pending=new Map();
function payload(formEl){
  const fd=new FormData(formEl),d=Object.fromEntries(fd);
  if(formEl.dataset.committeeForm==='edition.assemble')d.contributionIds=fd.getAll('contributionIds');
  if(formEl.dataset.committeeForm==='office.plan'){d.dutyIds=fd.getAll('dutyIds');d.documentIds=fd.getAll('documentIds');}
  if(formEl.dataset.committeeForm==='meeting.attendance')for(const k of ['present','apologies','recused'])d[k]=fd.getAll(k);
  if(formEl.dataset.committeeForm==='meeting.plan'){
    d.jobs=Object.keys(d).filter(k=>k.startsWith('owner.')).map(k=>{const key=k.slice(6);return {key,ownerId:d[k],offsetDays:d['offset.'+key]===''?null:Number(d['offset.'+key])};});
    for(const k of Object.keys(d))if(k.startsWith('owner.')||k.startsWith('offset.'))delete d[k];
  }
  for(const key of ['reviewLimitCents','amountCents','openingCents','statementClosingCents','costCents'])if(key in d)d[key]=d[key]===''?null:Number(d[key]);
  for(const key of ['noConflict','acknowledged','settled'])if(formEl.elements.namedItem(key))d[key]=fd.has(key);
  if('linesText'in d){
    d.lines=d.linesText.split(/\r?\n/).filter(line=>line.trim()).map(line=>{const at=line.lastIndexOf('|');return at<0?{label:line.trim(),amountCents:null}:{label:line.slice(0,at).trim(),amountCents:/^\d+$/.test(line.slice(at+1).trim())?Number(line.slice(at+1).trim()):null};});
    delete d.linesText;
  }
  if('version'in d)d.version=Number(d.version);
  return d;
}
export async function mountCommittee(root,{api,actor,readOnly,route,onSaved}){
  const [,id,tab='overview',item]=route.split('/');
  const d=await api('/api/committee'+(id?'?id='+encodeURIComponent(id):''));
  let document;
  if(id&&tab==='library'&&item){const [docId,version]=decodeURIComponent(item).split('~');document=await api('/api/committee/document?committee='+encodeURIComponent(id)+'&id='+encodeURIComponent(docId)+'&version='+encodeURIComponent(version));}
  if(location.hash.slice(1)!==route)return;
  const ro=readOnly||d.readOnly||d.fictional;
  root.innerHTML='<div class="committee-workspace">'+(id?detail(d,tab,item,ro,actor,document):directory(d,ro))+'</div>';
  if(ro){root.querySelectorAll('[data-committee-calendar],[data-committee-print]').forEach(el=>el.remove());root.querySelectorAll('form').forEach(form=>{form.addEventListener('submit',event=>event.preventDefault());form.querySelectorAll('input,select,textarea,button').forEach(control=>control.disabled=true);});return;}
  root.querySelector('[data-committee-document-download]')?.addEventListener('click',()=>{
    if(!document)return;const blob=new Blob([document.body],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=window.document.createElement('a');
    a.href=url;a.download='p4a-working-document-v'+document.version+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  root.querySelector('[data-committee-calendar]')?.addEventListener('click',()=>{
    const blob=new Blob([privateCommitteeCalendar(d.meetings)],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(blob),a=window.document.createElement('a');a.href=url;a.download='p4a-private-working-calendar.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
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
