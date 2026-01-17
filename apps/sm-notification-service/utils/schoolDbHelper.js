const { SchoolModel: School } = require("@sms/shared");

// Get school database name by schoolId
const getSchoolDbName = async (schoolId) => {
    const school = await School.findOne({ schoolId });
    if (!school) {
        throw new Error(`School not found with ID: ${schoolId}`);
    }
    return school.schoolDbName;
};

module.exports = { getSchoolDbName };
