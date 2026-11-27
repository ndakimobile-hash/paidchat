const byId = id => document.getElementById(id);
const modal = byId('modal');
const panel = byId('panel');
const chatNotice = byId('chat-notice');
const grid = byId('profiles');
const nav = byId('nav');
const registrationUrl = 'https://furusaweb.com/page/reg-promo.php?promo=6932';
const exchangeRate = 2600; // Fixed illustrative rate for this demo.
const money = value => 'TZS ' + value.toLocaleString('en-TZ');
const countryNames = new Intl.DisplayNames(['sw'], {type:'region'});
const skills = ['IT', 'Uhandisi', 'Ubunifu', 'Upishi', 'Upigaji picha', 'Uandishi', 'Uchoraji', 'Ualimu', 'Muziki', 'Utalii', 'Kilimo', 'Usanifu'];
const prompts = [
  ['chair', 'I am sitting on a chair', 'kiti'],
  ['water', 'I am drinking water', 'maji'],
  ['book', 'I am reading a book', 'kitabu'],
  ['market', 'I am going to the market', 'soko'],
  ['friend', 'My friend is here', 'rafiki'],
  ['window', 'Please open the window', 'dirisha']
];
const profiles = demoRoster.map(({firstName, lastName, country}, i) => ({
  name: firstName + ' ' + lastName,
  country: countryNames.of(country),
  flag: 'flags/' + country + '.png',
  portrait: 'portraits/' + i + '.webp',
  skill: skills[i % skills.length],
  prompt: prompts[i % prompts.length],
  options: [[5, 3 + i % 4], [25, 15 + i % 9], [50, 45 + i % 13]]
}));
let offset = 0;
let installEvent;
let session;
let sessionTimer;
let typingTimer;
let renderPending = false;
let installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

function renderProfiles() {
  const typing = Math.floor(Math.random() * 20);

  grid.innerHTML = Array.from({length:20}, (_, index) => {
    const id = (offset + index) % profiles.length;
    const profile = profiles[id];

    return `<article class="card">
      <div class="profile-head"><img class="avatar portrait" src="${profile.portrait}" width="44" height="44" alt="" loading="lazy"><div><strong>${profile.name}</strong><div class="meta"><img class="country-flag" src="${profile.flag}" width="22" height="16" alt=""> ${profile.country} · ${profile.skill}</div></div></div>
      <span class="status"><i></i>Online</span>
      <span class="typing">${index === typing ? '<em>typing…</em> · ' : ''}</span>
      <select aria-label="Muda na malipo ya  ${profile.name}">${profile.options.map(([minutes, usd], n) => `<option value="${n}">Dakika ${minutes} · $${usd} ≈ ${money(usd * exchangeRate)}</option>`).join('')}</select>
      <button class="primary start-chat" data-profile="${id}" aria-label="Anza Chat na ${profile.name}"><span class="start-icon" aria-hidden="true">💬</span> Anza Kuchat</button>
    </article>`;
  }).join('');
  const typingId = (offset + typing) % profiles.length;
  byId('typing-notices').innerHTML = `<button class="typing-notice" data-profile="${typingId}" type="button"><span class="typing-dots" aria-hidden="true">•••</span><span><strong>${profiles[typingId].name}</strong> <em>anaandika…</em></span></button>`;
  renderPending = false;
}

const dateFormatter = new Intl.DateTimeFormat('sw-TZ', {
  day:'numeric', month:'short', year:'numeric', timeZone:'Africa/Dar_es_Salaam'
});
const timeFormatter = new Intl.DateTimeFormat('sw-TZ', {
  hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23', timeZone:'Africa/Dar_es_Salaam'
});
function updateDateTime() {
  const now = new Date();
  const display = byId('datetime');
  display.dateTime = now.toISOString();
  display.textContent = dateFormatter.format(now) + ' · ' + timeFormatter.format(now);
}

