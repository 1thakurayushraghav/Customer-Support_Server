import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import KeywordAlert from "../models/KeywordAlert.js";
import Notification from "../models/Notification.js";

// =============================
// ADMIN DASHBOARD STATS
// =============================

export const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalConversations = await Conversation.countDocuments();
    const conversationsNeedingAttention = await Conversation.countDocuments({ 
      requiresAttention: true 
    });
    
    const messageCount = await Conversation.aggregate([
      { $unwind: "$messages" },
      { $count: "total" }
    ]);

    const totalMessages = messageCount[0]?.total || 0;

    res.json({
      users: totalUsers,
      conversations: totalConversations,
      messages: totalMessages,
      needsAttention: conversationsNeedingAttention
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ error: "Failed to load dashboard stats" });
  }
};

// =============================
// GET ALL USER CONVERSATIONS (WITH PAGINATION, SEARCH, FILTERS)
// =============================

export const getConversations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const filterDate = req.query.filterDate || "all";
    const sortBy = req.query.sortBy || "updatedAt";
    const sortOrder = req.query.sortOrder || "desc";
    
    let searchQuery = {};
    
    if (search) {
      const usersWithSearch = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ]
      }).select("_id");
      
      const userIds = usersWithSearch.map(u => u._id);
      
      searchQuery = {
        $or: [
          { userId: { $in: userIds } },
          { "messages.content": { $regex: search, $options: "i" } }
        ]
      };
    }
    
    let dateFilter = {};
    const now = new Date();
    
    switch(filterDate) {
      case "today":
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        dateFilter = { updatedAt: { $gte: todayStart } };
        break;
      case "week":
        const weekStart = new Date(now.setDate(now.getDate() - 7));
        dateFilter = { updatedAt: { $gte: weekStart } };
        break;
      case "month":
        const monthStart = new Date(now.setMonth(now.getMonth() - 1));
        dateFilter = { updatedAt: { $gte: monthStart } };
        break;
      default:
        dateFilter = {};
    }
    
    const query = { ...searchQuery, ...dateFilter };
    const total = await Conversation.countDocuments(query);
    const pages = Math.ceil(total / limit);
    
    let sortObject = {};
    if (sortBy === "messagesCount") {
      sortObject = { messagesCount: sortOrder === "desc" ? -1 : 1 };
    } else {
      sortObject = { [sortBy]: sortOrder === "desc" ? -1 : 1 };
    }
    
    let conversations = await Conversation
      .find(query)
      .populate("userId", "name email")
      .sort(sortObject)
      .skip(skip)
      .limit(limit);
    
    if (sortBy === "messagesCount") {
      conversations = conversations.map(conv => ({
        ...conv.toObject(),
        messagesCount: conv.messages?.length || 0
      }));
      
      conversations.sort((a, b) => {
        if (sortOrder === "desc") {
          return b.messagesCount - a.messagesCount;
        } else {
          return a.messagesCount - b.messagesCount;
        }
      });
    }
    
    res.json({
      conversations,
      total,
      pages,
      currentPage: page,
      limit
    });
  } catch (error) {
    console.error("Conversations error:", error);
    res.status(500).json({ error: "Failed to load conversations" });
  }
};

// =============================
// GET SINGLE CONVERSATION
// =============================

export const getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation
      .findById(req.params.id)
      .populate("userId", "name email");
    
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    res.json(conversation);
  } catch (error) {
    console.error("Conversation fetch error:", error);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
};

// =============================
// DELETE CONVERSATION
// =============================

export const deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndDelete(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    res.json({ message: "Conversation deleted successfully" });
  } catch (error) {
    console.error("Conversation delete error:", error);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
};

// =============================
// LIVE CHAT ADMIN FUNCTIONS
// =============================

// Get conversations needing attention
export const getAttentionNeededConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      requiresAttention: true,
      status: { $in: ["review_needed", "escalated", "pending"] }
    })
    .populate('userId', 'name email')
    .sort({ updatedAt: -1 });
    
    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error("Get attention conversations error:", error);
    res.status(500).json({ error: "Failed to get conversations" });
  }
};

// Get admin notifications

export const getAdminNotifications = async (req, res) => {
  try {
    const adminId = req.user._id;
    
    console.log("📢 Fetching notifications for admin:", adminId);
    
    const notifications = await Notification.find({ adminId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    const unreadCount = await Notification.countDocuments({ 
      adminId, 
      isRead: false 
    });
    
    console.log(`📊 Found ${notifications.length} notifications, ${unreadCount} unread`);
    
    res.json({
      success: true,
      notifications: notifications,
      unreadCount: unreadCount
    });
    
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Failed to get notifications" });
  }
};
// Mark notification as read
export const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    await Notification.findByIdAndUpdate(notificationId, { 
      isRead: true 
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ error: "Failed to mark notification" });
  }
};

