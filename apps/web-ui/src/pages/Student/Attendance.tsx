import { Box, Typography } from '@mui/material';

const StudentAttendance = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                My Attendance
            </Typography>
            <Typography variant="body1" color="text.secondary">
                View your attendance records.
            </Typography>
        </Box>
    );
};

export default StudentAttendance;
