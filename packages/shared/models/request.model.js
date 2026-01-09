const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
    {
        requestId: {
            type: String,
            required: true,
            unique: true,
        },
        userType: {
            type: String,
            enum: ["teacher", "student", "parent", "sch_admin"],
            required: true,
        },
        userId: {
            type: String,
            required: true,
        },
        userName: {
            type: String,
            required: true,
        },
        requestType: {
            type: String,
            enum: ["email_change", "phone_change", "general"],
            required: true,
        },
        oldValue: {
            type: String,
            default: "",
        },
        newValue: {
            type: String,
            default: "",
        },
        message: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        adminReply: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

module.exports = requestSchema;
