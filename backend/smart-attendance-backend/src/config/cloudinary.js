import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

// Load .env before configuring Cloudinary
dotenv.config();

console.log(
  "Cloudinary Config Check:",
  process.env.CLOUDINARY_CLOUD_NAME ? "Cloud Name ✅" : "Cloud Name ❌"
);

console.log(
  "Cloudinary API Key:",
  process.env.CLOUDINARY_API_KEY ? "API Key ✅" : "API Key ❌"
);

console.log(
  "Cloudinary API Secret:",
  process.env.CLOUDINARY_API_SECRET ? "API Secret ✅" : "API Secret ❌"
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default cloudinary;