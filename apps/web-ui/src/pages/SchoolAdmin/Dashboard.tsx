import { Box, Typography, Grid, CircularProgress, Alert } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import EventNoteIcon from '@mui/icons-material/EventNote';
import DashboardCard from '../../components/Dashboard/DashboardCard';
import { useGetSchoolDashboardStats } from '../../queries/SchoolDashboard';
import { useGetLeaveStats } from '../../queries/Leave';
import TokenService from '../../queries/token/tokenService';

const SchoolAdminDashboard = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const { data, isLoading, error } = useGetSchoolDashboardStats(schoolId);
    const { data: leaveData } = useGetLeaveStats(schoolId);

    const stats = data?.data;
    const leaveStats = leaveData?.data;

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography
                variant="h4"
                gutterBottom
                fontWeight={600}
                color="#1e293b"
                sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
            >
                School Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Welcome to your School Dashboard. Manage teachers, students, and parents.
            </Typography>

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

            {stats && (
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DashboardCard
                            title="Teachers"
                            value={stats.totalTeachers}
                            subtitle={`${stats.activeTeachers} active`}
                            icon={<PeopleIcon sx={{ fontSize: 28 }} />}
                            color="#3b82f6"
                            bgColor="#eff6ff"
                            to="/school-admin/teachers"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DashboardCard
                            title="Students"
                            value={stats.totalStudents}
                            subtitle={`${stats.activeStudents} active`}
                            icon={<SchoolIcon sx={{ fontSize: 28 }} />}
                            color="#10b981"
                            bgColor="#ecfdf5"
                            to="/school-admin/students"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DashboardCard
                            title="Parents"
                            value={stats.totalParents}
                            subtitle={`${stats.activeParents} active`}
                            icon={<FamilyRestroomIcon sx={{ fontSize: 28 }} />}
                            color="#8b5cf6"
                            bgColor="#f5f3ff"
                            to="/school-admin/parents"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <DashboardCard
                            title="Leave Requests"
                            value={leaveStats?.totalPending || 0}
                            subtitle={`${leaveStats?.todayPending || 0} today`}
                            icon={<EventNoteIcon sx={{ fontSize: 28 }} />}
                            color="#f59e0b"
                            bgColor="#fffbeb"
                            to="/school-admin/leave"
                        />
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default SchoolAdminDashboard;
