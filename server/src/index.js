import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { startMonitor } from "./services/monitor.js";
import authRoutes from "./routes/auth.js";
import apiRoutes from "./routes/apis.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));
app.use("/auth", authRoutes);
app.use("/apis", apiRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

const port = process.env.PORT || 4000;

connectDB()
  .then(() => {
    startMonitor();
    app.listen(port, () => console.log(`[server] listening on :${port}`));
  })
  .catch((err) => {
    console.error("[db] failed to connect", err.message);
    process.exit(1);
  });
