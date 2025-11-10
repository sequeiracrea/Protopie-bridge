import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ---- Route principale pour test ----
app.get("/", (req, res) => {
  res.send("✅ ProtoPie Bridge actif !");
});

// ---- Route API pour recevoir posX et posY ----
app.post("/api/pos", (req, res) => {
  const { x, y } = req.body;
  console.log("📩 Données reçues :", x, y);

  // Vérifie que les valeurs existent
  if (typeof x === "undefined" || typeof y === "undefined") {
    return res.status(400).json({ error: "Missing x or y" });
  }

  // Réponse test pour Connect
  res.json({ success: true, received: { x, y } });
});

// ---- Lancement du serveur ----
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Bridge en ligne sur port ${PORT}`));
