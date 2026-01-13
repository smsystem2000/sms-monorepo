import React, { useState } from 'react';
import {
    Box,
    Card,
    Tab,
    Tabs,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from '../../../context/AuthContext';
import {
    useCreateExamTerm,
    useGetExamTerms,
    useUpdateExamTerm,
    useDeleteExamTerm,
    useCreateExamType,
    useGetExamTypes,
    useDeleteExamType,
    useCreateGradingSystem,
    useGetGradingSystems,
    useDeleteGradingSystem
} from '../../../queries/Exam';
import type { CreateExamTermRequest, CreateExamTypeRequest, GradeRange } from '../../../types/exam.types';

// ==========================================
// EXAM CONFIGURATION PAGE
// ==========================================

const ExamConfiguration = () => {
    const [activeTab, setActiveTab] = useState(0);
    const { user } = useAuth();
    const schoolId = user?.schoolId || '';

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Exam Configuration</h1>
            </div>

            <Card className="mb-6">
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="exam configuration tabs">
                    <Tab label="Exam Terms" />
                    <Tab label="Exam Types" />
                    <Tab label="Grading Systems" />
                </Tabs>
            </Card>

            <div role="tabpanel" hidden={activeTab !== 0}>
                {activeTab === 0 && <ExamTermsTab schoolId={schoolId} />}
            </div>
            <div role="tabpanel" hidden={activeTab !== 1}>
                {activeTab === 1 && <ExamTypesTab schoolId={schoolId} />}
            </div>
            <div role="tabpanel" hidden={activeTab !== 2}>
                {activeTab === 2 && <GradingSystemsTab schoolId={schoolId} />}
            </div>
        </div>
    );
};

// ==========================================
// TAB 1: EXAM TERMS
// ==========================================

