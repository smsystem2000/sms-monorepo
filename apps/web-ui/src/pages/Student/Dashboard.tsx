import React from 'react';
import { Box, Typography, Grid, CircularProgress, Alert } from '@mui/material';
import {
    School as ClassIcon,
    Assessment as ResultsIcon,
    EventNote as LeaveIcon,
    CheckCircle as AttendanceIcon,
    Schedule as TimetableIcon,
    Help as RequestIcon,
} from '@mui/icons-material';
import DashboardCard from '../../components/Dashboard/DashboardCard';
import TokenService from '../../queries/token/tokenService';
import { useGetSimpleStudentAttendance } from '../../queries/Attendance';

const StudentDashboard: React.FC = () => {
    const userName = TokenService.getUserName() || 'Student';
    const schoolId = TokenService.getSchoolId() || '';
    const studentId = TokenService.getStudentId() || '';

    // Get last 30 days of attendance
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: attendanceData, isLoading, error } = useGetSimpleStudentAttendance(
        schoolId,
        studentId,
        startDate,
        endDate
    );

    const summary = attendanceData?.data?.summary;
    const totalDays = summary?.total || 0;
    const presentDays = (summary?.present || 0) + (summary?.late || 0);
    const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(0) : 0;

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
                    Here's your academic overview for today.
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
                {/* Attendance Card */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <DashboardCard
                        title="My Attendance"
                        value={`${percentage}%`}
                        subtitle={`${presentDays} of ${totalDays} days present`}
                        icon={<AttendanceIcon sx={{ fontSize: 28 }} />}
                        color="#10b981"
                        bgColor="#ecfdf5"
                        to="/student/attendance"
                    />
                </Grid>

                {/* Timetable Card */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <DashboardCard
                        title="Timetable"
                        value={summary?.total || '-'}
                        subtitle="School days this month"
                        icon={<TimetableIcon sx={{ fontSize: 28 }} />}
                        color="#3b82f6"
                        bgColor="#eff6ff"
                        to="/student/timetable"
                    />
                </Grid>

                {/* Exams Card */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <DashboardCard
                        title="My Exams"
                        value={summary?.absent || 0}
                        subtitle="Days absent this month"
                        icon={<ResultsIcon sx={{ fontSize: 28 }} />}
                        color="#8b5cf6"
                        bgColor="#f5f3ff"
                        to="/student/exam/my-exams"
                    />
                </Grid>

                {/* Leave Requests Card */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <DashboardCard
                        title="Leave Requests"
                        value={summary?.leave || 0}
                        subtitle="Days on leave"
                        icon={<LeaveIcon sx={{ fontSize: 28 }} />}
                        color="#f59e0b"
                        bgColor="#fffbeb"
                        to="/student/leave/apply"
                    />
                </Grid>

                {/* My Requests Card */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <DashboardCard
                        title="My Requests"
                        value={summary?.late || 0}
                        subtitle="Days late this month"
                        icon={<RequestIcon sx={{ fontSize: 28 }} />}
                        color="#ec4899"
                        bgColor="#fdf2f8"
                        to="/student/my-requests"
                    />
                </Grid>

                {/* My Profile Card */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <DashboardCard
                        title="My Profile"
                        value={presentDays}
                        subtitle="Days present this month"
                        icon={<ClassIcon sx={{ fontSize: 28 }} />}
                        color="#06b6d4"
                        bgColor="#ecfeff"
                        to="/student/profile"
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default StudentDashboard;
