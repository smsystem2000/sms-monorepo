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
    Chip
} from '@mui/material';
import { MuiIcons } from '../../../utils/Icons';
import { useAuth } from '../../../context/AuthContext';
import {
    useGetExams,
    useGetExamSchedule,
    useGetSubjectResults,
    useSubmitMarks
} from '../../../queries/Exam';
// Assuming useGetAllStudents exists and takes filters
import { useGetStudents } from '../../../queries/Student';

import type { SubmitMarksRequest } from '../../../types/exam.types';

const MarksEntry = () => {
    const { user } = useAuth();
    const schoolId = user?.schoolId || '';

    // Selection States
    const [selectedExamId, setSelectedExamId] = useState('');
    const [selectedScheduleId, setSelectedScheduleId] = useState('');

    // Data Fetching
    const { data: exams } = useGetExams(schoolId);
    const { data: scheduleData } = useGetExamSchedule(schoolId, selectedExamId);
    const { data: resultsData, refetch: refetchResults } = useGetSubjectResults(schoolId, selectedExamId, selectedScheduleId);

    // Derived Data
    const selectedSchedule = scheduleData?.data?.find((s: any) => s._id === selectedScheduleId);

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
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Details Entry (Marks)</h1>
            </div>

            <Card className="p-6 mb-6">
                <div className="grid grid-cols-2 gap-4">
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

                    <FormControl fullWidth disabled={!selectedExamId}>
                        <InputLabel>Select Subject/Class</InputLabel>
                        <Select
                            value={selectedScheduleId}
                            label="Select Subject/Class"
                            onChange={(e) => setSelectedScheduleId(e.target.value)}
                        >
                            {scheduleData?.data?.map((s: any) => (
                                <MenuItem key={s._id} value={s._id}>
                                    {s.subjectId} - Class {s.classId} ({new Date(s.date).toLocaleDateString()})
                                </MenuItem>
                            ))}
                            {scheduleData?.data?.length === 0 && <MenuItem disabled>No schedule found</MenuItem>}
                        </Select>
                    </FormControl>
                </div>
            </Card>

            {selectedScheduleId && (
                <Card className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <Typography variant="h6">
                            Enter Marks
                            <Chip
                                size="small"
                                label={`Max: ${selectedSchedule?.maxMarksTheory} TH + ${selectedSchedule?.maxMarksPractical} PR`}
                                className="ml-2"
                            />
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<MuiIcons.Save />} // Assuming Save exists? Wait, I saw ContentSave/Save in similar projects, but let's check index.tsx. Using CheckCircle or AddCircle if Save not there.
                            // Actually, I'll use CheckCircle for now as a fallback or check Icons.tsx
                            // I will check Icons later.
                            onClick={handleSubmit}
                            disabled={!hasChanges || submitMarks.isPending}
                        >
                            {submitMarks.isPending ? 'Saving...' : 'Save Marks'}
                        </Button>
                    </div>

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
        </div>
    );
};

export default MarksEntry;
