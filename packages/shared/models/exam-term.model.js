const mongoose = require('mongoose');
const { Schema } = mongoose;

const ExamTermSchema = new Schema({
    schoolId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String, // e.g., "Term 1", "Semester 1"
        required: true
    },
    academicYear: {
        type: String,
        required: true // e.g., "2025-2026"
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'archived'],
        default: 'active'
    }
}, { timestamps: true });

// Ensure unique term name per school per academic year
ExamTermSchema.index({ schoolId: 1, academicYear: 1, name: 1 }, { unique: true });

module.exports = ExamTermSchema;
