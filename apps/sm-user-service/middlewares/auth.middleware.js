const jwt = require("jsonwebtoken");

/**
 * Middleware to check if user is authenticated
 */
const checkAuth = (req, res, next) => {
    const auth = req.headers["authorization"] || req.headers["Authorization"];
    if (!auth || !auth.startsWith("Bearer")) {
        return res
            .status(403)
            .json({ message: "Unauthorized, JWT token is required" });
    }
    try {
        const token = auth.split(" ")[1];
        if (!token) {
            return res
                .status(403)
                .json({ message: "Unauthorized, JWT token is missing" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res
            .status(403)
            .json({ message: "Unauthorized, JWT token is invalid or expired" });
    }
};

/**
 * Middleware to check if user has required role(s)
 * @param {string[]} allowedRoles - Array of allowed roles
 */
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        // Flatten the array if an array was passed as first argument
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied. Insufficient permissions." });
        }
        next();
    };
};

module.exports = { checkAuth, checkRole };
