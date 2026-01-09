import { Box, Typography, Paper, Grid, Button, CircularProgress, Alert, Chip } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { useGetSchoolById } from '../../queries/School';
import TokenService from '../../queries/token/tokenService';

const SchoolPage = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const { data, isLoading, error } = useGetSchoolById(schoolId);

    const school = data?.data;

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4, p: { xs: 2, sm: 3 } }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Alert severity="error">Failed to load school details.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4" fontWeight={600} color="#1e293b" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                    School Details
                </Typography>
                <Button variant="contained" startIcon={<EditIcon />} disabled>
                    Edit Details
                </Button>
            </Box>

            {school && (
                <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">School ID</Typography>
                            <Typography variant="body1" fontWeight={500}>{school.schoolId}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">School Name</Typography>
                            <Typography variant="body1" fontWeight={500}>{school.schoolName}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">Email</Typography>
                            <Typography variant="body1">{school.schoolEmail || '-'}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">Contact</Typography>
                            <Typography variant="body1">{school.schoolContact || '-'}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">Website</Typography>
                            <Typography variant="body1">{school.schoolWebsite || '-'}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" color="text.secondary">Status</Typography>
                            <Box sx={{ mt: 0.5 }}>
                                <Chip
                                    label={school.status}
                                    size="small"
                                    color={school.status === 'active' ? 'success' : 'default'}
                                />
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="caption" color="text.secondary">Address</Typography>
                            <Typography variant="body1">{school.schoolAddress || '-'}</Typography>
                        </Grid>
                    </Grid>
                </Paper>
            )}
        </Box>
    );
};

export default SchoolPage;
