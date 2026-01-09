const { getSchoolDbConnection } = require("../configs/db");
const { SchoolModel: School, EmailRegistryModel: EmailRegistry, StudentSchema: studentSchema, ParentSchema: parentSchema, ClassSchema: classSchema } = require("@sms/shared");

/**
 * Get Student model for a specific school database
 */
const getStudentModel = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return schoolDb.model("Student", studentSchema);
};

/**
 * Get Parent model for a specific school database
 */
const getParentModel = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return schoolDb.model("Parent", parentSchema);
};

/**
 * Get Class model for a specific school database
 */
const getClassModel = (schoolDbName) => {
    const schoolDb = getSchoolDbConnection(schoolDbName);
    return schoolDb.model("Class", classSchema);
};

/**
 * Helper function to generate studentId
 * Format: STU + 5 digit number (STU00001, STU00002, ...)
 */
const generateStudentId = async (Student) => {
    const lastStudent = await Student.findOne().sort({ studentId: -1 });

    if (!lastStudent || !lastStudent.studentId) {
        return "STU00001";
    }

    const lastIdNumber = parseInt(lastStudent.studentId.replace("STU", ""), 10);
    const newIdNumber = lastIdNumber + 1;

    return `STU${String(newIdNumber).padStart(5, "0")}`;
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

// Create a new student
const createStudent = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const {
            firstName,
            lastName,
            email,
            password,
            phone,
            class: studentClass,
            section,
            rollNumber,
            parentId,
            dateOfBirth,
            gender,
            address,
            status,
            profileImage,
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !password || !studentClass) {
            return res.status(400).json({
                success: false,
                message: "firstName, lastName, password, and class are required",
            });
        }

        // Check if email already exists in EmailRegistry (global check)
        if (email) {
            const normalizedEmail = email.toLowerCase().trim();
            const existingEmail = await EmailRegistry.findOne({ email: normalizedEmail });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: "Email already exists in the system",
                });
            }
        }

        // Get school database name
        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const Student = getStudentModel(schoolDbName);

        // Generate studentId
        const studentId = await generateStudentId(Student);

        const normalizedEmail = email ? email.toLowerCase().trim() : undefined;

        const newStudent = new Student({
            studentId,
            schoolId,
            firstName,
            lastName,
            email: normalizedEmail,
            password, // Plain text for now
            phone,
            class: studentClass,
            section,
            rollNumber,
            parentId,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            gender,
            address,
            status: status || "active",
            profileImage,
        });

        const savedStudent = await newStudent.save();

        // Register in EmailRegistry for unified login (only if email provided)
        if (normalizedEmail) {
            await EmailRegistry.create({
                email: normalizedEmail,
                role: "student",
                schoolId: schoolId,
                userId: savedStudent.studentId,
                status: savedStudent.status || "active",
            });
        }

        // If parentId is provided, update parent's studentIds array (bidirectional)
        if (parentId) {
            try {
                const Parent = getParentModel(schoolDbName);
                await Parent.findOneAndUpdate(
                    { parentId },
                    { $addToSet: { studentIds: studentId } }
                );
            } catch (parentError) {
                console.warn("Could not update parent's studentIds:", parentError.message);
            }
        }

        return res.status(201).json({
            success: true,
            message: "Student created successfully",
            data: {
                studentId: savedStudent.studentId,
                schoolId: savedStudent.schoolId,
                firstName: savedStudent.firstName,
                lastName: savedStudent.lastName,
                email: savedStudent.email,
                class: savedStudent.class,
                section: savedStudent.section,
                rollNumber: savedStudent.rollNumber,
                parentId: savedStudent.parentId,
                status: savedStudent.status,
            },
        });
    } catch (error) {
        console.error("Error creating student:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating student",
            error: error.message,
        });
    }
};

// Get student by studentId
const getStudentById = async (req, res) => {
    try {
        const { schoolId, id: studentId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const Student = getStudentModel(schoolDbName);
        const student = await Student.findOne({ studentId }).select("-password");

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Student fetched successfully",
            data: student,
        });
    } catch (error) {
        console.error("Error fetching student:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching student",
            error: error.message,
        });
    }
};

// Get all students in a school
const getAllStudents = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { class: studentClass, section, status, parentId, classes } = req.query;
        const userRole = req.user?.role;
        const userClasses = req.user?.classes; // Teacher's assigned classes from token

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const Student = getStudentModel(schoolDbName);
        const Parent = getParentModel(schoolDbName);

        // Build query filters
        const query = {};

        // If teacher role, filter by their assigned classes only
        if (userRole === "teacher" && userClasses && userClasses.length > 0) {
            query.class = { $in: userClasses };
        } else if (classes) {
            // If classes filter passed as query param (comma separated)
            const classArray = classes.split(',').map(c => c.trim());
            query.class = { $in: classArray };
        } else if (studentClass) {
            query.class = studentClass;
        }

        if (section) query.section = section;
        if (status) query.status = status;
        if (parentId) query.parentId = parentId;

        const students = await Student.find(query)
            .select("-password")
            .sort({ createdAt: -1 });

        // Get unique parent IDs to fetch parent details
        const parentIds = [...new Set(students.filter(s => s.parentId).map(s => s.parentId))];

        // Fetch parent details
        const parents = await Parent.find({ parentId: { $in: parentIds } })
            .select("parentId firstName lastName");

        // Create a map for quick lookup
        const parentMap = {};
        parents.forEach(p => {
            parentMap[p.parentId] = `${p.firstName} ${p.lastName}`;
        });

        // Get unique class IDs to fetch class details
        const classIds = [...new Set(students.filter(s => s.class).map(s => s.class))];

        // Fetch class details with sections
        const Class = getClassModel(schoolDbName);
        const classData = await Class.find({ classId: { $in: classIds } })
            .select("classId name sections");

        // Create maps for class names and sections
        const classMap = {};
        const sectionMap = {};
        classData.forEach(c => {
            classMap[c.classId] = c.name;
            if (c.sections) {
                c.sections.forEach(s => {
                    sectionMap[s.sectionId] = s.name;
                });
            }
        });

        // Add parentName, className, and sectionName to each student
        const studentsWithDetails = students.map(student => {
            const studentObj = student.toObject();
            // Add parent name
            if (studentObj.parentId && parentMap[studentObj.parentId]) {
                studentObj.parentName = parentMap[studentObj.parentId];
            }
            // Add class name
            if (studentObj.class && classMap[studentObj.class]) {
                studentObj.className = classMap[studentObj.class];
            }
            // Add section name
            if (studentObj.section && sectionMap[studentObj.section]) {
                studentObj.sectionName = sectionMap[studentObj.section];
            }
            return studentObj;
        });

        return res.status(200).json({
            success: true,
            message: "Students fetched successfully",
            data: studentsWithDetails,
            count: studentsWithDetails.length,
        });
    } catch (error) {
        console.error("Error fetching students:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching students",
            error: error.message,
        });
    }
};

