const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const {
    StudentSchema: studentSchema,
    ParentSchema: parentSchema,
    TeacherSchema: teacherSchema,
    ClassSchema: classSchema,
    SubjectSchema: subjectSchema,
    AttendanceSimpleSchema: attendanceSimpleSchema,
    LeaveRequestSchema: leaveRequestSchema,
    TimetableEntrySchema: timetableEntrySchema,
} = require("@sms/shared");

// Get models for a specific school
const getModels = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return {
        Student: schoolDb.model('Student', studentSchema),
        Parent: schoolDb.model('Parent', parentSchema),
        Teacher: schoolDb.model('Teacher', teacherSchema),
        Class: schoolDb.model('Class', classSchema),
        Subject: schoolDb.model('Subject', subjectSchema),
        Attendance: schoolDb.model('AttendanceSimple', attendanceSimpleSchema),
        LeaveRequest: schoolDb.model('LeaveRequest', leaveRequestSchema),
        TimetableEntry: schoolDb.model('TimetableEntry', timetableEntrySchema),
    };
};

// ==========================================
// GET PARENT DASHBOARD STATS
// GET /api/school/:schoolId/parent-portal/dashboard
// ==========================================
const getDashboardStats = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { userId, parentId } = req.user;
        const actualParentId = parentId || userId;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Student, Parent, Attendance, LeaveRequest } = getModels(schoolDbName);

        // Get parent and their children
        const parent = await Parent.findOne({ parentId: actualParentId });
        if (!parent) {
            return res.status(404).json({
                success: false,
                message: "Parent not found"
            });
        }

        // Get all children (by studentIds or by parentId)
        const children = await Student.find({
            $or: [
                { studentId: { $in: parent.studentIds || [] } },
                { parentId: actualParentId }
            ],
            status: 'active'
        });

        // Get attendance stats for last 30 days for each child
        const endDate = new Date();
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const childrenWithStats = await Promise.all(children.map(async (child) => {
            // Get attendance
            const attendanceRecords = await Attendance.find({
                studentId: child.studentId,
                date: { $gte: startDate, $lte: endDate }
            });

            const totalDays = attendanceRecords.length;
            const presentDays = attendanceRecords.filter(a => ['present', 'late'].includes(a.status)).length;
            const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;

            // Get pending leaves
            const pendingLeaves = await LeaveRequest.countDocuments({
                applicantId: child.studentId,
                status: 'pending'
            });

            return {
                studentId: child.studentId,
                name: `${child.firstName} ${child.lastName}`,
                firstName: child.firstName,
                lastName: child.lastName,
                class: child.class,
                section: child.section,
                rollNumber: child.rollNumber,
                profileImage: child.profileImage,
                attendancePercentage: parseFloat(percentage),
                pendingLeaves,
                totalDays,
                presentDays
            };
        }));

        // Get recent absences (last 7 days)
        const recentAbsences = [];
        for (const child of children) {
            const absences = await Attendance.find({
                studentId: child.studentId,
                status: 'absent',
                date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }).sort({ date: -1 }).limit(3);

            absences.forEach(a => {
                recentAbsences.push({
                    studentId: child.studentId,
                    studentName: `${child.firstName} ${child.lastName}`,
                    date: a.date,
                    status: a.status
                });
            });
        }

        // Count total pending leaves
        const totalPendingLeaves = childrenWithStats.reduce((sum, c) => sum + c.pendingLeaves, 0);

        res.status(200).json({
            success: true,
            message: "Dashboard stats fetched successfully",
            data: {
                childrenCount: children.length,
                children: childrenWithStats,
                totalPendingLeaves,
                recentAbsences: recentAbsences.slice(0, 5),
                parentName: `${parent.firstName} ${parent.lastName}`
            }
        });
    } catch (error) {
        console.error("Get Dashboard Stats Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard stats",
            error: error.message
        });
    }
};