// Mark all notifications as read
export const markAllNotificationsRead = async (req, res) => {
  try {
    const adminId = req.user._id;
    
    await Notification.updateMany(
      { adminId, isRead: false },
      { isRead: true }
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error("Mark all read error:", error);
    res.status(500).json({ error: "Failed to mark notifications" });
  }
};

// Admin review and approve/reject AI response
export const reviewAIResponse = async (req, res) => {
  try {
    const { conversationId, action, editedResponse } = req.body;
    const adminId = req.user._id;
    
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    if (action === 'approve') {
      // Approve and send AI response
      if (conversation.aiDraftResponse) {
        conversation.messages.push({
          role: "assistant",
          content: conversation.aiDraftResponse,
          sentBy: "ai",
          isReviewed: true,
          reviewedBy: adminId,
          timestamp: new Date()
        });
      }
      conversation.mode = "ai";
      conversation.status = "active";
      conversation.requiresAttention = false;
      conversation.reviewedBy = adminId;
      conversation.reviewedAt = new Date();
    }
    else if (action === 'edit') {
      // Edit and send response
      conversation.messages.push({
        role: "assistant",
        content: editedResponse,
        sentBy: "admin",
        isReviewed: true,
        reviewedBy: adminId,
        editedContent: editedResponse,
        timestamp: new Date()
      });
      conversation.mode = "ai";
      conversation.status = "active";
      conversation.requiresAttention = false;
      conversation.reviewedBy = adminId;
      conversation.reviewedAt = new Date();
    }
    else if (action === 'reject') {
      // Reject AI response and take over
      conversation.mode = "human";
      conversation.status = "escalated";
      conversation.requiresAttention = true;
      conversation.reviewedBy = adminId;
      conversation.reviewedAt = new Date();
      
      conversation.messages.push({
        role: "assistant",
        content: "An admin will assist you shortly.",
        sentBy: "system",
        timestamp: new Date()
      });
    }
    
    conversation.aiDraftResponse = null;
    await conversation.save();
    
    const io = req.app.get('io');
    if (io) {
      io.emit('review_completed', {
        conversationId,
        action,
        mode: conversation.mode
      });
    }
    
    res.json({
      success: true,
      conversation,
      mode: conversation.mode
    });
  } catch (error) {
    console.error("Review error:", error);
    res.status(500).json({ error: "Failed to review response" });
  }
};

// Admin take over conversation
export const takeOverConversation = async (req, res) => {
  try {
    const { conversationId } = req.body;
    const adminId = req.user._id;
    
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    conversation.mode = "human";
    conversation.assignedAdmin = adminId;
    conversation.status = "active";
    conversation.requiresAttention = true;
    conversation.humanTakeoverAt = new Date();
    
    await conversation.save();
    
    // Add system message
    const systemMessage = {
      role: "assistant",
      content: "An admin has joined the conversation and will assist you.",
      sentBy: "system",
      timestamp: new Date()
    };
    conversation.messages.push(systemMessage);
    await conversation.save();
    
    const io = req.app.get('io');
    if (io) {
      io.emit('admin_took_over', {
        conversationId,
        adminId
      });
    }
    
    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error("Takeover error:", error);
    res.status(500).json({ error: "Failed to take over conversation" });
  }
};

// Admin send message in human mode
export const adminSendMessage = async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    const adminId = req.user._id;
    const admin = await User.findById(adminId);
    
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    const adminMessage = {
      role: "admin",
      content: message,
      sentBy: "admin",
      senderName: admin?.name || "Admin",
      timestamp: new Date()
    };
    
    conversation.messages.push(adminMessage);
    conversation.lastMessageAt = new Date();
    await conversation.save();
    
    const io = req.app.get('io');
    if (io) {
      io.emit('admin_message', {
        conversationId,
        message: adminMessage
      });
    }
    
    res.json({
      success: true,
      message: adminMessage
    });
  } catch (error) {
    console.error("Admin send error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// Get all active live chats
export const getActiveLiveChats = async (req, res) => {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    const activeChats = await Conversation
      .find({
        $or: [
          { updatedAt: { $gte: thirtyMinutesAgo } },
          { requiresAttention: true },
          { mode: "human" }
        ]
      })
      .populate("userId", "name email")
      .sort({ updatedAt: -1 });
    
    res.json({
      success: true,
      chats: activeChats,
      total: activeChats.length
    });
  } catch (error) {
    console.error("Active chats error:", error);
    res.status(500).json({ error: "Failed to fetch active chats" });
  }
};

// =============================
// KEYWORD MANAGEMENT (ADMIN ONLY)
// =============================

export const getKeywords = async (req, res) => {
  try {
    const keywords = await KeywordAlert.find().sort({ createdAt: -1 });
    res.json({ success: true, keywords });
  } catch (error) {
    console.error("Get keywords error:", error);
    res.status(500).json({ error: "Failed to get keywords" });
  }
};

export const addKeyword = async (req, res) => {
  try {
    const { keyword, category, priority, autoEscalate, responseTemplate } = req.body;
    
    const existingKeyword = await KeywordAlert.findOne({ 
      keyword: keyword.toLowerCase() 
    });
    
    if (existingKeyword) {
      return res.status(400).json({ error: "Keyword already exists" });
    }
    
    const newKeyword = new KeywordAlert({
      keyword: keyword.toLowerCase(),
      category,
      priority,
      autoEscalate: autoEscalate || false,
      responseTemplate
    });
    
    await newKeyword.save();
    res.json({ success: true, keyword: newKeyword });
  } catch (error) {
    console.error("Add keyword error:", error);
    res.status(500).json({ error: "Failed to add keyword" });
  }
};

export const updateKeyword = async (req, res) => {
  try {
    const { id } = req.params;
    const { keyword, category, priority, autoEscalate, responseTemplate, isActive } = req.body;
    
    const updatedKeyword = await KeywordAlert.findByIdAndUpdate(
      id,
      {
        keyword: keyword?.toLowerCase(),
        category,
        priority,
        autoEscalate,
        responseTemplate,
        isActive
      },
      { new: true }
    );
    
    if (!updatedKeyword) {
      return res.status(404).json({ error: "Keyword not found" });
    }
    
    res.json({ success: true, keyword: updatedKeyword });
  } catch (error) {
    console.error("Update keyword error:", error);
    res.status(500).json({ error: "Failed to update keyword" });
  }
};

export const deleteKeyword = async (req, res) => {
  try {
    const { id } = req.params;
    await KeywordAlert.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete keyword error:", error);
    res.status(500).json({ error: "Failed to delete keyword" });
  }
};