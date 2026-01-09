import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import {
    School as ClassIcon,
    Assessment as ResultsIcon,
    EventNote as AttendanceIcon,
} from '@mui/icons-material';
import AttendanceWidget from './components/AttendanceWidget';
import TokenService from '../../queries/token/tokenService';

const StudentDashboard: React.FC = () => {
    const userName = TokenService.getUserName() || 'Student';

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Welcome Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight={600} gutterBottom>
                    Welcome, {userName}!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Here's your academic overview for today.
                </Typography>
            </Box>

            {/* Dashboard Grid */}
            <Grid container spacing={3}>
                {/* Attendance Widget */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <AttendanceWidget />
                </Grid>

                {/* Quick Stats */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Paper
                        sx={{
                            p: 3,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            bgcolor: 'primary.50',
                            border: '1px solid',
                            borderColor: 'primary.200',
                        }}
                    >
                        <ClassIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6" fontWeight={600}>
                            My Classes
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            View your class schedule and subjects
                        </Typography>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Paper
                        sx={{
                            p: 3,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            bgcolor: 'success.50',
                            border: '1px solid',
                            borderColor: 'success.200',
                        }}
                    >
                        <ResultsIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                        <Typography variant="h6" fontWeight={600}>
                            My Results
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Check your exam scores and grades
                        </Typography>
                    </Paper>
                </Grid>

                {/* Leave Requests Section - Coming Soon */}
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Paper
                        sx={{
                            p: 3,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            bgcolor: 'warning.50',
                            border: '1px solid',
                            borderColor: 'warning.200',
                        }}
                    >
                        <AttendanceIcon sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                        <Typography variant="h6" fontWeight={600}>
                            Leave Requests
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Apply for leave and track status
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default StudentDashboard;
