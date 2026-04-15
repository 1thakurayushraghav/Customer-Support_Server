import express from "express";
import cors from "cors";
import helmet from "helmet";
import http from "http";
import { Server } from "socket.io";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";
import "./config/env.js";
import { RATE_LIMIT } from "./config/constants.js";

import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import conversationRoutes from "./routes/conversations.js";
import trainingRoutes from "./routes/trainingRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import settingsRoutes from "./routes/settings.js";

const app = express();

// ✅ TRUST PROXY (important for production)
app.set("trust proxy", 1);

// ✅ Create server
const server = http.createServer(app);

// ✅ Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
});

app.set("io", io);

// socket events
io.on("connection", (socket) => {
  console.log("🔌 Connected:", socket.id);

  socket.on("join_conversation", (id) => {
    socket.join(`conversation_${id}`);
  });

  socket.on("leave_conversation", (id) => {
    socket.leave(`conversation_${id}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
  });
});

// ✅ Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(helmet());

// ✅ Rate limit
app.use("/api/chat", rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX
}));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/training", trainingRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingsRoutes);

// ✅ DB
connectDB();

// ✅ Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});