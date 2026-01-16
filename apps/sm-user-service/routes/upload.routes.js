const express = require("express");
const router = express.Router();
const { Authenticated } = require("@sms/shared/middlewares");
const { getImageKitAuth } = require("../controllers/upload.controller");

/**
 * Upload Routes for sm-user-service
 * Base path: /api/school/upload
 * Used for: teacher, student, parent profile images & signatures
 */

// Get ImageKit authentication parameters (protected)
router.get("/auth", Authenticated, getImageKitAuth);

module.exports = router;
