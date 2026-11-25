import test from 'node:test';
import assert from 'node:assert/strict';
import { createShowcaseState, createWorkspaceDemoState, fixtureActor, fixtureProjection, fixtureOverview, fixtureView, previewRoles } from '../src/webmaster-preview.mjs';
import { committeeProjection, committeeDocument } from '../src/committee-governance.mjs';
import { authorisedProjection } from '../src/scoped-projection.mjs';
import { can } from '../src/scoped-access.mjs';

const now = new Date('2026-11-25T15:00:00.000Z');
const view = (state,role) => committeeProjection(state,fixtureActor(state,role),'committee-1',now,'showcase');
const denied = error => error.status===403 || error.status===404;

test('connected walkthrough has stable links and a next meeting relative to the Brisbane day',()=>{
  const state=createWorkspaceDemoState(now),g=state.governance;
  assert.deepEqual(state,createWorkspaceDemoState(now));
  assert.equal(g.meetings.find(m=>m.status==='scheduled').date,'2026-12-03');
  assert.equal(g.meetings.find(m=>m.status==='closed').date,'2026-11-19');
  assert.ok(g.meetings.find(m=>m.status==='closed').minutes.reviewedBy);
  assert.equal(new Set(g.actions.map(a=>a.id)).size,g.actions.length);
  for(const action of g.actions){
    assert.ok(g.meetings.some(m=>m.id===action.meetingId));
    assert.ok(state.people.some(p=>p.id===action.ownerId));
    assert.ok(g.notices.some(n=>n.kind==='task'&&n.sourceId===action.id));
    if(action.projectId){
      const project=state.projects.find(p=>p.id===action.projectId);
      assert.ok(project.participantIds.includes(action.ownerId));
      const task=project.tasks.find(t=>t.id===action.id);
      assert.equal(task.title,action.title);
      assert.equal(task.assigneeId,action.ownerId);
    }
  }
  const reviewer=view(state,'reviewer');
  assert.ok(reviewer.actions.some(a=>a.ownerId==='fixture-reviewer'&&!a.done));
  assert.ok(reviewer.communications.editions.some(e=>e.status==='review'&&e.draft.articles.length));
  assert.ok(reviewer.communications.partnerships.some(p=>p.projectId==='project-1'&&p.status==='proposed'));
  assert.equal(reviewer.formalDecisionsEnabled,false);
});

test('example duty and document visibility follow the existing grants on every route',()=>{
  const state=createWorkspaceDemoState(now),secretary=view(state,'secretary'),chair=view(state,'chair'),deputy=view(state,'deputy'),member=view(state,'member');
  assert.equal(secretary.actions.length,state.governance.actions.length);
  assert.ok(chair.actions.length);
  assert.ok(chair.actions.every(a=>a.ownerId==='fixture-chair'));
  assert.ok(deputy.actions.every(a=>a.ownerId==='fixture-deputy'));
  const projected=authorisedProjection(state,fixtureActor(state,'deputy'),'showcase',false,now);
  const linked=deputy.actions.find(a=>a.projectId);
  assert.equal(projected.projects.find(p=>p.id===linked.projectId).tasks.find(t=>t.id===linked.id).committeeAction,true);
  assert.equal(member.working,false);
  assert.deepEqual(member.actions,[]);
  assert.deepEqual(member.meetings,[]);
  assert.equal(member.operations.finance,null);
  assert.ok(member.releasedMinutes.length);
  assert.ok(member.operations.released.length);
  assert.ok(chair.operations.library.some(d=>d.id==='fixture-restricted-paper'));
  assert.equal(deputy.operations.library.some(d=>d.id==='fixture-restricted-paper'),false);
  assert.throws(()=>committeeDocument(state,fixtureActor(state,'deputy'),'committee-1','fixture-restricted-paper',1,now,'showcase'),denied);
  assert.throws(()=>committeeDocument(state,fixtureActor(state,'member'),'committee-1','fictional-paper',1,now,'showcase'),denied);
  assert.throws(()=>committeeProjection(state,fixtureActor(state,'chair'),'committee-2',now,'showcase'),denied);
  const privateText=state.governance.operations.documents.find(d=>d.id==='fixture-restricted-paper').versions[0].body;
  assert.equal(JSON.stringify(member).includes(privateText),false);
  assert.equal(JSON.stringify(deputy).includes(privateText),false);
  const notice=secretary.notices.find(n=>n.sourceId==='fixture-duty-welcome');
  assert.equal(notice.resolved,true);
  assert.ok(chair.notices.some(n=>n.unread&&!n.resolved));
});

