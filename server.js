import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();

// Active CORS globalement pour toutes les routes POST/GET classiques
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let clients = [];

// --- Route SSE (événements temps réel) ---
app.get("/events", (req, res) => {
  // 🔧 Autoriser explicitement les connexions depuis ton viewer
  res.setHeader("Access-Control-Allow-Origin", "*"); // ou mets ton domaine à la place si tu veux restreindre
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  clients.push(res);
  console.log("🟢 Nouveau client SSE, total :", clients.length);

  // Supprime le client à la déconnexion
  req.on("close", () => {
    clients = clients.filter((c) => c !== res);
    console.log("🔴 Client SSE déconnecté, total :", clients.length);
  });
});

// --- Réception des positions depuis Connect ---
app.post("/api/pos", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  console.log("📦 Données brutes reçues :", req.body);

  const x = parseFloat(req.body.x);
  const y = parseFloat(req.body.y);

  if (isNaN(x) || isNaN(y)) {
    console.warn("⚠️ Données invalides reçues :", req.body);
    return res.status(400).send("Bad Request: x et y doivent être des nombres");
  }

  const data = JSON.stringify({ x, y });
  clients.forEach((c) => c.write(`data: ${data}\n\n`));

  console.log("📩 Données valides transmises :", { x, y });
  res.sendStatus(200);
});

// --- Port ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Bridge en ligne sur port ${PORT}`));
