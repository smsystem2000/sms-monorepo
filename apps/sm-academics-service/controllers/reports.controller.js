const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const {
    TimetableEntrySchema: timetableEntrySchema,
    TimetableConfigSchema: timetableConfigSchema,
    TeacherSchema: teacherSchema,
    ClassSchema: classSchema,
    SubjectSchema: subjectSchema,
} = require("@sms/shared");

// Get models for a specific school database
const getModels = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return {
        TimetableEntry: schoolDb.model("TimetableEntry", timetableEntrySchema),
        TimetableConfig: schoolDb.model("TimetableConfig", timetableConfigSchema),
        Teacher: schoolDb.model("Teacher", teacherSchema),
        Class: schoolDb.model("Class", classSchema),
        Subject: schoolDb.model("Subject", subjectSchema),
    };
};

// Get teacher workload report
const getTeacherWorkload = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { teacherId } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry, TimetableConfig, Teacher, Subject } = models;

        // Get active config
        const config = await TimetableConfig.findOne({ schoolId, isActive: true });
        const regularPeriods = config?.periods?.filter((p) => p.type === "regular") || [];
        const totalPossiblePeriodsPerDay = regularPeriods.length;
        const workingDays = config?.workingDays?.length || 5;
        const maxPeriodsPerWeek = totalPossiblePeriodsPerDay * workingDays;

        // Build teacher query
        const teacherQuery = { schoolId, status: "active" };
        if (teacherId) teacherQuery.teacherId = teacherId;

        const teachers = await Teacher.find(teacherQuery);

        // Calculate workload for each teacher
        const workloadData = await Promise.all(
            teachers.map(async (teacher) => {
                const entries = await TimetableEntry.find({
                    schoolId,
                    teacherId: teacher.teacherId,
                    isActive: true,
                });

                // Group by day
                const dayWise = {};
                for (const day of (config?.workingDays || [])) {
                    dayWise[day] = entries.filter((e) => e.dayOfWeek === day).length;
                }

                // Get unique subjects taught
                const subjectIds = [...new Set(entries.map((e) => e.subjectId))];
                const subjects = await Subject.find({ subjectId: { $in: subjectIds } });

                // Get unique classes taught
                const classIds = [...new Set(entries.map((e) => e.classId))];

                return {
                    teacherId: teacher.teacherId,
                    name: `${teacher.firstName} ${teacher.lastName}`,
                    email: teacher.email,
                    totalPeriodsPerWeek: entries.length,
                    maxPeriodsPerWeek,
                    workloadPercentage: maxPeriodsPerWeek > 0
                        ? Math.round((entries.length / maxPeriodsPerWeek) * 100)
                        : 0,
                    dayWiseLoad: dayWise,
                    subjectsTaught: subjects.map((s) => ({ subjectId: s.subjectId, name: s.name })),
                    classesCount: classIds.length,
                };
            })
        );

        // Sort by workload percentage
        workloadData.sort((a, b) => b.workloadPercentage - a.workloadPercentage);

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalTeachers: workloadData.length,
                    avgWorkloadPercentage: workloadData.length > 0
                        ? Math.round(workloadData.reduce((sum, t) => sum + t.workloadPercentage, 0) / workloadData.length)
                        : 0,
                    maxPeriodsPerWeek,
                },
                teachers: workloadData,
            },
        });
    } catch (error) {
        console.error("Error fetching teacher workload:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch teacher workload",
        });
    }
};

// Get subject distribution report
const getSubjectDistribution = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { classId } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry, Subject, Class } = models;

        const entryQuery = { schoolId, isActive: true };
        if (classId) entryQuery.classId = classId;

        const entries = await TimetableEntry.find(entryQuery);

        // Group by subject
        const subjectGroups = {};
        for (const entry of entries) {
            if (!subjectGroups[entry.subjectId]) {
                subjectGroups[entry.subjectId] = {
                    totalPeriods: 0,
                    classes: new Set(),
                };
            }
            subjectGroups[entry.subjectId].totalPeriods++;
            subjectGroups[entry.subjectId].classes.add(entry.classId);
        }

        // Get subject details and format response
        const subjectData = await Promise.all(
            Object.entries(subjectGroups).map(async ([subjectId, data]) => {
                const subject = await Subject.findOne({ subjectId });
                return {
                    subjectId,
                    name: subject?.name || subjectId,
                    code: subject?.code || "",
                    totalPeriodsPerWeek: data.totalPeriods,
                    classesCount: data.classes.size,
                };
            })
        );

        // Sort by total periods
        subjectData.sort((a, b) => b.totalPeriodsPerWeek - a.totalPeriodsPerWeek);

        res.status(200).json({
            success: true,
            data: subjectData,
        });
    } catch (error) {
        console.error("Error fetching subject distribution:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch subject distribution",
        });
    }
};

