const { getSchoolDbConnection } = require("../configs/db");
const { SchoolModel: School, TeacherSchema: teacherSchema, StudentSchema: studentSchema, ParentSchema: parentSchema, MenuModel: menuModel } = require("@sms/shared");

// Get school database name by schoolId
const getSchoolDbName = async (schoolId) => {
    const school = await School.findOne({ schoolId });
    if (!school) {
        throw new Error("School not found");
    }
    return school.schoolDbName;
};

// Get model for a specific school database
const getModel = async (schoolDbName, modelName, schema) => {
    const schoolDb = await getSchoolDbConnection(schoolDbName);
    return schoolDb.model(modelName, schema);
};

// Get dashboard stats for a school
const getSchoolDashboardStats = async (req, res) => {
    try {
        const { schoolId } = req.params;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);

        const Teacher = await getModel(schoolDbName, "Teacher", teacherSchema);
        const Student = await getModel(schoolDbName, "Student", studentSchema);
        const Parent = await getModel(schoolDbName, "Parent", parentSchema);

        // Get counts
        const totalTeachers = await Teacher.countDocuments();
        const activeTeachers = await Teacher.countDocuments({ status: "active" });

        const totalStudents = await Student.countDocuments();
        const activeStudents = await Student.countDocuments({ status: "active" });

        const totalParents = await Parent.countDocuments();
        const activeParents = await Parent.countDocuments({ status: "active" });

        res.status(200).json({
            success: true,
            data: {
                totalTeachers,
                activeTeachers,
                totalStudents,
                activeStudents,
                totalParents,
                activeParents,
            },
        });
    } catch (error) {
        console.error("Error getting school dashboard stats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get dashboard stats",
            error: error.message,
        });
    }
};



const getMenus = async (req, res) => {
    try {
        const { role, schoolId } = req.params;
        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required",
            });
        }

        if (!role) {
            return res.status(400).json({
                success: false,
                message: "Role is required to fetch menus",
            });
        }

        const menus = await menuModel
            .find(
                { menuAccessRoles: role, schoolId: schoolId },
                { menuAccessRoles: 0 }
            )
            .sort({ menuOrder: 1 });

        return res.status(200).json({
            success: true,
            message: "Menus fetched successfully",
            data: menus,
            count: menus.length,
        });
    } catch (error) {
        console.error("Error fetching menus:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch menus",
            error: error.message,
        });
    }
};


module.exports = {
    getMenus,
    getSchoolDashboardStats,
}