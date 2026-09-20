const express = require("express");
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser, getLockedAccounts, unlockAccount } = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect, authorize("admin"));
router.get("/", getUsers);
router.get("/locked", getLockedAccounts);
router.post("/unlock", unlockAccount);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
