import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    Alert,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Card,
    CardContent,
    Grid,
} from '@mui/material';
import {
    Visibility as ViewIcon,
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    Pending as PendingIcon,
} from '@mui/icons-material';
import { useGetStudentLeavesForTeacher, useProcessLeave } from '../../../queries/Leave';
import TokenService from '../../../queries/token/tokenService';
import type { LeaveRequest, LeaveStatus } from '../../../types';

const statusConfig: Record<LeaveStatus, { color: 'warning' | 'success' | 'error'; icon: React.ReactNode }> = {
    pending: { color: 'warning', icon: <PendingIcon /> },
    approved: { color: 'success', icon: <ApproveIcon /> },
    rejected: { color: 'error', icon: <RejectIcon /> },
};

const TeacherStudentLeaves: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';

    const [statusFilter, setStatusFilter] = useState<string>('pending');
    const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
    const [processDialog, setProcessDialog] = useState<{ leave: LeaveRequest; action: 'approve' | 'reject' } | null>(null);
    const [remarks, setRemarks] = useState('');

    const { data, isLoading, error } = useGetStudentLeavesForTeacher(schoolId, { status: statusFilter || undefined });
    const processMutation = useProcessLeave(schoolId);

    const leaves = data?.data?.leaves || [];
    const summary = data?.data?.summary;

    const handleProcess = async () => {
        if (!processDialog) return;
        try {
            await processMutation.mutateAsync({
                leaveId: processDialog.leave.leaveId,
                action: processDialog.action,
                remarks: remarks.trim() || undefined,
            });
            setProcessDialog(null);
            setRemarks('');
        } catch {
            // handled by mutation
        }
    };

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
                Student Leave Requests
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Review and approve/reject leave requests from your students.
            </Typography>

            {/* Summary Cards */}
            {summary && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Card sx={{ textAlign: 'center' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="h4" fontWeight={600}>{summary.total}</Typography>
                                <Typography variant="body2" color="text.secondary">Total</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Card sx={{ textAlign: 'center', bgcolor: 'warning.50' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="h4" fontWeight={600} color="warning.main">{summary.pending}</Typography>
                                <Typography variant="body2" color="text.secondary">Pending</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Card sx={{ textAlign: 'center', bgcolor: 'success.50' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="h4" fontWeight={600} color="success.main">{summary.approved}</Typography>
                                <Typography variant="body2" color="text.secondary">Approved</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                        <Card sx={{ textAlign: 'center', bgcolor: 'error.50' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="h4" fontWeight={600} color="error.main">{summary.rejected}</Typography>
                                <Typography variant="body2" color="text.secondary">Rejected</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Filter */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <ToggleButtonGroup value={statusFilter} exclusive onChange={(_, val) => setStatusFilter(val || '')} size="small">
                    <ToggleButton value="">All</ToggleButton>
                    <ToggleButton value="pending">Pending</ToggleButton>
                    <ToggleButton value="approved">Approved</ToggleButton>
                    <ToggleButton value="rejected">Rejected</ToggleButton>
                </ToggleButtonGroup>
            </Paper>

            {/* Table */}
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : error ? (
                <Alert severity="error">Failed to load student leave requests</Alert>
            ) : leaves.length === 0 ? (
                <Alert severity="info">No student leave requests found.</Alert>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>From</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>To</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Days</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {leaves.map((leave) => (
                                <TableRow key={leave.leaveId} hover>
                                    <TableCell>{leave.applicantName}</TableCell>
                                    <TableCell sx={{ textTransform: 'capitalize' }}>{leave.leaveType}</TableCell>
                                    <TableCell>{formatDate(leave.startDate)}</TableCell>
                                    <TableCell>{formatDate(leave.endDate)}</TableCell>
                                    <TableCell>{leave.numberOfDays}</TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={statusConfig[leave.status].icon as React.ReactElement}
                                            label={leave.status}
                                            color={statusConfig[leave.status].color}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton size="small" onClick={() => setSelectedLeave(leave)}>
                                            <ViewIcon fontSize="small" />
                                        </IconButton>
                                        {leave.status === 'pending' && (
                                            <>
                                                <IconButton size="small" color="success" onClick={() => setProcessDialog({ leave, action: 'approve' })}>
                                                    <ApproveIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" color="error" onClick={() => setProcessDialog({ leave, action: 'reject' })}>
                                                    <RejectIcon fontSize="small" />
                                                </IconButton>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* View Details Dialog */}
            <Dialog open={!!selectedLeave} onClose={() => setSelectedLeave(null)} maxWidth="sm" fullWidth>
                <DialogTitle>Leave Details</DialogTitle>
                <DialogContent dividers>
                    {selectedLeave && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">Student:</Typography>
                                <Typography fontWeight={600}>{selectedLeave.applicantName}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">Type:</Typography>
                                <Chip label={selectedLeave.leaveType} size="small" sx={{ textTransform: 'capitalize' }} />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">Duration:</Typography>
                                <Typography>{formatDate(selectedLeave.startDate)} to {formatDate(selectedLeave.endDate)} ({selectedLeave.numberOfDays} days)</Typography>
                            </Box>
                            <Box>
                                <Typography color="text.secondary" gutterBottom>Reason:</Typography>
                                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}><Typography>{selectedLeave.reason}</Typography></Paper>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions><Button onClick={() => setSelectedLeave(null)}>Close</Button></DialogActions>
            </Dialog>

            {/* Process Dialog */}
            <Dialog open={!!processDialog} onClose={() => { setProcessDialog(null); setRemarks(''); }}>
                <DialogTitle>{processDialog?.action === 'approve' ? 'Approve' : 'Reject'} Leave Request?</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>
                        {processDialog?.action === 'approve'
                            ? 'Are you sure you want to approve this leave request?'
                            : 'Are you sure you want to reject this leave request?'}
                    </Typography>
                    <TextField
                        label="Remarks (optional)"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        multiline
                        rows={3}
                        fullWidth
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setProcessDialog(null); setRemarks(''); }}>Cancel</Button>
                    <Button
                        variant="contained"
                        color={processDialog?.action === 'approve' ? 'success' : 'error'}
                        onClick={handleProcess}
                        disabled={processMutation.isPending}
                    >
                        {processMutation.isPending ? 'Processing...' : processDialog?.action === 'approve' ? 'Approve' : 'Reject'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TeacherStudentLeaves;
