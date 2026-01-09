import { Box, Typography, Grid, CircularProgress, Alert } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import DashboardCard from '../../components/Dashboard/DashboardCard';
import { useGetDashboardStats } from '../../queries/Dashboard';

const SuperAdminDashboard = () => {
    const { data, isLoading, error } = useGetDashboardStats();

    const stats = data?.data;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom fontWeight={600} color="#1e293b">
                Super Admin Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Welcome to the Super Admin Dashboard. Manage schools and administrators from here.
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
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <DashboardCard
                            title="Total Schools"
                            value={stats.totalSchools}
                            subtitle={`${stats.activeSchools} active`}
                            icon={<SchoolIcon sx={{ fontSize: 28 }} />}
                            color="#3b82f6"
                            bgColor="#eff6ff"
                            to="/super-admin/schools"
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <DashboardCard
                            title="School Administrators"
                            value={stats.totalUsers}
                            subtitle={`${stats.activeUsers} active`}
                            icon={<PeopleIcon sx={{ fontSize: 28 }} />}
                            color="#8b5cf6"
                            bgColor="#f5f3ff"
                            to="/super-admin/users"
                        />
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default SuperAdminDashboard;
