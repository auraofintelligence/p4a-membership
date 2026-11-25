import { AppError } from './errors.mjs';
import { accessRegistry, can, effectiveAccess } from './scoped-access.mjs';
import { operationRegister, operationPermissions, operationViewPermissions, operationsProjection, applyCommitteeOperation, libraryDocument } from './committee-operations.mjs';
import { communicationsRegister, communicationPermissions, communicationViewPermissions, communicationsProjection, applyCommunication } from './committee-communications.mjs';

const fail=(message='This committee action is outside your authorised scope.',status=403)=>{throw new AppError(message,status)};
const invalid=message=>fail(message,400);
const conflict=message=>fail(message,409);
const txt=(value,label,max=500,required=true)=>{
  if(typeof value!=='string'||value.length>max||(required&&!value.trim()))invalid('Enter '+label+' (up to '+max+' characters).');
  return value.trim();
};
const id=value=>typeof value==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9:._-]{0,159}$/.test(value);
const unique=rows=>new Set(rows).size===rows.length;
const byId=(rows,key)=>rows.find(row=>row.id===key);
const day=value=>{
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)invalid('Choose a valid calendar date.');
  return value;
};
const time=value=>{if(typeof value!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))invalid('Choose a valid Brisbane time.');return value;};
const dateTime=m=>Date.parse(m.date+'T'+m.time+':00+10:00');
const roles=['chair','deputy','secretary','assistant-secretary','treasurer','committee'];
const committeeKinds=['local','state','territory','national'];
const types=['committee','formation','agm','special','informal'];
const templates={
  committee:['Opening, attendance and conflicts','Previous notes and actions','Reports and shared projects','Business for discussion','Follow-ups and next meeting'],
  formation:['Opening and purpose','Proposed scope and rules','Prospective offices and responsibilities','Constitution working draft','Next steps and review'],
  agm:['Opening, attendance and conflicts','Notice and proposed rule basis','Previous notes and reports','Financial and office reports','Nominations and questions','Follow-ups and next meeting'],
  special:['Opening, attendance and conflicts','Notified purpose','Specific business for discussion','Follow-ups and close'],
  informal:['Welcome and listening','Ideas and practical questions','Suggestions and next steps'],
};
// Planning prompts only. No statutory deadline, notice rule or election rule
// is inferred from PLFC or treated as an adopted P4A constitution.
const planningTemplates={
  formation:[
    {key:'purpose',title:'Prepare the proposed purpose and scope'},
    {key:'rules',title:'Prepare the constitution working draft and review questions'},
    {key:'offices',title:'Prepare the prospective office and authority register'},
    {key:'agenda',title:'Prepare the draft agenda and meeting material'},
    {key:'attendance',title:'Prepare attendance and evidence checks'},
  ],
  agm:[
    {key:'papers',title:'Prepare draft reports and working papers'},
    {key:'notice',title:'Prepare notice wording for separate approval; do not send'},
    {key:'nominations',title:'Prepare proposed nominations process; do not invite'},
    {key:'candidates',title:'Prepare the proposed candidate and vacancy record'},
    {key:'attendance',title:'Prepare attendance and quorum evidence checks'},
    {key:'followup',title:'Review follow-up and applicable reporting requirements'},
  ],
};
const rehearsalMode=mode=>mode==='governance-rehearsal';
function offsetDate(date,offset){
  const parsed=Date.parse(day(date)+'T00:00:00Z')+offset*86400000;
  return new Date(parsed).toISOString().slice(0,10);
}
const fresh=()=>({version:1,committees:[],meetings:[],actions:[],notices:[],audit:[],receipts:[]});
export function governanceRegister(state){
  if(!Object.hasOwn(state,'governance'))return fresh();
  const g=state.governance;
  if(!g||g.version!==1||!['committees','meetings','actions','notices','audit','receipts'].every(k=>Array.isArray(g[k]))||
    !['committees','meetings','actions','notices'].every(k=>g[k].every(row=>row&&id(row.id))&&unique(g[k].map(row=>row.id)))||
    !g.meetings.every(row=>byId(g.committees,row.committeeId))||
    !g.actions.every(row=>byId(g.committees,row.committeeId)&&(!row.meetingId||byId(g.meetings,row.meetingId)?.committeeId===row.committeeId))||
    !g.notices.every(row=>byId(g.committees,row.committeeId)))fail('The committee register is invalid.',503);
  operationRegister(g);
  communicationsRegister(g);
  return g;
}
const perm=(s,a,action,c,now)=>can(s,a,action,'committee',c.id,now);
const requirePerm=(s,a,action,c,now)=>{if(!perm(s,a,action,c,now))fail();};
function eligibleActors(state,c,action,now){
  const access=accessRegistry(state);
  return (access?.accounts||[]).filter(a=>a.status==='active').flatMap(a=>{
    const person=byId(state.people,a.personId);
    const actor={id:person.id,name:person.name,access:'scoped',accountId:a.id,role:'member'};
    if(!perm(state,actor,action,c,now))return [];
    return [{id:person.id,name:person.name,roles:[...new Set(effectiveAccess(state,actor,now).filter(g=>g.scope.kind==='committee'&&g.scope.id===c.id&&g.permissions.includes(action)).map(g=>g.role))]}];
  });
}
const officePeople=(s,c,now)=>eligibleActors(s,c,'committee.task.own',now);
const voterIds=(s,c,now)=>eligibleActors(s,c,'committee.vote.rehearsal',now).map(a=>a.id);
const actualTask=(s,a)=>a.projectId?byId(byId(s.projects,a.projectId)?.tasks||[],a.id):null;
const taskDone=(s,a)=>a.projectId?actualTask(s,a)?.done===true:a.done===true;
const ownAction=(s,a,actor,c,now)=>a.ownerId===actor.id&&perm(s,actor,'committee.task.own',c,now);
const visibleAction=(s,a,actor,c,now)=>ownAction(s,a,actor,c,now)||perm(s,actor,'committee.task.assign',c,now);
const meetingSummary=m=>({id:m.id,committeeId:m.committeeId,title:m.title,kind:m.kind,date:m.date,time:m.time,location:m.location,status:m.status,version:m.version});
const isWorking=(s,a,c,now)=>perm(s,a,'committee.view',c,now);
const memberMinutes=(m)=>m.minutes?.released?.active?{meetingId:m.id,title:m.title,date:m.date,version:m.minutes.released.version,text:m.minutes.released.text,releasedAt:m.minutes.released.at,fictional:true}:null;
function quorum(s,c,m,now){
  if(!c.rehearsalRule||m.kind==='informal')return {status:'not-established',present:0,required:null};
  const allowed=voterIds(s,c,now);
  const present=(m.attendance?.present||[]).filter(p=>allowed.includes(p)&&!(m.attendance?.recused||[]).includes(p)).length;
  return {status:present>=c.rehearsalRule.quorum?'present':'absent',present,required:c.rehearsalRule.quorum};
}
function notice(g,c,{kind,sourceId,title,ownerId=null},actor,at){
  const prior=g.notices.find(n=>n.committeeId===c.id&&n.kind===kind&&n.sourceId===sourceId);
  if(prior){Object.assign(prior,{title,ownerId,version:prior.version+1,updatedAt:at,updatedBy:actor.id,retracted:false});return prior;}
  const row={id:crypto.randomUUID(),committeeId:c.id,kind,sourceId,title,ownerId,version:1,reads:[],reviews:[],retracted:false,createdAt:at,updatedAt:at,updatedBy:actor.id};g.notices.push(row);return row;
}
function updatePlanDates(state,g,c,m,actor,at){
  if(!m.plan)return;
  for(const job of m.plan.jobs){
    const a=byId(g.actions,job.actionId);
    if(!a||a.meetingId!==m.id||a.planKey!==job.key)fail('The linked planning duty is unavailable.',503);
    if(taskDone(state,a)||a.cancelled)continue;
    const dueDate=offsetDate(m.date,job.offsetDays);
    if(a.dueDate===dueDate)continue;
    a.history.push({action:'plan.reschedule',actorId:actor.id,at,previousDueDate:a.dueDate,previousAcknowledgedAt:a.acknowledgedAt});
    a.dueDate=dueDate;a.acknowledgedAt=null;
    notice(g,c,{kind:'task',sourceId:a.id,title:a.title,ownerId:a.ownerId},actor,at);
  }
}
function cancelPlanDuties(state,g,c,m,actor,at){
  for(const job of m.plan?.jobs||[]){
    const a=byId(g.actions,job.actionId);
    if(!a||a.meetingId!==m.id||a.planKey!==job.key)fail('The linked planning duty is unavailable.',503);
    if(taskDone(state,a))continue;
    a.cancelled=true;a.history.push({action:'plan.cancel',actorId:actor.id,at});
    const n=g.notices.find(n=>n.kind==='task'&&n.sourceId===a.id);
    if(n){n.retracted=true;n.version++;n.updatedAt=at;n.updatedBy=actor.id;}
  }
}
function noticeVisible(s,n,actor,c,now){
  if(!perm(s,actor,'committee.notice.read',c,now))return false;
  if(n.kind==='handover'){
    const h=operationRegister(s.governance).handovers.find(r=>r.id===n.sourceId&&r.committeeId===c.id);
    return Boolean(h&&(h.fromId===actor.id||h.toId===actor.id||perm(s,actor,'committee.office.plan',c,now)||perm(s,actor,'committee.office.review',c,now)));
  }
  return !n.ownerId||n.ownerId===actor.id||perm(s,actor,'committee.task.assign',c,now);
}
function noticeView(s,g,n,actor){
  const action=n.kind==='task'?byId(g.actions,n.sourceId):null;
  const handover=n.kind==='handover'?operationRegister(g).handovers.find(h=>h.id===n.sourceId):null;
  return {id:n.id,kind:n.kind,sourceId:n.sourceId,title:n.title,version:n.version,ownerId:n.ownerId,retracted:n.retracted,updatedAt:n.updatedAt,
    unread:!n.retracted&&n.updatedBy!==actor.id&&!n.reads.some(r=>r.actorId===actor.id&&r.version===n.version),
    reviewed:n.reviews.some(r=>r.actorId===actor.id&&r.version===n.version),
    resolved:n.retracted||(action?taskDone(s,action)||action.cancelled===true:handover?['cancelled','executed-fictional'].includes(handover.status):false),dueDate:action?.dueDate||null};
}
export function committeeDirectory(state,actor,now=new Date()){
  if(actor?.access!=='scoped')return {committees:[],proposalGroups:[]};
  const g=governanceRegister(state);
  const proposalGroups=state.groups.filter(group=>can(state,actor,'committee.propose','group',group.id,now)).map(({id,name})=>({id,name}));
  const committees=g.committees.filter(c=>isWorking(state,actor,c,now)||perm(state,actor,'committee.minutes.released',c,now)||perm(state,actor,'committee.library.released',c,now)||perm(state,actor,'committee.edition.released',c,now)||(c.status==='proposed'&&c.createdBy===actor.id&&proposalGroups.some(group=>group.id===c.groupId))).map(c=>({id:c.id,name:c.name,kind:c.kind,status:c.status,working:isWorking(state,actor,c,now)}));
  return {committees,proposalGroups};
}
export function committeeProjection(state,actor,committeeId,now=new Date(),mode='live'){
  if(actor?.access!=='scoped')fail();
  const directory=committeeDirectory(state,actor,now),g=governanceRegister(state);
  if(!committeeId)return {revision:state.revision,...directory,formalDecisionsEnabled:false,fictional:mode==='showcase'||rehearsalMode(mode)};
  const c=byId(g.committees,committeeId);
  if(!c||!directory.committees.some(row=>row.id===c.id))fail();
  const working=isWorking(state,actor,c,now);
  const released=g.meetings.filter(m=>m.committeeId===c.id).map(memberMinutes).filter(Boolean);
  const members=perm(state,actor,'committee.minutes.released',c,now);
  const base={revision:state.revision,committee:{id:c.id,name:c.name,kind:c.kind,status:c.status,groupId:working?c.groupId:null},working,
    permissions:{},meetings:[],actions:[],notices:[],releasedMinutes:members||working?released:[],officePeople:[],projects:[],constitutions:[],
    fictional:mode==='showcase'||rehearsalMode(mode),formalDecisionsEnabled:false};
  base.operations=operationsProjection(state,g,c,actor,now,mode);
  base.communications=communicationsProjection(state,g,c,actor,now);
  if(!working){
    if(c.status==='proposed'&&c.createdBy===actor.id&&directory.proposalGroups.some(g=>g.id===c.groupId))base.proposedOffices=c.offices.map(({role,status})=>({role,status}));
    return base;
  }
  for(const action of ['committee.meeting.manage','committee.attendance','committee.motion.write','committee.minutes.write','committee.minutes.review','committee.task.assign','committee.task.own','committee.notice.read','committee.notice.write',...operationViewPermissions,...communicationViewPermissions])base.permissions[action]=perm(state,actor,action,c,now);
  base.committee={...base.committee,offices:c.offices.map(o=>({...structuredClone(o),effectiveStatus:o.term&&Date.parse(o.term.endsAt)<=now.getTime()?'expired':o.status})),createdBy:c.createdBy,createdAt:c.createdAt};
  base.officePeople=officePeople(state,c,now);
  base.planningTemplates=structuredClone(planningTemplates);
  base.meetings=g.meetings.filter(m=>m.committeeId===c.id).map(m=>{
    const view=structuredClone(m);
    for(const item of view.agenda)for(const motion of item.motions){
      if(motion.projectId){const p=byId(state.projects,motion.projectId);if(!p||!can(state,actor,'project.view','group',p.groupId,now))motion.projectId=null;}
      if(motion.constitutionId&&!can(state,actor,'constitution.view','constitution',motion.constitutionId,now)){motion.constitutionId=null;motion.constitutionVersion=null;}
    }
    return {...view,quorum:rehearsalMode(mode)||mode==='showcase'?quorum(state,c,m,now):{status:'not-established',present:0,required:null}};
  });
  base.actions=g.actions.filter(a=>a.committeeId===c.id&&visibleAction(state,a,actor,c,now)).map(a=>{
    const view=structuredClone(a);
    if(view.projectId){const p=byId(state.projects,view.projectId);if(!p||!can(state,actor,'project.view','group',p.groupId,now))view.projectId=null;}
    return {...view,done:taskDone(state,a)};
  });
  base.notices=g.notices.filter(n=>n.committeeId===c.id&&noticeVisible(state,n,actor,c,now)).map(n=>noticeView(state,g,n,actor));
  base.projects=state.projects.filter(p=>p.groupId===c.groupId&&can(state,actor,'project.view','group',p.groupId,now)).map(({id,title})=>({id,title}));
  base.constitutions=state.constitutions.filter(d=>can(state,actor,'constitution.view','constitution',d.id,now)).map(({id,title,version})=>({id,title,version}));
  return base;
}
// Canonical collaboration task metadata is private to its assigned committee.
// Existing project views never expose a committee-linked task to another scope.
export function committeeDocument(state,actor,committeeId,docId,version,now=new Date(),mode='live'){
  if(actor?.access!=='scoped'||!Number.isSafeInteger(version)||version<1)fail('Document unavailable.',404);
  const g=governanceRegister(state),c=byId(g.committees,committeeId);
  if(!c||!isWorking(state,actor,c,now))fail('Document unavailable.',404);
  return libraryDocument(state,g,c,actor,docId,version,now,mode);
}
export function filterCommitteeTasks(state,actor,projects,now=new Date()){
  const g=governanceRegister(state);
  if(!g.actions.some(a=>a.projectId))return projects;
  return projects.map(p=>({...p,tasks:(p.tasks||[]).filter(t=>{
    const a=g.actions.find(a=>a.projectId===p.id&&a.id===t.id);
    if(!a)return true;
    const c=byId(g.committees,a.committeeId);
    return actor?.access==='scoped'&&c&&isWorking(state,actor,c,now)&&visibleAction(state,a,actor,c,now);
  }).map(t=>{
    const a=g.actions.find(a=>a.projectId===p.id&&a.id===t.id);
    return a?{...t,committeeId:a.committeeId,committeeAction:true}:t;
  })}));
}
export function guardCommitteeTask(state,command){
  if(command?.type==='task.toggle'&&governanceRegister(state).actions.some(a=>a.projectId===command.data?.projectId&&a.id===command.data?.taskId))fail('Complete this linked task from its committee duty desk.');
}
const stamp=(m,a,at,action,detail={})=>{m.version++;m.history.push({version:m.version,actorId:a.id,at,action,...detail});};
const pendingMotion=m=>m.agenda.flatMap(i=>i.motions).some(m=>m.ballot?.status==='open');
function targetMeeting(g,c,key){
  const m=byId(g.meetings,key);if(!m||m.committeeId!==c.id)fail();return m;
}
function targetMotion(m,key){
  const motion=m.agenda.flatMap(i=>i.motions).find(row=>row.id===key);if(!motion)fail();return motion;
}
function openMeeting(m){if(m.status!=='open')conflict('Open the scheduled working meeting before recording proceedings.');}
function mutableMeeting(m){if(!['scheduled','open'].includes(m.status))conflict('This meeting is no longer editable.');}
function ballotAllowed(mode,c,m){if(!rehearsalMode(mode)||!c.rehearsalRule||m.kind==='informal')fail('Formal votes and decisions are not enabled. Only isolated fictional rehearsal ballots are supported.');openMeeting(m);}
function scopeProject(state,actor,c,projectId,now){
  const p=byId(state.projects,projectId);
  if(!p||p.groupId!==c.groupId||!can(state,actor,'project.view','group',p.groupId,now))fail('Choose an authorised project from the committee working group.');
  return p;
}
function scopeDraft(state,actor,draftId,now){
  const d=byId(state.constitutions,draftId);
  if(!d||!can(state,actor,'constitution.view','constitution',d.id,now))fail('Choose an authorised working constitution draft.');
  return d;
}
const meetingOps={
  'meeting.plan':'committee.task.assign','meeting.schedule':'committee.meeting.manage','meeting.reschedule':'committee.meeting.manage','meeting.cancel':'committee.meeting.manage','meeting.open':'committee.meeting.manage','meeting.close':'committee.meeting.manage',
  'agenda.add':'committee.meeting.manage','agenda.edit':'committee.meeting.manage','meeting.attendance':'committee.attendance',
  'motion.propose':'committee.motion.write','motion.amend':'committee.motion.write',
  'motion.open-ballot':'committee.attendance','motion.vote':'committee.vote.rehearsal','motion.tally':'committee.attendance','motion.defer':'committee.attendance',
  'minutes.save':'committee.minutes.write','minutes.review':'committee.minutes.review','minutes.release':'committee.minutes.review','minutes.withdraw-release':'committee.minutes.review',
  'duty.assign':'committee.task.assign','duty.acknowledge':'committee.task.own','duty.complete':'committee.task.own',
  'notice.post':'committee.notice.write','notice.read':'committee.notice.read','notice.review':'committee.notice.read',
};
// All writes use the existing snapshot CAS. This register is additive; no
// separate project manager, no external communication or political activation.
export function executeCommitteeCommand(state,actor,command,now=new Date(),{mode='live'}={}){
  if(actor?.access!=='scoped'||['demo','showcase'].includes(mode))fail();
  const g0=governanceRegister(state),type=command?.type,data=command?.data;
  if(!id(command?.id)||!data||typeof data!=='object'||Array.isArray(data))invalid('Send a command ID and valid details.');
  let c0,permission;
  if(type==='committee.propose'){
    if(!can(state,actor,'committee.propose','group',data.groupId,now))fail();
  }else{
    c0=byId(g0.committees,data.committeeId);permission=meetingOps[type]||operationPermissions[type]||communicationPermissions[type];
    if(!c0||!permission)fail();
    requirePerm(state,actor,permission,c0,now);
    if(!isWorking(state,actor,c0,now))fail();
  }
  if(['motion.open-ballot','motion.vote','motion.tally','motion.defer','minutes.release','minutes.withdraw-release','office.execute','library.release','edition.release','edition.withdraw','partnership.authorise','partnership.accept','partnership.revoke'].includes(type)&&!rehearsalMode(mode))fail('Formal decisions and release are not enabled.');
  // Check current scope and mode before allowing a successful idempotent replay.
  const fingerprint=JSON.stringify({type,data});
  const prev=g0.receipts.find(r=>r.id===command.id);
  if(prev){if(prev.actorId!==actor.id||prev.fingerprint!==fingerprint)conflict('This command ID was already used.');return {state,result:{ok:true,revision:state.revision,replayed:true,id:prev.targetId}};}
  if(command.revision!==state.revision)conflict('The workspace changed. Refresh before saving.');
  const next=structuredClone(state),g=next.governance??=fresh(),at=now.toISOString();
  const c=c0&&byId(g.committees,c0.id);
  let targetId;
  if(type==='committee.propose'){
    const name=txt(data.name,'committee name',120),kind=data.kind;
    if(!committeeKinds.includes(kind)||!byId(next.groups,data.groupId))invalid('Choose the proposed scope and working group.');
    if(g.committees.some(row=>row.groupId===data.groupId&&row.name.toLowerCase()===name.toLowerCase()))conflict('A proposal with this name already exists.');
    targetId=crypto.randomUUID();
    g.committees.push({id:targetId,name,kind,groupId:data.groupId,status:'proposed',offices:roles.map(role=>({role,status:'vacant',personId:null,term:null,authorityRef:null})),createdBy:actor.id,createdAt:at});
  }else if(communicationPermissions[type]){
    targetId=applyCommunication(next,g,c,actor,type,data,now,mode);
  }else if(operationPermissions[type]){
    targetId=applyCommitteeOperation(next,g,c,actor,type,data,now,mode,{notice});
  }else if(type==='meeting.schedule'){
    if(!types.includes(data.kind))invalid('Choose a meeting type.');
    const title=txt(data.title,'meeting title',140);
    targetId=crypto.randomUUID();
    const m={id:targetId,committeeId:c.id,title,kind:data.kind,date:day(data.date),time:time(data.time),location:txt(data.location,'proposed location',180),status:'scheduled',version:1,
      agenda:templates[data.kind].map(title=>({id:crypto.randomUUID(),title,notes:'',motions:[]})),attendance:{present:[],apologies:[],recused:[],conflicts:''},
      minutes:{status:'draft',text:'',version:0,history:[]},createdBy:actor.id,createdAt:at,history:[{version:1,actorId:actor.id,at,action:type}]};
    g.meetings.push(m);notice(g,c,{kind:'meeting',sourceId:m.id,title:'Proposed meeting: '+m.title},actor,at);
  }else if(type.startsWith('meeting.')||type.startsWith('agenda.')||type.startsWith('motion.')||type.startsWith('minutes.')){
    const m=targetMeeting(g,c,data.meetingId);targetId=m.id;
    if(type==='meeting.plan'){
      requirePerm(next,actor,'committee.meeting.manage',c,now);
      if(m.status!=='scheduled'||!planningTemplates[m.kind])conflict('Plan only an unopened formation or annual working meeting.');
      const template=planningTemplates[m.kind],basis=txt(data.basis,'the proposed planning basis and source reference',1000),version=m.plan?.version||0;
      if(data.version!==version)conflict('The planning basis changed; refresh before saving.');
      if(!Array.isArray(data.jobs)||data.jobs.length!==template.length||!unique(data.jobs.map(j=>j?.key))||!template.every(job=>data.jobs.some(j=>j?.key===job.key)))invalid('Supply one owner and chosen relative date for every planning job.');
      const people=officePeople(next,c,now).map(p=>p.id),jobs=[];
      for(const item of template){
        const input=data.jobs.find(j=>j.key===item.key);
        if(!people.includes(input.ownerId)||!Number.isInteger(input.offsetDays)||input.offsetDays< -365||input.offsetDays>365)invalid('Choose a current office participant and an integer date offset within one year for every job.');
        const previous=m.plan?.jobs.find(j=>j.key===item.key);
        const a=previous?byId(g.actions,previous.actionId):null;
        if(previous&&(!a||a.planKey!==item.key||a.meetingId!==m.id))fail('The linked planning duty is unavailable.',503);
        if(a&&taskDone(next,a)){
          if(a.ownerId!==input.ownerId||previous.offsetDays!==input.offsetDays)conflict('Retain the original owner and date rule for completed work.');
          jobs.push(previous);continue;
        }
        const dueDate=offsetDate(m.date,input.offsetDays);
        if(a){
          if(a.ownerId!==input.ownerId||a.dueDate!==dueDate){
            a.history.push({action:'plan.revise',actorId:actor.id,at,previousOwnerId:a.ownerId,previousDueDate:a.dueDate,previousAcknowledgedAt:a.acknowledgedAt});
            a.ownerId=input.ownerId;a.dueDate=dueDate;a.acknowledgedAt=null;
            notice(g,c,{kind:'task',sourceId:a.id,title:a.title,ownerId:a.ownerId},actor,at);
          }
          jobs.push({key:item.key,offsetDays:input.offsetDays,actionId:a.id});
        }else{
          const newId=crypto.randomUUID(),record={id:newId,committeeId:c.id,meetingId:m.id,motionId:null,projectId:null,planKey:item.key,ownerId:input.ownerId,title:item.title,details:'Working checklist only. The basis and dates are proposed, not legal or adopted requirements.',dueDate,createdBy:actor.id,createdAt:at,acknowledgedAt:null,history:[],basis:'proposed-planning',done:false};
          g.actions.push(record);notice(g,c,{kind:'task',sourceId:newId,title:record.title,ownerId:record.ownerId},actor,at);
          jobs.push({key:item.key,offsetDays:input.offsetDays,actionId:newId});
        }
      }
      const history=m.plan?.history||[];
      if(m.plan)history.push({version:m.plan.version,basis:m.plan.basis,jobs:structuredClone(m.plan.jobs),actorId:m.plan.updatedBy,at:m.plan.updatedAt});
      m.plan={version:version+1,basis,jobs,history,updatedBy:actor.id,updatedAt:at};
      stamp(m,actor,at,type,{planVersion:m.plan.version});
    }else if(type==='meeting.reschedule'){
      if(m.status!=='scheduled')conflict('Only an unopened meeting can be rescheduled.');
      const previous=meetingSummary(m);m.date=day(data.date);m.time=time(data.time);m.location=txt(data.location,'proposed location',180);
      stamp(m,actor,at,type,{previous,reason:txt(data.reason,'reason',500)});
      notice(g,c,{kind:'meeting',sourceId:m.id,title:'Rescheduled proposed meeting: '+m.title},actor,at);
      updatePlanDates(next,g,c,m,actor,at);
    }else if(type==='meeting.cancel'){
      if(m.status!=='scheduled')conflict('Close an opened meeting rather than cancelling its history.');
      m.status='cancelled';stamp(m,actor,at,type,{reason:txt(data.reason,'reason',500)});
      cancelPlanDuties(next,g,c,m,actor,at);
      const n=g.notices.find(n=>n.kind==='meeting'&&n.sourceId===m.id);if(n){n.retracted=true;n.version++;n.updatedAt=at;n.updatedBy=actor.id;}
    }else if(type==='meeting.open'){
      if(m.status!=='scheduled'||dateTime(m)>now.getTime())conflict('Only an unopened meeting whose scheduled time has arrived may open.');
      m.status='open';m.openedAt=at;stamp(m,actor,at,type);
    }else if(type==='meeting.close'){
      openMeeting(m);if(pendingMotion(m))conflict('Tally or defer open rehearsal ballots before closing.');
      m.status='closed';m.closedAt=at;stamp(m,actor,at,type);
      const n=g.notices.find(n=>n.kind==='meeting'&&n.sourceId===m.id);if(n){n.retracted=true;n.version++;n.updatedAt=at;n.updatedBy=actor.id;}
    }else if(type==='agenda.add'){
      mutableMeeting(m);if(m.agenda.length>=80)invalid('This agenda has reached its working limit.');
      const item={id:crypto.randomUUID(),title:txt(data.title,'agenda heading',180),notes:txt(data.notes??'','notes',2000,false),motions:[]};m.agenda.push(item);targetId=item.id;stamp(m,actor,at,type,{itemId:item.id});
    }else if(type==='agenda.edit'){
      mutableMeeting(m);const item=byId(m.agenda,data.itemId);if(!item)fail();
      const previous={title:item.title,notes:item.notes};
      item.title=txt(data.title,'agenda heading',180);item.notes=txt(data.notes??'','notes',2000,false);stamp(m,actor,at,type,{itemId:item.id,previous});targetId=item.id;
    }else if(type==='meeting.attendance'){
      openMeeting(m);const eligible=officePeople(next,c,now).map(p=>p.id);
      for(const field of ['present','apologies','recused'])if(!Array.isArray(data[field])||!unique(data[field])||data[field].some(i=>!eligible.includes(i)))invalid('Choose distinct currently authorised office participants.');
      if(data.present.some(i=>data.apologies.includes(i))||data.recused.some(i=>!data.present.includes(i)))invalid('Attendance, apologies and recusals must agree.');
      const previous=structuredClone(m.attendance);m.attendance={present:[...data.present],apologies:[...data.apologies],recused:[...data.recused],conflicts:txt(data.conflicts??'','conflicts',1000,false)};
      if(rehearsalMode(mode)&&quorum(next,c,m,now).status!=='present')for(const motion of m.agenda.flatMap(i=>i.motions))if(motion.ballot?.status==='open'){motion.ballot.status='deferred';motion.ballot.closedAt=at;motion.ballot.reason='Quorum not maintained';}
      stamp(m,actor,at,type,{previous});
    }else if(type==='motion.propose'){
      mutableMeeting(m);const item=byId(m.agenda,data.itemId);if(!item)fail();
      if(m.kind==='informal')invalid('Use notes and follow-ups for informal listening sessions.');
      const projectId=data.projectId?scopeProject(next,actor,c,data.projectId,now).id:null;
      const draft=data.constitutionId?scopeDraft(next,actor,data.constitutionId,now):null;
      const handover=data.officeHandoverId?operationRegister(g).handovers.find(h=>h.id===data.officeHandoverId&&h.committeeId===c.id&&h.status==='reviewed'):null;
      if(data.officeHandoverId&&(!handover||!perm(next,actor,'committee.office.review',c,now)))fail('Choose a reviewed handover in this committee.');
      const partnership=data.partnershipId?communicationsRegister(g).partnerships.find(p=>p.id===data.partnershipId&&p.committeeId===c.id&&p.status==='reviewed'):null;
      if(data.partnershipId&&(!partnership||!perm(next,actor,'committee.partnership.review',c,now)))fail('Choose a reviewed partnership proposal in this committee.');
      const motion={id:crypto.randomUUID(),text:txt(data.text,'proposed wording',2000),authorId:actor.id,version:1,history:[],projectId,constitutionId:draft?.id||null,constitutionVersion:draft?.version||null,officeHandoverId:handover?.id||null,officeHandoverVersion:handover?.version||null,partnershipId:partnership?.id||null,partnershipVersion:partnership?.version||null,ballot:null,status:'proposed'};
      item.motions.push(motion);targetId=motion.id;stamp(m,actor,at,type,{motionId:motion.id});
    }else if(type==='motion.amend'){
      mutableMeeting(m);const motion=targetMotion(m,data.motionId);
      if(motion.authorId!==actor.id||motion.ballot)fail('Only the author may amend a motion before balloting.');
      if(data.version!==motion.version)conflict('The proposed wording changed.');
      motion.history.push({version:motion.version,text:motion.text,actorId:actor.id,at,reason:txt(data.reason,'reason',500)});
      motion.text=txt(data.text,'amended wording',2000);motion.version++;targetId=motion.id;stamp(m,actor,at,type,{motionId:motion.id});
    }else if(type.startsWith('motion.')){
      ballotAllowed(mode,c,m);const motion=targetMotion(m,data.motionId);targetId=motion.id;
      if(type==='motion.open-ballot'){
        if(motion.ballot||quorum(next,c,m,now).status!=='present')conflict('Quorum is required and the motion must not have a previous ballot.');
        const eligible=voterIds(next,c,now).filter(i=>m.attendance.present.includes(i)&&!m.attendance.recused.includes(i));
        motion.ballot={status:'open',eligible,votes:[],version:motion.version,openedAt:at,openedBy:actor.id,ruleRef:c.rehearsalRule.reference};
      }else{
        const b=motion.ballot;if(!b||b.status!=='open')conflict('No open rehearsal ballot.');
        if(type==='motion.vote'){
          if(quorum(next,c,m,now).status!=='present'||!b.eligible.includes(actor.id)||!voterIds(next,c,now).includes(actor.id)||!m.attendance.present.includes(actor.id)||m.attendance.recused.includes(actor.id))fail('Only an eligible, present, non-recused actor may cast their own rehearsal vote.');
          if(!['for','against','abstain'].includes(data.choice))invalid('Choose a rehearsal vote.');
          if(b.votes.some(v=>v.actorId===actor.id))conflict('This actor already voted.');
          b.votes.push({actorId:actor.id,choice:data.choice,at});
        }else if(type==='motion.tally'){
          if(quorum(next,c,m,now).status!=='present'||b.eligible.some(i=>!voterIds(next,c,now).includes(i)||!m.attendance.present.includes(i)||m.attendance.recused.includes(i)))conflict('Attendance or eligibility changed; defer the ballot.');
          if(b.votes.length!==b.eligible.length)conflict('Record every eligible rehearsal vote or abstention first.');
          const yes=b.votes.filter(v=>v.choice==='for').length,no=b.votes.filter(v=>v.choice==='against').length;
          Object.assign(b,{status:'tallied',outcome:yes>no?'carried':'not-carried',counts:{for:yes,against:no,abstain:b.votes.length-yes-no},closedAt:at,closedBy:actor.id});
        }else if(type==='motion.defer'){Object.assign(b,{status:'deferred',closedAt:at,closedBy:actor.id,reason:txt(data.reason,'reason',500)});}
      }
      stamp(m,actor,at,type,{motionId:motion.id});
    }else if(type==='minutes.save'){
      if(!['open','closed'].includes(m.status)||m.minutes.status==='reviewed')conflict('Open or close the meeting and retain reviewed minutes as a separate version.');
      if(data.version!==m.minutes.version)conflict('The working minutes changed.');
      m.minutes.history.push({version:m.minutes.version,text:m.minutes.text,editedBy:m.minutes.editedBy||null,at});
      Object.assign(m.minutes,{text:txt(data.text,'working minutes',12000),version:m.minutes.version+1,editedBy:actor.id,editedAt:at,status:'draft'});
      stamp(m,actor,at,type);
    }else if(type==='minutes.review'){
      if(m.status!=='closed'||m.minutes.status!=='draft'||!m.minutes.text||data.version!==m.minutes.version)conflict('Close the meeting and review the current saved minutes.');
      if(m.minutes.editedBy===actor.id||m.minutes.history.some(h=>h.editedBy===actor.id))fail('An independent reviewer must review the minutes.');
      Object.assign(m.minutes,{status:'reviewed',reviewedBy:actor.id,reviewedAt:at,reviewReason:txt(data.reason,'review reason',1000)});
      stamp(m,actor,at,type);
    }else if(type==='minutes.release'){
      if(m.minutes.status!=='reviewed'||m.minutes.released||data.version!==m.minutes.version)conflict('Only the reviewed working version can have a fictional member excerpt.');
      if(m.minutes.editedBy===actor.id||m.minutes.history.some(h=>h.editedBy===actor.id))fail('An independent reviewer must release the fictional excerpt.');
      m.minutes.released={active:true,version:m.minutes.version,text:txt(data.text,'separate member-safe excerpt',8000),at,actorId:actor.id};
      stamp(m,actor,at,type);
    }else if(type==='minutes.withdraw-release'){
      if(!m.minutes.released?.active)conflict('No released excerpt.');
      Object.assign(m.minutes.released,{active:false,withdrawnAt:at,withdrawnBy:actor.id,reason:txt(data.reason,'reason',500)});stamp(m,actor,at,type);
    }
  }else if(type==='duty.assign'){
    const m=data.meetingId?targetMeeting(g,c,data.meetingId):null;
    if(m&&!['open','closed'].includes(m.status))conflict('Record the meeting proceedings before assigning follow-ups.');
    if(!officePeople(next,c,now).some(p=>p.id===data.ownerId))fail('Choose a currently authorised office task owner.');
    const motion=data.motionId&&m?targetMotion(m,data.motionId):null;
    if(data.motionId&&!motion)invalid('Choose a motion from this meeting.');
    if(motion&&rehearsalMode(mode)&&(motion.ballot?.status!=='tallied'||motion.ballot.outcome!=='carried'))conflict('Only a carried fictional rehearsal motion can create a decision-linked follow-up.');
    const p=data.projectId?scopeProject(next,actor,c,data.projectId,now):null;
    if(motion?.projectId&&p?.id!==motion.projectId)invalid('The action must follow the motion project.');
    if(p){
      const ownerAccount=accessRegistry(next).accounts.find(row=>row.personId===data.ownerId&&row.status==='active');
      const ownerActor={id:data.ownerId,accountId:ownerAccount?.id,access:'scoped',role:'member'};
      if(!p.participantIds.includes(data.ownerId)||!can(next,ownerActor,'project.view','group',p.groupId,now))fail('The duty owner must already participate in the authorised linked project.');
    }
    const title=txt(data.title,'duty title',200),dueDate=data.dueDate?day(data.dueDate):null;
    targetId=crypto.randomUUID();
    const a={id:targetId,committeeId:c.id,meetingId:m?.id||null,motionId:motion?.id||null,projectId:p?.id||null,ownerId:data.ownerId,title,details:txt(data.details??'','details',1000,false),dueDate,createdBy:actor.id,createdAt:at,acknowledgedAt:null,history:[],basis:rehearsalMode(mode)&&motion?'fictional-rehearsal-decision':'working-follow-up'};
    if(p)p.tasks.push({id:a.id,title,done:false,assigneeId:a.ownerId});else a.done=false;
    g.actions.push(a);notice(g,c,{kind:'task',sourceId:a.id,title,ownerId:a.ownerId},actor,at);
  }else if(type==='duty.acknowledge'||type==='duty.complete'){
    const a=byId(g.actions,data.actionId);if(!a||a.committeeId!==c.id||!ownAction(next,a,actor,c,now))fail();
    if(taskDone(next,a)||a.cancelled)conflict('This duty is complete or cancelled.');
    if(a.projectId){const p=scopeProject(next,actor,c,a.projectId,now);if(!p.participantIds.includes(actor.id))fail('Current linked project participation is required.');}
    if(type==='duty.acknowledge'){
      if(a.acknowledgedAt)conflict('This duty has already been acknowledged.');
      a.acknowledgedAt=at;
    }else{
      if(!a.acknowledgedAt)conflict('Acknowledge your duty before completion.');
      if(a.projectId){const task=actualTask(next,a);if(!task||task.assigneeId!==actor.id)conflict('The linked project task changed.');task.done=true;}
      else a.done=true;
      a.completedAt=at;a.completedBy=actor.id;
    }
    a.history.push({action:type,actorId:actor.id,at});targetId=a.id;
  }else if(type==='notice.post'){
    targetId=crypto.randomUUID();notice(g,c,{kind:'info',sourceId:targetId,title:txt(data.title,'internal notice',240)},actor,at);
  }else if(type==='notice.read'||type==='notice.review'){
    const n=byId(g.notices,data.noticeId);if(!n||n.committeeId!==c.id||!noticeVisible(next,n,actor,c,now)||n.retracted)fail();
    if(data.version!==n.version)conflict('The notice changed.');
    const list=type==='notice.read'?n.reads:n.reviews;
    if(!list.some(row=>row.actorId===actor.id&&row.version===n.version))list.push({actorId:actor.id,version:n.version,at});
    targetId=n.id;
  }
  next.revision++;
  g.audit.push({id:crypto.randomUUID(),actorId:actor.id,at,type,targetId,committeeId:c?.id||targetId,mode:rehearsalMode(mode)?'fictional-rehearsal':'working-draft'});
  g.receipts.push({id:command.id,actorId:actor.id,fingerprint,targetId});
  return {state:next,result:{ok:true,revision:next.revision,id:targetId}};
}
