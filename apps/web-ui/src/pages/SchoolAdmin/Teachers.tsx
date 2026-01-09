import { useState } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Edit as EditIcon, Block as BlockIcon } from '@mui/icons-material';
import DataTable, { StatusChip } from '../../components/Table/DataTable';
import type { Column } from '../../components/Table/DataTable';
import TeacherDialog from '../../components/Dialogs/AddTeacherDialog';
import { useGetTeachers, useUpdateTeacher } from '../../queries/Teacher';
import type { Teacher } from '../../types';
import TokenService from '../../queries/token/tokenService';

const TeachersPage = () => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editData, setEditData] = useState<Teacher | null>(null);

    const schoolId = TokenService.getSchoolId() || '';
    const { data, isLoading, error } = useGetTeachers(schoolId);
    const updateMutation = useUpdateTeacher(schoolId);

    const teachers = data?.data || [];

    const handleAdd = () => {
        setEditData(null);
        setDialogOpen(true);
    };

    const handleEdit = (teacher: Teacher) => {
        setEditData(teacher);
        setDialogOpen(true);
    };

    const handleToggleStatus = async (teacher: Teacher) => {
        const newStatus = teacher.status === 'active' ? 'inactive' : 'active';
        try {
            await updateMutation.mutateAsync({
                teacherId: teacher.teacherId,
                data: { status: newStatus },
            });
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setEditData(null);
    };

    const columns: Column<Teacher>[] = [
        { id: 'teacherId', label: 'ID', minWidth: 100 },
        {
            id: 'firstName',
            label: 'Name',
            minWidth: 150,
            format: (_, row) => `${row.firstName} ${row.lastName}`,
        },
        { id: 'email', label: 'Email', minWidth: 180 },
        { id: 'phone', label: 'Phone', minWidth: 120 },
        {
            id: 'status',
            label: 'Status',
            minWidth: 100,
            align: 'center',
            format: (value) => <StatusChip status={(value as 'active' | 'inactive') || 'active'} />,
        },
        {
            id: 'actions',
            label: 'Actions',
            minWidth: 120,
            align: 'center',
            format: (_, row) => (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Tooltip title="Edit">
                        <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleEdit(row); }}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={row.status === 'active' ? 'Deactivate' : 'Activate'}>
                        <IconButton
                            size="small"
                            color={row.status === 'active' ? 'error' : 'success'}
                            onClick={(e) => { e.stopPropagation(); handleToggleStatus(row); }}
                            disabled={updateMutation.isPending}
                        >
                            <BlockIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <DataTable<Teacher>
                title="Teachers"
                columns={columns}
                data={teachers}
                isLoading={isLoading}
                error={error ? (error as { message?: string })?.message || 'Failed to load teachers' : null}
                onAddClick={handleAdd}
                addButtonLabel="Add Teacher"
                emptyMessage="No teachers found. Click 'Add Teacher' to create one."
                getRowKey={(row) => row.teacherId}
            />

            <TeacherDialog
                open={dialogOpen}
                onClose={handleDialogClose}
                schoolId={schoolId}
                editData={editData}
            />
        </Box>
    );
};

export default TeachersPage;
