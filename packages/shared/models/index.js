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
    // Timetable Management
    TimetableConfigSchema: require('./timetable-config.model'),
    TimetableEntrySchema: require('./timetable-entry.model'),
    SubstituteAssignmentSchema: require('./substitute-assignment.model'),
    RoomSchema: require('./room.model'),
    PeriodSwapSchema: require('./period-swap.model'),

    // Exam Management
    ExamTermSchema: require('./exam-term.model'),
    ExamTypeSchema: require('./exam-type.model'),
    GradingSystemSchema: require('./grading-system.model'),
    ExamSchema: require('./exam.model'),
    ExamScheduleSchema: require('./exam-schedule.model'),
    ExamResultSchema: require('./exam-result.model'),
    StudentExamRegistrationSchema: require('./student-exam-registration.model'),

    // Announcements & Notifications
    AnnouncementSchema: require('./announcement.model'),
    NotificationSchema: require('./notification.model'),
    EmailTemplateSchema: require('./EmailTemplate'),

    // Homework
    HomeworkSchema: require('./homework.model'),
};
