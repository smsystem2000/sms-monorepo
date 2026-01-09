import { useState, useEffect } from 'react';
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
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useCreateTeacher, useUpdateTeacher } from '../../queries/Teacher';
import { useGetClasses } from '../../queries/Class';
import { useGetSubjects } from '../../queries/Subject';
import type { CreateTeacherPayload, Teacher, Class, Subject } from '../../types';

interface TeacherDialogProps {
    open: boolean;
    onClose: () => void;
    schoolId: string;
    editData?: Teacher | null;
}

const TeacherDialog: React.FC<TeacherDialogProps> = ({ open, onClose, schoolId, editData }) => {
    const isEditMode = !!editData;

    const [formData, setFormData] = useState<CreateTeacherPayload>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: '',
        subjects: [],
        classes: [],
        sections: [],
        status: 'active',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const createMutation = useCreateTeacher(schoolId);
    const updateMutation = useUpdateTeacher(schoolId);

    // Fetch classes and subjects for dropdowns
    const { data: classesData } = useGetClasses(schoolId);
    const { data: subjectsData } = useGetSubjects(schoolId);

    const classes = classesData?.data || [];
    const subjects = subjectsData?.data || [];

    // Get class options for Autocomplete - format: "Class Name - Section A, B"
    const classOptions = classes
        .filter((c: Class) => c.status === 'active')
        .map((c: Class) => ({
            id: c.classId,
            label: c.name,
            sections: c.sections.map(s => s.name).join(', '),
        }));

    // Get subject options for Autocomplete
    const subjectOptions = subjects
        .filter((s: Subject) => s.status === 'active')
        .map((s: Subject) => ({
            id: s.subjectId,
            label: `${s.name} (${s.code})`,
        }));

    useEffect(() => {
        if (editData) {
            setFormData({
                firstName: editData.firstName || '',
                lastName: editData.lastName || '',
                email: editData.email || '',
                password: '',
                phone: editData.phone || '',
                subjects: editData.subjects || [],
                classes: editData.classes || [],
                sections: editData.sections || [],
                status: editData.status || 'active',
            });
        } else {
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                phone: '',
                subjects: [],
                classes: [],
                sections: [],
                status: 'active',
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

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
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
                    teacherId: editData.teacherId,
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
            subjects: [],
            classes: [],
            sections: [],
            status: 'active',
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
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {isEditMode ? 'Edit Teacher' : 'Add Teacher'}
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

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                name="firstName"
                                label="First Name"
                                value={formData.firstName}
                                onChange={handleChange}
                                error={!!errors.firstName}
                                helperText={errors.firstName}
                                required
                                fullWidth
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                name="lastName"
                                label="Last Name"
                                value={formData.lastName}
                                onChange={handleChange}
                                error={!!errors.lastName}
                                helperText={errors.lastName}
                                required
                                fullWidth
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
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
                        </Grid>
                        <Grid size={{ xs: 12 }}>
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
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                name="phone"
                                label="Phone"
                                value={formData.phone}
                                onChange={handleChange}
                                fullWidth
                            />
                        </Grid>


                        {/* Classes Multi-Select */}
                        <Grid size={{ xs: 12 }}>
                            <Autocomplete
                                multiple
                                options={classOptions}
                                getOptionLabel={(option) => option.label}
                                value={classOptions.filter(opt => formData.classes?.includes(opt.id))}
                                onChange={(_, newValue) => {
                                    const newClassIds = newValue.map(v => v.id);
                                    // Clear sections that are no longer valid when classes change
                                    const validSections = formData.sections?.filter(sId => {
                                        return classes.some(c =>
                                            newClassIds.includes(c.classId) &&
                                            c.sections.some(s => s.sectionId === sId)
                                        );
                                    }) || [];
                                    setFormData(prev => ({
                                        ...prev,
                                        classes: newClassIds,
                                        sections: validSections,
                                    }));
                                }}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Assigned Classes"
                                        placeholder="Select classes"
                                    />
                                )}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            label={option.label}
                                            {...getTagProps({ index })}
                                            key={option.id}
                                            color="primary"
                                            variant="outlined"
                                        />
                                    ))
                                }
                                renderOption={(props, option) => (
                                    <li {...props} key={option.id}>
                                        <div>
                                            <strong>{option.label}</strong>
                                            {option.sections && (
                                                <span style={{ color: 'gray', marginLeft: 8 }}>
                                                    Sections: {option.sections}
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                )}
                            />
                        </Grid>

                        {/* Sections Multi-Select - Only show if classes are selected */}
                        {formData.classes && formData.classes.length > 0 && (
                            <Grid size={{ xs: 12 }}>
                                <Autocomplete
                                    multiple
                                    options={
                                        classes
                                            .filter(c => formData.classes?.includes(c.classId))
                                            .flatMap(c =>
                                                c.sections.map(s => ({
                                                    id: s.sectionId,
                                                    label: `${c.name} - ${s.name}`,
                                                    className: c.name,
                                                    sectionName: s.name
                                                }))
                                            )
                                    }
                                    getOptionLabel={(option) => option.label}
                                    value={
                                        classes
                                            .filter(c => formData.classes?.includes(c.classId))
                                            .flatMap(c =>
                                                c.sections
                                                    .filter(s => formData.sections?.includes(s.sectionId))
                                                    .map(s => ({
                                                        id: s.sectionId,
                                                        label: `${c.name} - ${s.name}`,
                                                        className: c.name,
                                                        sectionName: s.name
                                                    }))
                                            )
                                    }
                                    onChange={(_, newValue) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            sections: newValue.map(v => v.id),
                                        }));
                                    }}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Assigned Sections (Optional)"
                                            placeholder="Select specific sections"
                                            helperText="Leave empty to assign to entire class"
                                        />
                                    )}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip
                                                label={option.label}
                                                {...getTagProps({ index })}
                                                key={option.id}
                                                color="secondary"
                                                variant="outlined"
                                            />
                                        ))
                                    }
                                />
                            </Grid>
                        )}

                        {/* Subjects Multi-Select */}
                        <Grid size={{ xs: 12 }}>
                            <Autocomplete
                                multiple
                                options={subjectOptions}
                                getOptionLabel={(option) => option.label}
                                value={subjectOptions.filter(opt => formData.subjects?.includes(opt.id))}
                                onChange={(_, newValue) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        subjects: newValue.map(v => v.id),
                                    }));
                                }}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Assigned Subjects"
                                        placeholder="Select subjects"
                                    />
                                )}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            label={option.label}
                                            {...getTagProps({ index })}
                                            key={option.id}
                                            color="secondary"
                                            variant="outlined"
                                        />
                                    ))
                                }
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={formData.status}
                                    label="Status"
                                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                                >
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClose} color="inherit">Cancel</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isPending}
                        startIcon={isPending ? <CircularProgress size={20} /> : null}
                    >
                        {isPending ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default TeacherDialog;
