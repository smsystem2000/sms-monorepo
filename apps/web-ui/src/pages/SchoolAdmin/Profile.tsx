import { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    Button,
    Chip,
    Divider,
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import TokenService from '../../queries/token/tokenService';

const SchoolAdminProfile = () => {
    const [isEditing, setIsEditing] = useState(false);

    // Get user info from token
    const decodedToken = TokenService.decodeToken();
    const userId = decodedToken?.userId || decodedToken?.adminId || '';
    const userName = decodedToken?.username || decodedToken?.email || 'User';
    const userEmail = decodedToken?.email || '';
    const role = decodedToken?.role || '';

    const [formData, setFormData] = useState({
        username: userName,
        email: userEmail,
        phone: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        // TODO: Implement save profile API
        setIsEditing(false);
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4" fontWeight={600} color="#1e293b" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                    My Profile
                </Typography>
                {!isEditing ? (
                    <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setIsEditing(true)}>
                        Edit Profile
                    </Button>
                ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="outlined" startIcon={<CancelIcon />} onClick={() => setIsEditing(false)}>
                            Cancel
                        </Button>
                        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
                            Save
                        </Button>
                    </Box>
                )}
            </Box>

            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight={600} color="#1e293b" gutterBottom>
                    Account Information
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    You can update your profile information directly.
                </Typography>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            name="username"
                            label="Username"
                            value={formData.username}
                            onChange={handleChange}
                            disabled={!isEditing}
                            fullWidth
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            name="email"
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={!isEditing}
                            fullWidth
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            name="phone"
                            label="Phone"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={!isEditing}
                            fullWidth
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary">User ID</Typography>
                        <Typography variant="body1" fontWeight={500}>{userId}</Typography>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary">Role</Typography>
                        <Box sx={{ mt: 0.5 }}>
                            <Chip label={role} size="small" color="primary" />
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default SchoolAdminProfile;
