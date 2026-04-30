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
const addGmRow = document.getElementById('add-gm-row');
const newGmInput = document.getElementById('new-gm-input');
const confirmAddGmBtn = document.getElementById('confirm-add-gm');
const cancelAddGmBtn = document.getElementById('cancel-add-gm');

const GM_STORAGE_KEY = 'customGameMasters';

function getCustomGms() {
  try {
    const raw = localStorage.getItem(GM_STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function saveCustomGms(list) {
  localStorage.setItem(GM_STORAGE_KEY, JSON.stringify(list));
}

function renderCustomGms() {
  // Remove previously injected custom options
  Array.from(gmSelect.querySelectorAll('option[data-custom="1"]')).forEach((o) => o.remove());
  const customs = getCustomGms();
  for (const name of customs) {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    opt.dataset.custom = '1';
    gmSelect.appendChild(opt);
  }
}

function addCustomGm(name) {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const builtIns = ['Kristóf', 'Péter', 'Anna'];
  if (builtIns.includes(trimmed)) return 'exists';
  const list = getCustomGms();
  if (list.includes(trimmed)) return 'exists';
  list.push(trimmed);
  saveCustomGms(list);
  renderCustomGms();
  gmSelect.value = trimmed;
  return true;
}

renderCustomGms();

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

function commitAddGm() {
  const result = addCustomGm(newGmInput.value);
  if (result === true) {
    addGmRow.hidden = true;
    addGmBtn.hidden = false;
  } else if (result === 'exists') {
    newGmInput.focus();
    newGmInput.select();
  }
  // If false (empty), just keep the row open
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

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errEl.hidden = true;
  createBtn.disabled = true;
  createBtn.textContent = 'Létrehozás…';

  const formData = new FormData(form);
  const teamName = String(formData.get('teamName') || '').trim();
  const room = String(formData.get('room') || '').trim();
  const gm = String(formData.get('gm') || '').trim();

  try {
    const res = await fetch('/api/create-team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName, room, gm }),
    });
    const data = await res.json();
    if (!res.ok) {
      const detail = data?.details ? ` — ${JSON.stringify(data.details)}` : '';
      throw new Error((data?.error || 'Nem sikerült létrehozni a csapatot') + detail);
    }

    resultTitle.textContent = teamName;
    resultSub.textContent = room;
    authUrlInput.value = data.authUrl;

    qrBox.innerHTML = '';
    const img = document.createElement('img');
    img.src = data.qrDataUrl;
    img.alt = 'QR-kód';
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
    createBtn.textContent = 'Csapat létrehozása és QR megjelenítése';
  }
});

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(authUrlInput.value);
    const prev = copyBtn.textContent;
    copyBtn.textContent = 'Másolva!';
    setTimeout(() => (copyBtn.textContent = prev), 1500);
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
});
