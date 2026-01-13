const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const {
    ExamSchema: examSchema,
    ExamScheduleSchema: examScheduleSchema,
    TimetableConfigSchema: timetableConfigSchema,
    TimetableEntrySchema: timetableEntrySchema,
} = require("@sms/shared");

const getModels = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return {
        Exam: schoolDb.model("Exam", examSchema),
        ExamSchedule: schoolDb.model("ExamSchedule", examScheduleSchema),
        TimetableConfig: schoolDb.model("TimetableConfig", timetableConfigSchema),
        TimetableEntry: schoolDb.model("TimetableEntry", timetableEntrySchema),
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

        // Create or Update Schedule
        let schedule;
        if (scheduleData._id) {
            schedule = await ExamSchedule.findByIdAndUpdate(scheduleData._id, scheduleData, { new: true });
        } else {
            schedule = new ExamSchedule({ ...scheduleData, schoolId });
            await schedule.save();
        }

        res.status(200).json({ success: true, data: schedule, message: "Exam scheduled successfully" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getExamSchedule = async (req, res) => {
    try {
        const { schoolId, examId } = req.params;
        const { classId } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { ExamSchedule } = getModels(schoolDbName);

        const query = { schoolId, examId };
        if (classId) query.classId = classId;

        const schedule = await ExamSchedule.find(query)
            .sort({ date: 1, startTime: 1 })
            .populate('invigilators', 'firstName lastName email')
            .populate('roomId', 'name');

        res.status(200).json({ success: true, data: schedule });
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
