import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

// ==========================================
// REGISTER STUDENT FACE
// ==========================================
export const registerFace = async (req, res) => {
  try {
    const { faceImage, faceDescriptor } = req.body;

    // ==========================================
    // VALIDATE IMAGE
    // ==========================================
    if (!faceImage) {
      return res.status(400).json({
        success: false,
        message: "Face image is required"
      });
    }

    // ==========================================
    // VALIDATE FACE DESCRIPTOR
    // ==========================================
    if (
      !faceDescriptor ||
      !Array.isArray(faceDescriptor) ||
      faceDescriptor.length !== 128
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid 128-value face descriptor is required"
      });
    }

    // ==========================================
    // FIND LOGGED-IN USER
    // ==========================================
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // ==========================================
    // ONLY STUDENTS CAN REGISTER FACE
    // ==========================================
    if (user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Only students can register face"
      });
    }

    // ==========================================
    // ☁️ UPLOAD FACE IMAGE TO CLOUDINARY
    // ==========================================
    const uploadResult = await cloudinary.uploader.upload(
      faceImage,
      {
        folder: "smart-attendance/faces",
        public_id: `student_${user._id}`,
        overwrite: true,
        resource_type: "image"
      }
    );

    // ==========================================
    // 💾 SAVE CLOUDINARY URL + FACE DESCRIPTOR
    // ==========================================
    user.faceImage = uploadResult.secure_url;
    user.faceDescriptor = faceDescriptor;

    await user.save();

    // ==========================================
    // RESPONSE
    // ==========================================
    return res.status(200).json({
      success: true,
      message: "Face registered successfully",
      faceImage: uploadResult.secure_url,
      descriptorLength: user.faceDescriptor.length
    });

  } catch (err) {
    console.error(
      "Face Registration Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: "Face registration failed",
      error: err.message
    });
  }
};