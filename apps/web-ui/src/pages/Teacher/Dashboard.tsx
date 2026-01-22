import React from 'react';
import { Box, Typography, Grid, CircularProgress, Alert } from '@mui/material';
import {
    Class as ClassIcon,
    People as StudentsIcon,
    Schedule as ScheduleIcon,
    Assessment as AttendanceIcon,
    Announcement as AnnouncementIcon,
    Person as ProfileIcon,
} from '@mui/icons-material';
import DashboardCard from '../../components/Dashboard/DashboardCard';
import TokenService from '../../queries/token/tokenService';
import { useGetTeacherDashboardStats } from '../../queries/TeacherDashboard';

const TeacherDashboard: React.FC = () => {
    const userName = TokenService.getUserName() || 'Teacher';
    const schoolId = TokenService.getSchoolId() || '';

    const { data, isLoading, error } = useGetTeacherDashboardStats(schoolId);
    const stats = data?.data;

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Welcome Header */}
            <Box sx={{ mb: 3 }}>
                <Typography
                    variant="h4"
                    fontWeight={600}
                    gutterBottom
                    color="#1e293b"
                    sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
                >
                    Welcome, {userName}!
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Here's your overview for today.
                </Typography>
            </Box>

            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    Failed to load dashboard stats. Please try again.
                </Alert>
            )}

            {/* Dashboard Grid */}
            <Grid container spacing={{ xs: 2, sm: 3 }}>
                {/* My Classes Card */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <DashboardCard
                        title="My Classes"
                        value={stats?.totalClasses || 0}
                        subtitle="Classes assigned to me"
                        icon={<ClassIcon sx={{ fontSize: 28 }} />}
                        color="#10b981"
                        bgColor="#ecfdf5"
                        to="/teacher/classes"
                    />
                </Grid>

                {/* My Students Card */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <DashboardCard
                        title="My Students"
                        value={stats?.totalStudents || 0}
                        subtitle="Total students across classes"
                        icon={<StudentsIcon sx={{ fontSize: 28 }} />}
                        color="#3b82f6"
                        bgColor="#eff6ff"
                        to="/teacher/students"
                    />
                </Grid>

                {/* Today's Schedule Card */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <DashboardCard
                        title="Today's Schedule"
                        value={stats?.periodsToday || 0}
                        subtitle="Periods scheduled today"
                        icon={<ScheduleIcon sx={{ fontSize: 28 }} />}
                        color="#8b5cf6"
                        bgColor="#f5f3ff"
                        to="/teacher/timetable"
                    />
                </Grid>

                {/* Pending Requests Card */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <DashboardCard
                        title="Pending Requests"
                        value={stats?.pendingLeaveRequests || 0}
                        subtitle="Leave requests to review"
                        icon={<AttendanceIcon sx={{ fontSize: 28 }} />}
                        color="#f59e0b"
                        bgColor="#fffbeb"
                        to="/teacher/leave/requests"
                    />
                </Grid>

                {/* My Announcements Card */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <DashboardCard
                        title="My Announcements"
                        value={stats?.totalAnnouncements || 0}
                        subtitle="Total announcements created"
                        icon={<AnnouncementIcon sx={{ fontSize: 28 }} />}
                        color="#ec4899"
                        bgColor="#fdf2f8"
                        to="/teacher/announcements"
                    />
                </Grid>

                {/* My Profile Card */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <DashboardCard
                        title="My Profile"
                        value={stats?.totalClasses || '-'}
                        subtitle="View and update profile"
                        icon={<ProfileIcon sx={{ fontSize: 28 }} />}
                        color="#06b6d4"
                        bgColor="#ecfeff"
                        to="/teacher/profile"
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default TeacherDashboard;
