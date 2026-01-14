import { useState } from 'react';
import {
    Box,
    Card,
    Typography,
    Button,
    Grid,
    Chip,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider
} from '@mui/material';
import {
    Event as EventIcon,
    Download as DownloadIcon,
    Visibility as ViewIcon,
    Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useAuth } from '../../../context/AuthContext';
import {
    useGetAdmitCard,
    useGetStudentReportCard,
    useGetExams
} from '../../../queries/Exam';

const MyExams = () => {
    const { user } = useAuth();
    const schoolId = user?.schoolId || '';
    const studentId = user?.userId || '';

    const { data: reportCardData, isLoading: reportLoading } = useGetStudentReportCard(schoolId, studentId);
    const { data: examsData, isLoading: examsLoading, error: examsError } = useGetExams(schoolId, '2025-2026');

    const upcomingExams = examsData?.data?.filter((e: any) => ['scheduled', 'ongoing', 'draft'].includes(e.status)) || [];

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>My Exams & Results</Typography>

            {/* Error Alert */}
            {examsError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    Failed to load exams. Please try again later.
                </Alert>
            )}

            {/* Admit Cards Section */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentIcon color="primary" />
                    Upcoming/Ongoing Exams (Admit Cards)
                </Typography>

                {examsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : upcomingExams.length === 0 ? (
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography color="text.secondary">No upcoming exams.</Typography>
                    </Paper>
                ) : (
                    <Grid container spacing={3}>
                        {upcomingExams.map((exam: any) => (
                            <AdmitCardBlock key={exam.examId} schoolId={schoolId} exam={exam} studentId={studentId} />
                        ))}
                    </Grid>
                )}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Results Section */}
            <Box>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EventIcon color="primary" />
                    Results / Report Cards
                </Typography>

                {reportLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (!reportCardData?.data?.exams || reportCardData.data.exams.length === 0) ? (
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography color="text.secondary">No results published yet.</Typography>
                    </Paper>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {reportCardData.data.exams.map((examResult: any) => (
                            <Card key={examResult.examId} sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Box>
                                        <Typography variant="h6">{examResult.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {examResult.term} | {examResult.type}
                                        </Typography>
                                    </Box>
                                    <Chip label="Published" color="success" size="small" />
                                </Box>

                                <TableContainer component={Paper} elevation={0} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                                <TableCell>Subject</TableCell>
                                                <TableCell align="right">Max Marks</TableCell>
                                                <TableCell align="right">Marks Obtained</TableCell>
                                                <TableCell align="center">Grade</TableCell>
                                                <TableCell>Remarks</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {examResult.results.map((res: any) => (
                                                <TableRow key={res.subjectId}>
                                                    <TableCell>{res.subjectId}</TableCell>
                                                    <TableCell align="right">{res.maxMarks || '-'}</TableCell>
                                                    <TableCell align="right">{res.marksObtained}</TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={res.grade}
                                                            color={res.grade === 'F' ? 'error' : 'primary'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell>{res.remarks}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Card>
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

const AdmitCardBlock = ({ schoolId, exam, studentId }: { schoolId: string, exam: any, studentId: string }) => {
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
        open: false,
        message: '',
        severity: 'info'
    });

    const { data: admitCard, isLoading } = useGetAdmitCard(schoolId, exam.examId, studentId);

    // Display class/section from admit card data (IDs)
    const classId = admitCard?.data?.classId || '';
    const sectionId = admitCard?.data?.sectionId || '';
    const classDisplay = classId && sectionId
        ? `${classId} / ${sectionId}`
        : classId || 'N/A';

    const handleDownload = () => {
        if (admitCard?.data?.admitCardUrl) {
            window.open(admitCard.data.admitCardUrl, '_blank');
        } else {
            setSnackbar({ open: true, message: 'No admit card URL found.', severity: 'info' });
        }
    };

    const handleView = () => {
        setViewDialogOpen(true);
    };

    return (
        <>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                    sx={{
                        p: 2,
                        borderLeft: '4px solid',
                        borderColor: 'primary.main',
                        transition: 'all 0.2s',
                        '&:hover': { boxShadow: 4 }
                    }}
                >
                    <Typography variant="subtitle1" fontWeight={600}>{exam.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        {exam.typeId?.name || 'Exam'} | {exam.termId?.name || 'Term'}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <EventIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                            {new Date(exam.startDate).toLocaleDateString()} - {new Date(exam.endDate).toLocaleDateString()}
                        </Typography>
                    </Box>

                    {isLoading ? (
                        <CircularProgress size={20} />
                    ) : admitCard?.data?.isEligible !== false ? (
                        admitCard?.data?.admitCardGenerated ? (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<ViewIcon />}
                                    onClick={handleView}
                                >
                                    View
                                </Button>
                                <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<DownloadIcon />}
                                    onClick={handleDownload}
                                >
                                    Download
                                </Button>
                            </Box>
                        ) : (
                            <Chip label="Admit Card Pending" color="warning" size="small" />
                        )
                    ) : (
                        <Chip label="Not Eligible" color="error" size="small" />
                    )}
                </Card>
            </Grid>

            {/* Admit Card View Dialog */}
            <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Admit Card - {exam.name}</DialogTitle>
                <DialogContent>
                    <Box sx={{ py: 2 }}>
                        <Typography variant="h6" align="center" fontWeight={600} sx={{ mb: 2 }}>
                            {exam.name}
                        </Typography>

                        <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 6 }}>
                                    <Typography variant="body2" color="text.secondary">Student ID</Typography>
                                    <Typography variant="body1" fontWeight={500}>{studentId}</Typography>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <Typography variant="body2" color="text.secondary">Roll Number</Typography>
                                    <Typography variant="body1" fontWeight={500}>{admitCard?.data?.rollNumber || 'N/A'}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="body2" color="text.secondary">Class / Section</Typography>
                                    <Typography variant="body1" fontWeight={500}>{classDisplay}</Typography>
                                </Grid>
                            </Grid>
                        </Paper>

                        <Paper sx={{ p: 2 }} variant="outlined">
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Exam Period</Typography>
                            <Typography variant="body1">
                                {new Date(exam.startDate).toLocaleDateString()} - {new Date(exam.endDate).toLocaleDateString()}
                            </Typography>
                        </Paper>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                    <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownload}>
                        Download PDF
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default MyExams;
