const { getSchoolDbConnection } = require("../configs/db");
const { SchoolModel: School, SubjectSchema: subjectSchema } = require("@sms/shared");

/**
 * Get Subject model for a specific school database
 */
const getSubjectModel = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return schoolDb.model("Subject", subjectSchema);
};

/**
 * Helper function to generate subjectId
 * Format: SUB + 5 digit number (SUB00001, SUB00002, ...)
 */
const generateSubjectId = async (SubjectModel) => {
    const lastSubject = await SubjectModel.findOne().sort({ subjectId: -1 });

    if (!lastSubject || !lastSubject.subjectId) {
        return "SUB00001";
    }

    const lastIdNumber = parseInt(lastSubject.subjectId.replace("SUB", ""), 10);
    const newIdNumber = lastIdNumber + 1;

    return `SUB${String(newIdNumber).padStart(5, "0")}`;
};

/**
 * Get school database name by schoolId
 */
const getSchoolDbName = async (schoolId) => {
    const school = await School.findOne({ schoolId });
    if (!school) {
        return null;
    }
    return school.schoolDbName;
};

// Create a new subject
const createSubject = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { name, code, description } = req.body;

        // Validate required fields
        if (!name || !code) {
            return res.status(400).json({
                success: false,
                message: "Subject name and code are required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const SubjectModel = getSubjectModel(schoolDbName);

        // Check if subject with same name or code exists
        const existingSubject = await SubjectModel.findOne({
            $or: [{ name }, { code }],
            schoolId,
        });
        if (existingSubject) {
            return res.status(400).json({
                success: false,
                message: "Subject with this name or code already exists",
            });
        }

        // Generate subjectId
        const subjectId = await generateSubjectId(SubjectModel);

        const newSubject = new SubjectModel({
            subjectId,
            schoolId,
            name,
            code: code.toUpperCase(),
            description,
        });

        const savedSubject = await newSubject.save();

        return res.status(201).json({
            success: true,
            message: "Subject created successfully",
            data: savedSubject,
        });
    } catch (error) {
        console.error("Error creating subject:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating subject",
            error: error.message,
        });
    }
};

// Get all subjects in a school
const getAllSubjects = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { status } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const SubjectModel = getSubjectModel(schoolDbName);

        // Build query filters
        const query = {};
        if (status) query.status = status;

        const subjects = await SubjectModel.find(query).sort({ name: 1 });

        return res.status(200).json({
            success: true,
            message: "Subjects fetched successfully",
            data: subjects,
            count: subjects.length,
        });
    } catch (error) {
        console.error("Error fetching subjects:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching subjects",
            error: error.message,
        });
    }
};

// Get subject by subjectId
const getSubjectById = async (req, res) => {
    try {
        const { schoolId, id: subjectId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const SubjectModel = getSubjectModel(schoolDbName);
        const subject = await SubjectModel.findOne({ subjectId });

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: "Subject not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Subject fetched successfully",
            data: subject,
        });
    } catch (error) {
        console.error("Error fetching subject:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching subject",
            error: error.message,
        });
    }
};

// Update subject by subjectId
const updateSubjectById = async (req, res) => {
    try {
        const { schoolId, id: subjectId } = req.params;
        const updateData = req.body;

        // Prevent updating subjectId and schoolId
        delete updateData.subjectId;
        delete updateData.schoolId;

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const SubjectModel = getSubjectModel(schoolDbName);

        // Check if subject exists
        const existingSubject = await SubjectModel.findOne({ subjectId });
        if (!existingSubject) {
            return res.status(404).json({
                success: false,
                message: "Subject not found",
            });
        }

        // If name or code is being updated, check for duplicates
        if (updateData.name || updateData.code) {
            const duplicateQuery = { schoolId, _id: { $ne: existingSubject._id } };
            const orConditions = [];

            if (updateData.name && updateData.name !== existingSubject.name) {
                orConditions.push({ name: updateData.name });
            }
            if (updateData.code && updateData.code !== existingSubject.code) {
                orConditions.push({ code: updateData.code.toUpperCase() });
            }

            if (orConditions.length > 0) {
                duplicateQuery.$or = orConditions;
                const duplicateSubject = await SubjectModel.findOne(duplicateQuery);
                if (duplicateSubject) {
                    return res.status(400).json({
                        success: false,
                        message: "Subject with this name or code already exists",
                    });
                }
            }
        }

        // Uppercase code if provided
        if (updateData.code) {
            updateData.code = updateData.code.toUpperCase();
        }

        const updatedSubject = await SubjectModel.findOneAndUpdate(
            { subjectId },
            updateData,
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: "Subject updated successfully",
            data: updatedSubject,
        });
    } catch (error) {
        console.error("Error updating subject:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating subject",
            error: error.message,
        });
    }
};

// Delete subject (soft delete)
const deleteSubjectById = async (req, res) => {
    try {
        const { schoolId, id: subjectId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const SubjectModel = getSubjectModel(schoolDbName);

        const subject = await SubjectModel.findOne({ subjectId });
        if (!subject) {
            return res.status(404).json({
                success: false,
                message: "Subject not found",
            });
        }

        const deletedSubject = await SubjectModel.findOneAndUpdate(
            { subjectId },
            { status: "inactive" },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Subject deleted successfully (soft delete)",
            data: deletedSubject,
        });
    } catch (error) {
        console.error("Error deleting subject:", error);
        return res.status(500).json({
            success: false,
            message: "Error deleting subject",
            error: error.message,
        });
    }
};

module.exports = {
    createSubject,
    getAllSubjects,
    getSubjectById,
    updateSubjectById,
    deleteSubjectById,
};
