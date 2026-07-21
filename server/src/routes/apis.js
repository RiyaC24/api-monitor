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
  const { name, url, method, expectedStatus, timeoutMs, checkIntervalSec, category, tags, headers } = req.body;
  if (!name || !url) return res.status(400).json({ error: "Name and URL are required" });

  const api = await Api.create({
    owner: req.userId,
    name,
    url,
    method: method || "GET",
    expectedStatus: expectedStatus || 200,
    timeoutMs: timeoutMs || 5000,
    checkIntervalSec: checkIntervalSec || 60,
    category: category || "",
    tags: Array.isArray(tags) ? tags : [],
    headers: headers && typeof headers === "object" ? headers : {},
  });
  res.status(201).json(api);
});

// Add multiple APIs at once. Body: { items: [{ name, url, method?, category?, tags?, checkIntervalSec? }, ...] }
router.post("/bulk", async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const valid = items.filter((it) => it && it.name && it.url);
  if (valid.length === 0) return res.status(400).json({ error: "No valid items (each needs name and url)" });

  const docs = valid.map((it) => ({
    owner: req.userId,
    name: it.name,
    url: it.url,
    method: it.method || "GET",
    expectedStatus: it.expectedStatus || 200,
    timeoutMs: it.timeoutMs || 5000,
    checkIntervalSec: it.checkIntervalSec || 60,
    category: it.category || "",
    tags: Array.isArray(it.tags) ? it.tags : [],
    headers: it.headers && typeof it.headers === "object" ? it.headers : {},
  }));

  const created = await Api.insertMany(docs);
  res.status(201).json({ created: created.length, apis: created });
});

// Edit / pause / resume an API
router.patch("/:id", async (req, res) => {
  const allowed = [
    "name", "url", "method", "expectedStatus", "timeoutMs", "checkIntervalSec",
    "paused", "category", "tags", "headers",
  ];
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

// Export full check history for one API as CSV
router.get("/:id/checks/export.csv", async (req, res) => {
  const api = await Api.findOne({ _id: req.params.id, owner: req.userId });
  if (!api) return res.status(404).json({ error: "API not found" });

  const checks = await Check.find({ api: api._id }).sort({ checkedAt: -1 }).limit(5000);

  const header = "checkedAt,success,statusCode,responseTimeMs,error\n";
  const rows = checks
    .map((c) => {
      const error = c.error ? `"${c.error.replace(/"/g, '""')}"` : "";
      return [c.checkedAt.toISOString(), c.success, c.statusCode ?? "", c.responseTime ?? "", error].join(",");
    })
    .join("\n");

  const filename = `${api.name.replace(/[^a-z0-9]/gi, "_")}_checks.csv`;
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(header + rows);
});

export default router;
