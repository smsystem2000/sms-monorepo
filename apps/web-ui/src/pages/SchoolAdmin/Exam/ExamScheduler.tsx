import { useState } from 'react';
import {
    Box,
    Card,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Chip,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Alert
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import DeleteIcon from '@mui/icons-material/Delete';
import EventIcon from '@mui/icons-material/Event';
import ClassIcon from '@mui/icons-material/Class';
import { useAuth } from '../../../context/AuthContext';
import {
    useCreateExam,
    useGetExams,
    useGetExamTerms,
    useGetExamTypes,
    useGetGradingSystems,
    useGetExamSchedule,
    useScheduleExam,
    useBulkGenerateAdmitCards
} from '../../../queries/Exam';
// Corrected imports
import { useGetClasses } from '../../../queries/Class';
import { useGetSubjects } from '../../../queries/Subject';
import { useGetTeachers } from '../../../queries/Teacher';
import { useGetAllRooms } from '../../../queries/Timetable';

import type { CreateExamRequest, CreateScheduleRequest, Exam } from '../../../types/exam.types';

// ==========================================
// EXAM SCHEDULER PAGE
// ==========================================

const ExamScheduler = () => {
    const { user } = useAuth();
    const schoolId = user?.schoolId || '';
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

    // If no exam selected, show list. If selected, show details/scheduler.
    return (
        <div className="p-6">
            {selectedExam ? (
                <ExamDetailView
                    schoolId={schoolId}
                    exam={selectedExam}
                    onBack={() => setSelectedExam(null)}
                />
            ) : (
                <ExamListView
                    schoolId={schoolId}
                    onSelect={setSelectedExam}
                />
            )}
        </div>
    );
};

// ==========================================
// VIEW 1: EXAM LIST
// ==========================================

const ExamListView = ({ schoolId, onSelect }: { schoolId: string, onSelect: (exam: Exam) => void }) => {
    const [open, setOpen] = useState(false);
    const { data: exams, isLoading } = useGetExams(schoolId);

    // Data for Dropdowns
    const { data: terms } = useGetExamTerms(schoolId);
    const { data: types } = useGetExamTypes(schoolId);
    const { data: gradingSystems } = useGetGradingSystems(schoolId);
    const { data: classes } = useGetClasses(schoolId);

    const createExam = useCreateExam(schoolId);

    const [formData, setFormData] = useState<CreateExamRequest>({
        name: '',
        typeId: '',
        termId: '',
        academicYear: '2025-2026',
        classes: [],
        startDate: '',
        endDate: '',
        gradingSystemId: ''
    });

    const handleSubmit = () => {
        createExam.mutate(formData, {
            onSuccess: () => {
                setOpen(false);
                setFormData({
                    name: '', typeId: '', termId: '', academicYear: '2025-2026',
                    classes: [], startDate: '', endDate: '', gradingSystemId: ''
                });
            }
        });
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Exam Scheduler</h1>
                <Button variant="contained" startIcon={<AddCircleIcon />} onClick={() => setOpen(true)}>
                    Create New Exam
                </Button>
            </div>

            <Grid container spacing={3}>
                {isLoading ? <p>Loading...</p> : exams?.data?.map((exam: any) => (
                    <Grid key={exam._id} size={{ xs: 12, md: 6, lg: 4 }}>
                        <Card className="p-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onSelect(exam)}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <Typography variant="h6">{exam.name}</Typography>
                                    <Typography variant="body2" color="textSecondary">{exam.typeId?.name} | {exam.termId?.name}</Typography>
                                </div>
                                <Chip label={exam.status} color={exam.status === 'published' ? 'success' : 'default'} size="small" />
                            </div>
                            <div className="mt-4 text-sm text-gray-600">
                                <p><EventIcon fontSize="small" className="align-middle mr-1" /> {new Date(exam.startDate).toLocaleDateString()} - {new Date(exam.endDate).toLocaleDateString()}</p>
                                <p className="mt-1"><ClassIcon fontSize="small" className="align-middle mr-1" /> {exam.classes?.length || 0} Classes Participating</p>
                            </div>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Create New Exam Event</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Exam Name"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Mid-Term 2025"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormControl fullWidth>
                                <InputLabel>Term</InputLabel>
                                <Select
                                    value={formData.termId}
                                    label="Term"
                                    onChange={(e) => setFormData({ ...formData, termId: e.target.value })}
                                >
                                    {terms?.data?.map((t: any) => <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>Exam Type</InputLabel>
                                <Select
                                    value={formData.typeId}
                                    label="Exam Type"
                                    onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
                                >
                                    {types?.data?.map((t: any) => <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </div>

                        <FormControl fullWidth>
                            <InputLabel>Grading System</InputLabel>
                            <Select
                                value={formData.gradingSystemId}
                                label="Grading System"
                                onChange={(e) => setFormData({ ...formData, gradingSystemId: e.target.value })}
                            >
                                {gradingSystems?.data?.map((t: any) => <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>)}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Participating Classes</InputLabel>
                            <Select
                                multiple
                                value={formData.classes}
                                label="Participating Classes"
                                onChange={(e) => {
                                    const val = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                                    setFormData({ ...formData, classes: val });
                                }}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value: string) => {
                                            const cls = classes?.data?.find((c: any) => c.classId === value);
                                            return <Chip key={value} label={cls ? `${cls.name}${cls.sections?.[0]?.name ? ` ${cls.sections[0].name}` : ''}` : value} />;
                                        })}
                                    </Box>
                                )}
                            >
                                {classes?.data?.map((c: any) => <MenuItem key={c.classId} value={c.classId}>{c.name}{c.sections?.[0]?.name ? ` ${c.sections[0].name}` : ''}</MenuItem>)}
                            </Select>
                        </FormControl>

                        <div className="grid grid-cols-2 gap-4">
                            <TextField
                                label="Start Date"
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            />
                            <TextField
                                label="End Date"
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={createExam.isPending}>
                        {createExam.isPending ? 'Creating...' : 'Create Exam'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

// ==========================================
// VIEW 2: EXAM DETAIL / SCHEDULE
// ==========================================

const ExamDetailView = ({ schoolId, exam, onBack }: { schoolId: string, exam: Exam, onBack: () => void }) => {
    const [open, setOpen] = useState(false);
    const { data: schedule, isLoading } = useGetExamSchedule(schoolId, exam.examId);
    const scheduleExam = useScheduleExam(schoolId);
    const generateAdmitCards = useBulkGenerateAdmitCards(schoolId);

    // Lists for Dropdowns
    const { data: subjects } = useGetSubjects(schoolId);
    const { data: teachers } = useGetTeachers(schoolId);
    const { data: rooms } = useGetAllRooms(schoolId);

    // We need class list limited to exam.classes
    const { data: allClasses } = useGetClasses(schoolId);
    const examClasses = allClasses?.data?.filter((c: any) => exam.classes.includes(c.classId)) || [];

    const [formData, setFormData] = useState<CreateScheduleRequest>({
        examId: exam.examId,
        classId: '',
        subjectId: '',
        date: '',
        startTime: '',
        endTime: '',
        roomId: '',
        invigilators: [],
        passingMarks: 35,
        maxMarksTheory: 80,
        maxMarksPractical: 0
    });

    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = () => {
        setErrorMsg('');
        scheduleExam.mutate(formData, {
            onSuccess: () => {
                setOpen(false);
                // Reset (partially)
                setFormData(prev => ({ ...prev, subjectId: '', startTime: '', endTime: '' }));
            },
            onError: (err: any) => {
                setErrorMsg(err?.message || "Failed to schedule exam. Check conflicts.");
            }
        });
    };

    const handleGenerateAdmitCards = () => {
        if (window.confirm("Are you sure you want to generate admit cards for all eligible students?")) {
            generateAdmitCards.mutate({ examId: exam.examId }, {
                onSuccess: () => alert("Admit Cards generation started in background.")
            });
        }
    };

    return (
        <>
            <div className="flex items-center mb-6">
                <IconButton onClick={onBack} className="mr-2"><ArrowBackIcon /></IconButton>
                <div>
                    <h1 className="text-2xl font-bold">{exam.name}</h1>
                    <p className="text-gray-500">Timetable Editor</p>
                </div>
                <div className="ml-auto gap-2 flex">
                    <Button variant="outlined" startIcon={<CardMembershipIcon />} onClick={handleGenerateAdmitCards} disabled={generateAdmitCards.isPending}>
                        {generateAdmitCards.isPending ? 'Generating...' : 'Generate Admit Cards'}
                    </Button>
                    <Button variant="contained" startIcon={<AddCircleIcon />} onClick={() => setOpen(true)}>
                        Schedule Subject
                    </Button>
                </div>
            </div>

            <TableContainer component={Paper} elevation={0} variant="outlined">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Time</TableCell>
                            <TableCell>Class</TableCell>
                            <TableCell>Subject</TableCell>
                            <TableCell>Room</TableCell>
                            <TableCell>Invigilators</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={7} align="center">Loading...</TableCell></TableRow>
                        ) : schedule?.data?.map((sch: any) => (
                            <TableRow key={sch._id}>
                                <TableCell>{new Date(sch.date).toLocaleDateString()}</TableCell>
                                <TableCell>{sch.startTime} - {sch.endTime}</TableCell>
                                <TableCell>{sch.classId}</TableCell>
                                <TableCell>{sch.subjectId}</TableCell>
                                <TableCell>{sch.roomId?.name || 'N/A'}</TableCell>
                                <TableCell>
                                    {sch.invigilators?.map((inv: any) => `${inv.firstName} ${inv.lastName}`).join(', ')}
                                </TableCell>
                                <TableCell>
                                    <IconButton size="small"><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {schedule?.data?.length === 0 && (
                            <TableRow><TableCell colSpan={7} align="center">No exams scheduled yet</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Schedule Dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Schedule Exam Subject</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

                        <div className="grid grid-cols-2 gap-4">
                            <FormControl fullWidth>
                                <InputLabel>Class</InputLabel>
                                <Select
                                    value={formData.classId}
                                    label="Class"
                                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                                >
                                    {examClasses.map((c: any) => <MenuItem key={c.classId} value={c.classId}>{c.name}{c.sections?.[0]?.name ? ` ${c.sections[0].name}` : ''}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>Subject</InputLabel>
                                <Select
                                    value={formData.subjectId}
                                    label="Subject"
                                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                                >
                                    {subjects?.data?.map((s: any) => <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <TextField
                                label="Date"
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                            <TextField
                                label="Start Time"
                                type="time"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            />
                            <TextField
                                label="End Time"
                                type="time"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormControl fullWidth>
                                <InputLabel>Room</InputLabel>
                                <Select
                                    value={formData.roomId}
                                    label="Room"
                                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {rooms?.data?.map((r: any) => <MenuItem key={r._id} value={r._id}>{r.name} (Cap: {r.capacity})</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>Invigilators</InputLabel>
                                <Select
                                    multiple
                                    value={formData.invigilators}
                                    label="Invigilators"
                                    onChange={(e) => {
                                        const val = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                                        setFormData({ ...formData, invigilators: val });
                                    }}
                                >
                                    {teachers?.data?.map((t: any) => <MenuItem key={t.teacherId} value={t.teacherId}>{t.firstName} {t.lastName}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <TextField
                                label="Max Marks (Theory)"
                                type="number"
                                fullWidth
                                value={formData.maxMarksTheory}
                                onChange={(e) => setFormData({ ...formData, maxMarksTheory: parseInt(e.target.value) })}
                            />
                            <TextField
                                label="Max Marks (Practical)"
                                type="number"
                                fullWidth
                                value={formData.maxMarksPractical}
                                onChange={(e) => setFormData({ ...formData, maxMarksPractical: parseInt(e.target.value) })}
                            />
                            <TextField
                                label="Passing Marks"
                                type="number"
                                fullWidth
                                value={formData.passingMarks}
                                onChange={(e) => setFormData({ ...formData, passingMarks: parseInt(e.target.value) })}
                            />
                        </div>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={scheduleExam.isPending}>
                        {scheduleExam.isPending ? 'Scheduling...' : 'Schedule'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ExamScheduler;
