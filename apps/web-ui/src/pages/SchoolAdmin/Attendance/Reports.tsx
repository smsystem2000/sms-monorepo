import { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Chip,
    Tabs,
    Tab,
} from '@mui/material';
import { useGetDailyReport, useGetClassWiseReport, useGetMonthlyReport } from '../../../queries/Attendance';
import { useGetClasses } from '../../../queries/Class';
import { useGetSchoolById } from '../../../queries/School';
import type { Class, ClassWiseReport as ClassReport } from '../../../types';
import TokenService from '../../../queries/token/tokenService';

const AttendanceReports = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const [tab, setTab] = useState(0);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedClass, setSelectedClass] = useState('');

    const { data: schoolData } = useGetSchoolById(schoolId);
    const mode = schoolData?.data?.attendanceSettings?.mode || 'simple';

    const { data: classesData } = useGetClasses(schoolId);
    const classes = classesData?.data || [];

    // Daily Report
    const { data: dailyData, isLoading: dailyLoading } = useGetDailyReport(schoolId, selectedDate, { mode, classId: selectedClass || undefined });
    const dailyReport = dailyData?.data;

    // Class-wise Report
    const { data: classWiseData, isLoading: classWiseLoading } = useGetClassWiseReport(schoolId, selectedDate, mode);
    const classWiseReport = classWiseData?.data?.classes || [];

    // Monthly Report
    const { data: monthlyData, isLoading: monthlyLoading } = useGetMonthlyReport(schoolId, selectedYear, selectedMonth, { mode, classId: selectedClass || undefined, type: 'student' });
    const monthlyReport = monthlyData?.data;

    const getPercentageColor = (pct: string | number) => {
        const p = typeof pct === 'string' ? parseFloat(pct) : pct;
        if (p >= 90) return 'success';
        if (p >= 75) return 'warning';
        return 'error';
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
                Attendance Reports
            </Typography>

            <Paper sx={{ mb: 3 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                    <Tab label="Daily Report" />
                    <Tab label="Class-wise" />
                    <Tab label="Monthly Report" />
                </Tabs>
            </Paper>

            {/* Daily Report Tab */}
            {tab === 0 && (
                <>
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                            <TextField
                                type="date"
                                label="Date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                            <FormControl sx={{ minWidth: 150 }}>
                                <InputLabel>Class</InputLabel>
                                <Select value={selectedClass} label="Class" onChange={(e) => setSelectedClass(e.target.value)}>
                                    <MenuItem value="">All Classes</MenuItem>
                                    {classes.map((c: Class) => <MenuItem key={c.classId} value={c.classId}>{c.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <Chip label={`Mode: ${mode.replace('_', ' ')}`} variant="outlined" />
                        </Box>
                    </Paper>

                    {dailyLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
                    ) : dailyReport ? (
                        <Grid container spacing={3}>
                            {/* Student Summary */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>Student Attendance</Typography>
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 6, sm: 4 }}>
                                                <Typography variant="h4" color="success.main">{dailyReport.students?.summary?.present || 0}</Typography>
                                                <Typography variant="body2" color="text.secondary">Present</Typography>
                                            </Grid>
                                            <Grid size={{ xs: 6, sm: 4 }}>
                                                <Typography variant="h4" color="error.main">{dailyReport.students?.summary?.absent || 0}</Typography>
                                                <Typography variant="body2" color="text.secondary">Absent</Typography>
                                            </Grid>
                                            <Grid size={{ xs: 6, sm: 4 }}>
                                                <Typography variant="h4" color="warning.main">{dailyReport.students?.summary?.late || 0}</Typography>
                                                <Typography variant="body2" color="text.secondary">Late</Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                            {/* Teacher Summary */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>Teacher Attendance</Typography>
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 6, sm: 4 }}>
                                                <Typography variant="h4" color="success.main">{dailyReport.teachers?.summary?.present || 0}</Typography>
                                                <Typography variant="body2" color="text.secondary">Present</Typography>
                                            </Grid>
                                            <Grid size={{ xs: 6, sm: 4 }}>
                                                <Typography variant="h4" color="error.main">{dailyReport.teachers?.summary?.absent || 0}</Typography>
                                                <Typography variant="body2" color="text.secondary">Absent</Typography>
                                            </Grid>
                                            <Grid size={{ xs: 6, sm: 4 }}>
                                                <Typography variant="h4" color="info.main">{dailyReport.teachers?.summary?.leave || 0}</Typography>
                                                <Typography variant="body2" color="text.secondary">On Leave</Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    ) : null}
                </>
            )}

            {/* Class-wise Tab */}
            {tab === 1 && (
                <>
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <TextField
                            type="date"
                            label="Date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Paper>

                    {classWiseLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
                    ) : (
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Class</TableCell>
                                        <TableCell>Section</TableCell>
                                        <TableCell align="center">Present</TableCell>
                                        <TableCell align="center">Absent</TableCell>
                                        <TableCell align="center">Late</TableCell>
                                        <TableCell align="center">Total</TableCell>
                                        <TableCell align="center">%</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {classWiseReport.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center">No data for this date</TableCell>
                                        </TableRow>
                                    ) : (
                                        classWiseReport.map((row: ClassReport, i: number) => (
                                            <TableRow key={i}>
                                                <TableCell>{classes.find((c: Class) => c.classId === row.classId)?.name || row.classId}</TableCell>
                                                <TableCell>{row.sectionId || 'All'}</TableCell>
                                                <TableCell align="center">{row.present}</TableCell>
                                                <TableCell align="center">{row.absent}</TableCell>
                                                <TableCell align="center">{row.late}</TableCell>
                                                <TableCell align="center">{row.total}</TableCell>
                                                <TableCell align="center">
                                                    <Chip label={`${row.percentage}%`} size="small" color={getPercentageColor(row.percentage)} />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </>
            )}

            {/* Monthly Report Tab */}
            {tab === 2 && (
                <>
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                            <FormControl sx={{ minWidth: 100 }}>
                                <InputLabel>Month</InputLabel>
                                <Select value={selectedMonth} label="Month" onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                                        <MenuItem key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'short' })}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl sx={{ minWidth: 100 }}>
                                <InputLabel>Year</InputLabel>
                                <Select value={selectedYear} label="Year" onChange={(e) => setSelectedYear(Number(e.target.value))}>
                                    {[2024, 2025, 2026].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl sx={{ minWidth: 150 }}>
                                <InputLabel>Class</InputLabel>
                                <Select value={selectedClass} label="Class" onChange={(e) => setSelectedClass(e.target.value)}>
                                    <MenuItem value="">All Classes</MenuItem>
                                    {classes.map((c: Class) => <MenuItem key={c.classId} value={c.classId}>{c.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    </Paper>

                    {monthlyLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
                    ) : monthlyReport?.students ? (
                        <>
                            <Card sx={{ mb: 2 }}>
                                <CardContent>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Working Days: {monthlyReport.students.workingDays} | Total Records: {monthlyReport.students.totalRecords}
                                    </Typography>
                                </CardContent>
                            </Card>
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Student ID</TableCell>
                                            <TableCell>Class</TableCell>
                                            <TableCell align="center">Present</TableCell>
                                            <TableCell align="center">Absent</TableCell>
                                            <TableCell align="center">Late</TableCell>
                                            <TableCell align="center">Leave</TableCell>
                                            <TableCell align="center">%</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {monthlyReport.students.byStudent.map((s, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{s.studentId}</TableCell>
                                                <TableCell>{classes.find((c: Class) => c.classId === s.classId)?.name || s.classId}</TableCell>
                                                <TableCell align="center">{s.present}</TableCell>
                                                <TableCell align="center">{s.absent}</TableCell>
                                                <TableCell align="center">{s.late}</TableCell>
                                                <TableCell align="center">{s.leave}</TableCell>
                                                <TableCell align="center">
                                                    <Chip label={`${s.percentage}%`} size="small" color={getPercentageColor(s.percentage)} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    ) : (
                        <Paper sx={{ p: 4, textAlign: 'center' }}>No data for this period</Paper>
                    )}
                </>
            )}
        </Box>
    );
};

export default AttendanceReports;
