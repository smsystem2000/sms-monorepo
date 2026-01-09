const express = require("express");
const router = express.Router();

const { login, verifyToken, createAdmin } = require("../controllers/auth.controller");
const { Authenticated, authorizeRoles } = require("@sms/shared/middlewares");

// Public routes (no authentication required)
router.post("/login", login); // Unified login for all user types

// Protected routes
router.get("/verify-token", Authenticated, verifyToken);
router.post("/create-admin", Authenticated, authorizeRoles("super_admin"), createAdmin);

module.exports = router;
