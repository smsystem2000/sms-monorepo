import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Chip,
    Alert,
    Skeleton,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
} from '@mui/material';
import {
    History as HistoryIcon,
    Add as AddIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useChildSelector } from '../../../context/ChildSelectorContext';
import { useGetMyLeaves } from '../../../queries/Leave';
import TokenService from '../../../queries/token/tokenService';

interface LeaveRequest {
    leaveId: string;
    startDate: string;
    endDate: string;
    leaveType: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    createdAt: string;
}

const ParentLeaveHistory: React.FC = () => {
    const navigate = useNavigate();
    const schoolId = TokenService.getSchoolId() || '';
    const { selectedChild, isLoading: loadingChild } = useChildSelector();

    const [tabValue, setTabValue] = useState(0);
    const statusFilter = tabValue === 1 ? 'pending' : tabValue === 2 ? 'approved' : tabValue === 3 ? 'rejected' : undefined;

    const { data, isLoading, error } = useGetMyLeaves(schoolId, {
        status: statusFilter,
    });

    const responseData = data?.data;
    const leaves: LeaveRequest[] = Array.isArray(responseData) ? responseData : (responseData?.leaves || []);

    const getStatusChip = (status: string) => {
        switch (status) {
            case 'approved':
                return <Chip size="small" icon={<CheckCircleIcon />} label="Approved" color="success" />;
            case 'rejected':
                return <Chip size="small" icon={<CancelIcon />} label="Rejected" color="error" />;
            case 'pending':
                return <Chip size="small" icon={<AccessTimeIcon />} label="Pending" color="warning" />;
            case 'cancelled':
                return <Chip size="small" label="Cancelled" color="default" />;
            default:
                return <Chip size="small" label={status} />;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
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
                <Alert severity="info">Please select a child to view their leave history.</Alert>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load leave history. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HistoryIcon color="primary" />
                        <Typography variant="h4" fontWeight={600}>
                            Leave History
                        </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                        {selectedChild ? `${selectedChild.firstName}'s leave requests` : 'Loading...'}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/parent/leave/apply')}
                >
                    Apply Leave
                </Button>
            </Box>

            <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
                <Tab label="All" />
                <Tab label="Pending" />
                <Tab label="Approved" />
                <Tab label="Rejected" />
            </Tabs>

            <Card>
                {isLoading || loadingChild ? (
                    <CardContent>
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} variant="rectangular" height={50} sx={{ mb: 1, borderRadius: 1 }} />
                        ))}
                    </CardContent>
                ) : leaves.length === 0 ? (
                    <CardContent sx={{ textAlign: 'center', py: 6 }}>
                        <HistoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            No leave requests found
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            sx={{ mt: 2 }}
                            onClick={() => navigate('/parent/leave/apply')}
                        >
                            Apply for Leave
                        </Button>
                    </CardContent>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Dates</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Reason</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Applied On</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {leaves.map((leave: LeaveRequest) => (
                                    <TableRow key={leave.leaveId}>
                                        <TableCell>
                                            {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={leave.leaveType.replace('_', ' ')}
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    maxWidth: 200,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {leave.reason}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {getStatusChip(leave.status)}
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(leave.createdAt)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Card>
        </Box>
    );
};

export default ParentLeaveHistory;
