import { Box, Typography, Card, CardContent, Grid, Avatar, Chip, LinearProgress, Button, Skeleton, Alert } from '@mui/material';
import {
    Person as PersonIcon,
    School as SchoolIcon,
    EventBusy as EventBusyIcon,
    Assignment as AssignmentIcon,
    Announcement as AnnouncementIcon,
    ArrowForward as ArrowForwardIcon,
    CheckCircle as CheckCircleIcon,
    AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import TokenService from '../../queries/token/tokenService';
import { useGetParentDashboard } from '../../queries/ParentPortal';
import { useGetAnnouncements } from '../../queries/Announcement';
import { useGetUpcomingHomework } from '../../queries/Homework';
import { useChildSelector } from '../../context/ChildSelectorContext';
import type { ChildStats, Announcement, Homework } from '../../types';

const ParentDashboard = () => {
    const navigate = useNavigate();
    const user = TokenService.getUser();
    const schoolId = TokenService.getSchoolId() || '';
    const { selectedChild } = useChildSelector();

    const { data: dashboardData, isLoading: loadingDashboard, error } = useGetParentDashboard(schoolId);
    const { data: announcementsData, isLoading: loadingAnnouncements } = useGetAnnouncements(schoolId, { limit: 3 });
    const { data: homeworkData, isLoading: loadingHomework } = useGetUpcomingHomework(
        schoolId,
        selectedChild?.studentId || '',
        5
    );

    const dashboard = dashboardData?.data;
    const announcements = announcementsData?.data || [];
    const upcomingHomework = homeworkData?.data || [];

    const getAttendanceColor = (percentage: number) => {
        if (percentage >= 90) return 'success';
        if (percentage >= 75) return 'warning';
        return 'error';
    };

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load dashboard data. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={600} gutterBottom>
                    Welcome, {dashboard?.parentName || `${user?.firstName} ${user?.lastName}`}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Here's an overview of your children's school activities
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Children Cards */}
                <Grid size={{ xs: 12 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon /> My Children
                    </Typography>
                </Grid>

                {loadingDashboard ? (
                    <>
                        {[1, 2].map((i) => (
                            <Grid size={{ xs: 12, md: 6 }} key={i}>
                                <Card sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <Skeleton variant="circular" width={60} height={60} />
                                            <Box sx={{ flex: 1 }}>
                                                <Skeleton variant="text" width="60%" height={30} />
                                                <Skeleton variant="text" width="40%" />
                                                <Skeleton variant="rectangular" height={8} sx={{ mt: 2, borderRadius: 1 }} />
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </>
                ) : (
                    dashboard?.children?.map((child: ChildStats) => (
                        <Grid size={{ xs: 12, md: 6 }} key={child.studentId}>
                            <Card
                                sx={{
                                    height: '100%',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        boxShadow: 6,
                                        transform: 'translateY(-2px)',
                                    }
                                }}
                                onClick={() => navigate(`/parent/children/${child.studentId}`)}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                        <Avatar
                                            src={child.profileImage}
                                            alt={child.name}
                                            sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}
                                        >
                                            {child.firstName?.[0]}
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="h6" fontWeight={600}>
                                                {child.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                Class {child.class} • {child.section} • Roll No: {child.rollNumber}
                                            </Typography>

                                            {/* Attendance Progress */}
                                            <Box sx={{ mb: 1 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Attendance (Last 30 days)
                                                    </Typography>
                                                    <Chip
                                                        size="small"
                                                        label={`${child.attendancePercentage}%`}
                                                        color={getAttendanceColor(child.attendancePercentage)}
                                                        sx={{ height: 20 }}
                                                    />
                                                </Box>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={child.attendancePercentage}
                                                    color={getAttendanceColor(child.attendancePercentage)}
                                                    sx={{ height: 6, borderRadius: 3 }}
                                                />
                                            </Box>

                                            {/* Quick Stats */}
                                            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                                <Chip
                                                    size="small"
                                                    icon={<CheckCircleIcon />}
                                                    label={`${child.presentDays}/${child.totalDays} Present`}
                                                    variant="outlined"
                                                    color="success"
                                                />
                                                {child.pendingLeaves > 0 && (
                                                    <Chip
                                                        size="small"
                                                        icon={<AccessTimeIcon />}
                                                        label={`${child.pendingLeaves} Leave Pending`}
                                                        variant="outlined"
                                                        color="warning"
                                                    />
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                )}

                {/* Recent Absences Alert */}
                {dashboard?.recentAbsences && dashboard.recentAbsences.length > 0 && (
                    <Grid size={{ xs: 12 }}>
                        <Alert
                            severity="warning"
                            icon={<EventBusyIcon />}
                            action={
                                <Button color="inherit" size="small" onClick={() => navigate('/parent/attendance')}>
                                    View Details
                                </Button>
                            }
                        >
                            <Typography fontWeight={500}>Recent Absences</Typography>
                            <Typography variant="body2">
                                {dashboard.recentAbsences.slice(0, 2).map((a, i) => (
                                    <span key={i}>
                                        {a.studentName} was absent on {new Date(a.date).toLocaleDateString()}
                                        {i < Math.min(dashboard.recentAbsences.length - 1, 1) ? ' • ' : ''}
                                    </span>
                                ))}
                            </Typography>
                        </Alert>
                    </Grid>
                )}

                {/* Upcoming Homework */}
                <Grid size={{ xs: 12, lg: 6 }}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AssignmentIcon color="warning" /> Upcoming Homework
                                </Typography>
                                <Button
                                    size="small"
                                    endIcon={<ArrowForwardIcon />}
                                    onClick={() => navigate('/parent/homework')}
                                >
                                    View All
                                </Button>
                            </Box>

                            {loadingHomework ? (
                                <Box>
                                    {[1, 2, 3].map((i) => (
                                        <Box key={i} sx={{ mb: 2 }}>
                                            <Skeleton variant="text" width="70%" />
                                            <Skeleton variant="text" width="40%" />
                                        </Box>
                                    ))}
                                </Box>
                            ) : upcomingHomework.length === 0 ? (
                                <Box sx={{ py: 3, textAlign: 'center' }}>
                                    <AssignmentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                    <Typography color="text.secondary">No pending homework</Typography>
                                </Box>
                            ) : (
                                upcomingHomework.slice(0, 4).map((hw: Homework) => (
                                    <Box
                                        key={hw.homeworkId}
                                        sx={{
                                            p: 1.5,
                                            mb: 1,
                                            borderRadius: 1,
                                            bgcolor: 'grey.50',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Box>
                                            <Typography variant="body2" fontWeight={500}>
                                                {hw.title}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {hw.subjectName}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            size="small"
                                            label={`Due: ${new Date(hw.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                                            color={new Date(hw.dueDate) < new Date() ? 'error' : 'default'}
                                        />
                                    </Box>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Announcements */}
                <Grid size={{ xs: 12, lg: 6 }}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AnnouncementIcon color="primary" /> Announcements
                                </Typography>
                                <Button
                                    size="small"
                                    endIcon={<ArrowForwardIcon />}
                                    onClick={() => navigate('/parent/announcements')}
                                >
                                    View All
                                </Button>
                            </Box>

                            {loadingAnnouncements ? (
                                <Box>
                                    {[1, 2, 3].map((i) => (
                                        <Box key={i} sx={{ mb: 2 }}>
                                            <Skeleton variant="text" width="80%" />
                                            <Skeleton variant="text" width="50%" />
                                        </Box>
                                    ))}
                                </Box>
                            ) : announcements.length === 0 ? (
                                <Box sx={{ py: 3, textAlign: 'center' }}>
                                    <AnnouncementIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                    <Typography color="text.secondary">No announcements</Typography>
                                </Box>
                            ) : (
                                announcements.slice(0, 4).map((ann: Announcement) => (
                                    <Box
                                        key={ann.announcementId}
                                        sx={{
                                            p: 1.5,
                                            mb: 1,
                                            borderRadius: 1,
                                            bgcolor: 'grey.50',
                                            borderLeft: 3,
                                            borderColor: ann.priority === 'urgent' ? 'error.main' :
                                                ann.priority === 'high' ? 'warning.main' : 'primary.main',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                            <Typography variant="body2" fontWeight={500}>
                                                {ann.title}
                                            </Typography>
                                            {ann.priority === 'urgent' && (
                                                <Chip size="small" label="Urgent" color="error" sx={{ height: 20 }} />
                                            )}
                                        </Box>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(ann.publishDate).toLocaleDateString()} • {ann.category}
                                        </Typography>
                                    </Box>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Quick Actions */}
                <Grid size={{ xs: 12 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                        Quick Actions
                    </Typography>
                    <Grid container spacing={2}>
                        {[
                            { label: 'View Attendance', icon: <EventBusyIcon />, path: '/parent/attendance', color: 'info.main' },
                            { label: 'View Timetable', icon: <SchoolIcon />, path: '/parent/timetable', color: 'success.main' },
                            { label: 'Apply Leave', icon: <AccessTimeIcon />, path: '/parent/leave/apply', color: 'warning.main' },
                            { label: 'View Teachers', icon: <PersonIcon />, path: '/parent/teachers', color: 'primary.main' },
                        ].map((action) => (
                            <Grid size={{ xs: 6, sm: 3 }} key={action.label}>
                                <Card
                                    sx={{
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            boxShadow: 4,
                                            transform: 'translateY(-2px)',
                                        }
                                    }}
                                    onClick={() => navigate(action.path)}
                                >
                                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                                        <Box sx={{ color: action.color, mb: 1 }}>
                                            {action.icon}
                                        </Box>
                                        <Typography variant="body2" fontWeight={500}>
                                            {action.label}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ParentDashboard;
