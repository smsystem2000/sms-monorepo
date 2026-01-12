const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const {
    TimetableConfigSchema: timetableConfigSchema,
} = require("@sms/shared");

// Get TimetableConfig model for a specific school database
const getTimetableConfigModel = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return schoolDb.model("TimetableConfig", timetableConfigSchema);
};

// Helper function to generate configId
// Format: TTC + 5 digit number (TTC00001, TTC00002, ...)
const generateConfigId = async (TimetableConfigModel) => {
    const lastConfig = await TimetableConfigModel.findOne()
        .sort({ createdAt: -1 })
        .select("configId");

    let nextNumber = 1;
    if (lastConfig && lastConfig.configId) {
        const numPart = parseInt(lastConfig.configId.replace("TTC", ""), 10);
        if (!isNaN(numPart)) {
            nextNumber = numPart + 1;
        }
    }

    return `TTC${String(nextNumber).padStart(5, "0")}`;
};

// Create new timetable configuration
const createConfig = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { academicYear, workingDays, shifts, periods } = req.body;

        if (!academicYear) {
            return res.status(400).json({
                success: false,
                message: "Academic year is required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const TimetableConfigModel = getTimetableConfigModel(schoolDbName);

        // Check if config already exists for this academic year
        const existingConfig = await TimetableConfigModel.findOne({
            schoolId,
            academicYear,
        });

        if (existingConfig) {
            return res.status(400).json({
                success: false,
                message: `Timetable configuration already exists for academic year ${academicYear}`,
            });
        }

        // Deactivate any existing active configs
        await TimetableConfigModel.updateMany(
            { schoolId, isActive: true },
            { isActive: false }
        );

        const configId = await generateConfigId(TimetableConfigModel);

        const newConfig = new TimetableConfigModel({
            configId,
            schoolId,
            academicYear,
            workingDays: workingDays || ["monday", "tuesday", "wednesday", "thursday", "friday"],
            shifts: shifts || [],
            periods: periods || [],
            isActive: true,
            status: "active",
        });

        await newConfig.save();

        res.status(201).json({
            success: true,
            message: "Timetable configuration created successfully",
            data: newConfig,
        });
    } catch (error) {
        console.error("Error creating timetable config:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create timetable configuration",
        });
    }
};

// Get active configuration for school
const getActiveConfig = async (req, res) => {
    try {
        const { schoolId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const TimetableConfigModel = getTimetableConfigModel(schoolDbName);

        const config = await TimetableConfigModel.findOne({
            schoolId,
            isActive: true,
        });

        if (!config) {
            return res.status(404).json({
                success: false,
                message: "No active timetable configuration found",
            });
        }

        res.status(200).json({
            success: true,
            data: config,
        });
    } catch (error) {
        console.error("Error fetching timetable config:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch timetable configuration",
        });
    }
};

// Get configuration by ID
const getConfigById = async (req, res) => {
    try {
        const { schoolId, configId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const TimetableConfigModel = getTimetableConfigModel(schoolDbName);

        const config = await TimetableConfigModel.findOne({
            schoolId,
            configId,
        });

        if (!config) {
            return res.status(404).json({
                success: false,
                message: "Timetable configuration not found",
            });
        }

        res.status(200).json({
            success: true,
            data: config,
        });
    } catch (error) {
        console.error("Error fetching timetable config:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch timetable configuration",
        });
    }
};

// Get all configurations for school
const getAllConfigs = async (req, res) => {
    try {
        const { schoolId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const TimetableConfigModel = getTimetableConfigModel(schoolDbName);

        const configs = await TimetableConfigModel.find({ schoolId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: configs,
        });
    } catch (error) {
        console.error("Error fetching timetable configs:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch timetable configurations",
        });
    }
};

// Update configuration
const updateConfig = async (req, res) => {
    try {
        const { schoolId, configId } = req.params;
        const updates = req.body;

        const schoolDbName = await getSchoolDbName(schoolId);
        const TimetableConfigModel = getTimetableConfigModel(schoolDbName);

        // Don't allow updating configId or schoolId
        delete updates.configId;
        delete updates.schoolId;

        const config = await TimetableConfigModel.findOneAndUpdate(
            { schoolId, configId },
            updates,
            { new: true, runValidators: true }
        );

        if (!config) {
            return res.status(404).json({
                success: false,
                message: "Timetable configuration not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Timetable configuration updated successfully",
            data: config,
        });
    } catch (error) {
        console.error("Error updating timetable config:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update timetable configuration",
        });
    }
};

