const mongoose = require('mongoose');
const { Schema } = mongoose;

const GradeRangeSchema = new Schema({
    name: { type: String, required: true }, // e.g., "A1", "B"
    minPercentage: { type: Number, required: true }, // e.g., 91
    maxPercentage: { type: Number, required: true }, // e.g., 100
    points: { type: Number, required: true }, // e.g., 10 (GPA points)
    description: { type: String } // e.g., "Outstanding"
});

const GradingSystemSchema = new Schema({
    schoolId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String, // e.g., "CBSE Primary", "IGCSE Standard"
        required: true
    },
    grades: [GradeRangeSchema],
    isDefault: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Ensure unique grading system name per school
GradingSystemSchema.index({ schoolId: 1, name: 1 }, { unique: true });

module.exports = GradingSystemSchema;
