import React from 'react';
import {
    Box,
    Select,
    MenuItem,
    Avatar,
    Typography,
    FormControl,
    Skeleton,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useChildSelector } from '../../context/ChildSelectorContext';

interface ChildSelectorProps {
    variant?: 'standard' | 'outlined' | 'filled';
    size?: 'small' | 'medium';
}

const ChildSelector: React.FC<ChildSelectorProps> = ({ variant = 'standard', size = 'small' }) => {
    const { selectedChild, setSelectedChild, children, isLoading } = useChildSelector();

    const handleChange = (event: SelectChangeEvent<string>) => {
        const childId = event.target.value;
        const child = children.find(c => c.studentId === childId);
        if (child) {
            setSelectedChild(child);
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Skeleton variant="circular" width={32} height={32} />
                <Skeleton variant="text" width={100} />
            </Box>
        );
    }

    if (children.length === 0) {
        return null;
    }

    // If only one child, show static display
    if (children.length === 1) {
        const child = children[0];
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
                <Avatar
                    src={child.profileImage}
                    alt={`${child.firstName} ${child.lastName}`}
                    sx={{ width: 32, height: 32 }}
                >
                    {child.firstName?.[0]}
                </Avatar>
                <Box>
                    <Typography variant="body2" fontWeight={500} sx={{ lineHeight: 1.2 }}>
                        {child.firstName} {child.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {child.className} - {child.sectionName || child.section}
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <FormControl variant={variant} size={size} sx={{ minWidth: 200 }}>
            <Select
                value={selectedChild?.studentId || ''}
                onChange={handleChange}
                displayEmpty
                renderValue={(value) => {
                    const child = children.find(c => c.studentId === value);
                    if (!child) return 'Select Child';
                    return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar
                                src={child.profileImage}
                                alt={`${child.firstName} ${child.lastName}`}
                                sx={{ width: 24, height: 24 }}
                            >
                                {child.firstName?.[0]}
                            </Avatar>
                            <Typography variant="body2">
                                {child.firstName} {child.lastName}
                            </Typography>
                        </Box>
                    );
                }}
                sx={{
                    '.MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                    }
                }}
            >
                {children.map((child) => (
                    <MenuItem key={child.studentId} value={child.studentId}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                                src={child.profileImage}
                                alt={`${child.firstName} ${child.lastName}`}
                                sx={{ width: 32, height: 32 }}
                            >
                                {child.firstName?.[0]}
                            </Avatar>
                            <Box>
                                <Typography variant="body2" fontWeight={500}>
                                    {child.firstName} {child.lastName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {child.className} - {child.sectionName || child.section}
                                </Typography>
                            </Box>
                        </Box>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

export default ChildSelector;
