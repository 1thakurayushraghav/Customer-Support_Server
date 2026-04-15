import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: String,
  content: String,
  sentBy: { type: String, enum: ["user", "ai", "admin", "system", "training"], default: "user" },
  senderName: String,
  isReviewed: { type: Boolean, default: false },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  editedContent: String,
  timestamp: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",   
    required: true
  },
  messages: [messageSchema],
  
  mode: {
    type: String,
    enum: ["ai", "human", "hybrid", "pending_review"],
    default: "ai"
  },
  assignedAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  confidenceScore: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["active", "resolved", "escalated", "pending", "review_needed"],
    default: "active"
  },
  keywordsDetected: [String],
  requiresAttention: { type: Boolean, default: false },
  aiDraftResponse: { type: String },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: Date,
  escalatedAt: Date,
  humanTakeoverAt: Date,
  lastMessageAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Conversation", conversationSchema);