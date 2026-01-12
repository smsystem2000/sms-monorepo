const mongoose = require("mongoose");

const substituteAssignmentSchema = new mongoose.Schema(
    {
        substituteId: {
            type: String,
            required: true,
            unique: true,
        },
        schoolId: {
            type: String,
            required: true,
        },
        originalEntryId: {
            type: String,
            required: true,
        },
        originalTeacherId: {
            type: String,
            required: true,
        },
        substituteTeacherId: {
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
        createdBy: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "completed", "cancelled"],
            default: "pending",
        },
    },
    {
        timestamps: true,
    }
);

// Index for date-based queries
substituteAssignmentSchema.index({ schoolId: 1, date: 1 });
// Index for teacher-specific queries
substituteAssignmentSchema.index({ schoolId: 1, originalTeacherId: 1 });
substituteAssignmentSchema.index({ schoolId: 1, substituteTeacherId: 1 });

module.exports = substituteAssignmentSchema;
