import express from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import {
  addTraining,
  getTraining,
  updateTraining,
  deleteTraining
} from "../controllers/trainingController.js";

const router = express.Router();

router.get("/", auth, admin, getTraining);
router.post("/", auth, admin, addTraining);
router.put("/:id", auth, admin, updateTraining);
router.delete("/:id", auth, admin, deleteTraining);

export default router;