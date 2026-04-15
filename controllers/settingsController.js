import Settings from "../models/Settings.js";
import User from "../models/User.js";

// Default settings values
const defaultSettings = {
  siteName: "QESPL Admin",
  siteDescription: "AI-powered customer support platform",
  siteLogo: "",
  contactEmail: "admin@example.com",
  supportEmail: "support@example.com",
  aiModel: "gpt-4",
  aiTemperature: 0.7,
  aiMaxTokens: 2000,
  aiContextLength: 10,
  aiResponseTimeout: 30,
  sessionTimeout: 60,
  maxLoginAttempts: 5,
  twoFactorAuth: false,
  passwordExpiryDays: 90,
  emailNotifications: true,
  pushNotifications: true,
  notificationSound: false,
  adminAlertEmail: "alerts@example.com",
  maxMessageLength: 2000,
  chatHistoryDays: 30,
  autoEscalateAfter: 5,
  requireHumanReview: false,
  rateLimitPerMinute: 60,
  rateLimitPerHour: 1000,
  rateLimitPerDay: 10000,
  enableAnalytics: true,
  enableLogging: true,
  logRetentionDays: 30
};

// =============================
// GET ALL SETTINGS
// =============================
export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      // Create default settings if not exists
      settings = await Settings.create(defaultSettings);
    }
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch settings",
      error: error.message 
    });
  }
};

// =============================
// UPDATE ALL SETTINGS
// =============================
export const updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    
    // Find and update, or create if doesn't exist
    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: settings,
      message: "Settings updated successfully"
    });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update settings",
      error: error.message 
    });
  }
};

// =============================
// RESET SETTINGS TO DEFAULTS
// =============================
export const resetSettings = async (req, res) => {
  try {
    // Delete existing settings
    await Settings.deleteMany({});
    
    // Create new settings with defaults
    const settings = await Settings.create(defaultSettings);
    
    res.json({
      success: true,
      data: settings,
      message: "Settings reset to defaults successfully"
    });
  } catch (error) {
    console.error("Reset settings error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to reset settings",
      error: error.message 
    });
  }
};

// =============================
// GET SINGLE SETTING BY KEY
// =============================
export const getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const settings = await Settings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Settings not found"
      });
    }
    
    if (settings[key] === undefined) {
      return res.status(404).json({
        success: false,
        message: `Setting '${key}' not found`
      });
    }
    
    res.json({
      success: true,
      data: { [key]: settings[key] }
    });
  } catch (error) {
    console.error("Get setting by key error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch setting",
      error: error.message 
    });
  }
};

// =============================
// UPDATE SINGLE SETTING BY KEY
// =============================
export const updateSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    const settings = await Settings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Settings not found"
      });
    }
    
    if (settings[key] === undefined) {
      return res.status(404).json({
        success: false,
        message: `Setting '${key}' not found`
      });
    }
    
    settings[key] = value;
    await settings.save();
    
    res.json({
      success: true,
      data: { [key]: settings[key] },
      message: `Setting '${key}' updated successfully`
    });
  } catch (error) {
    console.error("Update setting by key error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update setting",
      error: error.message 
    });
  }
};