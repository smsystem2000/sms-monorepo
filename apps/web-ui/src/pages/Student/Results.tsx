import { Box, Typography } from '@mui/material';

const StudentResults = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                My Results
            </Typography>
            <Typography variant="body1" color="text.secondary">
                View your exam results and grades.
            </Typography>
        </Box>
    );
};

export default StudentResults;
