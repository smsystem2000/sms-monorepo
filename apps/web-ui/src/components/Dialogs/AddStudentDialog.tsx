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
    Typography,
    Divider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useCreateStudent, useUpdateStudent } from '../../queries/Student';
import { searchParentsApi } from '../../queries/Parent';
import { useGetClasses } from '../../queries/Class';
import type { CreateStudentPayload, Student, Parent, Class, Section } from '../../types';
import { ImageUpload } from '../ImageUpload';
import { IMAGEKIT_FOLDERS } from '../../utils/imagekit';

interface StudentDialogProps {
    open: boolean;
    onClose: () => void;
    schoolId: string;
    editData?: Student | null;
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

const StudentDialog: React.FC<StudentDialogProps> = ({ open, onClose, schoolId, editData }) => {
    const isEditMode = !!editData;

    const [formData, setFormData] = useState<CreateStudentPayload>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        class: '',
        section: '',
        rollNumber: '',
        gender: undefined,
        dateOfBirth: '',
        address: '',
        parentId: '',
        status: 'active',
        profileImage: '',
        signature: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Parent search state
    const [parentSearchQuery, setParentSearchQuery] = useState('');
    const [parentOptions, setParentOptions] = useState<Parent[]>([]);
    const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
    const [parentLoading, setParentLoading] = useState(false);

    const debouncedParentQuery = useDebounce(parentSearchQuery, 300);

    const createMutation = useCreateStudent(schoolId);
    const updateMutation = useUpdateStudent(schoolId);

    // Fetch classes from backend
    const { data: classesData } = useGetClasses(schoolId);
    const classes = classesData?.data || [];

    // Get sections for selected class
    const selectedClassData = classes.find((c: Class) => c.classId === formData.class);
    const selectedClassSections = selectedClassData?.sections || [];

    // Fetch parents when search query changes
    useEffect(() => {
        const fetchParents = async () => {
            if (debouncedParentQuery.length >= 2) {
                setParentLoading(true);
                try {
                    const response = await searchParentsApi(schoolId, debouncedParentQuery);
                    setParentOptions(response.data || []);
                } catch {
                    setParentOptions([]);
                } finally {
                    setParentLoading(false);
                }
            } else {
                setParentOptions([]);
            }
        };
        fetchParents();
    }, [debouncedParentQuery, schoolId]);

    useEffect(() => {
        if (editData) {
            setFormData({
                firstName: editData.firstName || '',
                lastName: editData.lastName || '',
                email: editData.email || '',
                password: '',
                phone: editData.phone || '',
                class: editData.class || '',
                section: editData.section || '',
                rollNumber: editData.rollNumber || '',
                gender: editData.gender,
                dateOfBirth: editData.dateOfBirth ? editData.dateOfBirth.split('T')[0] : '',
                address: editData.address || '',
                parentId: editData.parentId || '',
                status: editData.status || 'active',
                profileImage: editData.profileImage || '',
                signature: editData.signature || '',
            });
            // Set placeholder parent for edit mode
            if (editData.parentId) {
                // Use parentName from editData if available, otherwise just ID
                const nameParts = (editData.parentName || '').split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || '';

                setSelectedParent({
                    parentId: editData.parentId,
                    firstName: firstName || 'Parent',
                    lastName: lastName || '(Linked)',
                    email: '',
                    phone: ''
                } as Parent);
            }
        } else {
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                phone: '',
                class: '',
                section: '',
                rollNumber: '',
                gender: undefined,
                dateOfBirth: '',
                address: '',
                parentId: '',
                status: 'active',
                profileImage: '',
                signature: '',
            });
            setSelectedParent(null);
        }
    }, [editData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleParentSelect = useCallback((_: unknown, value: Parent | null) => {
        setSelectedParent(value);
        setFormData(prev => ({ ...prev, parentId: value?.parentId || '' }));
    }, []);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.class.trim()) newErrors.class = 'Class is required';
        if (!isEditMode && !formData.password.trim()) {
            newErrors.password = 'Password is required';
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
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
                    studentId: editData.studentId,
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
            class: '',
            section: '',
            rollNumber: '',
            gender: undefined,
            dateOfBirth: '',
            address: '',
            parentId: '',
            status: 'active',
            profileImage: '',
            signature: '',
        });
        setErrors({});
        setSelectedParent(null);
        setParentSearchQuery('');
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
                {isEditMode ? 'Edit Student' : 'Add Student'}
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
                                onChange={handleChange} error={!!errors.email} helperText={errors.email} fullWidth />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField name="password" label={"Password"}
                                type="password" value={formData.password} onChange={handleChange}
                                error={!!errors.password} helperText={errors.password} required={!isEditMode} fullWidth />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <FormControl fullWidth required error={!!errors.class}>
                                <InputLabel>Class</InputLabel>
                                <Select
                                    value={formData.class}
                                    label="Class"
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, class: e.target.value, section: '' }));
                                        if (errors.class) setErrors(prev => ({ ...prev, class: '' }));
                                    }}
                                >
                                    {classes.filter((c: Class) => c.status === 'active').map((c: Class) => (
                                        <MenuItem key={c.classId} value={c.classId}>{c.name}</MenuItem>
                                    ))}
                                </Select>
                                {errors.class && <span style={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: 3 }}>{errors.class}</span>}
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <FormControl fullWidth disabled={!formData.class}>
                                <InputLabel>Section</InputLabel>
                                <Select
                                    value={formData.section}
                                    label="Section"
                                    onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {selectedClassSections.map((s: Section) => (
                                        <MenuItem key={s.sectionId} value={s.sectionId}>{s.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField name="rollNumber" label="Roll Number" value={formData.rollNumber}
                                onChange={handleChange} fullWidth />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField name="phone" label="Phone" value={formData.phone}
                                onChange={handleChange} fullWidth />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <FormControl fullWidth>
                                <InputLabel>Gender</InputLabel>
                                <Select value={formData.gender || ''} label="Gender"
                                    onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value as 'male' | 'female' | 'other' }))}>
                                    <MenuItem value="male">Male</MenuItem>
                                    <MenuItem value="female">Female</MenuItem>
                                    <MenuItem value="other">Other</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField name="dateOfBirth" label="Date of Birth" type="date"
                                value={formData.dateOfBirth} onChange={handleChange} fullWidth
                                slotProps={{ inputLabel: { shrink: true } }} />
                        </Grid>

                        {/* Parent Search Autocomplete */}
                        <Grid size={{ xs: 12 }}>
                            <Autocomplete
                                options={parentOptions}
                                value={selectedParent}
                                onChange={handleParentSelect}
                                loading={parentLoading}
                                getOptionLabel={(option) =>
                                    `${option.parentId} - ${option.firstName} ${option.lastName} (${option.phone || option.email || 'N/A'})`
                                }
                                isOptionEqualToValue={(option, value) => option.parentId === value.parentId}
                                onInputChange={(_, value) => setParentSearchQuery(value)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Search & Link Parent"
                                        placeholder="Search by ID, name, email, or phone..."
                                        helperText="Type at least 2 characters to search"
                                        slotProps={{
                                            input: {
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {parentLoading && <CircularProgress size={20} />}
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
                                fileName={isEditMode && editData ? `${editData.studentId}_profile` : `new_student_profile_${Date.now()}`}
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
                                fileName={isEditMode && editData ? `${editData.studentId}_signature` : `new_student_signature_${Date.now()}`}
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

export default StudentDialog;
