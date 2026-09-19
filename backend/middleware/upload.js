const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const uploadDir = path.join(__dirname, "..", "uploads", "payment-proofs");
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_TYPES = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = ALLOWED_TYPES[file.mimetype] || path.extname(file.originalname) || "";
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES[file.mimetype]) return cb(null, true);
  cb(new Error("Kaliya sawirro PNG ama JPG ayaa la ogol yahay."));
};

const uploadScreenshot = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single("screenshot");

module.exports = uploadScreenshot;
