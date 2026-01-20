import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    MenuItem,
    Alert,
    CircularProgress,
    Grid,
    FormControlLabel,
    Checkbox,
    Chip,
} from '@mui/material';
import {
    Add as AddIcon,
    ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateAnnouncement, useGetAnnouncementById, useUpdateAnnouncement } from '../../../queries/Announcement';
import { useGetClasses } from '../../../queries/Class';
import TokenService from '../../../queries/token/tokenService';
import FileUpload from '../../../components/FileUpload/FileUpload';
import { IMAGEKIT_FOLDERS } from '../../../utils/imagekit';
import type { CreateAnnouncementPayload, AnnouncementCategory, AnnouncementPriority, AnnouncementTargetAudience, AnnouncementAttachment } from '../../../types';

const categories: { value: AnnouncementCategory; label: string }[] = [
    { value: 'general', label: 'General' },
    { value: 'academic', label: 'Academic' },
    { value: 'exam', label: 'Exam' },
    { value: 'holiday', label: 'Holiday' },
    { value: 'event', label: 'Event' },
    { value: 'fee', label: 'Fee' },
    { value: 'emergency', label: 'Emergency' },
];

const priorities: { value: AnnouncementPriority; label: string }[] = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
];

const audiences: { value: AnnouncementTargetAudience; label: string }[] = [
    { value: 'all', label: 'Everyone' },
    { value: 'students', label: 'Students Only' },
    { value: 'teachers', label: 'Teachers Only' },
    { value: 'parents', label: 'Parents Only' },
    { value: 'specific_class', label: 'Specific Classes' },
];

// Custom styling for date pickers
const datePickerSlotProps = {
    textField: {
        fullWidth: true,
        variant: 'outlined' as const,
        sx: {
            '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: 'background.paper',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    backgroundColor: 'action.hover',
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                    },
                },
                '&.Mui-focused': {
                    backgroundColor: 'background.paper',
                    boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)',
                },
            },
            '& .MuiInputLabel-root': {
                fontWeight: 500,
            },
        },
    },
    actionBar: {
        actions: ['clear', 'today'] as ('clear' | 'today' | 'cancel' | 'accept')[],
    },
    popper: {
        sx: {
            '& .MuiPaper-root': {
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            },
            '& .MuiDayCalendar-weekDayLabel': {
                fontWeight: 600,
                color: 'primary.main',
            },
            '& .MuiPickersDay-root': {
                borderRadius: 2,
                '&:hover': {
                    backgroundColor: 'primary.light',
                },
                '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    '&:hover': {
                        backgroundColor: 'primary.dark',
                    },
                },
            },
        },
    },
};

