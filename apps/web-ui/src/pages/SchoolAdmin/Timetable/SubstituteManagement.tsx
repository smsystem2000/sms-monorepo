import { useState } from 'react';
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Tabs,
    Tab,
} from '@mui/material';
import {
    Add as AddIcon,
    Cancel as CancelIcon,
    History as HistoryIcon,
    Today as TodayIcon,
} from '@mui/icons-material';
import {
    useGetSubstitutesForDate,
    useGetSubstituteHistory,
    useCreateSubstitute,
    useCancelSubstitute,
    useGetActiveConfig,
} from '../../../queries/Timetable';
import { useGetTeachers } from '../../../queries/Teacher';
import { useGetClasses } from '../../../queries/Class';
import TokenService from '../../../queries/token/tokenService';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    );
}

const SubstituteManagement = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const [tabValue, setTabValue] = useState(0);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    // Form state for creating substitute
    const [formData, setFormData] = useState({
        originalTeacherId: '',
        substituteTeacherId: '',
        classId: '',
        sectionId: '',
        dayOfWeek: '',
        periodNumber: 0,
        reason: '',
    });

    // Data fetching
    const { data: configData } = useGetActiveConfig(schoolId);
    const { data: substitutesData, isLoading: substitutesLoading } = useGetSubstitutesForDate(schoolId, selectedDate);
    const { data: historyData, isLoading: historyLoading } = useGetSubstituteHistory(schoolId, { limit: 50 });
    const { data: teachersData } = useGetTeachers(schoolId);
    const { data: classesData } = useGetClasses(schoolId);

    const createSubstitute = useCreateSubstitute(schoolId);
    const cancelSubstitute = useCancelSubstitute(schoolId);

    const config = configData?.data;
    const substitutes = substitutesData?.data || [];
    const history = historyData?.data || [];
    const teachers = teachersData?.data || [];
    const classes = classesData?.data || [];

    // Get sections for selected class
    const selectedClassObj = classes.find((c: any) => c.classId === formData.classId);
    const sections = selectedClassObj?.sections || [];

    // Regular periods
    const regularPeriods = config?.periods?.filter((p: any) => p.type === 'regular') || [];

    const handleCreateSubstitute = async () => {
        try {
            // Send all form data - backend will find entry based on class/section/day/period
            await createSubstitute.mutateAsync({
                originalEntryId: '', // Backend will find entry based on other fields
                substituteTeacherId: formData.substituteTeacherId,
                date: selectedDate,
                reason: formData.reason,
                // Alternative fields to find the timetable entry
                classId: formData.classId,
                sectionId: formData.sectionId,
                dayOfWeek: formData.dayOfWeek,
                periodNumber: formData.periodNumber,
            } as any);
            setCreateDialogOpen(false);
            setFormData({
                originalTeacherId: '',
                substituteTeacherId: '',
                classId: '',
                sectionId: '',
                dayOfWeek: '',
                periodNumber: 0,
                reason: '',
            });
        } catch (err) {
            console.error('Failed to create substitute:', err);
        }
    };

    const handleCancelSubstitute = async (substituteId: string) => {
        try {
            await cancelSubstitute.mutateAsync(substituteId);
        } catch (err) {
            console.error('Failed to cancel substitute:', err);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'confirmed': return 'success';
            case 'completed': return 'info';
            case 'cancelled': return 'error';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h5" fontWeight={600}>Substitute Management</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateDialogOpen(true)}
                    size="small"
                >
                    Assign Substitute
                </Button>
            </Box>

            {/* Summary Card */}
            <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TodayIcon />
                        <Typography variant="h6">Today's Substitutes</Typography>
                    </Box>
                    <Typography variant="h3" fontWeight={600}>
                        {substitutes.filter((s: any) => s.date === new Date().toISOString().split('T')[0]).length}
                    </Typography>
                    <Typography variant="body2">Active substitute assignments for today</Typography>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Paper sx={{ mb: 2 }}>
                <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                    <Tab icon={<TodayIcon />} label="By Date" iconPosition="start" />
                    <Tab icon={<HistoryIcon />} label="History" iconPosition="start" />
                </Tabs>
            </Paper>

            {/* Tab Panels */}
            <TabPanel value={tabValue} index={0}>
                {/* Date Selector */}
                <Paper sx={{ p: 2, mb: 2 }}>
                    <TextField
                        type="date"
                        label="Select Date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                    />
                </Paper>

                {/* Substitutes Table */}
                <Paper sx={{ p: 2 }}>
                    {substitutesLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : substitutes.length === 0 ? (
                        <Alert severity="info">No substitute assignments for this date.</Alert>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                                        <TableCell><strong>Original Teacher</strong></TableCell>
                                        <TableCell><strong>Substitute</strong></TableCell>
                                        <TableCell><strong>Class</strong></TableCell>
                                        <TableCell><strong>Period</strong></TableCell>
                                        <TableCell><strong>Reason</strong></TableCell>
                                        <TableCell><strong>Status</strong></TableCell>
                                        <TableCell><strong>Actions</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {substitutes.map((sub: any) => (
                                        <TableRow key={sub.substituteId} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                            <TableCell>{sub.originalTeacher?.name || sub.originalTeacherId}</TableCell>
                                            <TableCell>{sub.substituteTeacher?.name || sub.substituteTeacherId}</TableCell>
                                            <TableCell>
                                                {sub.entry?.classId || '-'} {sub.entry?.sectionId || ''}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={`${sub.entry?.dayOfWeek?.charAt(0).toUpperCase()}${sub.entry?.dayOfWeek?.slice(1) || ''} - Period ${sub.entry?.periodNumber || '?'}`}
                                                    size="small"
                                                    color="primary"
                                                />
                                            </TableCell>
                                            <TableCell>{sub.reason || '-'}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={sub.status?.charAt(0).toUpperCase() + sub.status?.slice(1)}
                                                    size="small"
                                                    color={getStatusColor(sub.status)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {sub.status === 'pending' && (
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        startIcon={<CancelIcon />}
                                                        onClick={() => handleCancelSubstitute(sub.substituteId)}
                                                        disabled={cancelSubstitute.isPending}
                                                    >
                                                        Cancel
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                {/* History Table */}
                <Paper sx={{ p: 2 }}>
                    {historyLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : history.length === 0 ? (
                        <Alert severity="info">No substitute history found.</Alert>
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                                        <TableCell><strong>Date</strong></TableCell>
                                        <TableCell><strong>Original Teacher</strong></TableCell>
                                        <TableCell><strong>Substitute</strong></TableCell>
                                        <TableCell><strong>Class</strong></TableCell>
                                        <TableCell><strong>Period</strong></TableCell>
                                        <TableCell><strong>Status</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {history.map((sub: any) => (
                                        <TableRow key={sub.substituteId} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                                            <TableCell>{new Date(sub.date).toLocaleDateString()}</TableCell>
                                            <TableCell>{sub.originalTeacher?.name || sub.originalTeacherId}</TableCell>
                                            <TableCell>{sub.substituteTeacher?.name || sub.substituteTeacherId}</TableCell>
                                            <TableCell>{sub.class?.name || sub.classId} {sub.section?.name || ''}</TableCell>
                                            <TableCell>
                                                <Chip label={`Period ${sub.periodNumber}`} size="small" color="primary" />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={sub.status?.charAt(0).toUpperCase() + sub.status?.slice(1)}
                                                    size="small"
                                                    color={getStatusColor(sub.status)}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            </TabPanel>

            {/* Create Substitute Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Assign Substitute Teacher</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Original Teacher (Absent)</InputLabel>
                            <Select
                                value={formData.originalTeacherId}
                                label="Original Teacher (Absent)"
                                onChange={(e) => setFormData({ ...formData, originalTeacherId: e.target.value })}
                            >
                                {teachers.map((t: any) => (
                                    <MenuItem key={t.teacherId} value={t.teacherId}>
                                        {t.firstName} {t.lastName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                            <InputLabel>Substitute Teacher</InputLabel>
                            <Select
                                value={formData.substituteTeacherId}
                                label="Substitute Teacher"
                                onChange={(e) => setFormData({ ...formData, substituteTeacherId: e.target.value })}
                            >
                                {teachers
                                    .filter((t: any) => t.teacherId !== formData.originalTeacherId)
                                    .map((t: any) => (
                                        <MenuItem key={t.teacherId} value={t.teacherId}>
                                            {t.firstName} {t.lastName}
                                        </MenuItem>
                                    ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                            <InputLabel>Class</InputLabel>
                            <Select
                                value={formData.classId}
                                label="Class"
                                onChange={(e) => setFormData({ ...formData, classId: e.target.value, sectionId: '' })}
                            >
                                {classes.map((c: any) => (
                                    <MenuItem key={c.classId} value={c.classId}>{c.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small" disabled={!formData.classId}>
                            <InputLabel>Section</InputLabel>
                            <Select
                                value={formData.sectionId}
                                label="Section"
                                onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                            >
                                {sections.map((s: any) => (
                                    <MenuItem key={s.sectionId} value={s.sectionId}>{s.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                            <InputLabel>Day</InputLabel>
                            <Select
                                value={formData.dayOfWeek}
                                label="Day"
                                onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                            >
                                {config?.workingDays?.map((day: string) => (
                                    <MenuItem key={day} value={day}>
                                        {day.charAt(0).toUpperCase() + day.slice(1)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                            <InputLabel>Period</InputLabel>
                            <Select
                                value={formData.periodNumber}
                                label="Period"
                                onChange={(e) => setFormData({ ...formData, periodNumber: Number(e.target.value) })}
                            >
                                {regularPeriods.map((p: any) => (
                                    <MenuItem key={p.periodNumber} value={p.periodNumber}>
                                        {p.name} ({p.startTime} - {p.endTime})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Reason for Substitution"
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            multiline
                            rows={2}
                            fullWidth
                            size="small"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleCreateSubstitute}
                        variant="contained"
                        disabled={
                            !formData.originalTeacherId ||
                            !formData.substituteTeacherId ||
                            !formData.classId ||
                            !formData.sectionId ||
                            !formData.dayOfWeek ||
                            !formData.periodNumber ||
                            createSubstitute.isPending
                        }
                    >
                        {createSubstitute.isPending ? <CircularProgress size={20} /> : 'Assign'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SubstituteManagement;
