const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const {
    StudentExamRegistrationSchema: studentExamRegistrationSchema,
    ExamSchema: examSchema,
    // We might need Student schema too from shared if we check eligibility based on student data
} = require("@sms/shared");

const getModels = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return {
        StudentExamRegistration: schoolDb.model("StudentExamRegistration", studentExamRegistrationSchema),
        Exam: schoolDb.model("Exam", examSchema),
    };
};

// Generate/Register Admit Card for a student
const generateAdmitCard = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { examId, studentId, classId, sectionId, rollNumber } = req.body;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { StudentExamRegistration, Exam } = getModels(schoolDbName);

        // check if exam exists and is not draft
        const exam = await Exam.findOne({ schoolId, examId });
        if (!exam || exam.status === 'draft') {
            return res.status(400).json({ success: false, message: "Exam not found or not ready for registration" });
        }

        // Check/Create registration
        let registration = await StudentExamRegistration.findOne({ schoolId, examId, studentId });

        if (registration) {
            if (registration.admitCardGenerated) {
                return res.status(200).json({ success: true, data: registration, message: "Admit card already generated" });
            }
            // Update if exists but not generated (re-generate)
            registration.admitCardGenerated = true;
            await registration.save();
        } else {
            registration = new StudentExamRegistration({
                schoolId,
                examId,
                studentId,
                classId,
                sectionId,
                rollNumber,
                admitCardGenerated: true
            });
            await registration.save();
        }

        res.status(201).json({ success: true, data: registration, message: "Admit card generated successfully" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAdmitCard = async (req, res) => {
    try {
        const { schoolId, examId, studentId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { StudentExamRegistration } = getModels(schoolDbName);

        const registration = await StudentExamRegistration.findOne({ schoolId, examId, studentId });

        if (!registration) {
            return res.status(404).json({ success: false, message: "Admit card not found" });
        }

        res.status(200).json({ success: true, data: registration });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Bulk generation for a class
const bulkGenerateAdmitCards = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { examId, students: providedStudents } = req.body;

        const schoolDbName = await getSchoolDbName(schoolId);
        const schoolDb = getSchoolDbConnection(schoolDbName);
        const { StudentExamRegistration, Exam } = getModels(schoolDbName);

        // Get the exam to find participating classes
        const exam = await Exam.findOne({ schoolId, examId });
        if (!exam) {
            return res.status(404).json({ success: false, message: "Exam not found" });
        }

        let students = providedStudents;

        // If no students provided, fetch all students from exam's classes
        if (!students || students.length === 0) {
            // Get Student model from school connection
            const { StudentSchema } = require("@sms/shared");
            const Student = schoolDb.model("Student", StudentSchema);

            // Fetch all students from the participating classes
            const fetchedStudents = await Student.find({
                schoolId,
                class: { $in: exam.classes }
            }).select('studentId class section rollNumber').lean();

            if (!fetchedStudents || fetchedStudents.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No students found in participating classes"
                });
            }

            students = fetchedStudents.map(s => ({
                studentId: s.studentId,
                classId: s.class,
                sectionId: s.section || s.sectionId,
                rollNumber: s.rollNumber || 'N/A'
            }));
        }

        const operations = students.map(student => ({
            updateOne: {
                filter: { schoolId, examId, studentId: student.studentId },
                update: {
                    $set: {
                        classId: student.classId,
                        sectionId: student.sectionId,
                        rollNumber: student.rollNumber,
                        admitCardGenerated: true,
                        isEligible: true
                    }
                },
                upsert: true
            }
        }));

        const result = await StudentExamRegistration.bulkWrite(operations);

        res.status(200).json({
            success: true,
            message: `Generated admit cards for ${result.upsertedCount + result.modifiedCount} students`,
            data: {
                totalProcessed: students.length,
                upserted: result.upsertedCount,
                modified: result.modifiedCount
            }
        });

    } catch (error) {
        console.error("Bulk generate admit cards error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all admit card registrations for an exam
const getExamRegistrations = async (req, res) => {
    try {
        const { schoolId, examId } = req.params;
        const { classId } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        const schoolDb = getSchoolDbConnection(schoolDbName);
        const { StudentExamRegistration } = getModels(schoolDbName);

        // Get Student model for name lookup
        const { StudentSchema } = require("@sms/shared");
        const Student = schoolDb.model("Student", StudentSchema);

        const query = { schoolId, examId };
        if (classId) query.classId = classId;

        const registrations = await StudentExamRegistration.find(query).lean();

        // Enrich with student names
        const studentIds = registrations.map(r => r.studentId);
        const students = await Student.find({ studentId: { $in: studentIds } })
            .select('studentId firstName lastName email class section rollNumber')
            .lean();

        const studentMap = {};
        students.forEach(s => {
            studentMap[s.studentId] = s;
        });

        const enrichedRegistrations = registrations.map(r => ({
            ...r,
            student: studentMap[r.studentId] || null
        }));

        res.status(200).json({
            success: true,
            data: enrichedRegistrations,
            total: enrichedRegistrations.length
        });
    } catch (error) {
        console.error("Get exam registrations error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    generateAdmitCard,
    getAdmitCard,
    bulkGenerateAdmitCards,
    getExamRegistrations
};
