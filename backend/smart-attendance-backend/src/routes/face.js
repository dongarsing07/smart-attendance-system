import express from "express";
import { registerFace } from "../controllers/faceController.js";
import { protect } from "../middleware/auth.js";
import { studentOnly } from "../middleware/role.js";

const router = express.Router();

router.post(
  "/register",
  protect,
  studentOnly,
  registerFace
);

export default router;