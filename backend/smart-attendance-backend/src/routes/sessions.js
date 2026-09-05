import express from "express";
import { createSession } from "../controllers/sessionController.js";
import { protect } from "../middleware/auth.js";
import { teacherOnly } from "../middleware/role.js";
import { getSessionAttendance } from "../controllers/sessionController.js";
import { getMySessions } from "../controllers/sessionController.js";


const router = express.Router();

router.post("/", protect, teacherOnly, createSession);
router.get("/:sessionId/attendance", protect, teacherOnly, getSessionAttendance);
router.get("/", protect, teacherOnly, getMySessions);

export default router;