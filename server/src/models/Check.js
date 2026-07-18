import mongoose from "mongoose";

const checkSchema = new mongoose.Schema(
  {
    api: { type: mongoose.Schema.Types.ObjectId, ref: "Api", required: true, index: true },
    success: { type: Boolean, required: true },
    statusCode: { type: Number, default: null },
    responseTime: { type: Number, default: null },
    error: { type: String, default: null },
    checkedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export default mongoose.model("Check", checkSchema);
