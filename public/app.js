// ---- Internationalization ---------------------------------------------------

const I18N = {
  hu: {
    title: 'Szabadulószoba — Játékmester',
    appTitle: 'Szabadulószoba',
    appSubtitle: 'Játékmester',
    newTeam: 'Új csapat',
    gameMaster: 'Játékmester',
    addGm: '+ Új játékmester',
    removeGm: '× Eltávolítás',
    noGm: '— nincs megadva —',
    newGmPlaceholder: 'Új játékmester neve',
    addBtn: 'Hozzáad',
    cancelBtn: 'Mégsem',
    room: 'Szoba',
    chooseRoom: 'Válassz szobát…',
    teamName: 'Csapat neve',
    teamPlaceholder: 'pl. A Kódfejtők',
    createBtn: 'Csapat létrehozása és QR megjelenítése',
    creatingBtn: 'Létrehozás…',
    scanHint: 'A játékosok beolvassák a csatlakozáshoz. Mindenki ugyanabba a csapatba lép be.',
    copyBtn: 'Másolás',
    copiedBtn: 'Másolva!',
    resetBtn: 'Új csapat indítása',
    qrAria: 'Csapat csatlakozási QR-kód',
    qrAlt: 'QR-kód',
    confirmRemove: (name) => `Eltávolítod a "${name}" játékmestert a listából?`,
    errCreateGeneric: 'Nem sikerült létrehozni a csapatot',
    errAddGm: 'Hiba a hozzáadásnál.',
    errRemoveGm: 'Hiba az eltávolításnál.',
    rooms: {
      'A Maja Birodalom': 'A Maja Birodalom',
      'A Mélység Titka': 'A Mélység Titka',
      'Alien vs Predator': 'Alien vs Predator',
      'Azték': 'Azték',
      'Bomb': 'Bomb',
      'Éjszaka az Egyiptomi Múzeumban': 'Éjszaka az Egyiptomi Múzeumban',
      'Japan': 'Japan',
      'Madness': 'Madness',
      'Prison': 'Prison',
      'Roxfort és a Legendás Állatok': 'Roxfort és a Legendás Állatok',
      'Tetthely': 'Tetthely',
      'Zombie': 'Zombie',
      'Jungle Debrecen': 'Jungle Debrecen',
      'Bomb Debrecen': 'Bomb Debrecen',
      'Prison Debrecen': 'Prison Debrecen',
      'Múmia Debrecen': 'Múmia Debrecen',
      'Madness Debrecen': 'Madness Debrecen',
    },
  },
  en: {
    title: 'Escape Room — Game Master',
    appTitle: 'Escape Room',
    appSubtitle: 'Game Master',
    newTeam: 'New team',
    gameMaster: 'Game master',
    addGm: '+ Add game master',
    removeGm: '× Remove',
    noGm: '— not specified —',
    newGmPlaceholder: 'New game master name',
    addBtn: 'Add',
    cancelBtn: 'Cancel',
    room: 'Room',
    chooseRoom: 'Choose a room…',
    teamName: 'Team name',
    teamPlaceholder: 'e.g. The Codebreakers',
    createBtn: 'Create team & show QR',
    creatingBtn: 'Creating…',
    scanHint: 'Players scan to join. Everyone signs in to the same team.',
    copyBtn: 'Copy',
    copiedBtn: 'Copied!',
    resetBtn: 'Start a new team',
    qrAria: 'Team join QR code',
    qrAlt: 'QR code',
    confirmRemove: (name) => `Remove "${name}" from the list?`,
    errCreateGeneric: 'Failed to create team',
    errAddGm: 'Failed to add.',
    errRemoveGm: 'Failed to remove.',
    rooms: {
      'A Maja Birodalom': 'The Mayan Empire',
      'A Mélység Titka': 'The Secret of the Deep',
      'Alien vs Predator': 'Alien vs Predator',
      'Azték': 'Aztec',
      'Bomb': 'Bomb',
      'Éjszaka az Egyiptomi Múzeumban': 'Night at the Egyptian Museum',
      'Japan': 'Japan',
      'Madness': 'Madness',
      'Prison': 'Prison',
      'Roxfort és a Legendás Állatok': 'Hogwarts and the Magical Creatures',
      'Tetthely': 'Crime Scene',
      'Zombie': 'Zombie',
    },
  },
};

