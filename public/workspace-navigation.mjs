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
