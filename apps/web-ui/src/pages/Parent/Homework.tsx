import React from 'react';
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
} from '@mui/material';
import {
    Assignment as AssignmentIcon,
    CalendarToday as CalendarIcon,
    AttachFile as AttachFileIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import { useChildSelector } from '../../context/ChildSelectorContext';
import { useGetHomeworkByStudent } from '../../queries/Homework';
import TokenService from '../../queries/token/tokenService';
import type { Homework } from '../../types';

const ParentHomework: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const { selectedChild, isLoading: loadingChild } = useChildSelector();

    const { data, isLoading, error } = useGetHomeworkByStudent(
        schoolId,
        selectedChild?.studentId || ''
    );

    const homework = data?.data || [];

    const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    if (!selectedChild && !loadingChild) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info">Please select a child to view their homework.</Alert>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load homework. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AssignmentIcon color="warning" />
                <Typography variant="h4" fontWeight={600}>
                    Homework
                </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                {selectedChild ? `${selectedChild.firstName}'s homework assignments` : 'Loading...'}
            </Typography>

            <Grid container spacing={2}>
                {isLoading || loadingChild ? (
                    [1, 2, 3].map((i) => (
                        <Grid size={{ xs: 12, md: 6 }} key={i}>
                            <Card>
                                <CardContent>
                                    <Skeleton variant="text" width="70%" height={30} />
                                    <Skeleton variant="text" width="40%" />
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
                                    No homework assigned
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    New homework assignments will appear here
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ) : (
                    homework.map((hw: Homework) => (
                        <Grid size={{ xs: 12, md: 6 }} key={hw.homeworkId}>
                            <Card
                                sx={{
                                    height: '100%',
                                    borderLeft: 4,
                                    borderColor: isOverdue(hw.dueDate) ? 'error.main' : 'primary.main',
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                                        <Typography variant="h6" fontWeight={600}>
                                            {hw.title}
                                        </Typography>
                                        {isOverdue(hw.dueDate) && (
                                            <Chip
                                                size="small"
                                                icon={<WarningIcon />}
                                                label="Overdue"
                                                color="error"
                                            />
                                        )}
                                    </Box>

                                    <Chip
                                        size="small"
                                        label={hw.subjectName || hw.subjectId}
                                        color="primary"
                                        variant="outlined"
                                        sx={{ mb: 2 }}
                                    />

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            mb: 2,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {hw.description}
                                    </Typography>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <CalendarIcon fontSize="small" color="action" />
                                            <Typography variant="caption" color="text.secondary">
                                                Due: {formatDate(hw.dueDate)}
                                            </Typography>
                                        </Box>

                                        {hw.attachmentUrl && (
                                            <Button
                                                size="small"
                                                startIcon={<AttachFileIcon />}
                                                href={hw.attachmentUrl}
                                                target="_blank"
                                            >
                                                Attachment
                                            </Button>
                                        )}
                                    </Box>

                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                        Assigned by: {hw.teacherName || 'Teacher'}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                )}
            </Grid>
        </Box>
    );
};

export default ParentHomework;
