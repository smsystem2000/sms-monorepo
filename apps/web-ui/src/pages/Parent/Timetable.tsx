import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { useChildSelector } from '../../context/ChildSelectorContext';
import { MyTimetable } from '../Student/Timetable';

// Parent Timetable reuses Student Timetable component but with selected child's data
const ParentTimetable: React.FC = () => {
    const { selectedChild, isLoading } = useChildSelector();

    // Show loading while children are being loaded
    if (isLoading) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography>Loading...</Typography>
            </Box>
        );
    }

    if (!selectedChild) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info">Please select a child to view their timetable.</Alert>
            </Box>
        );
    }

    // Render the student timetable component with child's class/section
    return <MyTimetable studentClassId={selectedChild.class} studentSectionId={selectedChild.section} />;
};

export default ParentTimetable;
