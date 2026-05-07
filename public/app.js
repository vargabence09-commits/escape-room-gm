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

const BUILTIN_GMS = ['Kristóf', 'Péter', 'Anna'];
const CUSTOM_GMS_KEY = 'customGameMasters';
const REMOVED_GMS_KEY = 'removedGameMasters';

function readList(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

const getCustomGms = () => readList(CUSTOM_GMS_KEY);
const saveCustomGms = (list) => localStorage.setItem(CUSTOM_GMS_KEY, JSON.stringify(list));

const getRemovedGms = () => readList(REMOVED_GMS_KEY);
const saveRemovedGms = (list) => localStorage.setItem(REMOVED_GMS_KEY, JSON.stringify(list));

function renderGmOptions() {
  const removed = new Set(getRemovedGms());
  const customs = getCustomGms();
  const all = [...BUILTIN_GMS, ...customs].filter((name) => !removed.has(name));

  // Keep the placeholder, replace everything else
  Array.from(gmSelect.querySelectorAll('option:not([value=""])')).forEach((o) => o.remove());
  for (const name of all) {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    gmSelect.appendChild(opt);
  }
  updateRemoveBtn();
}

function updateRemoveBtn() {
  removeGmBtn.hidden = !gmSelect.value;
}

function addGm(name) {
  const trimmed = name.trim();
  if (!trimmed) return false;
  // If it was previously removed, just un-remove it
  const removed = getRemovedGms();
  if (removed.includes(trimmed)) {
    saveRemovedGms(removed.filter((n) => n !== trimmed));
    renderGmOptions();
    gmSelect.value = trimmed;
    updateRemoveBtn();
    return true;
  }
  // Already present?
  if (BUILTIN_GMS.includes(trimmed) || getCustomGms().includes(trimmed)) {
    gmSelect.value = trimmed;
    updateRemoveBtn();
    return 'exists';
  }
  const customs = getCustomGms();
  customs.push(trimmed);
  saveCustomGms(customs);
  renderGmOptions();
  gmSelect.value = trimmed;
  updateRemoveBtn();
  return true;
}

function removeGm(name) {
  if (!name) return;
  const customs = getCustomGms();
  if (customs.includes(name)) {
    saveCustomGms(customs.filter((n) => n !== name));
  } else if (BUILTIN_GMS.includes(name)) {
    const removed = getRemovedGms();
    if (!removed.includes(name)) {
      removed.push(name);
      saveRemovedGms(removed);
    }
  }
  renderGmOptions();
  gmSelect.value = '';
  updateRemoveBtn();
}

renderGmOptions();

gmSelect.addEventListener('change', updateRemoveBtn);

removeGmBtn.addEventListener('click', () => {
  const name = gmSelect.value;
  if (!name) return;
  if (confirm(`Eltávolítod a "${name}" játékmestert a listából?`)) {
    removeGm(name);
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

function commitAddGm() {
  const result = addGm(newGmInput.value);
  if (result === true) {
    addGmRow.hidden = true;
    addGmBtn.hidden = false;
  } else if (result === 'exists') {
    newGmInput.focus();
    newGmInput.select();
  }
  // If false (empty), keep the row open
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
