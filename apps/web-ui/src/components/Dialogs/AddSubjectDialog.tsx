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
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useCreateSubject, useUpdateSubject } from '../../queries/Subject';
import type { Subject, CreateSubjectPayload } from '../../types';

interface SubjectDialogProps {
    open: boolean;
    onClose: () => void;
    schoolId: string;
    editData?: Subject | null;
}

const SubjectDialog: React.FC<SubjectDialogProps> = ({ open, onClose, schoolId, editData }) => {
    const isEditMode = !!editData;

    const [formData, setFormData] = useState<CreateSubjectPayload>({
        name: '',
        code: '',
        description: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const createMutation = useCreateSubject(schoolId);
    const updateMutation = useUpdateSubject(schoolId);

    useEffect(() => {
        if (editData) {
            setFormData({
                name: editData.name || '',
                code: editData.code || '',
                description: editData.description || '',
            });
        } else {
            setFormData({
                name: '',
                code: '',
                description: '',
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

        if (!formData.name.trim()) newErrors.name = 'Subject name is required';
        if (!formData.code.trim()) {
            newErrors.code = 'Subject code is required';
        } else if (formData.code.length > 10) {
            newErrors.code = 'Code must be 10 characters or less';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            if (isEditMode && editData) {
                await updateMutation.mutateAsync({
                    subjectId: editData.subjectId,
                    data: formData,
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
            name: '',
            code: '',
            description: '',
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
                {isEditMode ? 'Edit Subject' : 'Add Subject'}
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
                                label="Subject Name"
                                value={formData.name}
                                onChange={handleChange}
                                error={!!errors.name}
                                helperText={errors.name}
                                required
                                fullWidth
                                placeholder="e.g., Mathematics, English"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                name="code"
                                label="Subject Code"
                                value={formData.code}
                                onChange={handleChange}
                                error={!!errors.code}
                                helperText={errors.code || 'Short code (e.g., MATH, ENG)'}
                                required
                                fullWidth
                                inputProps={{ style: { textTransform: 'uppercase' } }}
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
                                rows={3}
                            />
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

export default SubjectDialog;
