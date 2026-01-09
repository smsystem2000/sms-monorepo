import React from 'react';
import DataTableBase, { type TableColumn } from 'react-data-table-component';
import {
    Box,
    Typography,
    Button,
    CircularProgress,
    Chip,
    Paper,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { customTableStyles } from '../../style/dataTableTheme';

// Column definition - maintain backward compatibility
export interface Column<T> {
    id: keyof T | string;
    label: string;
    minWidth?: number;
    align?: 'left' | 'center' | 'right';
    format?: (value: T[keyof T], row: T) => React.ReactNode;
    hide?: 'sm' | 'md'; // Hide column on small/medium screens
    sortable?: boolean;
}

interface DataTableProps<T> {
    title: string;
    columns: Column<T>[];
    data: T[];
    isLoading?: boolean;
    error?: string | null;
    onAddClick?: () => void;
    addButtonLabel?: string;
    emptyMessage?: string;
    getRowKey?: (row: T) => string;
    onRowClick?: (row: T) => void;
    pagination?: boolean;
    paginationPerPage?: number;
}

// Transform our Column type to react-data-table-component's TableColumn
function transformColumns<T>(columns: Column<T>[]): TableColumn<T>[] {
    return columns.map((col) => ({
        name: col.label,
        selector: (row: T) => {
            const value = (row as Record<string, unknown>)[col.id as string];
            return value as string | number;
        },
        cell: col.format
            ? (row: T) => {
                const value = (row as Record<string, unknown>)[col.id as string];
                return col.format!(value as T[keyof T], row);
            }
            : undefined,
        sortable: col.sortable ?? true,
        minWidth: col.minWidth ? `${col.minWidth}px` : undefined,
        right: col.align === 'right',
        center: col.align === 'center',
        omit: false,
        hide: col.hide === 'sm' ? 600 : col.hide === 'md' ? 900 : undefined,
    }));
}

function DataTable<T>({
    title,
    columns,
    data,
    isLoading = false,
    error = null,
    onAddClick,
    addButtonLabel = 'Add New',
    emptyMessage = 'No data found',
    // getRowKey - not used by react-data-table-component but kept for interface compatibility
    onRowClick,
    pagination = true,
    paginationPerPage = 10,
}: DataTableProps<T>) {
    const transformedColumns = transformColumns(columns);

    // Custom loading component
    const LoadingComponent = () => (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" sx={{ mt: 2 }}>
                Loading...
            </Typography>
        </Box>
    );

    // Custom no data component
    const NoDataComponent = () => (
        <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">{error || emptyMessage}</Typography>
        </Box>
    );

    return (
        <Box sx={{ width: '100%' }}>
            {/* Header */}
            {(title || onAddClick) && (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 3,
                        flexWrap: 'wrap',
                        gap: 2,
                    }}
                >
                    {title && (
                        <Typography variant="h5" fontWeight={600} color="text.primary">
                            {title}
                        </Typography>
                    )}
                    {onAddClick && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={onAddClick}
                            sx={{
                                textTransform: 'none',
                                borderRadius: 2,
                                px: 3,
                            }}
                        >
                            {addButtonLabel}
                        </Button>
                    )}
                </Box>
            )}

            {/* Table */}
            <Paper
                sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
            >
                <DataTableBase<T>
                    columns={transformedColumns}
                    data={data}
                    progressPending={isLoading}
                    progressComponent={<LoadingComponent />}
                    noDataComponent={<NoDataComponent />}
                    customStyles={customTableStyles}
                    pagination={pagination}
                    paginationPerPage={paginationPerPage}
                    paginationRowsPerPageOptions={[10, 20, 30, 50]}
                    highlightOnHover
                    pointerOnHover={!!onRowClick}
                    onRowClicked={onRowClick}
                    responsive
                />
            </Paper>
        </Box>
    );
}

// Helper component for status chips
export const StatusChip: React.FC<{ status: 'active' | 'inactive' }> = ({ status }) => (
    <Chip
        label={status}
        size="small"
        color={status === 'active' ? 'success' : 'default'}
        sx={{ textTransform: 'capitalize' }}
    />
);

export default DataTable;
