import mongoose from "mongoose";

const keywordAlertSchema = new mongoose.Schema({
  keyword: { type: String, required: true, unique: true },
  category: {
    type: String,
    enum: ["urgent", "complaint", "refund", "technical", "billing", "general"],
    default: "general"
  },
  priority: {
    type: String,
    enum: ["high", "medium", "low"],
    default: "medium"
  },
  autoEscalate: { type: Boolean, default: false },
  responseTemplate: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("KeywordAlert", keywordAlertSchema);