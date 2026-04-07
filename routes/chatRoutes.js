import express from "express";
import auth from "../middleware/auth.js";
import { sendMessage } from "../controllers/chatController.js";

const router = express.Router();

router.post("/", auth, sendMessage);

export default router;