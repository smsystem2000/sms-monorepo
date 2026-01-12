const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const {
    TimetableEntrySchema: timetableEntrySchema,
    TimetableConfigSchema: timetableConfigSchema,
    TeacherSchema: teacherSchema,
    ClassSchema: classSchema,
    SubjectSchema: subjectSchema,
    RoomSchema: roomSchema,
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
        Room: schoolDb.model("Room", roomSchema),
    };
};

// Helper function to generate entryId
const generateEntryId = async (TimetableEntryModel) => {
    const lastEntry = await TimetableEntryModel.findOne()
        .sort({ createdAt: -1 })
        .select("entryId");

    let nextNumber = 1;
    if (lastEntry && lastEntry.entryId) {
        const numPart = parseInt(lastEntry.entryId.replace("TTE", ""), 10);
        if (!isNaN(numPart)) {
            nextNumber = numPart + 1;
        }
    }

    return `TTE${String(nextNumber).padStart(5, "0")}`;
};

// ==========================================
// CONFLICT DETECTION FUNCTIONS
// ==========================================

/**
 * Check if a teacher is already assigned at the given day/period
 */
const checkTeacherConflict = async (TimetableEntry, schoolId, teacherId, dayOfWeek, periodNumber, excludeEntryId = null) => {
    const query = {
        schoolId,
        teacherId,
        dayOfWeek,
        periodNumber,
        isActive: true,
    };

    if (excludeEntryId) {
        query.entryId = { $ne: excludeEntryId };
    }

    const conflict = await TimetableEntry.findOne(query);
    return conflict;
};

/**
 * Check if a room is already booked at the given day/period
 */
const checkRoomConflict = async (TimetableEntry, schoolId, roomId, dayOfWeek, periodNumber, excludeEntryId = null) => {
    if (!roomId) return null; // No room specified, no conflict

    const query = {
        schoolId,
        roomId,
        dayOfWeek,
        periodNumber,
        isActive: true,
    };

    if (excludeEntryId) {
        query.entryId = { $ne: excludeEntryId };
    }

    const conflict = await TimetableEntry.findOne(query);
    return conflict;
};

/**
 * Check if a class/section already has a subject at the given day/period
 */
const checkClassConflict = async (TimetableEntry, schoolId, classId, sectionId, dayOfWeek, periodNumber, excludeEntryId = null) => {
    const query = {
        schoolId,
        classId,
        sectionId,
        dayOfWeek,
        periodNumber,
        isActive: true,
    };

    if (excludeEntryId) {
        query.entryId = { $ne: excludeEntryId };
    }

    const conflict = await TimetableEntry.findOne(query);
    return conflict;
};

/**
 * Validate entry for all types of conflicts
 */
const validateEntry = async (models, entryData, excludeEntryId = null) => {
    const { TimetableEntry, Teacher, Class, Subject } = models;
    const { schoolId, teacherId, classId, sectionId, subjectId, dayOfWeek, periodNumber, roomId } = entryData;
    const conflicts = [];

    // Check teacher conflict
    const teacherConflict = await checkTeacherConflict(
        TimetableEntry, schoolId, teacherId, dayOfWeek, periodNumber, excludeEntryId
    );
    if (teacherConflict) {
        const teacher = await Teacher.findOne({ teacherId });
        const conflictClass = await Class.findOne({ classId: teacherConflict.classId });
        const conflictSubject = await Subject.findOne({ subjectId: teacherConflict.subjectId });
        conflicts.push({
            type: "teacher",
            message: `Teacher "${teacher?.firstName || teacherId}" is already assigned to ${conflictClass?.name || "another class"} (${conflictSubject?.name || "subject"}) at this time`,
            conflictingEntry: teacherConflict,
        });
    }

    // Check room conflict
    const roomConflict = await checkRoomConflict(
        TimetableEntry, schoolId, roomId, dayOfWeek, periodNumber, excludeEntryId
    );
    if (roomConflict) {
        const conflictClass = await Class.findOne({ classId: roomConflict.classId });
        conflicts.push({
            type: "room",
            message: `Room is already booked by ${conflictClass?.name || "another class"} at this time`,
            conflictingEntry: roomConflict,
        });
    }

    // Check class/section conflict
    const classConflict = await checkClassConflict(
        TimetableEntry, schoolId, classId, sectionId, dayOfWeek, periodNumber, excludeEntryId
    );
    if (classConflict) {
        const conflictSubject = await Subject.findOne({ subjectId: classConflict.subjectId });
        conflicts.push({
            type: "class",
            message: `This class/section already has ${conflictSubject?.name || "another subject"} at this time`,
            conflictingEntry: classConflict,
        });
    }

    return conflicts;
};

