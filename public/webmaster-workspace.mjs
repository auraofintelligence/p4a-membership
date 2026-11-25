// The Webmaster lives in the same workspace as members and committees.
const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roles=['webmaster','chair','deputy','secretary','assistant-secretary','treasurer','committee','reviewer','member','applicant'];
const label=role=>({'assistant-secretary':'Assistant Secretary',committee:'Committee member',webmaster:'Webmaster',chair:'Chair',deputy:'Deputy',secretary:'Secretary',treasurer:'Treasurer',reviewer:'Reviewer',member:'Member',applicant:'Applicant'})[role]||String(role||'').replaceAll('-',' ');
const roleIcons={webmaster:'transparency',chair:'committees',deputy:'groups',secretary:'readiness','assistant-secretary':'training',treasurer:'finance',committee:'people',reviewer:'constitution',member:'profile',applicant:'onboarding'};
const tabs=[['overview','Overview','home'],['accounts','Accounts','people'],['permissions','Permissions','transparency'],['offices','Office planning','committees'],['views','Try a role','training'],['audit','Change history','readiness']];
const officeScopes={webmaster:['system'],chair:['group','constitution','committee'],deputy:['group','constitution','committee'],secretary:['group','constitution','committee'],'assistant-secretary':['group','constitution','committee'],treasurer:['group','committee'],committee:['group','constitution','committee'],reviewer:['group','constitution','committee']};
const scopeFields={group:'groups',constitution:'constitutions',committee:'committees',system:'system'};
const esc=escape;
const idText=row=>row.id||'';
const dateText=value=>{const d=new Date(value);return value&&Number.isFinite(d.getTime())?d.toLocaleString('en-AU',{timeZone:'Australia/Brisbane',dateStyle:'medium',timeStyle:'short'}):'Not set';};
const heading=(title,copy)=>'<div class="page-heading"><div><span class="eyebrow">Manage the centre</span><h1>'+esc(title)+'</h1><p>'+esc(copy)+'</p></div></div>';
const card=(title,body)=>'<section class="panel"><h2>'+esc(title)+'</h2><div class="subheading">'+body+'</div></section>';
const chip=text=>'<span class="chip">'+esc(text)+'</span>';
function scopeName(data,scope){
  const row=(data.scopes?.[scopeFields[scope?.kind]]||[]).find(x=>x.id===scope?.id);
  return (scope?.kind?label(scope.kind)+': ':'')+(row?.name||row?.title||scope?.id||'Unknown');
}
function countCard(title,count,image,icon,href){
  return '<a class="home-door" href="'+href+'">'+icon(image)+'<div><span class="eyebrow">'+esc(title)+'</span><h2>'+esc(count)+'</h2><span class="door-action">Open →</span></div></a>';
}
function toolLink(href,title,copy,image,icon){
  return '<a class="home-door" href="'+esc(href)+'">'+icon(image)+'<div><h2>'+esc(title)+'</h2><p>'+esc(copy)+'</p></div></a>';
}
function actionForm(type,id,button){
  return '<form data-webmaster-action="'+esc(type)+'" class="subheading"><input type="hidden" name="id" value="'+esc(id)+'"><label class="field">Reason<input name="reason" required maxlength="500"></label><button type="submit" class="button secondary small">'+esc(button)+'</button></form>';
}
function searchPanel(title,body,placeholder){
  return card(title,'<label class="field">Find a record<input type="search" data-webmaster-search placeholder="'+esc(placeholder)+'"></label><div data-webmaster-records>'+body+'</div><p data-webmaster-empty hidden>No matching records.</p>');
}
function row(title,meta,extra=''){
  return '<article class="activity-line" data-webmaster-record><div><h3>'+esc(title)+'</h3>'+meta.map(x=>'<p class="muted">'+esc(x)+'</p>').join('')+extra+'</div></article>';
}
function overview(data,icon,ro){
  const countActive=data.accounts.filter(x=>x.status==='active').length;
  return '<div class="home-doors">'+countCard('Accounts',countActive,'people',icon,'#webmaster/accounts')+countCard('Access grants',data.grants.length,'transparency',icon,'#webmaster/permissions')+countCard('Office reservations',data.reservations.filter(x=>x.status==='reserved').length,'committees',icon,'#webmaster/offices')+countCard('Recent changes',data.audit.length,'readiness',icon,'#webmaster/audit')+'</div>'+
    '<div class="home-doors">'+(!ro&&data.existingOwner?toolLink('#committee','Organising committee','Open meetings, duties, documents and other working tools.','committees',icon)+toolLink('#constitution','Constitution','Open and shape the working drafts.','constitution',icon):'')+toolLink('#webmaster/views','Try a role','Explore example views without changing your identity.','training',icon)+'</div>'+
    card('Your access','<p>'+(ro?'You are looking at fictional examples.':data.existingOwner?'You are signed in with your existing private owner account. Your normal working tools and technical administration are available here.':'You can manage technical access within your current permissions.')+'</p><p>Office appointments and membership admission remain separate from system access.</p>');
}
function accounts(data,ro){
  const body=data.accounts.map(a=>row(a.existingOwner?'Your existing owner account':a.personId||a.id,
    ['Account: '+a.id,'Status: '+a.status],
    !ro&&data.capabilities?.revoke&&a.id!==data.currentAccountId&&a.status==='active'&&!data.grants.some(g=>g.accountId===a.id&&g.role==='webmaster')?actionForm('access.disable-account',a.id,'Disable access'):'')).join('')||'<p>No accounts yet.</p>';
  return searchPanel('Accounts',body,'Name, account or status');
}
function permissions(data,ro){
  const body=data.grants.map(g=>row(label(g.role)+' · '+scopeName(data,g.scope),
    [g.accountId+' · '+g.status,'From '+dateText(g.startsAt)+' until '+dateText(g.endsAt),'Authority: '+g.authorityRef],
    '<details><summary>What this grant allows</summary><ul>'+g.permissions.map(x=>'<li>'+esc(x.replaceAll('.',' · '))+'</li>').join('')+'</ul></details>'+
    (!ro&&data.capabilities?.revoke&&g.accountId!==data.currentAccountId&&g.status==='active'&&g.role!=='webmaster'?actionForm('access.revoke-grant',g.id,'Revoke access'):''))).join('')||'<p>No separately issued access grants yet. The existing private owner can still use the centre.</p>';
  return searchPanel('Access grants',body,'Role, scope or permission');
}
function offices(data,ro){
  const form=!ro&&data.capabilities?.reserve?card('Plan an office','<p>Set aside a role for later. This does not appoint or invite anyone.</p><form data-webmaster-reserve class="form-grid subheading"><label class="field">Office<select name="role">'+Object.keys(officeScopes).map(r=>'<option value="'+esc(r)+'">'+esc(label(r))+'</option>').join('')+'</select></label><label class="field">Where<select name="scope" required></select></label><label class="field full">Reason<textarea name="reason" required maxlength="500"></textarea></label><button type="submit" class="button">Save reservation</button></form>'):'';
  const body=data.reservations.map(r=>row(label(r.role)+' · '+scopeName(data,r.scope),['Status: '+r.status,'Created '+dateText(r.createdAt),'By '+r.createdBy],!ro&&data.capabilities?.reserve&&r.status==='reserved'?actionForm('access.cancel-reservation',r.id,'Cancel reservation'):'')).join('')||'<p>No reservations yet.</p>';
  return form+searchPanel('Office reservations',body,'Role or place');
}
function views(icon,perspectiveUrl){
  return '<p>Choose a role to explore the fictional workspace. Your real account stays the same.</p><div class="home-doors">'+roles.map(r=>toolLink(perspectiveUrl(r),label(r),'Open example view',roleIcons[r],icon)).join('')+'</div>';
}
function audit(data){
  return searchPanel('Recent changes',data.audit.slice().reverse().map(r=>row(label(r.type).replaceAll('.',' · '),[dateText(r.at),'By '+r.actorId+' · '+r.targetId,r.reason])).join('')||'<p>No technical changes recorded yet.</p>','Action, person or reason');
}
const pending=new Map();
export async function mountWebmaster(root,{api,readOnly,route,perspectiveUrl,icon,onSaved}){
  const data=await api('/api/access');
  if(location.hash!==route)return;
  const ro=Boolean(readOnly||data.readOnly);
  const tab=route.replace(/^#webmaster\/?/,'')||'overview';
  const selected=tabs.find(x=>x[0]===tab)||tabs[0];
  const descriptions={overview:'Manage accounts and access, or head straight to your working tools.',accounts:'See the accounts that can use this centre.',permissions:'See what people can access, and where.',offices:'Prepare roles for when people are ready to take them on.',views:'See the centre through different roles.',audit:'See who changed technical access and why.'};
  const nav='<nav class="button-row subheading" aria-label="Webmaster tools">'+tabs.map(([key,title])=>'<a class="button '+(selected[0]===key?'':'secondary')+' small" href="#webmaster/'+key+'"'+(selected[0]===key?' aria-current="page"':'')+'>'+esc(title)+'</a>').join('')+'</nav>';
  const renderers={overview:()=>overview(data,icon,ro),accounts:()=>accounts(data,ro),permissions:()=>permissions(data,ro),offices:()=>offices(data,ro),views:()=>views(icon,perspectiveUrl),audit:()=>audit(data)};
  root.innerHTML=heading('Webmaster · '+selected[1],descriptions[selected[0]])+nav+'<p role="status" data-webmaster-status></p>'+renderers[selected[0]]();
  const search=root.querySelector('[data-webmaster-search]');
  if(search)search.addEventListener('input',()=>{
    const term=search.value.trim().toLowerCase();let shown=0;
    for(const item of root.querySelectorAll('[data-webmaster-record]')){item.hidden=!item.textContent.toLowerCase().includes(term);if(!item.hidden)shown++;}
    root.querySelector('[data-webmaster-empty]').hidden=shown>0;
  });
  if(ro)return;
  const reserve=root.querySelector('[data-webmaster-reserve]');
  function fillScopes(){
    const role=reserve.elements.namedItem('role').value,select=reserve.elements.namedItem('scope');
    select.replaceChildren();
    for(const kind of officeScopes[role]||[]){
      for(const x of data.scopes?.[scopeFields[kind]]||[]){
        const option=document.createElement('option');option.value=JSON.stringify({kind,id:x.id});option.textContent=scopeName(data,{kind,id:x.id});select.append(option);
      }
    }
    reserve.querySelector('button').disabled=!select.options.length;
  }
  async function change(form,type,fields){
    const button=form.querySelector('button'),status=root.querySelector('[data-webmaster-status]');
    if(!confirm('Save this technical access change?'))return;
    const fingerprint=JSON.stringify({type,data:fields}),id=pending.get(fingerprint)||crypto.randomUUID();
    pending.set(fingerprint,id);button.disabled=true;
    try{await api('/api/access',{method:'POST',body:JSON.stringify({id,type,data:fields,revision:data.revision})});pending.delete(fingerprint);await onSaved();}
    catch(err){status.textContent=err.message;button.disabled=false;}
  }
  if(reserve){
    fillScopes();reserve.elements.namedItem('role').addEventListener('change',fillScopes);
    reserve.addEventListener('submit',event=>{event.preventDefault();const f=new FormData(reserve);void change(reserve,'access.reserve',{role:f.get('role'),scope:JSON.parse(f.get('scope')),reason:f.get('reason')});});
  }
  for(const form of root.querySelectorAll('[data-webmaster-action]'))form.addEventListener('submit',event=>{event.preventDefault();const f=new FormData(form);void change(form,form.dataset.webmasterAction,{id:f.get('id'),reason:f.get('reason')});});
}
