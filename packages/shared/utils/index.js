const emailService = require('./emailService');
const placeholderResolver = require('./placeholderResolver');
const emailStyleTemplates = require('./emailStyleTemplates');

module.exports = {
    ...emailService,
    ...placeholderResolver,
    ...emailStyleTemplates,
};