// ==========================================
// CRUD OPERATIONS
// ==========================================

// Create a new timetable entry
const createEntry = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const {
            classId, sectionId, subjectId, teacherId,
            dayOfWeek, periodNumber, shiftId, roomId,
            periodType, effectiveFrom, effectiveTo, notes
        } = req.body;

        // Validate required fields
        if (!classId || !sectionId || !subjectId || !teacherId || !dayOfWeek || periodNumber === undefined) {
            return res.status(400).json({
                success: false,
                message: "Class, section, subject, teacher, day, and period are required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry } = models;

        // Check for conflicts
        const conflicts = await validateEntry(models, {
            schoolId, teacherId, classId, sectionId, subjectId, dayOfWeek, periodNumber, roomId
        });

        if (conflicts.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Schedule conflicts detected",
                conflicts,
            });
        }

        const entryId = await generateEntryId(TimetableEntry);

        const newEntry = new TimetableEntry({
            entryId,
            schoolId,
            classId,
            sectionId,
            subjectId,
            teacherId,
            dayOfWeek,
            periodNumber,
            shiftId: shiftId || null,
            roomId: roomId || null,
            periodType: periodType || "regular",
            effectiveFrom: effectiveFrom || null,
            effectiveTo: effectiveTo || null,
            notes: notes || "",
            isActive: true,
            status: "active",
        });

        await newEntry.save();

        res.status(201).json({
            success: true,
            message: "Timetable entry created successfully",
            data: newEntry,
        });
    } catch (error) {
        console.error("Error creating timetable entry:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create timetable entry",
        });
    }
};

// Bulk create entries
const bulkCreateEntries = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { entries } = req.body;

        if (!entries || !Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Entries array is required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry } = models;

        const results = {
            created: [],
            failed: [],
        };

        for (const entry of entries) {
            try {
                // Check for conflicts
                const conflicts = await validateEntry(models, {
                    schoolId,
                    ...entry
                });

                if (conflicts.length > 0) {
                    results.failed.push({
                        entry,
                        reason: "Conflicts detected",
                        conflicts,
                    });
                    continue;
                }

                const entryId = await generateEntryId(TimetableEntry);

                const newEntry = new TimetableEntry({
                    entryId,
                    schoolId,
                    ...entry,
                    isActive: true,
                    status: "active",
                });

                await newEntry.save();
                results.created.push(newEntry);
            } catch (err) {
                results.failed.push({
                    entry,
                    reason: err.message,
                });
            }
        }

        res.status(200).json({
            success: true,
            message: `Created ${results.created.length} entries, ${results.failed.length} failed`,
            data: results,
        });
    } catch (error) {
        console.error("Error bulk creating entries:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to bulk create entries",
        });
    }
};

// Get timetable for a class/section
const getClassTimetable = async (req, res) => {
    try {
        const { schoolId, classId, sectionId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry, TimetableConfig, Teacher, Subject } = models;

        // Get active config for period structure
        const config = await TimetableConfig.findOne({ schoolId, isActive: true });

        // Get all entries for this class/section
        const entries = await TimetableEntry.find({
            schoolId,
            classId,
            sectionId,
            isActive: true,
        });

        // Populate teacher and subject details
        const populatedEntries = await Promise.all(
            entries.map(async (entry) => {
                const teacher = await Teacher.findOne({ teacherId: entry.teacherId });
                const subject = await Subject.findOne({ subjectId: entry.subjectId });
                return {
                    ...entry.toObject(),
                    teacher: teacher ? { teacherId: teacher.teacherId, name: `${teacher.firstName} ${teacher.lastName}` } : null,
                    subject: subject ? { subjectId: subject.subjectId, name: subject.name, code: subject.code } : null,
                };
            })
        );

        res.status(200).json({
            success: true,
            data: {
                config: config || null,
                entries: populatedEntries,
            },
        });
    } catch (error) {
        console.error("Error fetching class timetable:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch timetable",
        });
    }
};

