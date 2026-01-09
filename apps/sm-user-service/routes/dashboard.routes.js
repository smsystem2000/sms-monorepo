const express = require("express");
const router = express.Router({ mergeParams: true });
const { getSchoolDashboardStats } = require("../controllers/dashboard.controller");

// GET /api/school/:schoolId/dashboard/stats
router.get("/stats", getSchoolDashboardStats);

module.exports = router;
