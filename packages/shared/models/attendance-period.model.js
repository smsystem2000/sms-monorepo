const mongoose = require("mongoose");

/**
 * Period-wise Attendance Schema
 * Used when school's attendanceSettings.mode = "period_wise"
 * One record per student per period per day
 */
const attendancePeriodSchema = new mongoose.Schema(
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
        period: {
            type: Number,
            required: true,
            min: 1,
            max: 12, // Support up to 12 periods
        },
        subjectId: {
            type: String,
            required: true,
        },
        teacherId: {
            type: String,
            required: true, // Subject teacher who took the class
        },
        status: {
            type: String,
            enum: ["present", "absent", "late"],
            required: true,
        },
        markedBy: {
            type: String,
            required: true, // Could be subject teacher or substitute
        },
        isSubstitute: {
            type: Boolean,
            default: false, // True if marked by substitute teacher
        },
        remarks: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index: one attendance record per student per period per day
attendancePeriodSchema.index({ studentId: 1, date: 1, period: 1 }, { unique: true });
// Index for fetching class attendance for a period
attendancePeriodSchema.index({ classId: 1, sectionId: 1, date: 1, period: 1 });
// Index for subject-wise attendance
attendancePeriodSchema.index({ subjectId: 1, date: 1 });
// Index for reports
attendancePeriodSchema.index({ schoolId: 1, date: 1 });

module.exports = attendancePeriodSchema;
