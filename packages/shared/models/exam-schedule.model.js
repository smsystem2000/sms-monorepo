const mongoose = require('mongoose');
const { Schema } = mongoose;

const ExamScheduleSchema = new Schema({
    schoolId: {
        type: String,
        required: true,
        index: true
    },
    examId: {
        type: String, // References Exam.examId
        required: true,
        index: true
    },
    classId: {
        type: String,
        required: true,
        index: true
    },
    subjectId: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String, // HH:mm format
        required: true
    },
    endTime: {
        type: String, // HH:mm format
        required: true
    },
    durationMinutes: {
        type: Number,
        required: true
    },
    roomId: {
        type: String, // Optional, can be assigned later
        ref: 'Room'
    },
    invigilators: [{
        type: String, // Teacher IDs
        ref: 'Teacher'
    }],
    maxMarksTheory: {
        type: Number,
        default: 80
    },
    maxMarksPractical: {
        type: Number,
        default: 0
    },
    passingMarks: {
        type: Number,
        required: true
    },
    syllabus: {
        type: String
    }
}, { timestamps: true });

// Compound index for conflict detection (Room, Time)
ExamScheduleSchema.index({ schoolId: 1, roomId: 1, date: 1 });
// Compound index for conflict detection (Invigilator, Time)
ExamScheduleSchema.index({ schoolId: 1, invigilators: 1, date: 1 });
// Ensure one exam per subject per class per exam event
ExamScheduleSchema.index({ schoolId: 1, examId: 1, classId: 1, subjectId: 1 }, { unique: true });

module.exports = ExamScheduleSchema;
