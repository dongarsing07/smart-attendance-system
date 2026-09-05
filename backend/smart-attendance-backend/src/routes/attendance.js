import express from "express";
import { markAttendance, getMyAttendance } from "../controllers/attendanceController.js";
import { protect } from "../middleware/auth.js";
import { studentOnly } from "../middleware/role.js";

const router = express.Router();

// Mark attendance
router.post("/mark", protect, studentOnly, markAttendance);

// 🔥 ADD THIS (history)
router.get("/my-attendance", protect, studentOnly, getMyAttendance);

export default router;