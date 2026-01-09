import React, { useEffect } from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SchoolIcon from '@mui/icons-material/School';
import LoginIcon from '@mui/icons-material/Login';
import DashboardIcon from '@mui/icons-material/Dashboard';

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    const getDashboardPath = () => {
        switch (user?.role) {
            case 'super_admin':
                return '/super-admin/dashboard';
            case 'sch_admin':
                return '/school-admin/dashboard';
            case 'teacher':
                return '/teacher/dashboard';
            case 'student':
                return '/student/dashboard';
            default:
                return '/login';
        }
    };

    // Auto-redirect if already logged in
    useEffect(() => {
        if (isAuthenticated && user?.role) {
            // Optional: uncomment to auto-redirect
            // navigate(getDashboardPath());
        }
    }, [isAuthenticated, user]);

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
                    <SchoolIcon
                        sx={{
                            fontSize: 100,
                            color: '#3b82f6',
                            mb: 3,
                        }}
                    />
                    <Typography
                        variant="h2"
                        sx={{
                            fontWeight: 700,
                            mb: 2,
                            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        School Management
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{
                            color: '#94a3b8',
                            mb: 4,
                            fontWeight: 400,
                        }}
                    >
                        Streamline your school operations with our comprehensive management system
                    </Typography>

                    {isAuthenticated ? (
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => navigate(getDashboardPath())}
                            startIcon={<DashboardIcon />}
                            sx={{
                                px: 5,
                                py: 1.5,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontSize: '1.1rem',
                                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                                '&:hover': {
                                    background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
                                },
                            }}
                        >
                            Go to Dashboard
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => navigate('/login')}
                            startIcon={<LoginIcon />}
                            sx={{
                                px: 5,
                                py: 1.5,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontSize: '1.1rem',
                                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                                '&:hover': {
                                    background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
                                },
                            }}
                        >
                            Login
                        </Button>
                    )}
                </Box>
            </Container>
        </Box>
    );
};

export default HomePage;
