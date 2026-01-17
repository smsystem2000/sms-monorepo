import React from 'react';
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
} from '@mui/material';
import {
    Announcement as AnnouncementIcon,
    ExpandMore as ExpandMoreIcon,
    AttachFile as AttachFileIcon,
    Warning as WarningIcon,
    Event as EventIcon,
    School as SchoolIcon,
} from '@mui/icons-material';
import { useGetAnnouncements } from '../../queries/Announcement';
import TokenService from '../../queries/token/tokenService';
import type { Announcement, AnnouncementCategory, AnnouncementPriority } from '../../types';

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

    const announcements = data?.data || [];

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
                    <Accordion key={announcement.announcementId} sx={{ mb: 1 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Typography variant="subtitle1" fontWeight={600}>
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

                            {announcement.attachmentUrl && (
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
        </Box>
    );
};

export default Announcements;
