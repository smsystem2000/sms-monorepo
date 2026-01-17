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
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
} from '@mui/material';
import {
    Add as AddIcon,
    Assignment as AssignmentIcon,
    CalendarToday as CalendarIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetTeacherHomework, useDeleteHomework } from '../../../queries/Homework';
import TokenService from '../../../queries/token/tokenService';
import type { Homework } from '../../../types';

const TeacherHomework: React.FC = () => {
    const navigate = useNavigate();
    const schoolId = TokenService.getSchoolId() || '';
    const teacherId = TokenService.getTeacherId() || '';

    const [tabValue, setTabValue] = useState(0);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

    const statusFilter = tabValue === 0 ? 'active' : tabValue === 1 ? 'completed' : undefined;

    const { data, isLoading, error, refetch } = useGetTeacherHomework(schoolId, teacherId, { status: statusFilter });
    const deleteHomework = useDeleteHomework(schoolId);

    const homework = data?.data || [];

    const handleDelete = async () => {
        if (selectedHomework) {
            await deleteHomework.mutateAsync(selectedHomework.homeworkId);
            setDeleteDialogOpen(false);
            setSelectedHomework(null);
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

    const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load homework. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AssignmentIcon color="primary" />
                        <Typography variant="h4" fontWeight={600}>
                            Homework Management
                        </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                        Create and manage homework assignments
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/teacher/homework/create')}
                >
                    Create Homework
                </Button>
            </Box>

            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
                <Tab label="Active" />
                <Tab label="Completed" />
                <Tab label="All" />
            </Tabs>

            <Grid container spacing={2}>
                {isLoading ? (
                    [1, 2, 3].map((i) => (
                        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={i}>
                            <Card>
                                <CardContent>
                                    <Skeleton variant="text" width="70%" height={30} />
                                    <Skeleton variant="text" width="50%" />
                                    <Skeleton variant="text" width="100%" />
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                ) : homework.length === 0 ? (
                    <Grid size={{ xs: 12 }}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center', py: 6 }}>
                                <AssignmentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">
                                    No homework found
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    sx={{ mt: 2 }}
                                    onClick={() => navigate('/teacher/homework/create')}
                                >
                                    Create First Homework
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ) : (
                    homework.map((hw: Homework) => (
                        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={hw.homeworkId}>
                            <Card
                                sx={{
                                    height: '100%',
                                    borderLeft: 4,
                                    borderColor: hw.status === 'cancelled' ? 'error.main' :
                                        isOverdue(hw.dueDate) ? 'warning.main' : 'success.main',
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                                        <Typography variant="h6" fontWeight={600} noWrap>
                                            {hw.title}
                                        </Typography>
                                        <Chip
                                            size="small"
                                            label={hw.status}
                                            color={hw.status === 'active' ? 'success' : hw.status === 'completed' ? 'primary' : 'error'}
                                        />
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                        <Chip size="small" label={hw.className || hw.classId} variant="outlined" />
                                        <Chip size="small" label={hw.subjectName || hw.subjectId} color="primary" variant="outlined" />
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
                                        {hw.description}
                                    </Typography>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                                        <CalendarIcon fontSize="small" color="action" />
                                        <Typography variant="body2" color="text.secondary">
                                            Due: {formatDate(hw.dueDate)}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            size="small"
                                            startIcon={<EditIcon />}
                                            onClick={() => navigate(`/teacher/homework/edit/${hw.homeworkId}`)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="small"
                                            color="error"
                                            startIcon={<DeleteIcon />}
                                            onClick={() => {
                                                setSelectedHomework(hw);
                                                setDeleteDialogOpen(true);
                                            }}
                                        >
                                            Delete
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
                <DialogTitle>Delete Homework</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete "{selectedHomework?.title}"? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={handleDelete}
                        disabled={deleteHomework.isPending}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TeacherHomework;
