import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { executeCommand, emptyState } from '../src/domain.mjs';
import { accessRegistry, scopedIdentity, legacyPersonAllowed, can, authorisedDomainActor, accessOverview, changeAccess } from '../src/scoped-access.mjs';
import { authorisedProjection } from '../src/scoped-projection.mjs';
import { createShowcaseState, fixtureActor, fixtureProjection, fixtureOverview, previewRoles, realWebmasterPreview } from '../src/webmaster-preview.mjs';
import { prepareAccessMigration } from '../src/access-migration.mjs';
import { resolvePilotActor } from '../src/pilot-auth.mjs';
import { api } from '../src/http.mjs';
globalThis.crypto ??= webcrypto;
const when = new Date('2026-11-25T01:00:00.000Z');
const issuer = 'https://fictional-showcase.cloudflareaccess.com';
const claims = sub => ({iss:issuer,sub,type:'app',email:'owner@example.invalid'});
const command = (state,type,data,id=crypto.randomUUID())=>({id,revision:state.revision,type,data});
const apply = (state,actor,type,data,id)=>{const cmd=command(state,type,data,id);return executeCommand(state,authorisedDomainActor(state,actor,cmd,when),cmd,when,{mode:'live'}).state;};
const denied = error=>error.status===403;

test('distinct scoped accounts and aliases, revoked identity cannot fall back to legacy organiser',()=>{
  const state=createShowcaseState();
  const a=fixtureActor(state,'chair'), b=fixtureActor(state,'secretary');
  assert.notEqual(a.id,b.id);
  const account=state.accessControl.accounts.find(row=>row.id===a.accountId);
  account.identities.push({issuer,subject:'second-chair-alias'});
  assert.equal(scopedIdentity(state,claims('second-chair-alias')).actor.id,a.id);
  assert.equal(scopedIdentity(state,{...claims('second-chair-alias'),type:'org'}).actor,null);
  account.status='disabled';
  assert.deepEqual(scopedIdentity(state,claims('second-chair-alias')),{managed:true,actor:null});
  assert.equal(legacyPersonAllowed(state,a.id),false);
  assert.equal(resolvePilotActor(state,claims('second-chair-alias'),{PILOT_SCOPED_ACCESS:'enabled',PILOT_ORGANISER_EMAILS:'["owner@example.invalid"]'}),null);
  state.accessControl.accounts.find(row=>row.id===b.accountId).identities.push({issuer,subject:'second-chair-alias'});
  assert.throws(()=>accessRegistry(state),error=>error.status===503);
});

test('scope controls bootstrap, exports, receipts and raw constitution history',()=>{
  const state=createShowcaseState(), actor=fixtureActor(state,'secretary');
  state.people.find(row=>row.id==='person-3').directoryConsent=true;
  const p=authorisedProjection(state,actor,'live',true,when);
  assert.deepEqual(p.groups.map(row=>row.id),['group-1']);
  assert.deepEqual(p.constitutions.map(row=>row.id),['constitution-1']);
  assert.equal(p.projects.some(row=>row.id==='project-other'),false);
  assert.equal(p.people.some(row=>row.id==='person-3'),false);
  assert.equal(p.financialContributions.length,0);
  const text=JSON.stringify(p);
  for(const secret of ['FICTIONAL-OTHER-SCOPE-ONLY','subject-secretary','fictional-showcase.cloudflareaccess.com','Fictional second circle charter'])assert.equal(text.includes(secret),false);
  const treasurer=authorisedProjection(state,fixtureActor(state,'treasurer'),'live',true,when);
  assert.deepEqual(treasurer.financialContributions.map(row=>row.id),['receipt-example']);
  assert.equal(treasurer.constitutions.length,0);
  const owner=authorisedProjection(state,fixtureActor(state,'webmaster'),'live',true,when);
  assert.equal(owner.financialContributions.length,0);
  assert.equal(owner.constitutions.length,0);
  const access=accessOverview(state,fixtureActor(state,'webmaster'),when);
  assert.equal(JSON.stringify(access).includes('subject-chair'),false);
  assert.equal(JSON.stringify(access).includes('FICTIONAL-RECEIPT-ONLY'),false);
  assert.throws(()=>accessOverview(state,actor,when),denied);
});

test('actual domain commands: direct group join, cross-scope task and constitution edits denied; authorised task persists',()=>{
  let state=createShowcaseState();
  const actor=fixtureActor(state,'member');
  for(const [type,data] of [
    ['group.join',{groupId:'group-2'}],['task.add',{projectId:'project-other',title:'Hidden'}],
    ['constitution.comment',{constitutionId:'constitution-2',proposalId:'unknown',text:'Hidden'}],
    ['person.create',{name:'No',email:'no@example.invalid'}],['membership.apply',{acknowledged:true}],
    ['constitution.adopt',{constitutionId:'constitution-1'}],['financial.log',{projectId:'project-1',personId:'person-3'}],
  ])assert.throws(()=>apply(state,actor,type,data),denied);
  const before=state.projects[0].tasks.length;
  state=apply(state,actor,'task.add',{projectId:'project-1',title:'Fictional allowed task'},'task-allowed-001');
  assert.equal(state.projects[0].tasks.length,before+1);
  assert.equal(state.projects[0].tasks.at(-1).assigneeId,actor.id);
  assert.equal(state.activity.at(-1).actorId,actor.id);
  assert.equal(state.revision,1);
  const replay={id:'task-allowed-001',revision:0,type:'task.add',data:{projectId:'project-1',title:'Fictional allowed task'}};
  assert.equal(executeCommand(state,authorisedDomainActor(state,actor,replay,when),replay,when).result.replayed,true);
  state.accessControl.grants.find(row=>row.id==='grant-member-group-1').status='revoked';
  assert.throws(()=>authorisedDomainActor(state,actor,replay,when),denied);
});

