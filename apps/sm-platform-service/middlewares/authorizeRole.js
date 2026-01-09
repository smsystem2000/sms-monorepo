const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Flatten the array if an array was passed as first argument
    const roles = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles;

    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

module.exports = authorizeRoles;
