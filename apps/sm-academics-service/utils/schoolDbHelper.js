const mongoose = require("mongoose");

// Cache for school database name lookups
const schoolDbNameCache = {};

// Schools schema for querying the platform database
const { SchoolModel } = require("@sms/shared");
const schoolsSchema = SchoolModel.schema;

/**
 * Get the school's database name from schoolId by querying MongoDB directly
 * @param {string} schoolId - The school ID (e.g., 'SCHL00001')
 * @returns {Promise<string>} - The school database name (e.g., 'school-db-springfield-elementary')
 */
const getSchoolDbName = async (schoolId) => {
    if (!schoolId) {
        throw new Error("schoolId is required");
    }

    // Check cache first
    if (schoolDbNameCache[schoolId]) {
        return schoolDbNameCache[schoolId];
    }

    try {
        // Get the SuperAdmin database (where schools collection exists)
        const superAdminDb = mongoose.connection.useDb("SuperAdmin", { useCache: true });

        // Get or create the Schools model
        let SchoolModel;
        try {
            SchoolModel = superAdminDb.model("School");
        } catch (e) {
            SchoolModel = superAdminDb.model("School", schoolsSchema);
        }

        // Find the school by schoolId
        const school = await SchoolModel.findOne({ schoolId }).lean();

        if (!school || !school.schoolDbName) {
            throw new Error(`School not found or schoolDbName missing for ID: ${schoolId}`);
        }

        // Cache the result
        schoolDbNameCache[schoolId] = school.schoolDbName;

        return school.schoolDbName;
    } catch (error) {
        console.error(`Error fetching schoolDbName for ${schoolId}:`, error.message);
        throw new Error(`Failed to get school database name: ${error.message}`);
    }
};

/**
 * Clear cache for a specific school or all schools
 * @param {string} schoolId - Optional school ID to clear specific cache entry
 */
const clearSchoolDbNameCache = (schoolId = null) => {
    if (schoolId) {
        delete schoolDbNameCache[schoolId];
    } else {
        Object.keys(schoolDbNameCache).forEach((key) => delete schoolDbNameCache[key]);
    }
};

module.exports = {
    getSchoolDbName,
    clearSchoolDbNameCache,
};