// Get timetable for a teacher
const getTeacherTimetable = async (req, res) => {
    try {
        const { schoolId, teacherId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry, TimetableConfig, Class, Subject } = models;

        // Get active config for period structure
        const config = await TimetableConfig.findOne({ schoolId, isActive: true });

        // Get all entries for this teacher
        const entries = await TimetableEntry.find({
            schoolId,
            teacherId,
            isActive: true,
        });

        // Populate class and subject details
        const populatedEntries = await Promise.all(
            entries.map(async (entry) => {
                const classDoc = await Class.findOne({ classId: entry.classId });
                const section = classDoc?.sections?.find((s) => s.sectionId === entry.sectionId);
                const subject = await Subject.findOne({ subjectId: entry.subjectId });
                return {
                    ...entry.toObject(),
                    class: classDoc ? { classId: classDoc.classId, name: classDoc.name, section: section?.name || entry.sectionId } : null,
                    subject: subject ? { subjectId: subject.subjectId, name: subject.name, code: subject.code } : null,
                };
            })
        );

        res.status(200).json({
            success: true,
            data: {
                config: config || null,
                entries: populatedEntries,
            },
        });
    } catch (error) {
        console.error("Error fetching teacher timetable:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch timetable",
        });
    }
};

// Get all entries for a specific day
const getEntriesByDay = async (req, res) => {
    try {
        const { schoolId, dayOfWeek } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry, Teacher, Class, Subject } = models;

        const entries = await TimetableEntry.find({
            schoolId,
            dayOfWeek,
            isActive: true,
        });

        // Populate details
        const populatedEntries = await Promise.all(
            entries.map(async (entry) => {
                const teacher = await Teacher.findOne({ teacherId: entry.teacherId });
                const classDoc = await Class.findOne({ classId: entry.classId });
                const subject = await Subject.findOne({ subjectId: entry.subjectId });
                return {
                    ...entry.toObject(),
                    teacher: teacher ? { teacherId: teacher.teacherId, name: `${teacher.firstName} ${teacher.lastName}` } : null,
                    class: classDoc ? { classId: classDoc.classId, name: classDoc.name } : null,
                    subject: subject ? { subjectId: subject.subjectId, name: subject.name } : null,
                };
            })
        );

        res.status(200).json({
            success: true,
            data: populatedEntries,
        });
    } catch (error) {
        console.error("Error fetching entries by day:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch entries",
        });
    }
};

// Update timetable entry
const updateEntry = async (req, res) => {
    try {
        const { schoolId, entryId } = req.params;
        const updates = req.body;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry } = models;

        // Don't allow updating entryId or schoolId
        delete updates.entryId;
        delete updates.schoolId;

        // Get current entry
        const currentEntry = await TimetableEntry.findOne({ schoolId, entryId });
        if (!currentEntry) {
            return res.status(404).json({
                success: false,
                message: "Timetable entry not found",
            });
        }

        // Merge updates with current entry for conflict checking
        const mergedData = {
            schoolId,
            teacherId: updates.teacherId || currentEntry.teacherId,
            classId: updates.classId || currentEntry.classId,
            sectionId: updates.sectionId || currentEntry.sectionId,
            subjectId: updates.subjectId || currentEntry.subjectId,
            dayOfWeek: updates.dayOfWeek || currentEntry.dayOfWeek,
            periodNumber: updates.periodNumber !== undefined ? updates.periodNumber : currentEntry.periodNumber,
            roomId: updates.roomId !== undefined ? updates.roomId : currentEntry.roomId,
        };

        // Check for conflicts (excluding current entry)
        const conflicts = await validateEntry(models, mergedData, entryId);

        if (conflicts.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Schedule conflicts detected",
                conflicts,
            });
        }

        const entry = await TimetableEntry.findOneAndUpdate(
            { schoolId, entryId },
            updates,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Timetable entry updated successfully",
            data: entry,
        });
    } catch (error) {
        console.error("Error updating timetable entry:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update timetable entry",
        });
    }
};

// Delete timetable entry (soft delete)
const deleteEntry = async (req, res) => {
    try {
        const { schoolId, entryId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry } = models;

        const entry = await TimetableEntry.findOneAndUpdate(
            { schoolId, entryId },
            { isActive: false, status: "inactive" },
            { new: true }
        );

        if (!entry) {
            return res.status(404).json({
                success: false,
                message: "Timetable entry not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Timetable entry deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting timetable entry:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete timetable entry",
        });
    }
};

// Get teacher's free periods
const getTeacherFreePeriods = async (req, res) => {
    try {
        const { schoolId, teacherId } = req.params;
        const { dayOfWeek } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry, TimetableConfig } = models;

        // Get active config
        const config = await TimetableConfig.findOne({ schoolId, isActive: true });
        if (!config) {
            return res.status(404).json({
                success: false,
                message: "No active timetable configuration found",
            });
        }

        const workingDays = dayOfWeek ? [dayOfWeek] : config.workingDays;
        const regularPeriods = config.periods.filter((p) => p.type === "regular");

        // Get all teacher's assigned periods
        const assignedEntries = await TimetableEntry.find({
            schoolId,
            teacherId,
            dayOfWeek: { $in: workingDays },
            isActive: true,
        });

        // Calculate free periods for each day
        const freePeriods = {};
        for (const day of workingDays) {
            const assignedOnDay = assignedEntries
                .filter((e) => e.dayOfWeek === day)
                .map((e) => e.periodNumber);

            freePeriods[day] = regularPeriods
                .filter((p) => !assignedOnDay.includes(p.periodNumber))
                .map((p) => ({
                    periodNumber: p.periodNumber,
                    name: p.name,
                    startTime: p.startTime,
                    endTime: p.endTime,
                }));
        }

        res.status(200).json({
            success: true,
            data: {
                teacherId,
                freePeriods,
            },
        });
    } catch (error) {
        console.error("Error fetching free periods:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch free periods",
        });
    }
};

