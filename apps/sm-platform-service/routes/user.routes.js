const express = require("express");
const router = express.Router();

const {
    createUser,
    getUserById,
    getAllUsers,
    updateUserById,
} = require("../controllers/user.controller");
const Authenticated = require("../middlewares/auth");
const authorizeRoles = require("../middlewares/authorizeRole");

// Apply authentication and authorization to all routes
router.use(Authenticated);
router.use(authorizeRoles("super_admin"));

// Create a new user
router.post("/create-user", createUser);

// Get all users
router.get("/get-users", getAllUsers);

// Get user by userId
router.get("/get-user/:userId", getUserById);

// Update user by userId
router.put("/update-user/:userId", updateUserById);

module.exports = router;
