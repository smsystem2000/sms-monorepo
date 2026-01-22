const express = require('express');
const router = express.Router({ mergeParams: true });
const emailTemplateController = require('../controllers/emailTemplate.controller');
const { Authenticated, authorizeRoles } = require('@sms/shared/middlewares');

// All routes require authentication and School Admin role
router.use(Authenticated);
router.use(authorizeRoles('sch_admin'));

// Template types and placeholders (utility endpoints)
router.get('/types', emailTemplateController.getTemplateTypes);
router.get('/placeholders/:type', emailTemplateController.getPlaceholdersByType);

// Template CRUD
router.post('/', emailTemplateController.createTemplate);
router.get('/', emailTemplateController.getTemplates);
router.get('/:id', emailTemplateController.getTemplateById);
router.put('/:id', emailTemplateController.updateTemplate);
router.delete('/:id', emailTemplateController.deleteTemplate);

// Template actions
router.post('/:id/duplicate', emailTemplateController.duplicateTemplate);
router.post('/:id/preview', emailTemplateController.previewTemplate);

module.exports = router;
