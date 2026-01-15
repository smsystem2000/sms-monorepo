import React, { useState } from 'react';
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
    Tab,
    Avatar,
    Divider,
    CircularProgress,
    Skeleton,
    InputAdornment
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import DeleteIcon from '@mui/icons-material/Delete';
import ClassIcon from '@mui/icons-material/Class';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SchoolIcon from '@mui/icons-material/School';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SearchIcon from '@mui/icons-material/Search';
import { pdf } from '@react-pdf/renderer';
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
import { useGetClasses } from '../../../queries/Class';
import { useGetSubjects } from '../../../queries/Subject';
import { useGetTeachers } from '../../../queries/Teacher';
import { useGetAllRooms } from '../../../queries/Timetable';
import { useGetSchoolById } from '../../../queries/School';
import { AdmitCardPDF } from '../../../components/PDFLayouts';

import type { CreateExamRequest, CreateScheduleRequest, Exam } from '../../../types/exam.types';

// ==========================================
// EXAM SCHEDULER PAGE
// ==========================================

const ExamScheduler = () => {
    const { user } = useAuth();
    const schoolId = user?.schoolId || '';
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

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
// VIEW 1: EXAM LIST - Redesigned with gradient cards
// ==========================================

const ExamListView = ({ schoolId, onSelect }: { schoolId: string, onSelect: (exam: Exam) => void }) => {
    const [open, setOpen] = useState(false);
    const { data: exams, isLoading } = useGetExams(schoolId);

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

    // Get status color and gradient
    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'published':
                return { gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'success' };
            case 'ongoing':
                return { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'primary' };
            case 'scheduled':
                return { gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'secondary' };
            case 'draft':
                return { gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', color: 'warning' };
            default:
                return { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'default' };
        }
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
                <Grid container spacing={3}>
                    {[1, 2, 3].map((i) => (
                        <Grid key={i} size={{ xs: 12, md: 6, lg: 4 }}>
                            <Skeleton variant="rounded" height={180} />
                        </Grid>
                    ))}
                </Grid>
            ) : !exams?.data?.length ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">No exams created yet. Click "Create New Exam" to get started.</Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {exams.data.map((exam: any) => {
                        const styles = getStatusStyles(exam.status);
                        return (
                            <Grid key={exam._id} size={{ xs: 12, md: 6, lg: 4 }}>
                                <Card
                                    sx={{
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                            transform: 'translateY(-4px)'
                                        }
                                    }}
                                    onClick={() => onSelect(exam)}
                                >
                                    {/* Card Header with gradient */}
                                    <Box
                                        sx={{
                                            background: styles.gradient,
                                            color: 'black',
                                            p: 2,
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Box>
                                                <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                                                    {exam.name}
                                                </Typography>
                                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                                    {exam.typeId?.name || 'Exam'} | {exam.termId?.name || 'Term'}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label={exam.status}
                                                size="small"
                                                sx={{
                                                    bgcolor: 'rgba(255,255,255,0.2)',
                                                    color: 'black',
                                                    fontWeight: 600,
                                                    textTransform: 'capitalize'
                                                }}
                                            />
                                        </Box>
                                    </Box>

                                    {/* Card Body */}
                                    <Box sx={{ p: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                            <CalendarMonthIcon fontSize="small" color="action" />
                                            <Typography variant="body2" color="text.secondary">
                                                {new Date(exam.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                {' - '}
                                                {new Date(exam.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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
                        );
                    })}
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
    const [admitCardDialogOpen, setAdmitCardDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [downloading, setDownloading] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
        open: false,
        message: '',
        severity: 'info'
    });

    // Debounce search input
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const { data: schedule, isLoading } = useGetExamSchedule(schoolId, exam.examId);
    const { data: registrations, isLoading: regLoading } = useGetExamRegistrations(schoolId, exam.examId, undefined, debouncedSearch);
    const { data: schoolData } = useGetSchoolById(schoolId);
    const scheduleExam = useScheduleExam(schoolId);
    const generateAdmitCards = useBulkGenerateAdmitCards(schoolId);

    const { data: subjects } = useGetSubjects(schoolId);
    const { data: teachers } = useGetTeachers(schoolId);
    const { data: rooms } = useGetAllRooms(schoolId);
    const { data: allClasses } = useGetClasses(schoolId);
    const examClasses = allClasses?.data?.filter((c: any) => exam.classes.includes(c.classId)) || [];

    // School details
    const school = schoolData?.data;
    const schoolName = school?.schoolName || 'School Name';
    const schoolAddress = school?.schoolAddress || '';
    const schoolLogo = school?.schoolLogo || '';

    const getClassSectionName = (classId: string, sectionId: string): string => {
        const classInfo = allClasses?.data?.find((c: any) => c.classId === classId);
        const className = classInfo?.name || classId;
        const sectionInfo = classInfo?.sections?.find((s: any) => s.sectionId === sectionId || s._id === sectionId);
        const sectionName = sectionInfo?.name || sectionId;
        return `${className} - ${sectionName}`;
    };

    const getClassName = (classId: string): string => {
        const classInfo = allClasses?.data?.find((c: any) => c.classId === classId);
        return classInfo?.name || classId;
    };

    const getSectionName = (classId: string, sectionId: string): string => {
        const classInfo = allClasses?.data?.find((c: any) => c.classId === classId);
        const sectionInfo = classInfo?.sections?.find((s: any) => s.sectionId === sectionId || s._id === sectionId);
        return sectionInfo?.name || sectionId;
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

    const handleViewAdmitCard = (reg: any) => {
        setSelectedStudent(reg);
        setAdmitCardDialogOpen(true);
    };

    const handleDownloadPDF = async () => {
        if (!selectedStudent) return;

        setDownloading(true);
        try {
            const studentName = `${selectedStudent.student?.firstName || ''} ${selectedStudent.student?.lastName || ''}`.trim() || 'Student';
            const fatherName = selectedStudent.student?.fatherName || selectedStudent.student?.parentName || 'Father Name';
            const className = getClassName(selectedStudent.classId);
            const sectionName = getSectionName(selectedStudent.classId, selectedStudent.sectionId);
            const dob = selectedStudent.student?.dateOfBirth
                ? new Date(selectedStudent.student.dateOfBirth).toLocaleDateString()
                : 'N/A';

            const blob = await pdf(
                <AdmitCardPDF
                    studentName={studentName}
                    fatherName={fatherName}
                    rollNumber={selectedStudent.rollNumber || 'N/A'}
                    studentId={selectedStudent.studentId}
                    className={className}
                    sectionName={sectionName}
                    dob={dob}
                    schoolName={schoolName}
                    schoolAddress={schoolAddress}
                    schoolLogo={schoolLogo}
                    studentPhoto={selectedStudent.student?.profileImage || ''}
                    studentSignature={selectedStudent.student?.signature || ''}
                    examName={exam.name}
                    examType={typeof exam.typeId === 'object' ? exam.typeId?.name : 'Examination'}
                    examTerm={typeof exam.termId === 'object' ? exam.termId?.name : 'Term'}
                    academicYear={exam.academicYear || '2025-2026'}
                    startDate={exam.startDate}
                    endDate={exam.endDate}
                />
            ).toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `AdmitCard_${selectedStudent.studentId}_${exam.name.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setSnackbar({ open: true, message: 'Admit card downloaded successfully!', severity: 'success' });
        } catch (error) {
            console.error('PDF generation error:', error);
            setSnackbar({ open: true, message: 'Failed to generate PDF', severity: 'error' });
        } finally {
            setDownloading(false);
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
                <Box>
                    {/* Search Input */}
                    <Box sx={{ mb: 3 }}>
                        <TextField
                            placeholder="Search by name, ID, or roll number..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            size="small"
                            sx={{ width: { xs: '100%', sm: 350 } }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                    <Grid container spacing={3}>
                        {regLoading ? (
                            [1, 2, 3, 4].map((i) => (
                                <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                                    <Skeleton variant="rounded" height={180} />
                                </Grid>
                            ))
                        ) : registrations?.data?.length === 0 ? (
                            <Grid size={{ xs: 12 }}>
                                <Paper sx={{ p: 4, textAlign: 'center' }}>
                                    <Typography color="text.secondary">No admit cards generated yet</Typography>
                                </Paper>
                            </Grid>
                        ) : (
                            registrations?.data?.map((reg: any) => (
                                <Grid key={reg._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                                    <Card
                                        sx={{
                                            borderRadius: 3,
                                            overflow: 'hidden',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                                transform: 'translateY(-4px)'
                                            }
                                        }}
                                    >
                                        {/* Card Header */}
                                        <Box
                                            sx={{
                                                background: reg.admitCardGenerated
                                                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                                    : 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
                                                color: reg.admitCardGenerated ? 'white' : 'text.secondary',
                                                p: 2,
                                                textAlign: 'center'
                                            }}
                                        >
                                            <Avatar
                                                src={reg.student?.profileImage}
                                                sx={{
                                                    width: 60,
                                                    height: 60,
                                                    mx: 'auto',
                                                    mb: 1,
                                                    border: '3px solid rgba(255,255,255,0.3)'
                                                }}
                                            >
                                                {reg.student?.firstName?.[0] || 'S'}
                                            </Avatar>
                                            <Typography variant="subtitle1" fontWeight={600}>
                                                {reg.student?.firstName} {reg.student?.lastName}
                                            </Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                                {reg.studentId}
                                            </Typography>
                                        </Box>

                                        {/* Card Body */}
                                        <Box sx={{ p: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="caption" color="text.secondary">Class</Typography>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {getClassSectionName(reg.classId, reg.sectionId)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="caption" color="text.secondary">Roll No</Typography>
                                                <Typography variant="body2" fontWeight={500}>{reg.rollNumber}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                <Chip
                                                    label={reg.admitCardGenerated ? "Generated" : "Pending"}
                                                    color={reg.admitCardGenerated ? "success" : "warning"}
                                                    size="small"
                                                />
                                                <Chip
                                                    label={reg.isEligible ? "Eligible" : "Not Eligible"}
                                                    color={reg.isEligible ? "primary" : "error"}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </Box>

                                            {reg.admitCardGenerated && (
                                                <Button
                                                    fullWidth
                                                    variant="contained"
                                                    startIcon={<VisibilityIcon />}
                                                    onClick={() => handleViewAdmitCard(reg)}
                                                    sx={{
                                                        borderRadius: 2,
                                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    }}
                                                >
                                                    View Admit Card
                                                </Button>
                                            )}
                                        </Box>
                                    </Card>
                                </Grid>
                            ))
                        )}
                    </Grid>
                </Box>
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

            {/* Admit Card View Dialog */}
            <Dialog
                open={admitCardDialogOpen}
                onClose={() => setAdmitCardDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 2, mt: 10 } }}
            >
                <DialogContent sx={{ p: 0 }}>
                    {selectedStudent && (
                        <Box sx={{ border: '3px solid #1976d2', borderRadius: 1, overflow: 'hidden' }}>
                            {/* Header */}
                            <Box
                                sx={{
                                    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                                    color: 'white',
                                    p: 2,
                                    textAlign: 'center',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 1 }}>
                                    {schoolLogo ? (
                                        <Avatar src={schoolLogo} sx={{ width: 60, height: 60, bgcolor: 'white' }} />
                                    ) : (
                                        <Avatar sx={{ width: 60, height: 60, bgcolor: 'rgba(255,255,255,0.2)' }}>
                                            <SchoolIcon sx={{ fontSize: 35 }} />
                                        </Avatar>
                                    )}
                                    <Box>
                                        <Typography variant="h5" fontWeight={700}>{schoolName}</Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>{schoolAddress}</Typography>
                                    </Box>
                                </Box>
                                <Chip
                                    label="E - ADMIT CARD"
                                    sx={{ mt: 1, bgcolor: '#ff9800', color: 'white', fontWeight: 700, fontSize: '1rem', py: 2 }}
                                />
                            </Box>

                            {/* Exam Title */}
                            <Box sx={{ bgcolor: '#e3f2fd', p: 1.5, textAlign: 'center', borderBottom: '2px solid #1976d2' }}>
                                <Typography variant="h6" fontWeight={600} color="primary.dark">
                                    {exam.name} - {typeof exam.typeId === 'object' ? exam.typeId?.name : 'Examination'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Academic Year: {exam.academicYear || '2025-2026'} | {typeof exam.termId === 'object' ? exam.termId?.name : 'Term'}
                                </Typography>
                            </Box>

                            {/* Content */}
                            <Box sx={{ p: 3 }}>
                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, md: 8 }}>
                                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                                            <Table size="small">
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 600, width: '40%' }}>Student Name</TableCell>
                                                        <TableCell>{selectedStudent.student?.firstName} {selectedStudent.student?.lastName}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 600 }}>Father's Name</TableCell>
                                                        <TableCell>{selectedStudent.student?.fatherName || selectedStudent.student?.parentName || 'N/A'}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 600 }}>Roll Number</TableCell>
                                                        <TableCell>{selectedStudent.rollNumber}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 600 }}>Student ID</TableCell>
                                                        <TableCell>{selectedStudent.studentId}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 600 }}>Class / Section</TableCell>
                                                        <TableCell>{getClassSectionName(selectedStudent.classId, selectedStudent.sectionId)}</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell sx={{ bgcolor: '#f5f5f5', fontWeight: 600 }}>Date of Birth</TableCell>
                                                        <TableCell>
                                                            {selectedStudent.student?.dateOfBirth
                                                                ? new Date(selectedStudent.student.dateOfBirth).toLocaleDateString()
                                                                : 'N/A'}
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </TableContainer>

                                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fff3e0' }}>
                                            <Typography variant="subtitle2" fontWeight={600} color="warning.dark">Examination Period</Typography>
                                            <Typography variant="body1" fontWeight={500}>
                                                {new Date(exam.startDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                {' '} to {' '}
                                                {new Date(exam.endDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            </Typography>
                                        </Paper>
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Paper
                                                variant="outlined"
                                                sx={{ width: 130, height: 160, mx: 'auto', mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
                                            >
                                                {selectedStudent.student?.profileImage ? (
                                                    <Box component="img" src={selectedStudent.student.profileImage} alt="Student Photo" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <Avatar sx={{ width: 100, height: 100, bgcolor: 'grey.300' }}>
                                                        {selectedStudent.student?.firstName?.[0] || 'S'}
                                                    </Avatar>
                                                )}
                                            </Paper>
                                            <Typography variant="caption" color="text.secondary">Photograph of Candidate</Typography>

                                            <Paper
                                                variant="outlined"
                                                sx={{ width: 130, height: 50, mx: 'auto', mt: 2, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                {selectedStudent.student?.signature ? (
                                                    <Box component="img" src={selectedStudent.student.signature} alt="Signature" sx={{ maxWidth: '100%', maxHeight: '100%' }} />
                                                ) : (
                                                    <Typography variant="caption" color="text.disabled">Signature</Typography>
                                                )}
                                            </Paper>
                                            <Typography variant="caption" color="text.secondary">Signature of Candidate</Typography>
                                        </Box>
                                    </Grid>
                                </Grid>

                                <Divider sx={{ my: 3 }} />

                                <Grid container spacing={2}>
                                    {['Class Teacher\'s Signature', 'Candidate\'s Signature', 'Principal\'s Signature'].map((label) => (
                                        <Grid key={label} size={{ xs: 4 }}>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Box sx={{ borderBottom: '1px solid #333', height: 40, mb: 1 }} />
                                                <Typography variant="caption" fontWeight={500}>{label}</Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>

                                <Paper sx={{ mt: 3, p: 2, bgcolor: '#fafafa' }} variant="outlined">
                                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Important Instructions:</Typography>
                                    <Typography variant="caption" component="ul" sx={{ pl: 2, m: 0 }}>
                                        <li>Bring this admit card to the examination hall along with a valid ID proof.</li>
                                        <li>Reach the examination center at least 30 minutes before the scheduled time.</li>
                                        <li>Electronic devices including mobile phones are strictly prohibited.</li>
                                        <li>Any attempt to use unfair means will result in disqualification.</li>
                                    </Typography>
                                </Paper>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
                    <Button onClick={() => setAdmitCardDialogOpen(false)}>Close</Button>
                    <Button
                        variant="contained"
                        startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                    >
                        {downloading ? 'Generating...' : 'Download PDF'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default ExamScheduler;
