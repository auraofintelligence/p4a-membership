// The Webmaster lives in the same workspace as members and committees.
const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roles=['webmaster','chair','deputy','secretary','assistant-secretary','treasurer','committee','reviewer','member','applicant'];
const label=role=>({'assistant-secretary':'Assistant Secretary',committee:'Committee member',webmaster:'Webmaster',chair:'Chair',deputy:'Deputy',secretary:'Secretary',treasurer:'Treasurer',reviewer:'Reviewer',member:'Member',applicant:'Applicant',group:'Working group',constitution:'Constitution',system:'Centre'})[role]||String(role||'').replaceAll('-',' ');
const roleIcons={webmaster:'webmaster',chair:'committees',deputy:'duties',secretary:'documents','assistant-secretary':'editions',treasurer:'treasury',committee:'meetings',reviewer:null,member:'profile',applicant:'onboarding'};
const roleDescriptions={webmaster:'Accounts, access and centre administration.',chair:'Meeting preparation, decisions and shared responsibilities.',deputy:'Committee work, project follow-through and team support.',secretary:'Agendas, minutes, notices and working documents.','assistant-secretary':'Shared record keeping, editions and meeting preparation.',treasurer:'Budgets, recorded expenses and reconciliation.',committee:'Meetings, assigned duties and committee contributions.',reviewer:'Independent review of records and proposals.',member:'Projects, learning and your own participation.',applicant:'The membership journey and your own application.'};
const tabs=[['overview','Overview','webmaster'],['accounts','Accounts','people'],['permissions','Access',null],['offices','Office planning','office-holders'],['views','Role examples',null],['audit','History',null]];
const officeScopes={webmaster:['system'],chair:['group','constitution','committee'],deputy:['group','constitution','committee'],secretary:['group','constitution','committee'],'assistant-secretary':['group','constitution','committee'],treasurer:['group','committee'],committee:['group','constitution','committee'],reviewer:['group','constitution','committee']};
const scopeFields={group:'groups',constitution:'constitutions',committee:'committees',system:'system'};
const esc=escape;
const dateText=value=>{const d=new Date(value);return value&&Number.isFinite(d.getTime())?d.toLocaleString('en-AU',{timeZone:'Australia/Brisbane',dateStyle:'medium',timeStyle:'short'}):'Not set';};
const card=(title,body,extra='')=>'<section class="panel wm-panel '+extra+'"><h2>'+esc(title)+'</h2>'+body+'</section>';
const chip=text=>'<span class="wm-chip">'+esc(text)+'</span>';
const recordDetails=(summary,rows)=>'<details class="wm-record-details"><summary>'+esc(summary)+'</summary><dl>'+rows.filter(([,value])=>value!==undefined&&value!==null&&value!=='').map(([key,value])=>'<div><dt>'+esc(key)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl></details>';
function scopeName(data,scope){
  const item=(data.scopes?.[scopeFields[scope?.kind]]||[]).find(x=>x.id===scope?.id);
  return item?.name||item?.title||scope?.id||'Unknown scope';
}
function accountName(data,id){
  const account=data.accounts.find(a=>a.id===id||a.personId===id);
  if(!account)return id||'Unknown account';
  if(account.existingOwner)return 'Your existing owner account';
  if(account.name||account.displayName)return account.name||account.displayName;
  if(account.id===data.currentAccountId)return 'Your Webmaster account';
  const held=[...new Set(data.grants.filter(g=>g.accountId===account.id&&g.status==='active').map(g=>label(g.role)))];
  return held.length?held.join(' / ')+' account':account.personId||account.id;
}
function countCard(title,count,copy,image,icon,href){
  return '<a class="wm-metric" href="'+esc(href)+'">'+(image?icon(image):'')+'<div><span>'+esc(title)+'</span><strong>'+esc(count)+'</strong><small>'+esc(copy)+'</small></div><span class="wm-arrow" aria-hidden="true">→</span></a>';
}
function toolLink(href,title,copy,image,icon,context=''){
  return '<a class="wm-tool" href="'+esc(href)+'">'+(image?icon(image):'')+'<div>'+(context?'<span class="wm-tool-context">'+esc(context)+'</span>':'')+'<h3>'+esc(title)+'</h3><p>'+esc(copy)+'</p></div><span class="wm-arrow" aria-hidden="true">→</span></a>';
}
function exampleLink(role,route,title,copy,image,icon,perspectiveUrl){
  const href=perspectiveUrl(role).split('#')[0]+'#'+route;
  return toolLink(href,title,copy,image,icon,label(role)+' example');
}
function actionForm(type,id,button){
  return '<details class="wm-action"><summary>'+esc(button)+'</summary><form data-webmaster-action="'+esc(type)+'"><input type="hidden" name="id" value="'+esc(id)+'"><label class="field">Reason<input name="reason" required maxlength="500"></label><button type="submit" class="button secondary small">'+esc(button)+'</button></form></details>';
}
function searchPanel(title,body,placeholder,count){
  return '<section class="panel wm-panel"><div class="wm-section-heading"><h2>'+esc(title)+'</h2>'+chip(count+' recorded')+'</div><label class="field wm-search">Find a record<input type="search" data-webmaster-search placeholder="'+esc(placeholder)+'"></label><div class="wm-records" data-webmaster-records>'+body+'</div><p class="wm-empty" data-webmaster-empty hidden>No matching records. Try another name, role or reference.</p></section>';
}
function row(title,meta,extra='',status=''){
  return '<article class="wm-record" data-webmaster-record><div class="wm-record-heading"><h3>'+esc(title)+'</h3>'+(status?chip(status):'')+'</div>'+meta.filter(Boolean).map(x=>'<p class="wm-record-meta">'+esc(x)+'</p>').join('')+extra+'</article>';
}
function overview(data,icon,ro,perspectiveUrl){
  const countActive=data.accounts.filter(x=>x.status==='active').length;
  const reservations=data.reservations.filter(x=>x.status==='reserved').length;
  const metrics='<div class="wm-metrics">'+countCard('Accounts',countActive,'currently active','people',icon,'#webmaster/accounts')+countCard('Access grants',data.grants.length,'recorded permissions',null,icon,'#webmaster/permissions')+countCard('Office plans',reservations,'reserved roles','office-holders',icon,'#webmaster/offices')+countCard('Recent changes',data.audit.length,'in the access history',null,icon,'#webmaster/audit')+'</div>';
  const working=!ro&&data.existingOwner?'<section class="wm-section"><div class="wm-section-heading"><div><h2>Your working tools</h2><p>Continue in your private workspace.</p></div><a class="wm-text-link" href="#tools">All tools →</a></div><div class="wm-tools wm-tools-compact">'+toolLink('#committee','Committee room','Meetings, duties and shared records.','committees',icon)+toolLink('#constitution','Constitution builder','Shape and review your working drafts.','constitution',icon)+toolLink('#projects','Shared projects','Keep local work moving.','projects',icon)+'</div></section>':'';
  const tour='<section class="wm-section"><div class="wm-section-heading"><div><h2>Explore the centre</h2><p>Each example opens the role that uses those tools.</p></div><a class="wm-text-link" href="#webmaster/views">All role examples →</a></div><div class="wm-tools">'+
    exampleLink('member','home','Membership & learning','See the member home and participation pathways.','profile',icon,perspectiveUrl)+
    exampleLink('member','projects','Projects & groups','Explore shared work and local collaboration.','projects',icon,perspectiveUrl)+
    exampleLink('chair','committee/committee-1/overview','Committee room','See the next meeting, responsibilities and notices.','committees',icon,perspectiveUrl)+
    exampleLink('secretary','committee/committee-1/meetings','Meetings & records','Open the agenda, minutes and follow-up work.','meetings',icon,perspectiveUrl)+
    exampleLink('treasurer','committee/committee-1/finance','Treasurer desk','Inspect budgets, expense records and reconciliation.','treasury',icon,perspectiveUrl)+
    exampleLink('chair','constitution','Constitution builder','Explore the same working draft from the committee.','constitution',icon,perspectiveUrl)+'</div><p class="wm-note">Role examples contain fictional records and are read-only. Your signed-in identity stays the same.</p></section>';
  const recent=data.audit.slice(-3).reverse();
  const latest=recent.length?recent.map(r=>'<li><div><strong>'+esc(actionLabel(r.type))+'</strong><span>'+esc(accountName(data,r.actorId))+'</span></div><time>'+esc(dateText(r.at))+'</time></li>').join(''):'<li><p>No technical access changes recorded yet.</p></li>';
  const footer='<div class="wm-bottom-grid">'+card('Centre administration','<p>'+(ro?'This is the fictional Webmaster desk. Open an example above to inspect another part of the centre.':data.existingOwner?'Your existing owner account has working tools and technical administration in one place.':'Manage the accounts and permissions covered by your access.')+'</p><div class="wm-inline-links"><a href="#webmaster/accounts">Manage accounts</a><a href="#webmaster/permissions">Review access</a><a href="#webmaster/offices">Plan offices</a></div><p class="wm-note">Office appointments and membership admission have their own decisions.</p>')+card('Latest access changes','<ul class="wm-recent">'+latest+'</ul><a class="wm-text-link" href="#webmaster/audit">Open history →</a>')+'</div>';
  return metrics+working+tour+footer;
}
function accounts(data,ro){
  const body=data.accounts.map(a=>{
    const held=[...new Set(data.grants.filter(g=>g.accountId===a.id&&g.status==='active').map(g=>label(g.role)))];
    return row(accountName(data,a.id),[held.join(' · ')||(a.existingOwner?'Workspace owner':'No active access grants')],
      recordDetails('Account reference',[['Account',a.id],['Person record',a.personId]])+
      (!ro&&data.capabilities?.revoke&&a.id!==data.currentAccountId&&a.status==='active'&&!data.grants.some(g=>g.accountId===a.id&&g.role==='webmaster')?actionForm('access.disable-account',a.id,'Disable access'):''),a.status);
  }).join('')||'<p class="wm-empty">No accounts yet.</p>';
  return searchPanel('Accounts',body,'Role, account or status',data.accounts.length);
}
function permissions(data,ro){
  const body=data.grants.map(g=>row(label(g.role)+' · '+scopeName(data,g.scope),[accountName(data,g.accountId),'From '+dateText(g.startsAt)+' until '+dateText(g.endsAt)],
    '<details class="wm-record-details"><summary>Permissions and authority</summary><p class="wm-note">'+esc(g.permissions.length)+' permissions in this scope.</p><ul class="wm-permissions">'+g.permissions.map(x=>'<li>'+esc(x.replaceAll('.',' · '))+'</li>').join('')+'</ul><dl><div><dt>Authority</dt><dd>'+esc(g.authorityRef)+'</dd></div><div><dt>Grant reference</dt><dd>'+esc(g.id)+'</dd></div><div><dt>Account reference</dt><dd>'+esc(g.accountId)+'</dd></div></dl></details>'+
    (!ro&&data.capabilities?.revoke&&g.accountId!==data.currentAccountId&&g.status==='active'&&g.role!=='webmaster'?actionForm('access.revoke-grant',g.id,'Revoke access'):''),g.status)).join('')||'<p class="wm-empty">No separate access grants yet. Your existing private owner access still works.</p>';
  return searchPanel('Access grants',body,'Role, scope or permission',data.grants.length);
}
function offices(data,ro){
  const form=!ro&&data.capabilities?.reserve?card('Plan an office','<p>Reserve a role and record why it will be needed. A reservation does not appoint or invite anyone.</p><form data-webmaster-reserve class="form-grid wm-reserve"><label class="field">Office<select name="role">'+Object.keys(officeScopes).map(r=>'<option value="'+esc(r)+'">'+esc(label(r))+'</option>').join('')+'</select></label><label class="field">Where<select name="scope" required></select></label><label class="field full">Reason<textarea name="reason" required maxlength="500"></textarea></label><div class="field full"><button type="submit" class="button">Save reservation</button></div></form>','wm-reserve-panel'):'';
  const body=data.reservations.map(r=>row(label(r.role)+' · '+scopeName(data,r.scope),['Planned '+dateText(r.createdAt),'By '+accountName(data,r.createdBy)],recordDetails('Reservation reference',[['Reference',r.id]])+(!ro&&data.capabilities?.reserve&&r.status==='reserved'?actionForm('access.cancel-reservation',r.id,'Cancel reservation'):''),r.status)).join('')||'<p class="wm-empty">No offices reserved yet.</p>';
  return (form?'<div class="wm-office-layout">'+form:'')+searchPanel('Office reservations',body,'Role or place',data.reservations.length)+(form?'</div>':'');
}
function views(icon,perspectiveUrl){
  const groups=[['Organising a committee',['chair','deputy','secretary','assistant-secretary','treasurer','committee']],['Joining and participating',['member','applicant']],['Review and administration',['reviewer','webmaster']]];
  return '<p class="wm-view-intro">Open a read-only example of the tools each role uses. The examples share fictional projects and committee records, so you can follow the same work between desks.</p>'+groups.map(([title,group])=>'<section class="wm-section"><h2>'+esc(title)+'</h2><div class="wm-tools wm-role-tools">'+group.filter(r=>roles.includes(r)).map(r=>toolLink(perspectiveUrl(r),label(r),roleDescriptions[r],roleIcons[r],icon,'Fictional example')).join('')+'</div></section>').join('');
}
function actionLabel(type){
  return ({'access.reserve':'Office reserved','access.cancel-reservation':'Reservation cancelled','access.revoke-grant':'Access revoked','access.disable-account':'Account access disabled'})[type]||label(type).replaceAll('.',' · ');
}
function audit(data){
  const body=data.audit.slice().reverse().map(r=>row(actionLabel(r.type),[dateText(r.at),'By '+accountName(data,r.actorId),r.reason],recordDetails('Change reference',[['Record',r.targetId],['Change',r.id]]))).join('')||'<p class="wm-empty">No technical access changes recorded yet.</p>';
  return searchPanel('Change history',body,'Action, person or reason',data.audit.length);
}
const pending=new Map();
export async function mountWebmaster(root,{api,readOnly,route,perspectiveUrl,icon,onSaved}){
  const data=await api('/api/access');
  if(location.hash!==route)return;
  const ro=Boolean(readOnly||data.readOnly);
  const tab=route.replace(/^#webmaster\/?/,'')||'overview';
  const selected=tabs.find(x=>x[0]===tab)||tabs[0];
  const descriptions={overview:'Keep the centre organised, manage access and explore how its tools fit together.',accounts:'See the accounts that can use this centre.',permissions:'Review what each account can access and where.',offices:'Prepare roles for people to take on later.',views:'Explore the centre through the people who use it.',audit:'Follow changes to technical access and the reasons behind them.'};
  const heading='<header class="wm-heading"><div><span class="eyebrow">Centre administration</span><h1>'+(selected[0]==='overview'?'Webmaster':'Webmaster <span>· '+esc(selected[1])+'</span>')+'</h1><p>'+esc(descriptions[selected[0]])+'</p></div>'+chip(ro?'Fictional · read-only':data.existingOwner?'Workspace owner':'Technical access')+'</header>';
  const nav='<nav class="wm-nav" aria-label="Webmaster tools">'+tabs.map(([key,title,image])=>'<a href="#webmaster/'+key+'"'+(selected[0]===key?' aria-current="page"':'')+'>'+(image?icon(image):'')+'<span>'+esc(title)+'</span></a>').join('')+'</nav>';
  const renderers={overview:()=>overview(data,icon,ro,perspectiveUrl),accounts:()=>accounts(data,ro),permissions:()=>permissions(data,ro),offices:()=>offices(data,ro),views:()=>views(icon,perspectiveUrl),audit:()=>audit(data)};
  root.innerHTML='<div class="webmaster-workspace">'+heading+nav+'<p class="wm-status" role="status" data-webmaster-status></p>'+renderers[selected[0]]()+'</div>';
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
        const option=document.createElement('option');option.value=JSON.stringify({kind,id:x.id});option.textContent=label(kind)+': '+scopeName(data,{kind,id:x.id});select.append(option);
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
