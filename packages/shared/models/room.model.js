const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
    {
        roomId: {
            type: String,
            required: true,
            unique: true,
        },
        schoolId: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        code: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ["classroom", "lab", "hall", "playground", "library", "auditorium", "other"],
            default: "classroom",
        },
        capacity: {
            type: Number,
            default: 40,
        },
        floor: {
            type: String,
            default: "",
        },
        building: {
            type: String,
            default: "",
        },
        equipment: {
            type: [String],
            default: [],
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
        status: {
            type: String,
            enum: ["active", "inactive", "maintenance"],
            default: "active",
        },
    },
    {
        timestamps: true,
    }
);

// Index for school-specific room lookup
roomSchema.index({ schoolId: 1 });
// Unique room code per school
roomSchema.index({ schoolId: 1, code: 1 }, { unique: true });

module.exports = roomSchema;
