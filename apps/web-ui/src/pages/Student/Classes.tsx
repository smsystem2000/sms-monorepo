import { Box, Typography } from '@mui/material';

const StudentClasses = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                My Classes
            </Typography>
            <Typography variant="body1" color="text.secondary">
                View your enrolled classes.
            </Typography>
        </Box>
    );
};

export default StudentClasses;
