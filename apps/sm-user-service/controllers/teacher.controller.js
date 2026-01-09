const { getSchoolDbConnection } = require("../configs/db");
const { SchoolModel: School, EmailRegistryModel: EmailRegistry, TeacherSchema: teacherSchema } = require("@sms/shared");

/**
 * Get Teacher model for a specific school database
 */
const getTeacherModel = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return schoolDb.model("Teacher", teacherSchema);
};

/**
 * Helper function to generate teacherId
 * Format: TCH + 5 digit number (TCH00001, TCH00002, ...)
 */
const generateTeacherId = async (Teacher) => {
    const lastTeacher = await Teacher.findOne().sort({ teacherId: -1 });

    if (!lastTeacher || !lastTeacher.teacherId) {
        return "TCH00001";
    }

    const lastIdNumber = parseInt(lastTeacher.teacherId.replace("TCH", ""), 10);
    const newIdNumber = lastIdNumber + 1;

    return `TCH${String(newIdNumber).padStart(5, "0")}`;
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

// Create a new teacher
const createTeacher = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const {
            firstName,
            lastName,
            email,
            password,
            phone,
            department,
            subjects,
            classes,
            status,
            profileImage,
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "firstName, lastName, email, and password are required",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if email already exists in EmailRegistry (global check)
        const existingEmail = await EmailRegistry.findOne({ email: normalizedEmail });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: "Email already exists in the system",
            });
        }

        // Get school database name
        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const Teacher = getTeacherModel(schoolDbName);

        // Generate teacherId
        const teacherId = await generateTeacherId(Teacher);

        const newTeacher = new Teacher({
            teacherId,
            schoolId,
            firstName,
            lastName,
            email: normalizedEmail,
            password, // Plain text for now - add bcrypt later
            phone,
            department,
            subjects: subjects || [],
            classes: classes || [],
            status: status || "active",
            profileImage,
        });

        const savedTeacher = await newTeacher.save();

        // Register in EmailRegistry for unified login
        await EmailRegistry.create({
            email: normalizedEmail,
            role: "teacher",
            schoolId: schoolId,
            userId: savedTeacher.teacherId,
            status: savedTeacher.status || "active",
        });

        return res.status(201).json({
            success: true,
            message: "Teacher created successfully",
            data: {
                teacherId: savedTeacher.teacherId,
                schoolId: savedTeacher.schoolId,
                firstName: savedTeacher.firstName,
                lastName: savedTeacher.lastName,
                email: savedTeacher.email,
                phone: savedTeacher.phone,
                department: savedTeacher.department,
                subjects: savedTeacher.subjects,
                classes: savedTeacher.classes,
                status: savedTeacher.status,
            },
        });
    } catch (error) {
        console.error("Error creating teacher:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating teacher",
            error: error.message,
        });
    }
};

// Get teacher by teacherId
const getTeacherById = async (req, res) => {
    try {
        const { schoolId, id: teacherId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const Teacher = getTeacherModel(schoolDbName);
        const teacher = await Teacher.findOne({ teacherId }).select("-password");

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Teacher fetched successfully",
            data: teacher,
        });
    } catch (error) {
        console.error("Error fetching teacher:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching teacher",
            error: error.message,
        });
    }
};

// Get all teachers in a school
const getAllTeachers = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { department, status } = req.query;

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const Teacher = getTeacherModel(schoolDbName);

        // Build query filters
        const query = {};
        if (department) query.department = department;
        if (status) query.status = status;

        const teachers = await Teacher.find(query)
            .select("-password")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Teachers fetched successfully",
            data: teachers,
            count: teachers.length,
        });
    } catch (error) {
        console.error("Error fetching teachers:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching teachers",
            error: error.message,
        });
    }
};

// Update teacher by teacherId
const updateTeacherById = async (req, res) => {
    try {
        const { schoolId, id: teacherId } = req.params;
        const updateData = req.body;

        // Prevent updating teacherId, schoolId, and role
        delete updateData.teacherId;
        delete updateData.schoolId;
        delete updateData.role;

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const Teacher = getTeacherModel(schoolDbName);

        // Get current teacher for email comparison
        const currentTeacher = await Teacher.findOne({ teacherId });
        if (!currentTeacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found",
            });
        }

        // If email is being updated, update EmailRegistry too
        if (updateData.email && updateData.email !== currentTeacher.email) {
            const normalizedEmail = updateData.email.toLowerCase().trim();

            // Check if new email exists
            const existingEmail = await EmailRegistry.findOne({ email: normalizedEmail });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: "Email already exists in the system",
                });
            }

            // Update EmailRegistry
            await EmailRegistry.findOneAndUpdate(
                { email: currentTeacher.email.toLowerCase() },
                { email: normalizedEmail }
            );

            updateData.email = normalizedEmail;
        }

        // If status is being updated, update EmailRegistry too
        if (updateData.status) {
            await EmailRegistry.findOneAndUpdate(
                { email: currentTeacher.email.toLowerCase() },
                { status: updateData.status }
            );
        }

        const updatedTeacher = await Teacher.findOneAndUpdate(
            { teacherId },
            updateData,
            {
                new: true,
                runValidators: true,
            }
        ).select("-password");

        return res.status(200).json({
            success: true,
            message: "Teacher updated successfully",
            data: updatedTeacher,
        });
    } catch (error) {
        console.error("Error updating teacher:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating teacher",
            error: error.message,
        });
    }
};

// Delete teacher by teacherId (soft delete - set status to inactive)
const deleteTeacherById = async (req, res) => {
    try {
        const { schoolId, id: teacherId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const Teacher = getTeacherModel(schoolDbName);

        const teacher = await Teacher.findOne({ teacherId });
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found",
            });
        }

        // Soft delete
        const deletedTeacher = await Teacher.findOneAndUpdate(
            { teacherId },
            { status: "inactive" },
            { new: true }
        ).select("-password");

        // Update EmailRegistry status
        await EmailRegistry.findOneAndUpdate(
            { email: teacher.email.toLowerCase() },
            { status: "inactive" }
        );

        return res.status(200).json({
            success: true,
            message: "Teacher deleted successfully (soft delete)",
            data: deletedTeacher,
        });
    } catch (error) {
        console.error("Error deleting teacher:", error);
        return res.status(500).json({
            success: false,
            message: "Error deleting teacher",
            error: error.message,
        });
    }
};

module.exports = {
    createTeacher,
    getTeacherById,
    getAllTeachers,
    updateTeacherById,
    deleteTeacherById,
};