// ==========================================
// GET MY CHILDREN
// GET /api/school/:schoolId/parent-portal/children
// ==========================================
const getMyChildren = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { userId, parentId } = req.user;
        const actualParentId = parentId || userId;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Student, Parent, Class } = getModels(schoolDbName);

        const parent = await Parent.findOne({ parentId: actualParentId });
        if (!parent) {
            return res.status(404).json({
                success: false,
                message: "Parent not found"
            });
        }

        const children = await Student.find({
            $or: [
                { studentId: { $in: parent.studentIds || [] } },
                { parentId: actualParentId }
            ]
        });

        // Enrich with class names
        const classIds = [...new Set(children.map(c => c.class))];
        const classes = await Class.find({ classId: { $in: classIds } }, 'classId name sections');
        const classMap = {};
        classes.forEach(c => {
            classMap[c.classId] = {
                name: c.name,
                sections: c.sections
            };
        });

        const enrichedChildren = children.map(child => {
            const classInfo = classMap[child.class] || {};
            const sectionInfo = classInfo.sections?.find(s => s.sectionId === child.section);
            return {
                ...child.toObject(),
                className: classInfo.name || child.class,
                sectionName: sectionInfo?.name || child.section
            };
        });

        res.status(200).json({
            success: true,
            message: "Children fetched successfully",
            data: enrichedChildren
        });
    } catch (error) {
        console.error("Get My Children Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch children",
            error: error.message
        });
    }
};

// ==========================================
// GET CHILD PROFILE
// GET /api/school/:schoolId/parent-portal/children/:studentId
// ==========================================
const getChildProfile = async (req, res) => {
    try {
        const { schoolId, studentId } = req.params;
        const { userId, parentId } = req.user;
        const actualParentId = parentId || userId;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Student, Parent, Class, Subject } = getModels(schoolDbName);

        // Verify parent has access to this child
        const parent = await Parent.findOne({ parentId: actualParentId });
        if (!parent) {
            return res.status(404).json({
                success: false,
                message: "Parent not found"
            });
        }

        const student = await Student.findOne({ studentId });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        // Check if parent has access
        const hasAccess = (parent.studentIds || []).includes(studentId) || student.parentId === actualParentId;
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: "You don't have access to this student's profile"
            });
        }

        // Get class info
        const classInfo = await Class.findOne({ classId: student.class });
        const sectionInfo = classInfo?.sections?.find(s => s.sectionId === student.section);

        const enrichedStudent = {
            ...student.toObject(),
            className: classInfo?.name || student.class,
            sectionName: sectionInfo?.name || student.section
        };

        // Remove sensitive data
        delete enrichedStudent.password;

        res.status(200).json({
            success: true,
            data: enrichedStudent
        });
    } catch (error) {
        console.error("Get Child Profile Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch child profile",
            error: error.message
        });
    }
};

// ==========================================
// GET CHILD'S CLASS TEACHER
// GET /api/school/:schoolId/parent-portal/children/:studentId/class-teacher
// ==========================================
const getChildClassTeacher = async (req, res) => {
    try {
        const { schoolId, studentId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Student, Class, Teacher } = getModels(schoolDbName);

        const student = await Student.findOne({ studentId });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        // Get class and find class teacher for student's section
        const classInfo = await Class.findOne({ classId: student.class });
        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: "Class not found"
            });
        }

        const section = classInfo.sections?.find(s => s.sectionId === student.section);
        if (!section?.classTeacherId) {
            return res.status(404).json({
                success: false,
                message: "Class teacher not assigned for this section"
            });
        }

        const teacher = await Teacher.findOne({ teacherId: section.classTeacherId });
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Class teacher not found"
            });
        }

        res.status(200).json({
            success: true,
            data: {
                teacherId: teacher.teacherId,
                firstName: teacher.firstName,
                lastName: teacher.lastName,
                email: teacher.email,
                phone: teacher.phone,
                profileImage: teacher.profileImage,
                isClassTeacher: true
            }
        });
    } catch (error) {
        console.error("Get Class Teacher Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch class teacher",
            error: error.message
        });
    }
};