const CreateAnnouncement: React.FC = () => {
    const navigate = useNavigate();
    const { announcementId } = useParams<{ announcementId: string }>();
    const schoolId = TokenService.getSchoolId() || '';
    const role = TokenService.getRole();
    const backPath = role === 'teacher' ? '/teacher/announcements' : '/school-admin/announcements';

    const isEditMode = !!announcementId;

    const { data: existingAnnouncement, isLoading: loadingAnnouncement } = useGetAnnouncementById(
        schoolId,
        announcementId || ''
    );

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
        targetAudience: 'all',
        targetClasses: [],
        attachments: [],
        publishDate: new Date(), // Default to now for create
        expiryDate: null,
    });
    const [publishNow, setPublishNow] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState(false);

    // Initialize form with existing data in edit mode
    React.useEffect(() => {
        if (isEditMode && existingAnnouncement?.data) {
            const announcement = existingAnnouncement.data;
            setFormData({
                title: announcement.title || '',
                content: announcement.content || '',
                category: announcement.category || 'general',
                priority: announcement.priority || 'normal',
                targetAudience: announcement.targetAudience || 'all',
                targetClasses: announcement.targetClasses || [],
                attachments: announcement.attachments || [],
                publishDate: announcement.publishDate ? new Date(announcement.publishDate) : new Date(),
                expiryDate: announcement.expiryDate ? new Date(announcement.expiryDate) : null,
            });
            setPublishNow(!announcement.publishDate || new Date(announcement.publishDate).getTime() <= new Date().getTime());
        }
    }, [isEditMode, existingAnnouncement]);

    const { data: classesData, isLoading: loadingClasses } = useGetClasses(schoolId);
    const createAnnouncement = useCreateAnnouncement(schoolId);
    const updateAnnouncement = useUpdateAnnouncement(schoolId);

    const classes = classesData?.data || [];

    const handleChange = (field: keyof CreateAnnouncementPayload) => (
        event: React.ChangeEvent<HTMLInputElement | { value: unknown }>
    ) => {
        setFormData(prev => ({ ...prev, [field]: event.target.value }));
        setErrors(prev => ({ ...prev, [field]: '' })); // Clear error for this field
    };

    const handleClassToggle = (classId: string) => {
        setFormData(prev => ({
            ...prev,
            targetClasses: prev.targetClasses?.includes(classId)
                ? prev.targetClasses.filter(id => id !== classId)
                : [...(prev.targetClasses || []), classId]
        }));
        setErrors(prev => ({ ...prev, targetClasses: '' })); // Clear error for targetClasses
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({}); // Clear previous errors

        // Validation
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.content.trim()) newErrors.content = 'Content is required';
        if (formData.targetAudience === 'specific_class' && (formData.targetClasses || []).length === 0) {
            newErrors.targetClasses = 'Please select at least one class';
        }
        if (!publishNow && !formData.publishDate) {
            newErrors.publishDate = 'Publish date is required if not publishing immediately';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            const payload: CreateAnnouncementPayload = {
                title: formData.title,
                content: formData.content,
                category: formData.category,
                priority: formData.priority,
                targetAudience: formData.targetAudience,
                targetClasses: formData.targetClasses,
                attachments: formData.attachments,
                publishDate: publishNow ? new Date().toISOString() : formData.publishDate ? formData.publishDate.toISOString() : undefined,
                expiryDate: formData.expiryDate ? formData.expiryDate.toISOString() : undefined,
            };

            if (isEditMode && announcementId) {
                await updateAnnouncement.mutateAsync({ announcementId, ...payload });
            } else {
                await createAnnouncement.mutateAsync(payload);
            }

            setSuccess(true);
            setTimeout(() => {
                navigate(backPath);
            }, 1500);
        } catch (err: unknown) {
            setErrors({ general: (err as Error)?.message || 'Failed to save announcement' });
        }
    };

    if (isEditMode && loadingAnnouncement) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(backPath)}
                    sx={{ mb: 2 }}
                >
                    Back to Announcements
                </Button>

                <Typography variant="h4" fontWeight={600} gutterBottom>
                    {isEditMode ? 'Edit Announcement' : 'Create Announcement'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    {isEditMode ? 'Edit the details of this announcement' : 'Create a new announcement for your school'}
                </Typography>

                {success && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        Announcement {isEditMode ? 'updated' : 'created'} successfully! Redirecting...
                    </Alert>
                )}

                {errors.general && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {errors.general}
                    </Alert>
                )}

                <Card>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Title *"
                                        value={formData.title}
                                        onChange={handleChange('title')}
                                        placeholder="Announcement title..."
                                        error={!!errors.title}
                                        helperText={errors.title}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Category"
                                        value={formData.category}
                                        onChange={handleChange('category')}
                                    >
                                        {categories.map((cat) => (
                                            <MenuItem key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Priority"
                                        value={formData.priority}
                                        onChange={handleChange('priority')}
                                    >
                                        {priorities.map((pri) => (
                                            <MenuItem key={pri.value} value={pri.value}>
                                                {pri.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Target Audience"
                                        value={formData.targetAudience}
                                        onChange={handleChange('targetAudience')}
                                    >
                                        {audiences.map((aud) => (
                                            <MenuItem key={aud.value} value={aud.value}>
                                                {aud.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                {formData.targetAudience === 'specific_class' && (
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" sx={{ mb: 1 }} color={errors.targetClasses ? 'error' : 'text.primary'}>
                                            Select Classes *
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', border: errors.targetClasses ? '1px solid red' : 'none', borderRadius: 1, p: errors.targetClasses ? 1 : 0 }}>
                                            {loadingClasses ? (
                                                <Typography variant="body2" color="text.secondary">Loading classes...</Typography>
                                            ) : (
                                                classes.map((cls: { classId: string; name: string }) => (
                                                    <Chip
                                                        key={cls.classId}
                                                        label={cls.name}
                                                        onClick={() => handleClassToggle(cls.classId)}
                                                        color={formData.targetClasses?.includes(cls.classId) ? 'primary' : 'default'}
                                                        variant={formData.targetClasses?.includes(cls.classId) ? 'filled' : 'outlined'}
                                                    />
                                                ))
                                            )}
                                        </Box>
                                        {errors.targetClasses && (
                                            <Typography variant="caption" color="error">
                                                {errors.targetClasses}
                                            </Typography>
                                        )}
                                    </Grid>
                                )}

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={6}
                                        label="Content *"
                                        value={formData.content}
                                        onChange={handleChange('content')}
                                        placeholder="Write your announcement content here..."
                                        error={!!errors.content}
                                        helperText={errors.content}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <FileUpload
                                        folder={IMAGEKIT_FOLDERS.ANNOUNCEMENTS}
                                        baseFileName={`announcement_${schoolId}`}
                                        currentAttachments={formData.attachments}
                                        onUploadSuccess={(attachments: AnnouncementAttachment[]) => {
                                            setFormData(prev => ({ ...prev, attachments }));
                                        }}
                                        label="Attachments (Optional)"
                                        authEndpoint="school"
                                        maxFiles={5}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={publishNow}
                                                onChange={(e) => {
                                                    setPublishNow(e.target.checked);
                                                    if (e.target.checked) {
                                                        setFormData(prev => ({ ...prev, publishDate: new Date() }));
                                                    } else {
                                                        setFormData(prev => ({ ...prev, publishDate: null }));
                                                    }
                                                    setErrors(prev => ({ ...prev, publishDate: '' }));
                                                }}
                                            />
                                        }
                                        label="Publish immediately"
                                    />
                                </Grid>

                                {!publishNow && (
                                    <Grid item xs={12} md={6}>
                                        <DatePicker
                                            label="Publish Date"
                                            value={formData.publishDate}
                                            onChange={(date: Date | null) => {
                                                setFormData(prev => ({ ...prev, publishDate: date }));
                                                setErrors(prev => ({ ...prev, publishDate: '' }));
                                            }}
                                            minDate={new Date()}
                                            slotProps={{
                                                ...datePickerSlotProps,
                                                textField: {
                                                    ...datePickerSlotProps.textField,
                                                    error: !!errors.publishDate,
                                                    helperText: errors.publishDate,
                                                },
                                            }}
                                        />
                                    </Grid>
                                )}

                                <Grid item xs={12} md={6}>
                                    <DatePicker
                                        label="Expiry Date (Optional)"
                                        value={formData.expiryDate}
                                        onChange={(date: Date | null) => setFormData(prev => ({ ...prev, expiryDate: date }))}
                                        minDate={new Date()}
                                        slotProps={datePickerSlotProps}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="outlined"
                                            onClick={() => navigate(backPath)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            size="large"
                                            startIcon={createAnnouncement.isPending || updateAnnouncement.isPending ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                                            disabled={createAnnouncement.isPending || updateAnnouncement.isPending}
                                        >
                                            {createAnnouncement.isPending || updateAnnouncement.isPending ? (
                                                'Saving...'
                                            ) : isEditMode ? (
                                                'Update Announcement'
                                            ) : (
                                                'Create Announcement'
                                            )}
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </form>
                    </CardContent>
                </Card>
            </Box>
        </LocalizationProvider>
    );
};

export default CreateAnnouncement;