const LANG_STORAGE_KEY = 'lang';
let currentLang = (() => {
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  return stored && I18N[stored] ? stored : 'hu';
})();

const t = () => I18N[currentLang];

function applyI18n() {
  const dict = t();
  document.documentElement.lang = currentLang;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] != null) el.textContent = dict[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key] != null) el.placeholder = dict[key];
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria-label');
    if (dict[key] != null) el.setAttribute('aria-label', dict[key]);
  });

  // Localize room dropdown labels and hide rooms not available in the current language
  const roomSelect = document.getElementById('room-select');
  roomSelect.querySelectorAll('option').forEach((opt) => {
    if (!opt.value) return;
    const label = dict.rooms[opt.value];
    if (label) {
      opt.textContent = label;
      opt.hidden = false;
      opt.disabled = false;
    } else {
      opt.hidden = true;
      opt.disabled = true;
    }
  });
  // Reset selection if the currently-picked room isn't available in this language
  if (roomSelect.value && !dict.rooms[roomSelect.value]) {
    roomSelect.value = '';
  }

  // Update toggle pressed state
  document.querySelectorAll('.lang-toggle [data-lang]').forEach((btn) => {
    btn.setAttribute('aria-pressed', btn.getAttribute('data-lang') === currentLang ? 'true' : 'false');
  });
}

function setLang(lang) {
  if (!I18N[lang] || lang === currentLang) return;
  currentLang = lang;
  localStorage.setItem(LANG_STORAGE_KEY, lang);
  applyI18n();
  // If a result is currently visible, update its room label
  if (!result.hidden && resultSub.dataset.roomKey) {
    resultSub.textContent = t().rooms[resultSub.dataset.roomKey] || resultSub.dataset.roomKey;
  }
  // Update default create-btn label (in case it's mid-state)
  if (!createBtn.disabled) createBtn.textContent = t().createBtn;
}

document.querySelectorAll('.lang-toggle [data-lang]').forEach((btn) => {
  btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang')));
});

// ---- Element references -----------------------------------------------------

const form = document.getElementById('team-form');
const setup = document.getElementById('setup');
const result = document.getElementById('result');
const resultTitle = document.getElementById('result-title');
const resultSub = document.getElementById('result-sub');
const qrBox = document.getElementById('qr');
const authUrlInput = document.getElementById('auth-url');
const copyBtn = document.getElementById('copy-btn');
const resetBtn = document.getElementById('reset-btn');
const errEl = document.getElementById('err');
const createBtn = document.getElementById('create-btn');

const gmSelect = document.getElementById('gm-select');
const addGmBtn = document.getElementById('add-gm-btn');
const removeGmBtn = document.getElementById('remove-gm-btn');
const addGmRow = document.getElementById('add-gm-row');
const newGmInput = document.getElementById('new-gm-input');
const confirmAddGmBtn = document.getElementById('confirm-add-gm');
const cancelAddGmBtn = document.getElementById('cancel-add-gm');

applyI18n();

// ---- Game master list -------------------------------------------------------

const FALLBACK_BUILTINS = ['Flóra', 'Kristóf', 'Marcell', 'Nármin', 'Szonja', 'Tamás', 'Virág'];
let gmData = { builtins: FALLBACK_BUILTINS, custom: [], removed: [] };

function renderGmOptions() {
  const removed = new Set(gmData.removed);
  const all = [...gmData.builtins, ...gmData.custom].filter((name) => !removed.has(name));
  const previousValue = gmSelect.value;

  Array.from(gmSelect.querySelectorAll('option:not([value=""])')).forEach((o) => o.remove());
  for (const name of all) {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    gmSelect.appendChild(opt);
  }
  if (all.includes(previousValue)) gmSelect.value = previousValue;
  updateRemoveBtn();
}

function updateRemoveBtn() {
  removeGmBtn.hidden = !gmSelect.value;
}

