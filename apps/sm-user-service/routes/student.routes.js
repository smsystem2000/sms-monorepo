const express = require("express");
const router = express.Router({ mergeParams: true });

const {
    createStudent,
    getStudentById,
    getAllStudents,
    updateStudentById,
    deleteStudentById,
    searchStudents,
} = require("../controllers/student.controller");
const Authenticated = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRole");

// All routes require authentication and appropriate role
// GET /api/school/:schoolId/students/search?query=xxx - Search students
router.get(
    "/search",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin"),
    searchStudents
);

// POST /api/school/:schoolId/students - Create a new student
router.post(
    "/",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin"),
    createStudent
);

// GET /api/school/:schoolId/students - Get all students
router.get(
    "/",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin", "teacher"),
    getAllStudents
);

// GET /api/school/:schoolId/students/:id - Get student by ID
router.get(
    "/:id",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin", "teacher", "parent", "student"),
    getStudentById
);

// PUT /api/school/:schoolId/students/:id - Update student
router.put(
    "/:id",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin"),
    updateStudentById
);

// DELETE /api/school/:schoolId/students/:id - Delete student (soft delete)
router.delete(
    "/:id",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin"),
    deleteStudentById
);

module.exports = router;
