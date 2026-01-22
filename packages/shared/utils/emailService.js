const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter with Gmail configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Send email using nodemailer
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} [options.text] - Plain text content (optional)
 * @param {string} [options.cc] - CC email addresses (optional)
 * @param {string} [options.bcc] - BCC email addresses (optional)
 * @param {Array} [options.attachments] - Email attachments (optional)
 * @returns {Promise<Object>} - Email send result
 */
const sendEmail = async ({ to, subject, html, text, cc, bcc, attachments, from }) => {
    // Validate recipient email
    if (!to || typeof to !== 'string' || !to.includes('@')) {
        console.error('Invalid or missing recipient email:', to);
        throw new Error('Invalid recipient email address');
    }

    try {
        const mailOptions = {
            from: from ? `"${from}" <${process.env.EMAIL_USER}>` : `<${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
            text: text || undefined,
            cc: cc || undefined,
            bcc: bcc || undefined,
            attachments: attachments || undefined,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

/**
 * Verify email transporter connection
 * @returns {Promise<boolean>} - Connection status
 */
const verifyConnection = async () => {
    try {
        await transporter.verify();
        console.log('Email server connection verified');
        return true;
    } catch (error) {
        console.error('Email server connection failed:', error);
        return false;
    }
};

module.exports = {
    sendEmail,
    verifyConnection,
    transporter,
};
