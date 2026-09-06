import Session from "../models/Session.js";
import Attendance from "../models/Attendance.js";
import User from "../models/User.js";
import { v4 as uuidv4 } from "uuid";
import {
  generateQRToken,
  generateQRCode
} from "../utils/qrToken.js";
import mongoose from "mongoose";


// ==========================================
// ✅ CREATE SESSION
// ==========================================
export const createSession = async (req, res) => {
  try {

    const {
      latitude,
      longitude
    } = req.body;


    // ==========================================
    // CHECK LOCATION
    // ==========================================
    if (
      latitude == null ||
      longitude == null
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Latitude and Longitude are required"
      });
    }


    // ==========================================
    // SESSION EXPIRY
    // ==========================================
    const expirySeconds =
      parseInt(
        process.env.SESSION_EXPIRY_SECONDS
      ) || 60;


    // ==========================================
    // GENERATE SESSION ID
    // ==========================================
    const sessionId = uuidv4();


    // ==========================================
    // CALCULATE EXPIRY
    // ==========================================
    const expiry = new Date(
      Date.now() +
      expirySeconds * 1000
    );


    // ==========================================
    // CREATE SESSION
    // ==========================================
    const session = await Session.create({

      sessionId,

      createdBy:
        req.user._id,

      expiry,

      latitude,

      longitude
    });


    // ==========================================
    // GENERATE QR
    // ==========================================
    const qrToken =
      generateQRToken(
        session._id
      );


    const qr =
      await generateQRCode(
        qrToken
      );


    // ==========================================
    // SEND RESPONSE
    // ==========================================
    return res.status(201).json({

      success: true,

      message:
        "Session created successfully",

      session: {

        _id:
          session._id,

        sessionId:
          session.sessionId,

        expiry:
          session.expiry,

        latitude:
          session.latitude,

        longitude:
          session.longitude,

        createdAt:
          session.createdAt
      },

      qrToken,

      qr
    });


  } catch (err) {

    console.error(
      "Create Session Error:",
      err.message
    );


    return res.status(500).json({

      success: false,

      message:
        "Server error"
    });
  }
};


// ==========================================
// ✅ GET SESSION ATTENDANCE
// ==========================================
export const getSessionAttendance = async (
  req,
  res
) => {
  try {

    const {
      sessionId
    } = req.params;


    // ==========================================
    // VALIDATE SESSION ID
    // ==========================================
    if (
      !mongoose.Types.ObjectId.isValid(
        sessionId
      )
    ) {
      return res.status(400).json({

        success: false,

        message:
          "Invalid session ID"
      });
    }


    // ==========================================
    // GET ATTENDANCE RECORDS
    // ==========================================
    const records =
      await Attendance.find({

        sessionId:
          new mongoose.Types.ObjectId(
            sessionId
          )

      })

        // Include PRN and branch
        .populate(
          "studentId",
          "name email prn branch"
        )

        .sort({
          createdAt: -1
        });


    // ==========================================
    // SEND RESPONSE
    // ==========================================
    return res.json({

      success: true,

      count:
        records.length,

      data:
        records
    });


  } catch (err) {

    console.error(
      "Get Session Attendance Error:",
      err.message
    );


    return res.status(500).json({

      success: false,

      message:
        "Server error"
    });
  }
};


// ==========================================
// ✅ GET MY SESSIONS
// ==========================================
export const getMySessions = async (
  req,
  res
) => {
  try {

    // ==========================================
    // GET TEACHER SESSIONS
    // ==========================================
    const sessions =
      await Session.find({

        createdBy:
          req.user._id

      }).sort({
        createdAt: -1
      });


    // ==========================================
    // ADD SESSION STATISTICS
    // ==========================================
    const sessionsWithStats =
      await Promise.all(

        sessions.map(
          async (session) => {

            const sessionObjectId =
              new mongoose.Types.ObjectId(
                session._id
              );


            // ==========================================
            // COUNT PRESENT
            // ==========================================
            const presentCount =
              await Attendance.countDocuments({

                sessionId:
                  sessionObjectId,

                status:
                  "Present"
              });


            // ==========================================
            // COUNT TOTAL ATTENDANCE ATTEMPTS
            // ==========================================
            const totalMarked =
              await Attendance.countDocuments({

                sessionId:
                  sessionObjectId
              });


            return {

              _id:
                session._id,

              sessionId:
                session.sessionId,

              createdAt:
                session.createdAt,

              expiry:
                session.expiry,

              latitude:
                session.latitude,

              longitude:
                session.longitude,

              presentCount,

              totalMarked
            };
          }
        )
      );


    // ==========================================
    // SEND RESPONSE
    // ==========================================
    return res.json({

      success: true,

      count:
        sessionsWithStats.length,

      data:
        sessionsWithStats
    });


  } catch (err) {

    console.error(
      "Get Sessions Error:",
      err.message
    );


    return res.status(500).json({

      success: false,

      message:
        "Server error"
    });
  }
};