function show(title, content) {
  if (chatNotice.open) chatNotice.close();
  byId('modal-title').textContent = title;
  panel.innerHTML = content;
  nav.hidden = true;
  byId('menu').setAttribute('aria-expanded', 'false');
  if (!modal.open) modal.showModal();
}

const formLink = `<a class="action primary" href="${registrationUrl}" target="_blank" rel="noopener noreferrer">JAZA FOMU HAPA</a>`;
byId('withdraw-register').href = registrationUrl;
byId('withdraw-home').onclick = () => {
  byId('withdraw-notice').close();
  window.scrollTo(0, 0);
};
const formNote = '<p>Fanya mazoezi ya mazungumzo ya Kiswahili.</p>';
byId('chat-notice-actions').innerHTML = formLink;
byId('dismiss-chat-notice').onclick = byId('resume-chat').onclick = () => chatNotice.close();

const screens = {
  form: ['Jaza fomu ya mfumo', formNote + '<div class="actions">' + formLink + '</div>'],
  how: ['Namna mfumo unavyofanya kazi', '<p>Chagua Mzungu wa kuchat nae, kisha chagua muda na uanze chat.</p><p>Viwango vya TZS ni  USD 1 = TZS 2,600.</p>'],
  faq: ['Maswali ya kawaida', '<p>Wasifu, hali ya online, chat na salio ni vya majaribio.</p>'],
  channel: ['Jiunge Channel', '<div class="contact-card channel-card"><strong>◉ WhatsApp Channel</strong><p>Jiunge na channel utapata taarifa zaidi za mfumo.</p><a class="gold-action" href="https://whatsapp.com/channel/0029Vb9luCJJZg47Bhvlbw2O" target="_blank" rel="noopener noreferrer">Jiunge Channel</a></div>'],
  sms: ['Tuma SMS', '<div class="contact-card"><strong>✉ PaidChat · 0762788833</strong><p>Wasiliana na msaidizi wa mfumo kwa kubonyeza👇.</p><a class="action gold-action" href="sms:+255762788833">Tuma Ujumbe</a></div>'],
  help: ['Huduma kwa Wateja', '<div class="actions"><a class="action wa" href="https://wa.me/255766716447">WhatsApp · 0766716447</a><a class="action sms" href="sms:+255762788833">SMS · 0762788833</a></div>']
};

function appendMessage(message, mine = false) {
  const thread = byId('thread');
  const bubble = document.createElement('div');
  bubble.className = mine ? 'bubble mine' : 'bubble';
  bubble.textContent = message;
  thread.append(bubble);
  thread.scrollTop = thread.scrollHeight;
}

