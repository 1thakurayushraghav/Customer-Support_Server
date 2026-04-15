import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
  type: {
    type: String,
    enum: ["keyword_alert", "escalation", "review_needed", "new_message", "takeover"]
  },
  title: String,
  message: String,
  priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
  isRead: { type: Boolean, default: false },
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Notification", notificationSchema);