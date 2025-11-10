import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json()); // permet de lire le body JSON

// Vérification que le bridge tourne
app.get("/", (req, res) => {
  res.send("✅ ProtoPie Bridge actif !");
});

// Route API pour recevoir les positions
app.post("/api/pos", (req, res) => {
  const { x, y } = req.body;
  console.log("📩 Données reçues :", req.body);

  if (x === undefined || y === undefined) {
    return res.status(400).json({ error: "Missing x or y" });
  }

  // Réponse simple pour Connect
  res.json({
    success: true,
    received: { x, y },
    message: "Coordonnées bien reçues 🚀"
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Bridge en ligne sur port ${PORT}`);
});
