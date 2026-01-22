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
    Button,
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
    CalendarToday as CalendarIcon,
    LocationOn as LocationIcon,
    ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetChildProfile, useGetChildClassTeacher } from '../../../queries/ParentPortal';
import TokenService from '../../../queries/token/tokenService';

const ChildProfile: React.FC = () => {
    const navigate = useNavigate();
    const { studentId } = useParams<{ studentId: string }>();
    const schoolId = TokenService.getSchoolId() || '';

    const { data: profileData, isLoading: loadingProfile, error: profileError } = useGetChildProfile(
        schoolId,
        studentId || ''
    );
    const { data: teacherData, isLoading: loadingTeacher } = useGetChildClassTeacher(
        schoolId,
        studentId || ''
    );

    const student = profileData?.data;
    const classTeacher = teacherData?.data;

    if (profileError) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load student profile. Please try again later.</Alert>
            </Box>
        );
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <Box sx={{ p: 3 }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/parent/children')}
                sx={{ mb: 2 }}
            >
                Back to Children
            </Button>

            {loadingProfile ? (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Skeleton variant="circular" width={120} height={120} sx={{ mx: 'auto', mb: 2 }} />
                                <Skeleton variant="text" width="60%" sx={{ mx: 'auto' }} height={40} />
                                <Skeleton variant="text" width="40%" sx={{ mx: 'auto' }} />
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Card>
                            <CardContent>
                                <Skeleton variant="text" width="30%" height={30} />
                                {[1, 2, 3, 4].map((i) => (
                                    <Skeleton key={i} variant="text" width="80%" sx={{ my: 1 }} />
                                ))}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            ) : student ? (
                <Grid container spacing={3}>
                    {/* Profile Card */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                <Avatar
                                    src={student.profileImage}
                                    alt={`${student.firstName} ${student.lastName}`}
                                    sx={{ width: 120, height: 120, mx: 'auto', mb: 2, fontSize: 48 }}
                                >
                                    {student.firstName?.[0]}
                                </Avatar>
                                <Typography variant="h5" fontWeight={600}>
                                    {student.firstName} {student.lastName}
                                </Typography>
                                <Chip
                                    icon={<SchoolIcon />}
                                    label={`Class ${student.className || student.class} - ${student.sectionName || student.section}`}
                                    color="primary"
                                    sx={{ mt: 1 }}
                                />
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Roll No: {student.rollNumber}
                                </Typography>

                                <Divider sx={{ my: 3 }} />

                                {/* Class Teacher */}
                                {loadingTeacher ? (
                                    <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
                                ) : classTeacher ? (
                                    <Box sx={{ textAlign: 'left' }}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Class Teacher
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                            <Avatar src={classTeacher.profileImage} sx={{ width: 40, height: 40 }}>
                                                {classTeacher.firstName?.[0]}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" fontWeight={500}>
                                                    {classTeacher.firstName} {classTeacher.lastName}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {classTeacher.email}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                ) : null}
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card sx={{ mt: 2 }}>
                            <CardContent>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Quick Actions
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Button variant="outlined" size="small" onClick={() => navigate('/parent/attendance')}>
                                        View Attendance
                                    </Button>
                                    <Button variant="outlined" size="small" onClick={() => navigate('/parent/homework')}>
                                        View Homework
                                    </Button>
                                    <Button variant="outlined" size="small" onClick={() => navigate('/parent/timetable')}>
                                        View Timetable
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Details Card */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    Student Information
                                </Typography>

                                <List>
                                    <ListItem>
                                        <ListItemIcon><PersonIcon /></ListItemIcon>
                                        <ListItemText
                                            primary="Full Name"
                                            secondary={`${student.firstName} ${student.lastName}`}
                                        />
                                    </ListItem>
                                    <Divider variant="inset" component="li" />

                                    {student.email && (
                                        <>
                                            <ListItem>
                                                <ListItemIcon><EmailIcon /></ListItemIcon>
                                                <ListItemText primary="Email" secondary={student.email} />
                                            </ListItem>
                                            <Divider variant="inset" component="li" />
                                        </>
                                    )}

                                    {student.phone && (
                                        <>
                                            <ListItem>
                                                <ListItemIcon><PhoneIcon /></ListItemIcon>
                                                <ListItemText primary="Phone" secondary={student.phone} />
                                            </ListItem>
                                            <Divider variant="inset" component="li" />
                                        </>
                                    )}

                                    {student.dateOfBirth && (
                                        <>
                                            <ListItem>
                                                <ListItemIcon><CalendarIcon /></ListItemIcon>
                                                <ListItemText
                                                    primary="Date of Birth"
                                                    secondary={formatDate(student.dateOfBirth)}
                                                />
                                            </ListItem>
                                            <Divider variant="inset" component="li" />
                                        </>
                                    )}

                                    <ListItem>
                                        <ListItemIcon><SchoolIcon /></ListItemIcon>
                                        <ListItemText
                                            primary="Class & Section"
                                            secondary={`${student.className || student.class} - ${student.sectionName || student.section}`}
                                        />
                                    </ListItem>
                                    <Divider variant="inset" component="li" />

                                    <ListItem>
                                        <ListItemIcon><PersonIcon /></ListItemIcon>
                                        <ListItemText
                                            primary="Roll Number"
                                            secondary={student.rollNumber}
                                        />
                                    </ListItem>

                                    {student.address && (
                                        <>
                                            <Divider variant="inset" component="li" />
                                            <ListItem>
                                                <ListItemIcon><LocationIcon /></ListItemIcon>
                                                <ListItemText primary="Address" secondary={student.address} />
                                            </ListItem>
                                        </>
                                    )}
                                </List>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            ) : (
                <Alert severity="warning">Student not found.</Alert>
            )}
        </Box>
    );
};

export default ChildProfile;
