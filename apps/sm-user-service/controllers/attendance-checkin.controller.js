const mongoose = require("mongoose");
const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const { SchoolModel: School, AttendanceCheckinSchema: attendanceCheckinSchema, StudentSchema: studentSchema } = require("@sms/shared");

// Helper to get the model for a specific school
const getAttendanceModel = async (schoolId) => {
    const schoolDbName = await getSchoolDbName(schoolId);
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return schoolDb.model("AttendanceCheckin", attendanceCheckinSchema);
};

// Generate unique log ID
const generateLogId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `LOG${timestamp}${random}`.toUpperCase();
};

// Get today's date at midnight
const getDateOnly = (date = new Date()) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

// Calculate status based on check-in time and settings
const calculateStatus = (checkInTime, workingHours, lateThreshold, halfDayThreshold, totalMinutes) => {
    if (!checkInTime) return "absent";

    const checkIn = new Date(checkInTime);
    const [startHour, startMin] = workingHours.start.split(":").map(Number);

    const expectedStart = new Date(checkIn);
    expectedStart.setHours(startHour, startMin, 0, 0);

    const delayMinutes = Math.floor((checkIn - expectedStart) / 60000);

    if (totalMinutes > 0 && totalMinutes < halfDayThreshold) {
        return "half_day";
    }
    if (delayMinutes > lateThreshold) {
        return "late";
    }
    return "present";
};

/**
 * Check In - Student or Teacher
 * POST /api/school/:schoolId/attendance/checkin/in
 */
const checkIn = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { userId, userType, classId, sectionId, method, workingHours, lateThreshold } = req.body;

        if (!userId || !userType) {
            return res.status(400).json({
                success: false,
                message: "userId and userType are required",
            });
        }

        const AttendanceModel = await getAttendanceModel(schoolId);
        const today = getDateOnly();
        const now = new Date();

        // Check if already checked in today
        let attendance = await AttendanceModel.findOne({
            userId,
            date: today,
        });

        if (attendance && attendance.checkInTime) {
            return res.status(400).json({
                success: false,
                message: "Already checked in today",
                data: attendance,
            });
        }

        if (attendance) {
            // Update existing record (was marked absent, now checking in)
            attendance.checkInTime = now;
            attendance.checkInMethod = method || "manual";
            attendance.status = "pending";
        } else {
            // Create new
            attendance = new AttendanceModel({
                logId: generateLogId(),
                schoolId,
                userId,
                userType,
                classId,
                sectionId,
                date: today,
                checkInTime: now,
                checkInMethod: method || "manual",
                status: "pending",
            });
        }

        await attendance.save();

        res.status(200).json({
            success: true,
            message: "Checked in successfully",
            data: attendance,
        });
    } catch (error) {
        console.error("Error during check-in:", error);
        res.status(500).json({
            success: false,
            message: "Failed to check in",
            error: error.message,
        });
    }
};

/**
 * Check Out - Student or Teacher
 * POST /api/school/:schoolId/attendance/checkin/out
 */
const checkOut = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { userId, method, workingHours, lateThreshold, halfDayThreshold } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "userId is required",
            });
        }

        const AttendanceModel = await getAttendanceModel(schoolId);
        const today = getDateOnly();
        const now = new Date();

        const attendance = await AttendanceModel.findOne({
            userId,
            date: today,
        });

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: "No check-in record found for today",
            });
        }

        if (!attendance.checkInTime) {
            return res.status(400).json({
                success: false,
                message: "Must check in before checking out",
            });
        }

        if (attendance.checkOutTime) {
            return res.status(400).json({
                success: false,
                message: "Already checked out today",
                data: attendance,
            });
        }

        // Calculate total minutes
        const totalMinutes = Math.floor((now - attendance.checkInTime) / 60000);

        // Calculate final status
        const settings = {
            start: workingHours?.start || "08:00",
            end: workingHours?.end || "16:00",
        };
        const status = calculateStatus(
            attendance.checkInTime,
            settings,
            lateThreshold || 15,
            halfDayThreshold || 240,
            totalMinutes
        );

        attendance.checkOutTime = now;
        attendance.checkOutMethod = method || "manual";
        attendance.totalMinutes = totalMinutes;
        attendance.status = status;

        await attendance.save();

        res.status(200).json({
            success: true,
            message: "Checked out successfully",
            data: attendance,
        });
    } catch (error) {
        console.error("Error during check-out:", error);
        res.status(500).json({
            success: false,
            message: "Failed to check out",
            error: error.message,
        });
    }
};

