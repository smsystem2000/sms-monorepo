const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const {
    PeriodSwapSchema: periodSwapSchema,
    TimetableEntrySchema: timetableEntrySchema,
    TeacherSchema: teacherSchema,
} = require("@sms/shared");

// Get models for a specific school database
const getModels = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return {
        PeriodSwap: schoolDb.model("PeriodSwap", periodSwapSchema),
        TimetableEntry: schoolDb.model("TimetableEntry", timetableEntrySchema),
        Teacher: schoolDb.model("Teacher", teacherSchema),
    };
};

// Helper function to generate swapId
const generateSwapId = async (PeriodSwapModel) => {
    const lastSwap = await PeriodSwapModel.findOne()
        .sort({ createdAt: -1 })
        .select("swapId");

    let nextNumber = 1;
    if (lastSwap && lastSwap.swapId) {
        const numPart = parseInt(lastSwap.swapId.replace("SWP", ""), 10);
        if (!isNaN(numPart)) {
            nextNumber = numPart + 1;
        }
    }

    return `SWP${String(nextNumber).padStart(5, "0")}`;
};

// Request period swap
const requestSwap = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { entryId1, entryId2, date, reason } = req.body;
        const requestedBy = req.user?.teacherId || req.body.requestedBy;

        if (!entryId1 || !entryId2 || !date) {
            return res.status(400).json({
                success: false,
                message: "Both entry IDs and date are required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { PeriodSwap, TimetableEntry } = models;

        // Verify both entries exist
        const entry1 = await TimetableEntry.findOne({ schoolId, entryId: entryId1 });
        const entry2 = await TimetableEntry.findOne({ schoolId, entryId: entryId2 });

        if (!entry1 || !entry2) {
            return res.status(404).json({
                success: false,
                message: "One or both timetable entries not found",
            });
        }

        // Check for existing pending swap request
        const existingSwap = await PeriodSwap.findOne({
            schoolId,
            entryId1,
            entryId2,
            date: new Date(date),
            status: "pending",
        });

        if (existingSwap) {
            return res.status(409).json({
                success: false,
                message: "A swap request already exists for these periods",
            });
        }

        const swapId = await generateSwapId(PeriodSwap);

        const newSwap = new PeriodSwap({
            swapId,
            schoolId,
            requestedBy,
            entryId1,
            entryId2,
            date: new Date(date),
            reason: reason || "",
            status: "pending",
        });

        await newSwap.save();

        res.status(201).json({
            success: true,
            message: "Period swap request submitted successfully",
            data: newSwap,
        });
    } catch (error) {
        console.error("Error creating swap request:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create swap request",
        });
    }
};

// Get pending swap requests
const getSwapRequests = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { status, teacherId } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { PeriodSwap, TimetableEntry, Teacher } = models;

        const query = { schoolId };
        if (status) query.status = status;
        if (teacherId) query.requestedBy = teacherId;

        const swaps = await PeriodSwap.find(query).sort({ createdAt: -1 });

        // Populate details
        const populatedSwaps = await Promise.all(
            swaps.map(async (swap) => {
                const entry1 = await TimetableEntry.findOne({ entryId: swap.entryId1 });
                const entry2 = await TimetableEntry.findOne({ entryId: swap.entryId2 });
                const requester = await Teacher.findOne({ teacherId: swap.requestedBy });

                return {
                    ...swap.toObject(),
                    entry1,
                    entry2,
                    requester: requester ? {
                        teacherId: requester.teacherId,
                        name: `${requester.firstName} ${requester.lastName}`,
                    } : null,
                };
            })
        );

        res.status(200).json({
            success: true,
            data: populatedSwaps,
        });
    } catch (error) {
        console.error("Error fetching swap requests:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch swap requests",
        });
    }
};

// Approve swap request
const approveSwap = async (req, res) => {
    try {
        const { schoolId, swapId } = req.params;
        const approvedBy = req.user?.userId || req.user?.adminId || "admin";

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { PeriodSwap } = models;

        const swap = await PeriodSwap.findOneAndUpdate(
            { schoolId, swapId, status: "pending" },
            {
                status: "approved",
                approvedBy,
                approvedAt: new Date(),
            },
            { new: true }
        );

        if (!swap) {
            return res.status(404).json({
                success: false,
                message: "Swap request not found or already processed",
            });
        }

        res.status(200).json({
            success: true,
            message: "Swap request approved successfully",
            data: swap,
        });
    } catch (error) {
        console.error("Error approving swap:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to approve swap request",
        });
    }
};

// Reject swap request
const rejectSwap = async (req, res) => {
    try {
        const { schoolId, swapId } = req.params;
        const { rejectionReason } = req.body;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { PeriodSwap } = models;

        const swap = await PeriodSwap.findOneAndUpdate(
            { schoolId, swapId, status: "pending" },
            {
                status: "rejected",
                rejectionReason: rejectionReason || "",
            },
            { new: true }
        );

        if (!swap) {
            return res.status(404).json({
                success: false,
                message: "Swap request not found or already processed",
            });
        }

        res.status(200).json({
            success: true,
            message: "Swap request rejected",
            data: swap,
        });
    } catch (error) {
        console.error("Error rejecting swap:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to reject swap request",
        });
    }
};

// Cancel swap request (by requester)
const cancelSwap = async (req, res) => {
    try {
        const { schoolId, swapId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { PeriodSwap } = models;

        const swap = await PeriodSwap.findOneAndUpdate(
            { schoolId, swapId, status: "pending" },
            { status: "cancelled" },
            { new: true }
        );

        if (!swap) {
            return res.status(404).json({
                success: false,
                message: "Swap request not found or already processed",
            });
        }

        res.status(200).json({
            success: true,
            message: "Swap request cancelled",
            data: swap,
        });
    } catch (error) {
        console.error("Error cancelling swap:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to cancel swap request",
        });
    }
};

module.exports = {
    requestSwap,
    getSwapRequests,
    approveSwap,
    rejectSwap,
    cancelSwap,
};
