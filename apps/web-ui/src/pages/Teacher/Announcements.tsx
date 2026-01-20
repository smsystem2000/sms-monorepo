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
    Tabs,
    Tab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    TextField,
    MenuItem,
    FormControlLabel,
    Checkbox,
    Stack,
    Paper,
} from '@mui/material';
import {
    Announcement as AnnouncementIcon,
    ExpandMore as ExpandMoreIcon,
    AttachFile as AttachFileIcon,
    Warning as WarningIcon,
    Event as EventIcon,
    School as SchoolIcon,
    Add as AddIcon,
    Close as CloseIcon,
    Download as DownloadIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useGetAnnouncements, useMarkAnnouncementSeen, useDeleteAnnouncement, useCreateAnnouncement, useUpdateAnnouncement } from '../../queries/Announcement';
import { useGetClasses } from '../../queries/Class';
import TokenService from '../../queries/token/tokenService';
import FileUpload from '../../components/FileUpload/FileUpload';
import { IMAGEKIT_FOLDERS } from '../../utils/imagekit';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { Announcement, AnnouncementCategory, AnnouncementAttachment, AnnouncementPriority, AnnouncementTargetAudience } from '../../types';

const categoryColors: Record<AnnouncementCategory, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    general: 'default',
    academic: 'primary',
    exam: 'info',
    holiday: 'success',
    event: 'secondary',
    fee: 'warning',
    emergency: 'error',
};

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
    const userId = TokenService.getUserId() || '';
    const { data, isLoading, error } = useGetAnnouncements(schoolId);
    const markAsSeen = useMarkAnnouncementSeen(schoolId);

    const [tabValue, setTabValue] = useState(0);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [currentFile, setCurrentFile] = useState<AnnouncementAttachment | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

    const deleteAnnouncement = useDeleteAnnouncement(schoolId);
    const createAnnouncement = useCreateAnnouncement(schoolId);
    const updateAnnouncement = useUpdateAnnouncement(schoolId);
    const { data: classesData } = useGetClasses(schoolId);

    const classes = classesData?.data || [];
    console.log(currentFile, "currentFile")
    const allAnnouncements = data?.data || [];

    // Filter announcements based on tab
    const announcements = tabValue === 0
        ? allAnnouncements // All announcements
        : allAnnouncements.filter((ann: Announcement) => ann.createdBy === userId); // Your announcements

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

    const handleDelete = async () => {
        if (selectedAnnouncement) {
            await deleteAnnouncement.mutateAsync(selectedAnnouncement.announcementId);
            setDeleteDialogOpen(false);
            setSelectedAnnouncement(null);
        }
    };

    // Form dialog state
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState<{
        title: string;
        content: string;
        category: AnnouncementCategory;
        priority: AnnouncementPriority;
        targetAudience: AnnouncementTargetAudience;
        targetClasses: string[];
        attachments: AnnouncementAttachment[];
        publishDate: Date | null;
        expiryDate: Date | null;
    }>({
        title: '',
        content: '',
        category: 'general',
        priority: 'normal',
        targetAudience: 'specific_class',
        targetClasses: [],
        attachments: [],
        publishDate: new Date(),
        expiryDate: null,
    });

    const handleOpenCreateDialog = () => {
        setEditMode(false);
        setFormData({
            title: '',
            content: '',
            category: 'general',
            priority: 'normal',
            targetAudience: 'specific_class',
            targetClasses: [],
            attachments: [],
            publishDate: new Date(),
            expiryDate: null,
        });
        setFormDialogOpen(true);
    };

    const handleOpenEditDialog = (announcement: Announcement) => {
        setEditMode(true);
        setSelectedAnnouncement(announcement);
        setFormData({
            title: announcement.title,
            content: announcement.content,
            category: announcement.category,
            priority: announcement.priority,
            targetAudience: announcement.targetAudience,
            targetClasses: announcement.targetClasses || [],
            attachments: announcement.attachments || [],
            publishDate: announcement.publishDate ? new Date(announcement.publishDate) : new Date(),
            expiryDate: announcement.expiryDate ? new Date(announcement.expiryDate) : null,
        });
        setFormDialogOpen(true);
    };

    const handleCloseFormDialog = () => {
        setFormDialogOpen(false);
        setEditMode(false);
        setSelectedAnnouncement(null);
    };

    const handleFormSubmit = async () => {
        try {
            const payload = {
                title: formData.title,
                content: formData.content,
                category: formData.category,
                priority: formData.priority,
                targetAudience: formData.targetAudience,
                targetClasses: formData.targetClasses,
                attachments: formData.attachments,
                publishDate: formData.publishDate?.toISOString() || new Date().toISOString(),
                expiryDate: formData.expiryDate?.toISOString(),
            };

            if (editMode && selectedAnnouncement) {
                await updateAnnouncement.mutateAsync({
                    announcementId: selectedAnnouncement.announcementId,
                    ...payload,
                });
            } else {
                await createAnnouncement.mutateAsync(payload);
            }

            handleCloseFormDialog();
        } catch (error) {
            console.error('Error saving announcement:', error);
        }
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <AnnouncementIcon color="primary" />
                        <Typography variant="h4" fontWeight={600}>
                            Announcements
                        </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                        School announcements and circulars
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreateDialog}
                >
                    Create Announcement
                </Button>
            </Box>

            {/* Tabs for filtering */}
            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
                <Tab label="All Announcements" />
                <Tab label="Your Announcements" />
            </Tabs>

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
                            {tabValue === 1 ? "You haven't created any announcements yet" : "No announcements yet"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {tabValue === 1 ? "Click 'Create Announcement' to get started" : "New announcements will appear here"}
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

                            {/* Edit and Archive buttons for teacher's own announcements */}
                            {announcement.createdBy === userId && (
                                <>
                                    <Divider sx={{ mt: 2, mb: 2 }} />
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            size="small"
                                            startIcon={<EditIcon />}
                                            onClick={() => handleOpenEditDialog(announcement)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="small"
                                            color="error"
                                            startIcon={<DeleteIcon />}
                                            onClick={() => {
                                                setSelectedAnnouncement(announcement);
                                                setDeleteDialogOpen(true);
                                            }}
                                        >
                                            Archive
                                        </Button>
                                    </Box>
                                </>
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

            {/* Create/Edit Form Dialog */}
            <Dialog open={formDialogOpen} onClose={handleCloseFormDialog} maxWidth="md" fullWidth>
                <DialogTitle>{editMode ? 'Edit Announcement' : 'Create Announcement'}</DialogTitle>
                <DialogContent dividers>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Stack spacing={3} sx={{ mt: 1 }}>
                            {/* Title */}
                            <TextField
                                fullWidth
                                label="Announcement Title"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                required
                                placeholder="Enter a descriptive title"
                            />

                            {/* Metadata Row */}
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Category"
                                    value={formData.category}
                                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as AnnouncementCategory }))}
                                >
                                    <MenuItem value="general">General</MenuItem>
                                    <MenuItem value="academic">Academic</MenuItem>
                                    <MenuItem value="exam">Exam</MenuItem>
                                    <MenuItem value="holiday">Holiday</MenuItem>
                                    <MenuItem value="event">Event</MenuItem>
                                    <MenuItem value="fee">Fee</MenuItem>
                                    <MenuItem value="emergency">Emergency</MenuItem>
                                </TextField>

                                <TextField
                                    select
                                    fullWidth
                                    label="Priority"
                                    value={formData.priority}
                                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as AnnouncementPriority }))}
                                >
                                    <MenuItem value="low">Low</MenuItem>
                                    <MenuItem value="normal">Normal</MenuItem>
                                    <MenuItem value="high">High</MenuItem>
                                    <MenuItem value="urgent">Urgent</MenuItem>
                                </TextField>

                                <Box sx={{ width: '100%' }}>
                                    <DatePicker
                                        label="Expiry Date (Optional)"
                                        value={formData.expiryDate}
                                        onChange={(date: Date | null) => setFormData(prev => ({ ...prev, expiryDate: date }))}
                                        slotProps={{
                                            textField: { fullWidth: true }
                                        }}
                                    />
                                </Box>
                            </Stack>

                            {/* Audience */}
                            <TextField
                                select
                                fullWidth
                                label="Target Audience"
                                value={formData.targetAudience}
                                onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value as AnnouncementTargetAudience }))}
                            >
                                <MenuItem value="specific_class">Specific Classes</MenuItem>
                            </TextField>

                            {formData.targetAudience === 'specific_class' && (
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                                    <Typography variant="subtitle2" gutterBottom color="primary">
                                        Select Target Classes *
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                        {classes.map((cls: any) => (
                                            <FormControlLabel
                                                key={cls.classId}
                                                control={
                                                    <Checkbox
                                                        size="small"
                                                        checked={formData.targetClasses.includes(cls.classId)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    targetClasses: [...prev.targetClasses, cls.classId]
                                                                }));
                                                            } else {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    targetClasses: prev.targetClasses.filter(id => id !== cls.classId)
                                                                }));
                                                            }
                                                        }}
                                                    />
                                                }
                                                label={
                                                    <Typography variant="body2">
                                                        {cls.name || 'Unknown Class'}
                                                    </Typography>
                                                }
                                            />
                                        ))}
                                    </Box>
                                </Paper>
                            )}

                            {/* Content */}
                            <TextField
                                fullWidth
                                multiline
                                rows={5}
                                label="Announcement Content"
                                value={formData.content}
                                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                required
                                placeholder="Write the full announcement message here..."
                            />

                            {/* File Upload */}
                            <FileUpload
                                folder={IMAGEKIT_FOLDERS.ANNOUNCEMENTS}
                                baseFileName={`announcement_${schoolId}`}
                                currentAttachments={formData.attachments}
                                onUploadSuccess={(attachments) => setFormData(prev => ({ ...prev, attachments }))}
                                label="Attachments"
                                maxFiles={5}
                            />
                        </Stack>
                    </LocalizationProvider>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={handleCloseFormDialog} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleFormSubmit}
                        disabled={createAnnouncement.isPending || updateAnnouncement.isPending}
                        sx={{ minWidth: 120 }}
                    >
                        {createAnnouncement.isPending || updateAnnouncement.isPending ? 'Saving...' : (editMode ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Announcements;
