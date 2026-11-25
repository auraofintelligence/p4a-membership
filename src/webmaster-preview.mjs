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
      const committeeRead=['committee.view','committee.task.own','committee.notice.read','committee.motion.write','committee.library.view'];
      const vote=[...committeeRead,'committee.vote.rehearsal'];
      const committeePermissions=role==='member'?['committee.minutes.released','committee.library.released']:role==='reviewer'?[...committeeRead,'committee.minutes.review','committee.office.review','committee.finance.view','committee.finance.review','committee.library.review']:role==='chair'?[...vote,'committee.meeting.manage','committee.attendance','committee.minutes.review','committee.office.review','committee.finance.view','committee.finance.review','committee.library.review']:['secretary','assistant-secretary'].includes(role)?[...vote,'committee.meeting.manage','committee.attendance','committee.minutes.write','committee.task.assign','committee.notice.write','committee.office.plan','committee.library.write']:role==='treasurer'?[...vote,'committee.finance.view','committee.finance.write']:vote;
      grant(role,'committee','committee-1',committeePermissions);
      if (role !== 'treasurer') grant(role,'constitution','constitution-1',['secretary','reviewer'].includes(role) ? [...draftRead,'constitution.review'] : draftRead);
      if (role !== 'member') access.reservations.push({id:'reservation-'+role,role,scope:{kind:'group',id:'group-1'},status:'reserved',createdBy:'fixture-webmaster',createdAt:date});
    }
  }
  state.governance.operations={handovers:[],budgets:[],expenses:[],reconciliations:[],documents:[{id:'fictional-paper',committeeId:'committee-1',title:'Fictional planning paper',kind:'working-paper',classification:'working',version:1,status:'draft',createdBy:'fixture-secretary',createdAt:date,updatedBy:'fixture-secretary',updatedAt:date,access:[],history:[],versions:[{version:1,body:'Fictional example of a working committee document. No actual records are used.',sourceDate:'2026-11-07',sourceNote:'Synthetic fixture only',actorId:'fixture-secretary',at:date}]}]};
  return state;
}
export function fixtureActor(state, role) {
  if (!previewRoles.includes(role)) throw new AppError('Choose a fictional role.',400);
  const result = scopedIdentity(state,{iss:fixtureIssuer,sub:'subject-'+role,type:'app'});
  if (!result.actor) throw new AppError('Fictional access is unavailable.',503);
  return result.actor;
}
export function fixtureProjection(role) {
  const state = createShowcaseState();
  const actor = fixtureActor(state,role);
  const projection = authorisedProjection(state,actor,'showcase',false);
  return {...projection,public:{...projection.public,sampleData:true},readOnly:true,fictional:true,previewRole:role};
}
export function fixtureOverview() {
  const state = createShowcaseState();
  return {...accessOverview(state,fixtureActor(state,'webmaster')),readOnly:true,fictional:true};
}
export function fixtureView(role, params) {
  if (!previewRoles.includes(role)) throw new AppError('Choose a fictional role.',400);
  const view = params.get('view');
  if (!view || view === 'workspace') return fixtureProjection(role);
  const state = createShowcaseState();
  if (view === 'committee-document') return {...committeeDocument(state,fixtureActor(state,role),params.get('committee'),params.get('id'),Number(params.get('version')),new Date(),'showcase'),readOnly:true};
  if (view === 'committee') return {...committeeProjection(state,fixtureActor(state,role),params.get('id'),new Date(),'showcase'),readOnly:true};
  if (view === 'public') return {...publicProjection(state,'showcase'),sampleData:true};
  if (view === 'gamify') return {...gamifyProjection(state,{period:params.get('period') ?? 'all',groupId:params.get('groupId') ?? '',projectId:params.get('projectId') ?? ''},'showcase'),sampleData:true};
  throw new AppError('This preview route is not available.',403);
}
export function realWebmasterPreview(state,actor,role,params,now = new Date()) {
  if (!can(state,actor,'access.view','system','p4a',now)) throw new AppError('Webmaster access is required.',403);
  return fixtureView(role,params);
}
