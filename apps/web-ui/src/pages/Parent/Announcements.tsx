import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Chip,
    Alert,
    Skeleton,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Button,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
} from '@mui/material';
import {
    Announcement as AnnouncementIcon,
    ExpandMore as ExpandMoreIcon,
    AttachFile as AttachFileIcon,
    Warning as WarningIcon,
    Event as EventIcon,
    School as SchoolIcon,
    Close as CloseIcon,
    Download as DownloadIcon,
} from '@mui/icons-material';
import { useGetAnnouncements, useMarkAnnouncementSeen } from '../../queries/Announcement';
import TokenService from '../../queries/token/tokenService';
import type { Announcement, AnnouncementCategory, AnnouncementAttachment } from '../../types';

const categoryColors: Record<AnnouncementCategory, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    general: 'default',
    academic: 'primary',
    exam: 'info',
    holiday: 'success',
    event: 'secondary',
    fee: 'warning',
    emergency: 'error',
};

// priorityColors removed - using inline logic instead

const getCategoryIcon = (category: AnnouncementCategory) => {
    switch (category) {
        case 'exam':
            return <SchoolIcon fontSize="small" />;
        case 'holiday':
        case 'event':
            return <EventIcon fontSize="small" />;
        case 'emergency':
            return <WarningIcon fontSize="small" />;
        default:
            return <AnnouncementIcon fontSize="small" />;
    }
};

