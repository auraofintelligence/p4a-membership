const $ = selector => document.querySelector(selector);
const roles = ['webmaster','chair','deputy','secretary','assistant-secretary','treasurer','committee','reviewer','member','applicant'];
const officeScopes = {webmaster:['system'],chair:['group','constitution','committee'],deputy:['group','constitution','committee'],secretary:['group','constitution','committee'],'assistant-secretary':['group','constitution','committee'],treasurer:['group','committee'],committee:['group','constitution','committee'],reviewer:['group','constitution','committee']};
let register, pending = new Map(), busy = false;
const node = (tag, text, className) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (className) el.className = className; return el; };
const status = text => { $('#desk-status').textContent = text; };
async function api(method = 'GET', data) {
  const response = await fetch('/api/access',{method,credentials:'same-origin',headers:data ? {'Content-Type':'application/json'}:{},...(data ? {body:JSON.stringify(data)}:{})});
  const result = await response.json();
  if (!response.ok) { const error = new Error(result.error || 'Access request failed.'); error.status = response.status; throw error; }
  return result;
}
function fillScopes() {
  const role = $('#reserve-form [name=role]').value, select = $('#reserve-form [name=scope]');
  select.replaceChildren();
  for (const kind of officeScopes[role] || []) {
    const rows = register.scopes[kind === 'group' ? 'groups' : kind === 'constitution' ? 'constitutions' : kind === 'committee' ? 'committees' : 'system'];
    for (const row of rows) { const option = node('option',kind+': '+(row.name || row.title)); option.value = JSON.stringify({kind,id:row.id}); select.append(option); }
  }
  $('#reserve-form button').disabled = !select.options.length || busy;
}
function listPanel(title, rows, describe, action) {
  const panel = node('section',undefined,'panel'); panel.append(node('h2',title));
  if (!rows.length) panel.append(node('p','No records.'));
  for (const row of rows) {
    const article = node('article',undefined,'subheading');
    for (const line of describe(row)) article.append(node('p',line));
    if (!register.readOnly && action) {
      const spec = action(row);
      if (spec) {
        const form = node('form'), label = node('label','Reason','field'), reason = node('textarea');
        reason.name = 'reason'; reason.required = true; reason.maxLength = 500; label.append(reason);
        const submit = node('button',spec.label,'button secondary'); submit.type = 'submit';
        form.append(label,submit); form.addEventListener('submit',event => {event.preventDefault(); void change(spec.type,{id:row.id,reason:reason.value},spec.label+'?');});
        article.append(form);
      }
    }
    panel.append(article);
  }
  return panel;
}
function render() {
  const demo = register.readOnly === true;
  status(demo ? 'ISOLATED VIEW-ONLY DEMONSTRATION. All records are fictional.' : 'AUTHORISED TECHNICAL WORKSPACE. Revision '+register.revision+'. No appointments or invitations are enabled.');
  $('#role-preview').hidden = false;
  $('#preview-links').replaceChildren(...roles.map(role=>{ const a=node('a',role.replaceAll('-',' '),'button secondary'); a.href='/webmaster-role-preview.html?role='+encodeURIComponent(role)+'#home'; return a; }));
  $('#reservation-panel').hidden = demo || !register.capabilities?.reserve;
  const roleSelect=$('#reserve-form [name=role]');
  roleSelect.replaceChildren(...Object.keys(officeScopes).map(role=>{const option=node('option',role.replaceAll('-',' '));option.value=role;return option;}));
  fillScopes();
  const view=$('#register');view.hidden=false;
  view.replaceChildren(
    listPanel('Accounts (technical metadata)',register.accounts,row=>['Account '+row.id,'Person '+row.personId,'Status: '+row.status],row=>register.capabilities?.revoke&&row.id!==register.currentAccountId&&row.status==='active'&&!register.grants.some(g=>g.accountId===row.id&&g.role==='webmaster')?{label:'Disable account access',type:'access.disable-account'}:null),
    listPanel('Scoped access grants',register.grants,row=>[row.role+' · '+row.scope.kind+': '+row.scope.id,row.accountId+' · '+row.status,'From '+row.startsAt+' until '+row.endsAt,'Authority reference: '+row.authorityRef+(row.delegatedFrom?' · delegated from '+row.delegatedFrom:''),'Permissions: '+row.permissions.join(', ')],row=>register.capabilities?.revoke&&row.accountId!==register.currentAccountId&&row.status==='active'&&row.role!=='webmaster'?{label:'Revoke technical grant',type:'access.revoke-grant'}:null),
    listPanel('Prospective office reservations',register.reservations,row=>[row.role+' · '+row.scope.kind+': '+row.scope.id,'Status: '+row.status,'Created by '+row.createdBy+' at '+row.createdAt],row=>register.capabilities?.reserve&&row.status==='reserved'?{label:'Cancel reservation',type:'access.cancel-reservation'}:null),
    listPanel('Technical audit (latest 100)',register.audit,row=>[row.type+' · '+row.targetId,'Actual actor '+row.actorId+' · '+row.at,row.reason])
  );
}
async function load() {
  try { register = await api(); render(); }
  catch(error) { register=null; $('#role-preview').hidden=true; $('#reservation-panel').hidden=true; $('#register').hidden=true; status(error.message); }
}
async function change(type,data,confirmText) {
  if (busy || !register || register.readOnly || !window.confirm(confirmText+' This changes technical access only.')) return;
  busy = true; const fingerprint = JSON.stringify({type,data});
  const id = pending.get(fingerprint) || crypto.randomUUID(); pending.set(fingerprint,id);
  try {
    await api('POST',{id,type,data,revision:register.revision});
    pending.delete(fingerprint); await load(); status('Confirmed saved. '+$('#desk-status').textContent);
  } catch(error) { if(error.status===409) await load(); status(error.message+' No successful change has been confirmed.'); }
  finally { busy=false; if(register) fillScopes(); }
}
$('#reload').addEventListener('click',load);
$('#reserve-form [name=role]').addEventListener('change',fillScopes);
$('#reserve-form').addEventListener('submit',event=>{
  event.preventDefault();const data=new FormData(event.currentTarget);
  void change('access.reserve',{role:data.get('role'),scope:JSON.parse(data.get('scope')),reason:data.get('reason')},'Reserve this proposed office?');
});
await load();
