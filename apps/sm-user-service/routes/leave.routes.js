const express = require("express");
const router = express.Router({ mergeParams: true }); // To access :schoolId from parent router
const {
    applyLeave,
    getMyLeaves,
    getAllLeaves,
    processLeave,
    getLeaveById,
    cancelLeave,
    getLeaveStats,
    getStudentLeavesForTeacher,
} = require("../controllers/leave.controller");
const { checkAuth, checkRole } = require("../middlewares/auth.middleware");

// All routes require authentication
router.use(checkAuth);

// Admin routes (placed first to avoid conflict with :leaveId)
// Get leave statistics for dashboard
router.get("/stats", checkRole(["sch_admin"]), getLeaveStats);

// Get all leave requests
router.get("/all", checkRole(["sch_admin"]), getAllLeaves);

// Teacher routes for class student leaves
router.get("/class-leaves", checkRole(["teacher"]), getStudentLeavesForTeacher);

// Student/Teacher routes
// Apply for leave
router.post("/apply", checkRole(["student", "teacher"]), applyLeave);

// Get my leave requests
router.get("/my", checkRole(["student", "teacher"]), getMyLeaves);

// Get specific leave by ID
router.get("/:leaveId", checkRole(["student", "teacher", "sch_admin"]), getLeaveById);

// Cancel pending leave (own request only)
router.delete("/:leaveId", checkRole(["student", "teacher"]), cancelLeave);

// Process (approve/reject) leave - Admin and Teachers can process
router.put("/:leaveId/process", checkRole(["sch_admin", "teacher"]), processLeave);

module.exports = router;

