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

// Alternative to multipart: the mobile app sends a resized screenshot as
// base64 inside the JSON body ({ screenshotBase64, screenshotMime }).
// Returns the stored "/uploads/..." path, or null when none was sent.
const MAGIC = { "image/png": [0x89, 0x50, 0x4e, 0x47], "image/jpeg": [0xff, 0xd8, 0xff] };

const saveBase64Screenshot = (body) => {
  const { screenshotBase64, screenshotMime } = body || {};
  if (!screenshotBase64) return null;
  const ext = ALLOWED_TYPES[screenshotMime];
  if (!ext) throw Object.assign(new Error("Kaliya sawirro PNG ama JPG ayaa la ogol yahay."), { statusCode: 400 });
  const buf = Buffer.from(String(screenshotBase64).replace(/^data:[^,]+,/, ""), "base64");
  if (buf.length > 5 * 1024 * 1024) throw Object.assign(new Error("Sawirku aad buu u weyn yahay."), { statusCode: 400 });
  if (!MAGIC[screenshotMime].every((b, i) => buf[i] === b)) {
    throw Object.assign(new Error("Faylku ma ahan sawir sax ah."), { statusCode: 400 });
  }
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
  fs.writeFileSync(path.join(uploadDir, filename), buf);
  return `/uploads/payment-proofs/${filename}`;
};

module.exports = uploadScreenshot;
module.exports.saveBase64Screenshot = saveBase64Screenshot;
