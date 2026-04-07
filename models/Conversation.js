import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: String,
  content: String,
  timestamp: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  messages: [messageSchema]
}, { timestamps: true });

export default mongoose.model("Conversation", conversationSchema);