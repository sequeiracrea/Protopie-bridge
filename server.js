import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();

// ✅ Autorise ton domaine Cloudflare / GitHub Pages
app.use(
  cors({
    origin: [
      "https://generative-pattern.pages.dev", // ← ton front Cloudflare
      "https://tonuser.github.io", // ← si tu héberges aussi sur GitHub Pages
    ],
    methods: ["GET", "POST"],
  })
);

app.use(bodyParser.text({ type: "*/*" }));

let clients = [];
let currentPos = { x: 0, y: 0 };

// 🔵 SSE : pour le viewer
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  clients.push(res);
  console.log("🟢 Nouveau client SSE, total :", clients.length);
  res.write(`data: ${JSON.stringify(currentPos)}\n\n`);

  req.on("close", () => {
    clients = clients.filter((c) => c !== res);
    console.log("🔴 Client SSE déconnecté, total :", clients.length);
  });
});

function broadcast(data) {
  clients.forEach((c) => c.write(`data: ${JSON.stringify(data)}\n\n`));
}

// 🔸 Reçoit posX
app.post("/api/posX", (req, res) => {
  const x = parseFloat(req.body);
  if (isNaN(x)) return res.status(400).send("x invalide");
  currentPos.x = x;
  broadcast(currentPos);
  console.log("📩 x reçu :", x);
  res.sendStatus(200);
});

// 🔸 Reçoit posY
app.post("/api/posY", (req, res) => {
  const y = parseFloat(req.body);
  if (isNaN(y)) return res.status(400).send("y invalide");
  currentPos.y = y;
  broadcast(currentPos);
  console.log("📩 y reçu :", y);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Bridge en ligne sur port ${PORT}`));
