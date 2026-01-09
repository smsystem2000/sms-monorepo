import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import TokenService from '../../queries/token/tokenService';

const ParentDashboard = () => {
    const user = TokenService.getUser();

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Parent Dashboard
            </Typography>
            <Typography variant="body1" sx={{ mb: 4 }}>
                Welcome, {user?.firstName} {user?.lastName}
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6">My Children</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Student details will appear here.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ParentDashboard;
