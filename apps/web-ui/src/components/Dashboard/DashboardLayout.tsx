import { useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, IconButton, Typography, Avatar } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
// import LogoutIcon from '@mui/icons-material/Logout';
import Sidebar from '../../pages/Sidebar/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../stores/userStore';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    // Initialize sidebar state based on screen width - closed on mobile
    const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 900);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 900);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Get school and user data from Zustand store
    const { school, fetchProfile, clearStore } = useUserStore();

    // Fetch profile on mount if not already loaded
    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user, fetchProfile]);

    // Track window resize to update isMobile state
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 900;
            setIsMobile(mobile);
            // Auto-close sidebar when switching to mobile
            if (mobile && sidebarOpen) {
                setSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [sidebarOpen]);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleLogout = () => {
        clearStore(); // Clear Zustand store
        logout();
        navigate('/login');
    };

    const schoolName = school?.schoolName || 'SMS Platform';

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* App Bar */}
            <AppBar
                position="fixed"
                sx={{
                    zIndex: 10000,
                    backgroundColor: '#1e293b',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={toggleSidebar}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: 2 }}>
                        {school?.schoolLogo && (
                            <Avatar
                                src={school.schoolLogo}
                                variant="square"
                                sx={{
                                    width: 48,
                                    height: 48,
                                    bgcolor: 'transparent',
                                    p: 0,
                                    '& img': {
                                        objectFit: 'cover',
                                        width: '100%',
                                        height: '100%'
                                    }
                                }}
                            />
                        )}
                        <Typography
                            variant="h5"
                            noWrap
                            component="div"
                            sx={{ fontWeight: 700, ml: 1 }}
                        >
                            {schoolName}
                        </Typography>
                    </Box>
                    {/* <Button
                        color="inherit"
                        onClick={handleLogout}
                        startIcon={<LogoutIcon />}
                        sx={{ textTransform: 'none' }}
                    >
                        Logout
                    </Button> */}
                </Toolbar>
            </AppBar>

            {/* Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                role={user?.role || null}
                onLogout={handleLogout}
            />

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    // On desktop, shift content when sidebar is open
                    // On mobile, content stays in place (sidebar overlays on top)
                    marginLeft: !isMobile && sidebarOpen ? '250px' : 0,
                    marginTop: '64px',
                    transition: 'margin-left 0.3s ease-in-out',
                    backgroundColor: '#f8fafc',
                    minHeight: 'calc(100vh - 64px)',
                    width: '100%',
                    overflowX: 'hidden',
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

export default DashboardLayout;
