const mongoose = require('mongoose');
const { Schema } = mongoose;

const ExamTypeSchema = new Schema({
    schoolId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String, // e.g., "Unit Test 1", "Mid-Term", "Final"
        required: true
    },
    termId: {
        type: Schema.Types.ObjectId,
        ref: 'ExamTerm',
        required: false // Optional, some exams might span terms or be independent
    },
    weightage: {
        type: Number,
        default: 100, // Default 100% (standalone), or e.g., 20 if part of a larger calculation
        min: 0,
        max: 100
    },
    description: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Ensure unique exam type name per school
ExamTypeSchema.index({ schoolId: 1, name: 1 }, { unique: true });

module.exports = ExamTypeSchema;
