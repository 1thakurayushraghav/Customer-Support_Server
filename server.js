// server.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";
import "./config/env.js"; 

import { RATE_LIMIT } from "./config/constants.js";

import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

const app = express();

// middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// rate limiter
app.use("/api/chat", rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX
}));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

// connect DB
connectDB();

app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on ${process.env.PORT}`);
});