// Update student by studentId
const updateStudentById = async (req, res) => {
    try {
        const { schoolId, id: studentId } = req.params;
        const updateData = req.body;

        // Prevent updating studentId, schoolId, and role
        delete updateData.studentId;
        delete updateData.schoolId;
        delete updateData.role;

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const Student = getStudentModel(schoolDbName);

        // Get current student for parentId change handling
        const currentStudent = await Student.findOne({ studentId });
        if (!currentStudent) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }

        // If email is being updated, update EmailRegistry too
        if (updateData.email && updateData.email !== currentStudent.email) {
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
            if (currentStudent.email) {
                await EmailRegistry.findOneAndUpdate(
                    { email: currentStudent.email.toLowerCase() },
                    { email: normalizedEmail }
                );
            } else {
                // Create new entry if student didn't have email before
                await EmailRegistry.create({
                    email: normalizedEmail,
                    role: "student",
                    schoolId: schoolId,
                    userId: studentId,
                    status: currentStudent.status || "active",
                });
            }

            updateData.email = normalizedEmail;
        }

        // If status is being updated, update EmailRegistry too
        if (updateData.status && currentStudent.email) {
            await EmailRegistry.findOneAndUpdate(
                { email: currentStudent.email.toLowerCase() },
                { status: updateData.status }
            );
        }

        const oldParentId = currentStudent.parentId;
        const newParentId = updateData.parentId;

        const updatedStudent = await Student.findOneAndUpdate(
            { studentId },
            updateData,
            {
                new: true,
                runValidators: true,
            }
        ).select("-password");

        // Handle bidirectional parent-student relationship update
        if (newParentId !== undefined && oldParentId !== newParentId) {
            const Parent = getParentModel(schoolDbName);

            // Remove from old parent's studentIds
            if (oldParentId) {
                await Parent.findOneAndUpdate(
                    { parentId: oldParentId },
                    { $pull: { studentIds: studentId } }
                );
            }

            // Add to new parent's studentIds
            if (newParentId) {
                await Parent.findOneAndUpdate(
                    { parentId: newParentId },
                    { $addToSet: { studentIds: studentId } }
                );
            }
        }

        return res.status(200).json({
            success: true,
            message: "Student updated successfully",
            data: updatedStudent,
        });
    } catch (error) {
        console.error("Error updating student:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating student",
            error: error.message,
        });
    }
};

// Delete student by studentId (soft delete - set status to inactive)
const deleteStudentById = async (req, res) => {
    try {
        const { schoolId, id: studentId } = req.params;

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const Student = getStudentModel(schoolDbName);

        const student = await Student.findOne({ studentId });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }

        const deletedStudent = await Student.findOneAndUpdate(
            { studentId },
            { status: "inactive" },
            { new: true }
        ).select("-password");

        // Update EmailRegistry status if student has email
        if (student.email) {
            await EmailRegistry.findOneAndUpdate(
                { email: student.email.toLowerCase() },
                { status: "inactive" }
            );
        }

        return res.status(200).json({
            success: true,
            message: "Student deleted successfully (soft delete)",
            data: deletedStudent,
        });
    } catch (error) {
        console.error("Error deleting student:", error);
        return res.status(500).json({
            success: false,
            message: "Error deleting student",
            error: error.message,
        });
    }
};

// Search students for autocomplete (partial matching)
const searchStudents = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { query } = req.query;

        if (!query || query.length < 2) {
            return res.status(200).json({
                success: true,
                data: [],
                message: "Query too short",
            });
        }

        const schoolDbName = await getSchoolDbName(schoolId);
        if (!schoolDbName) {
            return res.status(404).json({
                success: false,
                message: "School not found",
            });
        }

        const Student = getStudentModel(schoolDbName);

        // Search by studentId, email, firstName, lastName with partial matching
        const searchRegex = new RegExp(query, "i");

        const students = await Student.find({
            $or: [
                { studentId: searchRegex },
                { email: searchRegex },
                { firstName: searchRegex },
                { lastName: searchRegex },
            ],
            status: "active",
        })
            .select("studentId firstName lastName email class section")
            .limit(10);

        return res.status(200).json({
            success: true,
            data: students,
            count: students.length,
        });
    } catch (error) {
        console.error("Error searching students:", error);
        return res.status(500).json({
            success: false,
            message: "Error searching students",
            error: error.message,
        });
    }
};

module.exports = {
    createStudent,
    getStudentById,
    getAllStudents,
    updateStudentById,
    deleteStudentById,
    searchStudents,
};

