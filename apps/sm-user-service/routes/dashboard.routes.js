const express = require("express");
const router = express.Router({ mergeParams: true });
const { Authenticated } = require('@sms/shared/middlewares');
const { getSchoolDashboardStats, getTeacherDashboardStats } = require("../controllers/dashboard.controller");

// GET /api/school/:schoolId/dashboard/stats
router.get("/stats", getSchoolDashboardStats);

// GET /api/school/:schoolId/dashboard/teacher-stats
router.get("/teacher-stats", Authenticated, getTeacherDashboardStats);

module.exports = router;
