const { getSchoolDbConnection } = require("../configs/db");
const { SchoolModel: School, ClassSchema: classSchema } = require("@sms/shared");

/**
 * Get Class model for a specific school database
 */
const getClassModel = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return schoolDb.model("Class", classSchema);
};

/**
 * Helper function to generate classId
 * Format: CLS + 5 digit number (CLS00001, CLS00002, ...)
 */
const generateClassId = async (ClassModel) => {
    const lastClass = await ClassModel.findOne().sort({ classId: -1 });

    if (!lastClass || !lastClass.classId) {
        return "CLS00001";
    }

    const lastIdNumber = parseInt(lastClass.classId.replace("CLS", ""), 10);
    const newIdNumber = lastIdNumber + 1;

    return `CLS${String(newIdNumber).padStart(5, "0")}`;
};

/**
 * Helper function to generate sectionId
 * Format: SEC + 5 digit number (SEC00001, SEC00002, ...)
 */
const generateSectionId = (existingSections) => {
    if (!existingSections || existingSections.length === 0) {
        return "SEC00001";
    }

    const sectionIds = existingSections
        .map((s) => parseInt(s.sectionId.replace("SEC", ""), 10))
        .filter((n) => !isNaN(n));

    const maxId = Math.max(...sectionIds, 0);
    return `SEC${String(maxId + 1).padStart(5, "0")}`;
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

// Create a new class
const createClass = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { name, description, sections } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Class name is required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const ClassModel = getClassModel(schoolDbName);

        // Check if class with same name exists
        const existingClass = await ClassModel.findOne({ name, schoolId });
        if (existingClass) {
            return res.status(400).json({
                success: false,
                message: "Class with this name already exists",
            });
        }

        // Generate classId
        const classId = await generateClassId(ClassModel);

        // Process sections if provided
        let processedSections = [];
        if (sections && Array.isArray(sections)) {
            processedSections = sections.map((section, index) => ({
                sectionId: `SEC${String(index + 1).padStart(5, "0")}`,
                name: section.name,
                classTeacherId: section.classTeacherId || null,
            }));
        }

        const newClass = new ClassModel({
            classId,
            schoolId,
            name,
            description,
            sections: processedSections,
        });

        const savedClass = await newClass.save();

        return res.status(201).json({
            success: true,
            message: "Class created successfully",
            data: savedClass,
        });
    } catch (error) {
        console.error("Error creating class:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating class",
            error: error.message,
        });
    }
};

// Get all classes in a school
const getAllClasses = async (req, res) => {
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

        const ClassModel = getClassModel(schoolDbName);

        // Build query filters
        const query = {};
        if (status) query.status = status;

        const classes = await ClassModel.find(query).sort({ name: 1 });

        return res.status(200).json({
            success: true,
            message: "Classes fetched successfully",
            data: classes,
            count: classes.length,
        });
    } catch (error) {
        console.error("Error fetching classes:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching classes",
            error: error.message,
        });
    }
};

// Get class by classId
const getClassById = async (req, res) => {
    try {
        const { schoolId, id: classId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const ClassModel = getClassModel(schoolDbName);
        const classData = await ClassModel.findOne({ classId });

        if (!classData) {
            return res.status(404).json({
                success: false,
                message: "Class not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Class fetched successfully",
            data: classData,
        });
    } catch (error) {
        console.error("Error fetching class:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching class",
            error: error.message,
        });
    }
};

// Update class by classId
const updateClassById = async (req, res) => {
    try {
        const { schoolId, id: classId } = req.params;
        const updateData = req.body;

        // Prevent updating classId and schoolId
        delete updateData.classId;
        delete updateData.schoolId;

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const ClassModel = getClassModel(schoolDbName);

        // Check if class exists
        const existingClass = await ClassModel.findOne({ classId });
        if (!existingClass) {
            return res.status(404).json({
                success: false,
                message: "Class not found",
            });
        }

        // If name is being updated, check for duplicates
        if (updateData.name && updateData.name !== existingClass.name) {
            const duplicateClass = await ClassModel.findOne({
                name: updateData.name,
                schoolId,
            });
            if (duplicateClass) {
                return res.status(400).json({
                    success: false,
                    message: "Class with this name already exists",
                });
            }
        }

        const updatedClass = await ClassModel.findOneAndUpdate(
            { classId },
            updateData,
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: "Class updated successfully",
            data: updatedClass,
        });
    } catch (error) {
        console.error("Error updating class:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating class",
            error: error.message,
        });
    }
};

