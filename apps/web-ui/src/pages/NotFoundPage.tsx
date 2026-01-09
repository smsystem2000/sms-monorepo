import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            }}
        >
            <Container maxWidth="sm">
                <Box
                    sx={{
                        textAlign: 'center',
                        color: 'white',
                    }}
                >
                    <ErrorOutlineIcon
                        sx={{
                            fontSize: 120,
                            color: '#3b82f6',
                            mb: 2,
                        }}
                    />
                    <Typography
                        variant="h1"
                        sx={{
                            fontSize: { xs: '6rem', md: '8rem' },
                            fontWeight: 700,
                            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 1,
                        }}
                    >
                        404
                    </Typography>
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 600,
                            mb: 2,
                            color: '#e2e8f0',
                        }}
                    >
                        Page Not Found
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            color: '#94a3b8',
                            mb: 4,
                            maxWidth: 400,
                            mx: 'auto',
                        }}
                    >
                        The page you're looking for doesn't exist or has been moved. Let's get you back on track.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
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
                            onClick={() => navigate('/')}
                            sx={{
                                px: 4,
                                py: 1.5,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontSize: '1rem',
                                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                                '&:hover': {
                                    background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
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

export default NotFoundPage;