test('independent constitution merge preserves versions and actual actor; webmaster and author cannot review',()=>{
  let state=createShowcaseState();
  const author=fixtureActor(state,'member'), reviewer=fixtureActor(state,'secretary'), webmaster=fixtureActor(state,'webmaster');
  const draft=state.constitutions[0], clause=draft.clauses[0];
  state=apply(state,author,'constitution.propose',{constitutionId:draft.id,clauseId:clause.id,baseVersion:clause.version,title:'Fictional amendment',body:'Fictional revised wording.',reason:'For the isolated test.'});
  const proposal=state.constitutions[0].proposals.at(-1), data={constitutionId:draft.id,proposalId:proposal.id,status:'accepted',reason:'Independent fictional review.'};
  assert.throws(()=>apply(state,author,'constitution.review',data),denied);
  assert.throws(()=>apply(state,webmaster,'constitution.review',data),denied);
  state=apply(state,reviewer,'constitution.review',data);
  assert.equal(state.constitutions[0].clauses[0].body,'Fictional revised wording.');
  assert.equal(state.constitutions[0].clauses[0].history.at(-1).body,clause.body);
  assert.equal(state.constitutions[0].proposals.at(-1).reviewedBy,reviewer.id);
  assert.equal(state.constitutions[0].status,'draft');
});

test('treasurer has exact receipt authority, not other scope or own receipt',()=>{
  let state=createShowcaseState();
  const actor=fixtureActor(state,'treasurer');
  const payload={contributionId:'receipt-example',status:'verified',reason:'Fictional settled receipt.',settled:true};
  assert.throws(()=>apply(state,actor,'financial.review',{...payload,contributionId:'receipt-other'}),denied);
  assert.throws(()=>apply(state,fixtureActor(state,'webmaster'),'financial.review',payload),denied);
  const own=structuredClone(state);own.financialContributions[0].personId=actor.id;
  assert.throws(()=>apply(own,actor,'financial.review',payload),denied);
  state=apply(state,actor,'financial.review',payload);
  assert.equal(state.financialContributions[0].status,'verified');
  assert.equal(state.financialContributions[0].verifierId,actor.id);
  assert.equal(state.financialContributions[1].status,'pending');
});

test('time bounds and delegated parent revocation are enforced; no scope escalation',()=>{
  const state=createShowcaseState(), chair=fixtureActor(state,'chair'), deputy=fixtureActor(state,'deputy');
  const parent=state.accessControl.grants.find(row=>row.id==='grant-chair-group-1');
  const child=state.accessControl.grants.find(row=>row.id==='grant-deputy-group-1');
  parent.permissions.push('scope.delegate');
  child.delegatedFrom=parent.id;
  child.startsAt='2026-11-25T00:00:00.000Z'; child.endsAt='2026-11-25T02:00:00.000Z';
  assert.equal(can(state,deputy,'task.add','group','group-1',when),true);
  assert.equal(can(state,deputy,'task.add','group','group-1',new Date(child.endsAt)),false);
  assert.equal(can(state,deputy,'task.add','group','group-2',when),false);
  parent.status='revoked';
  assert.equal(can(state,deputy,'task.add','group','group-1',when),false);
  assert.equal(can(state,chair,'task.add','group','group-1',when),false);
  child.permissions.push('financial.review');
  assert.throws(()=>accessRegistry(state),error=>error.status===503);
});

test('technical custody reserves, cancels and revokes with immutable actor audit and replay protection',()=>{
  let state=createShowcaseState(), webmaster=fixtureActor(state,'webmaster'), member=fixtureActor(state,'member');
  const reserve=command(state,'access.reserve',{role:'chair',scope:{kind:'group',id:'group-2'},reason:'Fictional planning only.'},'access-reservation-001');
  assert.throws(()=>changeAccess(state,member,reserve,when),denied);
  state=changeAccess(state,webmaster,reserve,when).state;
  const row=state.accessControl.reservations.at(-1);
  assert.equal(row.status,'reserved');assert.equal(row.accountId,undefined);
  assert.equal(state.accessControl.accounts.length,previewRoles.length);
  assert.equal(changeAccess(state,webmaster,reserve,when).result.replayed,true);
  assert.equal(state.accessControl.audit.at(-1).actorId,webmaster.id);
  state=changeAccess(state,webmaster,command(state,'access.cancel-reservation',{id:row.id,reason:'Fictional cancellation.'}),when).state;
  assert.equal(state.accessControl.reservations.at(-1).status,'cancelled');
  state=changeAccess(state,webmaster,command(state,'access.revoke-grant',{id:'grant-member-group-1',reason:'Fictional removal.'}),when).state;
  assert.equal(can(state,member,'task.add','group','group-1',when),false);
  assert.throws(()=>changeAccess(state,webmaster,command(state,'access.disable-account',{id:webmaster.accountId,reason:'No self lockout.'}),when),denied);
  assert.throws(()=>changeAccess(state,webmaster,command(state,'access.grant',{id:'anything',reason:'No activation.'}),when),denied);
});

