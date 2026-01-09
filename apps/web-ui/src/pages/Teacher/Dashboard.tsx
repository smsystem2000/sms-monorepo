import { Box, Typography } from '@mui/material';

const TeacherDashboard = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Teacher Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
                Welcome to your dashboard. View your classes, students, and attendance.
            </Typography>
        </Box>
    );
};

export default TeacherDashboard;
