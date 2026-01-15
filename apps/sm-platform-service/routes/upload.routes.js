const express = require("express");
const router = express.Router();
const { Authenticated } = require("@sms/shared/middlewares");
const { getImageKitAuth } = require("../controllers/upload.controller");

/**
 * Upload Routes for sm-platform-service
 * Base path: /api/admin/upload
 * Used for: school logos, school admin profile images
 */

// Get ImageKit authentication parameters (protected)
router.get("/auth", Authenticated, getImageKitAuth);

module.exports = router;