function startChat(profile, option) {
  const [minutes, usd] = profile.options[option];
  session = {profile, usd, replies:0, finished:false, end:Date.now() + minutes * 60000};
  show(profile.name + ' · ', `<p class="practice-note">Mazungumzo ya mazoezi</p><p class="meta">${profile.country} · ${profile.skill} · $${usd} ≈ ${money(usd * exchangeRate)} · <span id="clock"></span></p>
    <div id="thread" class="thread" role="log" aria-live="polite"></div>
    <p id="chat-typing" class="typing" role="status"></p>
    <form id="compose" class="compose">
      <input id="message" maxlength="500" required placeholder="Andika ujumbe…" aria-label="Ujumbe">
      <button type="submit" class="primary send-message" aria-label="Tuma ujumbe" title="Tuma ujumbe">
        <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 9.7 14.3M22 2l-7.8 20-4.5-7.7L2 9.8 22 2Z"/></svg>
      </button>
    </form>
    <div id="chat-locked" class="chat-locked" hidden>
      <p> · Ili kuendelea, ni lazima ujaze fomu na uwe na akaunti hai. Hili ni onyesho la hatua ya usajili.</p>
      ${formLink}
    </div>
    <button id="finish" class="finish-practice" type="button" hidden>Ondoka</button>`);
  const heading = byId('modal-title');
  const flag = document.createElement('img');
  flag.className = 'country-flag';
  flag.src = profile.flag;
  flag.alt = profile.country;
  const status = document.createElement('span');
  status.className = 'status chat-online';
  status.innerHTML = '<i></i> Online';
  heading.replaceChildren(document.createTextNode(profile.name + ' '), flag, status);
  const [word] = profile.prompt;
  const typing = byId('chat-typing');
  const send = byId('compose').querySelector('button');
  typing.innerHTML = '<em>typing…</em> · ';
  send.disabled = true;
  typingTimer = setTimeout(() => {
    appendMessage(`Habari! Naitwa ${profile.name}. Ningependa kujifunza Kiswahili. Neno “${word}” linaitwaje kwa Kiswahili?`);
    typing.textContent = '';
    send.disabled = false;
  }, 800);
  byId('compose').addEventListener('submit', event => {
    event.preventDefault();
    const input = byId('message');
    const message = input.value.trim();
    if (!message || send.disabled || session.finished) return;
    appendMessage(message, true);
    session.replies += 1;
    input.value = '';
    send.disabled = true;
    typing.textContent = 'Anaandika…';
    const currentSession = session;
    typingTimer = setTimeout(() => {
      if (session !== currentSession || session.finished) return;
      const replies = ['Asante! Unaweza kunipa mfano mwingine kwa Kiswahili?', 'Nimeelewa. Neno hili linatumikaje kwenye sentensi?', 'Nashukuru kwa kunifundisha. Tuendelee na maneno mengine.', 'Unaweza kueleza hilo kwa sentensi fupi?'];
      appendMessage(replies[(session.replies - 1) % replies.length]);
      typing.textContent = '';
      send.disabled = false;
    }, 850);
  });
  byId('chat-locked').remove();
  byId('finish').remove();
  function tick() {
    const seconds = Math.max(0, Math.ceil((session.end - Date.now()) / 1000));
    byId('clock').textContent = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
    if (!seconds) {
      clearInterval(sessionTimer);
      if (session.replies) finishSession();
      else {clearTimeout(typingTimer);show('Muda umeisha ·', '<p>Fungua chat nyingine ili kuanza kuchat.</p>');}
    }
  }
  tick();
  sessionTimer = setInterval(tick, 500);
}

grid.addEventListener('click', event => {
  const button = event.target.closest('[data-profile]');
  if (button) startChat(profiles[Number(button.dataset.profile)], Number(button.closest('.card').querySelector('select').value));
});
byId('typing-notices').addEventListener('click', event => {
  const button = event.target.closest('[data-profile]');
  if (button) startChat(profiles[Number(button.dataset.profile)], 0);
});
grid.addEventListener('focusout', () => setTimeout(() => {
  if (renderPending && !modal.open && !grid.contains(document.activeElement)) renderProfiles();
}, 0));
byId('menu').onclick = () => {
  nav.hidden = !nav.hidden;
  byId('menu').setAttribute('aria-expanded', String(!nav.hidden));
};
byId('close').onclick = () => modal.close();
modal.addEventListener('close', () => {
  clearInterval(sessionTimer);
  clearTimeout(typingTimer);
  session = undefined;
});
nav.querySelector('a').onclick = () => {
  nav.hidden = true;
  byId('menu').setAttribute('aria-expanded', 'false');
};
document.querySelectorAll('[data-open]').forEach(button => button.onclick = () => {
  const key = button.dataset.open;
  if (key === 'records') return showRecords();
  if (key === 'active') return show('Active Account✅ ·', '<p>Hi, Geepesa01. Akaunti hii inakupa ufikiaji wa mazungumzo na salio la majaribio.</p>');
  if (key !== 'withdraw') return show(...screens[key]);
  nav.hidden = true;
  byId('menu').setAttribute('aria-expanded', 'false');
  showWithdrawal();
});

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installEvent = event;
});
window.addEventListener('appinstalled', () => {
  installed = true;
  installEvent = undefined;
});
document.querySelectorAll('.install').forEach(button => button.onclick = async () => {
  if (installed) return show('Install App', '<p>PaidChat tayari imesakinishwa.</p>');
  if (installEvent) {
    const prompt = installEvent;
    installEvent = undefined;
    await prompt.prompt();
    return;
  }
  show('Install App', '<p>Fungua PaidChat kwenye HTTPS. Kwenye Chrome ya Android, fungua menyu ⋮ kisha chagua <strong>Install app</strong> au <strong>Add to Home screen</strong>. Kwenye Safari ya iPhone, chagua <strong>Share</strong> kisha <strong>Add to Home Screen</strong>.</p>');
});
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js', {
    updateViaCache: 'none'
  }).then(reg => reg.update()).catch(console.warn);
}
updateWallet();
updateDateTime();
setInterval(updateDateTime, 1000);
renderProfiles();
setInterval(() => {
  if (modal.open) return;
  offset = (offset + 20) % profiles.length;
  if (grid.contains(document.activeElement)) renderPending = true;
  else renderProfiles();
}, 10000);

