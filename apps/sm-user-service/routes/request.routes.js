const express = require("express");
const router = express.Router({ mergeParams: true });

const {
    createRequest,
    getMyRequests,
    getAllRequests,
    updateRequestStatus,
} = require("../controllers/request.controller");
const Authenticated = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRole");

// POST /api/school/:schoolId/requests - Create a new request
router.post(
    "/",
    Authenticated,
    authorizeRoles("sch_admin", "teacher", "student", "parent"),
    createRequest
);

// GET /api/school/:schoolId/requests/my - Get my requests
router.get(
    "/my",
    Authenticated,
    authorizeRoles("sch_admin", "teacher", "student", "parent"),
    getMyRequests
);

// GET /api/school/:schoolId/requests - Get all requests (admin only)
router.get(
    "/",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin"),
    getAllRequests
);

// PUT /api/school/:schoolId/requests/:requestId - Update request status (admin only)
router.put(
    "/:requestId",
    Authenticated,
    authorizeRoles("super_admin", "sch_admin"),
    updateRequestStatus
);

module.exports = router;
