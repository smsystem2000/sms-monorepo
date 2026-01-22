/**
 * Resolve placeholders in template with provided data
 * Supports nested placeholders like {{school.name}}, {{student.firstName}}
 * Supports conditional blocks like {{#if parent.father}}...{{/if}}
 * Supports fallback values like {{parent.father.name || parent.mother.name}}
 * 
 * @param {string} template - Template string with placeholders
 * @param {Object} data - Data object with values to replace placeholders
 * @returns {string} - Resolved template
 */
const resolvePlaceholders = (template, data) => {
    if (!template || typeof template !== 'string') {
        return template;
    }

    let resolved = template;

    // Handle conditional blocks {{#if condition}}...{{/if}}
    const conditionalRegex = /{{#if\s+([\w.]+)}}([\s\S]*?){{\/if}}/g;
    resolved = resolved.replace(conditionalRegex, (match, condition, content) => {
        const value = getNestedValue(data, condition);
        return value ? content : '';
    });

    // Handle simple placeholders and fallbacks {{key || fallback}}
    const placeholderRegex = /{{([\w.\s"|']+)}}/g;
    resolved = resolved.replace(placeholderRegex, (match, placeholder, offset) => {
        let finalValue = null;

        // Handle fallback syntax: key || fallback
        if (placeholder.includes('||')) {
            const parts = placeholder.split('||').map(p => p.trim());
            for (const part of parts) {
                // Handle string literals like 'User' or "Guest"
                if ((part.startsWith("'") && part.endsWith("'")) || (part.startsWith('"') && part.endsWith('"'))) {
                    finalValue = part.slice(1, -1);
                    break;
                }

                const value = getNestedValue(data, part);
                if (value !== null && value !== undefined && value !== '') {
                    finalValue = value;
                    break;
                }
            }
        } else {
            // Handle simple placeholder
            finalValue = getNestedValue(data, placeholder.trim());
        }

        if (finalValue === null || finalValue === undefined) return '';

        // Automatic Image Rendering: If value is an ImageKit URL and NOT inside an attribute (src/href)
        if (typeof finalValue === 'string' && finalValue.startsWith('https://ik.imagekit.io')) {
            // Check if preceded by src=" or href=" or url(
            const beforeMatch = resolved.slice(Math.max(0, offset - 10), offset);
            const isAttribute = /src\s*=\s*["']$|href\s*=\s*["']$|url\s*\(\s*["']?$/i.test(beforeMatch);

            if (!isAttribute) {
                return `<img src="${finalValue}" alt="Email Image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; display: block;" />`;
            }
        }

        return String(finalValue);
    });

    return resolved;
};

/**
 * Get nested value from object using dot notation
 * Supports fuzzy matching for camelCase/snake_case (e.g., firstName vs first_name)
 * @param {Object} obj - Object to get value from
 * @param {string} path - Dot-separated path (e.g., 'parent.father.name')
 * @returns {*} - Value at path or null
 */
const getNestedValue = (obj, path) => {
    if (!obj || !path) return null;

    const keys = path.split('.');
    let value = obj;

    for (const key of keys) {
        if (!value || typeof value !== 'object') return null;

        // Exact match
        if (key in value) {
            value = value[key];
        }
        // Fuzzy match: camelCase to snake_case (firstName -> first_name)
        else {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            if (snakeKey in value) {
                value = value[snakeKey];
            }
            // Fuzzy match: snake_case to camelCase (first_name -> firstName)
            else {
                const camelKey = key.replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''));
                if (camelKey in value) {
                    value = value[camelKey];
                } else {
                    return null;
                }
            }
        }
    }

    return value;
};

/**
 * Get default placeholder definitions for each category
 * @param {string} type - Template type ('welcome', 'announcement', etc.)
 * @returns {Array} - Array of placeholder objects
 */
const getDefaultPlaceholders = (type) => {
    const commonPlaceholders = [
        // School placeholders
        { key: 'school.name', label: 'School Name', category: 'school' },
        { key: 'school.address', label: 'School Address', category: 'school' },
        { key: 'school.phone', label: 'School Phone', category: 'school' },
        { key: 'school.email', label: 'School Email', category: 'school' },
        { key: 'school.logo', label: 'School Logo URL', category: 'school' },

        // Student placeholders
        { key: 'student.firstName', label: 'Student First Name', category: 'student' },
        { key: 'student.lastName', label: 'Student Last Name', category: 'student' },
        { key: 'student.fullName', label: 'Student Full Name', category: 'student' },
        { key: 'student.rollNo', label: 'Student Roll Number', category: 'student' },
        { key: 'student.class', label: 'Class Name', category: 'student' },
        { key: 'student.section', label: 'Section Name', category: 'student' },
        { key: 'student.email', label: 'Student Email', category: 'student' },

        // Parent placeholders
        { key: 'parent.father.name', label: "Father's Name", category: 'parent' },
        { key: 'parent.father.phone', label: "Father's Phone", category: 'parent' },
        { key: 'parent.mother.name', label: "Mother's Name", category: 'parent' },
        { key: 'parent.mother.phone', label: "Mother's Phone", category: 'parent' },
        { key: 'parent.guardian.name', label: "Guardian's Name", category: 'parent' },
        { key: 'parent.guardian.phone', label: "Guardian's Phone", category: 'parent' },

        // Teacher placeholders
        { key: 'teacher.firstName', label: 'Teacher First Name', category: 'teacher' },
        { key: 'teacher.lastName', label: 'Teacher Last Name', category: 'teacher' },
        { key: 'teacher.fullName', label: 'Teacher Full Name', category: 'teacher' },
        { key: 'teacher.subject', label: 'Subject Name', category: 'teacher' },
        { key: 'teacher.phone', label: 'Teacher Phone', category: 'teacher' },
        { key: 'teacher.email', label: 'Teacher Email', category: 'teacher' },

        // Custom/common placeholders
        { key: 'date', label: 'Current Date', category: 'custom' },
        { key: 'refNo', label: 'Reference Number', category: 'custom' },
        { key: 'customMessage', label: 'Custom Message', category: 'custom' },
    ];

    // Type-specific placeholders
    const typeSpecificPlaceholders = {
        leave_approval: [
            { key: 'leave.startDate', label: 'Leave Start Date', category: 'custom' },
            { key: 'leave.endDate', label: 'Leave End Date', category: 'custom' },
            { key: 'leave.reason', label: 'Leave Reason', category: 'custom' },
        ],
        leave_rejection: [
            { key: 'leave.startDate', label: 'Leave Start Date', category: 'custom' },
            { key: 'leave.endDate', label: 'Leave End Date', category: 'custom' },
            { key: 'leave.rejectionReason', label: 'Rejection Reason', category: 'custom' },
        ],
        exam_results: [
            { key: 'exam.name', label: 'Exam Name', category: 'custom' },
            { key: 'exam.totalMarks', label: 'Total Marks', category: 'custom' },
            { key: 'exam.obtainedMarks', label: 'Obtained Marks', category: 'custom' },
            { key: 'exam.percentage', label: 'Percentage', category: 'custom' },
        ],
        fee_reminder: [
            { key: 'fee.amount', label: 'Fee Amount', category: 'custom' },
            { key: 'fee.dueDate', label: 'Due Date', category: 'custom' },
            { key: 'fee.type', label: 'Fee Type', category: 'custom' },
        ],
        parent_teacher_meeting: [
            { key: 'meeting.date', label: 'Meeting Date', category: 'custom' },
            { key: 'meeting.time', label: 'Meeting Time', category: 'custom' },
            { key: 'meeting.venue', label: 'Meeting Venue', category: 'custom' },
        ],
        student_absent: [
            { key: 'absence.date', label: 'Absence Date', category: 'custom' },
            { key: 'absence.period', label: 'Period/Session', category: 'custom' },
        ],
    };

    const specificPlaceholders = typeSpecificPlaceholders[type] || [];
    return [...commonPlaceholders, ...specificPlaceholders];
};

module.exports = {
    resolvePlaceholders,
    getNestedValue,
    getDefaultPlaceholders,
};
