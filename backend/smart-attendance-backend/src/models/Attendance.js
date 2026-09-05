import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true
    },

    status: {
      type: String,
      enum: ["Present", "Rejected"],
      required: true
    },

    locationLat: Number,
    locationLng: Number,

    rejectionReason: String
  },
  { timestamps: true }
);

// 🔥 Prevent duplicate attendance
attendanceSchema.index({ studentId: 1, sessionId: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);