// Set config as active
const setActiveConfig = async (req, res) => {
    try {
        const { schoolId, configId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const TimetableConfigModel = getTimetableConfigModel(schoolDbName);

        // Deactivate all other configs
        await TimetableConfigModel.updateMany(
            { schoolId },
            { isActive: false }
        );

        // Activate the selected config
        const config = await TimetableConfigModel.findOneAndUpdate(
            { schoolId, configId },
            { isActive: true },
            { new: true }
        );

        if (!config) {
            return res.status(404).json({
                success: false,
                message: "Timetable configuration not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Timetable configuration set as active",
            data: config,
        });
    } catch (error) {
        console.error("Error setting active config:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to set active configuration",
        });
    }
};

// Delete configuration
const deleteConfig = async (req, res) => {
    try {
        const { schoolId, configId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const TimetableConfigModel = getTimetableConfigModel(schoolDbName);

        const config = await TimetableConfigModel.findOneAndUpdate(
            { schoolId, configId },
            { status: "inactive", isActive: false },
            { new: true }
        );

        if (!config) {
            return res.status(404).json({
                success: false,
                message: "Timetable configuration not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Timetable configuration deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting timetable config:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete timetable configuration",
        });
    }
};

// Add or update a period in the config
const upsertPeriod = async (req, res) => {
    try {
        const { schoolId, configId } = req.params;
        const periodData = req.body;

        if (!periodData.periodNumber || !periodData.startTime || !periodData.endTime) {
            return res.status(400).json({
                success: false,
                message: "Period number, start time, and end time are required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const TimetableConfigModel = getTimetableConfigModel(schoolDbName);

        const config = await TimetableConfigModel.findOne({ schoolId, configId });

        if (!config) {
            return res.status(404).json({
                success: false,
                message: "Timetable configuration not found",
            });
        }

        // Find existing period or add new one
        const periodIndex = config.periods.findIndex(
            (p) => p.periodNumber === periodData.periodNumber
        );

        if (periodIndex >= 0) {
            // Update existing period
            config.periods[periodIndex] = {
                ...config.periods[periodIndex].toObject(),
                ...periodData,
            };
        } else {
            // Add new period
            config.periods.push(periodData);
            // Sort periods by periodNumber
            config.periods.sort((a, b) => a.periodNumber - b.periodNumber);
        }

        await config.save();

        res.status(200).json({
            success: true,
            message: periodIndex >= 0 ? "Period updated successfully" : "Period added successfully",
            data: config,
        });
    } catch (error) {
        console.error("Error upserting period:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update period",
        });
    }
};

// Remove a period from config
const removePeriod = async (req, res) => {
    try {
        const { schoolId, configId, periodNumber } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const TimetableConfigModel = getTimetableConfigModel(schoolDbName);

        const config = await TimetableConfigModel.findOne({ schoolId, configId });

        if (!config) {
            return res.status(404).json({
                success: false,
                message: "Timetable configuration not found",
            });
        }

        config.periods = config.periods.filter(
            (p) => p.periodNumber !== parseInt(periodNumber, 10)
        );

        await config.save();

        res.status(200).json({
            success: true,
            message: "Period removed successfully",
            data: config,
        });
    } catch (error) {
        console.error("Error removing period:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to remove period",
        });
    }
};

// Add or update a shift in the config
const upsertShift = async (req, res) => {
    try {
        const { schoolId, configId } = req.params;
        const shiftData = req.body;

        if (!shiftData.shiftId || !shiftData.name || !shiftData.startTime || !shiftData.endTime) {
            return res.status(400).json({
                success: false,
                message: "Shift ID, name, start time, and end time are required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const TimetableConfigModel = getTimetableConfigModel(schoolDbName);

        const config = await TimetableConfigModel.findOne({ schoolId, configId });

        if (!config) {
            return res.status(404).json({
                success: false,
                message: "Timetable configuration not found",
            });
        }

        // Find existing shift or add new one
        const shiftIndex = config.shifts.findIndex(
            (s) => s.shiftId === shiftData.shiftId
        );

        if (shiftIndex >= 0) {
            config.shifts[shiftIndex] = shiftData;
        } else {
            config.shifts.push(shiftData);
        }

        await config.save();

        res.status(200).json({
            success: true,
            message: shiftIndex >= 0 ? "Shift updated successfully" : "Shift added successfully",
            data: config,
        });
    } catch (error) {
        console.error("Error upserting shift:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update shift",
        });
    }
};

// Remove a shift from config
const removeShift = async (req, res) => {
    try {
        const { schoolId, configId, shiftId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const TimetableConfigModel = getTimetableConfigModel(schoolDbName);

        const config = await TimetableConfigModel.findOne({ schoolId, configId });

        if (!config) {
            return res.status(404).json({
                success: false,
                message: "Timetable configuration not found",
            });
        }

        config.shifts = config.shifts.filter((s) => s.shiftId !== shiftId);

        await config.save();

        res.status(200).json({
            success: true,
            message: "Shift removed successfully",
            data: config,
        });
    } catch (error) {
        console.error("Error removing shift:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to remove shift",
        });
    }
};

module.exports = {
    createConfig,
    getActiveConfig,
    getConfigById,
    getAllConfigs,
    updateConfig,
    setActiveConfig,
    deleteConfig,
    upsertPeriod,
    removePeriod,
    upsertShift,
    removeShift,
};
