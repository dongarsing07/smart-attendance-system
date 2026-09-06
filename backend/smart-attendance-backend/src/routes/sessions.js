import express from "express";

import {
  createSession,
  getSessionAttendance,
  getMySessions,
  getTeacherAnalytics
} from "../controllers/sessionController.js";

import { protect } from "../middleware/auth.js";
import { teacherOnly } from "../middleware/role.js";

const router = express.Router();

// Create attendance session
router.post(
  "/",
  protect,
  teacherOnly,
  createSession
);

// Teacher analytics
router.get(
  "/analytics",
  protect,
  teacherOnly,
  getTeacherAnalytics
);

// Get attendance for a session
router.get(
  "/:sessionId/attendance",
  protect,
  teacherOnly,
  getSessionAttendance
);

// Get teacher's sessions
router.get(
  "/",
  protect,
  teacherOnly,
  getMySessions
);

export default router;