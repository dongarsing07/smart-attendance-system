import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // ==========================================
    // BASIC USER INFORMATION
    // ==========================================
    name: {
      type: String,
      required: true,
      trim: true
    },

    prn: {
      type: String,
      default: ""
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },

    branch: {
      type: String,
      default: ""
    },

    password: {
      type: String,
      required: true
    },

    // ==========================================
    // USER ROLE
    // ==========================================
    role: {
      type: String,
      enum: ["student", "teacher"],
      required: true
    },

    // ==========================================
    // 🔥 FACE RECOGNITION
    // ==========================================

    // Cloudinary URL of registered face
    faceImage: {
      type: String,
      default: null
    },

    // 128-value face-api.js descriptor
    faceDescriptor: {
      type: [Number],
      default: null
    }
  },

  {
    timestamps: true
  }
);

export default mongoose.model("User", userSchema);