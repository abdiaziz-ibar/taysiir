const jwt = require("jsonwebtoken");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// Parent-portal tokens are tagged with type "parent" so protectParent can
// reject a staff token (and vice versa) even though both are signed with
// the same JWT_SECRET.
const generateParentToken = (parentId) =>
  jwt.sign({ id: parentId, type: "parent" }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

module.exports = generateToken;
module.exports.generateParentToken = generateParentToken;
