import express from 'express';
import cors from 'cors';

const app = express();

// ⚡ CORS : permet au viewer / embed de se connecter
app.use(cors());

// ⚡ Body parser pour récupérer le texte brut envoyé par Connect
app.use(express.text({ type: '*/*' }));

let clients = [];

// ==========================
// SSE : envoi des positions X/Y à tous les embeds connectés
// ==========================
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  clients.push(res);
  console.log('🟢 Nouveau client SSE, total :', clients.length);

  req.on('close', () => {
    clients = clients.filter(c => c !== res);
    console.log('🔴 Client SSE déconnecté, total :', clients.length);
  });
});

// ==========================
// POST /api/pos : reçoit posX et posY depuis Connect
// ==========================
app.post('/api/pos', (req, res) => {
  let x, y;

  // Connect envoie les données séparément
  try {
    const data = JSON.parse(req.body);
    x = parseFloat(data.posX ?? data.x);
    y = parseFloat(data.posY ?? data.y);
  } catch {
    console.log('⚠️ Données non valides reçues :', req.body);
    return res.status(400).send('Bad data');
  }

  if (isNaN(x) || isNaN(y)) {
    console.log('⚠️ x ou y invalide :', req.body);
    return res.status(400).send('Bad data');
  }

  const payload = { x, y };
  clients.forEach(c => c.write(`data: ${JSON.stringify(payload)}\n\n`));
  console.log('📩 Données reçues :', payload);

  res.sendStatus(200);
});

// ==========================
// Ping SSE pour garder les connexions ouvertes
// ==========================
setInterval(() => {
  clients.forEach(c => c.write(`:\n\n`));
}, 20000);

// ==========================
// Port
// ==========================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Bridge en ligne sur port ${PORT}`));
