import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { emptyState } from '../src/domain.mjs';
import { resolvePilotActor } from '../src/pilot-auth.mjs';
import { can, isPilotOwner } from '../src/scoped-access.mjs';
import { api } from '../src/http.mjs';
import { workspaceEntry, perspectivePath } from '../public/workspace-navigation.mjs';
globalThis.crypto??=webcrypto;

const owner={id:'pilot-organiser',name:'Example workspace owner',role:'organiser',email:'',place:'',skills:'',interests:'',directoryConsent:false,contactConsent:false};
const env={PILOT_ORGANISER_EMAILS:'["owner@example.invalid","alias@example.invalid"]'};
const claims={type:'app',sub:'owner-subject',iss:'https://example.cloudflareaccess.com',email:'owner@example.invalid'};
const origin='https://pilot.example.invalid';

test('extensionless and .html fictional entries cannot become the real workspace',()=>{
 for(const path of ['/webmaster-role-preview','/webmaster-role-preview.html','/webmaster-role-preview/']){
  assert.equal(workspaceEntry(path,'?role=secretary&view=fictional').role,'secretary');
  assert.equal(workspaceEntry(path,'').role,'webmaster');
 }
 for(const path of ['/webmaster','/webmaster.html']){
  assert.equal(workspaceEntry(path,'?view=fictional').role,'webmaster');
  assert.equal(workspaceEntry(path,'').role,null);
 }
 assert.equal(workspaceEntry('/index.html','?role=chair&view=fictional').role,null);
 assert.equal(perspectivePath('secretary',{owner:true}),'/webmaster-role-preview.html?role=secretary&view=fictional#committee/committee-1/overview');
 assert.equal(perspectivePath('actual',{fictionalOwnerView:true}),'/index.html#home');
 assert.equal(perspectivePath('actual'),'/webmaster.html#webmaster');
});
test('verified existing pilot owner gets real technical and working tools without migration or political authority',async()=>{
 let state=emptyState();state.people.push({...owner});
 state.groups.push({id:'real-group',name:'Private local group',level:'Local community',place:'Example place',description:'Existing group',memberIds:[owner.id],public:false});
 const store={read:async()=>structuredClone(state),compareAndSwap:async(r,next)=>{if(r!==state.revision)return false;state=structuredClone(next);return true;}};
 const getActor=async(_r,s)=>resolvePilotActor(s,claims,env);
 const call=async(path,body,actor=getActor)=>api(new Request(origin+path,body?{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)}:{}),{store,getActor:actor,mode:'pilot',workspace:false});
 const get=async(path)=>{const response=await call(path);assert.equal(response.status,200);return response.json();};
 const post=async(path,type,data,status=200)=>{const response=await call(path,{id:crypto.randomUUID(),revision:state.revision,type,data});assert.equal(response.status,status,JSON.stringify(await response.clone().json()));return response.json();};
 const before=await get('/api/bootstrap');assert.equal(before.ownerTools,true);assert.equal(before.actor.id,owner.id);assert.equal(before.applicationsAvailable,false);
 assert.equal(before.committeeDirectory.proposalGroups[0].id,'real-group');
 const register=await get('/api/access');assert.equal(register.existingOwner,true);assert.equal(register.accounts.length,1);assert.equal(register.accounts[0].personId,owner.id);
 assert.equal(Object.hasOwn(state,'accessControl'),false,'reading must not write an access registry');
 const a=resolvePilotActor(state,claims,env);assert.equal(isPilotOwner(state,a),true);
 assert.equal(can(state,{...a},'access.view','system','p4a'),false,'client-shaped actors do not gain the server-only owner capability');
 assert.equal(isPilotOwner(state,resolvePilotActor(state,{...claims,email:'alias@example.invalid',sub:'alias-subject'},env)),true);
 assert.equal(resolvePilotActor(state,{...claims,email:'unknown@example.invalid'},env),null);
 await post('/api/access','access.reserve',{role:'secretary',scope:{kind:'group',id:'real-group'},reason:'Plan an office for later'});
 assert.equal(state.accessControl.accounts.length,0);assert.equal(state.accessControl.grants.length,0);assert.equal(state.accessControl.audit[0].actorId,owner.id);
 const created=await post('/api/committee','committee.propose',{name:'Example local planning committee',kind:'local',groupId:'real-group'});
 const committeeId=created.id;
 const detail=await get('/api/committee?id='+committeeId);assert.equal(detail.working,true);assert.equal(detail.committee.offices.every(o=>o.status==='vacant'),true);
 assert.equal(detail.permissions['committee.meeting.manage'],true);assert.equal(detail.permissions['committee.minutes.review'],false);
 assert.equal(detail.officePeople.some(p=>p.id===owner.id&&p.roles.includes('workspace owner')),true);
 const meet=await post('/api/committee','meeting.schedule',{committeeId,title:'Working meeting',kind:'committee',date:'2025-01-01',time:'10:00',location:'Example room'});
 await post('/api/committee','meeting.open',{committeeId,meetingId:meet.id});
 const duty=await post('/api/committee','duty.assign',{committeeId,meetingId:meet.id,title:'Prepare project notes',ownerId:owner.id});
 await post('/api/committee','duty.acknowledge',{committeeId,actionId:duty.id});
 await post('/api/committee','duty.complete',{committeeId,actionId:duty.id});
 await post('/api/committee','minutes.save',{committeeId,meetingId:meet.id,version:0,text:'Working notes only'});
 await post('/api/committee','meeting.close',{committeeId,meetingId:meet.id});
 await post('/api/committee','minutes.review',{committeeId,meetingId:meet.id,version:1,reason:'Self review'},403);
 await post('/api/committee','motion.open-ballot',{committeeId,meetingId:meet.id,motionId:'not-real'},403);
 assert.equal(state.governance.actions[0].completedBy,owner.id);
 assert.equal(state.governance.audit.every(x=>x.actorId===owner.id),true);
 assert.equal(state.people.length,1);
 assert.equal(state.accessControl.grants.length,0);
 assert.equal(state.memberships.length,0);
 const example=await get('/api/access/preview?role=secretary&view=committee&id=committee-1');
 assert.equal(example.fictional,true);assert.equal(example.readOnly,true);assert.equal(example.committee.id,'committee-1');assert.equal(JSON.stringify(example).includes('Example local planning committee'),false);
 const demoAccess=await get('/api/access/preview?role=webmaster&view=access');assert.equal(demoAccess.readOnly,true);assert.equal(demoAccess.existingOwner,false);
 assert.equal((await call('/api/access/preview?role=secretary&view=access')).status,403);
 assert.equal((await call('/api/access',null,async()=>({...owner}))).status,403);
 assert.equal((await call('/api/committee?id='+committeeId,null,async()=>({...owner}))).status,403);
});
