import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Variable globale pour garder la dernière position connue
let latestData = null;

// Quand un client WebSocket se connecte (le navigateur)
wss.on("connection", (ws) => {
  console.log("🟢 Nouveau client WebSocket connecté");

  // Envoi toutes les 30 ms de la dernière donnée connue
  const interval = setInterval(() => {
    if (latestData && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(latestData));
      latestData = null; // Réinitialiser après envoi
    }
  }, 30);

  ws.on("close", () => {
    console.log("🔴 Client WebSocket déconnecté");
    clearInterval(interval);
  });
});

// Endpoint pour recevoir les données de ProtoPie Connect
app.post("/api/pos", (req, res) => {
  try {
    const { x, y } = req.body;
    if (typeof x === "number" && typeof y === "number") {
      latestData = { x, y };
      console.log(`📩 Position reçue : x=${x.toFixed(2)}, y=${y.toFixed(2)}`);
      res.sendStatus(200);
    } else {
      console.warn("⚠️ Données invalides :", req.body);
      res.status(400).send("Invalid data");
    }
  } catch (err) {
    console.error("⚠️ Erreur JSON :", err.message);
    res.status(400).send("Bad JSON");
  }
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Bridge WebSocket en ligne sur le port ${PORT}`);
});
