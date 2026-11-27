// Demo values only. Login is enforced by the root Pages middleware.
const OWNER='Geepesa01';
const networks=['M-PESA','Mixx by Yas','Airtel Money','HaloPesa'];
const fee=n=>n<=20000?500:n<=100000?1000:n<=500000?5000:n<=1000000?10000:15000;
const initial=()=>({income:0,balance:0,records:[],credits:[],touched:false});
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Robots-Tag':'noindex','Referrer-Policy':'strict-origin-when-cross-origin'}});
function fail(message,status=400){throw Object.assign(new Error(message),{status});}
function identifier(id){if(typeof id!=='string'||!/^[A-Za-z0-9-]{8,100}$/.test(id))fail('Ombi halina kitambulisho sahihi.');return id;}
function amount(n,min=0){if(!Number.isSafeInteger(n)||n<min||n>1e12)fail('Kiasi si sahihi.');return n;}
function code(records){const alphabet='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';let value;do{value='DH'+Array.from(crypto.getRandomValues(new Uint8Array(8)),x=>alphabet[x%36]).join('');}while(records.some(r=>r.code===value));return value;}
function completeDue(s,now){let changed=false;let mobile=s.records.filter(r=>r.status!=='pending').reduce((sum,r)=>sum+r.net,0);for(const r of s.records.filter(r=>r.status==='pending'&&r.readyAt<=now).sort((a,b)=>a.readyAt-b.readyAt)){mobile+=r.net;r.status='complete';r.time=new Date(r.readyAt).toISOString();r.mobileBalance=mobile;changed=true;}return changed;}
function importLegacy(v){
 if(!v||!Array.isArray(v.records)||v.records.length>3000)fail('Data ya zamani haijasomeka.');
 const income=amount(v.income),balance=amount(v.balance);if(balance>income)fail('Salio la zamani halilingani na mapato.');
 const seen=new Set();const records=v.records.map(r=>{identifier(r.id);if(seen.has(r.id))fail('Muamala umerudiwa.');seen.add(r.id);const n=amount(r.amount,6000),f=fee(n),net=n-f;if(r.fee!==f||r.net!==net||!networks.includes(r.network)||!Number.isFinite(Date.parse(r.time)))fail('Taarifa ya zamani si sahihi.');return {id:r.id,code:/^DH[A-Z0-9]{8}$/.test(r.code)?r.code:code([]),amount:n,fee:f,net,network:r.network,time:r.time,readyAt:Number.isFinite(r.readyAt)?r.readyAt:Date.parse(r.time),status:r.status==='pending'?'pending':'complete',...(Number.isSafeInteger(r.mobileBalance)?{mobileBalance:r.mobileBalance}:{})};});
 if(records.reduce((sum,r)=>sum+r.amount,0)!==income-balance)fail('Mapato na historia ya zamani havilingani. Data yako ya kifaa haijafutwa.');
 return {income,balance,records,credits:[],touched:true};
}
async function process(db,op){
 await db.prepare('CREATE TABLE IF NOT EXISTS paidchat_demo_wallet (owner TEXT PRIMARY KEY, state TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 0)').run();
 await db.prepare('INSERT OR IGNORE INTO paidchat_demo_wallet(owner,state,version) VALUES (?, ?, 0)').bind(OWNER,JSON.stringify(initial())).run();
 for(let attempt=0;attempt<8;attempt++){
  const row=await db.prepare('SELECT state,version FROM paidchat_demo_wallet WHERE owner=?').bind(OWNER).first();let s=JSON.parse(row.state),changed=completeDue(s,Date.now()),record;
  if(op){
   if(op.type==='import'){
    if(!s.touched&&s.income===0&&s.records.length===0){s=importLegacy(op.wallet);completeDue(s,Date.now());changed=true;}
   }else if(op.type==='credit'){
    const id=identifier(op.id),value=amount(op.amount,2600);if(value>200000||value%2600)fail('Mapato ni sahihi.');
    if(!s.credits.includes(id)){s.credits.push(id);s.income+=value;s.balance+=value;s.touched=true;changed=true;}
   }else if(op.type==='withdraw'){
    const id=identifier(op.id);record=s.records.find(r=>r.id===id);
    if(!record){const n=amount(op.amount,6000);if(!networks.includes(op.network))fail('Chagua mtandao sahihi.');if(s.balance<n)fail('Salio la majaribio halitoshi.');if(s.records.some(r=>r.status==='pending'))fail('Subiri withdrawal iliyopo ikamilike.',409);const now=Date.now(),f=fee(n);record={id,code:code(s.records),amount:n,fee:f,net:n-f,network:op.network,time:new Date(now).toISOString(),readyAt:now+5000,status:'pending'};s.balance-=n;s.records.unshift(record);s.touched=true;changed=true;}
   }else if(op.type==='complete'){
    record=s.records.find(r=>r.id===identifier(op.id));if(!record)fail('Muamala haujapatikana.',404);
   }else fail('Ombi halitambuliki.');
  }
  if(s.balance<0||!Number.isSafeInteger(s.income)||!Number.isSafeInteger(s.balance))fail('Salio si sahihi.',409);
  if(changed){const encoded=JSON.stringify(s);if(encoded.length>800000)fail('Historia imefikia kiwango cha kuhifadhi. Wasiliana na msimamizi.',409);const result=await db.prepare('UPDATE paidchat_demo_wallet SET state=?,version=version+1 WHERE owner=? AND version=?').bind(encoded,OWNER,row.version).run();if(!result.meta?.changes)continue;}
  return {wallet:{income:s.income,balance:s.balance,records:s.records},canImport:!s.touched,record:record?s.records.find(r=>r.id===record.id):undefined};
 }
 fail('Data imebadilika kwenye kifaa kingine. Jaribu tena.',409);
}
export async function onRequest({request,env}){
 if(!env.PAIDCHAT_DB)return json({error:'Database haijaunganishwa. Ongeza D1 binding PAIDCHAT_DB kwenye Cloudflare kisha deploy tena.'},503);
 try{
  let op;
  if(request.method==='POST'){
   if(request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'Forbidden'},403);
   if(!request.headers.get('Content-Type')?.includes('application/json'))return json({error:'JSON inahitajika.'},415);
   const text=await request.text();if(text.length>800000)return json({error:'Data imezidi ukubwa unaoruhusiwa.'},413);
   try{op=JSON.parse(text);}catch{return json({error:'JSON si sahihi.'},400);}if(!op||typeof op!=='object')return json({error:'Ombi si sahihi.'},400);
  }else if(request.method!=='GET')return json({error:'Method not allowed'},405);
  return json(await process(env.PAIDCHAT_DB,op));
 }catch(e){return json({error:e.status?e.message:'Imeshindikana kuhifadhi kwenye database. Jaribu tena; data ya kifaa haijafutwa.'},e.status||503);}
}
