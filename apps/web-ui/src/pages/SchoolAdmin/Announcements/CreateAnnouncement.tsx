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
import { useNavigate } from 'react-router-dom';
import { useCreateAnnouncement } from '../../../queries/Announcement';
import { useGetClasses } from '../../../queries/Class';
import TokenService from '../../../queries/token/tokenService';
import type { CreateAnnouncementPayload, AnnouncementCategory, AnnouncementPriority, AnnouncementTargetAudience } from '../../../types';

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
        actions: ['clear', 'today'] as const,
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
    const schoolId = TokenService.getSchoolId() || '';
    const role = TokenService.getRole();
    const backPath = role === 'teacher' ? '/teacher/announcements' : '/school-admin/announcements';

    const [formData, setFormData] = useState<CreateAnnouncementPayload>({
        title: '',
        content: '',
        category: 'general',
        priority: 'normal',
        targetAudience: 'all',
        targetClasses: [],
        attachmentUrl: '',
    });
    const [publishNow, setPublishNow] = useState(true);
    const [publishDate, setPublishDate] = useState<Date | null>(null);
    const [expiryDate, setExpiryDate] = useState<Date | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const { data: classesData, isLoading: loadingClasses } = useGetClasses(schoolId);
    const createAnnouncement = useCreateAnnouncement(schoolId);

    const classes = classesData?.data || [];

    const handleChange = (field: keyof CreateAnnouncementPayload) => (
        event: React.ChangeEvent<HTMLInputElement | { value: unknown }>
    ) => {
        setFormData(prev => ({ ...prev, [field]: event.target.value }));
    };

    const handleClassToggle = (classId: string) => {
        setFormData(prev => ({
            ...prev,
            targetClasses: prev.targetClasses?.includes(classId)
                ? prev.targetClasses.filter(id => id !== classId)
                : [...(prev.targetClasses || []), classId]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.title || !formData.content) {
            setError('Please fill in title and content');
            return;
        }

        if (formData.targetAudience === 'specific_class' && (!formData.targetClasses || formData.targetClasses.length === 0)) {
            setError('Please select at least one class');
            return;
        }

        try {
            await createAnnouncement.mutateAsync({
                ...formData,
                publishDate: publishNow ? new Date().toISOString() : publishDate ? publishDate.toISOString() : undefined,
                expiryDate: expiryDate ? expiryDate.toISOString() : undefined,
            });
            setSuccess(true);
            setTimeout(() => {
                navigate(backPath);
            }, 1500);
        } catch (err: unknown) {
            setError((err as Error)?.message || 'Failed to create announcement');
        }
    };

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
                    Create Announcement
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Create a new announcement for your school
                </Typography>

                {success && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        Announcement created successfully! Redirecting...
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Card>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        label="Title *"
                                        value={formData.title}
                                        onChange={handleChange('title')}
                                        placeholder="Announcement title..."
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
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

                                <Grid size={{ xs: 12, md: 6 }}>
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

                                <Grid size={{ xs: 12 }}>
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
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                            Select Classes *
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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
                                    </Grid>
                                )}

                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={6}
                                        label="Content *"
                                        value={formData.content}
                                        onChange={handleChange('content')}
                                        placeholder="Write your announcement content here..."
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        label="Attachment URL (Optional)"
                                        value={formData.attachmentUrl}
                                        onChange={handleChange('attachmentUrl')}
                                        placeholder="https://..."
                                        helperText="Link to any attachment or circular document"
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={publishNow}
                                                onChange={(e) => setPublishNow(e.target.checked)}
                                            />
                                        }
                                        label="Publish immediately"
                                    />
                                </Grid>

                                {!publishNow && (
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <DatePicker
                                            label="Publish Date"
                                            value={publishDate}
                                            onChange={(date: Date | null) => setPublishDate(date)}
                                            minDate={new Date()}
                                            slotProps={datePickerSlotProps}
                                        />
                                    </Grid>
                                )}

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <DatePicker
                                        label="Expiry Date (Optional)"
                                        value={expiryDate}
                                        onChange={(date: Date | null) => setExpiryDate(date)}
                                        minDate={new Date()}
                                        slotProps={datePickerSlotProps}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
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
                                            startIcon={createAnnouncement.isPending ? <CircularProgress size={20} /> : <AddIcon />}
                                            disabled={createAnnouncement.isPending}
                                        >
                                            Create Announcement
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
