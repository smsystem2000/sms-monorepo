const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const {
    ExamSchema: examSchema,
    ExamScheduleSchema: examScheduleSchema,
    TimetableConfigSchema: timetableConfigSchema,
    TimetableEntrySchema: timetableEntrySchema,
    ExamTypeSchema: examTypeSchema,
    ExamTermSchema: examTermSchema,
    TeacherSchema: teacherSchema,
    RoomSchema: roomSchema,
} = require("@sms/shared");

const getModels = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return {
        Exam: schoolDb.model("Exam", examSchema),
        ExamSchedule: schoolDb.model("ExamSchedule", examScheduleSchema),
        TimetableConfig: schoolDb.model("TimetableConfig", timetableConfigSchema),
        TimetableEntry: schoolDb.model("TimetableEntry", timetableEntrySchema),
        ExamType: schoolDb.model("ExamType", examTypeSchema),
        ExamTerm: schoolDb.model("ExamTerm", examTermSchema),
        Teacher: schoolDb.model("Teacher", teacherSchema),
        Room: schoolDb.model("Room", roomSchema),
    };
};

// Helper: Check time overlap
const isTimeOverlap = (start1, end1, start2, end2) => {
    // Convert times to comparable values (e.g., minutes from midnight) if they are strings like "HH:mm"
    // Assuming format is "HH:mm" 24-hour
    const parseTime = (t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };
    const s1 = parseTime(start1);
    const e1 = parseTime(end1);
    const s2 = parseTime(start2);
    const e2 = parseTime(end2);

    return Math.max(s1, s2) < Math.min(e1, e2);
};

// ==========================================
// Exam Event Controllers
// ==========================================

