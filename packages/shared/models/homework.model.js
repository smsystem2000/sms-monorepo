const mongoose = require('mongoose');
const { Schema } = mongoose;

const HomeworkSchema = new Schema({
    homeworkId: {
        type: String,
        required: true,
        unique: true
    },
    schoolId: {
        type: String,
        required: true,
        index: true
    },
    classId: {
        type: String,
        required: true,
        index: true
    },
    sectionId: {
        type: String
    },
    subjectId: {
        type: String,
        required: true
    },
    teacherId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    attachmentUrl: {
        type: String
    },
    assignedDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    }
}, { timestamps: true });

// Compound indexes for efficient queries
HomeworkSchema.index({ schoolId: 1, classId: 1, dueDate: -1 });
HomeworkSchema.index({ schoolId: 1, teacherId: 1, status: 1 });
HomeworkSchema.index({ schoolId: 1, classId: 1, sectionId: 1, status: 1 });

module.exports = HomeworkSchema;
