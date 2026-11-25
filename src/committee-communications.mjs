import { AppError } from './errors.mjs';
import { can } from './scoped-access.mjs';
const fail=(m='This operation is outside your authorised committee scope.',status=403)=>{throw new AppError(m,status)};
const bad=m=>fail(m,400), clash=m=>fail(m,409);
const txt=(v,label,max=1000)=>{if(typeof v!=='string'||!v.trim()||v.length>max)bad('Enter '+label+' (maximum '+max+' characters).');return v.trim()};
const month=v=>{if(typeof v!=='string'||!/^\d{4}-(0[1-9]|1[0-2])$/.test(v))bad('Choose a valid edition month.');return v};
const day=v=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)bad('Choose a valid date.');return v};
const uid=()=>crypto.randomUUID();
const allowed=(s,a,c,p,n)=>can(s,a,p,'committee',c.id,n);
const requirePerm=(s,a,c,p,n)=>{if(!allowed(s,a,c,p,n))fail()};
const rehearsal=m=>m==='governance-rehearsal';
const find=(rows,id,c)=>rows.find(r=>r.id===id&&r.committeeId===c.id);
const version=(r,d)=>{if(!r)fail();if(r.version!==d.version)clash('This record changed. Reopen the current revision.')};
const stamp=(r,a,at,action,detail={})=>{r.version++;r.updatedBy=a.id;r.updatedAt=at;r.history.push({version:r.version,actorId:a.id,at,action,...detail})};
const review=(d)=>{if(d.noConflict!==true)bad('Declare that you have no conflicting interest.');return txt(d.reason,'independent review reason')};
export const communicationPermissions=Object.freeze({
 'edition.create':'committee.edition.edit','edition.contribute':'committee.edition.contribute','edition.submit-contribution':'committee.edition.contribute','edition.assemble':'committee.edition.edit','edition.submit':'committee.edition.edit','edition.review':'committee.edition.review','edition.release':'committee.edition.review','edition.withdraw':'committee.edition.review',
 'partnership.propose':'committee.partnership.propose','partnership.review':'committee.partnership.review','partnership.authorise':'committee.partnership.review','partnership.accept':'committee.partnership.review','partnership.revoke':'committee.partnership.review',
});
export const communicationViewPermissions=['committee.edition.edit','committee.edition.contribute','committee.edition.review','committee.edition.released','committee.partnership.propose','committee.partnership.review'];
export function communicationsRegister(g){
 const r=g.communications??{editions:[],partnerships:[]};
 if(!r||!['editions','partnerships'].every(k=>Array.isArray(r[k])&&r[k].every(v=>v&&typeof v.id==='string'&&g.committees.some(c=>c.id===v.committeeId))&&new Set(r[k].map(v=>v.id)).size===r[k].length))fail('The communications register is invalid.',503);
 return r;
}
function editor(s,a,c,n){return allowed(s,a,c,'committee.edition.edit',n)}
function reviewer(s,a,c,n){return allowed(s,a,c,'committee.edition.review',n)}
function editionView(s,a,c,e,n){
 const privileged=editor(s,a,c,n)||reviewer(s,a,c,n);
 const contributions=e.contributions.filter(x=>x.actorId===a.id||privileged&&x.status==='submitted').map(x=>({id:x.id,actorId:x.actorId,title:x.title,text:x.text,status:x.status,version:x.version,history:x.actorId===a.id?structuredClone(x.history):[]}));
 return {id:e.id,month:e.month,title:e.title,status:e.status,version:e.version,createdBy:e.createdBy,contributions,
  ...(privileged?{draft:structuredClone(e.draft),reviewedBy:e.reviewedBy||null,reviewReason:e.reviewReason||null,history:e.history.map(({version,actorId,at,action})=>({version,actorId,at,action}))}:{})};
}
export function communicationsProjection(s,g,c,a,n){
 const r=communicationsRegister(g),working=allowed(s,a,c,'committee.view',n);
 return {editions:working&&(editor(s,a,c,n)||reviewer(s,a,c,n)||allowed(s,a,c,'committee.edition.contribute',n))?r.editions.filter(e=>e.committeeId===c.id).map(e=>editionView(s,a,c,e,n)):[],
 released:allowed(s,a,c,'committee.edition.released',n)?r.editions.filter(e=>e.committeeId===c.id&&e.release?.active).map(e=>({id:e.id,month:e.month,title:e.release.title,text:e.release.text,version:e.release.version,fictional:true})):[],
 partnerships:working&&(allowed(s,a,c,'committee.partnership.propose',n)||allowed(s,a,c,'committee.partnership.review',n))?r.partnerships.filter(e=>e.committeeId===c.id).map(e=>{const copy=structuredClone(e);if(copy.projectId&&!s.projects.some(p=>p.id===copy.projectId&&can(s,a,'project.view','group',p.groupId,n)))copy.projectId=null;return {...copy,effectiveStatus:e.status==='accepted-fictional'&&e.reviewDate<n.toISOString().slice(0,10)?'review-due':e.status};}):[]};
}
function motionFor(g,c,d,p){
 const m=g.meetings.find(x=>x.id===d.meetingId&&x.committeeId===c.id);
 const motion=m?.agenda.flatMap(i=>i.motions).find(x=>x.id===d.motionId);
 if(!m||m.status!=='closed'||m.minutes?.status!=='reviewed'||motion?.ballot?.status!=='tallied'||motion.ballot.outcome!=='carried'||motion.partnershipId!==p.id||motion.partnershipVersion!==p.version)clash('A closed, reviewed fictional meeting with a carried motion for this exact proposal revision is required.');
 return motion;
}
export function applyCommunication(s,g,c,a,type,d,n,mode){
 const at=n.toISOString(),r=g.communications??=communicationsRegister(g),permission=communicationPermissions[type];
 if(!permission)fail();requirePerm(s,a,c,permission,n);
 if(['edition.release','edition.withdraw','partnership.authorise','partnership.accept','partnership.revoke'].includes(type)&&!rehearsal(mode))fail('Actual release, partner authority, acceptance and commitments remain disabled.');
 if(type==='edition.create'){
  const m=month(d.month);if(r.editions.some(x=>x.committeeId===c.id&&x.month===m))clash('An edition already exists for this month.');
  const e={id:uid(),committeeId:c.id,month:m,title:txt(d.title,'edition title',120),createdBy:a.id,status:'draft',version:1,contributions:[],draft:null,editorIds:[],history:[]};r.editions.push(e);return e.id;
 }
 if(type.startsWith('edition.')){
  const e=find(r.editions,d.id,c);version(e,d);
  if(type==='edition.contribute'||type==='edition.submit-contribution'){
   if(e.status!=='draft')clash('The edition is no longer accepting contributions.');
   let x=e.contributions.find(x=>x.actorId===a.id);
   if(type==='edition.contribute'){
    const title=txt(d.title,'contribution title',120),text=txt(d.text,'member-safe draft contribution',3000);
    if(!x){x={id:uid(),actorId:a.id,title,text,status:'draft',version:1,history:[]};e.contributions.push(x);}
    else{if(x.status==='submitted')clash('Submitted contributions are locked.');stamp(x,a,at,type,{before:{title:x.title,text:x.text}});Object.assign(x,{title,text});}
   }else{if(!x||x.status!=='draft')clash('Save a draft contribution first.');x.status='submitted';stamp(x,a,at,type);}
   stamp(e,a,at,type);return e.id;
  }
  if(type==='edition.assemble'){
   if(e.status!=='draft')clash('The edition is not editable.');
   if(!Array.isArray(d.contributionIds)||!d.contributionIds.length||new Set(d.contributionIds).size!==d.contributionIds.length)bad('Choose distinct submitted contributions.');
   const selected=d.contributionIds.map(id=>e.contributions.find(x=>x.id===id&&x.status==='submitted'));if(selected.some(x=>!x))bad('Choose only submitted contributions.');
   const draft={title:txt(d.title,'edition title',120),intro:txt(d.intro,'editor introduction',1500),articles:selected.map(x=>({id:x.id,version:x.version,title:x.title,text:x.text,actorId:x.actorId}))};
   if(!e.editorIds.includes(a.id))e.editorIds.push(a.id);
   stamp(e,a,at,type,{previous:structuredClone(e.draft)});e.draft=draft;return e.id;
  }
  if(type==='edition.submit'){
   if(e.status!=='draft'||!e.draft)clash('Assemble an edition first.');
   if(!e.editorIds.includes(a.id))e.editorIds.push(a.id);
   e.status='review';stamp(e,a,at,type);return e.id;
  }
  if(type==='edition.review'){
   if(e.status!=='review'||e.editorIds.includes(a.id)||e.draft.articles.some(x=>x.actorId===a.id))fail('Independent review of the assembled edition is required.');
   if(!['approve','return'].includes(d.outcome))bad('Choose an independent review outcome.');
   e.reviewReason=review(d);e.reviewedBy=a.id;e.status=d.outcome==='approve'?'reviewed':'draft';stamp(e,a,at,type,{outcome:d.outcome,reason:e.reviewReason});return e.id;
  }
  if(type==='edition.release'){
   if(e.status!=='reviewed'||e.editorIds.includes(a.id)||e.draft.articles.some(x=>x.actorId===a.id))fail('Only a reviewed fictional edition may be released independently.');
   const text=[e.draft.intro,...e.draft.articles.map(x=>x.title+'\n'+x.text)].join('\n\n');
   e.release={title:e.draft.title,text,version:e.version,active:true,at,actorId:a.id};e.status='released-fictional';stamp(e,a,at,type);return e.id;
  }
  if(type==='edition.withdraw'){
   if(!e.release?.active)clash('No active edition release.');
   e.release.active=false;e.release.withdrawnAt=at;e.release.withdrawnBy=a.id;e.status='withdrawn-fictional';stamp(e,a,at,type,{reason:txt(d.reason,'withdrawal reason',500)});return e.id;
  }
 }
 if(type==='partnership.propose'){
  if(d.acknowledged!==true)bad('Acknowledge this is an internal proposal only, not consent by another party.');
  const reviewDate=day(d.reviewDate);if(reviewDate<at.slice(0,10))bad('Choose a current or future review date.');
  if(!Number.isSafeInteger(d.costCents)||d.costCents<0||d.costCents>1000000000)bad('Use non-negative whole AUD cents.');
  const project=d.projectId?s.projects.find(p=>p.id===d.projectId&&p.groupId===c.groupId&&can(s,a,'project.view','group',p.groupId,n)):null;
  if(d.projectId&&!project)fail('Choose an authorised existing project.');
  const p={id:uid(),committeeId:c.id,partner:txt(d.partner,'proposed partner name',120),work:txt(d.work,'proposed scope of work',1500),retained:txt(d.retained,'retained responsibilities',1500),reviewDate,costCents:d.costCents,projectId:project?.id||null,createdBy:a.id,createdAt:at,status:'proposed',version:1,history:[]};r.partnerships.push(p);return p.id;
 }
 if(type.startsWith('partnership.')){
  const p=find(r.partnerships,d.id,c);version(p,d);
  if(type==='partnership.review'){
   if(p.status!=='proposed'||p.createdBy===a.id)fail('An independent reviewer must review the proposal.');
   if(!['review','decline'].includes(d.outcome))bad('Choose review or decline.');
   p.reviewReason=review(d);p.reviewedBy=a.id;p.status=d.outcome==='review'?'reviewed':'declined';stamp(p,a,at,type,{reason:p.reviewReason});return p.id;
  }
  if(type==='partnership.authorise'){
   if(p.status!=='reviewed'||p.createdBy===a.id||p.reviewDate<at.slice(0,10))fail('An independent current reviewed proposal is required.');
   const motion=motionFor(g,c,d,p);p.authority={meetingId:d.meetingId,motionId:motion.id,at,actorId:a.id};p.status='authorised-fictional';stamp(p,a,at,type);return p.id;
  }
  if(type==='partnership.accept'){
   if(p.status!=='authorised-fictional'||p.reviewDate<at.slice(0,10)||d.fictionalConsent!==true||a.id===p.createdBy)fail('Record only explicitly fictional acceptance of current rehearsal authority.');
   p.acceptance={reference:txt(d.reference,'fictional acceptance evidence',500),at,actorId:a.id};p.status='accepted-fictional';stamp(p,a,at,type);return p.id;
  }
  if(type==='partnership.revoke'){
   if(!['authorised-fictional','accepted-fictional'].includes(p.status))clash('No active fictional authority.');
   p.status='revoked-fictional';stamp(p,a,at,type,{reason:txt(d.reason,'revocation reason',500)});return p.id;
  }
 }
 fail();
}