const createExam = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const examData = req.body;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Exam } = getModels(schoolDbName);

        // Generate custom examId if not present (simple logic or uuid)
        // Ideally handled by backend. Let's use timestamp + random for now or expect frontend?
        // Let's generate a simple ID: EXAM-<Year>-<Random>
        const examIdHash = `EXAM-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;

        const newExam = new Exam({
            ...examData,
            schoolId,
            examId: examData.examId || examIdHash
        });

        await newExam.save();
        res.status(201).json({ success: true, data: newExam, message: "Exam created successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getExams = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { academicYear, status } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { Exam } = getModels(schoolDbName);

        const query = { schoolId, isActive: true };
        if (academicYear) query.academicYear = academicYear;
        if (status) query.status = status;

        const exams = await Exam.find(query)
            .populate('typeId', 'name')
            .populate('termId', 'name')
            .sort({ startDate: -1 });

        res.status(200).json({ success: true, data: exams });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// Schedule Controllers & Conflict Detection
// ==========================================

const scheduleExamSubject = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const scheduleData = req.body; // examId, classId, subjectId, date, startTime, endTime, invigilators...

        const schoolDbName = await getSchoolDbName(schoolId);
        const { ExamSchedule, TimetableConfig, TimetableEntry } = getModels(schoolDbName);

        // 1. Check for Room Conflicts
        if (scheduleData.roomId) {
            const roomConflict = await ExamSchedule.findOne({
                schoolId,
                roomId: scheduleData.roomId,
                date: new Date(scheduleData.date),
                _id: { $ne: scheduleData._id }, // Exclude self if updating
                // Check time overlap
                $or: [
                    { startTime: { $lt: scheduleData.endTime }, endTime: { $gt: scheduleData.startTime } }
                ]
            });

            // Note: The above mongo query is rough for string times. Ideally we standardise.
            // But since strings "09:00" work lexically for 24h format, it's okay-ish.
            // Better to fetch potential conflicts by date & room, then check exact time overlap in code.

            // Refined Room Check:
            const potentialRoomConflicts = await ExamSchedule.find({
                schoolId,
                roomId: scheduleData.roomId,
                date: new Date(scheduleData.date)
            });

            const hasRoomConflict = potentialRoomConflicts.some(s =>
                s._id.toString() !== (scheduleData._id || '') &&
                isTimeOverlap(s.startTime, s.endTime, scheduleData.startTime, scheduleData.endTime)
            );

            if (hasRoomConflict) {
                return res.status(409).json({ success: false, message: "Room is already booked for another exam at this time." });
            }
        }

        // 2. Check for Invigilator Conflicts (Regular Timetable + Other Exams)
        if (scheduleData.invigilators && scheduleData.invigilators.length > 0) {
            const dateObj = new Date(scheduleData.date);
            const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

            // A. Check against Regular Timetable
            const config = await TimetableConfig.findOne({ schoolId, isActive: true });

            // Find periods that overlap with exam time
            const conflictingPeriods = config?.periods
                .filter(p => isTimeOverlap(p.startTime, p.endTime, scheduleData.startTime, scheduleData.endTime))
                .map(p => p.periodNumber) || [];

            if (conflictingPeriods.length > 0) {
                const timetableConflict = await TimetableEntry.findOne({
                    schoolId,
                    teacherId: { $in: scheduleData.invigilators },
                    dayOfWeek,
                    periodNumber: { $in: conflictingPeriods },
                    isActive: true
                });

                if (timetableConflict) {
                    return res.status(409).json({
                        success: false,
                        message: `Invigilator has a regular class during this time (Period ${timetableConflict.periodNumber})`
                    });
                }
            }

            // B. Check against Other Exams
            const potentialInvigilatorConflicts = await ExamSchedule.find({
                schoolId,
                invigilators: { $in: scheduleData.invigilators },
                date: new Date(scheduleData.date)
            });

            const hasInvigConflict = potentialInvigilatorConflicts.some(s =>
                s._id.toString() !== (scheduleData._id || '') &&
                isTimeOverlap(s.startTime, s.endTime, scheduleData.startTime, scheduleData.endTime)
            );

            if (hasInvigConflict) {
                return res.status(409).json({ success: false, message: "Invigilator is assigned to another exam at this time." });
            }
        }

        // Calculate durationMinutes from startTime and endTime
        // Time format could be "HH:mm" (24hr) or "HH:mm AM/PM" (12hr)
        const parseTimeToMinutes = (timeStr) => {
            if (!timeStr) return 0;
            // Remove extra spaces
            timeStr = timeStr.trim();

            // Check if it's 12-hour format (contains AM/PM)
            const isPM = timeStr.toLowerCase().includes('pm');
            const isAM = timeStr.toLowerCase().includes('am');

            // Remove AM/PM suffix
            let cleanTime = timeStr.replace(/\s*(am|pm)/gi, '').trim();

            const [h, m] = cleanTime.split(':').map(Number);
            let hours = h;

            // Convert 12-hour to 24-hour
            if (isPM && hours < 12) hours += 12;
            if (isAM && hours === 12) hours = 0;

            return hours * 60 + (m || 0);
        };

        // Normalize time to 24-hour format for storage
        const normalizeTime = (timeStr) => {
            if (!timeStr) return '';
            const minutes = parseTimeToMinutes(timeStr);
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        };

        const startMinutes = parseTimeToMinutes(scheduleData.startTime);
        const endMinutes = parseTimeToMinutes(scheduleData.endTime);
        const durationMinutes = endMinutes - startMinutes;

        if (durationMinutes <= 0) {
            return res.status(400).json({ success: false, message: "End time must be after start time" });
        }

        // Normalize times to 24-hour format
        const normalizedStartTime = normalizeTime(scheduleData.startTime);
        const normalizedEndTime = normalizeTime(scheduleData.endTime);

        // Create or Update Schedule
        let schedule;
        const schedulePayload = {
            ...scheduleData,
            schoolId,
            startTime: normalizedStartTime,
            endTime: normalizedEndTime,
            durationMinutes,
            // Handle optional roomId - don't include if empty
            ...(scheduleData.roomId ? { roomId: scheduleData.roomId } : {})
        };

        // Remove empty roomId if present
        if (!schedulePayload.roomId || schedulePayload.roomId === '') {
            delete schedulePayload.roomId;
        }

        if (scheduleData._id) {
            schedule = await ExamSchedule.findByIdAndUpdate(scheduleData._id, schedulePayload, { new: true });
        } else {
            schedule = new ExamSchedule(schedulePayload);
            await schedule.save();
        }

        res.status(200).json({ success: true, data: schedule, message: "Exam scheduled successfully" });

    } catch (error) {
        console.error("Schedule exam error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getExamSchedule = async (req, res) => {
    try {
        const { schoolId, examId } = req.params;
        const { classId } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        // Get all models to ensure Teacher and Room schemas are registered
        const { ExamSchedule, Teacher, Room } = getModels(schoolDbName);

        const query = { schoolId, examId };
        if (classId) query.classId = classId;

        const schedules = await ExamSchedule.find(query)
            .sort({ date: 1, startTime: 1 })
            .populate('roomId', 'name')
            .lean();

        // Manually lookup invigilators by teacherId (not ObjectId)
        const allInvigilatorIds = [...new Set(schedules.flatMap(s => s.invigilators || []))];
        const teachers = await Teacher.find({ teacherId: { $in: allInvigilatorIds } })
            .select('teacherId firstName lastName email')
            .lean();

        const teacherMap = {};
        teachers.forEach(t => {
            teacherMap[t.teacherId] = t;
        });

        // Enrich schedules with teacher details
        const enrichedSchedules = schedules.map(s => ({
            ...s,
            invigilators: (s.invigilators || []).map(id => teacherMap[id] || { teacherId: id })
        }));

        res.status(200).json({ success: true, data: enrichedSchedules });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createExam,
    getExams,
    scheduleExamSubject,
    getExamSchedule
};
