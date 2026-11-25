import { createDemoState } from './seed.mjs';
import { createConstitution, publicProjection, gamifyProjection } from './domain.mjs';
import { AppError } from './errors.mjs';
import { accessOverview, can, scopedIdentity } from './scoped-access.mjs';
import { authorisedProjection } from './scoped-projection.mjs';
import { committeeProjection, committeeDocument } from './committee-governance.mjs';

const fixtureIssuer = 'https://fictional-showcase.cloudflareaccess.com';
export const previewRoles = Object.freeze(['webmaster','chair','deputy','secretary','assistant-secretary','treasurer','committee','reviewer','member','applicant']);
const projectRead = ['group.view','project.view'];
const collaboration = [...projectRead,'project.create','project.join','task.add','task.toggle','comment.add'];
const draftRead = ['constitution.view','constitution.propose','constitution.comment','constitution.withdraw'];
const groupPermissions = {
  chair: [...collaboration,'project.priority','project.status'], deputy:collaboration, secretary:collaboration,
  'assistant-secretary':collaboration, committee:collaboration,
  member:[...collaboration,'group.join','group.leave','project.priority','project.status','contribution.log','financial.log'],
  treasurer:[...projectRead,'financial.view','financial.log','financial.review','financial.refund','financial.revoke','contribution.view','contribution.review','contribution.revoke'],
  reviewer:[...projectRead,'contribution.view','contribution.review','contribution.revoke'],
};
export function createShowcaseState() {
  const state = createDemoState();
  const date = '2026-11-07T00:00:00.000Z';
  state.constitutions.push(createConstitution({id:'constitution-2',title:'Fictional second circle charter',scope:'local-charter',actorId:'person-3',at:date}));
  state.projects.push({...structuredClone(state.projects[0]),id:'project-other',groupId:'group-2',title:'Fictional other-scope project',ownerId:'person-3',participantIds:['person-3'],tasks:[],comments:[],public:false});
  state.financialContributions.push({id:'receipt-example',personId:'person-1',createdBy:'person-1',projectId:'project-1',amountCents:1000,currency:'AUD',category:'project-funding',date:'2026-11-06',reference:'FICTIONAL-RECEIPT-ONLY',description:'Fictional receipt awaiting independent review.',status:'pending',publicConsent:false,namedConsent:false,refunds:[],history:[]});
  state.financialContributions.push({...structuredClone(state.financialContributions[0]),id:'receipt-other',personId:'person-3',createdBy:'person-3',projectId:'project-other',reference:'FICTIONAL-OTHER-SCOPE-ONLY'});
  const seats=['chair','deputy','secretary','assistant-secretary','treasurer','committee'];
  const committee=(id,name,groupId)=>({id,name,kind:'local',status:'proposed',groupId,offices:seats.map(role=>({role,status:'vacant',personId:null,term:null,authorityRef:null})),createdBy:'fixture-secretary',createdAt:date,rehearsalRule:{quorum:3,reference:'fictional-only-rule-v1'}});
  state.governance={version:1,committees:[committee('committee-1','Fictional neighbourhood committee','group-1'),committee('committee-2','Fictional independent committee','group-2')],meetings:[],actions:[],notices:[],audit:[],receipts:[]};
  const cm=state.governance.committees[0];
  cm.offices=seats.map(role=>({role,status:'fictional',personId:'fixture-'+role,term:{startsAt:'2020-01-01T00:00:00.000Z',endsAt:'2100-01-01T00:00:00.000Z'},authorityRef:'fictional-fixture-only'}));
  state.governance.meetings.push({id:'fixture-meeting',committeeId:cm.id,title:'Fictional committee planning meeting',kind:'formation',date:'2026-11-24',time:'10:00',location:'Example room',status:'scheduled',version:1,agenda:[{id:'fixture-agenda',title:'Constitution and shared project discussion',notes:'Fictional agenda only.',motions:[]}],attendance:{present:[],apologies:[],recused:[],conflicts:''},minutes:{status:'draft',text:'',version:0,history:[]},createdBy:'fixture-secretary',createdAt:date,history:[]});
  const access = state.accessControl = {version:1,accounts:[],grants:[],reservations:[],audit:[],receipts:[]};
  const grant = (role,kind,id,permissions) => access.grants.push({
    id:'grant-'+role+'-'+id, accountId:'account-'+role, role, scope:{kind,id}, permissions:[...permissions],
    status:'active', startsAt:'2020-01-01T00:00:00.000Z', endsAt:'2100-01-01T00:00:00.000Z',authorityRef:'fictional-fixture-only',
  });
  for (const role of previewRoles) {
    const id = 'fixture-'+role;
    state.people.push({id,name:'Fictional '+role,email:role+'@example.invalid',place:'Example neighbourhood',skills:'',interests:'',directoryConsent:false,contactConsent:false,role:'member'});
    access.accounts.push({id:'account-'+role,personId:id,identities:[{subject:'subject-'+role,issuer:fixtureIssuer}],status:'active'});
    if (role === 'webmaster') grant(role,'system','p4a',['access.view','access.reserve','access.revoke']);
    else if (role === 'applicant') grant(role,'person',id,['application.own']);
    else {
      state.groups[0].memberIds.push(id);
      if (role !== 'treasurer') state.projects[0].participantIds.push(id);
      grant(role,'group','group-1',['chair','secretary'].includes(role)?[...groupPermissions[role],'committee.propose']:groupPermissions[role]);
      const committeeRead=['committee.view','committee.task.own','committee.notice.read','committee.motion.write','committee.library.view','committee.edition.contribute'];
      const vote=[...committeeRead,'committee.vote.rehearsal'];
      const committeePermissions=role==='member'?['committee.minutes.released','committee.library.released','committee.edition.released']:role==='reviewer'?[...committeeRead,'committee.minutes.review','committee.office.review','committee.finance.view','committee.finance.review','committee.library.review','committee.edition.review','committee.partnership.review']:role==='chair'?[...vote,'committee.meeting.manage','committee.attendance','committee.minutes.review','committee.office.review','committee.finance.view','committee.finance.review','committee.library.review','committee.edition.review','committee.partnership.review']:['secretary','assistant-secretary'].includes(role)?[...vote,'committee.meeting.manage','committee.attendance','committee.minutes.write','committee.task.assign','committee.notice.write','committee.office.plan','committee.library.write','committee.edition.edit','committee.partnership.propose']:role==='treasurer'?[...vote,'committee.finance.view','committee.finance.write']:vote;
      grant(role,'committee','committee-1',committeePermissions);
      if (role !== 'treasurer') grant(role,'constitution','constitution-1',role==='secretary'?[...draftRead,'constitution.review','constitution.structure']:role==='reviewer'?[...draftRead,'constitution.review']:role==='chair'?[...draftRead,'constitution.structure']:draftRead);
      if (role !== 'member') access.reservations.push({id:'reservation-'+role,role,scope:{kind:'group',id:'group-1'},status:'reserved',createdBy:'fixture-webmaster',createdAt:date});
    }
  }
  state.governance.operations={handovers:[],budgets:[],expenses:[],reconciliations:[],documents:[{id:'fictional-paper',committeeId:'committee-1',title:'Fictional planning paper',kind:'working-paper',classification:'working',version:1,status:'draft',createdBy:'fixture-secretary',createdAt:date,updatedBy:'fixture-secretary',updatedAt:date,access:[],history:[],versions:[{version:1,body:'Fictional example of a working committee document. No actual records are used.',sourceDate:'2026-11-07',sourceNote:'Synthetic fixture only',actorId:'fixture-secretary',at:date}]}]};
  return state;
}

