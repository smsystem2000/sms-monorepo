const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Flatten the array if an array was passed as first argument
    const roles = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles;

    // Debug logging - remove after fixing
    console.log("Auth Debug:", {
      userRole: req.user?.role,
      allowedRoles: roles,
      hasUser: !!req.user,
      roleMatch: roles.includes(req.user?.role),
    });

    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied", debug: { userRole: req.user?.role, allowedRoles: roles } });
    }
    next();
  };
};

module.exports = authorizeRoles;