// Delete class (soft delete)
const deleteClassById = async (req, res) => {
    try {
        const { schoolId, id: classId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const ClassModel = getClassModel(schoolDbName);

        const classData = await ClassModel.findOne({ classId });
        if (!classData) {
            return res.status(404).json({
                success: false,
                message: "Class not found",
            });
        }

        const deletedClass = await ClassModel.findOneAndUpdate(
            { classId },
            { status: "inactive" },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Class deleted successfully (soft delete)",
            data: deletedClass,
        });
    } catch (error) {
        console.error("Error deleting class:", error);
        return res.status(500).json({
            success: false,
            message: "Error deleting class",
            error: error.message,
        });
    }
};

// Add section to class
const addSection = async (req, res) => {
    try {
        const { schoolId, id: classId } = req.params;
        const { name, classTeacherId } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Section name is required",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const ClassModel = getClassModel(schoolDbName);

        const classData = await ClassModel.findOne({ classId });
        if (!classData) {
            return res.status(404).json({
                success: false,
                message: "Class not found",
            });
        }

        // Check if section with same name exists
        const existingSection = classData.sections.find(
            (s) => s.name.toLowerCase() === name.toLowerCase()
        );
        if (existingSection) {
            return res.status(400).json({
                success: false,
                message: "Section with this name already exists in this class",
            });
        }

        const sectionId = generateSectionId(classData.sections);
        const newSection = {
            sectionId,
            name,
            classTeacherId: classTeacherId || null,
        };

        classData.sections.push(newSection);
        await classData.save();

        return res.status(200).json({
            success: true,
            message: "Section added successfully",
            data: classData,
        });
    } catch (error) {
        console.error("Error adding section:", error);
        return res.status(500).json({
            success: false,
            message: "Error adding section",
            error: error.message,
        });
    }
};

// Remove section from class
const removeSection = async (req, res) => {
    try {
        const { schoolId, id: classId, sectionId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const ClassModel = getClassModel(schoolDbName);

        const classData = await ClassModel.findOne({ classId });
        if (!classData) {
            return res.status(404).json({
                success: false,
                message: "Class not found",
            });
        }

        const sectionIndex = classData.sections.findIndex(
            (s) => s.sectionId === sectionId
        );
        if (sectionIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Section not found",
            });
        }

        classData.sections.splice(sectionIndex, 1);
        await classData.save();

        return res.status(200).json({
            success: true,
            message: "Section removed successfully",
            data: classData,
        });
    } catch (error) {
        console.error("Error removing section:", error);
        return res.status(500).json({
            success: false,
            message: "Error removing section",
            error: error.message,
        });
    }
};

// Assign class teacher to section
const assignClassTeacher = async (req, res) => {
    try {
        const { schoolId, id: classId, sectionId } = req.params;
        const { teacherId } = req.body;

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const ClassModel = getClassModel(schoolDbName);

        const classData = await ClassModel.findOne({ classId });
        if (!classData) {
            return res.status(404).json({
                success: false,
                message: "Class not found",
            });
        }

        const section = classData.sections.find((s) => s.sectionId === sectionId);
        if (!section) {
            return res.status(404).json({
                success: false,
                message: "Section not found",
            });
        }

        section.classTeacherId = teacherId || null;
        await classData.save();

        return res.status(200).json({
            success: true,
            message: teacherId
                ? "Class teacher assigned successfully"
                : "Class teacher removed successfully",
            data: classData,
        });
    } catch (error) {
        console.error("Error assigning class teacher:", error);
        return res.status(500).json({
            success: false,
            message: "Error assigning class teacher",
            error: error.message,
        });
    }
};

module.exports = {
    createClass,
    getAllClasses,
    getClassById,
    updateClassById,
    deleteClassById,
    addSection,
    removeSection,
    assignClassTeacher,
};
