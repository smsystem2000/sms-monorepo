const mongoose = require("mongoose");

// Period definition schema (nested in config)
const periodSchema = new mongoose.Schema(
    {
        periodNumber: {
            type: Number,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        startTime: {
            type: String,
            required: true,
        },
        endTime: {
            type: String,
            required: true,
        },
        duration: {
            type: Number,
            required: true,
        },
        type: {
            type: String,
            enum: ["regular", "break", "assembly", "pt", "lab", "free", "lunch"],
            default: "regular",
        },
        shiftId: {
            type: String,
        },
        isDoublePeriod: {
            type: Boolean,
            default: false,
        },
    },
    { _id: false }
);

// Shift definition schema (nested in config)
const shiftSchema = new mongoose.Schema(
    {
        shiftId: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        startTime: {
            type: String,
            required: true,
        },
        endTime: {
            type: String,
            required: true,
        },
    },
    { _id: false }
);

// Main timetable configuration schema
const timetableConfigSchema = new mongoose.Schema(
    {
        configId: {
            type: String,
            required: true,
            unique: true,
        },
        schoolId: {
            type: String,
            required: true,
        },
        academicYear: {
            type: String,
            required: true,
        },
        workingDays: {
            type: [String],
            enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
            default: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        },
        shifts: {
            type: [shiftSchema],
            default: [],
        },
        periods: {
            type: [periodSchema],
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for school and academic year uniqueness
timetableConfigSchema.index({ schoolId: 1, academicYear: 1 }, { unique: true });
// Index for active config lookup
timetableConfigSchema.index({ schoolId: 1, isActive: 1 });

module.exports = timetableConfigSchema;
