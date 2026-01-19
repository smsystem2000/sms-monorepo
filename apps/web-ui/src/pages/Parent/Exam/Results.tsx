import React from 'react';
import {
    Box,
    Typography,
    Alert,
    Skeleton,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Grid,
    Divider,
} from '@mui/material';
import {
    EmojiEvents as TrophyIcon,
    TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { useChildSelector } from '../../../context/ChildSelectorContext';
import { useGetStudentReportCard } from '../../../queries/Exam';
import TokenService from '../../../queries/token/tokenService';

const ParentExamResults: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const { selectedChild, isLoading: loadingChild } = useChildSelector();

    const { data: reportCardData, isLoading: reportLoading } = useGetStudentReportCard(
        schoolId,
        selectedChild?.studentId || ''
    );

    const reportCard = reportCardData?.data;
    const examResults = reportCard?.exams || [];

    // Show loading while children are being loaded
    if (loadingChild) {
        return (
            <Box sx={{ p: 3 }}>
                <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" width="100%" height={300} />
            </Box>
        );
    }

    if (!selectedChild) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info">Please select a child to view their exam results.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrophyIcon color="primary" />
                <Typography variant="h4" fontWeight={600}>
                    Exam Results
                </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {selectedChild.firstName}'s examination results and report cards
            </Typography>

            {reportLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} variant="rectangular" width="100%" height={200} />
                    ))}
                </Box>
            ) : examResults.length === 0 ? (
                <Alert severity="info">
                    No exam results published yet. Results will appear here once they are available.
                </Alert>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {examResults.map((examResult: any) => (
                        <Card key={examResult.examId}>
                            <CardContent>
                                {/* Exam Header */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Box>
                                        <Typography variant="h6" fontWeight={600}>
                                            {examResult.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {examResult.term} | {examResult.type}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label="Published"
                                        color="success"
                                        size="small"
                                        icon={<TrendingIcon />}
                                    />
                                </Box>

                                {/* Overall Performance Summary */}
                                {examResult.overall && (
                                    <Grid container spacing={2} sx={{ mb: 2 }}>
                                        <Grid size={{ xs: 6, sm: 3 }}>
                                            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd' }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Total Marks
                                                </Typography>
                                                <Typography variant="h6" fontWeight={600} color="primary">
                                                    {examResult.overall.totalMarks || '-'}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid size={{ xs: 6, sm: 3 }}>
                                            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: '#f3e5f5' }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Obtained
                                                </Typography>
                                                <Typography variant="h6" fontWeight={600} color="secondary">
                                                    {examResult.overall.obtainedMarks || '-'}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid size={{ xs: 6, sm: 3 }}>
                                            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: '#e8f5e9' }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Percentage
                                                </Typography>
                                                <Typography variant="h6" fontWeight={600} color="success.main">
                                                    {examResult.overall.percentage ? `${examResult.overall.percentage}%` : '-'}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid size={{ xs: 6, sm: 3 }}>
                                            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: '#fff3e0' }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Grade
                                                </Typography>
                                                <Typography variant="h6" fontWeight={600} color="warning.dark">
                                                    {examResult.overall.grade || '-'}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                )}

                                <Divider sx={{ my: 2 }} />

                                {/* Subject-wise Results */}
                                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                                    Subject-wise Performance
                                </Typography>

                                <TableContainer component={Paper} elevation={0} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                                <TableCell><strong>Subject</strong></TableCell>
                                                <TableCell align="right"><strong>Max Marks</strong></TableCell>
                                                <TableCell align="right"><strong>Obtained</strong></TableCell>
                                                <TableCell align="right"><strong>Percentage</strong></TableCell>
                                                <TableCell align="center"><strong>Grade</strong></TableCell>
                                                <TableCell><strong>Remarks</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {examResult.results?.map((result: any, index: number) => {
                                                const percentage = result.maxMarks > 0
                                                    ? ((result.marksObtained / result.maxMarks) * 100).toFixed(1)
                                                    : '-';
                                                const isPass = result.grade !== 'F';

                                                return (
                                                    <TableRow key={result.subjectId || index}>
                                                        <TableCell>{result.subjectId}</TableCell>
                                                        <TableCell align="right">{result.maxMarks || '-'}</TableCell>
                                                        <TableCell align="right">
                                                            <strong>{result.marksObtained || '-'}</strong>
                                                        </TableCell>
                                                        <TableCell align="right">{percentage}%</TableCell>
                                                        <TableCell align="center">
                                                            <Chip
                                                                label={result.grade || '-'}
                                                                size="small"
                                                                color={isPass ? 'success' : 'error'}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {result.remarks || 'Good'}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {/* Teacher's Remarks */}
                                {examResult.remarks && (
                                    <Paper sx={{ mt: 2, p: 2, bgcolor: '#fffde7' }} variant="outlined">
                                        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                                            Teacher's Remarks:
                                        </Typography>
                                        <Typography variant="body2">
                                            {examResult.remarks}
                                        </Typography>
                                    </Paper>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default ParentExamResults;
