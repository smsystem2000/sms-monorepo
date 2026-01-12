import { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
    ToggleButtonGroup,
    ToggleButton,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    TableChart as TableIcon,
    List as ListIcon,
} from '@mui/icons-material';
import {
    useGetActiveConfig,
    useGetClassTimetable,
    useCreateEntry,
    useUpdateEntry,
    useDeleteEntry,
} from '../../../queries/Timetable';
import { useGetClasses } from '../../../queries/Class';
import { useGetTeachers } from '../../../queries/Teacher';
import { useGetSubjects } from '../../../queries/Subject';
import type { TimetableEntry, CreateTimetableEntryRequest } from '../../../types/timetable.types';
import TokenService from '../../../queries/token/tokenService';

type ViewMode = 'table' | 'list';

interface EntryDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: CreateTimetableEntryRequest) => void;
    editData?: TimetableEntry | null;
    dayOfWeek: string;
    periodNumber: number;
    classId: string;
    sectionId: string;
    teachers: any[];
    subjects: any[];
    isLoading: boolean;
}

const EntryDialog = ({
    open, onClose, onSave, editData, dayOfWeek, periodNumber,
    classId, sectionId, teachers, subjects, isLoading
}: EntryDialogProps) => {
    const [teacherId, setTeacherId] = useState(editData?.teacherId || '');
    const [subjectId, setSubjectId] = useState(editData?.subjectId || '');

    const handleSubmit = () => {
        onSave({
            classId,
            sectionId,
            teacherId,
            subjectId,
            dayOfWeek,
            periodNumber,
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {editData ? 'Edit Schedule' : 'Add Schedule'}
                <Typography variant="body2" color="text.secondary">
                    {dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)} - Period {periodNumber}
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <FormControl fullWidth>
                        <InputLabel>Subject</InputLabel>
                        <Select
                            value={subjectId}
                            label="Subject"
                            onChange={(e) => setSubjectId(e.target.value)}
                        >
                            {subjects.map((s: any) => (
                                <MenuItem key={s.subjectId} value={s.subjectId}>
                                    {s.name} ({s.code})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>Teacher</InputLabel>
                        <Select
                            value={teacherId}
                            label="Teacher"
                            onChange={(e) => setTeacherId(e.target.value)}
                        >
                            {teachers.map((t: any) => (
                                <MenuItem key={t.teacherId} value={t.teacherId}>
                                    {t.firstName} {t.lastName}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={!teacherId || !subjectId || isLoading}
                >
                    {isLoading ? <CircularProgress size={20} /> : (editData ? 'Update' : 'Add')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const TimetableMaster = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editEntry, setEditEntry] = useState<TimetableEntry | null>(null);
    const [selectedSlot, setSelectedSlot] = useState({ day: '', period: 0 });

    // Data fetching
    const { data: configData, isLoading: configLoading } = useGetActiveConfig(schoolId);
    const { data: classesData } = useGetClasses(schoolId);
    const { data: teachersData } = useGetTeachers(schoolId);
    const { data: subjectsData } = useGetSubjects(schoolId);
    const { data: timetableData, isLoading: timetableLoading } = useGetClassTimetable(
        schoolId, selectedClass, selectedSection
    );

    const createEntry = useCreateEntry(schoolId);
    const updateEntry = useUpdateEntry(schoolId);
    const deleteEntry = useDeleteEntry(schoolId);

    const config = configData?.data;
    const classes = classesData?.data || [];
    const teachers = teachersData?.data || [];
    const subjects = subjectsData?.data || [];
    const entries = timetableData?.data?.entries || [];

    // Get sections for selected class
    const selectedClassObj = classes.find((c: any) => c.classId === selectedClass);
    const sections = selectedClassObj?.sections || [];

    // Get regular periods only
    const regularPeriods = useMemo(() => {
        return config?.periods?.filter((p) => p.type === 'regular') || [];
    }, [config]);

    // Create entry lookup map
    const entryMap = useMemo(() => {
        const map: Record<string, TimetableEntry> = {};
        entries.forEach((entry: TimetableEntry) => {
            map[`${entry.dayOfWeek}-${entry.periodNumber}`] = entry;
        });
        return map;
    }, [entries]);

    const handleSlotClick = (day: string, period: number) => {
        const existingEntry = entryMap[`${day}-${period}`];
        setEditEntry(existingEntry || null);
        setSelectedSlot({ day, period });
        setDialogOpen(true);
    };

    const handleSaveEntry = async (data: CreateTimetableEntryRequest) => {
        try {
            if (editEntry) {
                await updateEntry.mutateAsync({
                    entryId: editEntry.entryId,
                    data,
                });
            } else {
                await createEntry.mutateAsync(data);
            }
            setDialogOpen(false);
            setEditEntry(null);
        } catch (err: any) {
            // Conflict error handling
            if (err?.conflicts) {
                console.error('Conflicts detected:', err.conflicts);
            }
        }
    };

    const handleDeleteEntry = async (entryId: string) => {
        try {
            await deleteEntry.mutateAsync(entryId);
        } catch (err) {
            console.error('Failed to delete entry:', err);
        }
    };

    const getEntryColor = (entry: TimetableEntry) => {
        // Generate consistent color based on subject
        const hash = entry.subjectId.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 70%, 85%)`;
    };

    if (configLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!config) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="warning">
                    No timetable configuration found. Please configure the timetable structure first.
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h5" fontWeight={600}>Master Timetable</Typography>
                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(_, v) => v && setViewMode(v)}
                    size="small"
                >
                    <ToggleButton value="table"><TableIcon /></ToggleButton>
                    <ToggleButton value="list"><ListIcon /></ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Class/Section Selector */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Select Class</InputLabel>
                            <Select
                                value={selectedClass}
                                label="Select Class"
                                onChange={(e) => {
                                    setSelectedClass(e.target.value);
                                    setSelectedSection('');
                                }}
                            >
                                {classes.map((c: any) => (
                                    <MenuItem key={c.classId} value={c.classId}>{c.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <FormControl fullWidth size="small" disabled={!selectedClass}>
                            <InputLabel>Select Section</InputLabel>
                            <Select
                                value={selectedSection}
                                label="Select Section"
                                onChange={(e) => setSelectedSection(e.target.value)}
                            >
                                {sections.map((s: any) => (
                                    <MenuItem key={s.sectionId} value={s.sectionId}>{s.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            {/* Timetable Grid */}
            {selectedClass && selectedSection && (
                <Paper sx={{ p: 2, overflow: 'auto' }}>
                    {timetableLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : viewMode === 'table' ? (
                        /* Table View */
                        <Box sx={{ overflowX: 'auto' }}>
                            <Box
                                component="table"
                                sx={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    '& th, & td': {
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        p: 1,
                                        textAlign: 'center',
                                        minWidth: 120,
                                    },
                                    '& th': {
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        fontWeight: 600,
                                    },
                                }}
                            >
                                <thead>
                                    <tr>
                                        <th>Period</th>
                                        {config.workingDays.map((day) => (
                                            <th key={day}>{day.charAt(0).toUpperCase() + day.slice(1)}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {regularPeriods.map((period) => (
                                        <tr key={period.periodNumber}>
                                            <td style={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {period.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {period.startTime} - {period.endTime}
                                                </Typography>
                                            </td>
                                            {config.workingDays.map((day) => {
                                                const entry = entryMap[`${day}-${period.periodNumber}`];
                                                return (
                                                    <td
                                                        key={`${day}-${period.periodNumber}`}
                                                        style={{
                                                            backgroundColor: entry ? getEntryColor(entry) : 'white',
                                                            cursor: 'pointer',
                                                            position: 'relative',
                                                        }}
                                                        onClick={() => handleSlotClick(day, period.periodNumber)}
                                                    >
                                                        {entry ? (
                                                            <Box>
                                                                <Typography variant="body2" fontWeight={600}>
                                                                    {entry.subject?.name || entry.subjectId}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {entry.teacher?.name || entry.teacherId}
                                                                </Typography>
                                                                <IconButton
                                                                    size="small"
                                                                    sx={{ position: 'absolute', top: 2, right: 2 }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteEntry(entry.entryId);
                                                                    }}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Box>
                                                        ) : (
                                                            <Tooltip title="Click to add">
                                                                <AddIcon sx={{ color: 'action.disabled' }} />
                                                            </Tooltip>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </Box>
                        </Box>
                    ) : (
                        /* List View */
                        <Box>
                            {config.workingDays.map((day) => (
                                <Box key={day} sx={{ mb: 3 }}>
                                    <Typography variant="h6" sx={{ mb: 1, textTransform: 'capitalize' }}>
                                        {day}
                                    </Typography>
                                    {regularPeriods.map((period) => {
                                        const entry = entryMap[`${day}-${period.periodNumber}`];
                                        return (
                                            <Box
                                                key={period.periodNumber}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    p: 1,
                                                    mb: 1,
                                                    borderRadius: 1,
                                                    bgcolor: entry ? getEntryColor(entry) : 'action.hover',
                                                    cursor: 'pointer',
                                                }}
                                                onClick={() => handleSlotClick(day, period.periodNumber)}
                                            >
                                                <Box sx={{ minWidth: 100 }}>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {period.name}
                                                    </Typography>
                                                    <Typography variant="caption">
                                                        {period.startTime} - {period.endTime}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ ml: 2, flex: 1 }}>
                                                    {entry ? (
                                                        <>
                                                            <Typography variant="body2">
                                                                {entry.subject?.name} - {entry.teacher?.name}
                                                            </Typography>
                                                        </>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">
                                                            No class scheduled
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            ))}
                        </Box>
                    )}
                </Paper>
            )}

            {!selectedClass && (
                <Alert severity="info">
                    Please select a class and section to view or edit the timetable.
                </Alert>
            )}

            {/* Entry Dialog */}
            <EntryDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSave={handleSaveEntry}
                editData={editEntry}
                dayOfWeek={selectedSlot.day}
                periodNumber={selectedSlot.period}
                classId={selectedClass}
                sectionId={selectedSection}
                teachers={teachers}
                subjects={subjects}
                isLoading={createEntry.isPending || updateEntry.isPending}
            />
        </Box>
    );
};

export default TimetableMaster;