// Get all free teachers for a specific period
const getFreeTeachersForPeriod = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { dayOfWeek, periodNumber } = req.query;

        if (!dayOfWeek || periodNumber === undefined) {
            return res.status(400).json({
                success: false,
                message: "Day and period number are required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry, Teacher } = models;

        // Get all teachers
        const allTeachers = await Teacher.find({ schoolId, status: "active" });

        // Get all assigned teachers for this day/period
        const assignedEntries = await TimetableEntry.find({
            schoolId,
            dayOfWeek,
            periodNumber: parseInt(periodNumber, 10),
            isActive: true,
        });

        const assignedTeacherIds = assignedEntries.map((e) => e.teacherId);

        // Filter free teachers
        const freeTeachers = allTeachers
            .filter((t) => !assignedTeacherIds.includes(t.teacherId))
            .map((t) => ({
                teacherId: t.teacherId,
                name: `${t.firstName} ${t.lastName}`,
                email: t.email,
            }));

        res.status(200).json({
            success: true,
            data: freeTeachers,
        });
    } catch (error) {
        console.error("Error fetching free teachers:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch free teachers",
        });
    }
};

// Get conflict report for entire school
const getConflictReport = async (req, res) => {
    try {
        const { schoolId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const models = getModels(schoolDbName);
        const { TimetableEntry, Teacher, Class, Subject } = models;

        const conflicts = [];

        // Get all active entries
        const allEntries = await TimetableEntry.find({ schoolId, isActive: true });

        // Check for teacher conflicts
        const teacherSlots = {};
        for (const entry of allEntries) {
            const key = `${entry.teacherId}-${entry.dayOfWeek}-${entry.periodNumber}`;
            if (teacherSlots[key]) {
                teacherSlots[key].push(entry);
            } else {
                teacherSlots[key] = [entry];
            }
        }

        for (const [key, entries] of Object.entries(teacherSlots)) {
            if (entries.length > 1) {
                const teacher = await Teacher.findOne({ teacherId: entries[0].teacherId });
                conflicts.push({
                    type: "teacher",
                    description: `Teacher "${teacher?.firstName || entries[0].teacherId}" assigned to multiple classes`,
                    entries: entries.map((e) => e.entryId),
                    dayOfWeek: entries[0].dayOfWeek,
                    periodNumber: entries[0].periodNumber,
                });
            }
        }

        // Check for room conflicts
        const roomSlots = {};
        for (const entry of allEntries) {
            if (entry.roomId) {
                const key = `${entry.roomId}-${entry.dayOfWeek}-${entry.periodNumber}`;
                if (roomSlots[key]) {
                    roomSlots[key].push(entry);
                } else {
                    roomSlots[key] = [entry];
                }
            }
        }

        for (const [key, entries] of Object.entries(roomSlots)) {
            if (entries.length > 1) {
                conflicts.push({
                    type: "room",
                    description: `Room "${entries[0].roomId}" double-booked`,
                    entries: entries.map((e) => e.entryId),
                    dayOfWeek: entries[0].dayOfWeek,
                    periodNumber: entries[0].periodNumber,
                });
            }
        }

        res.status(200).json({
            success: true,
            data: {
                totalConflicts: conflicts.length,
                conflicts,
            },
        });
    } catch (error) {
        console.error("Error generating conflict report:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to generate conflict report",
        });
    }
};

module.exports = {
    createEntry,
    bulkCreateEntries,
    getClassTimetable,
    getTeacherTimetable,
    getEntriesByDay,
    updateEntry,
    deleteEntry,
    getTeacherFreePeriods,
    getFreeTeachersForPeriod,
    getConflictReport,
};
