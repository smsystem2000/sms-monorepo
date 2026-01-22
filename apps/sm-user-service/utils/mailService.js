const { EmailTemplateSchema, SchoolModel } = require('@sms/shared/models');
const { sendEmail, resolvePlaceholders } = require('@sms/shared/utils');
const defaultTemplates = require('./defaultTemplates');

/**
 * Send email using template from database or fallback to default
 * @param {string} to - Recipient email
 * @param {string} templateType - Template type
 * @param {Object} data - Data to populate template
 * @param {string} schoolId - School ID
 * @returns {Promise<Object>} - Send result
 */
const sendTemplatedEmail = async (to, templateType, data, schoolId) => {
    try {
        // Try to find custom template for this school
        let template = await EmailTemplateSchema.findOne({
            schoolId,
            templateType,
            isActive: true,
        }).sort({ isDefault: -1, updatedAt: -1 });

        const { resolvePlaceholders, getStyleTemplate } = require('@sms/shared/utils');

        // Ensure school details are present in data for placeholder resolution
        if (!data.school?.name && schoolId) {
            try {
                const school = await SchoolModel.findOne({ schoolId });
                if (school) {
                    data.school = {
                        ...data.school,
                        name: school.schoolName,
                        address: school.schoolAddress,
                        email: school.schoolEmail,
                        phone: school.schoolPhone,
                        logo: school.schoolLogo,
                    };
                }
            } catch (err) {
                console.warn('Could not fetch school details for email:', err.message);
            }
        }

        if (template) {
            // Use custom template from database
            subject = resolvePlaceholders(template.subject, data);
            const resolvedHtml = resolvePlaceholders(template.htmlContent, data);

            // Wrap in style template
            html = getStyleTemplate(template.styleTemplate || 'modern', resolvedHtml, {
                bannerImage: template.bannerImage || data.school?.logo,
                schoolName: data.school?.name || 'School',
                schoolAddress: data.school?.address,
                schoolEmail: data.school?.email,
                schoolPhone: data.school?.phone,
            });
        } else {
            // Fallback to default template
            console.log(`No custom template found for ${templateType}, using default`);
            const defaultTemplate = defaultTemplates[templateType];

            if (defaultTemplate) {
                const result = defaultTemplate(data);
                subject = result.subject;
                html = result.html;
            } else {
                throw new Error(`No template found for type: ${templateType}`);
            }
        }

        // Send email
        return await sendEmail({
            to,
            subject,
            html,
            from: data.school?.name // Use actual school name as sender
        });
    } catch (error) {
        console.error('Error sending templated email:', error);
        throw error;
    }
};

/**
 * Send welcome email to new user
 * @param {Object} userDetails - User details
 * @param {string} schoolId - School ID
 * @param {string} refNo - Registration reference number
 * @returns {Promise<Object>} - Send result
 */
const sendWelcomeEmail = async (userDetails, schoolId, refNo) => {
    const data = {
        student: userDetails.role === 'Student' ? {
            firstName: userDetails.first_name,
            first_name: userDetails.first_name,
            lastName: userDetails.last_name,
            last_name: userDetails.last_name,
            fullName: `${userDetails.first_name} ${userDetails.last_name}`,
            full_name: `${userDetails.first_name} ${userDetails.last_name}`,
            email: userDetails.email,
            rollNo: userDetails.roll_no,
            class: userDetails.className,
            section: userDetails.sectionName,
        } : null,
        parent: userDetails.role === 'Parent' ? {
            father: userDetails.father_name ? {
                name: userDetails.father_name,
                phone: userDetails.father_phone,
            } : null,
            mother: userDetails.mother_name ? {
                name: userDetails.mother_name,
                phone: userDetails.mother_phone,
            } : null,
        } : null,
        school: {
            name: userDetails.schoolName || 'School',
        },
        refNo,
        date: new Date().toLocaleDateString(),
    };

    return await sendTemplatedEmail(
        userDetails.email,
        'welcome',
        data,
        schoolId
    );
};

/**
 * Send announcement email
 * @param {Object} announcement - Announcement details
 * @param {Array} recipients - Array of recipient objects {email, name, role}
 * @param {string} schoolId - School ID
 * @returns {Promise<Array>} - Array of send results
 */
