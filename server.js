import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
app.use(cors());

// Accept raw text for x or y (not JSON)
app.use(bodyParser.text({ type: '*/*' }));

let clients = [];

// SSE endpoint
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

// POST endpoint for x or y
// Example: POST /api/pos?axis=x  with body "123.5"
app.post('/api/pos', (req, res) => {
  const raw = req.body.trim();
  const value = parseFloat(raw);

  if (isNaN(value)) {
    console.warn('⚠️ Données non valides reçues :', raw);
    return res.status(400).send('Bad value');
  }

  const axis = req.query.axis;
  if (!axis || (axis !== 'x' && axis !== 'y')) {
    return res.status(400).send('Missing or invalid axis parameter');
  }

  // Prepare data to broadcast
  const data = { x: 0, y: 0 };
  if (axis === 'x') data.x = value;
  else data.y = value;

  clients.forEach(c => c.write(`data: ${JSON.stringify(data)}\n\n`));
  console.log(`📩 ${axis} reçu :`, value);

  res.sendStatus(200);
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Bridge SSE en ligne sur port ${PORT}`));