const Announcements: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const { data, isLoading, error } = useGetAnnouncements(schoolId);
    const markAsSeen = useMarkAnnouncementSeen(schoolId);

    const [viewerOpen, setViewerOpen] = useState(false);
    const [currentFile, setCurrentFile] = useState<AnnouncementAttachment | null>(null);

    const announcements = data?.data || [];

    const handleExpand = (announcementId: string, isSeen: boolean) => {
        // Mark as seen when expanding if not already seen
        if (!isSeen) {
            markAsSeen.mutate(announcementId);
        }
    };

    const handleViewFile = (attachment: AnnouncementAttachment) => {
        setCurrentFile(attachment);
        setViewerOpen(true);
    };

    const handleCloseViewer = () => {
        setViewerOpen(false);
        setCurrentFile(null);
    };

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load announcements. Please try again later.</Alert>
            </Box>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const isImageFile = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
    };

    const isPdfFile = (fileName: string) => {
        return fileName.toLowerCase().endsWith('.pdf');
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AnnouncementIcon color="primary" />
                <Typography variant="h4" fontWeight={600}>
                    Announcements
                </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                School announcements and circulars
            </Typography>

            {isLoading ? (
                <Box>
                    {[1, 2, 3].map((i) => (
                        <Card key={i} sx={{ mb: 2 }}>
                            <CardContent>
                                <Skeleton variant="text" width="60%" height={30} />
                                <Skeleton variant="text" width="30%" />
                                <Skeleton variant="text" width="100%" />
                                <Skeleton variant="text" width="80%" />
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            ) : announcements.length === 0 ? (
                <Card>
                    <CardContent sx={{ textAlign: 'center', py: 6 }}>
                        <AnnouncementIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            No announcements yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            New announcements will appear here
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                announcements.map((announcement: Announcement) => (
                    <Accordion
                        key={announcement.announcementId}
                        sx={{ mb: 1 }}
                        onChange={(_, expanded) => {
                            if (expanded) {
                                handleExpand(announcement.announcementId, announcement.isSeen || false);
                            }
                        }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    {!announcement.isSeen && (
                                        <Box
                                            sx={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                bgcolor: 'primary.main',
                                                flexShrink: 0
                                            }}
                                        />
                                    )}
                                    <Typography
                                        variant="subtitle1"
                                        fontWeight={announcement.isSeen ? 500 : 700}
                                    >
                                        {announcement.title}
                                    </Typography>
                                    {announcement.priority === 'urgent' && (
                                        <Chip
                                            size="small"
                                            label="URGENT"
                                            color="error"
                                            icon={<WarningIcon />}
                                            sx={{ height: 24 }}
                                        />
                                    )}
                                    {announcement.priority === 'high' && (
                                        <Chip
                                            size="small"
                                            label="Important"
                                            color="warning"
                                            sx={{ height: 24 }}
                                        />
                                    )}
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip
                                        size="small"
                                        icon={getCategoryIcon(announcement.category)}
                                        label={announcement.category.charAt(0).toUpperCase() + announcement.category.slice(1)}
                                        color={categoryColors[announcement.category]}
                                        variant="outlined"
                                        sx={{ height: 22 }}
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                        {formatDate(announcement.publishDate)}
                                    </Typography>
                                    {announcement.createdByName && (
                                        <Typography variant="caption" color="text.secondary">
                                            • By {announcement.createdByName}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography
                                variant="body1"
                                sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}
                            >
                                {announcement.content}
                            </Typography>

                            {/* Display multiple attachments */}
                            {(announcement.attachments && announcement.attachments.length > 0) && (
                                <Box sx={{ mt: 2 }}>
                                    <Divider sx={{ mb: 2 }} />
                                    <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Attachments</Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {announcement.attachments.map((attachment: AnnouncementAttachment, index: number) => (
                                            <Button
                                                key={index}
                                                variant="outlined"
                                                size="small"
                                                startIcon={<AttachFileIcon />}
                                                onClick={() => handleViewFile(attachment)}
                                                sx={{ textTransform: 'none' }}
                                            >
                                                {attachment.fileName || `Attachment ${index + 1}`}
                                            </Button>
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            {/* Backwards compatibility: single attachmentUrl */}
                            {announcement.attachmentUrl && (!announcement.attachments || announcement.attachments.length === 0) && (
                                <Box sx={{ mt: 2 }}>
                                    <Divider sx={{ mb: 2 }} />
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<AttachFileIcon />}
                                        href={announcement.attachmentUrl}
                                        target="_blank"
                                    >
                                        View Attachment
                                    </Button>
                                </Box>
                            )}

                            {announcement.expiryDate && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Valid until: {formatDate(announcement.expiryDate)}
                                    </Typography>
                                </Box>
                            )}
                        </AccordionDetails>
                    </Accordion>
                ))
            )}

            {/* File Viewer Dialog */}
            <Dialog
                open={viewerOpen}
                onClose={handleCloseViewer}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: { height: '90vh' }
                }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">{currentFile?.fileName}</Typography>
                        <Box>
                            <IconButton
                                component="a"
                                href={currentFile?.url}
                                download
                                target="_blank"
                                size="small"
                                sx={{ mr: 1 }}
                            >
                                <DownloadIcon />
                            </IconButton>
                            <IconButton onClick={handleCloseViewer} size="small">
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: 'grey.100' }}>
                    {currentFile && (currentFile.fileType === 'image' || isImageFile(currentFile.fileName)) && (
                        <Box
                            component="img"
                            src={currentFile.url}
                            alt={currentFile.fileName}
                            sx={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                            }}
                        />
                    )}
                    {currentFile && (currentFile.fileType === 'pdf' || isPdfFile(currentFile.fileName)) && (
                        <iframe
                            src={currentFile.url}
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                            }}
                            title={currentFile.fileName}
                        />
                    )}
                    {currentFile && currentFile.fileType !== 'image' && currentFile.fileType !== 'pdf' && !isImageFile(currentFile.fileName) && !isPdfFile(currentFile.fileName) && (
                        <Box sx={{ textAlign: 'center', p: 4 }}>
                            <AttachFileIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="body1" color="text.secondary">
                                Preview not available for this file type
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<DownloadIcon />}
                                href={currentFile.url}
                                download
                                target="_blank"
                                sx={{ mt: 2 }}
                            >
                                Download File
                            </Button>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default Announcements;
