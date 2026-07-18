import { Router } from "express";
import Api from "../models/Api.js";
import Check from "../models/Check.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// List all APIs for the logged-in user
router.get("/", async (req, res) => {
  const apis = await Api.find({ owner: req.userId }).sort({ createdAt: -1 });
  res.json(apis);
});

// Add a new API to monitor
router.post("/", async (req, res) => {
  const { name, url, method, expectedStatus, timeoutMs, checkIntervalSec } = req.body;
  if (!name || !url) return res.status(400).json({ error: "Name and URL are required" });

  const api = await Api.create({
    owner: req.userId,
    name,
    url,
    method: method || "GET",
    expectedStatus: expectedStatus || 200,
    timeoutMs: timeoutMs || 5000,
    checkIntervalSec: checkIntervalSec || 60,
  });
  res.status(201).json(api);
});

// Edit / pause / resume an API
router.patch("/:id", async (req, res) => {
  const allowed = ["name", "url", "method", "expectedStatus", "timeoutMs", "checkIntervalSec", "paused"];
  const patch = {};
  for (const key of allowed) if (key in req.body) patch[key] = req.body[key];

  const api = await Api.findOneAndUpdate({ _id: req.params.id, owner: req.userId }, patch, { new: true });
  if (!api) return res.status(404).json({ error: "API not found" });
  res.json(api);
});

// Delete an API
router.delete("/:id", async (req, res) => {
  const api = await Api.findOneAndDelete({ _id: req.params.id, owner: req.userId });
  if (!api) return res.status(404).json({ error: "API not found" });
  await Check.deleteMany({ api: api._id });
  res.json({ deleted: true });
});

// Recent check history for one API
router.get("/:id/checks", async (req, res) => {
  const api = await Api.findOne({ _id: req.params.id, owner: req.userId });
  if (!api) return res.status(404).json({ error: "API not found" });

  const checks = await Check.find({ api: api._id }).sort({ checkedAt: -1 }).limit(50);
  res.json(checks);
});

export default router;
