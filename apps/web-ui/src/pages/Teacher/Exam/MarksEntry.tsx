import { useState, useEffect } from 'react';
import {
    Card,
    Typography,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    Chip,
    Box
} from '@mui/material';
import { MuiIcons } from '../../../utils/Icons';
import { useAuth } from '../../../context/AuthContext';
import {
    useGetExams,
    useGetExamSchedule,
    useGetSubjectResults,
    useSubmitMarks
} from '../../../queries/Exam';
import { useGetStudents } from '../../../queries/Student';
import { useGetTeacherById } from '../../../queries/Teacher';
import { useGetSubjects } from '../../../queries/Subject';

import type { SubmitMarksRequest } from '../../../types/exam.types';

const MarksEntry = () => {
    const { user } = useAuth();
    const schoolId = user?.schoolId || '';
    const teacherId = user?.userId || '';

    // Selection States
    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedScheduleId, setSelectedScheduleId] = useState('');

    // Data Fetching
    const { data: exams } = useGetExams(schoolId);
    const { data: scheduleData } = useGetExamSchedule(schoolId, selectedExamId);
    const { data: teacherData } = useGetTeacherById(schoolId, teacherId);
    const { data: subjectsData } = useGetSubjects(schoolId);
    const { data: resultsData, refetch: refetchResults } = useGetSubjectResults(schoolId, selectedExamId, selectedScheduleId);

    // Get teacher's assigned subjects
    const teacherSubjects = teacherData?.data?.subjects || [];

    // Filter schedules to only show teacher's assigned subjects
    const filteredSchedules = scheduleData?.data?.filter((s: any) =>
        teacherSubjects.includes(s.subjectId)
    ) || [];

    // Helper to get subject name
    const getSubjectName = (subjectId: string): string => {
        const subject = subjectsData?.data?.find((s: any) => s._id === subjectId || s.subjectId === subjectId);
        return subject?.name || subjectId;
    };

    // Auto-select if only one subject available
    useEffect(() => {
        if (filteredSchedules.length === 1 && !selectedScheduleId) {
            setSelectedScheduleId(filteredSchedules[0]._id);
        }
    }, [filteredSchedules, selectedScheduleId]);

    // Derived Data
    const selectedSchedule = filteredSchedules.find((s: any) => s._id === selectedScheduleId);

    // Fetch Students for the selected class/section
    const { data: studentsData } = useGetStudents(schoolId, {
        class: selectedSchedule?.classId, // StudentFilters uses 'class' property
        // Note: useGetStudents expects StudentFilters with 'class' not 'classId'
    });

    const submitMarks = useSubmitMarks(schoolId);

    // Local State for Marks Grid
    const [marksGrid, setMarksGrid] = useState<any[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    // Initialize/Update Grid when Data Changes
    useEffect(() => {
        if (studentsData?.data && selectedSchedule) {
            const grid = studentsData.data.map((student: any) => {
                const result = resultsData?.data?.find((r: any) => r.studentId === student.studentId);
                return {
                    studentId: student.studentId,
                    name: `${student.firstName} ${student.lastName}`,
                    rollNumber: student.rollNumber,
                    theory: result?.marksObtainedTheory ?? '',
                    practical: result?.marksObtainedPractical ?? '',
                    remarks: result?.remarks || '',
                    attendanceStatus: result?.attendanceStatus || 'present',
                    // Max marks reference
                    maxTheory: selectedSchedule.maxMarksTheory,
                    maxPractical: selectedSchedule.maxMarksPractical
                };
            });
            setMarksGrid(grid);
            setHasChanges(false);
        }
    }, [studentsData, resultsData, selectedSchedule]);

    const handleMarkChange = (index: number, field: string, value: any) => {
        const newGrid = [...marksGrid];
        newGrid[index][field] = value;
        setMarksGrid(newGrid);
        setHasChanges(true);
    };

    const handleSubmit = () => {
        if (!selectedSchedule) return;

        const payload: SubmitMarksRequest = {
            examId: selectedExamId,
            scheduleId: selectedScheduleId,
            marks: marksGrid.map(row => ({
                studentId: row.studentId,
                theory: parseFloat(row.theory) || 0,
                practical: parseFloat(row.practical) || 0,
                remarks: row.remarks,
                attendanceStatus: row.attendanceStatus
            }))
        };

        submitMarks.mutate(payload, {
            onSuccess: () => {
                alert("Marks submitted successfully!");
                setHasChanges(false);
                refetchResults();
            },
            onError: (err: any) => {
                alert(`Error submitting marks: ${err.message}`);
            }
        });
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight={600}>Details Entry (Marks)</Typography>
            </Box>

            <Card sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: teacherSubjects.length <= 1 ? '1fr' : '1fr 1fr', gap: 2 }}>
                    <FormControl fullWidth>
                        <InputLabel>Select Exam</InputLabel>
                        <Select
                            value={selectedExamId}
                            label="Select Exam"
                            onChange={(e) => {
                                setSelectedExamId(e.target.value);
                                setSelectedScheduleId('');
                            }}
                        >
                            {exams?.data?.map((e: any) => <MenuItem key={e._id} value={e.examId}>{e.name} ({e.status})</MenuItem>)}
                        </Select>
                    </FormControl>

                    {/* Show dropdown if teacher has multiple subjects */}
                    {teacherSubjects.length > 1 && (
                        <FormControl fullWidth disabled={!selectedExamId || filteredSchedules.length === 0}>
                            <InputLabel>Select Subject/Class</InputLabel>
                            <Select
                                value={selectedScheduleId}
                                label="Select Subject/Class"
                                onChange={(e) => setSelectedScheduleId(e.target.value)}
                            >
                                {filteredSchedules.map((s: any) => (
                                    <MenuItem key={s._id} value={s._id}>
                                        {getSubjectName(s.subjectId)} - Class {s.classId} ({new Date(s.date).toLocaleDateString()})
                                    </MenuItem>
                                ))}
                                {filteredSchedules.length === 0 && <MenuItem disabled>No schedules for your subjects</MenuItem>}
                            </Select>
                        </FormControl>
                    )}

                    {/* Show selected subject info if only one subject */}
                    {teacherSubjects.length === 1 && filteredSchedules.length === 1 && selectedSchedule && (
                        <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                            <Typography variant="body1">
                                <strong>Subject:</strong> {getSubjectName(selectedSchedule.subjectId)} - Class {selectedSchedule.classId}
                            </Typography>
                        </Paper>
                    )}
                </Box>

                {/* Show message when exam is selected but no schedules found */}
                {selectedExamId && filteredSchedules.length === 0 && (
                    <Paper sx={{ p: 3, mt: 2, bgcolor: 'warning.light', textAlign: 'center' }}>
                        <Typography variant="body1" color="warning.dark" fontWeight={600}>
                            No exam schedules found for your assigned subjects
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            This exam may not have been scheduled yet, or you may not be assigned to teach any subjects for this exam.
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Your assigned subjects: {teacherSubjects.length > 0 ? teacherSubjects.map(getSubjectName).join(', ') : 'None'}
                        </Typography>
                    </Paper>
                )}
            </Card>

            {selectedScheduleId && (
                <Card sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box>
                            <Typography variant="h6">
                                Enter Marks
                            </Typography>
                            <Chip
                                size="small"
                                label={`Max: ${selectedSchedule?.maxMarksTheory} Theory + ${selectedSchedule?.maxMarksPractical} Practical`}
                                sx={{ mt: 1 }}
                                color="primary"
                                variant="outlined"
                            />
                        </Box>
                        <Button
                            variant="contained"
                            startIcon={<MuiIcons.Save />}
                            onClick={handleSubmit}
                            disabled={!hasChanges || submitMarks.isPending}
                        >
                            {submitMarks.isPending ? 'Saving...' : 'Save Marks'}
                        </Button>
                    </Box>

                    <TableContainer component={Paper} elevation={0} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Roll No</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Attendance</TableCell>
                                    <TableCell>Theory</TableCell>
                                    <TableCell>Practical</TableCell>
                                    <TableCell>Remarks</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {marksGrid.map((row, index) => (
                                    <TableRow key={row.studentId} hover>
                                        <TableCell>{row.rollNumber}</TableCell>
                                        <TableCell>{row.name}</TableCell>
                                        <TableCell>
                                            <Select
                                                size="small"
                                                value={row.attendanceStatus}
                                                onChange={(e) => handleMarkChange(index, 'attendanceStatus', e.target.value)}
                                                variant="standard"
                                            >
                                                <MenuItem value="present">Present</MenuItem>
                                                <MenuItem value="absent">Absent</MenuItem>
                                                <MenuItem value="medical_leave">Medical</MenuItem>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                type="number"
                                                size="small"
                                                value={row.theory}
                                                onChange={(e) => handleMarkChange(index, 'theory', e.target.value)}
                                                inputProps={{ max: row.maxTheory, min: 0 }}
                                                error={row.theory > row.maxTheory}
                                                disabled={row.attendanceStatus !== 'present'}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                type="number"
                                                size="small"
                                                value={row.practical}
                                                onChange={(e) => handleMarkChange(index, 'practical', e.target.value)}
                                                inputProps={{ max: row.maxPractical, min: 0 }}
                                                error={row.practical > row.maxPractical}
                                                disabled={row.maxPractical === 0 || row.attendanceStatus !== 'present'}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                value={row.remarks}
                                                onChange={(e) => handleMarkChange(index, 'remarks', e.target.value)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {marksGrid.length === 0 && (
                                    <TableRow><TableCell colSpan={6} align="center">No students found or select criteria.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>
            )}
        </Box>
    );
};

export default MarksEntry;
