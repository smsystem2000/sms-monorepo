const express = require('express');
const router = express.Router({ mergeParams: true });
const { Authenticated, authorizeRoles } = require('@sms/shared/middlewares');
const {
    createAnnouncement,
    getAllAnnouncements,
    getMyAnnouncements,
    getAnnouncementById,
    updateAnnouncement,
    deleteAnnouncement,
} = require('../controllers/announcement.controller');

// Create announcement (Admin and Teacher)
router.post(
    '/',
    Authenticated,
    authorizeRoles('sch_admin', 'teacher'),
    createAnnouncement
);

// Get all announcements (All authenticated users)
router.get(
    '/',
    Authenticated,
    getAllAnnouncements
);

// Get my announcements (Teacher - their own)
router.get(
    '/my',
    Authenticated,
    authorizeRoles('teacher'),
    getMyAnnouncements
);

// Get announcement by ID
router.get(
    '/:announcementId',
    Authenticated,
    getAnnouncementById
);

// Update announcement
router.put(
    '/:announcementId',
    Authenticated,
    authorizeRoles('sch_admin', 'teacher'),
    updateAnnouncement
);

// Delete (archive) announcement
router.delete(
    '/:announcementId',
    Authenticated,
    authorizeRoles('sch_admin', 'teacher'),
    deleteAnnouncement
);

module.exports = router;