const transactionNotice = byId('transaction-notice');
let noticeTimer;
let audioContext;

function enableNotificationSound() {
  try {
    audioContext ??= new AudioContext();
    return navigator.userActivation?.isActive || audioContext.state === 'running'
      ? audioContext.resume()
      : Promise.resolve();
  } catch {
    return Promise.reject();
  }
}

const audioUnlockEvents = ['click', 'touchend', 'keydown'];
function unlockNotificationSound() {
  enableNotificationSound().then(() => {
    if (audioContext.state !== 'running') return;
    audioUnlockEvents.forEach(event => document.removeEventListener(event, unlockNotificationSound, true));
  }).catch(() => {});
}
audioUnlockEvents.forEach(event => document.addEventListener(event, unlockNotificationSound, true));
unlockNotificationSound();

function playNotificationSound() {
  if (audioContext?.state !== 'running') return;
  [880, 1175].forEach((frequency, index) => {
    const start = audioContext.currentTime + index * 0.12;
    const tone = audioContext.createOscillator();
    const volume = audioContext.createGain();
    tone.frequency.value = frequency;
    volume.gain.setValueAtTime(0.11, start);
    volume.gain.exponentialRampToValueAtTime(0.001, start + 0.17);
    tone.connect(volume).connect(audioContext.destination);
    tone.start(start);
    tone.stop(start + 0.18);
  });
}

byId('dismiss-transaction').onclick = () => { transactionNotice.hidden = true; };



