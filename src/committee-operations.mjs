import { AppError } from './errors.mjs';
import { accessRegistry, can, effectiveAccess } from './scoped-access.mjs';

const fail=(message='This committee operation is outside your authorised scope.',status=403)=>{throw new AppError(message,status);};
const invalid=m=>fail(m,400), conflict=m=>fail(m,409);
const text=(v,label,max=500,required=true)=>{if(typeof v!=='string'||v.length>max||(required&&!v.trim()))invalid('Enter '+label+' (maximum '+max+' characters).');return v.trim();};
const day=v=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)invalid('Choose a valid date.');return v;};
const money=v=>{if(!Number.isSafeInteger(v)||v<0||v>1000000000)invalid('Use non-negative whole AUD cents, up to A$10 million.');return v;};
const find=(rows,id)=>rows.find(r=>r.id===id);
const requireVersion=(r,d)=>{if(r.version!==d.version)conflict('This record changed; refresh and review the current version.');};
const unique=xs=>new Set(xs).size===xs.length;
const uid=()=>crypto.randomUUID();
const perm=(s,a,c,p,n)=>can(s,a,p,'committee',c.id,n);
const check=(s,a,c,p,n)=>{if(!perm(s,a,c,p,n))fail();};
const fictional=mode=>mode==='governance-rehearsal';
const officeRoles=['chair','deputy','secretary','assistant-secretary','treasurer','committee'];
const stores=['handovers','budgets','expenses','reconciliations','documents'];
export function operationRegister(g){
  const value=g.operations??Object.fromEntries(stores.map(k=>[k,[]]));
  if(!value||!stores.every(k=>Array.isArray(value[k])&&value[k].every(r=>r&&typeof r.id==='string'&&typeof r.committeeId==='string'&&g.committees.some(c=>c.id===r.committeeId))&&unique(value[k].map(r=>r.id))))fail('The committee operations register is invalid.',503);
  return value;
}
export const operationPermissions=Object.freeze({
  'office.plan':'committee.office.plan','office.accept':'committee.task.own','office.review':'committee.office.review','office.execute':'committee.office.review','office.cancel':'committee.office.plan',
  'budget.save':'committee.finance.write','budget.review':'committee.finance.review',
  'expense.save':'committee.finance.write','expense.review':'committee.finance.review',
  'reconcile.save':'committee.finance.write','reconcile.review':'committee.finance.review',
  'library.create':'committee.library.write','library.revise':'committee.library.write','library.access':'committee.library.write','library.review':'committee.library.review','library.withdraw':'committee.library.write','library.release':'committee.library.review',
});
export const operationViewPermissions=Object.freeze(['committee.office.plan','committee.office.review','committee.finance.view','committee.finance.write','committee.finance.review','committee.library.view','committee.library.write','committee.library.review','committee.library.released']);
function actorFor(s,personId){
  const account=accessRegistry(s)?.accounts.find(a=>a.personId===personId&&a.status==='active');
  const person=find(s.people,personId);
  return account&&person?{id:person.id,name:person.name,role:'member',access:'scoped',accountId:account.id}:null;
}
function officeGrant(s,c,personId,role,now){
  const actor=actorFor(s,personId);if(!actor)return null;
  return effectiveAccess(s,actor,now).find(g=>g.role===role&&g.scope.kind==='committee'&&g.scope.id===c.id&&g.permissions.includes('committee.view'))||null;
}
function canReadDoc(s,c,a,doc,now){
  if(!doc||doc.withdrawn||!perm(s,a,c,'committee.library.view',now))return false;
  if(doc.classification==='working')return true;
  return doc.access.some(r=>r.personId===a.id&&r.status==='active'&&Date.parse(r.expiresAt)>now.getTime());
}
function docMeta(d){return {id:d.id,title:d.title,classification:d.classification,kind:d.kind,version:d.version,status:d.status,createdBy:d.createdBy,updatedBy:d.updatedBy,updatedAt:d.updatedAt,versionCount:d.versions.length,reviewedBy:d.reviewedBy||null};}
function docSource(s,c,a,d,now){
  if(d.meetingId&&!s.governance.meetings.some(m=>m.id===d.meetingId&&m.committeeId===c.id))fail('Choose a meeting from this committee.');
  if(d.constitutionId&&!can(s,a,'constitution.view','constitution',d.constitutionId,now))fail('Choose an authorised constitution draft.');
  return {meetingId:d.meetingId||null,constitutionId:d.constitutionId||null};
}
export function libraryDocument(s,g,c,a,docId,version,now=new Date(),mode='live'){
  const doc=find(operationRegister(g).documents,docId);
  if(!doc||doc.committeeId!==c.id||!canReadDoc(s,c,a,doc,now))fail('Document unavailable.',404);
  const item=doc.versions.find(v=>v.version===version);
  if(!item)fail('Document version unavailable.',404);
  return {document:docMeta(doc),version:item.version,body:item.body,sourceDate:item.sourceDate,sourceNote:item.sourceNote,editedBy:item.actorId,editedAt:item.at,readOnly:mode==='showcase',fictional:mode==='showcase'||fictional(mode)};
}
const net=r=>r.amountCents-(r.refunds||[]).reduce((sum,f)=>sum+f.amountCents,0);
function income(s,c){
  const projectIds=new Set(s.projects.filter(p=>p.groupId===c.groupId).map(p=>p.id));
  return s.financialContributions.filter(r=>projectIds.has(r.projectId)&&r.currency==='AUD'&&r.status==='verified'&&r.settled===true).map(r=>({id:r.id,date:r.date,projectId:r.projectId,amountCents:net(r),personId:r.personId,createdBy:r.createdBy,verifiedBy:r.verifierId||null}));
}
function periodRows(s,ops,c,start,end){
  const within=r=>r.date>=start&&r.date<=end;
  const received=income(s,c).filter(within).sort((a,b)=>a.id.localeCompare(b.id));
  const expenses=ops.expenses.filter(e=>e.committeeId===c.id&&e.status==='reviewed'&&within(e)).sort((a,b)=>a.id.localeCompare(b.id)).map(e=>({id:e.id,date:e.date,amountCents:e.amountCents,version:e.version,createdBy:e.createdBy,payeeId:e.payeeId||null,reviewedBy:e.reviewedBy}));
  return {received,expenses};
}
const total=rows=>rows.reduce((n,r)=>n+r.amountCents,0);
const stamp=(r,a,at,action,detail={})=>{r.version++;r.history.push({version:r.version,actorId:a.id,at,action,...detail});};
const ownConflict=(r,a)=>r.createdBy===a.id||r.updatedBy===a.id||r.payeeId===a.id||(r.history||[]).some(h=>h.actorId===a.id&&h.action.endsWith('.save'));
function scopedRow(ops,key,id,c){const r=find(ops[key],id);if(!r||r.committeeId!==c.id)fail();return r;}
function reviewReason(data){if(data.noConflict!==true)invalid('Declare that you have no conflicting interest in this review.');return text(data.reason,'independent review reason',1000);}
function dateRange(data){const start=day(data.start),end=day(data.end);if(end<start)invalid('The end date must not precede the start date.');return {start,end};}
function sourceMotion(g,c,meetingId,motionId){
  const m=find(g.meetings,meetingId),motion=m?.agenda.flatMap(i=>i.motions).find(v=>v.id===motionId);
  if(!m||m.committeeId!==c.id||m.status!=='closed'||m.minutes?.status!=='reviewed'||motion?.ballot?.status!=='tallied'||motion.ballot.outcome!=='carried')conflict('A closed, independently reviewed fictional meeting with a carried rehearsal motion is required.');
  return motion;
}
function done(s,a){return a.projectId?find(find(s.projects,a.projectId)?.tasks||[],a.id)?.done===true:a.done===true;}
function validateDutyTransfer(s,g,c,from,to,ids,now){
  if(!Array.isArray(ids)||!unique(ids))invalid('Choose each outstanding duty once.');
  const target=actorFor(s,to);if(!target||!perm(s,target,c,'committee.task.own',now))fail('The successor needs existing scoped duty access.');
  return ids.map(id=>{
    const a=find(g.actions,id);
    if(!a||a.committeeId!==c.id||a.ownerId!==from||a.cancelled||done(s,a))conflict('An outstanding duty changed; review the handover again.');
    if(a.projectId){const p=find(s.projects,a.projectId),task=find(p?.tasks||[],a.id);if(!p||p.groupId!==c.groupId||!task||task.assigneeId!==from||!p.participantIds.includes(to)||!can(s,target,'project.view','group',p.groupId,now))fail('The successor must already have access and participate in every linked project.');}
    return a;
  });
}
export function operationsProjection(s,g,c,a,now=new Date(),mode='live'){
  const ops=operationRegister(g),working=perm(s,a,c,'committee.view',now),finance=working&&perm(s,a,c,'committee.finance.view',now);
  const handovers=working?ops.handovers.filter(r=>r.committeeId===c.id&&(r.fromId===a.id||r.toId===a.id||perm(s,a,c,'committee.office.plan',now)||perm(s,a,c,'committee.office.review',now))).map(r=>structuredClone(r)):[];
  const candidates=working&&perm(s,a,c,'committee.office.plan',now)?(accessRegistry(s)?.accounts||[]).filter(ac=>ac.status==='active').flatMap(ac=>{
    const actor=actorFor(s,ac.personId);if(!actor)return [];
    const roles=effectiveAccess(s,actor,now).filter(gr=>gr.scope.kind==='committee'&&gr.scope.id===c.id&&officeRoles.includes(gr.role)&&gr.permissions.includes('committee.view')).map(gr=>gr.role);
    return roles.length?[{id:actor.id,name:actor.name,roles:[...new Set(roles)]}]:[];
  }):[];
  const library=ops.documents.filter(r=>r.committeeId===c.id&&canReadDoc(s,c,a,r,now)).map(d=>({...docMeta(d),access:perm(s,a,c,'committee.library.write',now)?d.access.map(({personId,status,expiresAt})=>({personId,status,expiresAt})):undefined}));
  const released=perm(s,a,c,'committee.library.released',now)?ops.documents.filter(d=>d.committeeId===c.id&&d.released?.active&&!d.withdrawn).map(d=>({id:d.id,title:d.title,version:d.released.version,text:d.released.text,fictional:true})): [];
  const visibleIncome=finance?income(s,c).map(({id,date,projectId,amountCents})=>({id,date,projectId,amountCents})):[];
  return {handovers,candidates,library,released,
    finance:finance?{income:visibleIncome,budgets:ops.budgets.filter(r=>r.committeeId===c.id).map(r=>structuredClone(r)),expenses:ops.expenses.filter(r=>r.committeeId===c.id).map(r=>structuredClone(r)),reconciliations:ops.reconciliations.filter(r=>r.committeeId===c.id).map(r=>{
      const current=periodRows(s,ops,c,r.start,r.end);
      const stale=JSON.stringify(current)!==JSON.stringify(r.sources);
      return {...structuredClone(r),stale};
    }),currency:'AUD',paymentsEnabled:false}:null};
}
export function applyCommitteeOperation(s,g,c,a,type,d,now,mode,{notice}){
  const at=now.toISOString(),ops=g.operations??=operationRegister(g),permission=operationPermissions[type];
  if(!permission)fail();check(s,a,c,permission,now);
  if(type==='office.execute'||type==='library.release'){
    if(!fictional(mode))fail('Actual appointments, authority changes and external publication are held.');
  }
  if(type==='office.plan'){
    const role=d.role,seat=c.offices.find(o=>o.role===role);
    if(!officeRoles.includes(role)||!seat)invalid('Choose a prospective office.');
    const fromId=seat.personId||null,toId=d.toId;
    if(!toId||fromId===toId||!officeGrant(s,c,toId,role,now))fail('Choose a distinct successor with an existing, explicitly scoped grant for that office.');
    if(ops.handovers.some(h=>h.committeeId===c.id&&h.role===role&&['proposed','accepted','reviewed'].includes(h.status)))conflict('There is already an open handover for this office.');
    const termStart=day(d.termStart),termEnd=day(d.termEnd),reviewDate=day(d.reviewDate);
    if(termEnd<=termStart||reviewDate<termStart||reviewDate>termEnd)invalid('Choose a valid proposed term and review date.');
    const duties=fromId?validateDutyTransfer(s,g,c,fromId,toId,d.dutyIds??[],now):[];
    if(!fromId&&(d.dutyIds||[]).length)invalid('A vacant office has no outgoing duties.');
    const documentIds=d.documentIds??[];
    if(!Array.isArray(documentIds)||!unique(documentIds))invalid('Choose each document once.');
    for(const id of documentIds){const doc=scopedRow(ops,'documents',id,c);if(!canReadDoc(s,c,a,doc,now)||!canReadDoc(s,c,actorFor(s,toId),doc,now))fail('Both parties must already have document access.');}
    const r={id:uid(),committeeId:c.id,role,fromId,toId,termStart,termEnd,reviewDate,dutyIds:duties.map(x=>x.id),documentIds,reason:text(d.reason,'proposed handover reason',1000),authorityNote:text(d.authorityNote,'proposed authority reference',500),status:'proposed',version:1,createdBy:a.id,createdAt:at,history:[]};
    ops.handovers.push(r);notice(g,c,{kind:'info',sourceId:r.id,title:'Proposed office handover awaiting acceptance',ownerId:toId},a,at);return r.id;
  }
  if(type.startsWith('office.')){
    const r=scopedRow(ops,'handovers',d.id,c);requireVersion(r,d);
    if(type==='office.accept'){
      if(r.status!=='proposed'||r.toId!==a.id||!officeGrant(s,c,a.id,r.role,now)||d.acknowledged!==true)fail('Only the proposed successor can acknowledge this working handover.');
      r.status='accepted';r.acceptedBy=a.id;r.acceptedAt=at;
    }else if(type==='office.review'){
      if(r.status!=='accepted'||[r.createdBy,r.fromId,r.toId].includes(a.id))fail('An independent reviewer must review the accepted handover.');
      r.reviewReason=reviewReason(d);r.reviewedBy=a.id;r.reviewedAt=at;r.status='reviewed';
    }else if(type==='office.cancel'){
      if(!['proposed','accepted','reviewed'].includes(r.status))conflict('The handover is closed.');
      r.status='cancelled';r.cancelReason=text(d.reason,'cancellation reason',500);
    }else if(type==='office.execute'){
      if(r.status!=='reviewed'||[r.createdBy,r.fromId,r.toId].includes(a.id))fail('An independent authorised reviewer must execute the fictional transition.');
      const motion=sourceMotion(g,c,d.meetingId,d.motionId),seat=c.offices.find(o=>o.role===r.role),successor=officeGrant(s,c,r.toId,r.role,now);
      if(!seat||seat.personId!==r.fromId||!successor)conflict('The office or successor grant changed.');
      if(motion.officeHandoverId!==r.id||motion.officeHandoverVersion!==r.version)conflict('The reviewed fictional motion must identify the exact handover and version.');
      if(r.termStart>at.slice(0,10)||r.termEnd<at.slice(0,10))conflict('The proposed term is not current.');
      const duties=r.fromId?validateDutyTransfer(s,g,c,r.fromId,r.toId,r.dutyIds,now):[];
      if(r.fromId){
        const oldAccount=actorFor(s,r.fromId);
        const oldGrants=s.accessControl.grants.filter(gr=>gr.accountId===oldAccount?.accountId&&gr.role===r.role&&gr.scope.kind==='committee'&&gr.scope.id===c.id&&gr.status==='active');
        if(!oldGrants.length)conflict('The outgoing office grant is unavailable.');
        for(const gr of oldGrants)Object.assign(gr,{status:'revoked',revokedBy:a.id,revokedAt:at});
      }
      for(const task of duties){
        task.history.push({action:'office.handover',actorId:a.id,at,previousOwnerId:task.ownerId,previousAcknowledgedAt:task.acknowledgedAt});
        task.ownerId=r.toId;task.acknowledgedAt=null;
        if(task.projectId)find(find(s.projects,task.projectId).tasks,task.id).assigneeId=r.toId;
        notice(g,c,{kind:'task',sourceId:task.id,title:task.title,ownerId:r.toId},a,at);
      }
      (seat.history??=[]).push({personId:seat.personId,term:seat.term,authorityRef:seat.authorityRef,endedAt:at,actorId:a.id});
      Object.assign(seat,{personId:r.toId,status:'fictional',term:{startsAt:r.termStart+'T00:00:00.000Z',endsAt:r.termEnd+'T23:59:59.000Z'},authorityRef:motion.id});
      r.status='executed-fictional';r.executedBy=a.id;r.executedAt=at;r.motionId=motion.id;
      s.accessControl.audit.push({id:uid(),actorId:a.id,type:'office.handover-fictional',targetId:r.id,at,reason:'Fictional reviewed transition; no new account or grant created.'});
    }
    stamp(r,a,at,type);return r.id;
  }
  if(type==='budget.save'){
    const period=dateRange(d),lines=d.lines;
    if(!Array.isArray(lines)||!lines.length||lines.length>30||lines.some(l=>!l||typeof l.label!=='string'))invalid('Supply one or more budget lines.');
    const cleaned=lines.map(l=>({label:text(l.label,'budget line',100),amountCents:money(l.amountCents)}));
    if(!unique(cleaned.map(l=>l.label.toLowerCase())))invalid('Keep budget line labels distinct.');
    const cap=money(d.reviewLimitCents),sum=total(cleaned);if(sum>cap)invalid('The draft total exceeds the explicit proposed review limit.');
    const values={...period,title:text(d.title,'budget title',120),lines:cleaned,reviewLimitCents:cap,basis:text(d.basis,'budget basis',1000),status:'draft',updatedBy:a.id,updatedAt:at};
    let r;
    if(d.id){r=scopedRow(ops,'budgets',d.id,c);requireVersion(r,d);if(r.status==='reviewed')conflict('Preserve the reviewed budget; open a new proposed revision.');stamp(r,a,at,type,{before:structuredClone({title:r.title,lines:r.lines,basis:r.basis,reviewLimitCents:r.reviewLimitCents,start:r.start,end:r.end})});Object.assign(r,values);}
    else{r={id:uid(),committeeId:c.id,version:1,createdBy:a.id,createdAt:at,history:[],...values};ops.budgets.push(r);}
    return r.id;
  }
  if(type==='budget.review'){
    const r=scopedRow(ops,'budgets',d.id,c);requireVersion(r,d);
    if(r.status!=='draft'||ownConflict(r,a))fail('Independent review of the current working budget is required.');
    r.reviewReason=reviewReason(d);r.status='reviewed';r.reviewedBy=a.id;r.reviewedAt=at;stamp(r,a,at,type);return r.id;
  }
  if(type==='expense.save'){
    const amountCents=money(d.amountCents);if(!amountCents)invalid('Use a positive recorded expense.');
    const reference=text(d.reference,'external receipt reference',120);
    if(ops.expenses.some(x=>x.id!==d.id&&(x.reference.toLowerCase()===reference.toLowerCase()||x.history.some(h=>h.before?.reference?.toLowerCase()===reference.toLowerCase()))))conflict('This expense reference is already recorded.');
    const payeeId=d.payeeId||null;if(payeeId&&!find(s.people,payeeId))invalid('Choose an existing participant or leave the payee unspecified.');
    if(d.settled!==true)invalid('Confirm that this records an existing settled expense, not a payment request.');
    const values={date:day(d.date),amountCents,reference,description:text(d.description,'expense evidence description',500),payeeId,status:'pending',updatedBy:a.id,updatedAt:at};
    if(values.date>at.slice(0,10))invalid('Recorded expenses cannot be future-dated.');
    let r;if(d.id){r=scopedRow(ops,'expenses',d.id,c);requireVersion(r,d);if(r.createdBy!==a.id)fail('Only the recorder can propose a correction.');
      stamp(r,a,at,type,{before:{date:r.date,amountCents:r.amountCents,reference:r.reference,description:r.description,payeeId:r.payeeId,status:r.status,reviewedBy:r.reviewedBy,reviewedAt:r.reviewedAt,reviewReason:r.reviewReason},reason:text(d.reason,'correction reason',500)});
      Object.assign(r,values,{reviewedBy:null,reviewedAt:null,reviewReason:null});
    }else{r={id:uid(),committeeId:c.id,version:1,createdBy:a.id,createdAt:at,history:[],...values};ops.expenses.push(r);}
    return r.id;
  }
  if(type==='expense.review'){
    const r=scopedRow(ops,'expenses',d.id,c);requireVersion(r,d);if(r.status!=='pending'||ownConflict(r,a))fail('Independent review of the recorded expense is required.');
    r.reviewReason=reviewReason(d);r.reviewedBy=a.id;r.reviewedAt=at;r.status=d.outcome==='reject'?'rejected':'reviewed';if(!['verify','reject'].includes(d.outcome))invalid('Choose a review outcome.');stamp(r,a,at,type);return r.id;
  }
  if(type==='reconcile.save'){
    const {start,end}=dateRange(d),sources=periodRows(s,ops,c,start,end);
    const openingCents=money(d.openingCents),statementClosingCents=money(d.statementClosingCents),expectedClosingCents=openingCents+total(sources.received)-total(sources.expenses);
    if(!Number.isSafeInteger(expectedClosingCents))invalid('The reconciliation is outside the supported amount range.');
    if(ops.reconciliations.some(r=>r.committeeId===c.id&&r.start===start&&r.end===end&&r.status==='draft'))conflict('Review the existing draft reconciliation for this period first.');
    const r={id:uid(),committeeId:c.id,version:1,start,end,openingCents,statementClosingCents,expectedClosingCents,differenceCents:statementClosingCents-expectedClosingCents,sources,basis:text(d.basis,'statement and opening balance evidence reference',1000),status:'draft',createdBy:a.id,createdAt:at,history:[]};
    ops.reconciliations.push(r);return r.id;
  }
  if(type==='reconcile.review'){
    const r=scopedRow(ops,'reconciliations',d.id,c);requireVersion(r,d);
    if(r.status!=='draft'||ownConflict(r,a)||r.sources.received.some(x=>[x.personId,x.createdBy].includes(a.id))||r.sources.expenses.some(x=>[x.createdBy,x.payeeId].includes(a.id)))fail('A reviewer independent of the recorded transactions and reconciliation is required.');
    if(JSON.stringify(periodRows(s,ops,c,r.start,r.end))!==JSON.stringify(r.sources))conflict('The source receipts or expenses changed. Reconcile the current records.');
    if(!['confirm','return'].includes(d.outcome))invalid('Choose a reconciliation review outcome.');
    if(d.outcome==='confirm'&&r.differenceCents!==0)conflict('Resolve the statement difference before confirming reconciliation.');
    r.reviewReason=reviewReason(d);r.status=d.outcome==='confirm'?'reviewed':'returned';r.reviewedBy=a.id;r.reviewedAt=at;stamp(r,a,at,type);return r.id;
  }
  if(type==='library.create'){
    const classification=d.classification,kind=d.kind;
    if(!['working','restricted'].includes(classification)||!['minutes','working-paper','evidence-summary','constitution-note','report'].includes(kind))invalid('Choose document type and classification.');
    const source=docSource(s,c,a,d,now),body=text(d.body,'plain text working document',6000),sourceNote=text(d.sourceNote,'source note',500);
    const r={id:uid(),committeeId:c.id,title:text(d.title,'document title',120),classification,kind,...source,version:1,status:'draft',createdBy:a.id,createdAt:at,updatedBy:a.id,updatedAt:at,access:[],history:[],versions:[{version:1,body,sourceDate:day(d.sourceDate),sourceNote,actorId:a.id,at}]};
    if(classification==='restricted')r.access.push({personId:a.id,status:'active',expiresAt:new Date(now.getTime()+30*86400000).toISOString(),grantedBy:a.id});
    ops.documents.push(r);return r.id;
  }
  if(type.startsWith('library.')){
    const r=scopedRow(ops,'documents',d.id,c);requireVersion(r,d);
    if(!canReadDoc(s,c,a,r,now))fail('Document unavailable.',404);
    if(type==='library.revise'){
      if(r.createdBy!==a.id)fail('Only the document owner may prepare a revision.');
      r.versions.push({version:r.version+1,body:text(d.body,'plain text working document',6000),sourceDate:day(d.sourceDate),sourceNote:text(d.sourceNote,'source note',500),actorId:a.id,at});
      r.status='draft';r.reviewedBy=null;r.reviewedAt=null;r.reviewReason=null;
      if(r.released?.active){r.released.active=false;r.released.withdrawnAt=at;}
      r.updatedBy=a.id;r.updatedAt=at;stamp(r,a,at,type);return r.id;
    }
    if(type==='library.access'){
      if(r.classification!=='restricted'||r.createdBy!==a.id)fail('Only the restricted document owner can change its access list.');
      const personId=d.personId;if(personId===r.createdBy)invalid('The document owner retains responsibility.');
      const target=actorFor(s,personId),prior=r.access.find(x=>x.personId===personId);
      if(d.action==='grant'){
        if(!target||!perm(s,target,c,'committee.library.view',now))fail('Choose an existing scoped library reader.');
        const expiresAt=new Date(day(d.expiresOn)+'T23:59:59.000Z').toISOString();
        if(Date.parse(expiresAt)<=now.getTime()||Date.parse(expiresAt)>now.getTime()+366*86400000)invalid('Choose a future access expiry within one year.');
        const grant={personId,status:'active',expiresAt,grantedBy:a.id,at};if(prior)Object.assign(prior,grant);else r.access.push(grant);
      }else if(d.action==='revoke'){if(!prior||prior.status!=='active')conflict('No active access to revoke.');Object.assign(prior,{status:'revoked',revokedAt:at,revokedBy:a.id});}else invalid('Choose grant or revoke.');
      stamp(r,a,at,type,{personId,actionTaken:d.action,reason:text(d.reason,'access reason',500)});return r.id;
    }
    if(type==='library.review'){
      if(r.status!=='draft'||r.versions.some(v=>v.actorId===a.id))fail('Independent document review is required.');
      r.reviewReason=reviewReason(d);r.status='reviewed';r.reviewedBy=a.id;r.reviewedAt=at;
      r.reviewedVersion=r.versions.at(-1).version;stamp(r,a,at,type);return r.id;
    }
    if(type==='library.release'){
      if(r.status!=='reviewed'||r.reviewedVersion!==r.versions.at(-1).version||r.versions.some(v=>v.actorId===a.id))fail('Only an independently reviewed version can produce a fictional member excerpt.');
      if(r.released?.active)conflict('A member excerpt already exists.');
      (r.releaseHistory??=[]).push(...(r.released?[structuredClone(r.released)]:[]));
      r.released={active:true,version:r.reviewedVersion,text:text(d.text,'separate member-safe excerpt',4000),actorId:a.id,at};stamp(r,a,at,type);return r.id;
    }
    if(type==='library.withdraw'){
      if(r.createdBy!==a.id)fail('Only the owner can withdraw the working document.');
      r.withdrawn=true;r.withdrawReason=text(d.reason,'withdrawal reason',500);if(r.released)r.released.active=false;stamp(r,a,at,type);return r.id;
    }
  }
  fail();
}
