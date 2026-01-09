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
    Typography,
    Box,
    Chip,
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useCreateClass, useUpdateClass, useAddSection } from '../../queries/Class';
import type { Class, CreateClassPayload } from '../../types';

interface ClassDialogProps {
    open: boolean;
    onClose: () => void;
    schoolId: string;
    editData?: Class | null;
}

interface SectionInput {
    name: string;
    isNew?: boolean;
}

const ClassDialog: React.FC<ClassDialogProps> = ({ open, onClose, schoolId, editData }) => {
    const isEditMode = !!editData;

    const [formData, setFormData] = useState<CreateClassPayload>({
        name: '',
        description: '',
        sections: [],
    });

    const [newSections, setNewSections] = useState<SectionInput[]>([]);
    const [newSectionName, setNewSectionName] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const createMutation = useCreateClass(schoolId);
    const updateMutation = useUpdateClass(schoolId);
    const addSectionMutation = useAddSection(schoolId);

    useEffect(() => {
        if (editData) {
            setFormData({
                name: editData.name || '',
                description: editData.description || '',
                sections: [],
            });
            setNewSections([]);
        } else {
            setFormData({
                name: '',
                description: '',
                sections: [],
            });
            setNewSections([]);
        }
    }, [editData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleAddSection = () => {
        if (!newSectionName.trim()) return;

        // Check for duplicate section names
        const existingSections = isEditMode ? editData?.sections || [] : [];
        const allSectionNames = [
            ...existingSections.map(s => s.name.toLowerCase()),
            ...newSections.map(s => s.name.toLowerCase()),
        ];

        if (allSectionNames.includes(newSectionName.toLowerCase())) {
            setErrors((prev) => ({ ...prev, section: 'Section name already exists' }));
            return;
        }

        setNewSections((prev) => [...prev, { name: newSectionName, isNew: true }]);
        setNewSectionName('');
        setErrors((prev) => ({ ...prev, section: '' }));
    };

    const handleRemoveNewSection = (index: number) => {
        setNewSections((prev) => prev.filter((_, i) => i !== index));
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = 'Class name is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            if (isEditMode && editData) {
                // Update class details
                await updateMutation.mutateAsync({
                    classId: editData.classId,
                    data: {
                        name: formData.name,
                        description: formData.description,
                    },
                });

                // Add new sections one by one
                for (const section of newSections) {
                    await addSectionMutation.mutateAsync({
                        classId: editData.classId,
                        data: { name: section.name },
                    });
                }
            } else {
                // Create class with sections
                await createMutation.mutateAsync({
                    ...formData,
                    sections: newSections.map(s => ({ name: s.name })),
                });
            }
            handleClose();
        } catch {
            // Error handled by mutation
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            description: '',
            sections: [],
        });
        setNewSections([]);
        setNewSectionName('');
        setErrors({});
        createMutation.reset();
        updateMutation.reset();
        addSectionMutation.reset();
        onClose();
    };

    const isPending = createMutation.isPending || updateMutation.isPending || addSectionMutation.isPending;
    const isError = createMutation.isError || updateMutation.isError || addSectionMutation.isError;
    const errorMessage = (createMutation.error as { message?: string })?.message ||
        (updateMutation.error as { message?: string })?.message ||
        (addSectionMutation.error as { message?: string })?.message ||
        'Operation failed';

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {isEditMode ? 'Edit Class' : 'Add Class'}
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
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                name="name"
                                label="Class Name"
                                value={formData.name}
                                onChange={handleChange}
                                error={!!errors.name}
                                helperText={errors.name}
                                required
                                fullWidth
                                placeholder="e.g., Class 10, Grade 5"
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                name="description"
                                label="Description"
                                value={formData.description}
                                onChange={handleChange}
                                fullWidth
                                multiline
                                rows={2}
                            />
                        </Grid>

                        {/* Existing Sections (in edit mode) */}
                        {isEditMode && editData && editData.sections.length > 0 && (
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                    Existing Sections
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {editData.sections.map((section) => (
                                        <Chip
                                            key={section.sectionId}
                                            label={section.name}
                                            color="primary"
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>
                            </Grid>
                        )}

                        {/* Add New Sections */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                {isEditMode ? 'Add New Sections' : 'Sections'}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                <TextField
                                    size="small"
                                    placeholder="Section name (e.g., A, B)"
                                    value={newSectionName}
                                    onChange={(e) => setNewSectionName(e.target.value)}
                                    error={!!errors.section}
                                    helperText={errors.section}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddSection();
                                        }
                                    }}
                                    sx={{ flex: 1 }}
                                />
                                <Button
                                    variant="outlined"
                                    onClick={handleAddSection}
                                    startIcon={<AddIcon />}
                                >
                                    Add
                                </Button>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {newSections.map((section, index) => (
                                    <Chip
                                        key={index}
                                        label={section.name}
                                        color="success"
                                        onDelete={() => handleRemoveNewSection(index)}
                                        deleteIcon={<DeleteIcon />}
                                    />
                                ))}
                            </Box>
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

export default ClassDialog;
