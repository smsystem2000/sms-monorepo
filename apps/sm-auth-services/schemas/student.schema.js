const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
    {
        studentId: {
            type: String,
            required: true,
            unique: true,
        },
        schoolId: {
            type: String,
            required: true,
        },
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
        email: {
            type: String,
        },
        password: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
        },
        role: {
            type: String,
            default: "student",
            immutable: true,
        },
        class: {
            type: String,
            required: true,
        },
        section: {
            type: String,
        },
        rollNumber: {
            type: String,
        },
        parentId: {
            type: String,
        },
        dateOfBirth: {
            type: Date,
        },
        gender: {
            type: String,
            enum: ["male", "female", "other"],
        },
        address: {
            type: String,
        },
        status: {
            type: String,
            enum: ["active", "inactive", "graduated"],
            default: "active",
        },
        profileImage: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

studentSchema.index({ email: 1, schoolId: 1 }, { unique: true, sparse: true });

module.exports = studentSchema;
