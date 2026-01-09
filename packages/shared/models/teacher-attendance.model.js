const mongoose = require("mongoose");

/**
 * Teacher Attendance Schema
 * Universal for all schools - simple check-in/check-out model
 */
const teacherAttendanceSchema = new mongoose.Schema(
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
        teacherId: {
            type: String,
            required: true,
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
        status: {
            type: String,
            enum: ["present", "absent", "late", "half_day", "leave"],
            required: true,
        },
        leaveType: {
            type: String,
            enum: ["casual", "sick", "earned", "unpaid", "other"],
        },
        totalMinutes: {
            type: Number,
            default: 0,
        },
        markedBy: {
            type: String,
            required: true, // teacherId (self) or adminId
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

// Compound index: one attendance record per teacher per day
teacherAttendanceSchema.index({ teacherId: 1, date: 1 }, { unique: true });
// Index for daily reports
teacherAttendanceSchema.index({ schoolId: 1, date: 1 });
// Index for monthly reports
teacherAttendanceSchema.index({ schoolId: 1, teacherId: 1, date: 1 });

module.exports = teacherAttendanceSchema;
