import { useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, IconButton, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
// import LogoutIcon from '@mui/icons-material/Logout';
import Sidebar from '../../pages/Sidebar/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    // Initialize sidebar state based on screen width - closed on mobile
    const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 900);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 900);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

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
        logout();
        navigate('/login');
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* App Bar */}
            <AppBar
                position="fixed"
                sx={{
                    zIndex: 1201,
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
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        SMS Platform
                    </Typography>
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
