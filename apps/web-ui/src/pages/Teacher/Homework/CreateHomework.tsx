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
} from '@mui/material';
import {
    Add as AddIcon,
    ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useNavigate } from 'react-router-dom';
import { useCreateHomework } from '../../../queries/Homework';
import { useGetClasses } from '../../../queries/Class';
import { useGetSubjects } from '../../../queries/Subject';
import TokenService from '../../../queries/token/tokenService';
import type { CreateHomeworkPayload } from '../../../types';

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

const CreateHomework: React.FC = () => {
    const navigate = useNavigate();
    const schoolId = TokenService.getSchoolId() || '';

    const [formData, setFormData] = useState<Omit<CreateHomeworkPayload, 'dueDate'>>({
        classId: '',
        sectionId: '',
        subjectId: '',
        title: '',
        description: '',
        attachmentUrl: '',
    });
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const { data: classesData, isLoading: loadingClasses } = useGetClasses(schoolId);
    const { data: subjectsData, isLoading: loadingSubjects } = useGetSubjects(schoolId);
    const createHomework = useCreateHomework(schoolId);

    const classes = classesData?.data || [];
    const subjects = subjectsData?.data || [];

    const selectedClass = classes.find((c: { classId: string }) => c.classId === formData.classId);
    const sections = selectedClass?.sections || [];

    const handleChange = (field: keyof Omit<CreateHomeworkPayload, 'dueDate'>) => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setFormData(prev => ({ ...prev, [field]: event.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.classId || !formData.subjectId || !formData.title || !formData.description || !dueDate) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            await createHomework.mutateAsync({
                ...formData,
                dueDate: dueDate.toISOString(),
            });
            setSuccess(true);
            setTimeout(() => {
                navigate('/teacher/homework');
            }, 1500);
        } catch (err: unknown) {
            setError((err as Error)?.message || 'Failed to create homework');
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/teacher/homework')}
                    sx={{ mb: 2 }}
                >
                    Back to Homework
                </Button>

                <Typography variant="h4" fontWeight={600} gutterBottom>
                    Create Homework
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Assign homework to your class
                </Typography>

                {success && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        Homework created successfully! Redirecting...
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
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Class *"
                                        value={formData.classId}
                                        onChange={handleChange('classId')}
                                        disabled={loadingClasses}
                                    >
                                        {classes.map((cls: { classId: string; name: string }) => (
                                            <MenuItem key={cls.classId} value={cls.classId}>
                                                {cls.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Section (Optional)"
                                        value={formData.sectionId}
                                        onChange={handleChange('sectionId')}
                                        disabled={!formData.classId || sections.length === 0}
                                    >
                                        <MenuItem value="">All Sections</MenuItem>
                                        {sections.map((sec: { sectionId: string; name: string }) => (
                                            <MenuItem key={sec.sectionId} value={sec.sectionId}>
                                                {sec.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Subject *"
                                        value={formData.subjectId}
                                        onChange={handleChange('subjectId')}
                                        disabled={loadingSubjects}
                                    >
                                        {subjects.map((sub: { subjectId: string; name: string }) => (
                                            <MenuItem key={sub.subjectId} value={sub.subjectId}>
                                                {sub.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <DatePicker
                                        label="Due Date *"
                                        value={dueDate}
                                        onChange={(date: Date | null) => setDueDate(date)}
                                        minDate={new Date()}
                                        slotProps={datePickerSlotProps}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        label="Title *"
                                        value={formData.title}
                                        onChange={handleChange('title')}
                                        placeholder="e.g., Chapter 5 Exercise Questions"
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={4}
                                        label="Description *"
                                        value={formData.description}
                                        onChange={handleChange('description')}
                                        placeholder="Describe the homework assignment in detail..."
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        label="Attachment URL (Optional)"
                                        value={formData.attachmentUrl}
                                        onChange={handleChange('attachmentUrl')}
                                        placeholder="https://..."
                                        helperText="Link to any reference material or worksheet"
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="outlined"
                                            onClick={() => navigate('/teacher/homework')}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            startIcon={createHomework.isPending ? <CircularProgress size={20} /> : <AddIcon />}
                                            disabled={createHomework.isPending}
                                        >
                                            Create Homework
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

export default CreateHomework;
