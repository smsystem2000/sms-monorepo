const express = require('express');
const router = express.Router();
const { sendTestEmail, verifyEmailConfig } = require('../controllers/testEmail.controller');

// Test email sending
router.post('/send-email', sendTestEmail);

// Verify email configuration
router.get('/verify-email-config', verifyEmailConfig);

module.exports = router;
