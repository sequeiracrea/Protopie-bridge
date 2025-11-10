// server.js
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// --------------------
// Liste des clients SSE
let clients = [];

// Route SSE : les clients s'abonnent ici
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Ajoute ce client à la liste
  clients.push(res);

  // Retire le client si la connexion se ferme
  req.on("close", () => {
    clients = clients.filter(c => c !== res);
  });
});

// --------------------
// Réception des positions depuis ProtoPie Connect
app.post("/api/pos", (req, res) => {
  const { x, y } = req.body;

  if (typeof x !== "number" || typeof y !== "number") {
    return res.status(400).json({ error: "x et y doivent être des nombres" });
  }

  console.log("📩 Données reçues :", req.body);

  // Diffuse les données à tous les clients SSE
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify({ x, y })}\n\n`);
  });

  res.json({ status: "OK" });
});

// --------------------
// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Bridge en ligne sur port ${PORT}`);
  console.log(`📡 SSE disponible sur /events`);
  console.log(`📬 API POST disponible sur /api/pos`);
});
