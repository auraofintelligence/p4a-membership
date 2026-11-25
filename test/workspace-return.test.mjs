import test from 'node:test';
import assert from 'node:assert/strict';
import { cataloguePath, catalogueLaunchHref, catalogueReturnHref, catalogueSnapshot, returnNavigation, sameWorkspaceDocument } from '../public/workspace-navigation.mjs';

const origin='https://membership.example.invalid';
const current=origin+'/webmaster-role-preview?role=webmaster&view=fictional#tools';
const token='91c3aa9f-77ca-4ea2-a86c-b6fb84ca8b77';

test('catalogue destinations retain the actual workspace and fictional perspective only',()=>{
  assert.equal(cataloguePath(current,current),'/webmaster-role-preview?role=webmaster&view=fictional#tools');
  assert.equal(cataloguePath('/webmaster.html#webmaster/views',current),'/webmaster.html#webmaster/views');
  assert.equal(cataloguePath('/index.html?role=chair&view=fictional&redirect=https://elsewhere.invalid#tools',current),'/index.html#tools');
  assert.equal(cataloguePath('/webmaster-role-preview.html?role=secretary&view=fictional&committee=local-circle&centreReturn='+token+'#tools',current),'/webmaster-role-preview.html?role=secretary&view=fictional&committee=local-circle#tools');
  const pages=origin+'/p4a-membership/index.html#tools';
  assert.equal(cataloguePath('/p4a-membership/#tools',pages),'/p4a-membership/#tools');
  assert.equal(cataloguePath('/index.html#tools',pages),null);
});

test('return destinations reject external hosts, credentials, endpoint paths and arbitrary routes',()=>{
  for(const path of [
    'https://elsewhere.invalid/index.html#tools','//elsewhere.invalid/#tools',
    'https://person:secret@membership.example.invalid/index.html#tools',
    'javascript:alert(1)','data:text/html,test',
    '/api/export#tools','/cdn-cgi/access/logout#tools','/other/index.html#tools',
    '/%2f%2felsewhere.invalid/index.html#tools','/index.html#project/private-record',
    '/index.html#main','/index.html#tools/https://elsewhere.invalid',
    '/webmaster-role-preview?role=superuser&view=fictional#tools',
  ])assert.equal(cataloguePath(path,current),null,path);
});

test('cross-role launches carry an opaque return reference without changing the destination role',()=>{
  const target='/webmaster-role-preview.html?role=treasurer&view=fictional#committee/committee-1/finance';
  const href=catalogueLaunchHref(target,current,token),url=new URL(href,origin);
  assert.equal(url.pathname,'/webmaster-role-preview.html');
  assert.equal(url.searchParams.get('role'),'treasurer');
  assert.equal(url.searchParams.get('view'),'fictional');
  assert.equal(url.searchParams.get('centreReturn'),token);
  assert.equal(url.hash,'#committee/committee-1/finance');
  assert.equal(catalogueLaunchHref('https://elsewhere.invalid/#tools',current,token),null);
  assert.equal(catalogueLaunchHref('/api/access',current,token),null);
  assert.equal(catalogueLaunchHref('#projects',current,'/index.html#tools'),null);
  const record={version:1,path:cataloguePath(current,current),snapshot:{query:'expenses',category:'planning',scrollY:852}};
  const back=new URL(catalogueReturnHref(record,origin+href,token),origin);
  assert.equal(back.searchParams.get('role'),'webmaster');
  assert.equal(back.searchParams.get('centreRestore'),token);
  assert.equal(back.hash,'#tools');
});

test('direct tool links and early-render desks have an explicit safe return fallback',()=>{
  for(const route of ['#finance/detail','#committee/committee-1/meetings','#webmaster/accounts','#groups/local-circle']){
    const navigation=returnNavigation({currentHref:origin+'/index.html'+route});
    assert.equal(navigation.href,'#tools');
    assert.equal(navigation.label,'Back to all tools');
    assert.equal(navigation.home,'#home');
  }
  assert.equal(returnNavigation({currentHref:origin+'/index.html#home'}),null);
  assert.deepEqual(returnNavigation({currentHref:current}),{href:'#home',label:'Back to home',find:true});
  const tool=origin+'/webmaster-role-preview.html?role=secretary&view=fictional#committee/committee-1/library';
  const source={version:1,path:'/webmaster-role-preview?role=webmaster&view=fictional#webmaster'};
  assert.equal(returnNavigation({currentHref:tool,record:source,token}).label,'Back to Webmaster');
  for(const bad of [{version:0,path:'/index.html#tools'},{version:1,path:'https://elsewhere.invalid/#tools'},{version:1,path:'/api/export'}]){
    assert.equal(catalogueReturnHref(bad,tool,token),null);
    assert.equal(returnNavigation({currentHref:tool,record:bad,token}).href,'#tools');
  }
});

test('in-page navigation preserves a preview session and never changes its role or real query parameters',()=>{
  const pages=origin+'/p4a-membership/index.html#tools';
  const launched=catalogueLaunchHref('#hours/calculator',pages,token);
  assert.equal(sameWorkspaceDocument(launched,pages),true);
  assert.equal(sameWorkspaceDocument('/p4a-membership/index.html?centreRestore='+token+'#tools',origin+launched),true);
  assert.equal(sameWorkspaceDocument('/webmaster-role-preview?view=fictional&role=webmaster&centreReturn='+token+'#finance',current),true);
  assert.equal(sameWorkspaceDocument('/webmaster-role-preview?role=treasurer&view=fictional#finance',current),false);
  assert.equal(sameWorkspaceDocument('/webmaster-role-preview.html?role=webmaster&view=fictional#finance',current),false);
  assert.equal(sameWorkspaceDocument('/webmaster-role-preview?role=webmaster&view=fictional&committee=other#tools',current),false);
  assert.equal(sameWorkspaceDocument('https://elsewhere.invalid/index.html#tools',pages),false);
});

test('saved catalogue state is bounded and contains only display preferences',()=>{
  assert.deepEqual(catalogueSnapshot(null),{query:'',category:'',scrollY:0,focus:''});
  assert.deepEqual(catalogueSnapshot({query:'expenses',category:'planning',scrollY:950.6,focus:'/index.html#finance'}),{query:'expenses',category:'planning',scrollY:951,focus:'/index.html#finance'});
  const excessive=catalogueSnapshot({query:'x'.repeat(10000),category:'admin',scrollY:Infinity,focus:'x'.repeat(10000),role:'webmaster',permissions:['access.revoke']});
  assert.equal(excessive.query.length,120);
  assert.equal(excessive.category,'');
  assert.equal(excessive.scrollY,0);
  assert.equal(excessive.focus,'');
  assert.equal('role' in excessive,false);
  assert.equal('permissions' in excessive,false);
  assert.equal(catalogueSnapshot({scrollY:-30}).scrollY,0);
  assert.equal(catalogueSnapshot({scrollY:1e15}).scrollY,2000000);
});
