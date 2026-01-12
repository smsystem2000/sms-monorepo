const mongoose = require("mongoose");

const periodSwapSchema = new mongoose.Schema(
    {
        swapId: {
            type: String,
            required: true,
            unique: true,
        },
        schoolId: {
            type: String,
            required: true,
        },
        requestedBy: {
            type: String,
            required: true,
        },
        entryId1: {
            type: String,
            required: true,
        },
        entryId2: {
            type: String,
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        reason: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "cancelled"],
            default: "pending",
        },
        approvedBy: {
            type: String,
            default: null,
        },
        approvedAt: {
            type: Date,
            default: null,
        },
        rejectionReason: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// Index for pending requests lookup
periodSwapSchema.index({ schoolId: 1, status: 1 });
// Index for teacher requests
periodSwapSchema.index({ schoolId: 1, requestedBy: 1 });

module.exports = periodSwapSchema;
