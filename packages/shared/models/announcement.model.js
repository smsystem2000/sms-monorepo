const mongoose = require('mongoose');
const { Schema } = mongoose;

const AnnouncementSchema = new Schema({
    announcementId: {
        type: String,
        required: true,
        unique: true
    },
    schoolId: {
        type: String,
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['general', 'academic', 'exam', 'holiday', 'event', 'fee', 'emergency'],
        default: 'general'
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    targetAudience: {
        type: String,
        enum: ['all', 'students', 'teachers', 'parents', 'specific_class'],
        default: 'all'
    },
    targetClasses: [{
        type: String
    }],
    attachments: [{
        url: {
            type: String,
            required: true
        },
        fileName: {
            type: String,
            required: true
        },
        fileType: {
            type: String,
            enum: ['image', 'pdf', 'document'],
            required: true
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    attachmentUrl: {
        type: String
    },
    seenBy: [{
        userId: {
            type: String,
            required: true
        },
        userRole: {
            type: String,
            required: true
        },
        seenAt: {
            type: Date,
            default: Date.now
        }
    }],
    seenCount: {
        type: Number,
        default: 0
    },
    publishDate: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: String,
        required: true
    },
    createdByRole: {
        type: String,
        enum: ['sch_admin', 'teacher'],
        required: true
    },
    createdByName: {
        type: String
    },
    status: {
        type: String,
        enum: ['active', 'archived'],
        default: 'active'
    }
}, { timestamps: true });

// Compound index for efficient queries
AnnouncementSchema.index({ schoolId: 1, status: 1, publishDate: -1 });
AnnouncementSchema.index({ schoolId: 1, targetAudience: 1, status: 1 });

module.exports = AnnouncementSchema;
