import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let clients = [];
let latest = { x: 0, y: 0 };

// SSE : envoi des positions X/Y à tous les embeds connectés
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`data: ${JSON.stringify(latest)}\n\n`);

  clients.push(res);
  console.log("🟢 Nouveau client SSE, total :", clients.length);

  req.on("close", () => {
    clients = clients.filter(c => c !== res);
    console.log("🔴 Client SSE déconnecté, total :", clients.length);
  });
});

// Recevoir x
app.post("/api/x", (req, res) => {
  const x = parseFloat(req.body.x);
  if (isNaN(x)) return res.status(400).send("x invalide");
  latest.x = x;
  broadcast();
  res.sendStatus(200);
});

// Recevoir y
app.post("/api/y", (req, res) => {
  const y = parseFloat(req.body.y);
  if (isNaN(y)) return res.status(400).send("y invalide");
  latest.y = y;
  broadcast();
  res.sendStatus(200);
});

function broadcast() {
  const data = JSON.stringify(latest);
  clients.forEach(c => c.write(`data: ${data}\n\n`));
  console.log("📩 Données diffusées :", latest);
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Bridge en ligne sur port ${PORT}`));
