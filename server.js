// server.js
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// ---- Gestion SSE ----
let clients = [];

// Route SSE : chaque client s'abonne ici
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Ajoute le client à la liste
  clients.push(res);

  // Retire le client si la connexion se ferme
  req.on("close", () => {
    clients = clients.filter(c => c !== res);
  });
});

// ---- Réception des données depuis ProtoPie Connect ----
app.post("/api/pos", (req, res) => {
  const { x, y } = req.body;
  console.log("📩 Données reçues :", req.body);

  // Envoie les données à tous les clients connectés
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify({ x, y })}\n\n`);
  });

  res.json({ status: "OK" });
});

// ---- Démarrage ----
app.listen(PORT, () => {
  console.log(`🚀 Bridge en ligne sur port ${PORT}`);
});
