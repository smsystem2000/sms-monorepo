const { checkAuth, Authenticated } = require("./auth");
const { authorizeRoles, checkRole } = require("./authorizeRole");

module.exports = {
    // Authentication
    checkAuth,
    Authenticated,

    // Authorization
    authorizeRoles,
    checkRole
};
