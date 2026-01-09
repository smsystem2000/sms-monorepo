const express = require("express");
const router = express.Router();
const {
	getDashboardStats,
	getMenus,
	createMenu,
	updateMenu,
	deleteMenu,
} = require("../controllers/dashboard.controller");

// GET /api/admin/dashboard/stats
router.get("/stats", getDashboardStats);
router.get("/menus/:role", getMenus);
router.post("/menus", createMenu);
router.put("/menus/:menuId", updateMenu);
router.delete("/menus/:menuId", deleteMenu);

module.exports = router;
