const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
    schoolId: {
        type: String,
        required: true,
        index: true
    },
    templateName: {
        type: String,
        required: true,
        trim: true
    },
    templateType: {
        type: String,
        required: true,
        enum: [
            'welcome',
            'announcement',
            'student_absent',
            'parent_teacher_meeting',
            'leave_approval',
            'leave_rejection',
            'exam_results',
            'fee_reminder',
            'custom'
        ]
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    htmlContent: {
        type: String,
        required: true
    },
    bannerImage: {
        type: String,
        default: null
    },
    styleTemplate: {
        type: String,
        enum: ['modern', 'classic', 'professional', 'vibrant', 'minimal'],
        default: 'modern'
    },
    placeholders: [{
        key: {
            type: String,
            required: true
        },
        label: {
            type: String,
            required: true
        },
        category: {
            type: String,
            enum: ['school', 'student', 'parent', 'teacher', 'custom'],
            required: true
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    version: {
        type: Number,
        default: 1
    },
    createdBy: {
        type: String,
        required: true
    },
    updatedBy: {
        type: String
    }
}, {
    timestamps: true
});

// Compound index to ensure unique template names per school
emailTemplateSchema.index({ schoolId: 1, templateName: 1 }, { unique: true });

// Index for querying by template type
emailTemplateSchema.index({ schoolId: 1, templateType: 1 });

const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);

module.exports = EmailTemplate;
