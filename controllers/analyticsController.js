import Conversation from "../models/Conversation.js";
import KeywordAlert from "../models/KeywordAlert.js";
import TrainingData from "../models/TrainingData.js";

export const getAnalytics = async (req, res) => {
  try {
    console.log("📊 Fetching analytics...");

    // ================================
    // BASIC COUNTS
    // ================================

    const totalConversations = await Conversation.countDocuments();

    const activeConversations = await Conversation.countDocuments({
      status: "active"
    });

    const escalated = await Conversation.countDocuments({
      status: "escalated"
    });

    // ================================
    // AI vs TRAINING RESPONSES
    // ================================

    const messagesAgg = await Conversation.aggregate([
      { $unwind: "$messages" },
      {
        $group: {
          _id: "$messages.sentBy",
          count: { $sum: 1 }
        }
      }
    ]);

    let aiResponses = 0;
    let trainingResponses = 0;

    messagesAgg.forEach(m => {
      if (m._id === "ai") aiResponses = m.count;
      if (m._id === "training") trainingResponses = m.count;
    });

    // ================================
    // DAILY MESSAGES (last 7 days)
    // ================================

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const dailyMessages = await Conversation.aggregate([
      { $unwind: "$messages" },
      {
        $match: {
          "messages.timestamp": { $gte: last7Days }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$messages.timestamp" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // ================================
    // KEYWORDS (from conversations)
    // ================================

    const keywordAgg = await Conversation.aggregate([
      { $unwind: "$keywordsDetected" },
      {
        $group: {
          _id: "$keywordsDetected",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const keywords = keywordAgg.map(k => ({
      keyword: k._id,
      count: k.count
    }));

    // ================================
    // TOP TRAINING USAGE
    // ================================

    const topTraining = await TrainingData.find({ isActive: true })
      .sort({ usageCount: -1 })
      .limit(5)
      .select("question usageCount");

    // ================================
    // FINAL RESPONSE
    // ================================

    res.json({
      totalConversations,
      activeConversations,
      escalated,
      aiResponses,
      trainingResponses,
      dailyMessages: dailyMessages.map(d => ({
        date: d._id,
        count: d.count
      })),
      keywords,
      topTraining
    });

  } catch (error) {
    console.error("❌ Analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};