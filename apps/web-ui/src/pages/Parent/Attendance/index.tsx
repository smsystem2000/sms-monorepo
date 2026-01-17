import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    Alert,
    Skeleton,
    LinearProgress,
    ToggleButton,
    ToggleButtonGroup,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import {
    CalendarMonth as CalendarIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useChildSelector } from '../../../context/ChildSelectorContext';
import { useGetChildAttendance } from '../../../queries/ParentPortal';
import TokenService from '../../../queries/token/tokenService';

const ParentAttendance: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const { selectedChild, isLoading: loadingChild } = useChildSelector();

    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const selectedYear = currentDate.getFullYear();

    const { data, isLoading, error } = useGetChildAttendance(
        schoolId,
        selectedChild?.studentId || '',
        { month: selectedMonth, year: selectedYear }
    );

    const attendanceData = data?.data;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'present': return 'success';
            case 'absent': return 'error';
            case 'late': return 'warning';
            case 'half_day': return 'info';
            case 'leave': return 'default';
            default: return 'default';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'present': return <CheckCircleIcon fontSize="small" color="success" />;
            case 'absent': return <CancelIcon fontSize="small" color="error" />;
            case 'late': return <AccessTimeIcon fontSize="small" color="warning" />;
            default: return null;
        }
    };

    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' },
    ];

    if (!selectedChild && !loadingChild) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info">Please select a child to view their attendance.</Alert>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load attendance data. Please try again later.</Alert>
            </Box>
        );
    }

    const summary = attendanceData?.summary;
    const attendance = attendanceData?.attendance || [];

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CalendarIcon color="primary" />
                <Typography variant="h4" fontWeight={600}>
                    Attendance
                </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                {selectedChild ? `${selectedChild.firstName}'s attendance record` : 'Loading...'}
            </Typography>

            {/* Month/Year Selector */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <ToggleButtonGroup
                    value={selectedMonth}
                    exclusive
                    onChange={(_, value) => value && setSelectedMonth(value)}
                    size="small"
                >
                    {months.slice(0, 6).map((month) => (
                        <ToggleButton key={month.value} value={month.value}>
                            {month.label.slice(0, 3)}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
                <ToggleButtonGroup
                    value={selectedMonth}
                    exclusive
                    onChange={(_, value) => value && setSelectedMonth(value)}
                    size="small"
                >
                    {months.slice(6).map((month) => (
                        <ToggleButton key={month.value} value={month.value}>
                            {month.label.slice(0, 3)}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </Box>

            {isLoading || loadingChild ? (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
                    </Grid>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
                    </Grid>
                </Grid>
            ) : (
                <Grid container spacing={3}>
                    {/* Summary Card */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                                </Typography>

                                <Box sx={{ mb: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Attendance Rate
                                        </Typography>
                                        <Typography variant="h5" fontWeight={700} color="primary">
                                            {summary?.percentage || 0}%
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={parseFloat(summary?.percentage || '0')}
                                        sx={{ height: 8, borderRadius: 4 }}
                                        color={
                                            parseFloat(summary?.percentage || '0') >= 90 ? 'success' :
                                                parseFloat(summary?.percentage || '0') >= 75 ? 'warning' : 'error'
                                        }
                                    />
                                </Box>

                                <Grid container spacing={1}>
                                    <Grid size={{ xs: 6 }}>
                                        <Chip
                                            icon={<CheckCircleIcon />}
                                            label={`Present: ${summary?.present || 0}`}
                                            color="success"
                                            variant="outlined"
                                            sx={{ width: '100%' }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Chip
                                            icon={<CancelIcon />}
                                            label={`Absent: ${summary?.absent || 0}`}
                                            color="error"
                                            variant="outlined"
                                            sx={{ width: '100%' }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Chip
                                            icon={<AccessTimeIcon />}
                                            label={`Late: ${summary?.late || 0}`}
                                            color="warning"
                                            variant="outlined"
                                            sx={{ width: '100%' }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <Chip
                                            label={`Total: ${summary?.total || 0}`}
                                            variant="outlined"
                                            sx={{ width: '100%' }}
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Daily Records */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    Daily Records
                                </Typography>

                                {attendance.length === 0 ? (
                                    <Box sx={{ py: 4, textAlign: 'center' }}>
                                        <CalendarIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                        <Typography color="text.secondary">
                                            No attendance records for this month
                                        </Typography>
                                    </Box>
                                ) : (
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Date</TableCell>
                                                    <TableCell>Day</TableCell>
                                                    <TableCell>Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {attendance.map((record: { date: string; status: string }, index: number) => {
                                                    const date = new Date(record.date);
                                                    return (
                                                        <TableRow key={index}>
                                                            <TableCell>
                                                                {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                            </TableCell>
                                                            <TableCell>
                                                                {date.toLocaleDateString('en-IN', { weekday: 'short' })}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    size="small"
                                                                    icon={getStatusIcon(record.status) || undefined}
                                                                    label={record.status.replace('_', ' ')}
                                                                    color={getStatusColor(record.status) as 'success' | 'error' | 'warning' | 'info' | 'default'}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default ParentAttendance;
