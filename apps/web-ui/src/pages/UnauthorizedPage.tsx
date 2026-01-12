import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ShieldIcon from '@mui/icons-material/Shield';

const UnauthorizedPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Animated Background Elements */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '10%',
                    left: '5%',
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(239, 68, 68, 0.1) 0%, transparent 70%)',
                    animation: 'pulse 4s ease-in-out infinite',
                    '@keyframes pulse': {
                        '0%, 100%': { transform: 'scale(1)', opacity: 0.5 },
                        '50%': { transform: 'scale(1.2)', opacity: 0.8 },
                    },
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    bottom: '15%',
                    right: '10%',
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(239, 68, 68, 0.08) 0%, transparent 70%)',
                    animation: 'pulse 5s ease-in-out infinite reverse',
                }}
            />

            <Container maxWidth="sm">
                <Box
                    sx={{
                        textAlign: 'center',
                        color: 'white',
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    {/* Shield Icon with Lock */}
                    <Box
                        sx={{
                            position: 'relative',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 3,
                        }}
                    >
                        <ShieldIcon
                            sx={{
                                fontSize: 140,
                                color: 'rgba(239, 68, 68, 0.2)',
                                position: 'absolute',
                            }}
                        />
                        <LockOutlinedIcon
                            sx={{
                                fontSize: 60,
                                color: '#ef4444',
                                zIndex: 1,
                            }}
                        />
                    </Box>

                    <Typography
                        variant="h1"
                        sx={{
                            fontSize: { xs: '5rem', md: '7rem' },
                            fontWeight: 700,
                            background: 'linear-gradient(90deg, #ef4444, #f97316)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 1,
                        }}
                    >
                        403
                    </Typography>

                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 600,
                            mb: 2,
                            color: '#e2e8f0',
                        }}
                    >
                        Access Denied
                    </Typography>

                    <Typography
                        variant="body1"
                        sx={{
                            color: '#94a3b8',
                            mb: 4,
                            maxWidth: 420,
                            mx: 'auto',
                            lineHeight: 1.7,
                        }}
                    >
                        Sorry, you don't have permission to access this page. Please contact your administrator if you believe this is an error.
                    </Typography>

                    <Box
                        sx={{
                            display: 'flex',
                            gap: 2,
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                        }}
                    >
                        <Button
                            variant="contained"
                            onClick={() => navigate(-1)}
                            sx={{
                                px: 4,
                                py: 1.5,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontSize: '1rem',
                                backgroundColor: '#334155',
                                '&:hover': {
                                    backgroundColor: '#475569',
                                },
                            }}
                        >
                            Go Back
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/login')}
                            sx={{
                                px: 4,
                                py: 1.5,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontSize: '1rem',
                                background: 'linear-gradient(90deg, #ef4444, #f97316)',
                                '&:hover': {
                                    background: 'linear-gradient(90deg, #dc2626, #ea580c)',
                                },
                            }}
                        >
                            Login
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/')}
                            sx={{
                                px: 4,
                                py: 1.5,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontSize: '1rem',
                                borderColor: '#475569',
                                color: '#94a3b8',
                                '&:hover': {
                                    borderColor: '#64748b',
                                    backgroundColor: 'rgba(100, 116, 139, 0.1)',
                                },
                            }}
                        >
                            Go Home
                        </Button>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export default UnauthorizedPage;
