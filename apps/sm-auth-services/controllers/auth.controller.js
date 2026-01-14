const jwt = require("jsonwebtoken");
const { AdminModel: Admin, SchoolModel: School, EmailRegistryModel: EmailRegistry } = require("@sms/shared");
const { getSchoolDbConnection } = require("../configs/db");

// Schema imports for school database queries
const { TeacherSchema: teacherSchema, StudentSchema: studentSchema, ParentSchema: parentSchema, ClassSchema: classSchema, SubjectSchema: subjectSchema } = require("@sms/shared");

/**
 * Unified Login - Single login for all user types
 * User only provides email + password
 * System auto-detects role via EmailRegistry
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Step 1: Lookup email in EmailRegistry for fast role/school detection
        const emailEntry = await EmailRegistry.findOne({
            email: normalizedEmail,
            status: "active"
        });

        if (!emailEntry) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const { role, schoolId, userId } = emailEntry;

        let user;
        let tokenPayload;

        // Step 2: Authenticate based on role
        if (role === "super_admin") {
            // Super Admin - stored in Admin collection
            user = await Admin.findOne({ email: normalizedEmail });

            // Allow if status is active or undefined (legacy support)
            if (!user || (user.status && user.status !== "active")) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            if (password !== user.password) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            tokenPayload = {
                adminId: user.adminId,
                email: user.email,
                username: user.username,
                role: user.role,
            };

        } else if (role === "sch_admin") {
            // School Admin - stored in Users collection (SuperAdmin DB)
            const { UserModel: User } = require("@sms/shared");
            user = await User.findOne({ email: normalizedEmail });

            if (!user || user.status !== "active") {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            // Verify school is active
            const school = await School.findOne({ schoolId: user.schoolId });
            if (!school || school.status !== "active") {
                return res.status(403).json({
                    success: false,
                    message: "Your school is currently inactive",
                });
            }

            if (password !== user.password) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            tokenPayload = {
                userId: user.userId,
                email: user.email,
                role: user.role,
                schoolId: user.schoolId,
                schoolDbName: school.schoolDbName,
                schoolName: school.schoolName,
            };

        } else {
            // Teacher, Student, Parent - stored in school-specific database
            const school = await School.findOne({ schoolId });

            if (!school || school.status !== "active") {
                return res.status(403).json({
                    success: false,
                    message: "Your school is currently inactive",
                });
            }

            const schoolDb = getSchoolDbConnection(school.schoolDbName);
            let Model;
            let idField;

            switch (role) {
                case "teacher":
                    Model = schoolDb.model("Teacher", teacherSchema);
                    idField = "teacherId";
                    break;
                case "student":
                    Model = schoolDb.model("Student", studentSchema);
                    idField = "studentId";
                    break;
                case "parent":
                    Model = schoolDb.model("Parent", parentSchema);
                    idField = "parentId";
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        message: "Invalid user role",
                    });
            }

            user = await Model.findOne({ email: normalizedEmail });

            if (!user || user.status !== "active") {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            if (password !== user.password) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            // Build role-specific token payload
            tokenPayload = {
                userId: user[idField],
                email: user.email,
                role: role,
                schoolId: schoolId,
                schoolDbName: school.schoolDbName,
                schoolName: school.schoolName,
                firstName: user.firstName,
                lastName: user.lastName,
            };

            // Add role-specific fields
            if (role === "teacher") {
                tokenPayload.teacherId = user.teacherId;
                tokenPayload.classes = user.classes || [];
                tokenPayload.subjects = user.subjects || [];
                tokenPayload.department = user.department;

                // Fetch subject names
                try {
                    const Subject = schoolDb.model("Subject", subjectSchema);
                    const subjectDocs = await Subject.find({ subjectId: { $in: user.subjects || [] } }).lean();
                    tokenPayload.subjectNames = subjectDocs.map(s => s.name);
                } catch (e) {
                    tokenPayload.subjectNames = [];
                }
            } else if (role === "student") {
                tokenPayload.studentId = user.studentId;
                tokenPayload.class = user.class;
                tokenPayload.section = user.section;
                tokenPayload.rollNumber = user.rollNumber;

                // Fetch class and section names
                try {
                    const Class = schoolDb.model("Class", classSchema);
                    const classDoc = await Class.findOne({ classId: user.class }).lean();
                    if (classDoc) {
                        tokenPayload.className = classDoc.name;
                        const sectionDoc = classDoc.sections?.find(s => s.sectionId === user.section || s._id?.toString() === user.section);
                        tokenPayload.sectionName = sectionDoc?.name || user.section;
                    }
                } catch (e) {
                    // Fallback to IDs if lookup fails
                }
            } else if (role === "parent") {
                tokenPayload.parentId = user.parentId;
                tokenPayload.studentIds = user.studentIds || [];
            }
        }

        // Step 3: Generate JWT token
        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                token,
                user: {
                    ...tokenPayload,
                    firstName: user.firstName,
                    lastName: user.lastName,
                },
            },
        });

    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({
            success: false,
            message: "Error during login",
            error: error.message,
        });
    }
};

// Verify Token (optional - for checking token validity)
const verifyToken = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "No token provided",
            });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        return res.status(200).json({
            success: true,
            message: "Token is valid",
            data: {
                userId: decoded.userId || decoded.adminId,
                email: decoded.email,
                role: decoded.role,
                schoolId: decoded.schoolId,
            },
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};

// Helper function to generate adminId
const generateAdminId = async () => {
    const lastAdmin = await Admin.findOne().sort({ adminId: -1 });

    if (!lastAdmin || !lastAdmin.adminId) {
        return "ADM00001";
    }

    const lastIdNumber = parseInt(lastAdmin.adminId.replace("ADM", ""), 10);
    const newIdNumber = lastIdNumber + 1;

    return `ADM${String(newIdNumber).padStart(5, "0")}`;
};

// Create Super Admin (initial setup or by existing super_admin)
const createAdmin = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Username, email, and password are required",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if email already exists in EmailRegistry
        const existingEmail = await EmailRegistry.findOne({ email: normalizedEmail });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: "Email already exists",
            });
        }

        // Check if username already exists
        const existingAdmin = await Admin.findOne({ username });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: "Username already exists",
            });
        }

        // Generate adminId
        const adminId = await generateAdminId();

        // Create admin
        const newAdmin = new Admin({
            adminId,
            username,
            email: normalizedEmail,
            password,
            role: "super_admin",
            status: "active",
        });

        const savedAdmin = await newAdmin.save();

        // Register in EmailRegistry for unified login
        await EmailRegistry.create({
            email: normalizedEmail,
            role: "super_admin",
            schoolId: null,
            userId: adminId,
            status: "active",
        });

        return res.status(201).json({
            success: true,
            message: "Super Admin created successfully",
            data: {
                adminId: savedAdmin.adminId,
                username: savedAdmin.username,
                email: savedAdmin.email,
                role: savedAdmin.role,
            },
        });
    } catch (error) {
        console.error("Error creating admin:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating admin",
            error: error.message,
        });
    }
};

module.exports = {
    login,
    verifyToken,
    createAdmin,
};
