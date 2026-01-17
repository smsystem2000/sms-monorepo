const express = require('express');
const router = express.Router({ mergeParams: true });
const { Authenticated, authorizeRoles } = require('@sms/shared/middlewares');
const {
    createHomework,
    getHomeworkByClass,
    getHomeworkByStudent,
    getUpcomingHomework,
    getTeacherHomework,
    getHomeworkById,
    updateHomework,
    deleteHomework,
} = require('../controllers/homework.controller');

// Create homework (Teacher only)
router.post(
    '/',
    Authenticated,
    authorizeRoles('teacher', 'sch_admin'),
    createHomework
);

// Get homework by class
router.get(
    '/class/:classId',
    Authenticated,
    authorizeRoles('teacher', 'sch_admin'),
    getHomeworkByClass
);

// Get homework by student (for student and parent views)
router.get(
    '/student/:studentId',
    Authenticated,
    getHomeworkByStudent
);

// Get upcoming homework for student
router.get(
    '/upcoming/:studentId',
    Authenticated,
    getUpcomingHomework
);

// Get teacher's own homework
router.get(
    '/teacher/:teacherId',
    Authenticated,
    authorizeRoles('teacher', 'sch_admin'),
    getTeacherHomework
);

// Get single homework by ID
router.get(
    '/:homeworkId',
    Authenticated,
    getHomeworkById
);

// Update homework
router.put(
    '/:homeworkId',
    Authenticated,
    authorizeRoles('teacher', 'sch_admin'),
    updateHomework
);

// Delete (cancel) homework
router.delete(
    '/:homeworkId',
    Authenticated,
    authorizeRoles('teacher', 'sch_admin'),
    deleteHomework
);

module.exports = router;
