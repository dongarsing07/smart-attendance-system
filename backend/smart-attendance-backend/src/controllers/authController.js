import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ==========================================
// 🔐 GENERATE JWT
// ==========================================
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};


// ==========================================
// 🟢 REGISTER CONTROLLER
// ==========================================
export const register = async (req, res) => {
  try {

    const {
      name,
      email,
      password,
      role,
      prn,
      branch
    } = req.body;


    // ==========================================
    // CHECK REQUIRED FIELDS
    // ==========================================
    if (
      !name ||
      !email ||
      !password ||
      !role
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields"
      });
    }


    // ==========================================
    // CHECK IF USER ALREADY EXISTS
    // ==========================================
    const userExists = await User.findOne({
      email
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      });
    }


    // ==========================================
    // HASH PASSWORD
    // ==========================================
    const hashedPassword =
      await bcrypt.hash(password, 10);


    // ==========================================
    // CREATE USER
    // ==========================================
    const user = await User.create({

      name,
      email,
      password: hashedPassword,
      role,
      prn,
      branch,

      // Face registration starts empty
      faceImage: null,
      faceDescriptor: null
    });


    // ==========================================
    // SEND SAFE RESPONSE
    // ==========================================
    res.status(201).json({

      success: true,

      token: generateToken(user._id),

      user: {

        _id: user._id,

        name: user.name,

        email: user.email,

        role: user.role,

        prn: user.prn,

        branch: user.branch,

        // Face data initially empty
        faceImage: null,

        faceDescriptor: null
      }
    });


  } catch (err) {

    console.error(
      "Register Error:",
      err
    );

    res.status(500).json({

      success: false,

      message: err.message
    });
  }
};


// ==========================================
// 🟢 LOGIN CONTROLLER
// ==========================================
export const login = async (req, res) => {
  try {

    const {
      email,
      password
    } = req.body;


    // ==========================================
    // CHECK USER
    // ==========================================
    const user = await User.findOne({
      email
    });

    if (!user) {

      return res.status(400).json({

        success: false,

        message: "Invalid credentials"
      });
    }


    // ==========================================
    // COMPARE PASSWORD
    // ==========================================
    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {

      return res.status(400).json({

        success: false,

        message: "Invalid credentials"
      });
    }


    // ==========================================
    // SEND USER DATA
    // ==========================================
    res.json({

      success: true,

      token: generateToken(
        user._id
      ),

      user: {

        _id: user._id,

        name: user.name,

        email: user.email,

        role: user.role,

        prn: user.prn,

        branch: user.branch,

        // ==========================================
        // 🔥 FACE RECOGNITION DATA
        // ==========================================

        faceImage:
          user.faceImage || null,

        faceDescriptor:
          user.faceDescriptor || null
      }
    });


  } catch (err) {

    console.error(
      "Login Error:",
      err
    );

    res.status(500).json({

      success: false,

      message: err.message
    });
  }
};