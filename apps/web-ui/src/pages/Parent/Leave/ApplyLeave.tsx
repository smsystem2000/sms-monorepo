import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    MenuItem,
    Alert,
    CircularProgress,
    Grid,
} from '@mui/material';
import {
    Send as SendIcon,
    ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useNavigate } from 'react-router-dom';
import { useChildSelector } from '../../../context/ChildSelectorContext';
import { useApplyLeave } from '../../../queries/Leave';
import TokenService from '../../../queries/token/tokenService';
import type { LeaveType } from '../../../types';

const leaveTypes: { value: LeaveType; label: string }[] = [
    { value: 'sick', label: 'Sick Leave' },
    { value: 'casual', label: 'Casual Leave' },
    { value: 'emergency', label: 'Emergency Leave' },
    { value: 'personal', label: 'Personal Leave' },
    { value: 'other', label: 'Other' },
];

// Custom styling for date pickers
const datePickerSlotProps = {
    textField: {
        fullWidth: true,
        variant: 'outlined' as const,
        sx: {
            '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: 'background.paper',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    backgroundColor: 'action.hover',
                    '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                    },
                },
                '&.Mui-focused': {
                    backgroundColor: 'background.paper',
                    boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)',
                },
            },
            '& .MuiInputLabel-root': {
                fontWeight: 500,
            },
        },
    },
    actionBar: {
        actions: ['clear', 'today'] as ('clear' | 'today' | 'cancel' | 'accept')[],
    },
    popper: {
        sx: {
            '& .MuiPaper-root': {
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            },
            '& .MuiDayCalendar-weekDayLabel': {
                fontWeight: 600,
                color: 'primary.main',
            },
            '& .MuiPickersDay-root': {
                borderRadius: 2,
                '&:hover': {
                    backgroundColor: 'primary.light',
                },
                '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    '&:hover': {
                        backgroundColor: 'primary.dark',
                    },
                },
            },
        },
    },
};

const ParentApplyLeave: React.FC = () => {
    const navigate = useNavigate();
    const schoolId = TokenService.getSchoolId() || '';
    const { selectedChild, children, isLoading: loadingChildren } = useChildSelector();

    const [formData, setFormData] = useState({
        studentId: selectedChild?.studentId || '',
        leaveType: '' as LeaveType | '',
        reason: '',
    });
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const applyLeave = useApplyLeave(schoolId);

    const handleChange = (field: string) => (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setFormData(prev => ({ ...prev, [field]: event.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.studentId || !formData.leaveType || !formData.reason || !startDate || !endDate) {
            setError('Please fill in all required fields');
            return;
        }

        if (endDate < startDate) {
            setError('End date cannot be before start date');
            return;
        }

        try {
            await applyLeave.mutateAsync({
                leaveType: formData.leaveType as LeaveType,
                reason: formData.reason,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            });
            setSuccess(true);
            setTimeout(() => {
                navigate('/parent/leave/history');
            }, 1500);
        } catch (err: unknown) {
            setError((err as Error)?.message || 'Failed to apply for leave');
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/parent/dashboard')}
                    sx={{ mb: 2 }}
                >
                    Back to Dashboard
                </Button>

                <Typography variant="h4" fontWeight={600} gutterBottom>
                    Apply for Leave
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Submit a leave request for your child
                </Typography>

                {success && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        Leave request submitted successfully! Redirecting...
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Card>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Select Child *"
                                        value={formData.studentId}
                                        onChange={handleChange('studentId')}
                                        disabled={loadingChildren}
                                    >
                                        {children.map((child) => (
                                            <MenuItem key={child.studentId} value={child.studentId}>
                                                {child.firstName} {child.lastName} - {child.className || child.class}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Leave Type *"
                                        value={formData.leaveType}
                                        onChange={handleChange('leaveType')}
                                    >
                                        {leaveTypes.map((type) => (
                                            <MenuItem key={type.value} value={type.value}>
                                                {type.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <DatePicker
                                        label="Start Date *"
                                        value={startDate}
                                        onChange={(date: Date | null) => setStartDate(date)}
                                        minDate={new Date()}
                                        slotProps={datePickerSlotProps}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <DatePicker
                                        label="End Date *"
                                        value={endDate}
                                        onChange={(date: Date | null) => setEndDate(date)}
                                        minDate={startDate || new Date()}
                                        slotProps={datePickerSlotProps}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={4}
                                        label="Reason *"
                                        value={formData.reason}
                                        onChange={handleChange('reason')}
                                        placeholder="Please provide a detailed reason for the leave..."
                                    />
                                </Grid>

                                <Grid size={{ xs: 12 }}>
                                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="outlined"
                                            onClick={() => navigate('/parent/dashboard')}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            startIcon={applyLeave.isPending ? <CircularProgress size={20} /> : <SendIcon />}
                                            disabled={applyLeave.isPending}
                                        >
                                            Submit Request
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </form>
                    </CardContent>
                </Card>
            </Box>
        </LocalizationProvider>
    );
};

export default ParentApplyLeave;
