import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

let clients = [];

// SSE : envoi des positions X/Y à tous les embeds connectés
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  clients.push(res);
  console.log(`🟢 Nouveau client SSE, total : ${clients.length}`);

  req.on('close', () => {
    clients = clients.filter(c => c !== res);
    console.log(`🔴 Client SSE déconnecté, total : ${clients.length}`);
  });

  // Initialisation à 0/0
  res.write(`data: ${JSON.stringify({ x: 0, y: 0 })}\n\n`);
});

// POST /api/posX et /api/posY : reçoit x ou y depuis Connect
app.post('/api/posX', express.text({ type: '*/*' }), (req, res) => {
  const x = parseFloat(req.body);
  if (isNaN(x)) {
    console.log('⚠️ x invalide :', req.body);
    return res.status(400).send('Invalid X');
  }

  clients.forEach(c => c.write(`data: ${JSON.stringify({ x })}\n\n`));
  console.log('📩 x reçu :', x);
  res.sendStatus(200);
});

app.post('/api/posY', express.text({ type: '*/*' }), (req, res) => {
  const y = parseFloat(req.body);
  if (isNaN(y)) {
    console.log('⚠️ y invalide :', req.body);
    return res.status(400).send('Invalid Y');
  }

  clients.forEach(c => c.write(`data: ${JSON.stringify({ y })}\n\n`));
  console.log('📩 y reçu :', y);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Bridge en ligne sur port ${PORT}`));
