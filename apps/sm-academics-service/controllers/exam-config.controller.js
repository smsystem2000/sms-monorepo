const { getSchoolDbConnection } = require("../configs/db");
const { getSchoolDbName } = require("../utils/schoolDbHelper");
const {
    ExamTermSchema: examTermSchema,
    ExamTypeSchema: examTypeSchema,
    GradingSystemSchema: gradingSystemSchema,
} = require("@sms/shared");

// Helper to get models
const getModels = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return {
        ExamTerm: schoolDb.model("ExamTerm", examTermSchema),
        ExamType: schoolDb.model("ExamType", examTypeSchema),
        GradingSystem: schoolDb.model("GradingSystem", gradingSystemSchema),
    };
};

// ==========================================
// Exam Term Controllers
// ==========================================

const createTerm = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { name, academicYear, startDate, endDate } = req.body;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { ExamTerm } = getModels(schoolDbName);

        const newTerm = new ExamTerm({
            schoolId,
            name,
            academicYear,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
        });

        await newTerm.save();

        res.status(201).json({ success: true, data: newTerm, message: "Exam term created successfully" });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "Term name already exists for this academic year" });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const getTerms = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { academicYear } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { ExamTerm } = getModels(schoolDbName);

        const query = { schoolId, isActive: true };
        if (academicYear) query.academicYear = academicYear;

        const terms = await ExamTerm.find(query).sort({ startDate: 1 });
        res.status(200).json({ success: true, data: terms });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateTerm = async (req, res) => {
    try {
        const { schoolId, termId } = req.params;
        const updates = req.body;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { ExamTerm } = getModels(schoolDbName);

        const term = await ExamTerm.findOneAndUpdate(
            { _id: termId, schoolId },
            updates,
            { new: true }
        );

        if (!term) return res.status(404).json({ success: false, message: "Term not found" });

        res.status(200).json({ success: true, data: term, message: "Term updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteTerm = async (req, res) => {
    try {
        const { schoolId, termId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { ExamTerm } = getModels(schoolDbName);

        // Soft delete
        const term = await ExamTerm.findOneAndUpdate(
            { _id: termId, schoolId },
            { isActive: false, status: 'archived' },
            { new: true }
        );

        if (!term) return res.status(404).json({ success: false, message: "Term not found" });

        res.status(200).json({ success: true, message: "Term deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// Exam Type Controllers
// ==========================================

const createExamType = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { name, weightage, description, termId } = req.body;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { ExamType } = getModels(schoolDbName);

        const newType = new ExamType({
            schoolId,
            name,
            weightage,
            description,
            termId
        });

        await newType.save();

        res.status(201).json({ success: true, data: newType, message: "Exam type created successfully" });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "Exam type name already exists" });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const getExamTypes = async (req, res) => {
    try {
        const { schoolId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { ExamType } = getModels(schoolDbName);

        const types = await ExamType.find({ schoolId, isActive: true }).populate('termId', 'name');
        res.status(200).json({ success: true, data: types });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteExamType = async (req, res) => {
    try {
        const { schoolId, typeId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { ExamType } = getModels(schoolDbName);

        const type = await ExamType.findOneAndUpdate(
            { _id: typeId, schoolId },
            { isActive: false },
            { new: true }
        );

        if (!type) return res.status(404).json({ success: false, message: "Exam type not found" });

        res.status(200).json({ success: true, message: "Exam type deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// Grading System Controllers
// ==========================================

const createGradingSystem = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { name, grades, isDefault } = req.body;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { GradingSystem } = getModels(schoolDbName);

        // If isDefault is true, unset other defaults
        if (isDefault) {
            await GradingSystem.updateMany({ schoolId }, { isDefault: false });
        }

        const newSystem = new GradingSystem({
            schoolId,
            name,
            grades,
            isDefault
        });

        await newSystem.save();

        res.status(201).json({ success: true, data: newSystem, message: "Grading system created successfully" });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "Grading system name already exists" });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

const getGradingSystems = async (req, res) => {
    try {
        const { schoolId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { GradingSystem } = getModels(schoolDbName);

        const systems = await GradingSystem.find({ schoolId, isActive: true });
        res.status(200).json({ success: true, data: systems });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateGradingSystem = async (req, res) => {
    try {
        const { schoolId, systemId } = req.params;
        const { name, grades, isDefault } = req.body;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { GradingSystem } = getModels(schoolDbName);

        if (isDefault) {
            await GradingSystem.updateMany({ schoolId }, { isDefault: false });
        }

        const system = await GradingSystem.findOneAndUpdate(
            { _id: systemId, schoolId },
            { name, grades, isDefault },
            { new: true }
        );

        if (!system) return res.status(404).json({ success: false, message: "Grading system not found" });

        res.status(200).json({ success: true, data: system, message: "Grading system updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteGradingSystem = async (req, res) => {
    try {
        const { schoolId, systemId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        const { GradingSystem } = getModels(schoolDbName);

        const system = await GradingSystem.findOneAndUpdate(
            { _id: systemId, schoolId },
            { isActive: false },
            { new: true }
        );

        if (!system) return res.status(404).json({ success: false, message: "Grading system not found" });

        res.status(200).json({ success: true, message: "Grading system deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createTerm,
    getTerms,
    updateTerm,
    deleteTerm,
    createExamType,
    getExamTypes,
    deleteExamType,
    createGradingSystem,
    getGradingSystems,
    updateGradingSystem,
    deleteGradingSystem
};
