import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    // 🔍 Check if token exists in header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      // Extract token
      token = req.headers.authorization.split(" ")[1];
    }

    // ❌ No token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token"
      });
    }

    // 🔐 Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 👤 Get user (without password)
    req.user = await User.findById(decoded.id).select("-password");

    // Go to next middleware
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Not authorized, invalid token"
    });
  }
};