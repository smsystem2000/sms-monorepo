import React, { useState, useRef } from 'react';
import { IKContext, IKUpload } from 'imagekitio-react';
import {
    Box,
    CircularProgress,
    Typography,
    IconButton,
    Alert,
    Stack,
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Delete as DeleteIcon,
    InsertDriveFile as FileIcon,
    Image as ImageIcon,
    PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import {
    imagekitConfig,
    getImageKitAuthenticator,
    type AuthEndpoint,
} from '../../utils/imagekit';
import type { AnnouncementAttachment } from '../../types';

export interface FileUploadProps {
    /** ImageKit folder path (e.g., '/announcements') */
    folder: string;
    /** Base file name (timestamp will be appended) */
    baseFileName: string;
    /** Current attachments */
    currentAttachments?: AnnouncementAttachment[];
    /** Callback when upload succeeds */
    onUploadSuccess: (attachments: AnnouncementAttachment[]) => void;
    /** Callback when upload fails */
    onUploadError?: (error: Error) => void;
    /** Label for the upload field */
    label?: string;
    /** Whether the field is required */
    required?: boolean;
    /** Whether upload is disabled */
    disabled?: boolean;
    /** Authentication endpoint type */
    authEndpoint?: AuthEndpoint;
    /** Maximum number of files */
    maxFiles?: number;
}

const getFileIcon = (fileType: string) => {
    if (fileType === 'image') return <ImageIcon color="primary" />;
    if (fileType === 'pdf') return <PdfIcon color="error" />;
    return <FileIcon color="action" />;
};

const getFileType = (fileName: string): 'image' | 'pdf' | 'document' => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image';
    if (ext === 'pdf') return 'pdf';
    return 'document';
};

const FileUpload: React.FC<FileUploadProps> = ({
    folder,
    baseFileName,
    currentAttachments = [],
    onUploadSuccess,
    onUploadError,
    label = 'Upload Files',
    required = false,
    disabled = false,
    authEndpoint = 'school',
    maxFiles = 5,
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [attachments, setAttachments] = useState<AnnouncementAttachment[]>(currentAttachments);
    const [error, setError] = useState<string | null>(null);
    const uploadRef = useRef<HTMLInputElement>(null);

    // Handle successful upload
    const handleUploadSuccess = (response: { url: string; fileId: string; name: string }) => {
        setIsUploading(false);
        setError(null);

        const newAttachment: AnnouncementAttachment = {
            url: response.url,
            fileName: response.name,
            fileType: getFileType(response.name),
            uploadedAt: new Date().toISOString(),
        };

        const newAttachments = [...attachments, newAttachment];
        setAttachments(newAttachments);
        onUploadSuccess(newAttachments);
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

    // Handle remove attachment
    const handleRemove = (index: number) => {
        const newAttachments = attachments.filter((_, i) => i !== index);
        setAttachments(newAttachments);
        onUploadSuccess(newAttachments);
    };

    // Trigger file input click
    const triggerUpload = () => {
        if (!disabled && uploadRef.current && attachments.length < maxFiles) {
            uploadRef.current.click();
        }
    };

    // Get authenticator function for ImageKit
    const authenticator = getImageKitAuthenticator(authEndpoint);

    // Generate unique filename
    const fileName = `${baseFileName}_${Date.now()}`;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
                {label} {required && <span style={{ color: 'red' }}>*</span>}
            </Typography>

            {/* Upload Button */}
            {attachments.length < maxFiles && !disabled && (
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
                        minHeight: 120,
                        bgcolor: 'grey.50',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
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
                    ) : (
                        <>
                            <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                                Click to upload
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                                Images and PDFs up to 5MB ({attachments.length}/{maxFiles} files)
                            </Typography>
                        </>
                    )}
                </Box>
            )}

            {/* Uploaded Files List */}
            {attachments.length > 0 && (
                <Stack spacing={1}>
                    {attachments.map((attachment, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                p: 1.5,
                                border: '1px solid',
                                borderColor: 'grey.300',
                                borderRadius: 1,
                                bgcolor: 'background.paper',
                            }}
                        >
                            {getFileIcon(attachment.fileType)}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" noWrap>
                                    {attachment.fileName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {attachment.fileType.toUpperCase()}
                                </Typography>
                            </Box>
                            {!disabled && (
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleRemove(index)}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            )}
                        </Box>
                    ))}
                </Stack>
            )}

            {error && (
                <Alert severity="error" sx={{ py: 0.5 }}>
                    {error}
                </Alert>
            )}

            {/* Hidden ImageKit Upload Component */}
            <IKContext
                publicKey={imagekitConfig.publicKey}
                urlEndpoint={imagekitConfig.urlEndpoint}
                authenticator={authenticator}
            >
                <IKUpload
                    ref={uploadRef}
                    fileName={fileName}
                    folder={folder}
                    // @ts-ignore - IKUpload types are incompatible with React event handlers
                    onError={handleUploadError}
                    onSuccess={handleUploadSuccess}
                    onUploadStart={handleUploadStart}
                    style={{ display: 'none' }}
                    accept="image/*,.pdf"
                />
            </IKContext>
        </Box>
    );
};

export default FileUpload;