function readLegacyWallet(){try{return JSON.parse(localStorage.getItem('paidchat-demo-wallet-v1'));}catch{return null;}}
var wallet,cloudReady;
function loadWallet(){return wallet||{income:0,balance:0,records:[]};}
function updateWallet(){byId('income').textContent=cloudReady?money(wallet.income):'Inapakia…';byId('balance').textContent=cloudReady?money(wallet.balance):'Inapakia…';}
function saveWallet(){try{localStorage.setItem('paidchat-demo-cloud-cache-v2',JSON.stringify(wallet));}catch{}updateWallet();}
function feeFor(n){return n<=20000?500:n<=100000?1000:n<=500000?5000:n<=1000000?10000:15000;}
async function finishSession(){
 if(!session||session.finished||!session.replies)return;
 session.finished=true;clearInterval(sessionTimer);clearTimeout(typingTimer);
 const current=session,amount=current.usd*exchangeRate,name=current.profile.name;
 const op={type:'credit',id:current.cloudId||(current.cloudId='CHAT-'+crypto.randomUUID()),amount};
 try{localStorage.setItem('paidchat-demo-credit-pending-v2',JSON.stringify({...op,name}));}catch{}
 show('Inahifadhi mapato ·','<p>Subiri mapato yahifadhiwe kwenye akaunti yako…</p>');
 async function persist(){try{await cloudRequest(op);try{localStorage.removeItem('paidchat-demo-credit-pending-v2');}catch{}
 show('Hongera umepokea '+money(amount)+' · ',`<p>Baada ya kuchat na ${escapeHTML(name)}. Mapato na salio lako vimehifadhiwa kwenye akaunti.</p><p><strong>Salio la majaribio.</strong></p><button id="close-success">Funga</button>`);byId('close-success').onclick=()=>modal.close();
 }catch(error){show('Haijahifadhiwa bado · ',`<p>${escapeHTML(error.message)}</p><p>Mapato hayajapotea. Unganisha mtandao kisha jaribu tena.</p><button id="retry-credit">Hifadhi tena</button>`);byId('retry-credit').onclick=persist;}}
 await persist();
}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function showRecords(){
 if(!cloudReady)return cloudUnavailable();
 try{await cloudRequest();}catch(e){return cloudUnavailable(e.message);}
 wallet=loadWallet();
 show('Taarifa ·',wallet.records.length?wallet.records.map(r=>`<article class="demo-record"><strong>${money(r.net)} · ${r.status==='pending'?'Inachakatwa':'Muamala Umekamilika✅'}</strong><p>${escapeHTML(r.network)} · 076***8833</p><p>Kiasi: ${money(r.amount)} · Makato: ${money(r.fee)}</p><time>${dateFormatter.format(new Date(r.time))} · ${timeFormatter.format(new Date(r.time))}</time><small>${escapeHTML(String(r.id).replace(/^DEMO-/, 'Risiti-'))}</small></article>`).join(''):'<p>Bado hakuna taarifa za kutoa pesa.</p>');
}
async function showWithdrawal(){
 if(!cloudReady)return cloudUnavailable();
 try{await cloudRequest();}catch(e){return cloudUnavailable(e.message);}
 if(withdrawalPending)return show('Withdrawal ·','<p>Ombi lako linachakatwa. Subiri likamilike.</p>');
 wallet=loadWallet();
 show('Toa pesa ·',`<p class="demo-info">Jaribu hatua za kutoa pesa hapa.</p><form id="withdraw-form"><label>Chagua mtandao<select id="withdraw-network" required><option value="">Chagua mtandao</option><option>M-PESA</option><option>Mixx by Yas</option><option>Airtel Money</option><option>HaloPesa</option></select></label><label>Namba ya simu<input value="076***8833" readonly></label><label>Kiasi cha kutoa (TZS)<input id="withdraw-amount" type="number" min="6000" step="1" required placeholder="Kuanzia 6,000"></label><div class="fee-summary"><p>Salio: <strong>${money(wallet.balance)}</strong></p><p>Makato: <strong id="fee">TZS 0</strong></p><p>Utakayopokea: <strong id="net">TZS 0</strong></p></div><p id="withdraw-error" role="alert"></p><button class="gold-action" type="submit">WITHDRAWAL</button><small>Kiasi kilichoandikwa kitakatwa kwenye salio. Makato yamejumuishwa ndani yake.</small></form>`);
 const input=byId('withdraw-amount');input.oninput=()=>{const n=Number(input.value),valid=Number.isSafeInteger(n)&&n>=6000;byId('fee').textContent=money(valid?feeFor(n):0);byId('net').textContent=money(valid?n-feeFor(n):0);};
 byId('withdraw-form').onsubmit=async e=>{e.preventDefault();const amount=Number(input.value);wallet=loadWallet();if(!Number.isSafeInteger(amount)||amount<6000)return byId('withdraw-error').textContent='Kiasi cha chini ni TZS 6,000.';if(amount>wallet.balance)return byId('withdraw-error').textContent='Salio lako halitoshi.';
 const fee=feeFor(amount),net=amount-fee,network=byId('withdraw-network').value;
 if(!['M-PESA','Mixx by Yas','Airtel Money','HaloPesa'].includes(network))return;
 if(withdrawalPending)return;
 const op={type:'withdraw',id:''+crypto.randomUUID(),amount,network};
 const submit=byId('withdraw-form').querySelector('button[type="submit"]');submit.disabled=true;withdrawalPending=true;
 submit.textContent='Inachakata…';byId('withdraw-error').textContent='';
 try{localStorage.setItem('paidchat-demo-withdraw-request-v2',JSON.stringify(op));}catch{}
 try{const result=await cloudRequest(op);try{localStorage.removeItem('paidchat-demo-withdraw-request-v2');}catch{}scheduleWithdrawal(result.record);submit.textContent='Inachakata… sekunde 5';}
 catch(error){withdrawalPending=false;submit.disabled=false;submit.textContent='WITHDRAWAL';byId('withdraw-error').textContent=error.message;/* A lost response may have committed: resync before any retry. */if(error.status){try{localStorage.removeItem('paidchat-demo-withdraw-request-v2');}catch{}}else{submit.disabled=true;byId('withdraw-error').textContent+=' Refresh kurejesha hali ya ombi; usitume withdrawal nyingine.';}}

 };

}
byId('close-account-notification').onclick=()=>byId('account-notification').hidden=true;

