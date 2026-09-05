import Attendance from "../models/Attendance.js";
import Session from "../models/Session.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { getDistanceInMeters } from "../utils/haversine.js";


// ==========================================
// FACE DISTANCE
// ==========================================

const calculateFaceDistance = (descriptor1, descriptor2) => {

  if (
    !Array.isArray(descriptor1) ||
    !Array.isArray(descriptor2) ||
    descriptor1.length !== 128 ||
    descriptor2.length !== 128
  ) {
    return null;
  }

  let sum = 0;

  for (let i = 0; i < 128; i++) {

    const difference =
      descriptor1[i] - descriptor2[i];

    sum += difference * difference;
  }

  return Math.sqrt(sum);
};


// ==========================================
// MARK ATTENDANCE
// ==========================================

export const markAttendance = async (req, res) => {

  try {

    const {
      qrToken,
      location,
      faceDescriptor
    } = req.body;


    // ==========================================
    // DEBUG REQUEST
    // ==========================================

    console.log("========================================");
    console.log("📥 ATTENDANCE REQUEST RECEIVED");

    console.log(
      "QR token exists:",
      !!qrToken
    );

    console.log(
      "Location:",
      location
    );

    console.log(
      "Face descriptor type:",
      typeof faceDescriptor
    );

    console.log(
      "Face descriptor is array:",
      Array.isArray(faceDescriptor)
    );

    console.log(
      "Face descriptor length:",
      faceDescriptor?.length
    );

    console.log("========================================");


    // ==========================================
    // 1️⃣ BASIC VALIDATION
    // ==========================================

    if (
      !qrToken ||
      !location ||
      typeof location.lat !== "number" ||
      typeof location.lng !== "number"
    ) {

      return res.status(400).json({

        success: false,

        status: "Rejected",

        reason:
          "Invalid or missing QR token/location"

      });
    }


    // ==========================================
    // 2️⃣ FACE DESCRIPTOR VALIDATION
    // ==========================================

    if (
      !Array.isArray(faceDescriptor) ||
      faceDescriptor.length !== 128
    ) {

      return res.status(400).json({

        success: false,

        status: "Rejected",

        reason:
          "Valid 128-value face descriptor is required"

      });
    }


    // ==========================================
    // 3️⃣ CHECK FACE VALUES
    // ==========================================

    const invalidFaceValue =
      faceDescriptor.some(
        value =>
          typeof value !== "number" ||
          !Number.isFinite(value)
      );


    if (invalidFaceValue) {

      return res.status(400).json({

        success: false,

        status: "Rejected",

        reason:
          "Face descriptor contains invalid values"

      });
    }


    // ==========================================
    // 4️⃣ GET STUDENT
    // ==========================================

    const student =
      await User.findById(
        req.user._id
      );


    if (!student) {

      return res.status(404).json({

        success: false,

        status: "Rejected",

        reason:
          "Student not found"

      });
    }


    // ==========================================
    // 5️⃣ CHECK REGISTERED FACE
    // ==========================================

    if (
      !Array.isArray(student.faceDescriptor) ||
      student.faceDescriptor.length !== 128
    ) {

      return res.status(400).json({

        success: false,

        status: "Rejected",

        reason:
          "Face is not registered. Please register your face first."

      });
    }


    // ==========================================
    // 6️⃣ VERIFY STORED FACE VALUES
    // ==========================================

    const invalidStoredValue =
      student.faceDescriptor.some(
        value =>
          typeof value !== "number" ||
          !Number.isFinite(value)
      );


    if (invalidStoredValue) {

      return res.status(400).json({

        success: false,

        status: "Rejected",

        reason:
          "Stored face descriptor is invalid"

      });
    }


    // ==========================================
    // 7️⃣ FACE VERIFICATION
    // ==========================================

    const faceDistance =
      calculateFaceDistance(
        student.faceDescriptor,
        faceDescriptor
      );


    if (faceDistance === null) {

      return res.status(400).json({

        success: false,

        status: "Rejected",

        reason:
          "Invalid face descriptor"

      });
    }


    console.log(
      "👤 Face distance:",
      faceDistance
    );


    // ==========================================
    // 8️⃣ FACE MATCH THRESHOLD
    // ==========================================

    const FACE_THRESHOLD = 0.50;


    if (
      faceDistance > FACE_THRESHOLD
    ) {

      console.log(
        "❌ Face mismatch"
      );


      return res.status(400).json({

        success: false,

        status: "Rejected",

        reason:
          "Face verification failed",

        faceDistance:
          Number(
            faceDistance.toFixed(4)
          )

      });
    }


    console.log(
      "✅ Face verified"
    );


    // ==========================================
    // 9️⃣ VERIFY QR TOKEN
    // ==========================================

    let decoded;

    try {

      decoded =
        jwt.verify(
          qrToken,
          process.env.QR_SECRET
        );

    } catch (err) {

      console.error(
        "QR verification error:",
        err.message
      );


      return res.status(400).json({

        success: false,

        status: "Rejected",

        reason:
          "QR expired or invalid"

      });
    }


    // ==========================================
    // 🔟 GET SESSION
    // ==========================================

    const session =
      await Session.findById(
        decoded.sessionId
      );


    if (!session) {

      return res.status(404).json({

        success: false,

        status: "Rejected",

        reason:
          "Session not found"

      });
    }


    // ==========================================
    // 1️⃣1️⃣ CHECK SESSION EXPIRY
    // ==========================================

    if (
      new Date() >
      session.expiry
    ) {

      return res.status(400).json({

        success: false,

        status: "Rejected",

        reason:
          "Session expired"

      });
    }


    // ==========================================
    // 1️⃣2️⃣ PREVENT DUPLICATE ATTENDANCE
    // ==========================================

    const alreadyMarked =
      await Attendance.findOne({

        studentId:
          req.user._id,

        sessionId:
          session._id

      });


    if (alreadyMarked) {

      return res.status(400).json({

        success: false,

        status: "Rejected",

        reason:
          "Already marked"

      });
    }


    // ==========================================
    // 1️⃣3️⃣ GPS DISTANCE
    // ==========================================

    const distance =
      getDistanceInMeters(

        session.latitude,

        session.longitude,

        location.lat,

        location.lng

      );


    console.log(
      "📍 GPS distance:",
      distance,
      "meters"
    );


    // ==========================================
    // 1️⃣4️⃣ GPS RANGE CHECK
    // ==========================================

    if (
      distance > 50
    ) {

      await Attendance.create({

        studentId:
          req.user._id,

        sessionId:
          session._id,

        status:
          "Rejected",

        locationLat:
          location.lat,

        locationLng:
          location.lng,

        rejectionReason:
          `Outside range (${Math.round(distance)}m)`

      });


      return res.status(400).json({

        success: false,

        status: "Rejected",

        reason:
          `Outside allowed range (${Math.round(distance)}m)`

      });
    }


    // ==========================================
    // 1️⃣5️⃣ MARK ATTENDANCE
    // ==========================================

    const attendance =
      await Attendance.create({

        studentId:
          req.user._id,

        sessionId:
          session._id,

        status:
          "Present",

        locationLat:
          location.lat,

        locationLng:
          location.lng

      });


    console.log(
      "🎉 ATTENDANCE MARKED SUCCESSFULLY"
    );


    // ==========================================
    // 1️⃣6️⃣ SOCKET.IO UPDATE
    // ==========================================

    const io =
      req.app.get("io");


    if (io) {

      io.to(
        `session_${session._id}`
      ).emit(
        "attendance_update",
        {

          studentId:
            req.user._id,

          status:
            "Present"

        }
      );
    }


    // ==========================================
    // 1️⃣7️⃣ SUCCESS RESPONSE
    // ==========================================

    return res.status(200).json({

      success: true,

      status:
        "Present",

      message:
        "Attendance marked successfully",

      faceVerified:
        true,

      faceDistance:
        Number(
          faceDistance.toFixed(4)
        ),

      gpsDistance:
        Math.round(distance),

      attendance

    });


  } catch (err) {

    console.error(
      "❌ Attendance Error:",
      err
    );


    return res.status(500).json({

      success: false,

      message:
        "Server error",

      error:
        err.message

    });
  }
};


// ==========================================
// GET STUDENT ATTENDANCE HISTORY
// ==========================================

export const getMyAttendance = async (
  req,
  res
) => {

  try {

    const records =
      await Attendance.find({

        studentId:
          req.user._id

      })

        .populate(
          "sessionId",
          "sessionId latitude longitude createdAt"
        )

        .sort({
          createdAt: -1
        });


    return res.json({

      success: true,

      count:
        records.length,

      data:
        records

    });

  } catch (err) {

    console.error(
      "Get My Attendance Error:",
      err.message
    );


    return res.status(500).json({

      success: false,

      message:
        "Server error",

      error:
        err.message

    });
  }
};