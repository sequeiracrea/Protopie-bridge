import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

// Mémoire temporaire pour stocker la position du curseur
let latestData = { x: 0, y: 0, updatedAt: null };

// 🔹 Endpoint POST — reçoit les données depuis ProtoPie Connect
app.post("/api/pos", (req, res) => {
  const { x, y } = req.body;
  if (typeof x === "number" && typeof y === "number") {
    latestData = { x, y, updatedAt: Date.now() };
    console.log("📥 Position mise à jour :", latestData);
    return res.json({ status: "ok" });
  }
  res.status(400).json({ error: "Format invalide" });
});

// 🔹 Endpoint GET — renvoie la dernière position au Web Embed
app.get("/api/pos", (req, res) => {
  res.json(latestData);
});

// 🔹 Endpoint GET simple pour test
app.get("/", (req, res) => {
  res.send("✅ ProtoPie Bridge actif !");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Bridge en ligne sur port ${PORT}`)
);
