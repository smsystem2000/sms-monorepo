import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    Card,
    CardContent,
    Chip,
    Grid,
} from '@mui/material';
import {
    Send as SendIcon,
    CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useApplyLeave } from '../../../queries/Leave';
import TokenService from '../../../queries/token/tokenService';
import type { LeaveType } from '../../../types';

const leaveTypes: { value: LeaveType; label: string; description: string }[] = [
    { value: 'casual', label: 'Casual Leave', description: 'For personal matters' },
    { value: 'sick', label: 'Sick Leave', description: 'For health issues' },
    { value: 'emergency', label: 'Emergency Leave', description: 'For urgent situations' },
    { value: 'personal', label: 'Personal Leave', description: 'For personal reasons' },
    { value: 'other', label: 'Other', description: 'Any other reason' },
];

const TeacherApplyLeave: React.FC = () => {
    const navigate = useNavigate();
    const schoolId = TokenService.getSchoolId() || '';

    const [formData, setFormData] = useState({
        leaveType: '' as LeaveType | '',
        startDate: '',
        endDate: '',
        reason: '',
    });
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const applyMutation = useApplyLeave(schoolId);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.leaveType) newErrors.leaveType = 'Please select leave type';
        if (!formData.startDate) newErrors.startDate = 'Start date is required';
        if (!formData.endDate) newErrors.endDate = 'End date is required';
        if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
            newErrors.endDate = 'End date cannot be before start date';
        }
        if (!formData.reason.trim()) newErrors.reason = 'Please provide a reason';
        if (formData.reason.trim().length < 10) newErrors.reason = 'Reason must be at least 10 characters';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            await applyMutation.mutateAsync({
                leaveType: formData.leaveType as LeaveType,
                startDate: formData.startDate,
                endDate: formData.endDate,
                reason: formData.reason.trim(),
            });
            setSubmitted(true);
        } catch {
            // Error handled by mutation
        }
    };

    const calculateDays = () => {
        if (!formData.startDate || !formData.endDate) return 0;
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    };

    if (submitted) {
        return (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Card sx={{ maxWidth: 500, mx: 'auto', textAlign: 'center', p: 4 }}>
                    <SuccessIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                    <Typography variant="h5" gutterBottom fontWeight={600}>
                        Leave Application Submitted!
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                        Your leave request has been sent for approval.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button variant="outlined" onClick={() => navigate('/teacher/leave/my')}>
                            View My Leaves
                        </Button>
                        <Button variant="contained" onClick={() => { setSubmitted(false); setFormData({ leaveType: '', startDate: '', endDate: '', reason: '' }); }}>
                            Apply Another
                        </Button>
                    </Box>
                </Card>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
                Apply for Leave
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 3 }}>
                        {applyMutation.isError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {(applyMutation.error as { message?: string })?.message || 'Failed to submit'}
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <FormControl fullWidth error={!!errors.leaveType}>
                                    <InputLabel>Leave Type</InputLabel>
                                    <Select
                                        value={formData.leaveType}
                                        label="Leave Type"
                                        onChange={(e) => handleChange('leaveType', e.target.value)}
                                    >
                                        {leaveTypes.map((type) => (
                                            <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <TextField
                                        type="date"
                                        label="Start Date"
                                        value={formData.startDate}
                                        onChange={(e) => handleChange('startDate', e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{ min: new Date().toLocaleDateString('en-CA') }}
                                        error={!!errors.startDate}
                                        helperText={errors.startDate}
                                        fullWidth
                                    />
                                    <TextField
                                        type="date"
                                        label="End Date"
                                        value={formData.endDate}
                                        onChange={(e) => handleChange('endDate', e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{ min: formData.startDate || new Date().toLocaleDateString('en-CA') }}
                                        error={!!errors.endDate}
                                        helperText={errors.endDate}
                                        fullWidth
                                    />
                                </Box>

                                <TextField
                                    label="Reason for Leave"
                                    value={formData.reason}
                                    onChange={(e) => handleChange('reason', e.target.value)}
                                    multiline
                                    rows={4}
                                    error={!!errors.reason}
                                    helperText={errors.reason}
                                    fullWidth
                                />

                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    startIcon={applyMutation.isPending ? <CircularProgress size={20} /> : <SendIcon />}
                                    disabled={applyMutation.isPending}
                                >
                                    {applyMutation.isPending ? 'Submitting...' : 'Submit Request'}
                                </Button>
                            </Box>
                        </form>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Summary</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography color="text.secondary">Type:</Typography>
                                    <Chip
                                        label={formData.leaveType ? leaveTypes.find(t => t.value === formData.leaveType)?.label : '-'}
                                        size="small"
                                    />
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography color="text.secondary">Days:</Typography>
                                    <Typography fontWeight={600}>{calculateDays()}</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default TeacherApplyLeave;
