import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    CircularProgress,
    Alert,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useCreateSchoolAdmin, useUpdateSchoolAdmin } from '../../queries/SchoolAdmin';
import { useGetSchools } from '../../queries/School';
import type { CreateSchoolAdminPayload, SchoolAdmin } from '../../types';
import { ImageUpload } from '../ImageUpload';
import { IMAGEKIT_FOLDERS } from '../../utils/imagekit';

interface SchoolAdminDialogProps {
    open: boolean;
    onClose: () => void;
    editData?: SchoolAdmin | null;
}

const SchoolAdminDialog: React.FC<SchoolAdminDialogProps> = ({ open, onClose, editData }) => {
    const isEditMode = !!editData;

    const [formData, setFormData] = useState<CreateSchoolAdminPayload & { profileImage?: string }>({
        username: '',
        email: '',
        password: '',
        schoolId: '',
        contactNumber: '',
        profileImage: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const createMutation = useCreateSchoolAdmin();
    const updateMutation = useUpdateSchoolAdmin();
    const { data: schoolsData, isLoading: schoolsLoading } = useGetSchools();

    const schools = schoolsData?.data || [];

    // Populate form when editData changes
    useEffect(() => {
        if (editData) {
            setFormData({
                username: editData.username || '',
                email: editData.email || '',
                password: '',
                schoolId: editData.schoolId || '',
                contactNumber: editData.contactNumber || '',
                profileImage: editData.profileImage || '',
            });
        } else {
            setFormData({
                username: '',
                email: '',
                password: '',
                schoolId: '',
                contactNumber: '',
                profileImage: '',
            });
        }
    }, [editData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }
        if (!isEditMode && !formData.password.trim()) {
            newErrors.password = 'Password is required';
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        if (!formData.schoolId) {
            newErrors.schoolId = 'Please select a school';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        try {
            if (isEditMode && editData) {
                const updatePayload: Record<string, string | undefined> = {
                    username: formData.username,
                    email: formData.email,
                    contactNumber: formData.contactNumber,
                    profileImage: formData.profileImage,
                };
                if (formData.password) {
                    updatePayload.password = formData.password;
                }
                await updateMutation.mutateAsync({
                    userId: editData.userId,
                    data: updatePayload,
                });
            } else {
                await createMutation.mutateAsync(formData);
            }
            handleClose();
        } catch {
            // Error is handled by mutation
        }
    };

    const handleClose = () => {
        setFormData({
            username: '',
            email: '',
            password: '',
            schoolId: '',
            contactNumber: '',
            profileImage: '',
        });
        setErrors({});
        createMutation.reset();
        updateMutation.reset();
        onClose();
    };

    const isPending = createMutation.isPending || updateMutation.isPending;
    const isError = createMutation.isError || updateMutation.isError;
    const errorMessage = (createMutation.error as { message?: string })?.message ||
        (updateMutation.error as { message?: string })?.message ||
        'Operation failed';

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {isEditMode ? 'Edit School Admin' : 'Add School Admin'}
                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {isError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {errorMessage}
                        </Alert>
                    )}

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl fullWidth error={!!errors.schoolId} required>
                            <InputLabel>School</InputLabel>
                            <Select
                                value={formData.schoolId}
                                label="School"
                                onChange={(e) => handleSelectChange('schoolId', e.target.value)}
                                disabled={schoolsLoading || isEditMode}
                            >
                                {schools.map((school) => (
                                    <MenuItem key={school.schoolId} value={school.schoolId}>
                                        {school.schoolName} ({school.schoolId})
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.schoolId && <FormHelperText>{errors.schoolId}</FormHelperText>}
                        </FormControl>

                        <TextField
                            name="username"
                            label="Username"
                            value={formData.username}
                            onChange={handleChange}
                            error={!!errors.username}
                            helperText={errors.username}
                            required
                            fullWidth
                        />

                        <TextField
                            name="email"
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            error={!!errors.email}
                            helperText={errors.email}
                            required
                            fullWidth
                        />

                        <TextField
                            name="password"
                            label={"Password"}
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            error={!!errors.password}
                            helperText={errors.password}
                            required={!isEditMode}
                            fullWidth
                        />

                        <TextField
                            name="contactNumber"
                            label="Contact Number"
                            value={formData.contactNumber}
                            onChange={handleChange}
                            fullWidth
                        />

                        <ImageUpload
                            folder={IMAGEKIT_FOLDERS.PROFILE_IMAGES}
                            fileName={isEditMode && editData ? `${editData.userId}_profile` : `new_admin_profile_${Date.now()}`}
                            currentImage={formData.profileImage}
                            label="Profile Image"
                            authEndpoint="admin"
                            variant="avatar"
                            size="medium"
                            onUploadSuccess={(result) => {
                                setFormData(prev => ({ ...prev, profileImage: result.url }));
                            }}
                            onRemove={() => {
                                setFormData(prev => ({ ...prev, profileImage: '' }));
                            }}
                        />
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClose} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isPending}
                        startIcon={isPending ? <CircularProgress size={20} /> : null}
                    >
                        {isPending ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Admin' : 'Create Admin')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default SchoolAdminDialog;
