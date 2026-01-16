const mongoose = require('mongoose');
const { Schema } = mongoose;

const ExamSchema = new Schema({
    schoolId: {
        type: String,
        required: true,
        index: true
    },
    examId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String, // e.g., "Finals 2026"
        required: true
    },
    typeId: {
        type: Schema.Types.ObjectId,
        ref: 'ExamType',
        required: true
    },
    termId: {
        type: Schema.Types.ObjectId,
        ref: 'ExamTerm',
        required: true
    },
    academicYear: {
        type: String,
        required: true
    },
    classes: [{
        type: String, // Class IDs involved in this exam
        ref: 'Class'
    }],
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    resultPublishDate: {
        type: Date
    },
    gradingSystemId: {
        type: Schema.Types.ObjectId,
        ref: 'GradingSystem',
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'ongoing', 'completed', 'results_processing', 'published'],
        default: 'draft'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

ExamSchema.index({ schoolId: 1, academicYear: 1, status: 1 });

module.exports = ExamSchema;