// ==========================================
// GET CHILD'S TEACHERS (Subject-wise)
// GET /api/school/:schoolId/parent-portal/children/:studentId/teachers
// ==========================================
const getChildTeachers = async (req, res) => {
    try {
        const { schoolId, studentId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Student, Class, Teacher, Subject, TimetableEntry } = getModels(schoolDbName);

        const student = await Student.findOne({ studentId });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        // Get class info for class teacher
        const classInfo = await Class.findOne({ classId: student.class });
        const section = classInfo?.sections?.find(s => s.sectionId === student.section);
        const classTeacherId = section?.classTeacherId;

        // Get teachers from timetable entries for this class/section
        const timetableEntries = await TimetableEntry.find({
            classId: student.class,
            $or: [
                { sectionId: student.section },
                { sectionId: null },
                { sectionId: '' }
            ],
            status: 'active'
        });

        // Get unique teacher-subject pairs
        const teacherSubjectMap = {};
        timetableEntries.forEach(entry => {
            if (!teacherSubjectMap[entry.teacherId]) {
                teacherSubjectMap[entry.teacherId] = new Set();
            }
            teacherSubjectMap[entry.teacherId].add(entry.subjectId);
        });

        const teacherIds = Object.keys(teacherSubjectMap);
        const subjectIds = [...new Set(timetableEntries.map(e => e.subjectId))];

        const [teachers, subjects] = await Promise.all([
            Teacher.find({ teacherId: { $in: teacherIds } }),
            Subject.find({ subjectId: { $in: subjectIds } }, 'subjectId name')
        ]);

        const subjectMap = Object.fromEntries(subjects.map(s => [s.subjectId, s.name]));

        const teacherList = teachers.map(teacher => ({
            teacherId: teacher.teacherId,
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            email: teacher.email,
            phone: teacher.phone,
            profileImage: teacher.profileImage,
            subjects: [...(teacherSubjectMap[teacher.teacherId] || [])],
            subjectNames: [...(teacherSubjectMap[teacher.teacherId] || [])].map(sid => subjectMap[sid] || sid),
            isClassTeacher: teacher.teacherId === classTeacherId
        }));

        // Sort to put class teacher first
        teacherList.sort((a, b) => (b.isClassTeacher ? 1 : 0) - (a.isClassTeacher ? 1 : 0));

        res.status(200).json({
            success: true,
            data: teacherList
        });
    } catch (error) {
        console.error("Get Child Teachers Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch teachers",
            error: error.message
        });
    }
};

// ==========================================
// GET CHILD'S ATTENDANCE
// GET /api/school/:schoolId/parent-portal/children/:studentId/attendance
// ==========================================
const getChildAttendance = async (req, res) => {
    try {
        const { schoolId, studentId } = req.params;
        const { startDate, endDate, month, year } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Attendance } = getModels(schoolDbName);

        let dateQuery = {};

        if (month && year) {
            // Monthly view
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0, 23, 59, 59);
            dateQuery = { $gte: start, $lte: end };
        } else if (startDate && endDate) {
            // Date range
            dateQuery = { $gte: new Date(startDate), $lte: new Date(endDate) };
        } else {
            // Default: last 30 days
            dateQuery = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
        }

        const attendance = await Attendance.find({
            studentId,
            date: dateQuery
        }).sort({ date: -1 });

        // Calculate summary
        const summary = {
            total: attendance.length,
            present: attendance.filter(a => a.status === 'present').length,
            absent: attendance.filter(a => a.status === 'absent').length,
            late: attendance.filter(a => a.status === 'late').length,
            halfDay: attendance.filter(a => a.status === 'half_day').length,
            leave: attendance.filter(a => a.status === 'leave').length
        };

        const percentage = summary.total > 0
            ? (((summary.present + summary.late) / summary.total) * 100).toFixed(1)
            : 0;

        res.status(200).json({
            success: true,
            data: {
                attendance,
                summary: {
                    ...summary,
                    percentage
                }
            }
        });
    } catch (error) {
        console.error("Get Child Attendance Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch attendance",
            error: error.message
        });
    }
};

// ==========================================
// GET CHILD'S ABSENT HISTORY
// GET /api/school/:schoolId/parent-portal/children/:studentId/absent-history
// ==========================================
const getChildAbsentHistory = async (req, res) => {
    try {
        const { schoolId, studentId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Attendance, LeaveRequest } = getModels(schoolDbName);

        // Get all absences
        const absences = await Attendance.find({
            studentId,
            status: 'absent'
        })
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Attendance.countDocuments({
            studentId,
            status: 'absent'
        });

        // Check if leave was applied for each absence
        const absencesWithLeaveStatus = await Promise.all(absences.map(async (absence) => {
            const date = new Date(absence.date);
            const leave = await LeaveRequest.findOne({
                applicantId: studentId,
                startDate: { $lte: date },
                endDate: { $gte: date }
            });

            return {
                ...absence.toObject(),
                leaveApplied: !!leave,
                leaveStatus: leave?.status
            };
        }));

        res.status(200).json({
            success: true,
            data: absencesWithLeaveStatus,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get Absent History Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch absent history",
            error: error.message
        });
    }
};

module.exports = {
    getDashboardStats,
    getMyChildren,
    getChildProfile,
    getChildClassTeacher,
    getChildTeachers,
    getChildAttendance,
    getChildAbsentHistory,
};
