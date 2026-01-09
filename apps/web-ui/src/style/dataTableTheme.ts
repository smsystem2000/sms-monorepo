import type { TableStyles } from 'react-data-table-component';

// Custom theme for react-data-table-component
// Matches the existing SchoolAdmin design system
export const customTableStyles: TableStyles = {
    table: {
        style: {
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
    },
    headRow: {
        style: {
            backgroundColor: '#f5f5f5',
            borderBottomWidth: '1px',
            borderBottomColor: '#e0e0e0',
            borderBottomStyle: 'solid',
            minHeight: '52px',
        },
    },
    headCells: {
        style: {
            fontWeight: 600,
            fontSize: '14px',
            color: 'rgba(0, 0, 0, 0.87)',
            paddingLeft: '16px',
            paddingRight: '16px',
        },
    },
    rows: {
        style: {
            minHeight: '52px',
            fontSize: '14px',
            '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                cursor: 'pointer',
            },
        },
        highlightOnHoverStyle: {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            borderBottomColor: '#e0e0e0',
            outline: 'none',
        },
    },
    cells: {
        style: {
            paddingLeft: '16px',
            paddingRight: '16px',
            color: 'rgba(0, 0, 0, 0.87)',
        },
    },
    pagination: {
        style: {
            borderTopWidth: '1px',
            borderTopColor: '#e0e0e0',
            borderTopStyle: 'solid',
            minHeight: '56px',
        },
        pageButtonsStyle: {
            borderRadius: '50%',
            height: '40px',
            width: '40px',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            fill: 'rgba(0, 0, 0, 0.54)',
            '&:hover:not(:disabled)': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
            '&:disabled': {
                cursor: 'not-allowed',
                fill: 'rgba(0, 0, 0, 0.26)',
            },
        },
    },
    noData: {
        style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            color: 'rgba(0, 0, 0, 0.6)',
        },
    },
    progress: {
        style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
        },
    },
};

// Responsive styles override for mobile
export const mobileTableStyles: TableStyles = {
    ...customTableStyles,
    headCells: {
        style: {
            ...customTableStyles.headCells?.style,
            fontSize: '12px',
            paddingLeft: '8px',
            paddingRight: '8px',
        },
    },
    cells: {
        style: {
            ...customTableStyles.cells?.style,
            fontSize: '13px',
            paddingLeft: '8px',
            paddingRight: '8px',
        },
    },
    rows: {
        style: {
            ...customTableStyles.rows?.style,
            minHeight: '48px',
        },
    },
};
