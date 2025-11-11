// server.js — Bridge WebSocket + SSE entre ProtoPie et le site web
import express from "express";
import bodyParser from "body-parser";
import { WebSocketServer } from "ws";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.text({ type: "*/*" }));

// CORS complet pour ton domaine
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // ou ton domaine Cloudflare si tu veux restreindre
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// 🟢 Stocke les connexions WebSocket
const wss = new WebSocketServer({ noServer: true });
let wsClients = [];

// 🔵 Fallback SSE
let sseClients = [];

// --- 🔁 WebSocket Broadcast ---
function broadcastWS(data) {
  wsClients.forEach(ws => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(data));
    }
  });
}

// --- 🔁 SSE Broadcast ---
function broadcastSSE(data) {
  sseClients.forEach(res => res.write(`data: ${JSON.stringify(data)}\n\n`));
}

// --- ✅ API pour recevoir les données de ProtoPie Connect ---
app.post("/api/pos", (req, res) => {
  try {
    const body = req.body.trim();
    if (!body) throw new Error("Corps vide");

    const data = JSON.parse(body);
    const { x, y } = data;

    if (typeof x !== "number" || typeof y !== "number") {
      console.warn("⚠️ x ou y invalide :", x, y);
      return res.status(400).send("Invalid data");
    }

    // Envoie aux clients connectés
    broadcastWS({ x, y });
    broadcastSSE({ x, y });
    console.log("📩 x reçu :", x, "| y reçu :", y);

    res.sendStatus(200);
  } catch (err) {
    console.warn("⚠️ Données non valides reçues :", req.body);
    res.status(400).send("Bad Request");
  }
});

// --- 🟢 Endpoint SSE ---
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  sseClients.push(res);
  console.log(`🟢 Nouveau client SSE, total : ${sseClients.length}`);

  req.on("close", () => {
    sseClients = sseClients.filter(c => c !== res);
    console.log(`🔴 Client SSE déconnecté, total : ${sseClients.length}`);
  });
});

// --- ⚙️ Upgrade vers WebSocket ---
const server = app.listen(PORT, () => {
  console.log(`🚀 Bridge WebSocket + SSE en ligne sur port ${PORT}`);
});

server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wsClients.push(ws);
    console.log(`🟢 Client WebSocket connecté, total : ${wsClients.length}`);

    ws.on("close", () => {
      wsClients = wsClients.filter(c => c !== ws);
      console.log(`🔴 Client WebSocket déconnecté, total : ${wsClients.length}`);
    });
  });
});
