const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

// Protects the finance section (employees, salaries, expenses, finance report).
// Only accepts tokens issued by generateFinanceToken (type: "finance"), so a
// system-user or parent token can never reach finance data — and a finance
// token can never reach fee data (the other middlewares look the id up in
// their own tables).
const protectFinance = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Ma jiro token. Fadlan soo gal (login)." });
    }
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    if (decoded.type !== "finance") {
      return res.status(401).json({ message: "Token khalad ah." });
    }
    const user = await prisma.financeUser.findUnique({ where: { id: decoded.id } });
    if (!user || user.status !== "active") {
      return res.status(401).json({ message: "Isticmaale sax ah lama helin." });
    }
    const { password, ...safe } = user;
    req.financeUser = { ...safe, _id: user.id };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token khalad ah ama wakhtigiisu dhacay." });
  }
};

module.exports = { protectFinance };
