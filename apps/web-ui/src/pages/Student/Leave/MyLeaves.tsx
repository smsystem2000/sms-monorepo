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
    ToggleButton,
    ToggleButtonGroup,
    Card,
    CardContent,
    Grid,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Pending as PendingIcon,
    CheckCircle as ApprovedIcon,
    Cancel as RejectedIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetMyLeaves, useCancelLeave } from '../../../queries/Leave';
import TokenService from '../../../queries/token/tokenService';
import type { LeaveRequest, LeaveStatus } from '../../../types';

const statusConfig: Record<LeaveStatus, { color: 'warning' | 'success' | 'error'; icon: React.ReactNode }> = {
    pending: { color: 'warning', icon: <PendingIcon /> },
    approved: { color: 'success', icon: <ApprovedIcon /> },
    rejected: { color: 'error', icon: <RejectedIcon /> },
};

const MyLeaves: React.FC = () => {
    const navigate = useNavigate();
    const schoolId = TokenService.getSchoolId() || '';

    const [statusFilter, setStatusFilter] = useState<string>('');
    const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const { data, isLoading, error } = useGetMyLeaves(schoolId, { status: statusFilter || undefined });
    const cancelMutation = useCancelLeave(schoolId);

    const leaves = data?.data?.leaves || [];
    const summary = data?.data?.summary;

    const handleCancel = async (leaveId: string) => {
        try {
            await cancelMutation.mutateAsync(leaveId);
            setDeleteConfirm(null);
        } catch {
            // Error handled by mutation
        }
    };

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h5" fontWeight={600}>
                    My Leave Requests
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/student/leave/apply')}
                >
                    Apply for Leave
                </Button>
            </Box>

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
            </Paper>

            {/* Table */}
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : error ? (
                <Alert severity="error">Failed to load leave requests</Alert>
            ) : leaves.length === 0 ? (
                <Alert severity="info">No leave requests found. Click "Apply for Leave" to create one.</Alert>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Leave ID</TableCell>
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
                                    <TableCell>{leave.leaveId}</TableCell>
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
                                            sx={{ textTransform: 'capitalize' }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton size="small" onClick={() => setSelectedLeave(leave)}>
                                            <ViewIcon fontSize="small" />
                                        </IconButton>
                                        {leave.status === 'pending' && (
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => setDeleteConfirm(leave.leaveId)}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
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
                                <Typography color="text.secondary">Type:</Typography>
                                <Chip label={selectedLeave.leaveType} size="small" sx={{ textTransform: 'capitalize' }} />
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">Duration:</Typography>
                                <Typography>{formatDate(selectedLeave.startDate)} to {formatDate(selectedLeave.endDate)} ({selectedLeave.numberOfDays} days)</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">Status:</Typography>
                                <Chip
                                    icon={statusConfig[selectedLeave.status].icon as React.ReactElement}
                                    label={selectedLeave.status}
                                    color={statusConfig[selectedLeave.status].color}
                                    size="small"
                                />
                            </Box>
                            <Box>
                                <Typography color="text.secondary" gutterBottom>Reason:</Typography>
                                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                                    <Typography>{selectedLeave.reason}</Typography>
                                </Paper>
                            </Box>
                            {selectedLeave.approvalRemarks && (
                                <Box>
                                    <Typography color="text.secondary" gutterBottom>Admin Remarks:</Typography>
                                    <Paper sx={{ p: 2, bgcolor: selectedLeave.status === 'approved' ? 'success.50' : 'error.50' }}>
                                        <Typography>{selectedLeave.approvalRemarks}</Typography>
                                    </Paper>
                                </Box>
                            )}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography color="text.secondary">Applied On:</Typography>
                                <Typography>{new Date(selectedLeave.createdAt).toLocaleString()}</Typography>
                            </Box>
                            {selectedLeave.processedAt && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography color="text.secondary">Processed On:</Typography>
                                    <Typography>{new Date(selectedLeave.processedAt).toLocaleString()}</Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedLeave(null)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Cancel Confirmation Dialog */}
            <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
                <DialogTitle>Cancel Leave Request?</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to cancel this leave request? This action cannot be undone.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirm(null)}>No, Keep It</Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={() => deleteConfirm && handleCancel(deleteConfirm)}
                        disabled={cancelMutation.isPending}
                    >
                        {cancelMutation.isPending ? 'Cancelling...' : 'Yes, Cancel'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MyLeaves;