// A connected, read-only walkthrough is built afresh for every preview request.
// The small policy seed above remains useful for isolated command tests. These
// examples never seed, read or write the owner's working register.
export function createWorkspaceDemoState(now = new Date()) {
  const state = createShowcaseState();
  const today = new Date(now.getTime()+10*60*60*1000).toISOString().slice(0,10);
  const day = offset => new Date(Date.parse(today+'T00:00:00Z')+offset*86400000).toISOString().slice(0,10);
  const at = offset => day(offset)+'T02:00:00.000Z';
  const createdAt = at(-14), updatedAt = at(-1), committeeId = 'committee-1';
  const names = {webmaster:'Alex Morgan',chair:'Jamie Park',deputy:'Morgan Lee',secretary:'Taylor Reed','assistant-secretary':'Riley Chen',treasurer:'Charlie Lane',committee:'Jordan West',reviewer:'Avery Bell',member:'Casey Brooks',applicant:'Robin Ellis'};
  for (const role of previewRoles) {
    const person = state.people.find(p=>p.id==='fixture-'+role);
    person.name = names[role]+' (example)';
  }
  Object.assign(state.constitutions.find(d=>d.id==='constitution-1'),{title:'Neighbourhood circle local charter',scope:'local-charter',groupId:'group-1'});
  const g = state.governance;
  const next = g.meetings[0];
  Object.assign(next,{title:'Neighbourhood planning evening',kind:'committee',date:day(7),time:'18:00',location:'Example community room · Brisbane time',createdAt,history:[{version:1,actorId:'fixture-secretary',at:createdAt,action:'meeting.schedule'}]});
  next.agenda = [
    {id:'fixture-agenda-welcome',title:'Welcome, access needs and conflicts',notes:'Check everyone can take part and confirm any matters needing a different reviewer.',motions:[]},
    {id:'fixture-agenda',title:'Everyday bills: agree the next useful step',notes:'Review the sample guide and the questions collected by the project group.',motions:[{id:'fixture-motion-guide',text:'Prepare a plain-language sample bill guide for independent review before sharing it.',authorId:'fixture-chair',version:1,projectId:'project-1',constitutionId:null,constitutionVersion:null,history:[]}]},
    {id:'fixture-agenda-resources',title:'Meeting resources and draft budget',notes:'Review the room, printing and accessible-material estimates in the Treasurer desk.',motions:[]},
    {id:'fixture-agenda-followup',title:'Owners, dates and next meeting',notes:'Check the shared duties and agree the next proposed meeting date.',motions:[]},
  ];
  g.meetings.push({
    id:'fixture-meeting-previous',committeeId,title:'Getting the local projects ready',kind:'committee',date:day(-7),time:'18:00',location:'Example community room',status:'closed',version:4,
    agenda:[{id:'fixture-previous-agenda',title:'Project priorities and practical next steps',notes:'The group discussed a sample bill guide and accessible meeting material.',motions:[]}],
    attendance:{present:['fixture-chair','fixture-deputy','fixture-secretary','fixture-treasurer','fixture-committee'],apologies:['fixture-assistant-secretary'],recused:[],conflicts:'No conflicts declared in this fictional discussion.'},
    minutes:{status:'reviewed',text:'The group discussed using sample household bills, keeping personal documents with their owners, and preparing accessible meeting papers. Follow-ups were assigned to the existing shared project. The Treasurer will bring a draft resource budget to the next meeting. This is a fictional working record; no formal vote or external commitment was made.',version:2,editedBy:'fixture-secretary',editedAt:at(-6),editorIds:['fixture-secretary'],reviewedBy:'fixture-chair',reviewedAt:at(-5),reviewReason:'The example notes accurately separate discussion, assigned follow-ups and matters still to review.',history:[{version:1,text:'Draft notes from the fictional project discussion.',editedBy:'fixture-secretary',at:at(-7)}],released:{active:true,version:2,text:'Example member update: the local circle is preparing a sample bill guide and accessible meeting papers. The next planning evening will review the draft material.',at:at(-5),actorId:'fixture-chair'}},
    createdBy:'fixture-secretary',createdAt:at(-14),history:[{version:1,actorId:'fixture-secretary',at:at(-14),action:'meeting.schedule'},{version:4,actorId:'fixture-chair',at:at(-7),action:'meeting.close'}],
  });
  const duties = [
    ['agenda','chair','Review the agenda and discussion questions',2,null,false],
    ['access','deputy','Gather accessibility questions for the sample guide',3,'project-1',false],
    ['papers','secretary','Collate the sample bill guide and meeting papers',4,'project-1',false],
    ['edition','assistant-secretary','Prepare the next neighbourhood update',3,null,false],
    ['receipts','treasurer','Check the recorded expenses and draft reconciliation',4,null,false],
    ['guide','committee','Try the guide with fictional sample bills',2,'project-1',false],
    ['review','reviewer','Review the assembled neighbourhood edition',4,null,false],
    ['welcome','secretary','Prepare a plain-language welcome note',-3,null,true],
  ];
  g.actions = duties.map(([key,role,title,offset,projectId,done])=>{
    const id='fixture-duty-'+key, ownerId='fixture-'+role;
    if (projectId) state.projects.find(p=>p.id===projectId).tasks.push({id,title,done,assigneeId:ownerId});
    return {id,committeeId,meetingId:'fixture-meeting-previous',motionId:null,projectId,ownerId,title,details:'Fictional follow-up from the local project discussion. Open the linked desk or project for the working material.',dueDate:day(offset),createdBy:'fixture-secretary',createdAt:at(-7),acknowledgedAt:key==='agenda'?null:at(-6),history:[],basis:'working-follow-up',...(projectId?{}:{done}),...(done?{completedBy:ownerId,completedAt:at(-3)}:{})};
  });
  const notice = (id,kind,sourceId,title,ownerId=null,updatedBy='fixture-secretary')=>({id,committeeId,kind,sourceId,title,ownerId,version:1,reads:[],reviews:[],retracted:false,createdAt:updatedAt,updatedAt,updatedBy});
  g.notices = [
    notice('fixture-notice-meeting','meeting',next.id,'Next planning evening: agenda and papers are ready to explore'),
    notice('fixture-notice-review','info','fixture-edition-review','Neighbourhood update is ready for independent review',null,'fixture-assistant-secretary'),
    ...g.actions.map(a=>notice('fixture-notice-'+a.id,'task',a.id,a.title,a.ownerId,a.ownerId==='fixture-secretary'?'fixture-assistant-secretary':'fixture-secretary')),
  ];
  const receipt = state.financialContributions.find(r=>r.id==='receipt-example');
  Object.assign(receipt,{date:day(-12),amountCents:24000,description:'Fictional settled contribution towards the local sample-guide project.',status:'verified',settled:true,verifierId:'fixture-treasurer',verifiedAt:at(-11),reviewReason:'Synthetic source and settlement example only.'});
  const budget = {id:'fixture-budget',committeeId,title:'Next planning evening resources',start:day(0),end:day(30),lines:[{label:'Example room hire',amountCents:8000},{label:'Plain-language handouts',amountCents:4000},{label:'Accessible materials',amountCents:6000}],reviewLimitCents:20000,basis:'Illustrative estimates for one local planning evening. The draft needs an independent review; no spending is authorised.',status:'draft',version:1,createdBy:'fixture-treasurer',createdAt:updatedAt,updatedBy:'fixture-treasurer',updatedAt,history:[]};
  const reviewedExpense = {id:'fixture-expense-print',committeeId,date:day(-9),amountCents:3500,reference:'EXAMPLE-PRINT-001',description:'Example printing for the sample bill guide',payeeId:'fixture-secretary',status:'reviewed',version:2,createdBy:'fixture-treasurer',createdAt:at(-9),updatedBy:'fixture-treasurer',updatedAt:at(-9),reviewedBy:'fixture-chair',reviewedAt:at(-8),reviewReason:'Fictional receipt and amount checked independently.',history:[{version:2,actorId:'fixture-chair',at:at(-8),action:'expense.review'}]};
  const pendingExpense = {id:'fixture-expense-materials',committeeId,date:day(-2),amountCents:1800,reference:'EXAMPLE-MATERIALS-002',description:'Example accessible handout materials',payeeId:'fixture-assistant-secretary',status:'pending',version:1,createdBy:'fixture-treasurer',createdAt:at(-2),updatedBy:'fixture-treasurer',updatedAt:at(-2),history:[]};
  const sources = {received:[{id:receipt.id,date:receipt.date,projectId:receipt.projectId,amountCents:24000,personId:receipt.personId,createdBy:receipt.createdBy,verifiedBy:receipt.verifierId}],expenses:[{id:reviewedExpense.id,date:reviewedExpense.date,amountCents:3500,version:2,createdBy:reviewedExpense.createdBy,payeeId:reviewedExpense.payeeId,reviewedBy:reviewedExpense.reviewedBy}]};
  const reconciliation = {id:'fixture-reconciliation',committeeId,start:day(-14),end:day(-1),openingCents:0,statementClosingCents:20500,expectedClosingCents:20500,differenceCents:0,sources,basis:'Fictional statement: A$240 received, less A$35 independently reviewed printing, leaves A$205. The separate A$18 expense is still pending review.',status:'draft',version:1,createdBy:'fixture-treasurer',createdAt:updatedAt,history:[]};
  const document = (id,title,kind,body,extra={})=>({id,committeeId,title,kind,classification:'working',version:1,status:'draft',createdBy:'fixture-secretary',createdAt:updatedAt,updatedBy:'fixture-secretary',updatedAt,access:[],history:[],versions:[{version:1,body,sourceDate:day(-1),sourceNote:'Synthetic walkthrough material only.',actorId:'fixture-secretary',at:updatedAt}],...extra});
  g.operations = {
    handovers:[],budgets:[budget],expenses:[reviewedExpense,pendingExpense],reconciliations:[reconciliation],
    documents:[
      document('fictional-paper','Planning evening: agenda and working papers','working-paper','Purpose: agree a useful next step for the sample bill guide.\n\nBring: public sources, accessibility questions and the proposed resource budget.\n\nFollow-ups belong to the existing shared project. No personal household records are needed.',{meetingId:next.id}),
      document('fixture-constitution-note','Questions for the working constitution','constitution-note','Discussion prompts: how do local groups choose responsibilities, record conflicts, review spending and share member-safe summaries? These are questions for the existing working draft, not adopted rules.',{constitutionId:'constitution-1'}),
      document('fixture-minutes-paper','Previous meeting: reviewed working notes','minutes',g.meetings[1].minutes.text,{meetingId:'fixture-meeting-previous',status:'reviewed',reviewedBy:'fixture-chair'}),
      document('fixture-restricted-paper','Facilitation notes for independent review','working-paper','Fictional restricted example: check that discussion time is balanced, access needs can be raised privately, and the meeting summary separates suggestions from decisions.',{classification:'restricted',access:[{personId:'fixture-chair',status:'active',expiresAt:day(30)+'T23:59:59.000Z'},{personId:'fixture-reviewer',status:'active',expiresAt:day(30)+'T23:59:59.000Z'}]}),
      document('fixture-member-guide','Welcome to the neighbourhood circle','working-paper','Fictional welcome paper.',{status:'reviewed',reviewedBy:'fixture-chair',released:{active:true,version:1,text:'Example welcome: explore the shared projects, choose a contribution that suits you, and read the member updates. Public civic tools stay open to everyone.',at:at(-3),actorId:'fixture-chair'}}),
    ],
  };
  const month=today.slice(0,7), nextMonth=new Date(Date.UTC(Number(today.slice(0,4)),Number(today.slice(5,7)),1)).toISOString().slice(0,7);
  const contributions = [
    {id:'fixture-article-project',actorId:'fixture-committee',title:'A clearer starting point for everyday bills',text:'The example project team is checking a short guide using fictional bills and public sources. Bring a question, help review a source, or suggest a clearer explanation.',status:'submitted',version:1,history:[]},
    {id:'fixture-article-meeting',actorId:'fixture-assistant-secretary',title:'Make room for everyone at the planning evening',text:'The draft agenda includes time for access needs, project questions and clear follow-ups. Tell the organiser what helps you participate; private information stays out of the shared notes.',status:'submitted',version:1,history:[]},
  ];
  g.communications = {
    editions:[
      {id:'fixture-edition-review',committeeId,month,title:'Neighbourhood notes',status:'review',version:3,createdBy:'fixture-secretary',contributions,draft:{title:'Neighbourhood notes',intro:'An example update from the local working circle, ready for an independent check before any release.',articles:contributions.map(({id,version,title,text,actorId})=>({id,version,title,text,actorId}))},editorIds:['fixture-secretary'],history:[{version:3,actorId:'fixture-secretary',at:updatedAt,action:'edition.submit'}]},
      {id:'fixture-edition-draft',committeeId,month:nextMonth,title:'What we could try next',status:'draft',version:1,createdBy:'fixture-secretary',contributions:[{id:'fixture-article-next',actorId:'fixture-assistant-secretary',title:'Questions for the next update',text:'Collect one useful lesson from each shared project and a clear invitation for people who would like to help.',status:'draft',version:1,history:[]}],draft:null,editorIds:[],history:[]},
    ],
    partnerships:[{id:'fixture-partnership',committeeId,partner:'Example neighbourhood learning circle',work:'Explore one shared session using fictional sample bills and freely available civic resources.',retained:'Each group chooses its own participants and responsibilities. P4A retains review of its own material, costs and any future public wording.',reviewDate:day(21),costCents:0,projectId:'project-1',createdBy:'fixture-secretary',createdAt:updatedAt,status:'proposed',version:1,history:[]}],
  };
  state.activity = [{id:'fixture-activity-papers',type:'committee.library.create',actorId:'fixture-secretary',at:updatedAt,summary:'Example meeting papers prepared for the neighbourhood planning evening.'},{id:'fixture-activity-guide',type:'task.add',actorId:'fixture-secretary',at:at(-7),summary:'Example project follow-ups connected to committee duties.'}];
  return state;
}
export function fixtureActor(state, role) {
  if (!previewRoles.includes(role)) throw new AppError('Choose a fictional role.',400);
  const result = scopedIdentity(state,{iss:fixtureIssuer,sub:'subject-'+role,type:'app'});
  if (!result.actor) throw new AppError('Fictional access is unavailable.',503);
  return result.actor;
}
export function fixtureProjection(role, now = new Date()) {
  const state = createWorkspaceDemoState(now);
  const actor = fixtureActor(state,role);
  const projection = authorisedProjection(state,actor,'showcase',false,now);
  return {...projection,public:{...projection.public,sampleData:true},readOnly:true,fictional:true,previewRole:role};
}
export function fixtureOverview(now = new Date()) {
  const state = createWorkspaceDemoState(now);
  const overview = accessOverview(state,fixtureActor(state,'webmaster'),now);
  return {...overview,accounts:overview.accounts.map(a=>({...a,name:state.people.find(p=>p.id===a.personId)?.name})),readOnly:true,fictional:true};
}
export function fixtureView(role, params, now = new Date()) {
  if (!previewRoles.includes(role)) throw new AppError('Choose a fictional role.',400);
  const view = params.get('view');
  if (!view || view === 'workspace') return fixtureProjection(role,now);
  const state = createWorkspaceDemoState(now);
  if (view === 'access') { if(role!=='webmaster')throw new AppError('Choose the Webmaster perspective.',403); return fixtureOverview(now); }
  if (view === 'committee-document') return {...committeeDocument(state,fixtureActor(state,role),params.get('committee'),params.get('id'),Number(params.get('version')),now,'showcase'),readOnly:true};
  if (view === 'committee') return {...committeeProjection(state,fixtureActor(state,role),params.get('id'),now,'showcase'),readOnly:true};
  if (view === 'public') return {...publicProjection(state,'showcase'),sampleData:true};
  if (view === 'gamify') return {...gamifyProjection(state,{period:params.get('period') ?? 'all',groupId:params.get('groupId') ?? '',projectId:params.get('projectId') ?? ''},'showcase'),sampleData:true};
  throw new AppError('This preview route is not available.',403);
}
export function realWebmasterPreview(state,actor,role,params,now = new Date()) {
  if (!can(state,actor,'access.view','system','p4a',now)) throw new AppError('Webmaster access is required.',403);
  return fixtureView(role,params);
}
