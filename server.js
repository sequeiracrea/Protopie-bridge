import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { WebSocketServer } from 'ws';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ===== SSE =====
let sseClients = [];

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  sseClients.push(res);
  console.log(`🟢 Nouveau client SSE, total : ${sseClients.length}`);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c !== res);
    console.log(`🔴 Client SSE déconnecté, total : ${sseClients.length}`);
  });
});

// ===== WebSocket =====
const wss = new WebSocketServer({ noServer: true });
wss.on('connection', ws => {
  console.log('🟢 Nouveau client WebSocket');
});

// ===== POST /api/pos =====
app.post('/api/pos', (req, res) => {
  const { x, y } = req.body;

  // Valider x et y
  if (typeof x !== 'number' || typeof y !== 'number') {
    console.log('⚠️ x ou y invalide :', req.body);
    return res.status(400).json({ error: 'x et y doivent être des nombres' });
  }

  // Broadcast SSE
  sseClients.forEach(c => c.write(`data: ${JSON.stringify({ x, y })}\n\n`));

  // Broadcast WebSocket
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(JSON.stringify({ x, y }));
  });

  console.log('📩 Données reçues :', { x, y });

  // Réponse immédiate à Connect
  res.json({ status: 'ok' });
});

// ===== Serveur =====
const PORT = process.env.PORT || 10000;
const server = app.listen(PORT, () => console.log(`🚀 Bridge en ligne sur port ${PORT}`));

// Intégration SSE + WS
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, ws => {
    wss.emit('connection', ws, request);
  });
});
