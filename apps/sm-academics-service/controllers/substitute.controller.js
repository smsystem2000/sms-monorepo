const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const {
    SubstituteAssignmentSchema: substituteAssignmentSchema,
    TimetableEntrySchema: timetableEntrySchema,
    TeacherSchema: teacherSchema,
} = require("@sms/shared");

// Get models for a specific school database
const getModels = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return {
        SubstituteAssignment: schoolDb.model("SubstituteAssignment", substituteAssignmentSchema),
        TimetableEntry: schoolDb.model("TimetableEntry", timetableEntrySchema),
        Teacher: schoolDb.model("Teacher", teacherSchema),
    };
};

// Helper function to generate substituteId
const generateSubstituteId = async (SubstituteAssignmentModel) => {
    const lastSub = await SubstituteAssignmentModel.findOne()
        .sort({ createdAt: -1 })
        .select("substituteId");

    let nextNumber = 1;
    if (lastSub && lastSub.substituteId) {
        const numPart = parseInt(lastSub.substituteId.replace("SBA", ""), 10);
        if (!isNaN(numPart)) {
            nextNumber = numPart + 1;
        }
    }

    return `SBA${String(nextNumber).padStart(5, "0")}`;
};

// Create substitute assignment
const createSubstitute = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { originalEntryId, substituteTeacherId, date, reason } = req.body;
        const createdBy = req.user?.userId || req.user?.teacherId || "admin";

        if (!originalEntryId || !substituteTeacherId || !date) {
            return res.status(400).json({
                success: false,
                message: "Original entry ID, substitute teacher ID, and date are required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { SubstituteAssignment, TimetableEntry, Teacher } = models;

        // Get the original entry
        const originalEntry = await TimetableEntry.findOne({ schoolId, entryId: originalEntryId });
        if (!originalEntry) {
            return res.status(404).json({
                success: false,
                message: "Original timetable entry not found",
            });
        }

        // Check if substitute teacher is free at this time
        const substituteConflict = await TimetableEntry.findOne({
            schoolId,
            teacherId: substituteTeacherId,
            dayOfWeek: originalEntry.dayOfWeek,
            periodNumber: originalEntry.periodNumber,
            isActive: true,
        });

        if (substituteConflict) {
            return res.status(409).json({
                success: false,
                message: "Substitute teacher is not free at this time",
            });
        }

        // Check if substitute already exists for this entry on this date
        const existingSubstitute = await SubstituteAssignment.findOne({
            schoolId,
            originalEntryId,
            date: new Date(date),
            status: { $in: ["pending", "confirmed"] },
        });

        if (existingSubstitute) {
            return res.status(409).json({
                success: false,
                message: "A substitute assignment already exists for this period on this date",
            });
        }

        const substituteId = await generateSubstituteId(SubstituteAssignment);

        const newSubstitute = new SubstituteAssignment({
            substituteId,
            schoolId,
            originalEntryId,
            originalTeacherId: originalEntry.teacherId,
            substituteTeacherId,
            date: new Date(date),
            reason: reason || "",
            createdBy,
            status: "confirmed",
        });

        await newSubstitute.save();

        // Get teacher details for response
        const originalTeacher = await Teacher.findOne({ teacherId: originalEntry.teacherId });
        const substituteTeacher = await Teacher.findOne({ teacherId: substituteTeacherId });

        res.status(201).json({
            success: true,
            message: "Substitute assignment created successfully",
            data: {
                ...newSubstitute.toObject(),
                originalTeacher: originalTeacher ? `${originalTeacher.firstName} ${originalTeacher.lastName}` : null,
                substituteTeacher: substituteTeacher ? `${substituteTeacher.firstName} ${substituteTeacher.lastName}` : null,
            },
        });
    } catch (error) {
        console.error("Error creating substitute:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create substitute assignment",
        });
    }
};

