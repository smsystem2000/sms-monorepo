import { Box, Typography } from '@mui/material';

const TeacherClasses = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                My Classes
            </Typography>
            <Typography variant="body1" color="text.secondary">
                View and manage your assigned classes.
            </Typography>
        </Box>
    );
};

export default TeacherClasses;