test('offline migration preserves legacy owner and all unrelated records without writing',()=>{
  const fixture=createShowcaseState(), registry=fixture.accessControl;
  delete fixture.accessControl;
  fixture.people.push({id:'pilot-organiser',name:'Existing owner',role:'organiser',email:'owner@example.invalid'});
  const original=structuredClone(fixture);
  const result=prepareAccessMigration(fixture,registry,when);
  assert.deepEqual(fixture,original);
  assert.equal(result.expectedRevision,original.revision);
  assert.equal(result.activation,'not-authorised');
  assert.equal(result.legacyOwnerPreserved,true);
  for(const key of Object.keys(original))assert.deepEqual(result.snapshot[key],original[key]);
  assert.equal(resolvePilotActor(result.snapshot,claims('legacy-alias'),{PILOT_ORGANISER_EMAILS:'["owner@example.invalid"]'}).id,'pilot-organiser');
});

test('all ten fixture views are isolated, read-only and never access the supplied live state',()=>{
  const live=createShowcaseState(), webmaster=fixtureActor(live,'webmaster');
  live.projects[0].title='LIVE PRIVATE SENTINEL';
  for(const role of previewRoles){
    const p=realWebmasterPreview(live,webmaster,role,new URLSearchParams(),when);
    assert.equal(p.readOnly,true);assert.equal(p.fictional,true);assert.equal(p.previewRole,role);
    assert.equal(p.public.sampleData,true);assert.equal(JSON.stringify(p).includes('LIVE PRIVATE SENTINEL'),false);
    assert.deepEqual(p,fixtureProjection(role));
  }
  assert.throws(()=>realWebmasterPreview(live,fixtureActor(live,'member'),'webmaster',new URLSearchParams(),when),denied);
  assert.throws(()=>fixtureProjection('organiser'),error=>error.status===400);
  assert.equal(fixtureOverview().readOnly,true);
});

test('shared HTTP routes enforce scope, CAS, same origin, live admission and preview read-only',async()=>{
  let state=createShowcaseState(), writes=0, failWrite=false;
  const store={read:async()=>structuredClone(state),compareAndSwap:async(revision,next)=>{if(failWrite||revision!==state.revision)return false;state=structuredClone(next);writes++;return true;}};
  const origin='https://workspace.example.invalid';
  const call=async(role,path,data,wrongOrigin=false)=>{
    const request=new Request(origin+path,data?{method:'POST',headers:{'Content-Type':'application/json',Origin:wrongOrigin?'https://other.example.invalid':origin},body:JSON.stringify(data)}:{});
    return api(request,{store,getActor:async(_req,s)=>role?fixtureActor(s,role):null,mode:'live',workspace:true});
  };
  assert.equal((await call(null,'/api/access')).status,401);
  assert.equal((await call('member','/api/access')).status,403);
  assert.equal((await call('member','/api/access/preview?role=webmaster')).status,403);
  assert.equal((await call('webmaster','/api/access/preview?role=chair',{role:'chair'})).status,403);
  assert.equal((await call('member','/api/commands',command(state,'group.join',{groupId:'group-2'}))).status,403);
  assert.equal((await call('member','/api/commands',command(state,'membership.apply',{acknowledged:true}))).status,403);
  const p=await (await call('treasurer','/api/export')).json();
  assert.deepEqual(p.financialContributions.map(row=>row.id),['receipt-example']);
  assert.equal(writes,0);
  const allowed=command(state,'task.add',{projectId:'project-1',title:'Fictional via HTTP'});
  assert.equal((await call('member','/api/commands',allowed,true)).status,403);
  failWrite=true;assert.equal((await call('member','/api/commands',allowed)).status,409);
  failWrite=false;assert.equal((await call('member','/api/commands',allowed)).status,200);
  assert.equal(writes,1);
  assert.equal((await call('member','/api/commands',allowed)).status,200);
  assert.equal(writes,1);
  const reserve=command(state,'access.reserve',{role:'chair',scope:{kind:'group',id:'group-2'},reason:'Fictional HTTP reservation.'});
  assert.equal((await call('webmaster','/api/access',reserve)).status,200);
  assert.equal(writes,2);
  assert.equal((await (await call('webmaster','/api/access')).json()).reservations.at(-1).status,'reserved');
});
