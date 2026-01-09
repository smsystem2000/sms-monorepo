const mongoose = require("mongoose");

/**
 * Simple Daily Attendance Schema
 * Used when school's attendanceSettings.mode = "simple"
 * One record per student per day
 */
const attendanceSimpleSchema = new mongoose.Schema(
    {
        attendanceId: {
            type: String,
            required: true,
            unique: true,
        },
        schoolId: {
            type: String,
            required: true,
        },
        classId: {
            type: String,
            required: true,
        },
        sectionId: {
            type: String,
        },
        studentId: {
            type: String,
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ["present", "absent", "late", "half_day", "leave"],
            required: true,
        },
        markedBy: {
            type: String,
            required: true, // teacherId or adminId who marked
        },
        markedByRole: {
            type: String,
            enum: ["teacher", "sch_admin"],
            required: true,
        },
        remarks: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index: one attendance record per student per day
attendanceSimpleSchema.index({ studentId: 1, date: 1 }, { unique: true });
// Index for fetching class attendance
attendanceSimpleSchema.index({ classId: 1, sectionId: 1, date: 1 });
// Index for reports
attendanceSimpleSchema.index({ schoolId: 1, date: 1 });

module.exports = attendanceSimpleSchema;
