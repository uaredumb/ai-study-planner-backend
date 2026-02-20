require("dotenv").config();
const express = require("express");
const path = require("path");

const aiRoutes = require("./routes/ai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.use("/api", aiRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