// Get substitutes for a date
const getSubstitutesForDate = async (req, res) => {
    try {
        const { schoolId, date } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { SubstituteAssignment, TimetableEntry, Teacher } = models;

        const queryDate = new Date(date);
        queryDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(queryDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const substitutes = await SubstituteAssignment.find({
            schoolId,
            date: { $gte: queryDate, $lt: nextDay },
        });

        // Populate details
        const populatedSubstitutes = await Promise.all(
            substitutes.map(async (sub) => {
                const originalEntry = await TimetableEntry.findOne({ entryId: sub.originalEntryId });
                const originalTeacher = await Teacher.findOne({ teacherId: sub.originalTeacherId });
                const substituteTeacher = await Teacher.findOne({ teacherId: sub.substituteTeacherId });

                return {
                    ...sub.toObject(),
                    entry: originalEntry,
                    originalTeacher: originalTeacher ? {
                        teacherId: originalTeacher.teacherId,
                        name: `${originalTeacher.firstName} ${originalTeacher.lastName}`,
                    } : null,
                    substituteTeacher: substituteTeacher ? {
                        teacherId: substituteTeacher.teacherId,
                        name: `${substituteTeacher.firstName} ${substituteTeacher.lastName}`,
                    } : null,
                };
            })
        );

        res.status(200).json({
            success: true,
            data: populatedSubstitutes,
        });
    } catch (error) {
        console.error("Error fetching substitutes:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch substitutes",
        });
    }
};

// Get substitute history
const getSubstituteHistory = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { teacherId, startDate, endDate, limit = 50 } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { SubstituteAssignment, Teacher } = models;

        const query = { schoolId };

        if (teacherId) {
            query.$or = [
                { originalTeacherId: teacherId },
                { substituteTeacherId: teacherId },
            ];
        }

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const substitutes = await SubstituteAssignment.find(query)
            .sort({ date: -1 })
            .limit(parseInt(limit, 10));

        // Populate teacher names
        const populatedSubstitutes = await Promise.all(
            substitutes.map(async (sub) => {
                const originalTeacher = await Teacher.findOne({ teacherId: sub.originalTeacherId });
                const substituteTeacher = await Teacher.findOne({ teacherId: sub.substituteTeacherId });

                return {
                    ...sub.toObject(),
                    originalTeacherName: originalTeacher ? `${originalTeacher.firstName} ${originalTeacher.lastName}` : null,
                    substituteTeacherName: substituteTeacher ? `${substituteTeacher.firstName} ${substituteTeacher.lastName}` : null,
                };
            })
        );

        res.status(200).json({
            success: true,
            data: populatedSubstitutes,
        });
    } catch (error) {
        console.error("Error fetching substitute history:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch substitute history",
        });
    }
};

// Cancel substitute assignment
const cancelSubstitute = async (req, res) => {
    try {
        const { schoolId, substituteId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { SubstituteAssignment } = models;

        const substitute = await SubstituteAssignment.findOneAndUpdate(
            { schoolId, substituteId },
            { status: "cancelled" },
            { new: true }
        );

        if (!substitute) {
            return res.status(404).json({
                success: false,
                message: "Substitute assignment not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Substitute assignment cancelled successfully",
            data: substitute,
        });
    } catch (error) {
        console.error("Error cancelling substitute:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to cancel substitute assignment",
        });
    }
};

// Update substitute status
const updateSubstituteStatus = async (req, res) => {
    try {
        const { schoolId, substituteId } = req.params;
        const { status } = req.body;

        if (!status || !["pending", "confirmed", "completed", "cancelled"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Valid status is required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { SubstituteAssignment } = models;

        const substitute = await SubstituteAssignment.findOneAndUpdate(
            { schoolId, substituteId },
            { status },
            { new: true }
        );

        if (!substitute) {
            return res.status(404).json({
                success: false,
                message: "Substitute assignment not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Substitute status updated successfully",
            data: substitute,
        });
    } catch (error) {
        console.error("Error updating substitute status:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update substitute status",
        });
    }
};

module.exports = {
    createSubstitute,
    getSubstitutesForDate,
    getSubstituteHistory,
    cancelSubstitute,
    updateSubstituteStatus,
};