const ExamTermsTab = ({ schoolId }: { schoolId: string }) => {
    const [open, setOpen] = useState(false);
    const [editingTerm, setEditingTerm] = useState<any>(null);
    const { data: terms, isLoading } = useGetExamTerms(schoolId);
    const createTerm = useCreateExamTerm(schoolId);
    const updateTerm = useUpdateExamTerm(schoolId);
    const deleteTerm = useDeleteExamTerm(schoolId);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState<CreateExamTermRequest>({
        name: '',
        academicYear: '2025-2026',
        startDate: '',
        endDate: ''
    });

    const handleEdit = (term: any) => {
        setEditingTerm(term);
        setFormData({
            name: term.name,
            academicYear: term.academicYear,
            startDate: term.startDate?.split('T')[0] || '',
            endDate: term.endDate?.split('T')[0] || ''
        });
        setErrors({});
        setOpen(true);
    };

    const handleDelete = (termId: string) => {
        if (window.confirm('Are you sure you want to delete this term?')) {
            deleteTerm.mutate(termId);
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.name?.trim()) newErrors.name = 'Name is required';
        if (!formData.academicYear?.trim()) newErrors.academicYear = 'Academic year is required';
        if (!formData.startDate) newErrors.startDate = 'Start date is required';
        if (!formData.endDate) newErrors.endDate = 'End date is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFieldChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) setErrors({ ...errors, [field]: '' });
    };

    const handleSubmit = () => {
        if (!validate()) return;
        if (editingTerm) {
            updateTerm.mutate({ termId: editingTerm._id, data: formData }, {
                onSuccess: () => {
                    setOpen(false);
                    setEditingTerm(null);
                    setFormData({ name: '', academicYear: '2025-2026', startDate: '', endDate: '' });
                }
            });
        } else {
            createTerm.mutate(formData, {
                onSuccess: () => {
                    setOpen(false);
                    setFormData({ name: '', academicYear: '2025-2026', startDate: '', endDate: '' });
                }
            });
        }
    };

    const handleClose = () => {
        setOpen(false);
        setEditingTerm(null);
        setFormData({ name: '', academicYear: '2025-2026', startDate: '', endDate: '' });
        setErrors({});
    };

    return (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
                <Typography variant="h6">Academic Terms</Typography>
                <Button variant="contained" startIcon={<AddCircleIcon />} onClick={() => setOpen(true)}>
                    Add Term
                </Button>
            </div>

            <TableContainer component={Paper} elevation={0} variant="outlined">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Academic Year</TableCell>
                            <TableCell>Start Date</TableCell>
                            <TableCell>End Date</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={6} align="center">Loading...</TableCell></TableRow>
                        ) : terms?.data?.map((term: any) => (
                            <TableRow key={term._id}>
                                <TableCell>{term.name}</TableCell>
                                <TableCell>{term.academicYear}</TableCell>
                                <TableCell>{new Date(term.startDate).toLocaleDateString()}</TableCell>
                                <TableCell>{new Date(term.endDate).toLocaleDateString()}</TableCell>
                                <TableCell>{term.isActive ? 'Active' : 'Inactive'}</TableCell>
                                <TableCell>
                                    <IconButton size="small" color="primary" onClick={() => handleEdit(term)}><EditIcon /></IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleDelete(term._id)}><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {terms?.data?.length === 0 && (
                            <TableRow><TableCell colSpan={6} align="center">No terms found</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose} fullWidth>
                <DialogTitle>{editingTerm ? 'Edit Term' : 'Add New Term'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Term Name"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            error={!!errors.name}
                            helperText={errors.name}
                        />
                        <TextField
                            label="Academic Year"
                            fullWidth
                            value={formData.academicYear}
                            onChange={(e) => handleFieldChange('academicYear', e.target.value)}
                            error={!!errors.academicYear}
                            helperText={errors.academicYear}
                        />
                        <TextField
                            label="Start Date"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={formData.startDate}
                            onChange={(e) => handleFieldChange('startDate', e.target.value)}
                            error={!!errors.startDate}
                            helperText={errors.startDate}
                        />
                        <TextField
                            label="End Date"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={formData.endDate}
                            onChange={(e) => handleFieldChange('endDate', e.target.value)}
                            error={!!errors.endDate}
                            helperText={errors.endDate}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={createTerm.isPending || updateTerm.isPending}>
                        {(createTerm.isPending || updateTerm.isPending) ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

// ==========================================
// TAB 2: EXAM TYPES
// ==========================================

const ExamTypesTab = ({ schoolId }: { schoolId: string }) => {
    const [open, setOpen] = useState(false);
    const { data: types, isLoading } = useGetExamTypes(schoolId);
    const { data: terms } = useGetExamTerms(schoolId);
    const createType = useCreateExamType(schoolId);
    const deleteType = useDeleteExamType(schoolId);

    const [formData, setFormData] = useState<CreateExamTypeRequest>({
        name: '',
        weightage: 100,
        description: '',
        termId: ''
    });

    const handleDelete = (typeId: string) => {
        if (window.confirm('Are you sure you want to delete this exam type?')) {
            deleteType.mutate(typeId);
        }
    };

    const handleSubmit = () => {
        createType.mutate(formData, {
            onSuccess: () => {
                setOpen(false);
                setFormData({ name: '', weightage: 100, description: '', termId: '' });
            }
        });
    };

    return (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
                <Typography variant="h6">Exam Types</Typography>
                <Button variant="contained" startIcon={<AddCircleIcon />} onClick={() => setOpen(true)}>
                    Add Exam Type
                </Button>
            </div>

            <TableContainer component={Paper} elevation={0} variant="outlined">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Related Term</TableCell>
                            <TableCell>Weightage</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} align="center">Loading...</TableCell></TableRow>
                        ) : types?.data?.map((type: any) => (
                            <TableRow key={type._id}>
                                <TableCell>{type.name}</TableCell>
                                <TableCell>{type.termId?.name || 'N/A'}</TableCell>
                                <TableCell>{type.weightage}%</TableCell>
                                <TableCell>{type.description}</TableCell>
                                <TableCell>
                                    <IconButton size="small" color="error" onClick={() => handleDelete(type._id)}><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
                <DialogTitle>Add Exam Type</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Name"
                            fullWidth
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Associated Term (Optional)</InputLabel>
                            <Select
                                value={formData.termId}
                                label="Associated Term (Optional)"
                                onChange={(e) => setFormData({ ...formData, termId: e.target.value })}
                            >
                                <MenuItem value="">None</MenuItem>
                                {terms?.data?.map((t: any) => (
                                    <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Weightage (%)"
                            type="number"
                            fullWidth
                            value={formData.weightage}
                            onChange={(e) => setFormData({ ...formData, weightage: parseInt(e.target.value) })}
                        />
                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={2}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={createType.isPending}>
                        {createType.isPending ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

// ==========================================
// TAB 3: GRADING SYSTEMS
// ==========================================

const GradingSystemsTab = ({ schoolId }: { schoolId: string }) => {
    const [open, setOpen] = useState(false);
    const { data: systems, isLoading } = useGetGradingSystems(schoolId);
    const createSystem = useCreateGradingSystem(schoolId);
    const deleteSystem = useDeleteGradingSystem(schoolId);

    const [name, setName] = useState('');
    const [grades, setGrades] = useState<GradeRange[]>([
        { name: 'A1', minPercentage: 91, maxPercentage: 100, points: 10 },
        { name: 'A2', minPercentage: 81, maxPercentage: 90, points: 9 }
    ]);

    const addGradeRow = () => {
        setGrades([...grades, { name: '', minPercentage: 0, maxPercentage: 0, points: 0 }]);
    };

    const updateGradeRow = (index: number, field: keyof GradeRange, value: any) => {
        const newGrades = [...grades];
        newGrades[index] = { ...newGrades[index], [field]: value };
        setGrades(newGrades);
    };

    const removeGradeRow = (index: number) => {
        setGrades(grades.filter((_, i) => i !== index));
    };

    const handleDelete = (systemId: string) => {
        if (window.confirm('Are you sure you want to delete this grading system?')) {
            deleteSystem.mutate(systemId);
        }
    };

    const handleSubmit = () => {
        createSystem.mutate({ name, grades, isDefault: false }, {
            onSuccess: () => {
                setOpen(false);
                setName('');
                setGrades([{ name: 'A1', minPercentage: 91, maxPercentage: 100, points: 10 }]);
            }
        });
    };

    return (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
                <Typography variant="h6">Grading Systems</Typography>
                <Button variant="contained" startIcon={<AddCircleIcon />} onClick={() => setOpen(true)}>
                    Add System
                </Button>
            </div>

            <TableContainer component={Paper} elevation={0} variant="outlined">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>System Name</TableCell>
                            <TableCell>Grades</TableCell>
                            <TableCell>Is Default</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={4} align="center">Loading...</TableCell></TableRow>
                        ) : systems?.data?.map((sys: any) => (
                            <TableRow key={sys._id}>
                                <TableCell>{sys.name}</TableCell>
                                <TableCell>
                                    {sys.grades.map((g: any) => g.name).join(', ')}
                                </TableCell>
                                <TableCell>{sys.isDefault ? 'Yes' : 'No'}</TableCell>
                                <TableCell>
                                    <IconButton size="small" color="error" onClick={() => handleDelete(sys._id)}><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Add Grading System</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="System Name"
                            fullWidth
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />

                        <Typography variant="subtitle2" className="mt-4">Grade Ranges</Typography>
                        {grades.map((grade, index) => (
                            <div key={index} className="flex gap-2 items-center mb-2">
                                <TextField
                                    label="Grade"
                                    size="small"
                                    value={grade.name}
                                    onChange={(e) => updateGradeRow(index, 'name', e.target.value)}
                                />
                                <TextField
                                    label="Min %"
                                    type="number"
                                    size="small"
                                    value={grade.minPercentage}
                                    onChange={(e) => updateGradeRow(index, 'minPercentage', parseFloat(e.target.value))}
                                />
                                <TextField
                                    label="Max %"
                                    type="number"
                                    size="small"
                                    value={grade.maxPercentage}
                                    onChange={(e) => updateGradeRow(index, 'maxPercentage', parseFloat(e.target.value))}
                                />
                                <TextField
                                    label="Points"
                                    type="number"
                                    size="small"
                                    value={grade.points}
                                    onChange={(e) => updateGradeRow(index, 'points', parseFloat(e.target.value))}
                                />
                                <IconButton color="error" onClick={() => removeGradeRow(index)}>
                                    <CancelIcon />
                                </IconButton>
                            </div>
                        ))}
                        <Button startIcon={<AddCircleIcon />} onClick={addGradeRow}>Add Grade</Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={createSystem.isPending}>
                        {createSystem.isPending ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

export default ExamConfiguration;
