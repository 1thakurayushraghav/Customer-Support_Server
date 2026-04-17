import Conversation from "../models/Conversation.js";
import KeywordAlert from "../models/KeywordAlert.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import TrainingData from "../models/TrainingData.js";
import axios from "axios";

// 🔁 RETRY FUNCTION (PRODUCTION READY)
async function callAI(url, data, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await axios.post(url, data, {
        timeout: 20000
      });
    } catch (err) {
      console.log(`⚠️ AI attempt ${i + 1} failed`);

      if (i === retries) throw err;

      // 🔥 delay before retry
      await new Promise(res => setTimeout(res, 1000 * (i + 1)));
    }
  }
}

export const sendMessage = async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user?.id;

    // ✅ VALIDATION
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message required" });
    }

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let convo;

    // ✅ GET / CREATE CONVERSATION
    if (conversationId) {
      convo = await Conversation.findOne({ _id: conversationId, userId });
      if (!convo) {
        return res.status(404).json({ error: "Conversation not found" });
      }
    } else {
      convo = await Conversation.create({
        userId,
        messages: [],
        mode: "ai",
        status: "active"
      });
    }

    const normalizedMsg = message.toLowerCase();

    // ✅ SAVE USER MESSAGE
    convo.messages.push({
      role: "user",
      content: message,
      sentBy: "user",
      timestamp: new Date()
    });

    // ===============================
    // 🔍 KEYWORD DETECTION
    // ===============================
    const keywords = await KeywordAlert.find({ isActive: true }).lean();

    const detectedKeywords = keywords.filter(k =>
      normalizedMsg.includes(k.keyword.toLowerCase())
    );

    if (detectedKeywords.length) {
      convo.keywordsDetected = detectedKeywords.map(k => k.keyword);
      convo.requiresAttention = true;

      const [user, admins] = await Promise.all([
        User.findById(userId).lean(),
        User.find({ role: "admin" }).select("_id").lean()
      ]);

      const hasHighPriority = detectedKeywords.some(k => k.priority === "high");

      const notifications = admins.map(admin => ({
        adminId: admin._id,
        conversationId: convo._id,
        type: "keyword_alert",
        title: `⚠️ Keyword Alert`,
        message: `User "${user?.name || user?.email}" needs attention`,
        priority: hasHighPriority ? "high" : "medium",
        metadata: {
          keyword: detectedKeywords[0].keyword,
          userMessage: message
        }
      }));

      const created = await Notification.insertMany(notifications);

      const io = req.app.get("io");
      if (io) {
        io.emit("admin_attention_needed", {
          conversationId: convo._id,
          userId,
          keyword: detectedKeywords[0].keyword,
          priority: hasHighPriority ? "high" : "medium",
          notificationIds: created.map(n => n._id)
        });
      }

      if (detectedKeywords.some(k => k.autoEscalate)) {
        convo.mode = "human";
        convo.status = "escalated";

        convo.messages.push({
          role: "assistant",
          content: "Connecting you to a human agent...",
          sentBy: "system",
          timestamp: new Date()
        });
      }
    }

    // ===============================
    // 📚 TRAINING MATCH
    // ===============================
    let reply = "";

    const trainingData = await TrainingData.find({ isActive: true }).lean();

    const match = trainingData.find(item =>
      normalizedMsg.includes(item.question.toLowerCase()) ||
      item.keywords?.some(k => normalizedMsg.includes(k.toLowerCase()))
    );

    if (match) {
      reply = match.answer;
    } else {
      // ===============================
      // 🤖 AI CALL (STABLE)
      // ===============================
      try {
        const history = convo.messages
          .slice(-6)
          .map(m => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content.slice(0, 500)
          }));

        const aiRes = await callAI(`${process.env.AI_URL}/chat`, {
          messages: history
        });

        reply = aiRes.data?.reply || "Sorry, I couldn't respond.";

      } catch (err) {
        console.error("🔥 AI ERROR FULL:", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data
        });

        reply = "Our AI is busy right now. Please try again.";
      }
    }

    // ===============================
    // 💬 SAVE RESPONSE (SAFE)
    // ===============================
    const lastMsg = convo.messages.length
      ? convo.messages[convo.messages.length - 1]
      : null;

    if (!(lastMsg?.role === "assistant" && lastMsg?.sentBy === "system")) {
      convo.messages.push({
        role: "assistant",
        content: reply,
        sentBy: match ? "training" : "ai",
        timestamp: new Date()
      });
    }

    convo.updatedAt = new Date();
    convo.lastMessageAt = new Date();

    await convo.save();

    return res.json({
      reply,
      conversationId: convo._id,
      keywordsDetected: detectedKeywords,
      requiresAttention: convo.requiresAttention || false,
      source: match ? "training_data" : "ai"
    });

  } catch (error) {
    console.error("SEND MESSAGE ERROR:", error);
    return res.status(500).json({
      error: "Internal server error"
    });
  }
};