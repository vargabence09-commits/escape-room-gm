import 'dotenv/config';
import express from 'express';
import QRCode from 'qrcode';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_KEY = process.env.DOMINO_API_KEY;
const API_KEY_EN = process.env.DOMINO_API_KEY_EN || process.env.DOMINO_API_KEY;
const PORT = Number(process.env.PORT) || 3000;

const LANGUAGES = {
  hu: {
    baseUrl: 'https://escape-treasure-hunt.domino.page',
    apiKey: API_KEY,
    roomPaths: {
      'A Maja Birodalom': '/quests/4369dd01-bffc-4a75-932b-dced322cb5a7',
      'A Mélység Titka': '/quests/8ddda5f6-39b9-4b3e-85f7-cafa1d485de4',
      'Alien vs Predator': '/quests/c41cacdd-8067-4b20-ab6f-3628ed01bf69',
      'Azték': '/quests/7256a480-b92a-47fc-be8f-c0d25bb0d726',
      'Bomb': '/quests/ae0a8127-ffe2-4da3-af21-c694dc35bebc',
      'Éjszaka az Egyiptomi Múzeumban': '/quests/5a5f2010-b6af-419b-85d5-5a25af92f08a',
      'Japan': '/quests/30d467ad-a606-48ad-a5af-6d21628f6ee3',
      'Madness': '/quests/f15525e2-59a9-4acf-a6eb-17396850be7d',
      'Prison': '/quests/821834ab-b031-46dc-8d3a-b1068e783b3c',
      'Roxfort és a Legendás Állatok': '/quests/6f104097-f8b7-4871-8619-668e4a00ee10',
      'Tetthely': '/quests/67fab808-7a23-411f-83fc-08f025a8f2cf',
      'Zombie': '/quests/b4351eaf-08ee-477b-bf04-6c8d04ba21bb',
    },
  },
  en: {
    baseUrl: 'https://escape-room-hq.domino.page',
    apiKey: API_KEY_EN,
    roomPaths: {
      'A Maja Birodalom': '/quests/77db6e97-3ee2-46c0-a13b-0157ca56fee3',
      'A Mélység Titka': '/quests/193dd18c-37cb-4832-87be-ad9325224e0c',
      'Alien vs Predator': '/quests/60289202-fd84-4077-9981-4a4be217a0c0',
      'Azték': '/quests/222dc1a5-4165-438d-ad69-e8df4c40b276',
      'Bomb': '/quests/d3b71374-048f-4403-a840-4645f2778cb4',
      'Éjszaka az Egyiptomi Múzeumban': '/quests/5716bb4b-359c-4dff-a23a-ae3148acab63',
      'Japan': '/quests/66255ed4-e8a7-4cce-81e0-1061ee0c0b52',
      'Madness': '/quests/34863b8a-e6a5-46c0-b4f1-2092ac2e50bb',
      'Prison': '/quests/3d76dfce-2231-4fc7-9bb7-b9a27d6d60af',
      'Roxfort és a Legendás Állatok': '/quests/7a5e3ca2-1af2-4449-abc9-09254b379090',
      'Tetthely': '/quests/a2ddaf17-763e-4cab-a01e-09f252605506',
      'Zombie': '/quests/c7f9feb4-231f-4474-95f3-79be50cf0938',
    },
  },
};

const asciify = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_-]/g, '');

if (!API_KEY) {
  console.error('Missing DOMINO_API_KEY in environment (.env).');
  process.exit(1);
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---- Game master list (server-side, shared across devices) ------------------

const BUILTIN_GMS = ['Flóra', 'Kristóf', 'Marcell', 'Nármin', 'Szonja', 'Tamás', 'Virág'];
const DATA_DIR = path.join(__dirname, 'data');
const GMS_FILE = path.join(DATA_DIR, 'gms.json');

let gmState = { custom: [], removed: [] };

function loadGmState() {
  try {
    if (fs.existsSync(GMS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(GMS_FILE, 'utf8'));
      gmState = {
        custom: Array.isArray(parsed?.custom) ? parsed.custom.filter((x) => typeof x === 'string') : [],
        removed: Array.isArray(parsed?.removed) ? parsed.removed.filter((x) => typeof x === 'string') : [],
      };
    }
  } catch (e) {
    console.error('Failed to load GM state:', e.message);
  }
}

function saveGmState() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(GMS_FILE, JSON.stringify(gmState, null, 2));
  } catch (e) {
    console.error('Failed to save GM state:', e.message);
  }
}

