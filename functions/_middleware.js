// Cloudflare Pages: protect dashboard HTML and every dashboard asset on the server.
const USERNAME = 'Geepesa01';
const COOKIE = '__Secure-paidchat_demo_session';
const TTL = 8 * 60 * 60;
const enc = new TextEncoder();
const common = {'Cache-Control':'private, no-store, max-age=0','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY'};
const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function page(message='',status=200){
 return new Response(`<!doctype html><html lang="sw"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Ingia | Geepesa01 </title><style>:root{color-scheme:dark;font-family:system-ui,sans-serif}*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;background:radial-gradient(ellipse at top,#a6c4ff,#8fa9d9 65%);color:#f0f7ff;padding:22px}main{width:min(100%,410px);padding:28px;background:#16243d;border:1px solid #4f71b1;border-radius:23px;box-shadow:0 20px 60px #0005}.logo{font-size:27px;color:#d5e6ff;font-weight:800}.logo span{color:#a6c4ff}h1{font-size:23px;margin:20px 0 8px}p{color:#d5e6ff;line-height:1.55}label{display:grid;gap:8px;margin-top:17px;font-weight:650}input{width:100%;font:inherit;background:#16243d;border:1px solid #618afc;color:#fff;border-radius:11px;padding:13px}input:focus{outline:2px solid #a6c4ff;outline-offset:2px}button{width:100%;font:inherit;font-weight:750;padding:13px;margin-top:23px;background:linear-gradient(110deg,#7894fa,#618afc);border:1px solid #a6c4ff;color:#091b37;border-radius:12px;cursor:pointer}.demo{display:inline-block;font-size:11px;background:#16243d;padding:4px 8px;border-radius:6px;color:#d5e6ff}.error{color:#c2d9fc;font-size:14px}.note{font-size:12px;margin-bottom:0}</style></head><body><main><div class="logo">Paid<span>chat</span></div><p>Ingia kufungua dashboard yako.</p>${message?`<p class="error" role="alert">${escape(message)}</p>`:''}<form method="post" action="/dashboard/auth/login"><label>Username<input name="username" autocomplete="username" required maxlength="80"></label><label>Password<input type="password" name="password" autocomplete="current-password" required maxlength="1024"></label><button type="submit">Ingia kwenye dashboard</button></form></main></body></html>`,{status,headers:{...common,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"}});
}
function redirect(location,cookie){return new Response(null,{status:303,headers:{...common,Location:location,...(cookie?{'Set-Cookie':cookie}:{})}})}
function configured(env){return typeof env.DASHBOARD_PASSWORD==='string' && env.DASHBOARD_PASSWORD.length>=12 && typeof env.DASHBOARD_SESSION_SECRET==='string' && env.DASHBOARD_SESSION_SECRET.length>=32;}
async function key(env){return crypto.subtle.importKey('raw',enc.encode(env.DASHBOARD_SESSION_SECRET+'\0'+env.DASHBOARD_PASSWORD),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
const hex = bytes => Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join('');
async function token(env){const payload=`${USERNAME}.${Math.floor(Date.now()/1000)+TTL}.${crypto.randomUUID()}`;return payload+'.'+hex(await crypto.subtle.sign('HMAC',await key(env),enc.encode(payload)));}
async function valid(request,env){
 const raw=(request.headers.get('Cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
 if(!raw||raw.length>250)return false;const parts=raw.split('.');if(parts.length!==4||parts[0]!==USERNAME||!/^\d+$/.test(parts[1])||!/^[a-f0-9]{64}$/.test(parts[3]))return false;
 const expiry=Number(parts[1]),now=Math.floor(Date.now()/1000);if(expiry<=now||expiry>now+TTL)return false;
 const signature=Uint8Array.from(parts[3].match(/../g),s=>parseInt(s,16));return crypto.subtle.verify('HMAC',await key(env),signature,enc.encode(parts.slice(0,3).join('.')));
}
async function equal(a,b){const [x,y]=await Promise.all([a,b].map(s=>crypto.subtle.digest('SHA-256',enc.encode(s))));const u=new Uint8Array(x),v=new Uint8Array(y);let diff=0;for(let i=0;i<u.length;i++)diff|=u[i]^v[i];return diff===0;}
export async function onRequest(context){
 const {request,env}=context,url=new URL(request.url),path=url.pathname;
 if(path!=='/dashboard'&&!path.startsWith('/dashboard/'))return context.next();
 // Fail closed: no missing-secret configuration exposes the demo files.
 if(!configured(env))return page('Dashboard bado haijawezeshwa. Weka secrets kwenye Cloudflare kisha deploy tena.',503);
 if(request.method==='POST'){
  if(request.headers.get('Origin')!==url.origin)return new Response('Forbidden',{status:403,headers:common});
  if(path==='/dashboard/api/wallet'){if(!await valid(request,env))return new Response(JSON.stringify({error:'Ingia tena kwenye dashboard.'}),{status:401,headers:{...common,'Content-Type':'application/json'}});return context.next();}
  if(path==='/dashboard/auth/logout')return redirect('/dashboard/login',`${COOKIE}=; Path=/dashboard; Max-Age=0; HttpOnly; Secure; SameSite=Strict`);
  if(path!=='/dashboard/auth/login')return new Response('Method not allowed',{status:405,headers:common});
  if(Number(request.headers.get('Content-Length')||0)>4096)return page('Ombi limezidi ukubwa unaoruhusiwa.',413);
  const body=await request.text();if(body.length>4096)return page('Ombi limezidi ukubwa unaoruhusiwa.',413);
  const data=new URLSearchParams(body),user=data.get('username')||'',pass=data.get('password')||'';
  const ok=await equal(user+'\0'+pass,USERNAME+'\0'+env.DASHBOARD_PASSWORD);
  if(!ok)return page('Username au password si sahihi.',401);
  return redirect('/dashboard/',`${COOKIE}=${await token(env)}; Path=/dashboard; Max-Age=${TTL}; HttpOnly; Secure; SameSite=Strict`);
 }
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:common});
 const authenticated=await valid(request,env);
 if(path==='/dashboard/login')return authenticated?redirect('/dashboard/'):page();
 if(!authenticated){if(path==='/dashboard/api/wallet')return new Response(JSON.stringify({error:'Ingia tena kwenye dashboard.'}),{status:401,headers:{...common,'Content-Type':'application/json'}});return redirect('/dashboard/login');}
 if(path==='/dashboard')return redirect('/dashboard/');
 if(path.startsWith('/dashboard/auth/'))return new Response('Not found',{status:404,headers:common});
 const original=await context.next(),response=new Response(original.body,original);
 for(const [k,v]of Object.entries(common))response.headers.set(k,v);
 return response;
}
