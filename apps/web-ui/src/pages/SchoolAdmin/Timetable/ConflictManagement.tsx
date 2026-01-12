import { useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Chip,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
} from '@mui/material';
import {
    Warning as WarningIcon,
    Person as PersonIcon,
    MeetingRoom as RoomIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useGetConflictReport } from '../../../queries/Timetable';
import TokenService from '../../../queries/token/tokenService';

const ConflictManagement = () => {
    const schoolId = TokenService.getSchoolId() || '';

    const { data: conflictData, isLoading, error, refetch } = useGetConflictReport(schoolId);

    const conflictReport = conflictData?.data;

    // Filter conflicts by type
    const teacherConflicts = useMemo(() => {
        return conflictReport?.conflicts?.filter((c) => c.type === 'teacher') || [];
    }, [conflictReport]);

    const roomConflicts = useMemo(() => {
        return conflictReport?.conflicts?.filter((c) => c.type === 'room') || [];
    }, [conflictReport]);

    const totalConflicts = conflictReport?.totalConflicts || 0;

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load conflict report</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h5" fontWeight={600}>Conflict Management</Typography>
                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={() => refetch()}
                    size="small"
                >
                    Refresh
                </Button>
            </Box>

            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Card sx={{ minWidth: 200, bgcolor: totalConflicts === 0 ? 'success.light' : 'error.light' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WarningIcon color={totalConflicts === 0 ? 'success' : 'error'} />
                            <Typography variant="h4" fontWeight={600}>
                                {totalConflicts}
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            Total Conflicts
                        </Typography>
                    </CardContent>
                </Card>

                <Card sx={{ minWidth: 200 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon color="primary" />
                            <Typography variant="h4" fontWeight={600}>
                                {teacherConflicts.length}
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            Teacher Conflicts
                        </Typography>
                    </CardContent>
                </Card>

                <Card sx={{ minWidth: 200 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <RoomIcon color="secondary" />
                            <Typography variant="h4" fontWeight={600}>
                                {roomConflicts.length}
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            Room Conflicts
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {totalConflicts === 0 ? (
                <Alert severity="success" sx={{ mb: 3 }}>
                    No scheduling conflicts detected. Your timetable is conflict-free!
                </Alert>
            ) : (
                <>
                    {/* Teacher Conflicts */}
                    {teacherConflicts.length > 0 && (
                        <Paper sx={{ mb: 3, p: 2 }}>
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PersonIcon color="primary" />
                                Teacher Double-Booking Conflicts
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                                            <TableCell><strong>Description</strong></TableCell>
                                            <TableCell><strong>Day</strong></TableCell>
                                            <TableCell><strong>Period</strong></TableCell>
                                            <TableCell><strong>Entry IDs</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {teacherConflicts.map((conflict, index) => (
                                            <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {conflict.description}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={conflict.dayOfWeek?.charAt(0).toUpperCase() + conflict.dayOfWeek?.slice(1)}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={`Period ${conflict.periodNumber}`}
                                                        size="small"
                                                        color="primary"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {conflict.entries?.map((entryId, i) => (
                                                        <Chip
                                                            key={i}
                                                            label={entryId.slice(0, 8) + '...'}
                                                            size="small"
                                                            sx={{ mr: 0.5, mb: 0.5 }}
                                                        />
                                                    ))}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    )}

                    {/* Room Conflicts */}
                    {roomConflicts.length > 0 && (
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <RoomIcon color="secondary" />
                                Room Double-Booking Conflicts
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                                            <TableCell><strong>Description</strong></TableCell>
                                            <TableCell><strong>Day</strong></TableCell>
                                            <TableCell><strong>Period</strong></TableCell>
                                            <TableCell><strong>Entry IDs</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {roomConflicts.map((conflict, index) => (
                                            <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {conflict.description}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={conflict.dayOfWeek?.charAt(0).toUpperCase() + conflict.dayOfWeek?.slice(1)}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={`Period ${conflict.periodNumber}`}
                                                        size="small"
                                                        color="secondary"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {conflict.entries?.map((entryId, i) => (
                                                        <Chip
                                                            key={i}
                                                            label={entryId.slice(0, 8) + '...'}
                                                            size="small"
                                                            sx={{ mr: 0.5, mb: 0.5 }}
                                                        />
                                                    ))}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    )}
                </>
            )}

            {/* Info Box */}
            <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                    <strong>Tip:</strong> To resolve conflicts, go to the Master Timetable and reassign or delete the conflicting entries. Teacher conflicts occur when a teacher is assigned to multiple classes at the same time slot.
                </Typography>
            </Alert>
        </Box>
    );
};

export default ConflictManagement;
