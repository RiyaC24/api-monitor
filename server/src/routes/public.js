import { Router } from "express";
import Api from "../models/Api.js";

const router = Router();

// Public JSON status for one API — no login required.
// Useful for scripts, other apps, or the Chrome extension polling multiple APIs at once.
router.get("/apis/:id/status", async (req, res) => {
  const api = await Api.findById(req.params.id).select("name status lastResponseTime lastCheckedAt paused");
  if (!api) return res.status(404).json({ error: "Not found" });

  res.json({
    id: api._id,
    name: api.name,
    status: api.paused ? "paused" : api.status,
    responseTime: api.lastResponseTime,
    lastCheckedAt: api.lastCheckedAt,
  });
});

// Public shields.io-style SVG badge — embeddable in a GitHub README as an <img>.
// e.g. ![status](https://your-server.com/public/apis/<id>/badge.svg)
router.get("/apis/:id/badge.svg", async (req, res) => {
  const api = await Api.findById(req.params.id).select("name status paused");
  if (!api) return res.status(404).send("");

  const status = api.paused ? "paused" : api.status;
  const colors = { healthy: "#34d399", warning: "#fbbf24", down: "#fb7185", paused: "#8f88b8", unknown: "#8f88b8" };
  const color = colors[status] || colors.unknown;
  const label = "api";
  const value = status;

  // rough width estimate so text doesn't get clipped — good enough for a badge, not pixel-perfect
  const labelWidth = label.length * 6.5 + 10;
  const valueWidth = value.length * 6.5 + 10;
  const totalWidth = labelWidth + valueWidth;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
  <rect width="${labelWidth}" height="20" fill="#555"/>
  <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
  <g fill="#fff" font-family="Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="14" text-anchor="middle">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14" text-anchor="middle">${value}</text>
  </g>
</svg>`;

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "no-cache, max-age=0");
  res.send(svg);
});

export default router;
