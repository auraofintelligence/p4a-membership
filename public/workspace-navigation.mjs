// Cloudflare serves both .html and extensionless entry points. The route, not
// a user-supplied role on an ordinary page, chooses the fictional workspace.
export function workspaceEntry(pathname,search=''){
 const query=new URLSearchParams(search);
 const webmaster=/\/webmaster(?:\.html)?\/?$/.test(pathname);
 const preview=/\/webmaster-role-preview(?:\.html)?\/?$/.test(pathname);
 return {webmaster,role:preview||webmaster&&query.get('view')==='fictional'?(query.get('role')||'webmaster'):null};
}
export function perspectivePath(role,{owner=false,fictionalOwnerView=false}={}){
 if(role==='actual')return owner||fictionalOwnerView?'/index.html#home':'/webmaster.html#webmaster';
 const target=role==='webmaster'?'webmaster':['chair','deputy','secretary','assistant-secretary','treasurer','committee','reviewer'].includes(role)?'committee/committee-1/overview':'home';
 return '/webmaster-role-preview.html?role='+encodeURIComponent(role)+(owner||fictionalOwnerView?'&view=fictional':'')+'#'+target;
}

const catalogueRoutes=new Set(['#tools','#webmaster','#webmaster/overview','#webmaster/views']);
const returnRoles=new Set(['webmaster','chair','deputy','secretary','assistant-secretary','treasurer','committee','reviewer','member','applicant']);
const toolCategories=new Set(['together','committee','learning','planning','knowledge']);
const workspaceRoutes=new Set(['home','tools','onboarding','training','projects','project','priority','people','groups','committee','nodes','campaigns','readiness','finance','merch','hours','gamify','transparency','resources','constitution','profile','webmaster']);
export const validCatalogueToken=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value);

function workspaceUrl(value,currentHref){
 try{
  if(typeof value!=='string'||value.length>2048)return null;
  const current=new URL(currentHref),url=new URL(value,current);
  if(!['http:','https:'].includes(current.protocol)||url.origin!==current.origin||url.username||url.password)return null;
  const base=current.pathname.replace(/(?:index\.html|webmaster(?:-role-preview)?(?:\.html)?)\/?$/,'').replace(/\/?$/,'/');
  const entries=['','index.html','webmaster','webmaster/','webmaster.html','webmaster.html/','webmaster-role-preview','webmaster-role-preview/','webmaster-role-preview.html','webmaster-role-preview.html/'];
  if(!entries.some(entry=>url.pathname===base+entry))return null;
  const entry=workspaceEntry(url.pathname,url.search);
  if(entry.role&&!returnRoles.has(entry.role))return null;
  const query=new URLSearchParams();
  if(entry.role&&url.searchParams.has('role'))query.set('role',entry.role);
  if(entry.role&&url.searchParams.get('view')==='fictional')query.set('view','fictional');
  const committee=url.searchParams.get('committee');
  if(committee&&/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(committee))query.set('committee',committee);
  url.search=query.toString();
  return url;
 }catch{return null;}
}

// Return links identify a known catalogue in this workspace, never an arbitrary URL.
export function cataloguePath(value,currentHref){
 const url=workspaceUrl(value,currentHref);
 return url&&catalogueRoutes.has(url.hash)?url.pathname+url.search+url.hash:null;
}

export function catalogueLaunchHref(value,currentHref,token){
 if(!validCatalogueToken(token))return null;
 const url=workspaceUrl(value,currentHref);
 if(!url||!workspaceRoutes.has(url.hash.slice(1).split('/')[0]))return null;
 url.searchParams.set('centreReturn',token);
 return url.pathname+url.search+url.hash;
}

export function sameWorkspaceDocument(value,currentHref){
 try{
  if(!workspaceUrl(value,currentHref))return false;
  const current=new URL(currentHref),target=new URL(value,current);
  if(target.pathname!==current.pathname)return false;
  for(const url of [current,target]){
   url.searchParams.delete('centreReturn');url.searchParams.delete('centreRestore');url.searchParams.sort();
  }
  return target.search===current.search;
 }catch{return false;}
}

export function catalogueReturnHref(record,currentHref,token){
 if(!validCatalogueToken(token)||!record||record.version!==1)return null;
 const path=cataloguePath(record.path,currentHref);
 if(!path)return null;
 const url=new URL(path,currentHref);url.searchParams.set('centreRestore',token);
 return url.pathname+url.search+url.hash;
}

export function catalogueSnapshot(value={}){
 value=value&&typeof value==='object'?value:{};
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 return {
  query:typeof value.query==='string'?value.query.slice(0,120):'',
  category:toolCategories.has(value.category)?value.category:'',
  scrollY:finite(value.scrollY)?Math.max(0,Math.min(2000000,Math.round(value.scrollY))):0,
  focus:typeof value.focus==='string'&&value.focus.length<=2048?value.focus:'',
 };
}

export function returnNavigation({currentHref,record,token}={}){
 const current=new URL(currentHref),route=current.hash.slice(1).split('/')[0]||'home';
 if(route==='home')return null;
 if(route==='tools')return {href:'#home',label:'Back to home',find:true};
 const href=catalogueReturnHref(record,currentHref,token);
 return {href:href||'#tools',label:href&&new URL(record.path,currentHref).hash!=='#tools'?'Back to Webmaster':'Back to all tools',home:'#home'};
}