// Simulated phone-style receipt: this never sends an actual SMS or mobile-money transfer.
var withdrawalPending=false;
const withdrawalTimers=new Map();
function demoMobileBalance(){return loadWallet().records.filter(r=>r.status!=='pending').reduce((sum,r)=>sum+(Number.isSafeInteger(r.net)?r.net:0),0);}
function scheduleWithdrawal(record){
 if(withdrawalTimers.has(record.id))return;
 withdrawalTimers.set(record.id,setTimeout(()=>completeWithdrawal(record.id),Math.max(0,record.readyAt-Date.now())));
}
async function completeWithdrawal(id){
 withdrawalTimers.delete(id);let result;
 try{result=await cloudRequest({type:'complete',id});}catch(error){setCloudStatus('Mtandao haujapatikana. Muamala unahifadhiwa; unganisha tena.');withdrawalTimers.set(id,setTimeout(()=>completeWithdrawal(id),15000));return;}
 const record=result.record;if(!record)return;
 if(record.status==='pending'){scheduleWithdrawal(record);return;}
 withdrawalPending=wallet.records.some(r=>r.status==='pending');
 if(byId('withdraw-form'))modal.close();
 const tsh=n=>'Tsh '+n.toLocaleString('en-TZ');
 byId('transaction-text').textContent=`${record.code} · Kiasi cha mfano ${tsh(record.net)} kupitia ${record.network} tarehe ${dateFormatter.format(new Date(record.time))} saa ${timeFormatter.format(new Date(record.time))}. Salio la mfano ni ${tsh(record.mobileBalance)}.`;
 byId('message-received-time').textContent=new Intl.DateTimeFormat('en-TZ',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'Africa/Dar_es_Salaam'}).format(new Date(record.time));
 transactionNotice.hidden=false;transactionNotice.style.transform='';clearTimeout(noticeTimer);
 noticeTimer=setTimeout(dismissDemoMessage,60000);playNotificationSound();
}
function dismissDemoMessage(){clearTimeout(noticeTimer);transactionNotice.hidden=true;transactionNotice.style.transform='';}
byId('dismiss-transaction').onclick=dismissDemoMessage;
let swipeOrigin;
transactionNotice.addEventListener('pointerdown',event=>{if(event.target.closest('button'))return;swipeOrigin={x:event.clientX,y:event.clientY};transactionNotice.setPointerCapture?.(event.pointerId);});
transactionNotice.addEventListener('pointerup',event=>{if(!swipeOrigin)return;const dx=event.clientX-swipeOrigin.x,dy=event.clientY-swipeOrigin.y;swipeOrigin=undefined;if(Math.abs(dx)>65||dy < -45)dismissDemoMessage();});
transactionNotice.addEventListener('pointercancel',()=>{swipeOrigin=undefined;});


