import React, { useState, useRef } from 'react';
import { IKContext, IKUpload } from 'imagekitio-react';
import {
    Box,
    Button,
    CircularProgress,
    Typography,
    Avatar,
    IconButton,
    Alert,
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Delete as DeleteIcon,
    Image as ImageIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import {
    imagekitConfig,
    getImageKitAuthenticator,
    type AuthEndpoint,
} from '../../utils/imagekit';

export interface UploadResult {
    url: string;
    fileId: string;
    name: string;
}

export interface ImageUploadProps {
    /** ImageKit folder path (e.g., '/school_logos', '/profile_images', '/signatures') */
    folder: string;
    /** File name for the uploaded file (e.g., 'SCHL00001_logo') */
    fileName: string;
    /** Current image URL (for displaying existing image) */
    currentImage?: string;
    /** Callback when upload succeeds */
    onUploadSuccess: (result: UploadResult) => void;
    /** Callback when upload fails */
    onUploadError?: (error: Error) => void;
    /** Callback when image is removed */
    onRemove?: () => void;
    /** Label for the upload field */
    label?: string;
    /** Whether the field is required */
    required?: boolean;
    /** Whether upload is disabled */
    disabled?: boolean;
    /** Aspect ratio for preview (e.g., '1:1', '16:9') */
    aspectRatio?: string;
    /** Size of the preview (small, medium, large) */
    size?: 'small' | 'medium' | 'large';
    /** Authentication endpoint type */
    authEndpoint?: AuthEndpoint;
    /** Variant style */
    variant?: 'avatar' | 'card';
}

const sizeMap = {
    small: { width: 80, height: 80, fontSize: '0.75rem' },
    medium: { width: 120, height: 120, fontSize: '0.875rem' },
    large: { width: 180, height: 180, fontSize: '1rem' },
};

const ImageUpload: React.FC<ImageUploadProps> = ({
    folder,
    fileName,
    currentImage,
    onUploadSuccess,
    onUploadError,
    onRemove,
    label = 'Upload Image',
    required = false,
    disabled = false,
    size = 'medium',
    authEndpoint = 'school',
    variant = 'card',
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const [error, setError] = useState<string | null>(null);
    const uploadRef = useRef<HTMLInputElement>(null);

    const dimensions = sizeMap[size];

    // Handle successful upload
    const handleUploadSuccess = (response: { url: string; fileId: string; name: string }) => {
        setIsUploading(false);
        setPreview(response.url);
        setError(null);
        onUploadSuccess({
            url: response.url,
            fileId: response.fileId,
            name: response.name,
        });
    };

    // Handle upload error
    const handleUploadError = (err: Error) => {
        setIsUploading(false);
        setError(err.message || 'Upload failed');
        onUploadError?.(err);
    };

    // Handle upload start
    const handleUploadStart = () => {
        setIsUploading(true);
        setError(null);
    };

    // Handle remove image
    const handleRemove = () => {
        setPreview(null);
        onRemove?.();
    };

    // Trigger file input click
    const triggerUpload = () => {
        if (!disabled && uploadRef.current) {
            uploadRef.current.click();
        }
    };

    // Get authenticator function for ImageKit
    const authenticator = getImageKitAuthenticator(authEndpoint);

    // Render avatar variant
    if (variant === 'avatar') {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {label} {required && <span style={{ color: 'red' }}>*</span>}
                </Typography>

                <Box sx={{ position: 'relative' }}>
                    <Avatar
                        src={preview || undefined}
                        sx={{
                            width: dimensions.width,
                            height: dimensions.height,
                            bgcolor: 'grey.200',
                            cursor: disabled ? 'default' : 'pointer',
                        }}
                        onClick={triggerUpload}
                    >
                        {isUploading ? (
                            <CircularProgress size={24} />
                        ) : (
                            <ImageIcon sx={{ fontSize: dimensions.width / 2, color: 'grey.400' }} />
                        )}
                    </Avatar>

                    {preview && !disabled && (
                        <IconButton
                            size="small"
                            onClick={handleRemove}
                            sx={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                bgcolor: 'error.main',
                                color: 'white',
                                '&:hover': { bgcolor: 'error.dark' },
                            }}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    )}

                    {!preview && !disabled && (
                        <IconButton
                            size="small"
                            onClick={triggerUpload}
                            sx={{
                                position: 'absolute',
                                bottom: -4,
                                right: -4,
                                bgcolor: 'primary.main',
                                color: 'white',
                                '&:hover': { bgcolor: 'primary.dark' },
                            }}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    )}
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mt: 1, py: 0, fontSize: '0.75rem' }}>
                        {error}
                    </Alert>
                )}

                <IKContext
                    publicKey={imagekitConfig.publicKey}
                    urlEndpoint={imagekitConfig.urlEndpoint}
                    authenticator={authenticator}
                >
                    <IKUpload
                        ref={uploadRef}
                        fileName={fileName}
                        folder={folder}
                        onError={handleUploadError as unknown as (err: Error) => void}
                        onSuccess={handleUploadSuccess}
                        onUploadStart={handleUploadStart}
                        style={{ display: 'none' }}
                        accept="image/*"
                    />
                </IKContext>
            </Box>
        );
    }

    // Render card variant (default)
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
                {label} {required && <span style={{ color: 'red' }}>*</span>}
            </Typography>

            <Box
                sx={{
                    border: '2px dashed',
                    borderColor: error ? 'error.main' : 'grey.300',
                    borderRadius: 2,
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: dimensions.height + 40,
                    bgcolor: 'grey.50',
                    cursor: disabled ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': disabled ? {} : {
                        borderColor: 'primary.main',
                        bgcolor: 'primary.50',
                    },
                }}
                onClick={triggerUpload}
            >
                {isUploading ? (
                    <>
                        <CircularProgress size={40} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Uploading...
                        </Typography>
                    </>
                ) : preview ? (
                    <Box sx={{ position: 'relative', width: '100%', textAlign: 'center' }}>
                        <Box
                            component="img"
                            src={preview}
                            alt="Preview"
                            sx={{
                                maxWidth: '100%',
                                maxHeight: dimensions.height,
                                objectFit: 'contain',
                                borderRadius: 1,
                            }}
                        />
                        {!disabled && (
                            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 1 }}>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<UploadIcon />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        triggerUpload();
                                    }}
                                >
                                    Change
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemove();
                                    }}
                                >
                                    Remove
                                </Button>
                            </Box>
                        )}
                    </Box>
                ) : (
                    <>
                        <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                            Click to upload
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                            PNG, JPG up to 5MB
                        </Typography>
                    </>
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{ py: 0.5 }}>
                    {error}
                </Alert>
            )}

            <IKContext
                publicKey={imagekitConfig.publicKey}
                urlEndpoint={imagekitConfig.urlEndpoint}
                authenticator={authenticator}
            >
                <IKUpload
                    ref={uploadRef}
                    fileName={fileName}
                    folder={folder}
                    onError={handleUploadError as unknown as (err: Error) => void}
                    onSuccess={handleUploadSuccess}
                    onUploadStart={handleUploadStart}
                    style={{ display: 'none' }}
                    accept="image/*"
                />
            </IKContext>
        </Box>
    );
};

export default ImageUpload;
