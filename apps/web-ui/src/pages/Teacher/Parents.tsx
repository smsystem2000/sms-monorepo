import { useState } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Edit as EditIcon, Block as BlockIcon } from '@mui/icons-material';
import DataTable, { StatusChip } from '../../components/Table/DataTable';
import type { Column } from '../../components/Table/DataTable';
import ParentDialog from '../../components/Dialogs/AddParentDialog';
import { useGetParents, useUpdateParent } from '../../queries/Parent';
import type { Parent } from '../../types';
import TokenService from '../../queries/token/tokenService';

const TeacherParentsPage = () => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editData, setEditData] = useState<Parent | null>(null);

    const schoolId = TokenService.getSchoolId() || '';
    const { data, isLoading, error } = useGetParents(schoolId);
    const updateMutation = useUpdateParent(schoolId);

    const parents = data?.data || [];

    const handleAdd = () => {
        setEditData(null);
        setDialogOpen(true);
    };

    const handleEdit = (parent: Parent) => {
        setEditData(parent);
        setDialogOpen(true);
    };

    const handleToggleStatus = async (parent: Parent) => {
        const newStatus = parent.status === 'active' ? 'inactive' : 'active';
        try {
            await updateMutation.mutateAsync({
                parentId: parent.parentId,
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

    const columns: Column<Parent>[] = [
        { id: 'parentId', label: 'ID', minWidth: 100 },
        {
            id: 'firstName',
            label: 'Name',
            minWidth: 150,
            format: (_, row) => `${row.firstName} ${row.lastName}`,
        },
        { id: 'email', label: 'Email', minWidth: 180 },
        { id: 'phone', label: 'Phone', minWidth: 120 },
        {
            id: 'relationship',
            label: 'Relationship',
            minWidth: 100,
            format: (value) => (value as string)?.charAt(0).toUpperCase() + (value as string)?.slice(1),
        },
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
            <DataTable<Parent>
                title="Parents"
                columns={columns}
                data={parents}
                isLoading={isLoading}
                error={error ? (error as { message?: string })?.message || 'Failed to load parents' : null}
                onAddClick={handleAdd}
                addButtonLabel="Add Parent"
                emptyMessage="No parents found. Click 'Add Parent' to create one."
                getRowKey={(row) => row.parentId}
            />

            <ParentDialog
                open={dialogOpen}
                onClose={handleDialogClose}
                schoolId={schoolId}
                editData={editData}
            />
        </Box>
    );
};

export default TeacherParentsPage;
