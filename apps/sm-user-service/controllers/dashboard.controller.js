const { getSchoolDbConnection } = require("../configs/db");
const {
  SchoolModel: School,
  TeacherSchema: teacherSchema,
  StudentSchema: studentSchema,
  ParentSchema: parentSchema,
  MenuModel: menuModel,
} = require("@sms/shared");

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

    const menus = await menuModel.find(
      { menuAccessRoles: role, schoolId: schoolId },
      { menuAccessRoles: 0 },
    );

    // Sort in memory because we need to find the specific order code in the array relevant to the role
    // Determine prefix for this role
    let prefix = "M";
    const r = role.toLowerCase();
    if (r === "super_admin") prefix = "SA";
    else if (r === "school_admin" || r === "sch_admin") prefix = "A";
    else if (r === "teacher") prefix = "T";
    else if (r === "parent") prefix = "P";
    else if (r === "student") prefix = "S";

    // Helper to extract numeric value from order string specific to this role
    // e.g. "SA1.2" -> 1.2 -> value calculation for sorting
    // Or simply localeCompare if structure is consistent.
    const getRoleOrder = (menu) => {
      const orders = Array.isArray(menu.menuOrder)
        ? menu.menuOrder
        : [menu.menuOrder];
      // Find code starting with prefix
      const code = orders.find((o) => String(o).startsWith(prefix));
      return code || "Z99999"; // Fallback to end if no code found
    };

    const sortedMenus = menus.sort((a, b) => {
      const orderA = getRoleOrder(a);
      const orderB = getRoleOrder(b);
      return orderA.localeCompare(orderB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    return res.status(200).json({
      success: true,
      message: "Menus fetched successfully",
      data: sortedMenus,
      count: sortedMenus.length,
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

// Get Teacher Dashboard Stats
const getTeacherDashboardStats = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { teacherId } = req.user;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required",
      });
    }

    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: "Teacher ID is required",
      });
    }

    const schoolDbName = await getSchoolDbName(schoolId);
    const schoolDb = await getSchoolDbConnection(schoolDbName);

    // Get teacher's classes
    const Class =
      schoolDb.models.Class ||
      schoolDb.model("Class", require("@sms/shared").ClassSchema);
    const myClasses = await Class.find({ classTeacher: teacherId });
    const totalClasses = myClasses.length;

    // Get total students across all classes
    const Student =
      schoolDb.models.Student || schoolDb.model("Student", studentSchema);
    const classIds = myClasses.map((c) => c.classId);
    const totalStudents = await Student.countDocuments({
      classId: { $in: classIds },
      status: "active",
    });

    // Get today's schedule (simplified - you can enhance this with actual timetable data)
    const today = new Date().getDay(); // 0-6
    const periodsToday = totalClasses > 0 ? 5 : 0; // Simplified assumption

    // Get pending leave requests (if teacher has approval rights)
    let pendingLeaveRequests = 0;
    try {
      const Leave =
        schoolDb.models.Leave ||
        schoolDb.model("Leave", require("@sms/shared").LeaveSchema);
      pendingLeaveRequests = await Leave.countDocuments({
        status: "pending",
        approverType: "teacher",
        approverId: teacherId,
      });
    } catch (error) {
      // Leave model might not exist
      console.log("Leave data not available:", error.message);
    }

    // Get announcements count
    let totalAnnouncements = 0;
    try {
      const Announcement =
        schoolDb.models.Announcement ||
        schoolDb.model(
          "Announcement",
          require("@sms/shared").AnnouncementSchema,
        );
      totalAnnouncements = await Announcement.countDocuments({
        createdBy: teacherId,
      });
    } catch (error) {
      console.log("Announcement data not available:", error.message);
    }

    res.status(200).json({
      success: true,
      data: {
        totalClasses,
        totalStudents,
        periodsToday,
        pendingLeaveRequests,
        totalAnnouncements,
      },
    });
  } catch (error) {
    console.error("Error getting teacher dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get teacher dashboard stats",
      error: error.message,
    });
  }
};

module.exports = {
  getMenus,
  getSchoolDashboardStats,
  getTeacherDashboardStats,
};
