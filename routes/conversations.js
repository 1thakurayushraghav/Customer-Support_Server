// routes/conversations.js
import express from "express";
import Conversation from "../models/Conversation.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// GET all conversations
router.get("/", auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.user.id })
      .sort({ updatedAt: -1 });
    
    const formatted = conversations.map(conv => {
      const firstUserMsg = conv.messages.find(m => m.role === "user");
      const title = firstUserMsg 
        ? firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? "..." : "")
        : "New conversation";
      
      return {
        _id: conv._id,
        title: title,
        updatedAt: conv.updatedAt,
        messages: conv.messages.slice(-2)
      };
    });
    
    res.json({ conversations: formatted });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// GET single conversation
router.get("/:id", auth, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    res.json({ conversation });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

// POST create conversation
router.post("/", auth, async (req, res) => {
  try {
    const conversation = await Conversation.create({
      userId: req.user.id,
      messages: [],
      mode: "ai",
      status: "active"
    });
    
    res.json({ conversation });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// DELETE conversation
router.delete("/:id", auth, async (req, res) => {
  try {
    await Conversation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    res.json({ message: "Conversation deleted" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

export default router;