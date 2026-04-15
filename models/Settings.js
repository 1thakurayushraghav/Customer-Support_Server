import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  // General Settings
  siteName: {
    type: String,
    default: "QESPL Admin"
  },
  siteDescription: {
    type: String,
    default: "AI-powered customer support platform"
  },
  siteLogo: {
    type: String,
    default: ""
  },
  contactEmail: {
    type: String,
    default: "admin@example.com"
  },
  supportEmail: {
    type: String,
    default: "support@example.com"
  },
  
  // AI Settings
  aiModel: {
    type: String,
    enum: ["gpt-4", "gpt-3.5-turbo", "claude-3", "llama-2"],
    default: "gpt-4"
  },
  aiTemperature: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.7
  },
  aiMaxTokens: {
    type: Number,
    default: 2000
  },
  aiContextLength: {
    type: Number,
    default: 10
  },
  aiResponseTimeout: {
    type: Number,
    default: 30
  },
  
  // Security Settings
  sessionTimeout: {
    type: Number,
    default: 60
  },
  maxLoginAttempts: {
    type: Number,
    default: 5
  },
  twoFactorAuth: {
    type: Boolean,
    default: false
  },
  passwordExpiryDays: {
    type: Number,
    default: 90
  },
  
  // Notification Settings
  emailNotifications: {
    type: Boolean,
    default: true
  },
  pushNotifications: {
    type: Boolean,
    default: true
  },
  notificationSound: {
    type: Boolean,
    default: false
  },
  adminAlertEmail: {
    type: String,
    default: "alerts@example.com"
  },
  
  // Chat Settings
  maxMessageLength: {
    type: Number,
    default: 2000
  },
  chatHistoryDays: {
    type: Number,
    default: 30
  },
  autoEscalateAfter: {
    type: Number,
    default: 5
  },
  requireHumanReview: {
    type: Boolean,
    default: false
  },
  
  // Rate Limits
  rateLimitPerMinute: {
    type: Number,
    default: 60
  },
  rateLimitPerHour: {
    type: Number,
    default: 1000
  },
  rateLimitPerDay: {
    type: Number,
    default: 10000
  },
  
  // Integration Settings
  enableAnalytics: {
    type: Boolean,
    default: true
  },
  enableLogging: {
    type: Boolean,
    default: true
  },
  logRetentionDays: {
    type: Number,
    default: 30
  }
}, {
  timestamps: true
});

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;