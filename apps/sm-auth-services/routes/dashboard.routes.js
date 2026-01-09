const express = require("express");
const { getMenus } = require("../controllers/dashboard.controller");
const router = express.Router({ mergeParams: true });


// GET /api/admin/dashboard/stats

router.get("/menus/:role", getMenus);

module.exports = router;
