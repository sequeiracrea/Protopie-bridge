import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(bodyParser.json());

let clients = [];

// SSE : envoi des positions X/Y à tous les embeds connectés
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  clients.push(res);

  req.on('close', () => {
    clients = clients.filter(c => c !== res);
  });
});

// POST /api/pos : reçoit {x, y} depuis Connect
app.post('/api/pos', (req, res) => {
  const { x, y } = req.body;

  if (typeof x !== 'number' || typeof y !== 'number') {
    return res.status(400).send('Bad Request: x and y must be numbers');
  }

  const data = JSON.stringify({ x, y });
  clients.forEach(c => c.write(`data: ${data}\n\n`));

  console.log('📩 Données reçues :', { x, y });
  res.sendStatus(200);
});

// Port
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Bridge en ligne sur port ${PORT}`));
