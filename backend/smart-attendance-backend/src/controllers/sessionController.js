import Session from "../models/Session.js";
import Attendance from "../models/Attendance.js";
import { v4 as uuidv4 } from "uuid";
import { generateQRToken, generateQRCode } from "../utils/qrToken.js";
import mongoose from "mongoose";

// ==============================
// ✅ CREATE SESSION
// ==============================
export const createSession = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude == null || longitude == null) {
      return res.status(400).json({
        success: false,
        message: "Latitude and Longitude are required",
      });
    }

    const expirySeconds = parseInt(process.env.SESSION_EXPIRY_SECONDS) || 60;

    const sessionId = uuidv4();
    const expiry = new Date(Date.now() + expirySeconds * 1000);

    const session = await Session.create({
      sessionId,
      createdBy: req.user._id,
      expiry,
      latitude,
      longitude,
    });

    const qrToken = generateQRToken(session._id);
    const qr = await generateQRCode(qrToken);

    return res.status(201).json({
      success: true,
      message: "Session created successfully",
      session: {
        _id: session._id,
        sessionId: session.sessionId,
        expiry: session.expiry,
        latitude: session.latitude,
        longitude: session.longitude,
        createdAt: session.createdAt,
      },
      qrToken,
      qr,
    });
  } catch (err) {
    console.error("Create Session Error:", err.message);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==============================
// ✅ GET SESSION ATTENDANCE
// ==============================
export const getSessionAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID",
      });
    }

    const records = await Attendance.find({
      sessionId: new mongoose.Types.ObjectId(sessionId),
    })
      .populate("studentId", "name email")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (err) {
    console.error("Get Session Attendance Error:", err.message);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==============================
// ✅ GET MY SESSIONS (DASHBOARD)
// ==============================
export const getMySessions = async (req, res) => {
  try {
    const sessions = await Session.find({
      createdBy: req.user._id,
    }).sort({ createdAt: -1 });

    const sessionsWithStats = await Promise.all(
      sessions.map(async (session) => {
        const sessionObjectId = new mongoose.Types.ObjectId(session._id);

        // ✅ Count present
        const presentCount = await Attendance.countDocuments({
          sessionId: sessionObjectId,
          status: "Present",
        });

        // ✅ Count total attempts
        const totalMarked = await Attendance.countDocuments({
          sessionId: sessionObjectId,
        });

        return {
          _id: session._id,
          sessionId: session.sessionId,
          createdAt: session.createdAt,
          expiry: session.expiry,
          latitude: session.latitude,
          longitude: session.longitude,
          presentCount,
          totalMarked,
        };
      })
    );

    return res.json({
      success: true,
      count: sessionsWithStats.length,
      data: sessionsWithStats,
    });
  } catch (err) {
    console.error("Get Sessions Error:", err.message);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};