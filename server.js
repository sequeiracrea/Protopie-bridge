import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
app.use(cors());

// 🔧 Autorise à recevoir à la fois des JSON et des formulaires simples (x=123&y=456)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let clients = [];

// 🔄 SSE : envoie les positions X/Y à tous les embeds connectés
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  clients.push(res);

  console.log('🟢 Nouvel abonné SSE, total :', clients.length);

  req.on('close', () => {
    clients = clients.filter(c => c !== res);
    console.log('🔴 Client SSE déconnecté, total :', clients.length);
  });
});

// 📩 POST /api/pos : reçoit {x, y} ou x=123&y=456 depuis Protopie Connect
app.post('/api/pos', (req, res) => {
  console.log('📦 Données brutes reçues :', req.body);

  // Récupère x et y, qu'ils soient envoyés en JSON ou en "form-data"
  const x = parseFloat(req.body.x);
  const y = parseFloat(req.body.y);

  if (isNaN(x) || isNaN(y)) {
    console.warn('⚠️ Données invalides reçues :', req.body);
    return res.status(400).send('Bad Request: x and y must be numbers');
  }

  // Formate les données à envoyer via SSE
  const data = JSON.stringify({ x, y });

  // Envoie à tous les clients connectés à /events
  clients.forEach(client => client.write(`data: ${data}\n\n`));

  console.log('📩 Données diffusées :', { x, y });
  res.sendStatus(200);
});

// 🚀 Port Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Bridge en ligne sur port ${PORT}`));
