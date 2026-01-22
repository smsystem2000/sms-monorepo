import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Chip,
    Alert,
    Skeleton,
    Button,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Stack,
} from '@mui/material';
import {
    Add as AddIcon,
    MailOutline as MailIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ContentCopy as DuplicateIcon,
    Preview as PreviewIcon,
} from '@mui/icons-material';
import { useEmailTemplates, useDeleteEmailTemplate, useDuplicateEmailTemplate, useCreateEmailTemplate, useTemplateTypes } from '../../../queries/EmailTemplate';
import TokenService from '../../../queries/token/tokenService';
import type { EmailTemplate, TemplateType } from '../../../types/emailTemplate';
import { useNavigate } from 'react-router-dom';

const templateTypeLabels: Record<TemplateType, string> = {
    welcome: 'Welcome Email',
    announcement: 'Announcement',
    student_absent: 'Student Absent',
    parent_teacher_meeting: 'Parent-Teacher Meeting',
    leave_approval: 'Leave Approval',
    leave_rejection: 'Leave Rejection',
    exam_results: 'Exam Results',
    fee_reminder: 'Fee Reminder',
    custom: 'Custom',
};

const templateTypeColors: Record<TemplateType, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    welcome: 'success',
    announcement: 'primary',
    student_absent: 'error',
    parent_teacher_meeting: 'secondary',
    leave_approval: 'success',
    leave_rejection: 'error',
    exam_results: 'info',
    fee_reminder: 'warning',
    custom: 'default',
};

