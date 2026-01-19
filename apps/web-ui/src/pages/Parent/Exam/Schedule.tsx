import React, { useState } from 'react';
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
    Tabs,
    Tab,
} from '@mui/material';
import {
    CalendarMonth as CalendarIcon,
    AccessTime as TimeIcon,
    Event as EventIcon,
} from '@mui/icons-material';
import { useChildSelector } from '../../../context/ChildSelectorContext';
import { useGetExams, useGetExamSchedule } from '../../../queries/Exam';
import { useGetSubjects } from '../../../queries/Subject';
import TokenService from '../../../queries/token/tokenService';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            {...other}
        >
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
};

const ParentExamSchedule: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const { selectedChild, isLoading: loadingChild } = useChildSelector();
    const [selectedTab, setSelectedTab] = useState(0);

    const { data: examsData, isLoading: examsLoading } = useGetExams(schoolId, '2025-2026');
    const { data: subjectsData } = useGetSubjects(schoolId);

    // Filter exams by status
    const upcomingExams = examsData?.data?.filter((e: any) => ['scheduled', 'draft'].includes(e.status)) || [];
    const ongoingExams = examsData?.data?.filter((e: any) => e.status === 'ongoing') || [];
    const completedExams = examsData?.data?.filter((e: any) => e.status === 'completed') || [];

    // Helper to get subject name
    const getSubjectName = (subjectId: string): string => {
        const subjectInfo = subjectsData?.data?.find((s: any) => s._id === subjectId || s.subjectId === subjectId);
        return subjectInfo?.name || subjectId;
    };

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
                <Alert severity="info">Please select a child to view their exam schedule.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <EventIcon color="primary" />
                <Typography variant="h4" fontWeight={600}>
                    Exam Schedule
                </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {selectedChild.firstName}'s examination schedule
            </Typography>

            <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)} sx={{ mb: 2 }}>
                <Tab label={`Upcoming (${upcomingExams.length})`} />
                <Tab label={`Ongoing (${ongoingExams.length})`} />
                <Tab label={`Completed (${completedExams.length})`} />
            </Tabs>

            <TabPanel value={selectedTab} index={0}>
                {examsLoading ? (
                    <Skeleton variant="rectangular" width="100%" height={300} />
                ) : upcomingExams.length === 0 ? (
                    <Alert severity="info">No upcoming exams scheduled.</Alert>
                ) : (
                    <Grid container spacing={2}>
                        {upcomingExams.map((exam: any) => (
                            <ExamScheduleCard
                                key={exam.examId}
                                exam={exam}
                                schoolId={schoolId}
                                getSubjectName={getSubjectName}
                            />
                        ))}
                    </Grid>
                )}
            </TabPanel>

            <TabPanel value={selectedTab} index={1}>
                {examsLoading ? (
                    <Skeleton variant="rectangular" width="100%" height={300} />
                ) : ongoingExams.length === 0 ? (
                    <Alert severity="info">No ongoing exams.</Alert>
                ) : (
                    <Grid container spacing={2}>
                        {ongoingExams.map((exam: any) => (
                            <ExamScheduleCard
                                key={exam.examId}
                                exam={exam}
                                schoolId={schoolId}
                                getSubjectName={getSubjectName}
                            />
                        ))}
                    </Grid>
                )}
            </TabPanel>

            <TabPanel value={selectedTab} index={2}>
                {examsLoading ? (
                    <Skeleton variant="rectangular" width="100%" height={300} />
                ) : completedExams.length === 0 ? (
                    <Alert severity="info">No completed exams.</Alert>
                ) : (
                    <Grid container spacing={2}>
                        {completedExams.map((exam: any) => (
                            <ExamScheduleCard
                                key={exam.examId}
                                exam={exam}
                                schoolId={schoolId}
                                getSubjectName={getSubjectName}
                            />
                        ))}
                    </Grid>
                )}
            </TabPanel>
        </Box>
    );
};

const ExamScheduleCard = ({ exam, schoolId, getSubjectName }: { exam: any; schoolId: string; getSubjectName: (id: string) => string }) => {
    const { data: scheduleData, isLoading } = useGetExamSchedule(schoolId, exam.examId);
    const examSchedule = scheduleData?.data || [];

    return (
        <Grid size={{ xs: 12 }}>
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box>
                            <Typography variant="h6" fontWeight={600}>
                                {exam.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {exam.typeId?.name || 'Exam'} | {exam.termId?.name || 'Term'} | {exam.academicYear}
                            </Typography>
                        </Box>
                        <Chip
                            label={exam.status}
                            color={exam.status === 'scheduled' ? 'primary' : exam.status === 'ongoing' ? 'warning' : 'success'}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                        />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <CalendarIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                            {new Date(exam.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {' - '}
                            {new Date(exam.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </Typography>
                    </Box>

                    {isLoading ? (
                        <Skeleton variant="rectangular" width="100%" height={200} />
                    ) : examSchedule.length > 0 ? (
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                                        <TableCell><strong>Date</strong></TableCell>
                                        <TableCell><strong>Time</strong></TableCell>
                                        <TableCell><strong>Subject</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {examSchedule.map((schedule: any, index: number) => (
                                        <TableRow key={schedule._id || index}>
                                            <TableCell>
                                                {new Date(schedule.date).toLocaleDateString('en-IN', {
                                                    weekday: 'short',
                                                    day: 'numeric',
                                                    month: 'short',
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <TimeIcon fontSize="small" color="action" />
                                                    {schedule.startTime} - {schedule.endTime}
                                                </Box>
                                            </TableCell>
                                            <TableCell>{getSubjectName(schedule.subjectId)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Alert severity="info" sx={{ mt: 1 }}>Schedule not available yet.</Alert>
                    )}
                </CardContent>
            </Card>
        </Grid>
    );
};

export default ParentExamSchedule;