// ==========================================
// 📊 TEACHER ANALYTICS
// ==========================================
export const getTeacherAnalytics = async (
  req,
  res
) => {
  try {

    // ==========================================
    // TOTAL STUDENTS
    // ==========================================
    const totalStudents =
      await User.countDocuments({

        role:
          "student"
      });


    // ==========================================
    // GET TEACHER'S SESSIONS
    // ==========================================
    const sessions =
      await Session.find({

        createdBy:
          req.user._id

      }).select(
        "_id createdAt"
      );


    const sessionIds =
      sessions.map(
        (session) =>
          session._id
      );


    // ==========================================
    // TODAY
    // ==========================================
    const startOfToday =
      new Date();

    startOfToday.setHours(
      0,
      0,
      0,
      0
    );


    const endOfToday =
      new Date();

    endOfToday.setHours(
      23,
      59,
      59,
      999
    );


    const todaySessions =
      sessions.filter(
        (session) =>
          session.createdAt >=
            startOfToday &&
          session.createdAt <=
            endOfToday
      );


    const todaySessionIds =
      todaySessions.map(
        (session) =>
          session._id
      );


    // ==========================================
    // TODAY'S UNIQUE PRESENT STUDENTS
    // ==========================================
    const todayPresentStudents =
      await Attendance.distinct(
        "studentId",
        {

          sessionId: {
            $in:
              todaySessionIds
          },

          status:
            "Present"
        }
      );


    const todayPresent =
      todayPresentStudents.length;


    // ==========================================
    // TODAY'S ABSENT
    // ==========================================
    const todayAbsent =
      Math.max(
        totalStudents -
          todayPresent,
        0
      );


    // ==========================================
    // TODAY'S PERCENTAGE
    // ==========================================
    const todayPercentage =
      totalStudents > 0

        ? Math.round(
            (
              todayPresent /
              totalStudents
            ) * 100
          )

        : 0;


    // ==========================================
    // WEEKLY ATTENDANCE
    // ==========================================
    const weeklyData = [];


    for (
      let i = 6;
      i >= 0;
      i--
    ) {

      const date =
        new Date();


      date.setDate(
        date.getDate() -
          i
      );


      const start =
        new Date(date);

      start.setHours(
        0,
        0,
        0,
        0
      );


      const end =
        new Date(date);

      end.setHours(
        23,
        59,
        59,
        999
      );


      const daySessions =
        sessions.filter(
          (session) =>
            session.createdAt >=
              start &&
            session.createdAt <=
              end
        );


      const daySessionIds =
        daySessions.map(
          (session) =>
            session._id
        );


      // ==========================================
      // UNIQUE STUDENTS FOR THE DAY
      // ==========================================
      const presentStudents =
        await Attendance.distinct(
          "studentId",
          {

            sessionId: {
              $in:
                daySessionIds
            },

            status:
              "Present"
          }
        );


      weeklyData.push({

        date:
          start
            .toISOString()
            .split("T")[0],

        present:
          presentStudents.length
      });
    }


    // ==========================================
    // MONTHLY ATTENDANCE
    // ==========================================
    const monthlyData = [];


    for (
      let i = 5;
      i >= 0;
      i--
    ) {

      const date =
        new Date();


      date.setMonth(
        date.getMonth() -
          i
      );


      const year =
        date.getFullYear();


      const month =
        date.getMonth();


      const start =
        new Date(
          year,
          month,
          1
        );


      const end =
        new Date(
          year,
          month + 1,
          0,
          23,
          59,
          59,
          999
        );


      const monthSessions =
        sessions.filter(
          (session) =>
            session.createdAt >=
              start &&
            session.createdAt <=
              end
        );


      const monthSessionIds =
        monthSessions.map(
          (session) =>
            session._id
        );


      // ==========================================
      // UNIQUE STUDENTS FOR THE MONTH
      // ==========================================
      const presentStudents =
        await Attendance.distinct(
          "studentId",
          {

            sessionId: {
              $in:
                monthSessionIds
            },

            status:
              "Present"
          }
        );


      monthlyData.push({

        month:
          `${year}-${String(
            month + 1
          ).padStart(2, "0")}`,

        present:
          presentStudents.length
      });
    }


    // ==========================================
    // BRANCH-WISE STATISTICS
    // ==========================================
    const students =
      await User.find({

        role:
          "student"

      }).select(
        "_id branch"
      );


    const branchStats = {};


    // ==========================================
    // GET UNIQUE PRESENT STUDENTS
    // ==========================================
    const presentStudentIds =
      await Attendance.distinct(
        "studentId",
        {

          sessionId: {
            $in:
              sessionIds
          },

          status:
            "Present"
        }
      );


    // Convert IDs to strings
    // for quick lookup
    const presentStudentSet =
      new Set(

        presentStudentIds.map(
          (id) =>
            id.toString()
        )
      );


    // ==========================================
    // BUILD BRANCH STATISTICS
    // ==========================================
    for (
      const student
      of students
    ) {

      const branch =
        student.branch ||
        "Unknown";


      if (
        !branchStats[branch]
      ) {

        branchStats[branch] = {

          totalStudents:
            0,

          present:
            0
        };
      }


      // Total students
      branchStats[
        branch
      ].totalStudents++;


      // Count each student only once
      if (
        presentStudentSet.has(
          student._id.toString()
        )
      ) {

        branchStats[
          branch
        ].present++;
      }
    }


    // ==========================================
    // FORMAT BRANCH DATA
    // ==========================================
    const branches =
      Object.entries(
        branchStats
      ).map(
        ([branch, data]) => ({

          branch,

          totalStudents:
            data.totalStudents,

          present:
            data.present,

          percentage:
            data.totalStudents >
            0

              ? Math.round(
                  (
                    data.present /
                    data.totalStudents
                  ) * 100
                )

              : 0
        })
      );


    // ==========================================
    // SEND ANALYTICS
    // ==========================================
    return res.json({

      success: true,

      data: {

        totalStudents,

        today: {

          present:
            todayPresent,

          absent:
            todayAbsent,

          percentage:
            todayPercentage
        },

        weekly:
          weeklyData,

        monthly:
          monthlyData,

        branches:
          branches
      }
    });


  } catch (err) {

    console.error(
      "Teacher Analytics Error:",
      err.message
    );


    return res.status(500).json({

      success: false,

      message:
        "Server error"
    });
  }
};