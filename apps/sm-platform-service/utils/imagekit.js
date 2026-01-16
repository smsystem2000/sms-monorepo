const ImageKit = require("imagekit");

// Validate required environment variables
const validateConfig = () => {
    const required = ['IMAGEKIT_PUBLIC_KEY', 'IMAGEKIT_PRIVATE_KEY', 'IMAGEKIT_URL_ENDPOINT'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.warn(`⚠️ Missing ImageKit environment variables: ${missing.join(', ')}`);
        return false;
    }
    return true;
};

// Initialize ImageKit SDK only if config is valid
let imagekit = null;
if (validateConfig()) {
    imagekit = new ImageKit({
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });
}

/**
 * Get authentication parameters for frontend SDK uploads
 * This is required for client-side uploads to ImageKit
 */
const getAuthenticationParameters = () => {
    if (!imagekit) {
        throw new Error('ImageKit is not configured. Please check environment variables.');
    }
    return imagekit.getAuthenticationParameters();
};

module.exports = {
    imagekit,
    getAuthenticationParameters,
};
