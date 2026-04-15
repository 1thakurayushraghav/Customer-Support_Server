import express from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import { 
  getStats, 
  getConversations, 
  getConversationById,
  deleteConversation,
  // Live chat admin functions
  getAttentionNeededConversations,
  getAdminNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  reviewAIResponse,
  takeOverConversation,
  adminSendMessage,
  getActiveLiveChats,
  // Keyword management
  getKeywords,
  addKeyword,
  updateKeyword,
  deleteKeyword
} from "../controllers/adminController.js";

const router = express.Router();

// Dashboard stats
router.get("/stats", auth, admin, getStats);

// Conversation management
router.get("/conversations", auth, admin, getConversations);
router.get("/conversations/:id", auth, admin, getConversationById);
router.delete("/conversations/:id", auth, admin, deleteConversation);

// Live chat - Attention & Notifications
router.get("/live-chats", auth, admin, getActiveLiveChats);
router.get("/attention-needed", auth, admin, getAttentionNeededConversations);
router.get("/notifications", auth, admin, getAdminNotifications);
router.put("/notifications/:notificationId/read", auth, admin, markNotificationRead);
router.put("/notifications/read-all", auth, admin, markAllNotificationsRead);

// Live chat - Actions
router.post("/review-response", auth, admin, reviewAIResponse);
router.post("/takeover", auth, admin, takeOverConversation);
router.post("/send-message", auth, admin, adminSendMessage);

// Keyword management
router.get("/keywords", auth, admin, getKeywords);
router.post("/keywords", auth, admin, addKeyword);
router.put("/keywords/:id", auth, admin, updateKeyword);
router.delete("/keywords/:id", auth, admin, deleteKeyword);

export default router;