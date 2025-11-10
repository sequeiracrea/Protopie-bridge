import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

// Stockage des clients SSE
let clients = [];

// SSE : envoi des positions X/Y à tous les clients connectés
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

// Stockage de la dernière position
let latestPos = { x: 0, y: 0 };

// POST /api/pos?axis=x ou ?axis=y
app.post('/api/pos', express.text({ type: '*/*' }), (req, res) => {
  const axis = req.query.axis; // "x" ou "y"
  const value = parseFloat(req.body);

  if (!axis || isNaN(value)) {
    console.log('⚠️ Données non valides reçues :', req.body);
    return res.status(400).send('Invalid data');
  }

  if (axis === 'x') latestPos.x = value;
  if (axis === 'y') latestPos.y = value;

  // Envoi SSE aux clients
  const data = JSON.stringify(latestPos);
  clients.forEach(c => c.write(`data: ${data}\n\n`));

  console.log('📦 Données reçues :', latestPos);
  res.sendStatus(200);
});

// Port
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Bridge en ligne sur port ${PORT}`));