function newDemoTransactionCode(){
 const alphabet='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';let code;
 const used=new Set(loadWallet().records.map(r=>r.code));
 do {const bytes=crypto.getRandomValues(new Uint8Array(8));code='DH'+Array.from(bytes,n=>alphabet[n%alphabet.length]).join('');}while(used.has(code));
 return code;
}
byId('mark-demo-read').onclick=dismissDemoMessage;

function setCloudStatus(text){byId('cloud-status').textContent=text;}
function cloudUnavailable(message='Database bado inapakia. Jaribu tena baada ya muda mfupi.'){show('Data ya akaunti',`<p>${escapeHTML(message)}</p><button id="retry-cloud">Jaribu tena</button>`);byId('retry-cloud').onclick=()=>{modal.close();initializeCloud();};}
async function cloudRequest(op){
 const response=await fetch('/dashboard/api/wallet',{method:op?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:op?{'Content-Type':'application/json'}:{},...(op?{body:JSON.stringify(op)}:{})});
 let result;try{result=await response.json();}catch{throw Error('Server haijajibu data. Hakikisha faili za Functions na D1 binding zimewekwa.');}
 if(!response.ok){const e=Error(result.error||'Imeshindikana kuhifadhi data.');e.status=response.status;throw e;}
 if(!result.wallet)throw Error('Data ya akaunti haijasomeka.');
 wallet=result.wallet;cloudReady=true;saveWallet();withdrawalPending=wallet.records.some(r=>r.status==='pending');
 setCloudStatus('Pesa zako ziko salama');return result;
}
let cloudInitializing=false;
async function initializeCloud(){
 if(cloudInitializing)return;cloudInitializing=true;setCloudStatus('Inaunganisha database…');
 try{
  let result=await cloudRequest();const legacy=readLegacyWallet();
  if(result.canImport&&legacy&&(legacy.income>0||legacy.records?.length))result=await cloudRequest({type:'import',wallet:legacy});
  const pendingCredit=(()=>{try{return JSON.parse(localStorage.getItem('paidchat-demo-credit-pending-v2'));}catch{return null;}})();
  if(pendingCredit){await cloudRequest(pendingCredit);localStorage.removeItem('paidchat-demo-credit-pending-v2');}
  const pendingWithdraw=(()=>{try{return JSON.parse(localStorage.getItem('paidchat-demo-withdraw-request-v2'));}catch{return null;}})();
  if(pendingWithdraw){const recovered=await cloudRequest(pendingWithdraw);localStorage.removeItem('paidchat-demo-withdraw-request-v2');if(recovered.record)scheduleWithdrawal(recovered.record);}
  wallet.records.filter(r=>r.status==='pending').forEach(scheduleWithdrawal);
 }catch(error){cloudReady=false;setCloudStatus(error.message+' · Bonyeza kujaribu tena.');updateWallet();}
 finally{cloudInitializing=false;}
}
const cloudStatus=document.createElement('button');cloudStatus.id='cloud-status';cloudStatus.type='button';cloudStatus.className='practice-note';cloudStatus.style.cssText='display:block;background:transparent;border:0;padding:6px 0;text-align:left;font-size:12px';cloudStatus.onclick=initializeCloud;document.querySelector('.wallet').after(cloudStatus);
initializeCloud();
window.addEventListener('focus',()=>{if(!modal.open)initializeCloud();});
window.addEventListener('online',initializeCloud);
setInterval(()=>{if(!document.hidden&&!modal.open)initializeCloud();},30000);
// Prevent a second session while a previous credit is waiting to sync.
const startDemoChat=startChat;
startChat=function(profile,option){if(!cloudReady)return cloudUnavailable();try{if(localStorage.getItem('paidchat-demo-credit-pending-v2'))return cloudUnavailable('Mapato ya chat iliyopita bado yanahifadhiwa. Bonyeza kujaribu tena.');}catch{}return startDemoChat(profile,option);};
