import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

app.post("/api/pos", (req, res) => {
  console.log("📩 Données reçues :", req.body);
  res.status(200).json({ status: "ok", received: req.body });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Bridge en ligne sur port ${PORT}`));
