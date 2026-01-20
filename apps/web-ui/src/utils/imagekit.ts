import useApi from '../queries/useApi';

// ImageKit configuration from environment variables
export const imagekitConfig = {
    publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || '',
    urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/sms',
};

// ImageKit folder paths
export const IMAGEKIT_FOLDERS = {
    SCHOOL_LOGOS: '/school_logos',
    PROFILE_IMAGES: '/profile_images',
    SIGNATURES: '/signatures',
    ANNOUNCEMENTS: '/announcements',
} as const;

// Interface for auth response
interface ImageKitAuthResponse {
    token: string;
    expire: number;
    signature: string;
}

/**
 * Get ImageKit authentication parameters from user service
 * Used for: teacher, student, parent images
 */
export const getSchoolImageKitAuth = async (): Promise<ImageKitAuthResponse> => {
    const response = await useApi<{ success: boolean; data: ImageKitAuthResponse }>(
        'GET',
        '/api/school/upload/auth'
    );
    return response.data;
};

/**
 * Get ImageKit authentication parameters from platform service
 * Used for: school logos, school admin images
 */
export const getAdminImageKitAuth = async (): Promise<ImageKitAuthResponse> => {
    const response = await useApi<{ success: boolean; data: ImageKitAuthResponse }>(
        'GET',
        '/api/admin/upload/auth'
    );
    return response.data;
};

// Type for auth endpoint selection
export type AuthEndpoint = 'school' | 'admin';

/**
 * Get appropriate auth function based on endpoint type
 */
export const getImageKitAuthenticator = (endpoint: AuthEndpoint) => {
    const authFunction = endpoint === 'admin' ? getAdminImageKitAuth : getSchoolImageKitAuth;

    // Return a function that ImageKit expects
    return async () => {
        try {
            const authParams = await authFunction();
            return {
                token: authParams.token,
                expire: authParams.expire,
                signature: authParams.signature,
            };
        } catch (error) {
            console.error('ImageKit auth failed:', error);
            throw error;
        }
    };
};
