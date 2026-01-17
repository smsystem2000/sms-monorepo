const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const { NotificationSchema: notificationSchema } = require("@sms/shared");

// Helper to get Notification model for a specific school
const getNotificationModel = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return schoolDb.model('Notification', notificationSchema);
};

// Generate notification ID
const generateNotificationId = () => {
    return `NOTIF${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
};

// ==========================================
// GET MY NOTIFICATIONS
// GET /api/notifications/school/:schoolId/notifications
// ==========================================
const getMyNotifications = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { userId, role, parentId, studentId, teacherId } = req.user;
        const { isRead, type, page = 1, limit = 20 } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        const Notification = getNotificationModel(schoolDbName);

        // Determine the actual user ID based on role
        let actualUserId = userId;
        if (role === 'parent' && parentId) actualUserId = parentId;
        if (role === 'student' && studentId) actualUserId = studentId;
        if (role === 'teacher' && teacherId) actualUserId = teacherId;

        let query = { userId: actualUserId };

        if (isRead !== undefined) {
            query.isRead = isRead === 'true';
        }
        if (type) {
            query.type = type;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments(query);

        res.status(200).json({
            success: true,
            message: "Notifications fetched successfully",
            data: notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get Notifications Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch notifications",
            error: error.message
        });
    }
};

// ==========================================
// GET UNREAD COUNT
// GET /api/notifications/school/:schoolId/notifications/unread-count
// ==========================================
const getUnreadCount = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { userId, role, parentId, studentId, teacherId } = req.user;

        const schoolDbName = await getSchoolDbName(schoolId);
        const Notification = getNotificationModel(schoolDbName);

        // Determine the actual user ID based on role
        let actualUserId = userId;
        if (role === 'parent' && parentId) actualUserId = parentId;
        if (role === 'student' && studentId) actualUserId = studentId;
        if (role === 'teacher' && teacherId) actualUserId = teacherId;

        const count = await Notification.countDocuments({
            userId: actualUserId,
            isRead: false
        });

        res.status(200).json({
            success: true,
            data: { unreadCount: count }
        });
    } catch (error) {
        console.error("Get Unread Count Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get unread count",
            error: error.message
        });
    }
};

// ==========================================
// MARK NOTIFICATION AS READ
// PUT /api/notifications/school/:schoolId/notifications/:notificationId/read
// ==========================================
const markAsRead = async (req, res) => {
    try {
        const { schoolId, notificationId } = req.params;
        const { userId, role, parentId, studentId, teacherId } = req.user;

        const schoolDbName = await getSchoolDbName(schoolId);
        const Notification = getNotificationModel(schoolDbName);

        // Determine the actual user ID based on role
        let actualUserId = userId;
        if (role === 'parent' && parentId) actualUserId = parentId;
        if (role === 'student' && studentId) actualUserId = studentId;
        if (role === 'teacher' && teacherId) actualUserId = teacherId;

        const notification = await Notification.findOneAndUpdate(
            { notificationId, userId: actualUserId },
            { isRead: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Notification marked as read",
            data: notification
        });
    } catch (error) {
        console.error("Mark As Read Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to mark notification as read",
            error: error.message
        });
    }
};

// ==========================================
// MARK ALL AS READ
// PUT /api/notifications/school/:schoolId/notifications/mark-all-read
// ==========================================
const markAllAsRead = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { userId, role, parentId, studentId, teacherId } = req.user;

        const schoolDbName = await getSchoolDbName(schoolId);
        const Notification = getNotificationModel(schoolDbName);

        // Determine the actual user ID based on role
        let actualUserId = userId;
        if (role === 'parent' && parentId) actualUserId = parentId;
        if (role === 'student' && studentId) actualUserId = studentId;
        if (role === 'teacher' && teacherId) actualUserId = teacherId;

        const result = await Notification.updateMany(
            { userId: actualUserId, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        res.status(200).json({
            success: true,
            message: `${result.modifiedCount} notifications marked as read`
        });
    } catch (error) {
        console.error("Mark All As Read Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to mark all notifications as read",
            error: error.message
        });
    }
};

// ==========================================
// DELETE NOTIFICATION
// DELETE /api/notifications/school/:schoolId/notifications/:notificationId
// ==========================================
const deleteNotification = async (req, res) => {
    try {
        const { schoolId, notificationId } = req.params;
        const { userId, role, parentId, studentId, teacherId } = req.user;

        const schoolDbName = await getSchoolDbName(schoolId);
        const Notification = getNotificationModel(schoolDbName);

        // Determine the actual user ID based on role
        let actualUserId = userId;
        if (role === 'parent' && parentId) actualUserId = parentId;
        if (role === 'student' && studentId) actualUserId = studentId;
        if (role === 'teacher' && teacherId) actualUserId = teacherId;

        const notification = await Notification.findOneAndDelete({
            notificationId,
            userId: actualUserId
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Notification deleted successfully"
        });
    } catch (error) {
        console.error("Delete Notification Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete notification",
            error: error.message
        });
    }
};

// ==========================================
// CREATE NOTIFICATION (Internal Use)
// Used by other services to create notifications
// ==========================================
const createNotification = async (schoolDbName, notificationData) => {
    try {
        const Notification = getNotificationModel(schoolDbName);
        const notification = new Notification({
            notificationId: generateNotificationId(),
            ...notificationData
        });
        await notification.save();
        return notification;
    } catch (error) {
        console.error("Create Notification Error:", error);
        throw error;
    }
};

// ==========================================
// CREATE MULTIPLE NOTIFICATIONS (Internal Use)
// Used for bulk notification creation
// ==========================================
const createBulkNotifications = async (schoolDbName, notifications) => {
    try {
        const Notification = getNotificationModel(schoolDbName);
        const notificationsWithIds = notifications.map(n => ({
            notificationId: generateNotificationId(),
            ...n
        }));
        await Notification.insertMany(notificationsWithIds);
        return notificationsWithIds;
    } catch (error) {
        console.error("Create Bulk Notifications Error:", error);
        throw error;
    }
};

module.exports = {
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    createBulkNotifications,
    generateNotificationId,
};
