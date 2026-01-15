const { getAuthenticationParameters } = require("../utils/imagekit");

/**
 * Get ImageKit authentication parameters for frontend SDK uploads
 * Used for: teacher, student, parent profile images & signatures
 */
const getImageKitAuth = async (req, res) => {
    try {
        const authParams = getAuthenticationParameters();

        return res.status(200).json({
            success: true,
            message: "ImageKit authentication parameters retrieved",
            data: authParams,
        });
    } catch (error) {
        console.error("Error getting ImageKit auth:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get ImageKit authentication parameters",
            error: error.message,
        });
    }
};

module.exports = {
    getImageKitAuth,
};