const EmailTemplateList: React.FC = () => {
    const schoolId = TokenService.getSchoolId() || '';
    const navigate = useNavigate();

    const [filterType, setFilterType] = useState<TemplateType | ''>('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [newTemplateType, setNewTemplateType] = useState<TemplateType>('custom');

    const { data, isLoading, error, refetch } = useEmailTemplates(schoolId, filterType || undefined, true);
    const deleteTemplate = useDeleteEmailTemplate(schoolId);
    const duplicateTemplate = useDuplicateEmailTemplate(schoolId);
    const createTemplate = useCreateEmailTemplate(schoolId);
    const { data: templateTypes } = useTemplateTypes(schoolId);

    const templates = data?.templates || [];

    const handleDelete = async () => {
        if (selectedTemplate) {
            await deleteTemplate.mutateAsync(selectedTemplate._id);
            setDeleteDialogOpen(false);
            setSelectedTemplate(null);
            refetch();
        }
    };

    const handleDuplicate = async (template: EmailTemplate) => {
        await duplicateTemplate.mutateAsync(template._id);
        refetch();
    };

    const handleCreateTemplate = async () => {
        if (!newTemplateName.trim()) return;

        try {
            const result = await createTemplate.mutateAsync({
                templateName: newTemplateName,
                templateType: newTemplateType,
                subject: `{{school.name}} - ${newTemplateName}`,
                htmlContent: `<div style="font-family: Arial, sans-serif; padding: 20px;">
    <h2>{{school.name}}</h2>
    <p>Dear {{student.firstName || parent.father.name || 'User'}},</p>
    <p>Your content here...</p>
    <p>Best regards,<br/>{{school.name}}</p>
</div>`,
            });
            setCreateDialogOpen(false);
            setNewTemplateName('');
            // Navigate to edit the new template
            navigate(`/school-admin/email-templates/${result._id}`);
        } catch (err) {
            console.error('Error creating template:', err);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load email templates. Please try again later.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MailIcon color="primary" />
                        <Typography variant="h4" fontWeight={600}>
                            Email Templates
                        </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                        Create and manage email notification templates
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateDialogOpen(true)}
                >
                    Create Template
                </Button>
            </Box>

            {/* Filter */}
            <Box sx={{ mb: 3 }}>
                <TextField
                    select
                    size="small"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as TemplateType | '')}
                    label="Filter by Type"
                    sx={{ minWidth: 200 }}
                >
                    <MenuItem value="">All Types</MenuItem>
                    {templateTypes?.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                            {type.label}
                        </MenuItem>
                    ))}
                </TextField>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
                {isLoading ? (
                    [1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardContent>
                                <Skeleton variant="text" width="70%" height={30} />
                                <Skeleton variant="text" width="40%" />
                                <Skeleton variant="text" width="100%" />
                            </CardContent>
                        </Card>
                    ))
                ) : templates.length === 0 ? (
                    <Box sx={{ gridColumn: '1 / -1' }}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center', py: 6 }}>
                                <MailIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">
                                    No email templates found
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Create your first email template to send customized notifications
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => setCreateDialogOpen(true)}
                                >
                                    Create First Template
                                </Button>
                            </CardContent>
                        </Card>
                    </Box>
                ) : (
                    templates.map((template: EmailTemplate) => (
                        <Card
                            key={template._id}
                            sx={{
                                height: '100%',
                                borderTop: 4,
                                borderColor: `${templateTypeColors[template.templateType]}.main`,
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: 4,
                                },
                            }}
                            onClick={() => navigate(`/school-admin/email-templates/${template._id}`)}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                                    <Typography variant="h6" fontWeight={600} noWrap sx={{ flex: 1 }}>
                                        {template.templateName}
                                    </Typography>
                                    {template.isDefault && (
                                        <Chip size="small" label="Default" color="primary" variant="outlined" />
                                    )}
                                </Box>

                                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                    <Chip
                                        size="small"
                                        label={templateTypeLabels[template.templateType]}
                                        color={templateTypeColors[template.templateType]}
                                        variant="outlined"
                                    />
                                    <Chip
                                        size="small"
                                        label={template.isActive ? 'Active' : 'Inactive'}
                                        color={template.isActive ? 'success' : 'default'}
                                    />
                                    <Chip
                                        size="small"
                                        label={`v${template.version}`}
                                        variant="outlined"
                                    />
                                </Box>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        mb: 2,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                    }}
                                >
                                    Subject: {template.subject}
                                </Typography>

                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                                    Updated: {formatDate(template.updatedAt)} • v{template.version}
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                                    <Tooltip title="Edit">
                                        <IconButton
                                            size="small"
                                            onClick={() => navigate(`/school-admin/email-templates/${template._id}`)}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Duplicate">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDuplicate(template)}
                                        >
                                            <DuplicateIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Preview">
                                        <IconButton
                                            size="small"
                                            onClick={() => navigate(`/school-admin/email-templates/${template._id}?preview=true`)}
                                        >
                                            <PreviewIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => {
                                                setSelectedTemplate(template);
                                                setDeleteDialogOpen(true);
                                            }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </CardContent>
                        </Card>
                    ))
                )}
            </Box>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Email Template</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete "{selectedTemplate?.templateName}"?
                        This will deactivate the template.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={handleDelete}
                        disabled={deleteTemplate.isPending}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create Template Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Email Template</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            fullWidth
                            label="Template Name"
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                            placeholder="e.g., Welcome Email, Fee Reminder"
                            required
                        />
                        <TextField
                            select
                            fullWidth
                            label="Template Type"
                            value={newTemplateType}
                            onChange={(e) => setNewTemplateType(e.target.value as TemplateType)}
                        >
                            {templateTypes?.map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                    {type.label}
                                </MenuItem>
                            )) || (
                                    <>
                                        <MenuItem value="welcome">Welcome Email</MenuItem>
                                        <MenuItem value="announcement">Announcement</MenuItem>
                                        <MenuItem value="student_absent">Student Absent</MenuItem>
                                        <MenuItem value="parent_teacher_meeting">Parent-Teacher Meeting</MenuItem>
                                        <MenuItem value="leave_approval">Leave Approval</MenuItem>
                                        <MenuItem value="leave_rejection">Leave Rejection</MenuItem>
                                        <MenuItem value="exam_results">Exam Results</MenuItem>
                                        <MenuItem value="fee_reminder">Fee Reminder</MenuItem>
                                        <MenuItem value="custom">Custom</MenuItem>
                                    </>
                                )}
                        </TextField>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setCreateDialogOpen(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateTemplate}
                        disabled={createTemplate.isPending || !newTemplateName.trim()}
                    >
                        {createTemplate.isPending ? 'Creating...' : 'Create & Edit'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EmailTemplateList;
