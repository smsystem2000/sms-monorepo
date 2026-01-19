import React from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Avatar,
    Chip,
    Alert,
    Skeleton,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    Person as PersonIcon,
    School as SchoolIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Star as StarIcon,
} from '@mui/icons-material';
import { useChildSelector } from '../../context/ChildSelectorContext';
import { useGetChildTeachers } from '../../queries/ParentPortal';
import TokenService from '../../queries/token/tokenService';
import type { ChildTeacherInfo } from '../../types';

const ParentTeachers: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const { selectedChild, isLoading: loadingChild } = useChildSelector();

    const { data, isLoading, error } = useGetChildTeachers(
        schoolId,
        selectedChild?.studentId || ''
    );

    const teachers = data?.data || [];

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
                <Alert severity="info">Please select a child to view their teachers.</Alert>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load teachers data. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PersonIcon color="primary" />
                <Typography variant="h4" fontWeight={600}>
                    Teachers
                </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                {selectedChild ? `${selectedChild.firstName}'s teachers` : 'Loading...'}
            </Typography>

            <Grid container spacing={3}>
                {isLoading || loadingChild ? (
                    [1, 2, 3, 4].map((i) => (
                        <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Skeleton variant="circular" width={60} height={60} />
                                        <Box sx={{ flex: 1 }}>
                                            <Skeleton variant="text" width="70%" height={30} />
                                            <Skeleton variant="text" width="50%" />
                                            <Skeleton variant="text" width="80%" />
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                ) : teachers.length === 0 ? (
                    <Grid size={{ xs: 12 }}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center', py: 6 }}>
                                <PersonIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">
                                    No teachers found
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Teacher information will appear here once assigned
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ) : (
                    teachers.map((teacher: ChildTeacherInfo) => (
                        <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={teacher.teacherId}>
                            <Card
                                sx={{
                                    height: '100%',
                                    borderTop: teacher.isClassTeacher ? 3 : 0,
                                    borderColor: 'primary.main',
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                        <Avatar
                                            src={teacher.profileImage}
                                            alt={`${teacher.firstName} ${teacher.lastName}`}
                                            sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}
                                        >
                                            {teacher.firstName?.[0]}
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="h6" fontWeight={600}>
                                                    {teacher.firstName} {teacher.lastName}
                                                </Typography>
                                                {teacher.isClassTeacher && (
                                                    <Chip
                                                        size="small"
                                                        icon={<StarIcon />}
                                                        label="Class Teacher"
                                                        color="primary"
                                                        sx={{ height: 24 }}
                                                    />
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                                                {teacher.subjectNames?.map((subject, idx) => (
                                                    <Chip
                                                        key={idx}
                                                        size="small"
                                                        icon={<SchoolIcon />}
                                                        label={subject}
                                                        variant="outlined"
                                                        sx={{ height: 22 }}
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Divider sx={{ my: 2 }} />

                                    <List dense disablePadding>
                                        {teacher.email && (
                                            <ListItem disablePadding sx={{ mb: 0.5 }}>
                                                <ListItemIcon sx={{ minWidth: 32 }}>
                                                    <EmailIcon fontSize="small" color="action" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={teacher.email}
                                                    primaryTypographyProps={{ variant: 'body2' }}
                                                />
                                            </ListItem>
                                        )}
                                        {teacher.phone && (
                                            <ListItem disablePadding>
                                                <ListItemIcon sx={{ minWidth: 32 }}>
                                                    <PhoneIcon fontSize="small" color="action" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={teacher.phone}
                                                    primaryTypographyProps={{ variant: 'body2' }}
                                                />
                                            </ListItem>
                                        )}
                                    </List>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                )}
            </Grid>
        </Box>
    );
};

export default ParentTeachers;
