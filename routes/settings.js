import express from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import { 
  getSettings,
  updateSettings,
  resetSettings,
  getSettingByKey,
  updateSettingByKey
} from "../controllers/settingsController.js";

const router = express.Router();

// All routes require authentication and admin role
router.use(auth);
router.use(admin);

// Settings routes
router.route("/")
  .get(getSettings)      // GET /api/admin/settings
  .put(updateSettings);  // PUT /api/admin/settings

router.post("/reset", resetSettings);  // POST /api/admin/settings/reset

// Single setting routes
router.route("/:key")
  .get(getSettingByKey)     // GET /api/admin/settings/:key
  .put(updateSettingByKey); // PUT /api/admin/settings/:key

export default router;