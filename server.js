import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
app.use(cors());

// 🧠 On capte aussi du texte brut, pas seulement du JSON
app.use(bodyParser.text({ type: "*/*" }));

let clients = [];
let lastPos = { x: 0, y: 0 };

// SSE : envoi en continu vers le front
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  clients.push(res);
  console.log('🟢 Nouveau client SSE, total :', clients.length);

  const keepAlive = setInterval(() => {
    res.write(`:\n\n`); // envoi un ping SSE
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAlive);
    clients = clients.filter(c => c !== res);
    console.log('🔴 Client SSE déconnecté, total :', clients.length);
  });
});


// POST /api/pos
app.post('/api/pos', (req, res) => {
  let data;
  try {
    data = JSON.parse(req.body);
  } catch {
    console.log('⚠️ JSON invalide reçu :', req.body);
    return res.status(400).send('Bad JSON');
  }
  
  const { x, y } = data;

  clients.forEach(c => c.write(`data: ${JSON.stringify({ x, y })}\n\n`));
  console.log('📩 Données reçues :', { x, y });
  res.sendStatus(200);
});

// Port Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Bridge en ligne sur port ${PORT}`));
