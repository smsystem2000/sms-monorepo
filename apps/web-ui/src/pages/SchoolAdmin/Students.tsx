import { useState } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Edit as EditIcon, Block as BlockIcon } from '@mui/icons-material';
import DataTable, { StatusChip } from '../../components/Table/DataTable';
import type { Column } from '../../components/Table/DataTable';
import StudentDialog from '../../components/Dialogs/AddStudentDialog';
import { useGetStudents, useUpdateStudent } from '../../queries/Student';
import type { Student } from '../../types';
import TokenService from '../../queries/token/tokenService';

const StudentsPage = () => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editData, setEditData] = useState<Student | null>(null);

    const schoolId = TokenService.getSchoolId() || '';
    const { data, isLoading, error } = useGetStudents(schoolId);
    const updateMutation = useUpdateStudent(schoolId);

    const students = data?.data || [];

    const handleAdd = () => {
        setEditData(null);
        setDialogOpen(true);
    };

    const handleEdit = (student: Student) => {
        setEditData(student);
        setDialogOpen(true);
    };

    const handleToggleStatus = async (student: Student) => {
        const newStatus = student.status === 'active' ? 'inactive' : 'active';
        try {
            await updateMutation.mutateAsync({
                studentId: student.studentId,
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

    const columns: Column<Student>[] = [
        { id: 'studentId', label: 'ID', minWidth: 100 },
        {
            id: 'firstName',
            label: 'Name',
            minWidth: 150,
            format: (_, row) => `${row.firstName} ${row.lastName}`,
        },
        {
            id: 'class',
            label: 'Class',
            minWidth: 80,
            format: (value, row) => row.className || value || '-',
        },
        {
            id: 'section',
            label: 'Section',
            minWidth: 80,
            format: (value, row) => row.sectionName || value || '-',
        },
        { id: 'rollNumber', label: 'Roll No', minWidth: 80 },
        {
            id: 'parentName',
            label: 'Parent',
            minWidth: 120,
            format: (value, row) => value || (row.parentId ? 'Unknown' : 'Not Linked'),
        },
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
            <DataTable<Student>
                title="Students"
                columns={columns}
                data={students}
                isLoading={isLoading}
                error={error ? (error as { message?: string })?.message || 'Failed to load students' : null}
                onAddClick={handleAdd}
                addButtonLabel="Add Student"
                emptyMessage="No students found. Click 'Add Student' to create one."
                getRowKey={(row) => row.studentId}
            />

            <StudentDialog
                open={dialogOpen}
                onClose={handleDialogClose}
                schoolId={schoolId}
                editData={editData}
            />
        </Box>
    );
};

export default StudentsPage;