const sendAnnouncementEmail = async (announcement, recipients, schoolId) => {
    const promises = recipients.map(async (recipient) => {
        const [firstName, ...lastNameParts] = (recipient.name || '').split(' ');
        const lastName = lastNameParts.join(' ');

        const data = {
            announcement: {
                title: announcement.title,
                content: announcement.content,
                message: announcement.content,
                date: new Date(announcement.date || Date.now()).toLocaleDateString(),
            },
            student: recipient.role === 'student' ? {
                firstName, first_name: firstName,
                lastName, last_name: lastName,
                fullName: recipient.name
            } : null,
            teacher: recipient.role === 'teacher' ? {
                firstName, first_name: firstName,
                lastName, last_name: lastName,
                fullName: recipient.name
            } : null,
            school: {
                name: announcement.schoolName || 'School',
            },
            recipient: {
                name: recipient.name,
            },
        };

        try {
            return await sendTemplatedEmail(
                recipient.email,
                'announcement',
                data,
                schoolId
            );
        } catch (error) {
            console.error(`Failed to send announcement to ${recipient.email}:`, error);
            return { success: false, email: recipient.email, error: error.message };
        }
    });

    return await Promise.allSettled(promises);
};

/**
 * Send student absence notification to parent
 * @param {Object} student - Student details
 * @param {Object} parent - Parent details
 * @param {string} schoolId - School ID
 * @param {Object} absenceDetails - Absence details {date, period}
 * @returns {Promise<Object>} - Send result
 */
const sendAbsenceNotification = async (student, parent, schoolId, absenceDetails = {}) => {
    const data = {
        student: {
            firstName: student.firstName || student.first_name,
            first_name: student.first_name || student.firstName,
            lastName: student.lastName || student.last_name,
            last_name: student.last_name || student.lastName,
            fullName: `${student.firstName || student.first_name} ${student.lastName || student.last_name}`,
            class: student.className,
            section: student.sectionName,
        },
        parent: {
            father: parent.father_name ? {
                name: parent.father_name,
                phone: parent.father_phone,
            } : null,
            mother: parent.mother_name ? {
                name: parent.mother_name,
                phone: parent.mother_phone,
            } : null,
        },
        absence: {
            date: absenceDetails.date || new Date().toLocaleDateString(),
            period: absenceDetails.period || 'Full Day',
        },
        school: {
            name: student.schoolName || 'School',
        },
    };

    return await sendTemplatedEmail(
        parent.email,
        'student_absent',
        data,
        schoolId
    );
};

/**
 * Send leave status email (approval/rejection)
 * @param {Object} leave - Leave request details
 * @param {string} status - 'approved' or 'rejected'
 * @param {string} schoolId - School ID
 * @returns {Promise<Object>} - Send result
 */
const sendLeaveStatusEmail = async (leave, status, schoolId) => {
    const applicant = leave.applicant || {};
    const firstName = applicant.firstName || applicant.first_name;
    const lastName = applicant.lastName || applicant.last_name;

    const data = {
        leave: {
            startDate: new Date(leave.start_date).toLocaleDateString(),
            endDate: new Date(leave.end_date).toLocaleDateString(),
            reason: leave.reason,
            rejectionReason: leave.admin_remarks || leave.rejection_reason,
        },
        student: leave.applicant_type === 'Student' ? {
            firstName, first_name: firstName,
            lastName, last_name: lastName,
            fullName: `${firstName} ${lastName}`,
        } : null,
        teacher: leave.applicant_type === 'Teacher' ? {
            firstName, first_name: firstName,
            lastName, last_name: lastName,
            fullName: `${firstName} ${lastName}`,
        } : null,
        school: {
            name: leave.schoolName || 'School',
        },
    };

    const templateType = status === 'approved' ? 'leave_approval' : 'leave_rejection';

    return await sendTemplatedEmail(
        leave.applicant?.email,
        templateType,
        data,
        schoolId
    );
};

/**
 * Send custom email using specific template ID
 * @param {string} to - Recipient email
 * @param {string} templateId - Template ID
 * @param {Object} data - Data to populate template
 * @returns {Promise<Object>} - Send result
 */
const sendCustomEmail = async (to, templateId, data) => {
    try {
        const template = await EmailTemplateSchema.findById(templateId);

        if (!template) {
            throw new Error('Template not found');
        }

        if (!template.isActive) {
            throw new Error('Template is not active');
        }

        const { resolvePlaceholders, getStyleTemplate } = require('@sms/shared/utils');

        const subject = resolvePlaceholders(template.subject, data);
        const resolvedHtml = resolvePlaceholders(template.htmlContent, data);

        // Wrap in style template
        const html = getStyleTemplate(template.styleTemplate || 'modern', resolvedHtml, {
            bannerImage: template.bannerImage || data.school?.logo,
            schoolName: data.school?.name || 'School',
            schoolAddress: data.school?.address,
            schoolEmail: data.school?.email,
            schoolPhone: data.school?.phone,
        });

        return await sendEmail({ to, subject, html });
    } catch (error) {
        console.error('Error sending custom email:', error);
        throw error;
    }
};

module.exports = {
    sendTemplatedEmail,
    sendWelcomeEmail,
    sendAnnouncementEmail,
    sendAbsenceNotification,
    sendLeaveStatusEmail,
    sendCustomEmail,
};
