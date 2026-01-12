import { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    ToggleButtonGroup,
    ToggleButton,
    Chip,
    Card,
    CardContent,
    Divider,
} from '@mui/material';
import {
    TableChart as TableIcon,
    List as ListIcon,
    Today as TodayIcon,
} from '@mui/icons-material';
import { useGetTeacherTimetable } from '../../../queries/Timetable';
import TokenService from '../../../queries/token/tokenService';
import type { TimetableEntry } from '../../../types/timetable.types';

type ViewMode = 'table' | 'list';

const MyTimetable = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const teacherId = TokenService.getUserId() || '';
    const [viewMode, setViewMode] = useState<ViewMode>('table');

    const { data: timetableData, isLoading, error } = useGetTeacherTimetable(schoolId, teacherId);

    const config = timetableData?.data?.config;
    const entries = timetableData?.data?.entries || [];

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

    // Get today's day
    const today = new Date();
    const todayDayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    // Today's schedule
    const todaySchedule = useMemo(() => {
        return entries.filter((e: TimetableEntry) => e.dayOfWeek === todayDayName)
            .sort((a: TimetableEntry, b: TimetableEntry) => a.periodNumber - b.periodNumber);
    }, [entries, todayDayName]);

    const getEntryColor = (entry: TimetableEntry) => {
        const hash = entry.subjectId.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 70%, 85%)`;
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load timetable</Alert>
            </Box>
        );
    }

    if (!config) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info">No timetable configuration found for this school.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h5" fontWeight={600}>My Timetable</Typography>
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

            {/* Today's Schedule Card */}
            <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <TodayIcon />
                        <Typography variant="h6">Today's Schedule ({todayDayName.charAt(0).toUpperCase() + todayDayName.slice(1)})</Typography>
                    </Box>
                    {todaySchedule.length === 0 ? (
                        <Typography>No classes scheduled for today</Typography>
                    ) : (
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            {todaySchedule.map((entry: TimetableEntry) => {
                                const period = regularPeriods.find((p) => p.periodNumber === entry.periodNumber);
                                return (
                                    <Chip
                                        key={entry.entryId}
                                        label={`P${entry.periodNumber} (${period?.startTime || ''}): ${entry.subject?.name || entry.subjectId} - ${entry.class?.name || entry.classId} ${entry.class?.section || ''}`}
                                        sx={{ bgcolor: 'white', color: 'primary.main' }}
                                    />
                                );
                            })}
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Timetable View */}
            <Paper sx={{ p: 2, overflow: 'auto' }}>
                {viewMode === 'table' ? (
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
                                    minWidth: 100,
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
                                            style={{ backgroundColor: day === todayDayName ? '#1976d2' : undefined }}
                                        >
                                            {day.charAt(0).toUpperCase() + day.slice(1)}
                                            {day === todayDayName && ' ★'}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {regularPeriods.map((period) => (
                                    <tr key={period.periodNumber}>
                                        <td style={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>
                                            <Typography variant="body2" fontWeight={600}>{period.name}</Typography>
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
                                                        backgroundColor: entry ? getEntryColor(entry) : (day === todayDayName ? '#e3f2fd' : 'white'),
                                                    }}
                                                >
                                                    {entry ? (
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={600}>
                                                                {entry.subject?.name || entry.subjectId}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {entry.class?.name} {entry.class?.section}
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="body2" color="text.disabled">-</Typography>
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
                                <Typography
                                    variant="h6"
                                    sx={{
                                        mb: 1,
                                        textTransform: 'capitalize',
                                        color: day === todayDayName ? 'primary.main' : 'text.primary',
                                    }}
                                >
                                    {day} {day === todayDayName && '(Today)'}
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
                                            }}
                                        >
                                            <Box sx={{ minWidth: 100 }}>
                                                <Typography variant="body2" fontWeight={600}>{period.name}</Typography>
                                                <Typography variant="caption">{period.startTime} - {period.endTime}</Typography>
                                            </Box>
                                            <Box sx={{ ml: 2, flex: 1 }}>
                                                {entry ? (
                                                    <Typography variant="body2">
                                                        {entry.subject?.name} - {entry.class?.name} {entry.class?.section}
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">Free Period</Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    );
                                })}
                                <Divider sx={{ mt: 2 }} />
                            </Box>
                        ))}
                    </Box>
                )}
            </Paper>

            {/* Stats */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip label={`Total Classes: ${entries.length}`} color="primary" variant="outlined" />
                <Chip label={`Classes per Week: ${entries.length}`} color="secondary" variant="outlined" />
            </Box>
        </Box>
    );
};

export default MyTimetable;
