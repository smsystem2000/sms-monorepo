import { useState } from 'react';
import {
    Box,
    Card,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
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
    Alert,
    Snackbar,
    Tabs,
    Tab
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
    useBulkGenerateAdmitCards,
    useGetExamRegistrations
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
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
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
        </Box>
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={600}>Exam Scheduler</Typography>
                <Button variant="contained" startIcon={<AddCircleIcon />} onClick={() => setOpen(true)}>
                    Create New Exam
                </Button>
            </Box>

            {isLoading ? (
                <Typography>Loading...</Typography>
            ) : !exams?.data?.length ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">No exams created yet. Click "Create New Exam" to get started.</Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {exams.data.map((exam: any) => (
                        <Grid key={exam._id} size={{ xs: 12, md: 6, lg: 4 }}>
                            <Card
                                sx={{
                                    p: 3,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        boxShadow: 6,
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                                onClick={() => onSelect(exam)}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box>
                                        <Typography variant="h6" fontWeight={600}>{exam.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {exam.typeId?.name || 'N/A'} | {exam.termId?.name || 'N/A'}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={exam.status}
                                        color={exam.status === 'published' ? 'success' : exam.status === 'draft' ? 'warning' : 'default'}
                                        size="small"
                                    />
                                </Box>
                                <Box sx={{ mt: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <EventIcon fontSize="small" color="action" />
                                        <Typography variant="body2" color="text.secondary">
                                            {new Date(exam.startDate).toLocaleDateString()} - {new Date(exam.endDate).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ClassIcon fontSize="small" color="action" />
                                        <Typography variant="body2" color="text.secondary">
                                            {exam.classes?.length || 0} Classes Participating
                                        </Typography>
                                    </Box>
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

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
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
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
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
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
                            </Grid>
                        </Grid>

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

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="Start Date"
                                    type="date"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    label="End Date"
                                    type="date"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </Grid>
                        </Grid>
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
    const [tabValue, setTabValue] = useState(0);
    const [open, setOpen] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
        open: false,
        message: '',
        severity: 'info'
    });

    const { data: schedule, isLoading } = useGetExamSchedule(schoolId, exam.examId);
    const { data: registrations, isLoading: regLoading } = useGetExamRegistrations(schoolId, exam.examId);
    const scheduleExam = useScheduleExam(schoolId);
    const generateAdmitCards = useBulkGenerateAdmitCards(schoolId);

    // Lists for Dropdowns
    const { data: subjects } = useGetSubjects(schoolId);
    const { data: teachers } = useGetTeachers(schoolId);
    const { data: rooms } = useGetAllRooms(schoolId);

    // We need class list limited to exam.classes
    const { data: allClasses } = useGetClasses(schoolId);
    const examClasses = allClasses?.data?.filter((c: any) => exam.classes.includes(c.classId)) || [];

    // Helper function to resolve class and section names
    const getClassSectionName = (classId: string, sectionId: string): string => {
        const classInfo = allClasses?.data?.find((c: any) => c.classId === classId);
        const className = classInfo?.name || classId;
        const sectionInfo = classInfo?.sections?.find((s: any) => s.sectionId === sectionId || s._id === sectionId);
        const sectionName = sectionInfo?.name || sectionId;
        return `${className} - ${sectionName}`;
    };

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
                setSnackbar({ open: true, message: 'Exam scheduled successfully!', severity: 'success' });
                // Reset (partially)
                setFormData(prev => ({ ...prev, subjectId: '', startTime: '', endTime: '' }));
            },
            onError: (err: any) => {
                setErrorMsg(err?.message || "Failed to schedule exam. Check conflicts.");
            }
        });
    };

    const handleGenerateAdmitCards = () => {
        setConfirmDialogOpen(true);
    };

    const confirmGenerateAdmitCards = () => {
        setConfirmDialogOpen(false);
        generateAdmitCards.mutate({ examId: exam.examId }, {
            onSuccess: (data: any) => {
                setSnackbar({
                    open: true,
                    message: data?.message || 'Admit cards generated successfully!',
                    severity: 'success'
                });
            },
            onError: (err: any) => {
                setSnackbar({
                    open: true,
                    message: err?.message || 'Failed to generate admit cards',
                    severity: 'error'
                });
            }
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const handleViewAdmitCard = (url: string) => {
        if (url) {
            window.open(url, '_blank');
        } else {
            setSnackbar({ open: true, message: 'Admit card URL not available', severity: 'info' });
        }
    };

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <IconButton onClick={onBack} sx={{ mr: 1 }}><ArrowBackIcon /></IconButton>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" fontWeight={600}>{exam.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {typeof exam.typeId === 'object' ? exam.typeId?.name : 'Exam'} | {typeof exam.termId === 'object' ? exam.termId?.name : 'Term'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" startIcon={<CardMembershipIcon />} onClick={handleGenerateAdmitCards} disabled={generateAdmitCards.isPending}>
                        {generateAdmitCards.isPending ? 'Generating...' : 'Generate Admit Cards'}
                    </Button>
                    <Button variant="contained" startIcon={<AddCircleIcon />} onClick={() => setOpen(true)}>
                        Schedule Subject
                    </Button>
                </Box>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={(_e, value) => setTabValue(value)}>
                    <Tab label="Exam Schedule" />
                    <Tab label="Admit Cards" />
                </Tabs>
            </Box>

            {tabValue === 0 && (
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
            )}

            {tabValue === 1 && (
                <TableContainer component={Paper} elevation={0} variant="outlined">
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Student Name</TableCell>
                                <TableCell>Class</TableCell>
                                <TableCell>Roll No</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Eligible</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {regLoading ? (
                                <TableRow><TableCell colSpan={6} align="center">Loading...</TableCell></TableRow>
                            ) : registrations?.data?.map((reg: any) => (
                                <TableRow key={reg._id}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={500}>
                                            {reg.student?.firstName} {reg.student?.lastName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {reg.studentId}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{getClassSectionName(reg.classId, reg.sectionId)}</TableCell>
                                    <TableCell>{reg.rollNumber}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={reg.admitCardGenerated ? "Generated" : "Pending"}
                                            color={reg.admitCardGenerated ? "success" : "warning"}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={reg.isEligible ? "Yes" : "No"}
                                            color={reg.isEligible ? "primary" : "error"}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {reg.admitCardGenerated && (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => handleViewAdmitCard(reg.admitCardUrl)}
                                            >
                                                View PDF
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {registrations?.data?.length === 0 && (
                                <TableRow><TableCell colSpan={6} align="center">No admit cards generated yet</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Schedule Dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Schedule Exam Subject</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
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
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
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
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    label="Date"
                                    type="date"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    label="Start Time"
                                    type="time"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    label="End Time"
                                    type="time"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                />
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
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
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
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
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    label="Max Marks (Theory)"
                                    type="number"
                                    fullWidth
                                    value={formData.maxMarksTheory}
                                    onChange={(e) => setFormData({ ...formData, maxMarksTheory: parseInt(e.target.value) })}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    label="Max Marks (Practical)"
                                    type="number"
                                    fullWidth
                                    value={formData.maxMarksPractical}
                                    onChange={(e) => setFormData({ ...formData, maxMarksPractical: parseInt(e.target.value) })}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField
                                    label="Passing Marks"
                                    type="number"
                                    fullWidth
                                    value={formData.passingMarks}
                                    onChange={(e) => setFormData({ ...formData, passingMarks: parseInt(e.target.value) })}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={scheduleExam.isPending}>
                        {scheduleExam.isPending ? 'Scheduling...' : 'Schedule'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirmation Dialog for Admit Cards */}
            <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
                <DialogTitle>Generate Admit Cards</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to generate admit cards for all eligible students in participating classes?
                        This action will create admit cards for students who don't have one yet.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={confirmGenerateAdmitCards}
                        disabled={generateAdmitCards.isPending}
                    >
                        {generateAdmitCards.isPending ? 'Generating...' : 'Generate'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default ExamScheduler;
