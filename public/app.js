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

const FALLBACK_BUILTINS = ['Flóra', 'Kristóf', 'Marcell', 'Leyla', 'Szonja', 'Tamás', 'Virág'];
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
      throw new Error(j.error || 'Hiba a hozzáadásnál.');
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
      throw new Error(j.error || 'Hiba az eltávolításnál.');
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
  if (confirm(`Eltávolítod a "${name}" játékmestert a listából?`)) {
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
  const result = await addGmRequest(newGmInput.value);
  confirmAddGmBtn.disabled = false;
  if (result === true) {
    addGmRow.hidden = true;
    addGmBtn.hidden = false;
  } else if (result === 'exists') {
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