async function fetchGms() {
  try {
    const r = await fetch('/api/gms');
    if (!r.ok) throw new Error('Failed to fetch GMs');
    gmData = await r.json();
  } catch (e) {
    console.warn('Could not load GM list, using built-ins:', e);
  }
  renderGmOptions();
}

async function addGmRequest(name) {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const all = [...gmData.builtins, ...gmData.custom].filter((n) => !gmData.removed.includes(n));
  if (all.includes(trimmed)) {
    gmSelect.value = trimmed;
    updateRemoveBtn();
    return 'exists';
  }
  try {
    const r = await fetch('/api/gms/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j.error || t().errAddGm);
    }
    gmData = await r.json();
    renderGmOptions();
    gmSelect.value = trimmed;
    updateRemoveBtn();
    return true;
  } catch (e) {
    alert(e.message);
    return false;
  }
}

async function removeGmRequest(name) {
  if (!name) return;
  try {
    const r = await fetch('/api/gms/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j.error || t().errRemoveGm);
    }
    gmData = await r.json();
    gmSelect.value = '';
    renderGmOptions();
    updateRemoveBtn();
  } catch (e) {
    alert(e.message);
  }
}

fetchGms();

gmSelect.addEventListener('change', updateRemoveBtn);

removeGmBtn.addEventListener('click', () => {
  const name = gmSelect.value;
  if (!name) return;
  if (confirm(t().confirmRemove(name))) {
    removeGmRequest(name);
  }
});

addGmBtn.addEventListener('click', () => {
  addGmRow.hidden = false;
  addGmBtn.hidden = true;
  newGmInput.value = '';
  newGmInput.focus();
});

cancelAddGmBtn.addEventListener('click', () => {
  addGmRow.hidden = true;
  addGmBtn.hidden = false;
});

async function commitAddGm() {
  confirmAddGmBtn.disabled = true;
  const r = await addGmRequest(newGmInput.value);
  confirmAddGmBtn.disabled = false;
  if (r === true || r === 'exists') {
    addGmRow.hidden = true;
    addGmBtn.hidden = false;
  }
}

confirmAddGmBtn.addEventListener('click', commitAddGm);
newGmInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    commitAddGm();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    addGmRow.hidden = true;
    addGmBtn.hidden = false;
  }
});

// ---- Form submission --------------------------------------------------------

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errEl.hidden = true;
  createBtn.disabled = true;
  createBtn.textContent = t().creatingBtn;

  const formData = new FormData(form);
  const teamName = String(formData.get('teamName') || '').trim();
  const room = String(formData.get('room') || '').trim();
  const gm = String(formData.get('gm') || '').trim();

  try {
    const res = await fetch('/api/create-team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName, room, gm, lang: currentLang }),
    });
    const data = await res.json();
    if (!res.ok) {
      const detail = data?.details ? ` — ${JSON.stringify(data.details)}` : '';
      throw new Error((data?.error || t().errCreateGeneric) + detail);
    }

    resultTitle.textContent = teamName;
    resultSub.dataset.roomKey = room;
    resultSub.textContent = t().rooms[room] || room;
    authUrlInput.value = data.authUrl;

    qrBox.innerHTML = '';
    const img = document.createElement('img');
    img.src = data.qrDataUrl;
    img.alt = t().qrAlt;
    img.width = 320;
    img.height = 320;
    qrBox.appendChild(img);

    setup.hidden = true;
    result.hidden = false;
  } catch (err) {
    errEl.textContent = err.message;
    errEl.hidden = false;
  } finally {
    createBtn.disabled = false;
    createBtn.textContent = t().createBtn;
  }
});

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(authUrlInput.value);
    const original = t().copyBtn;
    copyBtn.textContent = t().copiedBtn;
    setTimeout(() => { copyBtn.textContent = t().copyBtn; }, 1500);
  } catch {
    authUrlInput.select();
    document.execCommand('copy');
  }
});

resetBtn.addEventListener('click', () => {
  form.reset();
  setup.hidden = false;
  result.hidden = true;
  qrBox.innerHTML = '';
  authUrlInput.value = '';
  delete resultSub.dataset.roomKey;
});