test('Treasurer example reconciles settled AUD income and reviewed expenses independently',()=>{
  const state=createWorkspaceDemoState(now),finance=view(state,'treasurer').operations.finance;
  const income=finance.income.reduce((sum,r)=>sum+r.amountCents,0);
  const reviewed=finance.expenses.filter(e=>e.status==='reviewed').reduce((sum,e)=>sum+e.amountCents,0);
  assert.equal(income,24000);
  assert.equal(reviewed,3500);
  assert.equal(finance.expenses.filter(e=>e.status==='pending').length,1);
  assert.equal(finance.paymentsEnabled,false);
  const reconciliation=finance.reconciliations[0];
  assert.equal(reconciliation.expectedClosingCents,reconciliation.openingCents+income-reviewed);
  assert.equal(reconciliation.statementClosingCents,20500);
  assert.equal(reconciliation.differenceCents,0);
  assert.equal(reconciliation.stale,false);
  assert.equal(reconciliation.sources.expenses.length,1);
  assert.notEqual(finance.expenses[0].reviewedBy,finance.expenses[0].createdBy);
  assert.notEqual(finance.expenses[0].reviewedBy,finance.expenses[0].payeeId);
  assert.equal(view(state,'secretary').operations.finance,null);
  assert.equal(view(state,'deputy').operations.finance,null);
  state.financialContributions.find(r=>r.id==='receipt-example').amountCents+=1;
  assert.equal(view(state,'treasurer').operations.finance.reconciliations[0].stale,true);
});

test('read-only examples stay fresh and never extend Webmaster or office authority',()=>{
  const minimal=createShowcaseState(),rich=createWorkspaceDemoState(now);
  assert.deepEqual(rich.accessControl.grants,minimal.accessControl.grants);
  assert.equal(minimal.governance.actions.length,0);
  assert.equal(minimal.governance.operations.budgets.length,0);
  for(const role of previewRoles){
    const projected=fixtureProjection(role,now);
    assert.equal(projected.fictional,true);
    assert.equal(projected.readOnly,true);
    assert.equal(projected.previewRole,role);
    assert.equal(projected.actor.name.endsWith('(example)'),true);
    assert.equal(projected.access.admissionEnabled,false);
    assert.equal(JSON.stringify(projected).includes('FICTIONAL-OTHER-SCOPE-ONLY'),false);
  }
  const webmaster=fixtureActor(rich,'webmaster');
  assert.equal(can(rich,webmaster,'access.view','system','p4a',now),true);
  assert.equal(can(rich,webmaster,'committee.view','committee','committee-1',now),false);
  assert.equal(can(rich,webmaster,'project.view','group','group-1',now),false);
  const overview=fixtureOverview(now);
  assert.ok(overview.accounts.every(a=>a.name.endsWith('(example)')));
  assert.equal(JSON.stringify(overview).includes('subject-chair'),false);
  const params=new URLSearchParams({view:'committee',id:'committee-1'});
  const first=fixtureView('secretary',params,now);
  first.meetings[0].title='Changed locally';
  const second=fixtureView('secretary',params,now);
  assert.equal(second.meetings[0].title,'Neighbourhood planning evening');
  assert.equal(second.readOnly,true);
  assert.throws(()=>fixtureView('webmaster',params,now),denied);
});
