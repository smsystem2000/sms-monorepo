import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    Alert,
    Skeleton,
    Button,
    Tabs,
    Tab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    Add as AddIcon,
    Announcement as AnnouncementIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetAnnouncements, useDeleteAnnouncement } from '../../../queries/Announcement';
import TokenService from '../../../queries/token/tokenService';
import type { Announcement, AnnouncementCategory } from '../../../types';

const categoryColors: Record<AnnouncementCategory, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    general: 'default',
    academic: 'primary',
    exam: 'info',
    holiday: 'success',
    event: 'secondary',
    fee: 'warning',
    emergency: 'error',
};

const SchoolAdminAnnouncements: React.FC = () => {
    const navigate = useNavigate();
    const schoolId = TokenService.getSchoolId() || '';
    const role = TokenService.getRole();

    const [tabValue, setTabValue] = useState(0);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

    const statusFilter = tabValue === 0 ? 'active' : tabValue === 1 ? 'archived' : undefined;

    const { data, isLoading, error, refetch } = useGetAnnouncements(schoolId, { status: statusFilter });
    const deleteAnnouncement = useDeleteAnnouncement(schoolId);

    const announcements = data?.data || [];

    const handleDelete = async () => {
        if (selectedAnnouncement) {
            await deleteAnnouncement.mutateAsync(selectedAnnouncement.announcementId);
            setDeleteDialogOpen(false);
            setSelectedAnnouncement(null);
            refetch();
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load announcements. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AnnouncementIcon color="primary" />
                        <Typography variant="h4" fontWeight={600}>
                            Announcements
                        </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                        Manage school announcements and circulars
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate(role === 'teacher' ? '/teacher/announcements/create' : '/school-admin/announcements/create')}
                >
                    Create Announcement
                </Button>
            </Box>

            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
                <Tab label="Active" />
                <Tab label="Archived" />
                <Tab label="All" />
            </Tabs>

            <Grid container spacing={2}>
                {isLoading ? (
                    [1, 2, 3].map((i) => (
                        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={i}>
                            <Card>
                                <CardContent>
                                    <Skeleton variant="text" width="70%" height={30} />
                                    <Skeleton variant="text" width="40%" />
                                    <Skeleton variant="text" width="100%" />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                ) : announcements.length === 0 ? (
                    <Grid size={{ xs: 12 }}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center', py: 6 }}>
                                <AnnouncementIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">
                                    No announcements found
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    sx={{ mt: 2 }}
                                    onClick={() => navigate(role === 'teacher' ? '/teacher/announcements/create' : '/school-admin/announcements/create')}
                                >
                                    Create First Announcement
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ) : (
                    announcements.map((ann: Announcement) => (
                        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={ann.announcementId}>
                            <Card
                                sx={{
                                    height: '100%',
                                    borderTop: 4,
                                    borderColor: ann.priority === 'urgent' ? 'error.main' :
                                        ann.priority === 'high' ? 'warning.main' : 'primary.main',
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                                        <Typography variant="h6" fontWeight={600} noWrap>
                                            {ann.title}
                                        </Typography>
                                        {ann.priority === 'urgent' && (
                                            <Chip size="small" label="Urgent" color="error" icon={<WarningIcon />} />
                                        )}
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                        <Chip
                                            size="small"
                                            label={ann.category}
                                            color={categoryColors[ann.category]}
                                            variant="outlined"
                                        />
                                        <Chip
                                            size="small"
                                            label={ann.targetAudience === 'specific_class' ? 'Specific Classes' : ann.targetAudience}
                                            variant="outlined"
                                        />
                                        <Chip
                                            size="small"
                                            label={ann.status}
                                            color={ann.status === 'active' ? 'success' : 'default'}
                                        />
                                    </Box>

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            mb: 2,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {ann.content}
                                    </Typography>

                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                                        Published: {formatDate(ann.publishDate)} • By {ann.createdByName || 'Admin'}
                                    </Typography>

                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            size="small"
                                            startIcon={<EditIcon />}
                                            onClick={() => navigate(`${role === 'teacher' ? '/teacher' : '/school-admin'}/announcements/edit/${ann.announcementId}`)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="small"
                                            color="error"
                                            startIcon={<DeleteIcon />}
                                            onClick={() => {
                                                setSelectedAnnouncement(ann);
                                                setDeleteDialogOpen(true);
                                            }}
                                        >
                                            Archive
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                )}
            </Grid>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Archive Announcement</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to archive "{selectedAnnouncement?.title}"?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={handleDelete}
                        disabled={deleteAnnouncement.isPending}
                    >
                        Archive
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SchoolAdminAnnouncements;
