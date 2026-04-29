import 'dotenv/config';
import express from 'express';
import QRCode from 'qrcode';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_KEY = process.env.DOMINO_API_KEY;
const BASE_URL = (process.env.DOMINO_BASE_URL || 'https://escape-treasure-hunt.domino.page').replace(/\/$/, '');
const PORT = Number(process.env.PORT) || 3000;

const ROOM_PATHS = {
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
};

if (!API_KEY) {
  console.error('Missing DOMINO_API_KEY in environment (.env).');
  process.exit(1);
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const slug = (s) =>
  String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

app.post('/api/create-team', async (req, res) => {
  const teamName = typeof req.body?.teamName === 'string' ? req.body.teamName.trim() : '';
  const room = typeof req.body?.room === 'string' ? req.body.room.trim() : '';

  if (!teamName || !room) {
    return res.status(400).json({ error: 'A csapat neve és a szoba kötelező.' });
  }

  const roomPath = ROOM_PATHS[room];
  if (!roomPath) {
    return res.status(400).json({ error: `Ismeretlen szoba: ${room}` });
  }

  const externalId = `${slug(room)}-${slug(teamName)}-${Date.now()}`;

  try {
    const dominoRes = await fetch(`${BASE_URL}/api/auth/external-lookup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
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

    const authUrl = `${BASE_URL}${roomPath}?authToken=${encodeURIComponent(token)}`;
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
