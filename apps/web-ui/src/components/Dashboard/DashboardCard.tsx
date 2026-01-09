import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface DashboardCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    to?: string;
    subtitle?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
    title,
    value,
    icon,
    color,
    bgColor,
    to,
    subtitle,
}) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (to) {
            navigate(to);
        }
    };

    return (
        <Paper
            onClick={handleClick}
            sx={{
                p: 3,
                borderRadius: 3,
                cursor: to ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                background: 'white',
                border: '1px solid #e2e8f0',
                '&:hover': to ? {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    borderColor: color,
                } : {},
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                    <Typography
                        variant="body2"
                        sx={{
                            color: '#64748b',
                            fontWeight: 500,
                            mb: 1,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontSize: '0.75rem',
                        }}
                    >
                        {title}
                    </Typography>
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 700,
                            color: '#1e293b',
                            lineHeight: 1,
                        }}
                    >
                        {value}
                    </Typography>
                    {subtitle && (
                        <Typography
                            variant="body2"
                            sx={{
                                color: '#94a3b8',
                                mt: 1,
                                fontSize: '0.85rem',
                            }}
                        >
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                <Box
                    sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: bgColor,
                        color: color,
                    }}
                >
                    {icon}
                </Box>
            </Box>
            {to && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #f1f5f9' }}>
                    <Typography
                        variant="body2"
                        sx={{
                            color: color,
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                        }}
                    >
                        View Details →
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default DashboardCard;
