import mongoose from "mongoose";

const apiSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    method: { type: String, enum: ["GET", "POST", "PUT", "PATCH", "DELETE"], default: "GET" },
    expectedStatus: { type: Number, default: 200 },
    timeoutMs: { type: Number, default: 5000 },
    checkIntervalSec: { type: Number, default: 60 },
    paused: { type: Boolean, default: false },
    status: { type: String, enum: ["unknown", "healthy", "warning", "down"], default: "unknown" },
    lastResponseTime: { type: Number, default: null },
    lastCheckedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Api", apiSchema);
