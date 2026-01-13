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
        const { examId, students } = req.body; // Array of student objects with {studentId, classId, sectionId, rollNumber}

        const schoolDbName = await getSchoolDbName(schoolId);
        const { StudentExamRegistration } = getModels(schoolDbName);

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
            message: `Processed ${result.upsertedCount + result.modifiedCount} admit cards`,
            data: result
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    generateAdmitCard,
    getAdmitCard,
    bulkGenerateAdmitCards
};
