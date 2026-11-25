import test from 'node:test';
import assert from 'node:assert/strict';
import { centreToolGroups, toolsDirectory, committeeHomeSummary, workspaceHome } from '../public/centre-overview.mjs';
import { perspectivePath } from '../public/workspace-navigation.mjs';
import { createWorkspaceDemoState, fixtureActor, fixtureView, previewRoles } from '../src/webmaster-preview.mjs';
import { can } from '../src/scoped-access.mjs';

const now=new Date('2026-11-25T15:00:00.000Z');
const perspectiveUrl=role=>perspectivePath(role,{fictionalOwnerView:true});
const options={canOpen:()=>false,civicTools:true,previewRole:null,perspectiveUrl,committeeId:'local-circle'};
const allItems=groups=>groups.flatMap(g=>g.items);
const dateText=value=>value;

test('member home opens released committee records without offering officer-only desks',()=>{
  const data=fixtureView('member',new URLSearchParams({view:'committee',id:'committee-1'}),now);
  assert.equal(data.working,false);
  const html=committeeHomeSummary(data,{actor:{id:'fixture-member'},dateText,now});
  assert.match(html,/#committee\/committee-1\/released/);
  assert.doesNotMatch(html,/#committee\/committee-1\/(meetings|duties|notices)/);
  assert.doesNotMatch(html,/No upcoming meeting|0 open|0 unread/);
});

test('ordinary catalogue keeps route and committee permissions while inspection requires the explicit Webmaster example',()=>{
  const ordinary=allItems(centreToolGroups({...options,canOpen:key=>['projects','committee'].includes(key),committeeAllows:tab=>['overview','duties'].includes(tab)}));
  assert.deepEqual(ordinary.map(t=>t.route),['projects','committee/local-circle/overview','committee/local-circle/duties']);
  assert.ok(ordinary.every(t=>t.href==='#'+t.route&&t.role===null));
  for(const previewRole of [null,'chair','member','administrator','actual'])assert.deepEqual(centreToolGroups({...options,previewRole}),[]);
  const noCivic=allItems(centreToolGroups({...options,canOpen:()=>true,civicTools:false}));
  assert.equal(noCivic.some(t=>['training','readiness'].includes(t.route)),false);
  const directory=allItems(centreToolGroups({...options,committeeId:undefined,canOpen:key=>key==='committee',committeeAllows:tab=>tab==='overview'}));
  assert.equal(directory.length,1);
  assert.equal(directory[0].href,'#committee');
});

test('Webmaster drill-down links always name an isolated fictional role with the required desk scope',()=>{
  const state=createWorkspaceDemoState(now);
  const items=allItems(centreToolGroups({...options,previewRole:'webmaster',committeeAllows:()=>false}));
  assert.ok(items.length>20);
  const permissions={overview:'committee.view',meetings:'committee.meeting.manage',duties:'committee.task.assign',notices:'committee.notice.read',library:'committee.library.view',editions:'committee.edition.edit',partnerships:'committee.partnership.review',finance:'committee.finance.view',offices:'committee.office.plan'};
  for(const item of items){
    const url=new URL(item.href,'https://example.invalid');
    assert.equal(url.origin,'https://example.invalid');
    assert.equal(url.pathname,'/webmaster-role-preview.html');
    assert.equal(url.searchParams.get('view'),'fictional');
    assert.equal(url.searchParams.get('role'),item.role);
    assert.ok(previewRoles.includes(item.role));
    assert.notEqual(item.role,'webmaster');
    assert.equal(url.hash,'#'+item.route);
    if(item.route.startsWith('committee/')){
      const [_,id,tab]=item.route.split('/');
      assert.equal(id,'committee-1');
      assert.equal(can(state,fixtureActor(state,item.role),permissions[tab],'committee',id,now),true,item.title);
    }
    if(item.route==='constitution')assert.equal(can(state,fixtureActor(state,item.role),'constitution.view','constitution','constitution-1',now),true);
  }
  const member=fixtureActor(state,'member');
  for(const route of ['gamify/games','hours']){
    const item=items.find(t=>t.route===route);
    assert.equal(item.role,'member');
    assert.equal(can(state,member,'contribution.log','group','group-1',now)||can(state,member,'financial.log','group','group-1',now),true);
  }
  assert.equal(can(state,fixtureActor(state,'webmaster'),'committee.view','committee','committee-1',now),false);
});

test('home summary counts canonical open duties and unread unresolved notices only',()=>{
  const data={committee:{id:'local-circle',name:'Local circle'},meetings:[],actions:[
    {id:'open',ownerId:'me',title:'Prepare the guide',done:false},
    {id:'done',ownerId:'me',title:'Already complete',done:true},
    {id:'cancelled',ownerId:'me',title:'Withdrawn work',cancelled:true},
    {id:'other',ownerId:'someone-else',title:'Another person’s work',done:false},
  ],notices:[
    {id:'new',title:'Agenda ready',unread:true,resolved:false,retracted:false},
    {id:'read',title:'Previously read',unread:false,resolved:false},
    {id:'resolved',title:'Completed follow-up',unread:true,resolved:true},
    {id:'retracted',title:'Cancelled meeting',unread:true,retracted:true},
    {id:'unknown',title:'No read state supplied'},
  ]};
  const html=committeeHomeSummary(data,{actor:{id:'me'},dateText,now});
  assert.match(html,/<strong>1 open<\/strong>/);
  assert.match(html,/<strong>1 unread<\/strong>/);
  assert.match(html,/Prepare the guide/);
  assert.match(html,/Agenda ready/);
  assert.doesNotMatch(html,/Already complete|Withdrawn work|Another person|Previously read|Completed follow-up|Cancelled meeting|No read state supplied/);
  const fixture=fixtureView('secretary',new URLSearchParams({view:'committee',id:'committee-1'}),now);
  const rendered=committeeHomeSummary(fixture,{actor:{id:'fixture-secretary'},dateText,now});
  assert.match(rendered,/<strong>1 open<\/strong>/);
  assert.doesNotMatch(rendered,/Prepare a plain-language welcome note/);
});

test('next meeting follows Brisbane time and an open meeting takes precedence',()=>{
  const meeting=(id,date,time,status='scheduled')=>({id,title:id,date,time,status});
  const data={committee:{id:'circle',name:'Circle'},meetings:[
    meeting('past-today','2026-11-26','00:30'),
    meeting('next','2026-11-26','02:00'),
    meeting('later','2026-11-27','09:00'),
    meeting('cancelled','2026-11-26','01:30','cancelled'),
    meeting('bad-date','not-a-date','10:00'),
    meeting('bad-time','2026-11-26','99:99'),
  ]};
  let html=committeeHomeSummary(data,{actor:{id:'me'},dateText,now});
  assert.match(html,/href="#committee\/circle\/meeting\/next"/);
  assert.doesNotMatch(html,/past-today|cancelled|bad-date|bad-time/);
  data.meetings.push(meeting('in-progress','2026-11-25','23:30','open'));
  html=committeeHomeSummary(data,{actor:{id:'me'},dateText,now});
  assert.match(html,/href="#committee\/circle\/meeting\/in-progress"/);
});

test('summary tolerates missing records and escapes projected titles and links',()=>{
  const args={actor:{id:'me'},dateText,now};
  assert.equal(committeeHomeSummary(null,args),'');
  assert.equal(committeeHomeSummary({},args),'');
  assert.equal(committeeHomeSummary({committee:{}},args),'');
  const unknown=committeeHomeSummary({committee:{id:'circle',name:'Circle'},meetings:{},actions:false,notices:'unknown'},args);
  assert.match(unknown,/0 open/);
  assert.match(unknown,/0 unread/);
  const input='<img src=x onerror="alert(1)">';
  const data={committee:{id:'circle"<x>',name:input},meetings:[{id:'meeting"<x>',title:input,date:'2026-11-27',time:'10:00',status:'scheduled'}],actions:[{ownerId:'me',title:input,done:false}],notices:[{title:input,unread:true}]};
  const html=committeeHomeSummary(data,args);
  assert.doesNotMatch(html,/<img|onerror="/);
  assert.match(html,/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.match(html,/committee\/circle%22%3Cx%3E\/meeting\/meeting%22%3Cx%3E/);
  const directory=toolsDirectory({...options,canOpen:key=>key==='committee',committeeAllows:tab=>tab==='overview',committeeId:'circle"<x>'},{icon:()=>''});
  assert.match(directory,/href="#committee\/circle%22%3Cx%3E\/overview"/);
  assert.doesNotMatch(directory,/<x>/);
});

test('assigned committee project tasks return to their duty desk from home',()=>{
  const state={actor:{id:'me',name:'Sam <script>'},projects:[{id:'project-1',title:'Shared <script> project',ownerId:'me',participantIds:['me'],status:'active',tasks:[{id:'linked',title:'Prepare <script> papers',done:false,assigneeId:'me',committeeAction:true,committeeId:'circle-1'},{id:'complete',title:'Already complete',done:true,assigneeId:'me'}]}],activity:[]};
  const html=workspaceHome({state,canOpen:key=>key==='projects',previewRole:null,perspectiveUrl,committee:null,projectCard:()=>'',icon:()=>'',dateText,startAction:'',purpose:''});
  assert.match(html,/href="#committee\/circle-1\/duties"/);
  assert.match(html,/1 open/);
  assert.doesNotMatch(html,/<script>|Already complete/);
  assert.match(html,/Prepare &lt;script&gt; papers/);
});