/**
 * Get today's check-in status for a user
 * GET /api/school/:schoolId/attendance/checkin/status/:userId
 */
const getCheckInStatus = async (req, res) => {
    try {
        const { schoolId, userId } = req.params;

        const AttendanceModel = await getAttendanceModel(schoolId);
        const today = getDateOnly();

        const attendance = await AttendanceModel.findOne({
            userId,
            date: today,
        });

        res.status(200).json({
            success: true,
            data: attendance || { checked: false },
        });
    } catch (error) {
        console.error("Error getting check-in status:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get check-in status",
            error: error.message,
        });
    }
};

/**
 * Get all check-in records for a date
 * GET /api/school/:schoolId/attendance/checkin/daily/:date
 */
const getDailyCheckins = async (req, res) => {
    try {
        const { schoolId, date } = req.params;
        const { userType, classId, sectionId } = req.query;

        const AttendanceModel = await getAttendanceModel(schoolId);
        const attendanceDate = getDateOnly(date);

        const query = { date: attendanceDate };
        if (userType) query.userType = userType;
        if (classId) query.classId = classId;
        if (sectionId) query.sectionId = sectionId;

        const attendance = await AttendanceModel.find(query)
            .sort({ checkInTime: 1 })
            .lean();

        // Summary
        const summary = {
            total: attendance.length,
            checkedIn: attendance.filter((a) => a.checkInTime).length,
            checkedOut: attendance.filter((a) => a.checkOutTime).length,
            present: attendance.filter((a) => a.status === "present").length,
            late: attendance.filter((a) => a.status === "late").length,
            halfDay: attendance.filter((a) => a.status === "half_day").length,
            pending: attendance.filter((a) => a.status === "pending").length,
        };

        res.status(200).json({
            success: true,
            data: { attendance, summary },
        });
    } catch (error) {
        console.error("Error getting daily check-ins:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get daily check-ins",
            error: error.message,
        });
    }
};

/**
 * Manual mark attendance (admin override)
 * POST /api/school/:schoolId/attendance/checkin/manual
 */
const manualMarkAttendance = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { userId, userType, classId, sectionId, date, status, remarks } = req.body;

        if (!userId || !userType || !status) {
            return res.status(400).json({
                success: false,
                message: "userId, userType, and status are required",
            });
        }

        const AttendanceModel = await getAttendanceModel(schoolId);
        const attendanceDate = getDateOnly(date || new Date());

        let attendance = await AttendanceModel.findOne({
            userId,
            date: attendanceDate,
        });

        if (attendance) {
            // Update existing
            attendance.status = status;
            attendance.remarks = remarks;
            attendance.markedBy = req.user?.userId;
        } else {
            // Create new
            attendance = new AttendanceModel({
                logId: generateLogId(),
                schoolId,
                userId,
                userType,
                classId,
                sectionId,
                date: attendanceDate,
                status,
                remarks,
                markedBy: req.user?.userId,
            });
        }

        await attendance.save();

        res.status(200).json({
            success: true,
            message: "Attendance marked successfully",
            data: attendance,
        });
    } catch (error) {
        console.error("Error manual marking attendance:", error);
        res.status(500).json({
            success: false,
            message: "Failed to mark attendance",
            error: error.message,
        });
    }
};

module.exports = {
    checkIn,
    checkOut,
    getCheckInStatus,
    getDailyCheckins,
    manualMarkAttendance,
};
