import { useState } from 'react';
import {
    Box,
    IconButton,
    Tooltip,
    Chip,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { Check as CheckIcon, Close as CloseIcon, Reply as ReplyIcon } from '@mui/icons-material';
import DataTable from '../../components/Table/DataTable';
import type { Column } from '../../components/Table/DataTable';
import { useGetAllRequests, useUpdateRequestStatus } from '../../queries/Request';
import type { Request } from '../../types';
import TokenService from '../../queries/token/tokenService';

const RequestsPage = () => {
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [replyDialogOpen, setReplyDialogOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
    const [adminReply, setAdminReply] = useState("");
    const [newStatus, setNewStatus] = useState<"approved" | "rejected">("approved");

    const schoolId = TokenService.getSchoolId() || '';
    const { data, isLoading, error } = useGetAllRequests(
        schoolId,
        statusFilter ? { status: statusFilter as "pending" | "approved" | "rejected" } : undefined
    );
    const updateMutation = useUpdateRequestStatus(schoolId);

    const requests = data?.data || [];

    const handleQuickUpdateStatus = async (request: Request, status: "approved" | "rejected") => {
        try {
            await updateMutation.mutateAsync({
                requestId: request.requestId,
                data: { status },
            });
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const openReplyDialog = (request: Request) => {
        setSelectedRequest(request);
        setAdminReply(request.adminReply || "");
        setNewStatus("approved");
        setReplyDialogOpen(true);
    };

    const handleSubmitReply = async () => {
        if (!selectedRequest) return;
        try {
            await updateMutation.mutateAsync({
                requestId: selectedRequest.requestId,
                data: { status: newStatus, adminReply },
            });
            setReplyDialogOpen(false);
            setSelectedRequest(null);
            setAdminReply("");
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const getRequestTypeLabel = (type: string) => {
        switch (type) {
            case 'email_change': return 'Email Change';
            case 'phone_change': return 'Phone Change';
            default: return 'General';
        }
    };

    const columns: Column<Request>[] = [
        { id: 'requestId', label: 'ID', minWidth: 100 },
        { id: 'userName', label: 'User', minWidth: 120 },
        {
            id: 'userType',
            label: 'Type',
            minWidth: 100,
            format: (value) => <Chip label={(value as string)?.replace('_', ' ')} size="small" />,
        },
        {
            id: 'requestType',
            label: 'Request',
            minWidth: 120,
            format: (value) => getRequestTypeLabel(value as string),
        },
        { id: 'message', label: 'Message', minWidth: 200 },
        {
            id: 'newValue',
            label: 'New Value',
            minWidth: 120,
            format: (value) => value || '-',
        },
        {
            id: 'adminReply',
            label: 'Reply',
            minWidth: 150,
            format: (value) => value || '-',
        },
        {
            id: 'status',
            label: 'Status',
            minWidth: 100,
            align: 'center',
            format: (value) => {
                const status = value as string;
                return (
                    <Chip
                        label={status}
                        size="small"
                        color={status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'warning'}
                    />
                );
            },
        },
        {
            id: 'actions',
            label: 'Actions',
            minWidth: 150,
            align: 'center',
            format: (_, row) => (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                    <Tooltip title="Reply & Update">
                        <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => { e.stopPropagation(); openReplyDialog(row); }}
                        >
                            <ReplyIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    {row.status === 'pending' && (
                        <>
                            <Tooltip title="Quick Approve">
                                <IconButton
                                    size="small"
                                    color="success"
                                    onClick={(e) => { e.stopPropagation(); handleQuickUpdateStatus(row, 'approved'); }}
                                    disabled={updateMutation.isPending}
                                >
                                    <CheckIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Quick Reject">
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={(e) => { e.stopPropagation(); handleQuickUpdateStatus(row, 'rejected'); }}
                                    disabled={updateMutation.isPending}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                </Box>
            ),
        },
    ];

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4" fontWeight={600} color="#1e293b" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                    User Requests
                </Typography>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Status Filter</InputLabel>
                    <Select
                        value={statusFilter}
                        label="Status Filter"
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <DataTable<Request>
                title=""
                columns={columns}
                data={requests}
                isLoading={isLoading}
                error={error ? (error as { message?: string })?.message || 'Failed to load requests' : null}
                emptyMessage="No requests found."
                getRowKey={(row) => row.requestId}
            />

            {/* Reply Dialog */}
            <Dialog open={replyDialogOpen} onClose={() => setReplyDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Reply to Request</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                    {selectedRequest && (
                        <>
                            <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                                <Typography variant="caption" color="text.secondary">Request from {selectedRequest.userName}</Typography>
                                <Typography variant="body2" fontWeight={500}>{selectedRequest.message}</Typography>
                                {selectedRequest.newValue && (
                                    <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                                        Requested Value: {selectedRequest.newValue}
                                    </Typography>
                                )}
                            </Box>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={newStatus}
                                    label="Status"
                                    onChange={(e) => setNewStatus(e.target.value as "approved" | "rejected")}
                                >
                                    <MenuItem value="approved">Approve</MenuItem>
                                    <MenuItem value="rejected">Reject</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                label="Admin Reply"
                                value={adminReply}
                                onChange={(e) => setAdminReply(e.target.value)}
                                multiline
                                rows={3}
                                fullWidth
                                placeholder="Enter your reply to the user..."
                            />
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setReplyDialogOpen(false)} color="inherit">Cancel</Button>
                    <Button
                        onClick={handleSubmitReply}
                        variant="contained"
                        disabled={updateMutation.isPending}
                    >
                        {updateMutation.isPending ? 'Submitting...' : 'Submit'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default RequestsPage;
