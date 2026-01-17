import React, { useState } from 'react';
import {
    Badge,
    IconButton,
    Popover,
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Button,
    Divider,
    Skeleton,
    Chip,
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Assignment as AssignmentIcon,
    EventNote as EventNoteIcon,
    Announcement as AnnouncementIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    School as SchoolIcon,
    AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGetUnreadCount, useGetMyNotifications, useMarkAsRead, useMarkAllAsRead } from '../../queries/Notification';
import TokenService from '../../queries/token/tokenService';
import type { Notification, NotificationType } from '../../types';

const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
        case 'absence_alert':
            return <WarningIcon color="error" />;
        case 'leave_status':
            return <CheckCircleIcon color="success" />;
        case 'announcement':
            return <AnnouncementIcon color="primary" />;
        case 'homework_assigned':
        case 'homework_due':
            return <AssignmentIcon color="warning" />;
        case 'exam_scheduled':
            return <EventNoteIcon color="info" />;
        case 'result_published':
            return <SchoolIcon color="success" />;
        default:
            return <NotificationsIcon color="action" />;
    }
};

const NotificationBell: React.FC = () => {
    const navigate = useNavigate();
    const schoolId = TokenService.getSchoolId() || '';
    const role = TokenService.getRole();

    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    const { data: unreadData, isLoading: loadingCount } = useGetUnreadCount(schoolId);
    const { data: notificationsData, isLoading: loadingNotifications } = useGetMyNotifications(schoolId, { limit: 5 });
    const markAsRead = useMarkAsRead(schoolId);
    const markAllAsRead = useMarkAllAsRead(schoolId);

    const unreadCount = unreadData?.data?.unreadCount || 0;
    const notifications = notificationsData?.data || [];

    const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = (notification: Notification) => {
        // Mark as read
        if (!notification.isRead) {
            markAsRead.mutate(notification.notificationId);
        }

        // Navigate based on type
        let path = '';
        const prefix = role === 'parent' ? '/parent' : role === 'student' ? '/student' : role === 'teacher' ? '/teacher' : '/school-admin';

        switch (notification.type) {
            case 'announcement':
                path = `${prefix}/announcements`;
                break;
            case 'homework_assigned':
            case 'homework_due':
                path = `${prefix}/homework`;
                break;
            case 'absence_alert':
                path = role === 'parent' ? '/parent/attendance' : '/student/attendance';
                break;
            case 'leave_status':
                path = role === 'parent' ? '/parent/leave/history' : `${prefix}/leave/history`;
                break;
            case 'exam_scheduled':
                path = role === 'parent' ? '/parent/exam/schedule' : '/student/exam/schedule';
                break;
            case 'result_published':
                path = role === 'parent' ? '/parent/exam/results' : '/student/exam/results';
                break;
            default:
                path = `${prefix}/notifications`;
        }

        handleClose();
        navigate(path);
    };

    const handleMarkAllRead = () => {
        markAllAsRead.mutate();
    };

    const handleViewAll = () => {
        const prefix = role === 'parent' ? '/parent' : role === 'student' ? '/student' : role === 'teacher' ? '/teacher' : '/school-admin';
        handleClose();
        navigate(`${prefix}/notifications`);
    };

    const formatTime = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const open = Boolean(anchorEl);

    return (
        <>
            <IconButton
                color="inherit"
                onClick={handleOpen}
                sx={{ ml: 1 }}
            >
                <Badge badgeContent={unreadCount} color="error" max={99}>
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        width: 360,
                        maxHeight: 480,
                    }
                }}
            >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={600}>
                        Notifications
                    </Typography>
                    {unreadCount > 0 && (
                        <Button
                            size="small"
                            onClick={handleMarkAllRead}
                            disabled={markAllAsRead.isPending}
                        >
                            Mark all read
                        </Button>
                    )}
                </Box>

                <Divider />

                {loadingNotifications ? (
                    <Box sx={{ p: 2 }}>
                        {[1, 2, 3].map((i) => (
                            <Box key={i} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <Skeleton variant="circular" width={40} height={40} />
                                <Box sx={{ flex: 1 }}>
                                    <Skeleton variant="text" width="80%" />
                                    <Skeleton variant="text" width="60%" />
                                </Box>
                            </Box>
                        ))}
                    </Box>
                ) : notifications.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                        <Typography color="text.secondary">
                            No notifications yet
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {notifications.map((notification: Notification) => (
                            <ListItem
                                key={notification.notificationId}
                                onClick={() => handleNotificationClick(notification)}
                                sx={{
                                    cursor: 'pointer',
                                    bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                                    '&:hover': {
                                        bgcolor: 'action.selected',
                                    },
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {getNotificationIcon(notification.type)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Typography
                                            variant="body2"
                                            fontWeight={notification.isRead ? 400 : 600}
                                            noWrap
                                        >
                                            {notification.title}
                                        </Typography>
                                    }
                                    secondary={
                                        <Box>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                {notification.message}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                <AccessTimeIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                                                <Typography variant="caption" color="text.disabled">
                                                    {formatTime(notification.createdAt)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}

                <Divider />

                <Box sx={{ p: 1.5, textAlign: 'center' }}>
                    <Button
                        fullWidth
                        variant="text"
                        onClick={handleViewAll}
                    >
                        View All Notifications
                    </Button>
                </Box>
            </Popover>
        </>
    );
};

export default NotificationBell;
