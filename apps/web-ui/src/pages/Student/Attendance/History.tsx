import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Alert,
    ToggleButton,
    ToggleButtonGroup,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import {
    CalendarMonth as CalendarIcon,
    ViewList as ListIcon,
    CheckCircle as PresentIcon,
    Cancel as AbsentIcon,
    Schedule as LateIcon,
} from '@mui/icons-material';
import { useGetSimpleStudentAttendance } from '../../../queries/Attendance';
import TokenService from '../../../queries/token/tokenService';

type ViewMode = 'calendar' | 'list';

const AttendanceHistory: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('calendar');
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const schoolId = TokenService.getSchoolId() || '';
    const studentId = TokenService.getStudentId() || '';

    // Get attendance for the selected month
    const [year, month] = selectedMonth.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data, isLoading, error } = useGetSimpleStudentAttendance(
        schoolId,
        studentId,
        startDate,
        endDate
    );

    const attendance = data?.data?.attendance || [];
    const summary = data?.data?.summary;

    // Create a map of date -> status for calendar view
    const attendanceMap = useMemo(() => {
        const map: Record<string, string> = {};
        attendance.forEach((a) => {
            const dateStr = new Date(a.date).toISOString().split('T')[0];
            map[dateStr] = a.status;
        });
        return map;
    }, [attendance]);

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const daysInMonth = new Date(year, month, 0).getDate();
        const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
        const days: { date: number | null; dateStr: string; status?: string }[] = [];

        // Empty cells for days before first day of month
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push({ date: null, dateStr: '' });
        }

        // Actual days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push({
                date: d,
                dateStr,
                status: attendanceMap[dateStr],
            });
        }

        return days;
    }, [year, month, attendanceMap]);

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'present': return { bg: '#4caf50', color: 'white' };
            case 'absent': return { bg: '#f44336', color: 'white' };
            case 'late': return { bg: '#ff9800', color: 'white' };
            case 'half_day': return { bg: '#2196f3', color: 'white' };
            case 'leave': return { bg: '#9e9e9e', color: 'white' };
            default: return { bg: 'transparent', color: 'inherit' };
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'present': return <PresentIcon fontSize="small" color="success" />;
            case 'absent': return <AbsentIcon fontSize="small" color="error" />;
            case 'late': return <LateIcon fontSize="small" color="warning" />;
            default: return null;
        }
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const percentage = summary?.total
        ? (((summary.present || 0) + (summary.late || 0)) / summary.total * 100).toFixed(1)
        : 0;

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
                Attendance History
            </Typography>

            {/* Month Selector & View Toggle */}
            <Paper sx={{ p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        max={new Date().toISOString().slice(0, 7)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: 4,
                            border: '1px solid #ccc',
                            fontSize: 14,
                        }}
                    />
                </Box>
                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(_, val) => val && setViewMode(val)}
                    size="small"
                >
                    <ToggleButton value="calendar">
                        <CalendarIcon sx={{ mr: 0.5 }} /> Calendar
                    </ToggleButton>
                    <ToggleButton value="list">
                        <ListIcon sx={{ mr: 0.5 }} /> List
                    </ToggleButton>
                </ToggleButtonGroup>
            </Paper>

            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Card sx={{ textAlign: 'center', bgcolor: 'success.50' }}>
                        <CardContent>
                            <Typography variant="h4" fontWeight={600} color="success.main">
                                {summary?.present || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">Present</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Card sx={{ textAlign: 'center', bgcolor: 'error.50' }}>
                        <CardContent>
                            <Typography variant="h4" fontWeight={600} color="error.main">
                                {summary?.absent || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">Absent</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Card sx={{ textAlign: 'center', bgcolor: 'warning.50' }}>
                        <CardContent>
                            <Typography variant="h4" fontWeight={600} color="warning.main">
                                {summary?.late || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">Late</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Card sx={{ textAlign: 'center', bgcolor: 'primary.50' }}>
                        <CardContent>
                            <Typography variant="h4" fontWeight={600} color="primary.main">
                                {percentage}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">Attendance</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Main Content */}
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error">Failed to load attendance data</Alert>
            ) : viewMode === 'calendar' ? (
                /* Calendar View */
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                        {monthNames[month - 1]} {year}
                    </Typography>

                    {/* Days of week header */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 1 }}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <Box key={day} sx={{ textAlign: 'center', fontWeight: 600, color: 'text.secondary', py: 1 }}>
                                {day}
                            </Box>
                        ))}
                    </Box>

                    {/* Calendar grid */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                        {calendarDays.map((day, idx) => {
                            const colors = getStatusColor(day.status);
                            return (
                                <Box
                                    key={idx}
                                    sx={{
                                        aspectRatio: '1',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 1,
                                        bgcolor: colors.bg,
                                        color: colors.color,
                                        border: day.date ? '1px solid' : 'none',
                                        borderColor: 'divider',
                                        fontWeight: day.status ? 600 : 400,
                                        cursor: day.status ? 'pointer' : 'default',
                                    }}
                                    title={day.status ? `${day.dateStr}: ${day.status}` : ''}
                                >
                                    {day.date}
                                </Box>
                            );
                        })}
                    </Box>

                    {/* Legend */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                        <Chip label="Present" size="small" sx={{ bgcolor: '#4caf50', color: 'white' }} />
                        <Chip label="Absent" size="small" sx={{ bgcolor: '#f44336', color: 'white' }} />
                        <Chip label="Late" size="small" sx={{ bgcolor: '#ff9800', color: 'white' }} />
                        <Chip label="Half Day" size="small" sx={{ bgcolor: '#2196f3', color: 'white' }} />
                        <Chip label="Leave" size="small" sx={{ bgcolor: '#9e9e9e', color: 'white' }} />
                    </Box>
                </Paper>
            ) : (
                /* List View */
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Day</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Remarks</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {attendance.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        No attendance records for this month
                                    </TableCell>
                                </TableRow>
                            ) : (
                                attendance.map((record) => {
                                    const date = new Date(record.date);
                                    return (
                                        <TableRow key={record.attendanceId} hover>
                                            <TableCell>{date.toLocaleDateString()}</TableCell>
                                            <TableCell>{date.toLocaleDateString('en', { weekday: 'short' })}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {getStatusIcon(record.status)}
                                                    <Chip
                                                        label={record.status}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: getStatusColor(record.status).bg,
                                                            color: 'white',
                                                            textTransform: 'capitalize',
                                                        }}
                                                    />
                                                </Box>
                                            </TableCell>
                                            <TableCell>{record.remarks || '-'}</TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default AttendanceHistory;