loadGmState();

const gmPayload = () => ({ builtins: BUILTIN_GMS, custom: gmState.custom, removed: gmState.removed });

app.get('/api/gms', (req, res) => {
  res.json(gmPayload());
});

app.post('/api/gms/add', (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!name) return res.status(400).json({ error: 'A név kötelező.' });
  if (name.length > 40) return res.status(400).json({ error: 'A név túl hosszú.' });
  if (gmState.removed.includes(name)) {
    gmState.removed = gmState.removed.filter((n) => n !== name);
  }
  if (!BUILTIN_GMS.includes(name) && !gmState.custom.includes(name)) {
    gmState.custom.push(name);
  }
  saveGmState();
  res.json(gmPayload());
});

app.post('/api/gms/remove', (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!name) return res.status(400).json({ error: 'A név kötelező.' });
  if (gmState.custom.includes(name)) {
    gmState.custom = gmState.custom.filter((n) => n !== name);
  } else if (BUILTIN_GMS.includes(name) && !gmState.removed.includes(name)) {
    gmState.removed.push(name);
  }
  saveGmState();
  res.json(gmPayload());
});

const slug = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

app.post('/api/create-team', async (req, res) => {
  const teamName = typeof req.body?.teamName === 'string' ? req.body.teamName.trim() : '';
  const room = typeof req.body?.room === 'string' ? req.body.room.trim() : '';
  const gm = typeof req.body?.gm === 'string' ? req.body.gm.trim() : '';
  const lang = (typeof req.body?.lang === 'string' ? req.body.lang.trim().toLowerCase() : 'hu') || 'hu';

  if (!teamName || !room) {
    return res.status(400).json({ error: 'A csapat neve és a szoba kötelező.' });
  }

  const cfg = LANGUAGES[lang];
  if (!cfg) {
    return res.status(400).json({ error: `Ismeretlen nyelv: ${lang}` });
  }

  const roomPath = cfg.roomPaths[room];
  if (!roomPath) {
    return res.status(400).json({ error: `Ismeretlen szoba: ${room}` });
  }

  const BASE_URL = cfg.baseUrl;

  let gmParam = '';
  if (gm) {
    gmParam = asciify(gm);
    if (!gmParam) {
      return res.status(400).json({ error: 'Érvénytelen játékmester név.' });
    }
  }

  const idParts = [];
  if (gm) idParts.push(slug(gm));
  idParts.push(slug(room), slug(teamName), String(Date.now()));
  const externalId = idParts.filter(Boolean).join('-');

  try {
    const dominoRes = await fetch(`${BASE_URL}/api/auth/external-lookup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': cfg.apiKey,
      },
      body: JSON.stringify({
        externalId,
        name: teamName,
        keyName: `${room} — ${teamName}`,
        keyExpiresInSeconds: 60 * 60 * 4,
      }),
    });

    const text = await dominoRes.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!dominoRes.ok) {
      console.error('Domino API error', dominoRes.status, data);
      return res.status(502).json({ error: 'Domino API hiba', status: dominoRes.status, details: data });
    }

    const token = data?.apiKey?.key;
    if (!token) {
      console.error('No apiKey.key in Domino response', data);
      return res.status(502).json({ error: 'A Domino nem küldött vissza authTokent.', details: data });
    }

    let authUrl = `${BASE_URL}${roomPath}?authToken=${encodeURIComponent(token)}`;
    if (gmParam) authUrl += `&gm=${encodeURIComponent(gmParam)}`;
    const qrDataUrl = await QRCode.toDataURL(authUrl, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#0a0d1f', light: '#ffffff' },
    });
    return res.json({
      authUrl,
      qrDataUrl,
      roomUrl: `${BASE_URL}${roomPath}`,
      externalId,
      teamName,
      room,
      lang,
      expiresAt: data?.apiKey?.expiresAt ?? null,
    });
  } catch (err) {
    console.error('create-team failed', err);
    return res.status(500).json({ error: err.message || 'Ismeretlen szerverhiba' });
  }
});

app.listen(PORT, () => {
  console.log(`Escape Room GM running at http://localhost:${PORT}`);
});
