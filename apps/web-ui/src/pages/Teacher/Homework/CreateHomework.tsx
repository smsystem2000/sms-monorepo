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
import { useNavigate } from 'react-router-dom';
import { useCreateHomework } from '../../../queries/Homework';
import { useGetClasses } from '../../../queries/Class';
import { useGetSubjects } from '../../../queries/Subject';
import TokenService from '../../../queries/token/tokenService';
import type { CreateHomeworkPayload } from '../../../types';

const CreateHomework: React.FC = () => {
    const navigate = useNavigate();
    const schoolId = TokenService.getSchoolId() || '';

    const [formData, setFormData] = useState<CreateHomeworkPayload>({
        classId: '',
        sectionId: '',
        subjectId: '',
        title: '',
        description: '',
        dueDate: '',
        attachmentUrl: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const { data: classesData, isLoading: loadingClasses } = useGetClasses(schoolId);
    const { data: subjectsData, isLoading: loadingSubjects } = useGetSubjects(schoolId);
    const createHomework = useCreateHomework(schoolId);

    const classes = classesData?.data || [];
    const subjects = subjectsData?.data || [];

    const selectedClass = classes.find((c: { classId: string }) => c.classId === formData.classId);
    const sections = selectedClass?.sections || [];

    const handleChange = (field: keyof CreateHomeworkPayload) => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setFormData(prev => ({ ...prev, [field]: event.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.classId || !formData.subjectId || !formData.title || !formData.description || !formData.dueDate) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            await createHomework.mutateAsync({
                ...formData,
                dueDate: new Date(formData.dueDate).toISOString(),
            });
            setSuccess(true);
            setTimeout(() => {
                navigate('/teacher/homework');
            }, 1500);
        } catch (err: unknown) {
            setError((err as Error)?.message || 'Failed to create homework');
        }
    };

    // Get today's date in YYYY-MM-DD format for min date
    const today = new Date().toISOString().split('T')[0];

    return (
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
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Due Date *"
                                    value={formData.dueDate}
                                    onChange={handleChange('dueDate')}
                                    slotProps={{
                                        inputLabel: { shrink: true },
                                        htmlInput: { min: today }
                                    }}
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
    );
};

export default CreateHomework;
