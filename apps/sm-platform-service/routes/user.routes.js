const express = require("express");
const router = express.Router();

const {
    createUser,
    getUserById,
    getAllUsers,
    updateUserById,
} = require("../controllers/user.controller");
const { Authenticated, authorizeRoles } = require("@sms/shared/middlewares");

// Apply authentication and authorization to all routes
router.use(Authenticated);

// Create a new user
router.post("/create-user", authorizeRoles("super_admin"), createUser);

// Get all users
router.get("/get-users", authorizeRoles("super_admin"), getAllUsers);

// Get user by userId
router.get("/get-user/:userId", authorizeRoles("super_admin", "sch_admin"), getUserById);

// Update user by userId
router.put("/update-user/:userId", authorizeRoles("super_admin", "sch_admin"), updateUserById);

module.exports = router;
