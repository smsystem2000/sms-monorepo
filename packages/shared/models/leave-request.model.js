const mongoose = require("mongoose");

const leaveRequestSchema = new mongoose.Schema(
    {
        leaveId: {
            type: String,
            required: true,
            unique: true,
        },
        schoolId: {
            type: String,
            required: true,
        },
        applicantId: {
            type: String,
            required: true, // studentId or teacherId
        },
        applicantType: {
            type: String,
            enum: ["student", "teacher"],
            required: true,
        },
        applicantName: {
            type: String, // Store name for easy display
        },
        // For students, store class info
        classId: {
            type: String,
        },
        sectionId: {
            type: String,
        },
        leaveType: {
            type: String,
            enum: ["casual", "sick", "emergency", "personal", "other"],
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        reason: {
            type: String,
            required: true,
        },
        // Leave status workflow
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        // Admin processing info
        processedBy: {
            type: String, // adminId who processed
        },
        processedByName: {
            type: String,
        },
        processedAt: {
            type: Date,
        },
        approvalRemarks: {
            type: String, // Admin notes/reason for rejection
        },
        // Number of days
        numberOfDays: {
            type: Number,
            default: 1,
        },
    },
    {
        timestamps: true, // createdAt = appliedAt
    }
);

// Calculate number of days before saving
leaveRequestSchema.pre("save", function () {
    if (this.startDate && this.endDate) {
        const start = new Date(this.startDate);
        const end = new Date(this.endDate);
        this.numberOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }
});

module.exports = leaveRequestSchema;
