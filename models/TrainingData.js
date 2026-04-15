import mongoose from "mongoose";

const trainingSchema = new mongoose.Schema({
  question: String,
  answer: String,
  category: String,
  keywords: [String],
  priority: {
    type: String,
    enum: ["high", "medium", "low"],
    default: "medium"
  },
  usageCount: { type: Number, default: 0 },
  lastUsed: Date,
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

export default mongoose.model("TrainingData", trainingSchema);