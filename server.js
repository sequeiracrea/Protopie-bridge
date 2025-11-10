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
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  clients.push(res);
  console.log(`🟢 Nouveau client SSE, total : ${clients.length}`);

  // Envoi de la dernière position
  res.write(`data: ${JSON.stringify(lastPos)}\n\n`);

  req.on("close", () => {
    clients = clients.filter((c) => c !== res);
    console.log(`🔴 Client SSE déconnecté, total : ${clients.length}`);
  });
});

// POST /api/pos
app.post("/api/pos", (req, res) => {
  console.log("📦 Données brutes reçues :", req.body);

  let data;
  try {
    data = JSON.parse(req.body);
  } catch (err) {
    console.warn("⚠️ JSON invalide, ignoré :", req.body);
    return res.sendStatus(400);
  }

  if (typeof data.x === "number" && typeof data.y === "number") {
    lastPos = data;
    const payload = JSON.stringify(data);
    clients.forEach((c) => c.write(`data: ${payload}\n\n`));
    console.log("📩 Données valides :", data);
  } else {
    console.warn("⚠️ Données incorrectes :", data);
  }

  res.sendStatus(200);
});

// Port Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Bridge en ligne sur port ${PORT}`));
