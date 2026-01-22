const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  getSchoolDashboardStats,
  getMenus,
} = require("../controllers/dashboard.controller");

// GET /api/school/:schoolId/dashboard/stats
router.get("/stats", getSchoolDashboardStats);
router.get("/menus/:role", getMenus);

module.exports = router;
