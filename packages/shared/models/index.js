// Central export for all shared models
module.exports = {
    SchoolModel: require('./schools.model'),
    TeacherSchema: require('./teacher.model'),
    StudentSchema: require('./student.model'),
    ParentSchema: require('./parent.model'),
    AdminModel: require('./admin.model'),
    UserModel: require('./users.model'),
    MenuModel: require('./menu.model'),
    EmailRegistryModel: require('./EmailRegistry.model'),
    AttendanceCheckinSchema: require('./attendance-checkin.model'),
    AttendancePeriodSchema: require('./attendance-period.model'),
    AttendanceSimpleSchema: require('./attendance-simple.model'),
    ClassSchema: require('./class.model'),
    LeaveRequestSchema: require('./leave-request.model'),
    RequestSchema: require('./request.model'),
    SubjectSchema: require('./subject.model'),
    TeacherAttendanceSchema: require('./teacher-attendance.model'),
};
