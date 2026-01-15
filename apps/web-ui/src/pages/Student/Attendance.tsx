import { Box, Typography, Paper, Grid, Card, CardContent, Button, CircularProgress, Chip, LinearProgress, Skeleton } from '@mui/material';
import {
    CheckCircle as PresentIcon,
    Cancel as AbsentIcon,
    Schedule as LateIcon,
    TrendingUp as TrendingUpIcon,
    History as HistoryIcon,
    CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetSimpleStudentAttendance } from '../../queries/Attendance';
import TokenService from '../../queries/token/tokenService';

const StudentAttendance = () => {
    const navigate = useNavigate();
    const schoolId = TokenService.getSchoolId() || '';
    const studentId = TokenService.getStudentId() || '';

    // Get last 30 days of attendance
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data, isLoading, error } = useGetSimpleStudentAttendance(
        schoolId,
        studentId,
        startDate,
        endDate
    );

    const summary = data?.data?.summary;
    const attendance = data?.data?.attendance || [];

    // Calculate attendance percentage
    const totalDays = summary?.total || 0;
    const presentDays = (summary?.present || 0) + (summary?.late || 0);
    const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;

    // Get last 7 days attendance for mini chart
    const last7Days = attendance.slice(0, 7).reverse();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'present': return '#10b981';
            case 'absent': return '#ef4444';
            case 'late': return '#f59e0b';
            case 'half_day': return '#3b82f6';
            case 'leave': return '#6b7280';
            default: return '#d1d5db';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'present': return 'P';
            case 'absent': return 'A';
            case 'late': return 'L';
            case 'half_day': return 'H';
            case 'leave': return 'LV';
            default: return '-';
        }
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography
                        variant="h4"
                        fontWeight={600}
                        color="#1e293b"
                        sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
                    >
                        My Attendance
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Track your attendance records and statistics
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<HistoryIcon />}
                    onClick={() => navigate('/student/attendance/history')}
                    sx={{
                        bgcolor: '#3b82f6',
                        '&:hover': { bgcolor: '#2563eb' },
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                    }}
                >
                    View Full History
                </Button>
            </Box>

            {isLoading && (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Skeleton variant="rounded" height={280} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Skeleton variant="rounded" height={280} />
                    </Grid>
                </Grid>
            )}

            {error && (
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#fef2f2', border: '1px solid #fecaca' }}>
                    <Typography color="error">Failed to load attendance data. Please try again.</Typography>
                </Paper>
            )}

            {!isLoading && !error && (
                <Grid container spacing={3}>
                    {/* Main Attendance Card */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                height: '100%',
                                minHeight: 320,
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <Box sx={{
                                position: 'absolute',
                                top: -50,
                                right: -50,
                                width: 150,
                                height: 150,
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.1)'
                            }} />

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <TrendingUpIcon />
                                <Typography variant="h6" fontWeight={600}>Attendance Rate</Typography>
                            </Box>

                            {/* Circular Progress */}
                            <Box sx={{ display: 'flex', justifyContent: 'center', flex: 1, alignItems: 'center' }}>
                                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                    <CircularProgress
                                        variant="determinate"
                                        value={Number(percentage)}
                                        size={150}
                                        thickness={4}
                                        sx={{
                                            color: 'rgba(255,255,255,0.9)',
                                            '& .MuiCircularProgress-circle': {
                                                strokeLinecap: 'round',
                                            },
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            bottom: 0,
                                            right: 0,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Typography variant="h4" fontWeight={700}>
                                            {percentage}%
                                        </Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                            Last 30 Days
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>

                            {/* Stats Summary */}
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                                <Chip
                                    icon={<PresentIcon sx={{ color: 'white !important', fontSize: 16 }} />}
                                    label={`${presentDays} Present`}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
                                />
                                <Chip
                                    icon={<AbsentIcon sx={{ color: 'white !important', fontSize: 16 }} />}
                                    label={`${summary?.absent || 0} Absent`}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
                                />
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Right Side Content */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        {/* Stats Cards */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <Card sx={{ borderRadius: 2, bgcolor: '#ecfdf5', border: '1px solid #a7f3d0', height: '100%' }}>
                                    <CardContent sx={{ textAlign: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                                        <PresentIcon sx={{ fontSize: 32, color: '#10b981', mb: 0.5 }} />
                                        <Typography variant="h5" fontWeight={700} color="#10b981">
                                            {summary?.present || 0}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">Present</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <Card sx={{ borderRadius: 2, bgcolor: '#fef2f2', border: '1px solid #fecaca', height: '100%' }}>
                                    <CardContent sx={{ textAlign: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                                        <AbsentIcon sx={{ fontSize: 32, color: '#ef4444', mb: 0.5 }} />
                                        <Typography variant="h5" fontWeight={700} color="#ef4444">
                                            {summary?.absent || 0}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">Absent</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <Card sx={{ borderRadius: 2, bgcolor: '#fffbeb', border: '1px solid #fde68a', height: '100%' }}>
                                    <CardContent sx={{ textAlign: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                                        <LateIcon sx={{ fontSize: 32, color: '#f59e0b', mb: 0.5 }} />
                                        <Typography variant="h5" fontWeight={700} color="#f59e0b">
                                            {summary?.late || 0}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">Late</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <Card sx={{ borderRadius: 2, bgcolor: '#f3f4f6', border: '1px solid #d1d5db', height: '100%' }}>
                                    <CardContent sx={{ textAlign: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                                        <CalendarIcon sx={{ fontSize: 32, color: '#6b7280', mb: 0.5 }} />
                                        <Typography variant="h5" fontWeight={700} color="#6b7280">
                                            {summary?.leave || 0}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">Leave</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* Last 7 Days */}
                        <Card sx={{ borderRadius: 2, mb: 2 }}>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
                                    Last 7 Days
                                </Typography>
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(7, 1fr)',
                                    gap: 1
                                }}>
                                    {last7Days.length > 0 ? last7Days.map((day: { date: string; status: string }, idx: number) => (
                                        <Box
                                            key={idx}
                                            sx={{
                                                textAlign: 'center',
                                                p: 1,
                                                borderRadius: 2,
                                                bgcolor: `${getStatusColor(day.status)}15`,
                                                border: `2px solid ${getStatusColor(day.status)}`,
                                                minWidth: 0,
                                            }}
                                        >
                                            <Typography variant="caption" color="text.secondary" display="block" noWrap>
                                                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                            </Typography>
                                            <Typography
                                                variant="h6"
                                                fontWeight={700}
                                                sx={{ color: getStatusColor(day.status), lineHeight: 1.2 }}
                                            >
                                                {getStatusLabel(day.status)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(day.date).getDate()}
                                            </Typography>
                                        </Box>
                                    )) : (
                                        Array.from({ length: 7 }).map((_, idx) => (
                                            <Box
                                                key={idx}
                                                sx={{
                                                    textAlign: 'center',
                                                    p: 1,
                                                    borderRadius: 2,
                                                    bgcolor: '#f3f4f6',
                                                    border: '2px solid #d1d5db',
                                                }}
                                            >
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    -
                                                </Typography>
                                                <Typography variant="h6" fontWeight={700} color="text.disabled">
                                                    -
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    -
                                                </Typography>
                                            </Box>
                                        ))
                                    )}
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Progress Bar */}
                        <Card sx={{ borderRadius: 2 }}>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Overall Attendance Progress
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {presentDays}/{totalDays} days
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={Number(percentage)}
                                    sx={{
                                        height: 10,
                                        borderRadius: 5,
                                        bgcolor: '#e5e7eb',
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 5,
                                            bgcolor: Number(percentage) >= 75 ? '#10b981' :
                                                Number(percentage) >= 50 ? '#f59e0b' : '#ef4444',
                                        },
                                    }}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default StudentAttendance;
