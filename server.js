import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let clients = [];
let currentPos = { x: 0, y: 0 };

app.post('/api/x', (req, res) => {
  currentPos.x = Number(req.body.value);
  broadcast(currentPos);
  res.sendStatus(200);
});

app.post('/api/y', (req, res) => {
  currentPos.y = Number(req.body.value);
  broadcast(currentPos);
  res.sendStatus(200);
});

function broadcast(data) {
  const payload = JSON.stringify(data);
  clients.forEach(c => c.write(`data: ${payload}\n\n`));
  console.log('📩 Données diffusées :', data);
}


// --- 🔸 SSE : diffusion en temps réel ---
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  // ✅ CORS explicite pour EventSource
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  // Envoi initial
  res.write(`data: ${JSON.stringify(latest)}\n\n`);

  clients.push(res);
  console.log("🟢 Nouveau client SSE, total :", clients.length);

  req.on("close", () => {
    clients = clients.filter(c => c !== res);
    console.log("🔴 Client SSE déconnecté, total :", clients.length);
  });
});

// --- 🔹 Réception X ---
app.post("/api/x", (req, res) => {
  const x = parseFloat(req.body.x);
  if (isNaN(x)) return res.status(400).send("x invalide");
  latest.x = x;
  broadcast();
  res.sendStatus(200);
});

// --- 🔹 Réception Y ---
app.post("/api/y", (req, res) => {
  const y = parseFloat(req.body.y);
  if (isNaN(y)) return res.status(400).send("y invalide");
  latest.y = y;
  broadcast();
  res.sendStatus(200);
});

// --- 🔸 Diffusion ---
function broadcast() {
  const data = JSON.stringify(latest);
  clients.forEach(c => c.write(`data: ${data}\n\n`));
  console.log("📩 Données diffusées :", latest);
}

// --- Port ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Bridge en ligne sur port ${PORT}`));