// Get timetable summary for dashboard
const getTimetableSummary = async (req, res) => {
    try {
        const { schoolId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry, TimetableConfig, Teacher, Class, Subject } = models;

        const config = await TimetableConfig.findOne({ schoolId, isActive: true });
        const entries = await TimetableEntry.find({ schoolId, isActive: true });
        const teachers = await Teacher.find({ schoolId, status: "active" });
        const classes = await Class.find({ schoolId, status: "active" });
        const subjects = await Subject.find({ schoolId, status: "active" });

        // Calculate fill rate
        const totalPossibleSlots = config
            ? config.workingDays.length * config.periods.filter((p) => p.type === "regular").length * classes.length
            : 0;
        const fillRate = totalPossibleSlots > 0
            ? Math.round((entries.length / totalPossibleSlots) * 100)
            : 0;

        res.status(200).json({
            success: true,
            data: {
                hasActiveConfig: !!config,
                academicYear: config?.academicYear || null,
                stats: {
                    totalEntries: entries.length,
                    totalTeachers: teachers.length,
                    totalClasses: classes.length,
                    totalSubjects: subjects.length,
                    fillRate,
                },
                workingDays: config?.workingDays || [],
                periodsPerDay: config?.periods?.filter((p) => p.type === "regular").length || 0,
            },
        });
    } catch (error) {
        console.error("Error fetching timetable summary:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch timetable summary",
        });
    }
};

// Export timetable data for PDF generation
const exportTimetableData = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { type, id } = req.query; // type: 'class' | 'teacher', id: classId or teacherId

        if (!type || !id) {
            return res.status(400).json({
                success: false,
                message: "Type and ID are required for export",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry, TimetableConfig, Teacher, Class, Subject } = models;

        const config = await TimetableConfig.findOne({ schoolId, isActive: true });
        if (!config) {
            return res.status(404).json({
                success: false,
                message: "No active timetable configuration found",
            });
        }

        let entries;
        let entityName;

        if (type === "class") {
            const [classId, sectionId] = id.split("-");
            entries = await TimetableEntry.find({
                schoolId,
                classId,
                sectionId: sectionId || { $exists: true },
                isActive: true,
            });
            const classDoc = await Class.findOne({ classId });
            entityName = classDoc?.name || classId;
        } else if (type === "teacher") {
            entries = await TimetableEntry.find({
                schoolId,
                teacherId: id,
                isActive: true,
            });
            const teacher = await Teacher.findOne({ teacherId: id });
            entityName = teacher ? `${teacher.firstName} ${teacher.lastName}` : id;
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid export type. Use 'class' or 'teacher'",
            });
        }

        // Build timetable grid
        const grid = {};
        for (const day of config.workingDays) {
            grid[day] = {};
            for (const period of config.periods) {
                if (period.type === "regular") {
                    grid[day][period.periodNumber] = null;
                }
            }
        }

        // Populate grid with entries
        for (const entry of entries) {
            const teacher = await Teacher.findOne({ teacherId: entry.teacherId });
            const subject = await Subject.findOne({ subjectId: entry.subjectId });
            const classDoc = await Class.findOne({ classId: entry.classId });

            if (grid[entry.dayOfWeek] && grid[entry.dayOfWeek][entry.periodNumber] !== undefined) {
                grid[entry.dayOfWeek][entry.periodNumber] = {
                    subject: subject?.name || entry.subjectId,
                    subjectCode: subject?.code || "",
                    teacher: teacher ? `${teacher.firstName} ${teacher.lastName}` : entry.teacherId,
                    class: classDoc?.name || entry.classId,
                    section: entry.sectionId,
                    room: entry.roomId || "",
                };
            }
        }

        res.status(200).json({
            success: true,
            data: {
                type,
                entityName,
                academicYear: config.academicYear,
                workingDays: config.workingDays,
                periods: config.periods.filter((p) => p.type === "regular"),
                breaks: config.periods.filter((p) => p.type !== "regular"),
                grid,
            },
        });
    } catch (error) {
        console.error("Error exporting timetable:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to export timetable",
        });
    }
};

module.exports = {
    getTeacherWorkload,
    getSubjectDistribution,
    getTimetableSummary,
    exportTimetableData,
};
