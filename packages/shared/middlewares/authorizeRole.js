/**
 * Middleware to check if user has required role(s)
 * @param {...string} allowedRoles - Allowed roles (can be passed as spread args or array)
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // Flatten the array if an array was passed as first argument
        const roles = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles;

        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied. Insufficient permissions." });
        }
        next();
    };
};

// Alias for backward compatibility with sm-user-service
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied. Insufficient permissions." });
        }
        next();
    };
};

module.exports = { authorizeRoles, checkRole };
