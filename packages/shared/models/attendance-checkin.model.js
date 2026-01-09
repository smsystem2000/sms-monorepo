const mongoose = require("mongoose");

/**
 * Check-In/Check-Out Attendance Schema
 * Used when school's attendanceSettings.mode = "check_in_out"
 * Timestamp-based attendance tracking
 */
const attendanceCheckinSchema = new mongoose.Schema(
    {
        logId: {
            type: String,
            required: true,
            unique: true,
        },
        schoolId: {
            type: String,
            required: true,
        },
        userId: {
            type: String,
            required: true, // studentId or teacherId
        },
        userType: {
            type: String,
            enum: ["student", "teacher"],
            required: true,
        },
        // For students, we need class info
        classId: {
            type: String,
        },
        sectionId: {
            type: String,
        },
        date: {
            type: Date,
            required: true,
        },
        checkInTime: {
            type: Date,
        },
        checkOutTime: {
            type: Date,
        },
        checkInMethod: {
            type: String,
            enum: ["manual", "biometric", "rfid", "app"],
            default: "manual",
        },
        checkOutMethod: {
            type: String,
            enum: ["manual", "biometric", "rfid", "app"],
        },
        totalMinutes: {
            type: Number,
            default: 0, // Calculated from check-in to check-out
        },
        status: {
            type: String,
            enum: ["present", "absent", "late", "half_day", "leave", "pending"], // pending = checked in but not out
            default: "pending",
        },
        markedBy: {
            type: String, // Who manually marked (if manual)
        },
        remarks: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index: one log per user per day
attendanceCheckinSchema.index({ userId: 1, date: 1 }, { unique: true });
// Index for fetching daily attendance
attendanceCheckinSchema.index({ schoolId: 1, userType: 1, date: 1 });
// Index for class attendance
attendanceCheckinSchema.index({ classId: 1, sectionId: 1, date: 1 });

module.exports = attendanceCheckinSchema;
