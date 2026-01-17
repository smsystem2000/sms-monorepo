import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Avatar,
    Chip,
    Button,
    Skeleton,
    Alert,
} from '@mui/material';
import {
    ArrowForward as ArrowForwardIcon,
    School as SchoolIcon,
    Email as EmailIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetMyChildren } from '../../../queries/ParentPortal';
import TokenService from '../../../queries/token/tokenService';
import type { Student } from '../../../types';

const Children: React.FC = () => {
    const navigate = useNavigate();
    const schoolId = TokenService.getSchoolId() || '';

    const { data, isLoading, error } = useGetMyChildren(schoolId);
    const children = data?.data || [];

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load children data. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom>
                My Children
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                View and manage your children's profiles
            </Typography>

            <Grid container spacing={3}>
                {isLoading ? (
                    [1, 2].map((i) => (
                        <Grid size={{ xs: 12, md: 6 }} key={i}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Skeleton variant="circular" width={80} height={80} />
                                        <Box sx={{ flex: 1 }}>
                                            <Skeleton variant="text" width="60%" height={30} />
                                            <Skeleton variant="text" width="40%" />
                                            <Skeleton variant="text" width="80%" />
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                ) : children.length === 0 ? (
                    <Grid size={{ xs: 12 }}>
                        <Alert severity="info">No children linked to your account.</Alert>
                    </Grid>
                ) : (
                    children.map((child: Student & { className?: string; sectionName?: string }) => (
                        <Grid size={{ xs: 12, md: 6 }} key={child.studentId}>
                            <Card
                                sx={{
                                    height: '100%',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        boxShadow: 6,
                                    }
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', gap: 3 }}>
                                        <Avatar
                                            src={child.profileImage}
                                            alt={`${child.firstName} ${child.lastName}`}
                                            sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: 32 }}
                                        >
                                            {child.firstName?.[0]}
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="h5" fontWeight={600}>
                                                {child.firstName} {child.lastName}
                                            </Typography>
                                            <Chip
                                                icon={<SchoolIcon />}
                                                label={`${child.className || child.class} - ${child.sectionName || child.section}`}
                                                size="small"
                                                sx={{ mt: 0.5 }}
                                            />
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                Roll No: {child.rollNumber}
                                            </Typography>
                                            {child.email && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                    <EmailIcon fontSize="small" color="action" />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {child.email}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>

                                    <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            endIcon={<ArrowForwardIcon />}
                                            onClick={() => navigate(`/parent/children/${child.studentId}`)}
                                        >
                                            View Profile
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => navigate('/parent/attendance')}
                                        >
                                            Attendance
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => navigate('/parent/timetable')}
                                        >
                                            Timetable
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                )}
            </Grid>
        </Box>
    );
};

export default Children;
