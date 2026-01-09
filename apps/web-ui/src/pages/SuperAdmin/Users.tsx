import React, { useState } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Edit as EditIcon, Block as BlockIcon } from '@mui/icons-material';
import DataTable, { StatusChip } from '../../components/Table/DataTable';
import type { Column } from '../../components/Table/DataTable';
import SchoolAdminDialog from '../../components/Dialogs/AddSchoolAdminDialog';
import { useGetSchoolAdmins, useUpdateSchoolAdmin } from '../../queries/SchoolAdmin';
import type { SchoolAdmin } from '../../types';

const UsersPage: React.FC = () => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editData, setEditData] = useState<SchoolAdmin | null>(null);

    const { data, isLoading, error } = useGetSchoolAdmins();
    const updateMutation = useUpdateSchoolAdmin();

    const users = data?.data || [];

    const handleAdd = () => {
        setEditData(null);
        setDialogOpen(true);
    };

    const handleEdit = (user: SchoolAdmin) => {
        setEditData(user);
        setDialogOpen(true);
    };

    const handleToggleStatus = async (user: SchoolAdmin) => {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        try {
            await updateMutation.mutateAsync({
                userId: user.userId,
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

    const columns: Column<SchoolAdmin>[] = [
        { id: 'userId', label: 'User ID', minWidth: 100 },
        { id: 'username', label: 'Username', minWidth: 150 },
        { id: 'email', label: 'Email', minWidth: 200 },
        { id: 'schoolId', label: 'School ID', minWidth: 120 },
        { id: 'contactNumber', label: 'Contact', minWidth: 130 },
        {
            id: 'status',
            label: 'Status',
            minWidth: 100,
            align: 'center',
            format: (value) => <StatusChip status={(value as 'active' | 'inactive') || 'active'} />,
        },
        {
            id: 'createdAt',
            label: 'Created',
            minWidth: 120,
            format: (value) =>
                value ? new Date(value as string).toLocaleDateString() : '-',
        },
        {
            id: 'actions',
            label: 'Actions',
            minWidth: 120,
            align: 'center',
            format: (_, row) => (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Tooltip title="Edit">
                        <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(row);
                            }}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={row.status === 'active' ? 'Deactivate' : 'Activate'}>
                        <IconButton
                            size="small"
                            color={row.status === 'active' ? 'error' : 'success'}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(row);
                            }}
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
        <Box sx={{ p: 3 }}>
            <DataTable<SchoolAdmin>
                title="School Administrators"
                columns={columns}
                data={users}
                isLoading={isLoading}
                error={error ? (error as { message?: string })?.message || 'Failed to load users' : null}
                onAddClick={handleAdd}
                addButtonLabel="Add School Admin"
                emptyMessage="No school administrators found. Click 'Add School Admin' to create one."
                getRowKey={(row) => row.userId}
            />

            <SchoolAdminDialog
                open={dialogOpen}
                onClose={handleDialogClose}
                editData={editData}
            />
        </Box>
    );
};

export default UsersPage;
