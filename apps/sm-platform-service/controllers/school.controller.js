const { SchoolModel: School } = require("@sms/shared");
const { getSchoolDbConnection } = require("../configs/db");

// Helper function to generate schoolId
// Format: SCHL + 5 digit number (SCHL00001, SCHL00002, ... SCHL99999, SCHL100000)
const generateSchoolId = async () => {
    // Sort by schoolId descending to get the highest ID
    const lastSchool = await School.findOne().sort({ schoolId: -1 });

    if (!lastSchool || !lastSchool.schoolId) {
        return "SCHL00001";
    }

    // Extract the numeric part from the last schoolId
    const lastIdNumber = parseInt(lastSchool.schoolId.replace("SCHL", ""), 10);
    const newIdNumber = lastIdNumber + 1;

    // Minimum 5 digits, grows naturally beyond 99999
    return `SCHL${String(newIdNumber).padStart(5, "0")}`;
};

const createSchool = async (req, res) => {
    try {
        const {
            schoolName,
            schoolLogo,
            dbName,
            status,
            schoolAddress,
            schoolEmail,
            schoolContact,
            schoolWebsite,
            attendanceSettings,
        } = req.body;

        // Validate dbName is provided
        if (!dbName) {
            return res.status(400).json({
                success: false,
                message: "dbName is required to create a school database",
            });
        }

        // Generate schoolDbName with prefix format
        const schoolDbName = `school-db-${dbName}`;

        // Check if a school with this dbName already exists
        const existingSchool = await School.findOne({ schoolDbName });
        if (existingSchool) {
            return res.status(400).json({
                success: false,
                message: `A school with database name '${schoolDbName}' already exists`,
            });
        }

        // Auto-generate schoolId
        const schoolId = await generateSchoolId();

        const newSchool = new School({
            schoolId,
            schoolName,
            schoolLogo,
            schoolDbName,
            status,
            schoolAddress,
            schoolEmail,
            schoolContact,
            schoolWebsite,
            attendanceSettings,
        });

        const savedSchool = await newSchool.save();

        // Initialize the school's database
        // MongoDB creates databases lazily, so we create an initialization collection
        try {
            const schoolDb = getSchoolDbConnection(schoolDbName);
            // Create an _init collection to ensure the database is created
            await schoolDb.collection("_init").insertOne({
                createdAt: new Date(),
                schoolId: schoolId,
                message: "Database initialized",
            });
            console.log(`✅ Database '${schoolDbName}' initialized successfully`);
        } catch (dbError) {
            console.error(`⚠️ Warning: Could not initialize database '${schoolDbName}':`, dbError.message);
            // Note: We don't fail the school creation if DB init fails
            // The database will be created when first collection is added
        }

        return res.status(201).json({
            success: true,
            message: "School created successfully",
            data: savedSchool,
        });
    } catch (error) {
        console.error("Error creating school:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating school",
            error: error.message,
        });
    }
};

// Get school by schoolId
const getSchoolById = async (req, res) => {
    try {
        const { schoolId } = req.params;

        const school = await School.findOne({ schoolId });

        if (!school) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "School fetched successfully",
            data: school,
        });
    } catch (error) {
        console.error("Error fetching school:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching school",
            error: error.message,
        });
    }
};

// Get all schools
const getAllSchools = async (req, res) => {
    try {
        const schools = await School.find().sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Schools fetched successfully",
            data: schools,
            count: schools.length,
        });
    } catch (error) {
        console.error("Error fetching schools:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching schools",
            error: error.message,
        });
    }
};

// Update school by schoolId
const updateSchoolById = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const updateData = req.body;

        // Prevent updating schoolId
        delete updateData.schoolId;

        const updatedSchool = await School.findOneAndUpdate(
            { schoolId },
            updateData,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!updatedSchool) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "School updated successfully",
            data: updatedSchool,
        });
    } catch (error) {
        console.error("Error updating school:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating school",
            error: error.message,
        });
    }
};

module.exports = {
    createSchool,
    getSchoolById,
    getAllSchools,
    updateSchoolById,
};
