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
      <select aria-label="Muda na malipo ya majaribio ya ${profile.name}">${profile.options.map(([minutes, usd], n) => `<option value="${n}">Dakika ${minutes} · $${usd} ≈ ${money(usd * exchangeRate)}</option>`).join('')}</select>
      <button class="primary start-chat" data-profile="${id}" aria-label="Anza Chat na ${profile.name}"><span class="start-icon" aria-hidden="true">💬</span> Anza Kuchat</button>
    </article>`;
  }).join('');
  byId('online').textContent = (3259 + Math.floor(Math.random() * 69742)).toLocaleString('en-TZ') + ' online';
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
const formNote = '<p>Fungua fomu ya usajili kwenye FurusaWeb kupitia kiungo hiki. PaidChat inaonyesha mazungumzo na salio la majaribio.</p>';
byId('chat-notice-actions').innerHTML = formLink;
byId('dismiss-chat-notice').onclick = byId('resume-chat').onclick = () => chatNotice.close();

const screens = {
  form: ['Jaza fomu ya mfumo', formNote + '<div class="actions">' + formLink + '</div>'],
  how: ['Namna mfumo unavyofanya kazi', '<p>Chagua Mzungu wa kuchat nae, kisha chagua muda na uanze chat.</p><p>Viwango vya TZS ni  USD 1 = TZS 2,600.</p>'],
  faq: ['Maswali ya kawaida', '<details><summary>Ninachat na nani?</summary><p>Unafanya mazoezi ya Kiswahili kwa kutumia wasifu wa kubuni na majibu ya mfano.</p></details><details><summary>Naweza kutoa pesa?</summary><p>Salio na miamala inayoonyeshwa ni ya majaribio.</p></details>'],
  channel: ['Jiunge Channel', '<div class="contact-card channel-card"><strong>◉ WhatsApp Channel</strong><p>Jiunge na channel utapata taarifa zaidi za mfumo.</p><a class="gold-action" href="https://whatsapp.com/channel/0029Vb9luCJJZg47Bhvlbw2O" target="_blank" rel="noopener noreferrer">Jiunge Channel</a></div>'],
  sms: ['Tuma SMS', '<div class="contact-card"><strong>✉ PaidChat · 0762788833</strong><p>Wasiliana na msaidizi wa mfumo kwa kubonyeza👇.</p><a class="action gold-action" href="sms:+255762788833">Tuma Ujumbe</a></div>'],
  help: ['Huduma kwa Wateja', '<div class="actions"><a class="action wa" href="https://wa.me/255766716447">WhatsApp</a><a class="action sms" href="sms:+255762788833">SMS · 0762788833</a></div>']
};

function appendMessage(message, mine = false) {
  const thread = byId('thread');
  const bubble = document.createElement('div');
  bubble.className = mine ? 'bubble mine' : 'bubble';
  bubble.textContent = message;
  thread.append(bubble);
  thread.scrollTop = thread.scrollHeight;
}

function finishSession() {
  if (!session || !session.replies || session.finished) return;
  session.finished = true;
  clearInterval(sessionTimer);
  show('Sheri ya mfumo', `<p>Huwezi kuendelea kuchat kwa sasa.</p>` + formNote + '<div class="actions">' + formLink + '</div>');
}

function startChat(profile, option) {
  const [minutes, usd] = profile.options[option];
  session = {profile, usd, replies:0, finished:false, end:Date.now() + minutes * 60000};
  show(profile.name + ' · ', `<p class="meta">${profile.country} · ${profile.skill} · $${usd} ≈ ${money(usd * exchangeRate)} · <span id="clock"></span></p>
    <div id="thread" class="thread" role="log" aria-live="polite"></div>
    <p id="chat-typing" class="typing" role="status"></p>
    <form id="compose" class="compose">
      <input id="message" maxlength="500" required placeholder="Andika ujumbe…" aria-label="Ujumbe">
      <button type="submit" class="primary send-message" aria-label="Tuma ujumbe" title="Tuma ujumbe">
        <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 9.7 14.3M22 2l-7.8 20-4.5-7.7L2 9.8 22 2Z"/></svg>
      </button>
    </form>
    <div id="chat-locked" class="chat-locked" hidden>
      <p>Umefikia mwisho wa chat ya majaribio. Unaweza kufungua kiungo cha usajili.</p>
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
    if (!message || send.disabled || session.replies) return;
    appendMessage(message, true);
    session.replies = 1;
    input.value = '';
    input.disabled = true;
    send.disabled = true;

    byId('chat-locked').hidden = false;
    byId('finish').hidden = false;
    byId('chat-notice-description').textContent = `Umefikia kikomo cha mazungumzo ya majaribio na ${profile.name}. Unaweza kurudi kwenye chat au kufungua kiungo cha usajili.`;
    chatNotice.showModal();
  });
  byId('finish').onclick = finishSession;
  function tick() {
    const seconds = Math.max(0, Math.ceil((session.end - Date.now()) / 1000));
    byId('clock').textContent = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
    if (!seconds) {
      clearInterval(sessionTimer);
      if (session.replies) finishSession();
      else show('Muda umeisha · ', '<p>Fungua chat nyingine ili kuanza kuchat.</p>');
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
  if (key !== 'withdraw') return show(...screens[key]);
  nav.hidden = true;
  byId('menu').setAttribute('aria-expanded', 'false');
  byId('withdraw-notice').showModal();
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
updateDateTime();
setInterval(updateDateTime, 1000);
renderProfiles();
setInterval(() => {
  if (modal.open) return;
  offset = (offset + 20) % profiles.length;
  if (grid.contains(document.activeElement)) renderPending = true;
  else renderProfiles();
}, 10000);

const transactionNames = 'John Selemani|Asha Mushi|Baraka Mfinanga|Neema Mrema|Rehema Kweka|Daudi Massawe|Zawadi Mtega|Hassan Hamisi|Anna Lema|Elia Mwakalinga|Sara Msuya|Samweli Nnko|Joyce Kimaro|Agnes Mollel|Omari Mtui|Rose Peter|Juma Magesa|Esta Macha|Yusuph Juma|Mariam Said|Julius Charles|Fatuma Ramadhani|Evans Matiko|Edna Shayo|Hamza Rashid|Grace Mbise|Dinah Nyalandu|Patrick Mushi|Ruth Kileo|Paul Komba'.split('|');
const transactionNotice = byId('transaction-notice');
let transactionIndex = 0;
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

function showTransactionNotice() {
  if (modal.open || document.hidden) return;
  const index = transactionIndex;
  const amount = index === 0 ? 45000 : 12000 + index * 1850;
  const minutes = index === 0 ? 20 : index + (index >= 20 ? 1 : 0);
  const partner = profiles[(index * 17) % profiles.length].name;
  byId('transaction-text').textContent = `${transactionNames[index]} ametoa ${money(amount)} kupitia M-PESA dakika ${minutes} zilizopita baada ya kuchat na ${partner}.`;
  transactionNotice.hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { transactionNotice.hidden = true; }, 6500);
  playNotificationSound();
  transactionIndex = (index + 1) % transactionNames.length;
}
byId('dismiss-transaction').onclick = () => { transactionNotice.hidden = true; };
setInterval(showTransactionNotice, 10000);
