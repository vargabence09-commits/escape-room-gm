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

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errEl.hidden = true;
  createBtn.disabled = true;
  createBtn.textContent = 'Létrehozás…';

  const formData = new FormData(form);
  const teamName = String(formData.get('teamName') || '').trim();
  const room = String(formData.get('room') || '').trim();

  try {
    const res = await fetch('/api/create-team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName, room }),
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
