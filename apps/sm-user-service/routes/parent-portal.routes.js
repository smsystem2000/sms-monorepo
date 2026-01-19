const express = require('express');
const router = express.Router({ mergeParams: true });
const { Authenticated, authorizeRoles } = require('@sms/shared/middlewares');
const {
    getDashboardStats,
    getMyChildren,
    getChildProfile,
    getChildClassTeacher,
    getChildTeachers,
    getChildAttendance,
    getChildAbsentHistory,
} = require('../controllers/parent-portal.controller');

// All routes require parent authentication
router.use(Authenticated);
router.use(authorizeRoles('parent', 'sch_admin'));

// Dashboard stats
router.get('/dashboard', getDashboardStats);

// Get all children
router.get('/children', getMyChildren);

// Get specific child's profile
router.get('/children/:studentId', getChildProfile);

// Get child's class teacher
router.get('/children/:studentId/class-teacher', getChildClassTeacher);

// Get child's teachers (subject-wise)
router.get('/children/:studentId/teachers', getChildTeachers);

// Get child's attendance
router.get('/children/:studentId/attendance', getChildAttendance);

// Get child's absent history
router.get('/children/:studentId/absent-history', getChildAbsentHistory);

module.exports = router;
