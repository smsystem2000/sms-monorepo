import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    CircularProgress,
    Alert,
    IconButton,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Autocomplete,
    Chip,
    Typography,
    Divider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useCreateParent, useUpdateParent } from '../../queries/Parent';
import { searchStudentsApi } from '../../queries/Student';
import type { CreateParentPayload, Parent, Student } from '../../types';
import { ImageUpload } from '../ImageUpload';
import { IMAGEKIT_FOLDERS } from '../../utils/imagekit';

interface ParentDialogProps {
    open: boolean;
    onClose: () => void;
    schoolId: string;
    editData?: Parent | null;
}

// Debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const ParentDialog: React.FC<ParentDialogProps> = ({ open, onClose, schoolId, editData }) => {
    const isEditMode = !!editData;

    const [formData, setFormData] = useState<CreateParentPayload>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        relationship: 'father',
        occupation: '',
        address: '',
        studentIds: [],
        status: 'active',
        profileImage: '',
        signature: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Student search state
    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const [studentOptions, setStudentOptions] = useState<Student[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
    const [studentLoading, setStudentLoading] = useState(false);

    const debouncedStudentQuery = useDebounce(studentSearchQuery, 300);

    const createMutation = useCreateParent(schoolId);
    const updateMutation = useUpdateParent(schoolId);

    // Fetch students when search query changes
    useEffect(() => {
        const fetchStudents = async () => {
            if (debouncedStudentQuery.length >= 2) {
                setStudentLoading(true);
                try {
                    const response = await searchStudentsApi(schoolId, debouncedStudentQuery);
                    setStudentOptions(response.data || []);
                } catch {
                    setStudentOptions([]);
                } finally {
                    setStudentLoading(false);
                }
            } else {
                setStudentOptions([]);
            }
        };
        fetchStudents();
    }, [debouncedStudentQuery, schoolId]);

    useEffect(() => {
        if (editData) {
            setFormData({
                firstName: editData.firstName || '',
                lastName: editData.lastName || '',
                email: editData.email || '',
                password: '',
                phone: editData.phone || '',
                relationship: editData.relationship || 'father',
                occupation: editData.occupation || '',
                address: editData.address || '',
                studentIds: editData.studentIds || [],
                status: editData.status || 'active',
                profileImage: editData.profileImage || '',
                signature: editData.signature || '',
            });
            // For edit mode, create placeholder students from IDs
            setSelectedStudents(
                (editData.studentIds || []).map(id => ({ studentId: id, firstName: '', lastName: '', class: '' } as Student))
            );
        } else {
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                phone: '',
                relationship: 'father',
                occupation: '',
                address: '',
                studentIds: [],
                status: 'active',
                profileImage: '',
                signature: '',
            });
            setSelectedStudents([]);
        }
    }, [editData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleStudentSelect = useCallback((_: unknown, value: Student[]) => {
        setSelectedStudents(value);
        setFormData(prev => ({ ...prev, studentIds: value.map(s => s.studentId) }));
    }, []);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }
        if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
        if (!isEditMode && !formData.password.trim()) {
            newErrors.password = 'Password is required';
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            if (isEditMode && editData) {
                const updatePayload: Record<string, unknown> = { ...formData };
                if (!formData.password) delete updatePayload.password;
                await updateMutation.mutateAsync({
                    parentId: editData.parentId,
                    data: updatePayload,
                });
            } else {
                await createMutation.mutateAsync(formData);
            }
            handleClose();
        } catch {
            // Error handled by mutation
        }
    };

    const handleClose = () => {
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            phone: '',
            relationship: 'father',
            occupation: '',
            address: '',
            studentIds: [],
            status: 'active',
            profileImage: '',
            signature: '',
        });
        setErrors({});
        setSelectedStudents([]);
        setStudentSearchQuery('');
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
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {isEditMode ? 'Edit Parent' : 'Add Parent'}
                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {isError && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>}

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField name="firstName" label="First Name" value={formData.firstName}
                                onChange={handleChange} error={!!errors.firstName} helperText={errors.firstName}
                                required fullWidth />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField name="lastName" label="Last Name" value={formData.lastName}
                                onChange={handleChange} error={!!errors.lastName} helperText={errors.lastName}
                                required fullWidth />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField name="email" label="Email" type="email" value={formData.email}
                                onChange={handleChange} error={!!errors.email} helperText={errors.email}
                                required fullWidth />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField name="password" label={"Password"}
                                type="password" value={formData.password} onChange={handleChange}
                                error={!!errors.password} helperText={errors.password} required={!isEditMode} fullWidth />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField name="phone" label="Phone" value={formData.phone}
                                onChange={handleChange} error={!!errors.phone} helperText={errors.phone}
                                required fullWidth />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth required>
                                <InputLabel>Relationship</InputLabel>
                                <Select value={formData.relationship} label="Relationship"
                                    onChange={(e) => setFormData((prev) => ({ ...prev, relationship: e.target.value as 'father' | 'mother' | 'guardian' | 'other' }))}>
                                    <MenuItem value="father">Father</MenuItem>
                                    <MenuItem value="mother">Mother</MenuItem>
                                    <MenuItem value="guardian">Guardian</MenuItem>
                                    <MenuItem value="other">Other</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Student Search Autocomplete */}
                        <Grid size={{ xs: 12 }}>
                            <Autocomplete
                                multiple
                                options={studentOptions}
                                value={selectedStudents}
                                onChange={handleStudentSelect}
                                loading={studentLoading}
                                getOptionLabel={(option) =>
                                    `${option.studentId} - ${option.firstName} ${option.lastName} (${option.class || 'N/A'})`
                                }
                                isOptionEqualToValue={(option, value) => option.studentId === value.studentId}
                                onInputChange={(_, value) => setStudentSearchQuery(value)}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => {
                                        const { key, ...tagProps } = getTagProps({ index });
                                        return (
                                            <Chip
                                                key={key}
                                                label={option.firstName ? `${option.studentId} - ${option.firstName}` : option.studentId}
                                                {...tagProps}
                                                size="small"
                                            />
                                        );
                                    })
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Search & Add Students"
                                        placeholder="Search by ID, name, or email..."
                                        helperText="Type at least 2 characters to search"
                                        slotProps={{
                                            input: {
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {studentLoading && <CircularProgress size={20} />}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            },
                                        }}
                                    />
                                )}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField name="occupation" label="Occupation" value={formData.occupation}
                                onChange={handleChange} fullWidth />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField name="address" label="Address" value={formData.address}
                                onChange={handleChange} multiline rows={2} fullWidth />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select value={formData.status} label="Status"
                                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Profile Image and Signature */}
                        <Grid size={{ xs: 12 }}>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                                Images
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <ImageUpload
                                folder={IMAGEKIT_FOLDERS.PROFILE_IMAGES}
                                fileName={isEditMode && editData ? `${editData.parentId}_profile` : `new_parent_profile_${Date.now()}`}
                                currentImage={formData.profileImage}
                                label="Profile Image"
                                authEndpoint="school"
                                variant="avatar"
                                size="medium"
                                onUploadSuccess={(result) => {
                                    setFormData(prev => ({ ...prev, profileImage: result.url }));
                                }}
                                onRemove={() => {
                                    setFormData(prev => ({ ...prev, profileImage: '' }));
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <ImageUpload
                                folder={IMAGEKIT_FOLDERS.SIGNATURES}
                                fileName={isEditMode && editData ? `${editData.parentId}_signature` : `new_parent_signature_${Date.now()}`}
                                currentImage={formData.signature}
                                label="Signature"
                                authEndpoint="school"
                                size="small"
                                onUploadSuccess={(result) => {
                                    setFormData(prev => ({ ...prev, signature: result.url }));
                                }}
                                onRemove={() => {
                                    setFormData(prev => ({ ...prev, signature: '' }));
                                }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClose} color="inherit">Cancel</Button>
                    <Button type="submit" variant="contained" disabled={isPending}
                        startIcon={isPending ? <CircularProgress size={20} /> : null}>
                        {isPending ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default ParentDialog;
