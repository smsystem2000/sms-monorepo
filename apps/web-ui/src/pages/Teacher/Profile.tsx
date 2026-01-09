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
import RequestChangeDialog from '../../components/Dialogs/RequestChangeDialog';

const TeacherProfile = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [requestDialogOpen, setRequestDialogOpen] = useState(false);
    const [requestFieldType, setRequestFieldType] = useState<"email_change" | "phone_change" | "general">("general");
    const [currentFieldValue, setCurrentFieldValue] = useState("");

    const decodedToken = TokenService.decodeToken();
    const userId = decodedToken?.userId || '';
    const userName = decodedToken?.username || decodedToken?.email?.split('@')[0] || 'User';
    const userEmail = decodedToken?.email || '';
    const schoolId = decodedToken?.schoolId || '';

    const [formData, setFormData] = useState({
        firstName: userName,
        lastName: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        setIsEditing(false);
    };

    const openRequestDialog = (type: "email_change" | "phone_change" | "general", currentValue: string = "") => {
        setRequestFieldType(type);
        setCurrentFieldValue(currentValue);
        setRequestDialogOpen(true);
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
                    Basic Information
                </Typography>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            name="firstName"
                            label="First Name"
                            value={formData.firstName}
                            onChange={handleChange}
                            disabled={!isEditing}
                            fullWidth
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            name="lastName"
                            label="Last Name"
                            value={formData.lastName}
                            onChange={handleChange}
                            disabled={!isEditing}
                            fullWidth
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary">Teacher ID</Typography>
                        <Typography variant="body1" fontWeight={500}>{userId}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary">Role</Typography>
                        <Box sx={{ mt: 0.5 }}>
                            <Chip label="Teacher" size="small" color="primary" />
                        </Box>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                <Typography variant="h6" fontWeight={600} color="#1e293b" gutterBottom>
                    Confidential Information
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Submit a request to change email or phone.
                </Typography>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="text.secondary">Email</Typography>
                                <Typography variant="body1">{userEmail || '-'}</Typography>
                            </Box>
                            <Button size="small" variant="text" onClick={() => openRequestDialog("email_change", userEmail)}>
                                Request Change
                            </Button>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" color="text.secondary">Phone</Typography>
                                <Typography variant="body1">-</Typography>
                            </Box>
                            <Button size="small" variant="text" onClick={() => openRequestDialog("phone_change", "")}>
                                Request Change
                            </Button>
                        </Box>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="outlined" onClick={() => openRequestDialog("general")}>
                        Submit General Query
                    </Button>
                </Box>
            </Paper>

            <RequestChangeDialog
                open={requestDialogOpen}
                onClose={() => setRequestDialogOpen(false)}
                schoolId={schoolId}
                userId={userId}
                userName={userName}
                userType="teacher"
                fieldType={requestFieldType}
                currentValue={currentFieldValue}
            />
        </Box>
    );
};

export default TeacherProfile;
