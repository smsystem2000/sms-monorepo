const express = require("express");
const router = express.Router();

const {
    createSchool,
    getSchoolById,
    getAllSchools,
    updateSchoolById,
} = require("../controllers/school.controller");
const Authenticated = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRole");

// Apply authentication and authorization to all routes
router.use(Authenticated);

// Create a new school
router.post("/create-school", authorizeRoles("super_admin"), createSchool);

// Get all schools
router.get("/get-all-schools", authorizeRoles("super_admin"), getAllSchools);

// Get school by schoolId
router.get("/get-school/:schoolId", authorizeRoles(["super_admin", "sch_admin", "teacher"]), getSchoolById);

// Update school by schoolId
router.put("/update-school/:schoolId", authorizeRoles("super_admin", "sch_admin"), updateSchoolById);

module.exports = router;
