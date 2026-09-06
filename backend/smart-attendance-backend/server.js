import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/auth.js";
import { protect } from "./src/middleware/auth.js";
import { teacherOnly, studentOnly } from "./src/middleware/role.js";
import sessionRoutes from "./src/routes/sessions.js";
import attendanceRoutes from "./src/routes/attendance.js";
import faceRoutes from "./src/routes/face.js";

// ==========================================
// DEBUG CLOUDINARY ENVIRONMENT
// ==========================================

console.log(
  "Cloudinary Cloud Name:",
  process.env.CLOUDINARY_CLOUD_NAME || "Missing ❌"
);

console.log(
  "Cloudinary API Key:",
  process.env.CLOUDINARY_API_KEY ? "Loaded ✅" : "Missing ❌"
);

console.log(
  "Cloudinary API Secret:",
  process.env.CLOUDINARY_API_SECRET ? "Loaded ✅" : "Missing ❌"
);

// ==========================================
// START SERVER
// ==========================================

const startServer = async () => {
  try {
    await connectDB();

    const app = express();

    // ==========================================
    // CORS
    // ==========================================

    const allowedOrigins = [
  "http://localhost:3000",
  "https://smart-attendance-system-eight-tau.vercel.app"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);
    // ==========================================
    // BODY PARSER
    // ==========================================

    app.use(express.json({ limit: "10mb" }));

    // ==========================================
    // ROUTES
    // ==========================================

    app.use("/api/auth", authRoutes);

    app.use("/api/sessions", sessionRoutes);

    app.use("/api/attendance", attendanceRoutes);

    app.use("/api/face", faceRoutes);

    // ==========================================
    // BASIC ROUTE
    // ==========================================

    app.get("/", (req, res) => {
      res.send("API is running 🚀");
    });

    // ==========================================
    // PROTECTED ROUTE
    // ==========================================

    app.get("/api/protected", protect, (req, res) => {
      res.json({
        message: "✅ You accessed protected route",
        user: req.user
      });
    });

    // ==========================================
    // TEACHER ROUTE
    // ==========================================

    app.get("/api/teacher", protect, teacherOnly, (req, res) => {
      res.json({
        message: "👨‍🏫 Teacher access granted"
      });
    });

    // ==========================================
    // STUDENT ROUTE
    // ==========================================

    app.get("/api/student", protect, studentOnly, (req, res) => {
      res.json({
        message: "👨‍🎓 Student access granted"
      });
    });

    // ==========================================
    // HTTP SERVER
    // ==========================================

    const server = http.createServer(app);

    // ==========================================
    // SOCKET.IO
    // ==========================================

    const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://smart-attendance-system-eight-tau.vercel.app"
    ],
    credentials: true
  }
});
    // Make Socket.IO available in controllers
    app.set("io", io);

    // ==========================================
    // SOCKET EVENTS
    // ==========================================

    io.on("connection", (socket) => {
      console.log("🔌 Socket connected:", socket.id);

      socket.on("join_session", (sessionId) => {
        console.log("📡 Joined session:", sessionId);

        socket.join(`session_${sessionId}`);
      });

      socket.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected:", reason);
      });

      socket.on("connect_error", (err) => {
        console.log("⚠️ Socket error:", err.message);
      });
    });

    // ==========================================
    // START SERVER
    // ==========================================

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`🚀 Server running on ${PORT}`);
    });

  } catch (error) {
    console.error("❌ Server failed:", error.message);
  }
};

startServer();