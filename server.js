import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Stocke la dernière position
let lastPos = { x: 0, y: 0 };

// Serveur HTTP basique (test)
app.get('/', (req, res) => {
  res.send('Bridge WebSocket en ligne !');
});

// Recevoir les positions depuis Connect
app.post('/api/pos', (req, res) => {
  const { x, y } = req.body;

  if (typeof x !== 'number' || typeof y !== 'number') {
    console.log('⚠️ x ou y invalide :', req.body);
    return res.status(400).send('x et y doivent être des nombres');
  }

  lastPos = { x, y };
  console.log('📩 Données reçues :', lastPos);

  // Envoie à tous les clients WebSocket
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(lastPos));
    }
  });

  res.sendStatus(200);
});

// Démarrage du serveur HTTP
const server = app.listen(PORT, () => {
  console.log(`🚀 Bridge WebSocket en ligne sur port ${PORT}`);
});

// WebSocket
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('🟢 Nouveau client WebSocket connecté, total :', wss.clients.size);

  // Envoie immédiatement la dernière position
  ws.send(JSON.stringify(lastPos));

  ws.on('close', () => {
    console.log('🔴 Client WebSocket déconnecté, total :', wss.clients.size);
  });
});
