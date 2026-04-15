import express from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import {
  getUsers,
  getUserDetails,
  updateUser,
  deleteUser,
  bulkDeleteUsers
} from "../controllers/userController.js";

const router = express.Router();

router.use(auth, admin);

router.get("/", getUsers);
router.get("/:id", getUserDetails);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.post("/bulk-delete", bulkDeleteUsers);

export default router;