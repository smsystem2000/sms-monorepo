import { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    FormControlLabel,
    FormGroup,
    IconButton,
    Tooltip,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableContainer,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Schedule as ScheduleIcon,
} from '@mui/icons-material';
import {
    useGetActiveConfig,
    useCreateConfig,
    useUpdateConfig,
    useUpsertPeriod,
    useRemovePeriod,
    useRemoveShift,
} from '../../../queries/Timetable';
import type { Period, Shift } from '../../../types/timetable.types';
import TokenService from '../../../queries/token/tokenService';

const DAYS_OF_WEEK = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
];

const PERIOD_TYPES = [
    { value: 'regular', label: 'Regular Period' },
    { value: 'break', label: 'Break' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'assembly', label: 'Assembly' },
    { value: 'pt', label: 'PT/Sports' },
    { value: 'lab', label: 'Lab (Double Period)' },
    { value: 'free', label: 'Free/Study' },
];

interface PeriodDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (period: Period) => void;
    editData?: Period | null;
    shifts: Shift[];
}

const PeriodDialog = ({ open, onClose, onSave, editData, shifts }: PeriodDialogProps) => {
    const [formData, setFormData] = useState<Partial<Period>>({
        periodNumber: editData?.periodNumber || 1,
        name: editData?.name || '',
        startTime: editData?.startTime || '08:00',
        endTime: editData?.endTime || '08:45',
        duration: editData?.duration || 45,
        type: editData?.type || 'regular',
        shiftId: editData?.shiftId || '',
        isDoublePeriod: editData?.isDoublePeriod || false,
    });

    const handleChange = (field: keyof Period, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));

        // Auto-calculate duration when times change
        if (field === 'startTime' || field === 'endTime') {
            const start = field === 'startTime' ? value : formData.startTime;
            const end = field === 'endTime' ? value : formData.endTime;
            if (start && end) {
                const [sh, sm] = start.split(':').map(Number);
                const [eh, em] = end.split(':').map(Number);
                const duration = (eh * 60 + em) - (sh * 60 + sm);
                if (duration > 0) {
                    setFormData((prev) => ({ ...prev, duration }));
                }
            }
        }
    };

    const handleSubmit = () => {
        onSave(formData as Period);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{editData ? 'Edit Period' : 'Add Period'}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                            <TextField
                                label="Period Number"
                                type="number"
                                fullWidth
                                value={formData.periodNumber}
                                onChange={(e) => handleChange('periodNumber', parseInt(e.target.value))}
                            />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextField
                                label="Period Name"
                                fullWidth
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="e.g., Period 1, Break, Lunch"
                            />
                        </Grid>
                    </Grid>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 4 }}>
                            <TextField
                                label="Start Time"
                                type="time"
                                fullWidth
                                value={formData.startTime}
                                onChange={(e) => handleChange('startTime', e.target.value)}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                            <TextField
                                label="End Time"
                                type="time"
                                fullWidth
                                value={formData.endTime}
                                onChange={(e) => handleChange('endTime', e.target.value)}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                            <TextField
                                label="Duration (min)"
                                type="number"
                                fullWidth
                                value={formData.duration}
                                onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                            />
                        </Grid>
                    </Grid>
                    <FormControl fullWidth>
                        <InputLabel>Period Type</InputLabel>
                        <Select
                            value={formData.type}
                            label="Period Type"
                            onChange={(e) => handleChange('type', e.target.value)}
                        >
                            {PERIOD_TYPES.map((t) => (
                                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {shifts.length > 0 && (
                        <FormControl fullWidth>
                            <InputLabel>Shift (Optional)</InputLabel>
                            <Select
                                value={formData.shiftId || ''}
                                label="Shift (Optional)"
                                onChange={(e) => handleChange('shiftId', e.target.value)}
                            >
                                <MenuItem value="">No Shift</MenuItem>
                                {shifts.map((s) => (
                                    <MenuItem key={s.shiftId} value={s.shiftId}>{s.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    {formData.type === 'lab' && (
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={formData.isDoublePeriod}
                                    onChange={(e) => handleChange('isDoublePeriod', e.target.checked)}
                                />
                            }
                            label="This is a double period"
                        />
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained">{editData ? 'Update' : 'Add'}</Button>
            </DialogActions>
        </Dialog>
    );
};

const TimetableConfigPage = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const { data: configData, isLoading, error } = useGetActiveConfig(schoolId);
    const createConfig = useCreateConfig(schoolId);
    const [periodDialogOpen, setPeriodDialogOpen] = useState(false);
    const [editPeriod, setEditPeriod] = useState<Period | null>(null);
    const [newAcademicYear, setNewAcademicYear] = useState('');
    const [workingDays, setWorkingDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);

    const config = configData?.data;
    const upsertPeriod = useUpsertPeriod(schoolId, config?.configId || '');
    const removePeriod = useRemovePeriod(schoolId, config?.configId || '');
    const removeShift = useRemoveShift(schoolId, config?.configId || '');
    const updateConfig = useUpdateConfig(schoolId, config?.configId || '');

    const handleCreateConfig = async () => {
        if (!newAcademicYear) return;
        try {
            await createConfig.mutateAsync({
                academicYear: newAcademicYear,
                workingDays,
                periods: [],
                shifts: [],
            });
            setNewAcademicYear('');
        } catch (err) {
            console.error('Failed to create config:', err);
        }
    };

    const handleDayToggle = async (day: string) => {
        if (!config) return;
        const newDays = config.workingDays.includes(day)
            ? config.workingDays.filter((d) => d !== day)
            : [...config.workingDays, day];
        try {
            await updateConfig.mutateAsync({ workingDays: newDays });
        } catch (err) {
            console.error('Failed to update working days:', err);
        }
    };

    const handleAddPeriod = () => {
        setEditPeriod(null);
        setPeriodDialogOpen(true);
    };

    const handleEditPeriod = (period: Period) => {
        setEditPeriod(period);
        setPeriodDialogOpen(true);
    };

    const handleSavePeriod = async (period: Period) => {
        try {
            await upsertPeriod.mutateAsync(period);
        } catch (err) {
            console.error('Failed to save period:', err);
        }
    };

    const handleDeletePeriod = async (periodNumber: number) => {
        try {
            await removePeriod.mutateAsync(periodNumber);
        } catch (err) {
            console.error('Failed to delete period:', err);
        }
    };

    const getTypeChipColor = (type: string) => {
        switch (type) {
            case 'regular': return 'primary';
            case 'break': return 'warning';
            case 'lunch': return 'warning';
            case 'assembly': return 'info';
            case 'pt': return 'success';
            case 'lab': return 'secondary';
            case 'free': return 'default';
            default: return 'default';
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Only show error for non-404 errors (404 means no config exists, which is valid)
    const isNotFoundError = error?.message?.includes('No active timetable configuration') ||
        error?.message?.includes('404') ||
        (error as any)?.response?.status === 404;
    if (error && !isNotFoundError) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load timetable configuration</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                    <Typography variant="h5" fontWeight={600}>Timetable Configuration</Typography>
                </Box>
            </Box>

            {/* No Config - Create New */}
            {!config && (
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        No active timetable configuration found. Create one to get started.
                    </Alert>
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                label="Academic Year"
                                fullWidth
                                value={newAcademicYear}
                                onChange={(e) => setNewAcademicYear(e.target.value)}
                                placeholder="e.g., 2025-2026"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormGroup row>
                                {DAYS_OF_WEEK.slice(0, 6).map((day) => (
                                    <FormControlLabel
                                        key={day.value}
                                        control={
                                            <Checkbox
                                                checked={workingDays.includes(day.value)}
                                                onChange={() => {
                                                    setWorkingDays(
                                                        workingDays.includes(day.value)
                                                            ? workingDays.filter((d) => d !== day.value)
                                                            : [...workingDays, day.value]
                                                    );
                                                }}
                                            />
                                        }
                                        label={day.label.slice(0, 3)}
                                    />
                                ))}
                            </FormGroup>
                        </Grid>
                        <Grid size={{ xs: 12, md: 2 }}>
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={handleCreateConfig}
                                disabled={!newAcademicYear || createConfig.isPending}
                                startIcon={createConfig.isPending ? <CircularProgress size={20} /> : <SaveIcon />}
                            >
                                Create
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {/* Existing Config */}
            {config && (
                <>
                    {/* Config Info */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Typography variant="subtitle2" color="text.secondary">Academic Year</Typography>
                                <Typography variant="h6">{config.academicYear}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Typography variant="subtitle2" color="text.secondary">Config ID</Typography>
                                <Typography variant="body1">{config.configId}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                                <Chip
                                    label={config.isActive ? 'Active' : 'Inactive'}
                                    color={config.isActive ? 'success' : 'default'}
                                    size="small"
                                />
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Working Days */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Typography variant="h6">Working Days</Typography>
                            {updateConfig.isPending && <CircularProgress size={20} />}
                        </Box>
                        <FormGroup row>
                            {DAYS_OF_WEEK.map((day) => (
                                <FormControlLabel
                                    key={day.value}
                                    control={
                                        <Checkbox
                                            checked={config.workingDays.includes(day.value)}
                                            onChange={() => handleDayToggle(day.value)}
                                            disabled={updateConfig.isPending}
                                        />
                                    }
                                    label={day.label}
                                />
                            ))}
                        </FormGroup>
                    </Paper>

                    {/* Periods */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Period Structure</Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleAddPeriod}
                            >
                                Add Period
                            </Button>
                        </Box>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>#</TableCell>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Start Time</TableCell>
                                        <TableCell>End Time</TableCell>
                                        <TableCell>Duration</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell align="center">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {config.periods.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center">
                                                <Typography color="text.secondary">
                                                    No periods configured. Click 'Add Period' to start.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        config.periods.map((period) => (
                                            <TableRow key={period.periodNumber} hover>
                                                <TableCell>{period.periodNumber}</TableCell>
                                                <TableCell>{period.name}</TableCell>
                                                <TableCell>{period.startTime}</TableCell>
                                                <TableCell>{period.endTime}</TableCell>
                                                <TableCell>{period.duration} min</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={PERIOD_TYPES.find((t) => t.value === period.type)?.label || period.type}
                                                        size="small"
                                                        color={getTypeChipColor(period.type) as any}
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Tooltip title="Edit">
                                                        <IconButton size="small" onClick={() => handleEditPeriod(period)}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDeletePeriod(period.periodNumber)}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>

                    {/* Shifts (Optional) */}
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>Shifts (Optional)</Typography>
                        {config.shifts.length === 0 ? (
                            <Typography color="text.secondary">
                                No shifts configured. Add shifts if your school has multiple timing shifts (e.g., Morning/Afternoon).
                            </Typography>
                        ) : (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {config.shifts.map((shift) => (
                                    <Chip
                                        key={shift.shiftId}
                                        label={`${shift.name} (${shift.startTime} - ${shift.endTime})`}
                                        onDelete={() => removeShift.mutateAsync(shift.shiftId)}
                                        color="primary"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                        )}
                    </Paper>
                </>
            )}

            {/* Period Dialog */}
            <PeriodDialog
                open={periodDialogOpen}
                onClose={() => setPeriodDialogOpen(false)}
                onSave={handleSavePeriod}
                editData={editPeriod}
                shifts={config?.shifts || []}
            />
        </Box>
    );
};

export default TimetableConfigPage;
