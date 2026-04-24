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
  'A Maja Birodalom': '/quests/07c35db4-fef5-432f-8eb0-776f1c776220',
  'A Mélység Titka': '/quests/1bce46ab-ccf6-493a-8853-33a7be46984e',
  'Alien vs Predator': '/quests/cb72f972-c10c-418c-9659-c4117f321275',
  'Azték': '/quests/16d0f6ac-0621-4eb9-9af4-31519c4bb5eb',
  'Bomb': '/quests/a74b2915-7eb3-42ca-9e11-0c3ae9db51b6',
  'Éjszaka az Egyiptomi Múzeumban': '/quests/72cf62f2-6a12-44aa-8508-56dd66760392',
  'Japan': '/quests/f4e39336-e264-4657-a1ab-7f2032892d80',
  'Madness': '/quests/57894083-efec-4b98-8fca-eb215abbfea1',
  'Prison': '/quests/cfb47cfc-61a5-434c-ac17-f09cda3a1205',
  'Roxfort és a Legendás Állatok': '/quests/4a5427a7-c3b7-4c39-97c7-1224f3d8dc20',
  'Tetthely': '/quests/48798e80-ced7-4858-8294-f0d0074129d6',
  'Zombie': '/quests/2ed42676-2d25-44f5-bc8d-9ef2ba629323',
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
