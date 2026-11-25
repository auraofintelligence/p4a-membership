import { accessTokenFromRequest, verifyAccessToken } from './auth.mjs';
import { AppError } from './errors.mjs';
import { json, securityHeaders } from './http.mjs';
import { fixtureOverview, fixtureProjection, fixtureView } from './webmaster-preview.mjs';
import { createShowcaseState } from './webmaster-preview.mjs';
import { publicProjection, gamifyProjection } from './domain.mjs';

const headers = {'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'};
function configured(env,origin) {
  return env.SHOWCASE_MODE === 'isolated' && env.SHOWCASE_ORIGIN === origin &&
    typeof env.SHOWCASE_ACCESS_AUD === 'string' && env.SHOWCASE_ACCESS_AUD.length > 0 &&
    !env.ACCESS_AUD && !env.PILOT_DB && !env.APPLICATIONS && !env.WORKSPACE_URL && !env.WORKSPACE_SECRET && !env.PILOT_MODE;
}
async function invited(request,env) {
  let subjects;
  try { subjects = JSON.parse(env.SHOWCASE_SUBJECTS); } catch { return false; }
  if (!Array.isArray(subjects) || !subjects.length || !subjects.every(x => typeof x === 'string' && x.length > 0 && x.length <= 512) || new Set(subjects).size !== subjects.length) return false;
  const claims = await verifyAccessToken(accessTokenFromRequest(request),{ACCESS_ISSUER:env.SHOWCASE_ACCESS_ISSUER,ACCESS_AUD:env.SHOWCASE_ACCESS_AUD});
  const audiences = Array.isArray(claims?.aud) ? claims.aud : [claims?.aud];
  return claims?.type === 'app' && audiences.length === 1 && audiences[0] === env.SHOWCASE_ACCESS_AUD && subjects.includes(claims.sub);
}
export default {
  async fetch(request,env) {
    const url = new URL(request.url), path = url.pathname;
    // This Worker never receives or opens a live store. A configuration mix-up,
    // missing/expired demo identity, or wrong audience fails closed.
    if (!configured(env,url.origin)) return json({error:'The isolated Webmaster demonstration is not configured.'},503,headers);
    if (!await invited(request,env)) return json({error:'Sign in with an invited demonstration account.'},401,headers);
    if (!['GET','HEAD'].includes(request.method)) return json({error:'This is a view-only demonstration.'},403,headers);
    try {
      if (path === '/api/access' && request.method === 'GET') return json(fixtureOverview(),200,headers);
      if (path === '/api/access/preview' && request.method === 'GET') return json(fixtureView(url.searchParams.get('role') || 'webmaster',url.searchParams),200,headers);
      if (path === '/api/bootstrap' && request.method === 'GET') return json(fixtureProjection('webmaster'),200,headers);
      if (path === '/api/public' && request.method === 'GET') return json(publicProjection(createShowcaseState(),'showcase'),200,headers);
      if (path === '/api/gamify' && request.method === 'GET') return json(gamifyProjection(createShowcaseState(),{period:url.searchParams.get('period') ?? 'all',groupId:url.searchParams.get('groupId') ?? '',projectId:url.searchParams.get('projectId') ?? ''},'showcase'),200,headers);
      if (path.startsWith('/api/')) return json({error:'This route is unavailable in the demonstration.'},403,headers);
      if (!env.ASSETS) return json({error:'The demonstration interface is unavailable.'},503,headers);
      const destination = path === '/' ? new Request(new URL('/webmaster.html',url),request) : request;
      const response = await env.ASSETS.fetch(destination);
      const secured = new Response(response.body,response);
      for (const [key,value] of Object.entries({...securityHeaders,...headers})) secured.headers.set(key,value);
      return secured;
    } catch(error) {
      return json({error:error instanceof AppError ? error.message : 'The demonstration is unavailable.'},error instanceof AppError ? error.status : 503,headers);
    }
  },
};
