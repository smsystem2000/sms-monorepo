import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Chip,
    CircularProgress,
    Snackbar,
    Alert,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useGetTeachers } from '../../../queries/Teacher';
import { useGetTeachersAttendance, useMarkTeacherAttendance } from '../../../queries/Attendance';
import type { Teacher, AttendanceStatus, TeacherAttendance as TeacherAttType } from '../../../types';
import TokenService from '../../../queries/token/tokenService';

interface AttendanceRecord {
    teacherId: string;
    status: AttendanceStatus;
    leaveType?: "casual" | "sick" | "earned" | "unpaid" | "other";
    remarks?: string;
}

const TeacherAttendancePage = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const { data: teachersData, isLoading: teachersLoading } = useGetTeachers(schoolId);
    const teachers = teachersData?.data || [];

    const { data: existingData, isLoading: attendanceLoading } = useGetTeachersAttendance(schoolId, selectedDate);
    const existingAttendance = existingData?.data?.attendance || [];
    const summary = existingData?.data?.summary;

    const markAttendance = useMarkTeacherAttendance(schoolId);

    // Initialize attendance from existing
    useEffect(() => {
        if (existingAttendance.length > 0) {
            const existing: Record<string, AttendanceRecord> = {};
            existingAttendance.forEach((a: TeacherAttType) => {
                existing[a.teacherId] = {
                    teacherId: a.teacherId,
                    status: a.status,
                    leaveType: a.leaveType,
                };
            });
            setAttendance(existing);
        } else {
            // Clear attendance when no data exists (date changed)
            setAttendance({});
        }
    }, [existingAttendance]);

    const handleStatusChange = (teacherId: string, status: AttendanceStatus) => {
        setAttendance(prev => ({
            ...prev,
            [teacherId]: { ...prev[teacherId], teacherId, status },
        }));
    };

    const handleMarkAll = (status: AttendanceStatus) => {
        const updated: Record<string, AttendanceRecord> = {};
        teachers.forEach((t: Teacher) => {
            updated[t.teacherId] = { teacherId: t.teacherId, status };
        });
        setAttendance(updated);
    };

    const handleSave = async () => {
        try {
            await markAttendance.mutateAsync({
                date: selectedDate,
                attendanceRecords: Object.values(attendance),
            });
            setSnackbar({ open: true, message: 'Teacher attendance saved!', severity: 'success' });
        } catch {
            setSnackbar({ open: true, message: 'Failed to save', severity: 'error' });
        }
    };

    const getTeacherAttendance = (teacherId: string): AttendanceRecord | undefined => {
        return attendance[teacherId] || existingAttendance.find((a: TeacherAttType) => a.teacherId === teacherId);
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
                Teacher Attendance
            </Typography>

            {/* Date Picker */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <TextField
                        type="date"
                        label="Date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ max: new Date().toLocaleDateString('en-CA') }}
                    />
                    <Button size="small" variant="outlined" color="success" onClick={() => handleMarkAll('present')}>
                        Mark All Present
                    </Button>
                    <Button size="small" variant="outlined" color="error" onClick={() => handleMarkAll('absent')}>
                        Mark All Absent
                    </Button>
                </Box>
            </Paper>

            {/* Summary */}
            {summary && (
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                    <Chip label={`Total: ${summary.total}`} variant="outlined" />
                    <Chip label={`Present: ${summary.present}`} color="success" />
                    <Chip label={`Absent: ${summary.absent}`} color="error" />
                    <Chip label={`Late: ${summary.late}`} color="warning" />
                    <Chip label={`Leave: ${summary.leave}`} color="info" />
                </Box>
            )}

            {/* Table */}
            {teachersLoading || attendanceLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : teachers.length === 0 ? (
                <Alert severity="info">No teachers found</Alert>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>#</TableCell>
                                <TableCell>Teacher ID</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell align="center">Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {teachers.map((teacher: Teacher, index: number) => {
                                const att = getTeacherAttendance(teacher.teacherId);
                                return (
                                    <TableRow key={teacher.teacherId} hover>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{teacher.teacherId}</TableCell>
                                        <TableCell>{teacher.firstName} {teacher.lastName}</TableCell>
                                        <TableCell align="center">
                                            <ToggleButtonGroup
                                                size="small"
                                                value={att?.status || null}
                                                exclusive
                                                onChange={(_, value) => value && handleStatusChange(teacher.teacherId, value)}
                                            >
                                                <ToggleButton value="present" color="success">P</ToggleButton>
                                                <ToggleButton value="absent" color="error">A</ToggleButton>
                                                <ToggleButton value="late" color="warning">L</ToggleButton>
                                                <ToggleButton value="leave" color="info">LV</ToggleButton>
                                            </ToggleButtonGroup>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Save */}
            {teachers.length > 0 && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={markAttendance.isPending ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        onClick={handleSave}
                        disabled={markAttendance.isPending}
                    >
                        Save Teacher Attendance
                    </Button>
                </Box>
            )}

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default TeacherAttendancePage;
