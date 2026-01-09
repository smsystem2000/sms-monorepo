import React, { useState } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Edit as EditIcon, Block as BlockIcon } from '@mui/icons-material';
import DataTable, { StatusChip } from '../../components/Table/DataTable';
import type { Column } from '../../components/Table/DataTable';
import SchoolDialog from '../../components/Dialogs/AddSchoolDialog';
import { useGetSchools, useUpdateSchool } from '../../queries/School';
import type { School } from '../../types';

const SchoolsPage: React.FC = () => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editData, setEditData] = useState<School | null>(null);

    const { data, isLoading, error } = useGetSchools();
    const updateMutation = useUpdateSchool();

    const schools = data?.data || [];

    const handleAdd = () => {
        setEditData(null);
        setDialogOpen(true);
    };

    const handleEdit = (school: School) => {
        setEditData(school);
        setDialogOpen(true);
    };

    const handleToggleStatus = async (school: School) => {
        const newStatus = school.status === 'active' ? 'inactive' : 'active';
        try {
            await updateMutation.mutateAsync({
                schoolId: school.schoolId,
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

    const columns: Column<School>[] = [
        { id: 'schoolId', label: 'School ID', minWidth: 120 },
        { id: 'schoolName', label: 'School Name', minWidth: 200 },
        { id: 'schoolEmail', label: 'Email', minWidth: 180 },
        { id: 'schoolContact', label: 'Contact', minWidth: 150 },
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
            <DataTable<School>
                title="Schools"
                columns={columns}
                data={schools}
                isLoading={isLoading}
                error={error ? (error as { message?: string })?.message || 'Failed to load schools' : null}
                onAddClick={handleAdd}
                addButtonLabel="Add School"
                emptyMessage="No schools found. Click 'Add School' to create one."
                getRowKey={(row) => row.schoolId}
            />

            <SchoolDialog
                open={dialogOpen}
                onClose={handleDialogClose}
                editData={editData}
            />
        </Box>
    );
};

export default SchoolsPage;
