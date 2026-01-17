import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { useChildSelector } from '../../context/ChildSelectorContext';
import { MyTimetable } from '../Student/Timetable';

// Parent Timetable reuses Student Timetable component but with selected child's data
const ParentTimetable: React.FC = () => {
    const { selectedChild, isLoading } = useChildSelector();

    if (!selectedChild && !isLoading) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info">Please select a child to view their timetable.</Alert>
            </Box>
        );
    }

    if (isLoading) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    // Render the student timetable component - it will fetch based on selected child
    return <MyTimetable />;
};

export default ParentTimetable;
