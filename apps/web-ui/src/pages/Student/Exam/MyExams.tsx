import {
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
    TableRow
} from '@mui/material';
import { useAuth } from '../../../context/AuthContext';
import {
    useGetAdmitCard,
    useGetStudentReportCard,
    useGetExams // Assuming we might list upcoming exams
} from '../../../queries/Exam';

const MyExams = () => {
    const { user } = useAuth();
    const schoolId = user?.schoolId || '';
    const studentId = user?.userId || ''; // AuthUser uses userId

    const { data: reportCardData, isLoading: reportLoading } = useGetStudentReportCard(schoolId, studentId);
    const { data: examsData } = useGetExams(schoolId, '2025-2026'); // hardcoded for now, ideal: current Academic Year

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">My Exams & Results</h1>

            {/* Admit Cards Section */}
            <div className="mb-8">
                <Typography variant="h6" className="mb-4">Upcoming/Ongoing Exams (Admit Cards)</Typography>
                <Grid container spacing={3}>
                    {examsData?.data?.filter((e: any) => ['scheduled', 'ongoing'].includes(e.status)).map((exam: any) => (
                        <AdmitCardBlock key={exam.examId} schoolId={schoolId} exam={exam} studentId={studentId} />
                    ))}
                    {(!examsData?.data || examsData.data.filter((e: any) => ['scheduled', 'ongoing'].includes(e.status)).length === 0) && (
                        <Grid size={{ xs: 12 }}><p className="text-gray-500">No upcoming exams.</p></Grid>
                    )}
                </Grid>
            </div>

            {/* Results Section */}
            <div>
                <Typography variant="h6" className="mb-4">Results / Report Cards</Typography>
                {reportLoading ? <p>Loading results...</p> : (
                    <div className="space-y-6">
                        {reportCardData?.data?.exams?.map((examResult: any) => (
                            <Card key={examResult.examId} className="p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <Typography variant="h6">{examResult.name}</Typography>
                                        <Typography variant="body2" color="textSecondary">{examResult.term} | {examResult.type}</Typography>
                                    </div>
                                    <Chip label="Published" color="success" size="small" />
                                </div>

                                <TableContainer component={Paper} elevation={0} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
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
                                                        <Chip label={res.grade} color={res.grade === 'F' ? 'error' : 'primary'} size="small" />
                                                    </TableCell>
                                                    <TableCell>{res.remarks}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Card>
                        ))}

                        {(!reportCardData?.data?.exams || reportCardData.data.exams.length === 0) && (
                            <p className="text-gray-500">No results published yet.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const AdmitCardBlock = ({ schoolId, exam, studentId }: { schoolId: string, exam: any, studentId: string }) => {
    const { data: admitCard, isLoading } = useGetAdmitCard(schoolId, exam.examId, studentId);

    const handleDownload = () => {
        if (admitCard?.data?.admitCardUrl) {
            window.open(admitCard.data.admitCardUrl, '_blank');
        } else {
            alert("No admit card URL found.");
        }
    };

    return (
        <Grid size={{ xs: 12, md: 4 }}>
            <Card className="p-4 border-l-4 border-blue-500">
                <Typography variant="subtitle1" fontWeight="bold">{exam.name}</Typography>
                <Typography variant="body2" className="mb-2">Starts: {new Date(exam.startDate).toLocaleDateString()}</Typography>

                {isLoading ? <p className="text-sm">Checking eligibility...</p> : (
                    admitCard?.data?.isEligible ? (
                        admitCard?.data?.admitCardGenerated ? (
                            <Button size="small" variant="contained" onClick={handleDownload}>
                                Download Admit Card
                            </Button>
                        ) : (
                            <Chip label="Admit Card Pending" color="warning" size="small" />
                        )
                    ) : (
                        <Chip label="Not Eligible" color="error" size="small" />
                    )
                )}
            </Card>
        </Grid>
    );
};

export default MyExams;
