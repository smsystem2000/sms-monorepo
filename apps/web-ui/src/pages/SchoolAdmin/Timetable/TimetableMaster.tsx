import { useState, useMemo, useEffect } from 'react';
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
    Chip,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    TableChart as TableIcon,
    List as ListIcon,
    PictureAsPdf as PdfIcon,
    Warning as WarningIcon,
    SwapHoriz as SwapIcon,
} from '@mui/icons-material';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    useGetActiveConfig,
    useGetClassTimetable,
    useCreateEntry,
    useUpdateEntry,
    useDeleteEntry,
    useGetTeachersOnLeave,
    useGetFreeTeachers,
    useGetSubstitutesForDate,
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
    teachersOnLeave?: string[];
    schoolId: string;
}

const EntryDialog = ({
    open, onClose, onSave, editData, dayOfWeek, periodNumber,
    classId, sectionId, teachers, subjects, isLoading, teachersOnLeave = [], schoolId
}: EntryDialogProps) => {
    const [teacherId, setTeacherId] = useState(editData?.teacherId || '');
    const [subjectId, setSubjectId] = useState(editData?.subjectId || '');

    // Reset state when editData changes
    useEffect(() => {
        setTeacherId(editData?.teacherId || '');
        setSubjectId(editData?.subjectId || '');
    }, [editData, open]);

    // Filter teachers who can teach the selected subject
    const subjectTeachers = useMemo(() => {
        if (!subjectId) return teachers;
        return teachers.filter((t: any) =>
            t.subjects?.includes(subjectId) || t.subjects?.length === 0
        );
    }, [subjectId, teachers]);

    // Auto-select teacher if only one can teach this subject
    useEffect(() => {
        if (subjectId && subjectTeachers.length === 1) {
            setTeacherId(subjectTeachers[0].teacherId);
        } else if (!subjectId) {
            setTeacherId('');
        }
    }, [subjectId, subjectTeachers]);

    // Check if currently selected teacher is on leave
    const isTeacherOnLeave = teachersOnLeave.includes(teacherId);

    // Get free teachers for suggestions
    const { data: freeTeachersData } = useGetFreeTeachers(schoolId, dayOfWeek, periodNumber);
    const freeTeachers = freeTeachersData?.data || [];

    // Filter suggested teachers - those who are free AND can teach the subject
    const suggestedSubstitutes = useMemo(() => {
        if (!subjectId || !isTeacherOnLeave) return [];
        return freeTeachers.filter((ft: any) => {
            const teacher = teachers.find((t: any) => t.teacherId === ft.teacherId);
            return teacher?.subjects?.includes(subjectId);
        });
    }, [freeTeachers, subjectId, isTeacherOnLeave, teachers]);

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

    const showTeacherDropdown = subjectTeachers.length > 1 || !subjectId;

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

                    {/* Show auto-selected teacher info or dropdown */}
                    {subjectId && subjectTeachers.length === 1 && (
                        <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1, color: 'success.contrastText' }}>
                            <Typography variant="body2">
                                <strong>Auto-assigned:</strong> {subjectTeachers[0].firstName} {subjectTeachers[0].lastName}
                            </Typography>
                            <Typography variant="caption">
                                (Only teacher assigned to this subject)
                            </Typography>
                        </Box>
                    )}

                    {showTeacherDropdown && (
                        <FormControl fullWidth>
                            <InputLabel>Teacher</InputLabel>
                            <Select
                                value={teacherId}
                                label="Teacher"
                                onChange={(e) => setTeacherId(e.target.value)}
                            >
                                {subjectTeachers.map((t: any) => {
                                    const onLeave = teachersOnLeave.includes(t.teacherId);
                                    return (
                                        <MenuItem
                                            key={t.teacherId}
                                            value={t.teacherId}
                                            sx={onLeave ? { color: 'error.main', bgcolor: 'error.lighter' } : {}}
                                        >
                                            {t.firstName} {t.lastName}
                                            {onLeave && <Chip label="On Leave" size="small" color="error" sx={{ ml: 1 }} />}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>
                    )}

                    {/* Leave Warning */}
                    {isTeacherOnLeave && (
                        <Alert severity="warning" icon={<WarningIcon />}>
                            This teacher is on leave today! Consider assigning a substitute.
                        </Alert>
                    )}

                    {/* Substitute Suggestions */}
                    {isTeacherOnLeave && suggestedSubstitutes.length > 0 && (
                        <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Suggested Substitutes (Free & Can Teach Subject):
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {suggestedSubstitutes.map((sub: any) => (
                                    <Chip
                                        key={sub.teacherId}
                                        label={sub.name}
                                        onClick={() => setTeacherId(sub.teacherId)}
                                        color="primary"
                                        variant="outlined"
                                        clickable
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
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

    // Get today's date for leave checking
    const today = new Date().toISOString().split('T')[0];

    // Data fetching
    const { data: configData, isLoading: configLoading } = useGetActiveConfig(schoolId);
    const { data: classesData } = useGetClasses(schoolId);
    const { data: teachersData } = useGetTeachers(schoolId);
    const { data: subjectsData } = useGetSubjects(schoolId);
    const { data: timetableData, isLoading: timetableLoading } = useGetClassTimetable(
        schoolId, selectedClass, selectedSection
    );
    const { data: teachersOnLeaveData } = useGetTeachersOnLeave(schoolId, today);
    const { data: substitutesData } = useGetSubstitutesForDate(schoolId, today);

    const createEntry = useCreateEntry(schoolId);
    const updateEntry = useUpdateEntry(schoolId);
    const deleteEntry = useDeleteEntry(schoolId);

    const config = configData?.data;
    const classes = classesData?.data || [];
    const teachers = teachersData?.data || [];
    const subjects = subjectsData?.data || [];
    const entries = timetableData?.data?.entries || [];
    const teachersOnLeave = teachersOnLeaveData?.data?.teacherIds || [];
    const substitutes = substitutesData?.data || [];

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

    // Create substitute lookup map by day-period for current class/section
    const substituteMap = useMemo(() => {
        const map: Record<string, any> = {};
        substitutes.forEach((sub: any) => {
            // Only include substitutes for the currently selected class/section
            if (sub.entry?.classId === selectedClass && sub.entry?.sectionId === selectedSection) {
                map[`${sub.entry?.dayOfWeek}-${sub.entry?.periodNumber}`] = sub;
            }
        });
        return map;
    }, [substitutes, selectedClass, selectedSection]);

    // Get today's day name for highlighting
    const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

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
        // Check if teacher is on leave - show warning color
        if (teachersOnLeave.includes(entry.teacherId)) {
            return '#ffcdd2'; // Light red for warning
        }
        // Generate consistent color based on subject
        const hash = entry.subjectId.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 70%, 85%)`;
    };

    // Export to PDF functionality
    const handleExportPdf = () => {
        if (!config || !selectedClass || !selectedSection) return;

        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
        });

        // Get class and section names
        const classObj = classes.find((c: any) => c.classId === selectedClass);
        const sectionObj = sections.find((s: any) => s.sectionId === selectedSection);
        const className = classObj?.name || selectedClass;
        const sectionName = sectionObj?.name || selectedSection;

        // Title
        doc.setFontSize(18);
        doc.setTextColor(25, 118, 210); // Primary blue color
        doc.text(`Timetable - ${className} (${sectionName})`, 14, 20);

        // Date
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

        // Prepare table data
        const headers = ['Period', ...config.workingDays.map(day => day.charAt(0).toUpperCase() + day.slice(1))];

        const rows = regularPeriods.map((period) => {
            const row = [`${period.name}\n(${period.startTime} - ${period.endTime})`];
            config.workingDays.forEach((day) => {
                const entry = entryMap[`${day}-${period.periodNumber}`];
                if (entry) {
                    row.push(`${entry.subject?.name || entry.subjectId}\n${entry.teacher?.name || entry.teacherId}`);
                } else {
                    row.push('-');
                }
            });
            return row;
        });

        // Generate table
        autoTable(doc, {
            head: [headers],
            body: rows,
            startY: 35,
            theme: 'grid',
            headStyles: {
                fillColor: [25, 118, 210],
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center',
            },
            bodyStyles: {
                halign: 'center',
                valign: 'middle',
            },
            columnStyles: {
                0: { fontStyle: 'bold', fillColor: [245, 245, 245] },
            },
            styles: {
                fontSize: 9,
                cellPadding: 3,
            },
        });

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(
                `Page ${i} of ${pageCount}`,
                doc.internal.pageSize.getWidth() / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        }

        // Save
        doc.save(`timetable-${className}-${sectionName}.pdf`);
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
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {teachersOnLeave.length > 0 && (
                        <Chip
                            icon={<WarningIcon />}
                            label={`${teachersOnLeave.length} teacher(s) on leave today`}
                            color="warning"
                            size="small"
                        />
                    )}
                    {selectedClass && selectedSection && (
                        <Button
                            variant="outlined"
                            startIcon={<PdfIcon />}
                            onClick={handleExportPdf}
                            size="small"
                        >
                            Export PDF
                        </Button>
                    )}
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
                                            <th
                                                key={day}
                                                style={day === todayDayName ? { backgroundColor: '#1565c0' } : {}}
                                            >
                                                {day.charAt(0).toUpperCase() + day.slice(1)}
                                                {day === todayDayName && ' (Today)'}
                                            </th>
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
                                                const substitute = substituteMap[`${day}-${period.periodNumber}`];
                                                const isOnLeave = entry && teachersOnLeave.includes(entry.teacherId);
                                                const hasSubstitute = !!substitute && day === todayDayName;

                                                return (
                                                    <td
                                                        key={`${day}-${period.periodNumber}`}
                                                        style={{
                                                            backgroundColor: hasSubstitute
                                                                ? '#fff3e0' // Orange tint for substituted
                                                                : (entry ? getEntryColor(entry) : 'white'),
                                                            cursor: 'pointer',
                                                            position: 'relative',
                                                            border: hasSubstitute
                                                                ? '3px solid #ff9800' // Orange border for substitute
                                                                : (isOnLeave && day === todayDayName ? '3px solid #f44336' : undefined),
                                                        }}
                                                        onClick={() => handleSlotClick(day, period.periodNumber)}
                                                    >
                                                        {entry ? (
                                                            <Box>
                                                                <Typography variant="body2" fontWeight={600}>
                                                                    {entry.subject?.name || entry.subjectId}
                                                                </Typography>

                                                                {/* Original Teacher - crossed out if has substitute or on leave */}
                                                                <Typography
                                                                    variant="caption"
                                                                    color={(hasSubstitute || isOnLeave) ? 'error' : 'text.secondary'}
                                                                    sx={(hasSubstitute || (isOnLeave && day === todayDayName)) ? { textDecoration: 'line-through' } : {}}
                                                                >
                                                                    {entry.teacher?.name || entry.teacherId}
                                                                </Typography>

                                                                {/* Substitute Teacher Display */}
                                                                {hasSubstitute && (
                                                                    <Tooltip title={`Substitute for: ${entry.teacher?.name || entry.teacherId}`}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                                            <SwapIcon sx={{ fontSize: 14, color: 'success.main' }} />
                                                                            <Typography variant="caption" color="success.main" fontWeight={600}>
                                                                                {substitute.substituteTeacher?.name || substitute.substituteTeacherId}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Tooltip>
                                                                )}

                                                                {/* Absent but no substitute yet */}
                                                                {isOnLeave && day === todayDayName && !hasSubstitute && (
                                                                    <Chip
                                                                        label="Absent"
                                                                        size="small"
                                                                        color="error"
                                                                        sx={{ mt: 0.5, fontSize: '0.6rem', height: 18 }}
                                                                    />
                                                                )}

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
                                        {day} {day === todayDayName && '(Today)'}
                                    </Typography>
                                    {regularPeriods.map((period) => {
                                        const entry = entryMap[`${day}-${period.periodNumber}`];
                                        const isOnLeave = entry && teachersOnLeave.includes(entry.teacherId);
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
                                                    border: isOnLeave && day === todayDayName ? '2px solid #f44336' : 'none',
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
                                                                {isOnLeave && day === todayDayName && (
                                                                    <Chip label="Absent" size="small" color="error" sx={{ ml: 1 }} />
                                                                )}
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
                teachersOnLeave={teachersOnLeave}
                schoolId={schoolId}
            />
        </Box>
    );
};

export default TimetableMaster;
