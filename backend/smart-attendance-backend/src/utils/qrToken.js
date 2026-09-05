import jwt from "jsonwebtoken";
import QRCode from "qrcode";

// Generate QR token
export const generateQRToken = (sessionId) => {
  return jwt.sign(
    { sessionId },
    process.env.QR_SECRET,
    {
      expiresIn: `${process.env.SESSION_EXPIRY_SECONDS}s`  // ✅ FIX
    }
  );
};
// Generate QR image
export const generateQRCode = async (token) => {
  return await QRCode.toDataURL(token);
};