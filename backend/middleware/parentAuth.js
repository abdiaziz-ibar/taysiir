const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

// Protects parent-portal routes. Only accepts tokens issued by
// generateParentToken (type: "parent"), so a staff/admin token can never be
// used here even though both share the same JWT_SECRET.
const protectParent = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Ma jiro token. Fadlan soo gal (login)." });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== "parent") {
      return res.status(401).json({ message: "Token khalad ah." });
    }
    const parent = await prisma.parent.findUnique({ where: { id: decoded.id } });
    if (!parent || parent.status !== "active") {
      return res.status(401).json({ message: "Xisaabtan lama helin." });
    }
    req.parentId = parent.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token khalad ah ama wakhtigiisu dhacay." });
  }
};

module.exports = { protectParent };
