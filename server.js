// server.js
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 10000;

// --- Liste des clients SSE connectés ---
let clients = [];

// --- Endpoint pour recevoir les données du curseur ---
app.post("/api/pos", (req, res) => {
  const { x, y } = req.body;
  console.log("📩 Données reçues :", req.body);

  // Envoi aux clients connectés (Web Embeds)
  clients.forEach((client) => {
    client.res.write(`data: ${JSON.stringify({ x, y })}\n\n`);
  });

  res.json({ status: "ok" });
});

// --- Endpoint pour le flux SSE ---
app.get("/events", (req, res) => {
  // Headers nécessaires pour SSE
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  clients.push(newClient);

  console.log(`🟢 Client connecté (${clients.length} total)`);

  // Quand le client se déconnecte
  req.on("close", () => {
    console.log(`🔴 Client déconnecté`);
    clients = clients.filter((c) => c.id !== clientId);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Bridge en ligne sur port ${PORT}`);
});
