import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.text({ type: '*/*' })); // On lit le body brut

let clients = [];
let currentPos = { x: 0, y: 0 };

// SSE : envoi des positions X/Y à tous les embeds connectés
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  clients.push(res);
  res.write(`data: ${JSON.stringify(currentPos)}\n\n`);

  req.on('close', () => {
    clients = clients.filter(c => c !== res);
    console.log('🔴 Client SSE déconnecté, total :', clients.length);
  });

  console.log('🟢 Nouveau client SSE, total :', clients.length);
});

// POST /api/pos : reçoit posX ou posY en texte brut
// Utiliser query param ?axis=x ou ?axis=y
app.post('/api/pos', (req, res) => {
  const val = parseFloat(req.body);
  const axis = req.query.axis;

  if (isNaN(val)) {
    console.log('⚠️ Valeur invalide reçue :', req.body);
    return res.status(400).send('Bad data');
  }

  if (axis === 'x') currentPos.x = val;
  else if (axis === 'y') currentPos.y = val;
  else return res.status(400).send('Missing axis');

  // Broadcast aux clients SSE
  clients.forEach(c => c.write(`data: ${JSON.stringify(currentPos)}\n\n`));
  console.log('📩 Données reçues :', currentPos);

  res.sendStatus(200);
});

// Port
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Bridge en ligne sur port ${PORT}`));
