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
    Button,
    CircularProgress,
    Alert,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Card,
    CardContent,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    Visibility as ViewIcon,
    Pending as PendingIcon,
} from '@mui/icons-material';
import { useGetAllLeaves, useProcessLeave } from '../../../queries/Leave';
import TokenService from '../../../queries/token/tokenService';
import type { LeaveRequest, LeaveStatus } from '../../../types';

const statusConfig: Record<LeaveStatus, { color: 'warning' | 'success' | 'error'; icon: React.ReactNode }> = {
    pending: { color: 'warning', icon: <PendingIcon /> },
    approved: { color: 'success', icon: <ApproveIcon /> },
    rejected: { color: 'error', icon: <RejectIcon /> },
};

const LeaveRequests: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';

    const [statusFilter, setStatusFilter] = useState<string>('pending');
    const [applicantTypeFilter, setApplicantTypeFilter] = useState<string>('');
    const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
    const [processDialog, setProcessDialog] = useState<{ leave: LeaveRequest; action: 'approve' | 'reject' } | null>(null);
    const [remarks, setRemarks] = useState('');

    const { data, isLoading, error } = useGetAllLeaves(schoolId, {
        status: statusFilter || undefined,
        applicantType: applicantTypeFilter || undefined,
    });
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
                Leave Requests
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Review and process leave applications from students and teachers.
            </Typography>

            {/* Summary Cards */}
            {summary && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 6, sm: 2.4 }}>
                        <Card sx={{ textAlign: 'center' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="h4" fontWeight={600}>{summary.total}</Typography>
                                <Typography variant="body2" color="text.secondary">Total</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2.4 }}>
                        <Card sx={{ textAlign: 'center', bgcolor: 'warning.50' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="h4" fontWeight={600} color="warning.main">{summary.pending}</Typography>
                                <Typography variant="body2" color="text.secondary">Pending</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2.4 }}>
                        <Card sx={{ textAlign: 'center', bgcolor: 'success.50' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="h4" fontWeight={600} color="success.main">{summary.approved}</Typography>
                                <Typography variant="body2" color="text.secondary">Approved</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 2.4 }}>
                        <Card sx={{ textAlign: 'center', bgcolor: 'error.50' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="h4" fontWeight={600} color="error.main">{summary.rejected}</Typography>
                                <Typography variant="body2" color="text.secondary">Rejected</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 2.4 }}>
                        <Card sx={{ textAlign: 'center', bgcolor: 'grey.100' }}>
                            <CardContent sx={{ py: 2 }}>
                                <Typography variant="body2">{summary.students || 0} Students / {summary.teachers || 0} Teachers</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                <ToggleButtonGroup
                    value={statusFilter}
                    exclusive
                    onChange={(_, val) => setStatusFilter(val || '')}
                    size="small"
                >
                    <ToggleButton value="">All</ToggleButton>
                    <ToggleButton value="pending">Pending</ToggleButton>
                    <ToggleButton value="approved">Approved</ToggleButton>
                    <ToggleButton value="rejected">Rejected</ToggleButton>
                </ToggleButtonGroup>

                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Applicant Type</InputLabel>
                    <Select
                        value={applicantTypeFilter}
                        label="Applicant Type"
                        onChange={(e) => setApplicantTypeFilter(e.target.value)}
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="student">Students</MenuItem>
                        <MenuItem value="teacher">Teachers</MenuItem>
                    </Select>
                </FormControl>
            </Paper>

            {/* Table */}
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : error ? (
                <Alert severity="error">Failed to load leave requests</Alert>
            ) : leaves.length === 0 ? (
                <Alert severity="info">No leave requests found matching your filters.</Alert>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Leave ID</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Applicant</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Days</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {leaves.map((leave) => (
                                <TableRow key={leave.leaveId} hover>
                                    <TableCell>{leave.leaveId}</TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2">{leave.applicantName || leave.applicantId}</Typography>
                                            <Chip label={leave.applicantType} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ textTransform: 'capitalize' }}>{leave.leaveType}</TableCell>
                                    <TableCell>{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</TableCell>
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
                                        <IconButton size="small" onClick={() => setSelectedLeave(leave)} title="View">
                                            <ViewIcon fontSize="small" />
                                        </IconButton>
                                        {leave.status === 'pending' && (
                                            <>
                                                <IconButton
                                                    size="small"
                                                    color="success"
                                                    onClick={() => setProcessDialog({ leave, action: 'approve' })}
                                                    title="Approve"
                                                >
                                                    <ApproveIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => setProcessDialog({ leave, action: 'reject' })}
                                                    title="Reject"
                                                >
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
                                <Typography color="text.secondary">Leave ID:</Typography>
                                <Typography fontWeight={600}>{selectedLeave.leaveId}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">Applicant:</Typography>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography>{selectedLeave.applicantName || selectedLeave.applicantId}</Typography>
                                    <Chip label={selectedLeave.applicantType} size="small" sx={{ textTransform: 'capitalize' }} />
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">Type:</Typography>
                                <Chip label={selectedLeave.leaveType} size="small" sx={{ textTransform: 'capitalize' }} />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">Duration:</Typography>
                                <Typography>{formatDate(selectedLeave.startDate)} - {formatDate(selectedLeave.endDate)} ({selectedLeave.numberOfDays} days)</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">Status:</Typography>
                                <Chip label={selectedLeave.status} color={statusConfig[selectedLeave.status].color} size="small" />
                            </Box>
                            <Box>
                                <Typography color="text.secondary" gutterBottom>Reason:</Typography>
                                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}><Typography>{selectedLeave.reason}</Typography></Paper>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">Applied:</Typography>
                                <Typography>{new Date(selectedLeave.createdAt).toLocaleString()}</Typography>
                            </Box>
                            {selectedLeave.processedAt && (
                                <>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography color="text.secondary">Processed By:</Typography>
                                        <Typography>{selectedLeave.processedByName}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography color="text.secondary">Processed At:</Typography>
                                        <Typography>{new Date(selectedLeave.processedAt).toLocaleString()}</Typography>
                                    </Box>
                                    {selectedLeave.approvalRemarks && (
                                        <Box>
                                            <Typography color="text.secondary" gutterBottom>Remarks:</Typography>
                                            <Paper sx={{ p: 2, bgcolor: selectedLeave.status === 'approved' ? 'success.50' : 'error.50' }}>
                                                <Typography>{selectedLeave.approvalRemarks}</Typography>
                                            </Paper>
                                        </Box>
                                    )}
                                </>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    {selectedLeave?.status === 'pending' && (
                        <>
                            <Button color="success" onClick={() => { setSelectedLeave(null); setProcessDialog({ leave: selectedLeave, action: 'approve' }); }}>
                                Approve
                            </Button>
                            <Button color="error" onClick={() => { setSelectedLeave(null); setProcessDialog({ leave: selectedLeave, action: 'reject' }); }}>
                                Reject
                            </Button>
                        </>
                    )}
                    <Button onClick={() => setSelectedLeave(null)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Process Dialog */}
            <Dialog open={!!processDialog} onClose={() => { setProcessDialog(null); setRemarks(''); }} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ color: processDialog?.action === 'approve' ? 'success.main' : 'error.main' }}>
                    {processDialog?.action === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
                </DialogTitle>
                <DialogContent>
                    {processDialog && (
                        <Box sx={{ pt: 1 }}>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                <strong>Applicant:</strong> {processDialog.leave.applicantName || processDialog.leave.applicantId} ({processDialog.leave.applicantType})
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                <strong>Duration:</strong> {formatDate(processDialog.leave.startDate)} - {formatDate(processDialog.leave.endDate)} ({processDialog.leave.numberOfDays} days)
                            </Typography>
                            <TextField
                                label={processDialog.action === 'approve' ? 'Approval Remarks (Optional)' : 'Rejection Reason'}
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                multiline
                                rows={3}
                                fullWidth
                                placeholder={processDialog.action === 'reject' ? 'Please provide a reason for rejection...' : ''}
                            />
                        </Box>
                    )}
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

export default LeaveRequests;
