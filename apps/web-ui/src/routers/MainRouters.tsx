import { Route, Routes } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import NotFoundPage from "../pages/NotFoundPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import ProtectedRoute from "./RouterProtect";

// Super Admin Pages
import SuperAdminDashboard from "../pages/SuperAdmin/Dashboard";
import Schools from "../pages/SuperAdmin/Schools";
import Users from "../pages/SuperAdmin/Users";

// School Admin Pages
import SchoolAdminDashboard from "../pages/SchoolAdmin/Dashboard";
import School from "../pages/SchoolAdmin/School";
import Teachers from "../pages/SchoolAdmin/Teachers";
import SchoolAdminStudents from "../pages/SchoolAdmin/Students";
import Parents from "../pages/SchoolAdmin/Parents";
import SchoolAdminProfile from "../pages/SchoolAdmin/Profile";
import Requests from "../pages/SchoolAdmin/Requests";
import SchoolAdminClasses from "../pages/SchoolAdmin/Classes";
import SchoolAdminSubjects from "../pages/SchoolAdmin/Subjects";
import SchoolAdminAttendance from "../pages/SchoolAdmin/Attendance";
import SchoolAdminLeaveRequests from "../pages/SchoolAdmin/Leave/Requests";
import SchoolLocation from "../pages/SchoolAdmin/SchoolLocation";
import { TimetableConfig, TimetableMaster, ConflictManagement, SubstituteManagement } from "../pages/SchoolAdmin/Timetable";
import SchoolAdminAnnouncements from "../pages/SchoolAdmin/Announcements";
import CreateAnnouncementAdmin from "../pages/SchoolAdmin/Announcements/CreateAnnouncement";

// Teacher Pages
import TeacherDashboard from "../pages/Teacher/Dashboard";
import TeacherClasses from "../pages/Teacher/Classes";
import TeacherStudents from "../pages/Teacher/Students";
import TeacherParents from "../pages/Teacher/Parents";
import TeacherAttendance from "../pages/Teacher/Attendance";
import TeacherProfile from "../pages/Teacher/Profile";
import TeacherMyRequests from "../pages/Teacher/MyRequests";
import TeacherHomework from "../pages/Teacher/Homework";
import CreateHomework from "../pages/Teacher/Homework/CreateHomework";

// Student Pages
import StudentDashboard from "../pages/Student/Dashboard";
import StudentClasses from "../pages/Student/Classes";
import StudentAttendance from "../pages/Student/Attendance";
import StudentAttendanceHistory from "../pages/Student/Attendance/History";
import StudentResults from "../pages/Student/Results";
import StudentProfile from "../pages/Student/Profile";
import StudentMyRequests from "../pages/Student/MyRequests";
import StudentApplyLeave from "../pages/Student/Leave/ApplyLeave";
import StudentMyLeaves from "../pages/Student/Leave/MyLeaves";
import StudentHomework from "../pages/Student/Homework";

// Teacher Leave Pages
import TeacherApplyLeave from "../pages/Teacher/Leave/ApplyLeave";
import TeacherMyLeaves from "../pages/Teacher/Leave/MyLeaves";
import TeacherStudentLeaves from "../pages/Teacher/Leave/StudentLeaves";
import { MyTimetable as TeacherTimetable } from "../pages/Teacher/Timetable";

// Parent Pages
import ParentDashboard from "../pages/Parent/Dashboard";
import ParentChildren from "../pages/Parent/Children";
import ChildProfile from "../pages/Parent/Children/Profile";
import ParentAnnouncements from "../pages/Parent/Announcements";
import ParentHomework from "../pages/Parent/Homework";
import ParentAttendance from "../pages/Parent/Attendance";
import ParentTeachers from "../pages/Parent/Teachers";
import ParentTimetable from "../pages/Parent/Timetable";
import ParentApplyLeave from "../pages/Parent/Leave/ApplyLeave";
import ParentLeaveHistory from "../pages/Parent/Leave/History";
import ParentExamSchedule from "../pages/Parent/Exam/Schedule";
import ParentExamResults from "../pages/Parent/Exam/Results";

// Shared Pages
import NotificationsPage from "../pages/Shared/Notifications";

// Student Timetable
import { MyTimetable as StudentTimetable } from "../pages/Student/Timetable";
import Menus from "../pages/SuperAdmin/Menus";

// Exam Management Pages
import ExamConfiguration from "../pages/SchoolAdmin/Exam/ExamConfiguration";
import ExamScheduler from "../pages/SchoolAdmin/Exam/ExamScheduler";
import MarksEntry from "../pages/Teacher/Exam/MarksEntry";
import MyExams from "../pages/Student/Exam/MyExams";

const MainRouters = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Super Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
        <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/super-admin/schools" element={<Schools />} />
        <Route path="/super-admin/users" element={<Users />} />
        <Route path="/super-admin/menus" element={<Menus />} />
      </Route>

      {/* School Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={["sch_admin"]} />}>
        <Route path="/school-admin/dashboard" element={<SchoolAdminDashboard />} />
        <Route path="/school-admin/school" element={<School />} />
        <Route path="/school-admin/classes" element={<SchoolAdminClasses />} />
        <Route path="/school-admin/subjects" element={<SchoolAdminSubjects />} />
        <Route path="/school-admin/teachers" element={<Teachers />} />
        <Route path="/school-admin/students" element={<SchoolAdminStudents />} />
        <Route path="/school-admin/parents" element={<Parents />} />
        <Route path="/school-admin/requests" element={<Requests />} />
        <Route path="/school-admin/attendance" element={<SchoolAdminAttendance />} />
        <Route path="/school-admin/leave" element={<SchoolAdminLeaveRequests />} />
        <Route path="/school-admin/timetable/config" element={<TimetableConfig />} />
        <Route path="/school-admin/timetable/master" element={<TimetableMaster />} />
        <Route path="/school-admin/timetable/conflicts" element={<ConflictManagement />} />
        <Route path="/school-admin/timetable/substitutes" element={<SubstituteManagement />} />

        {/* Exam Management Routes (Admin) */}
        <Route path="/school-admin/exam/config" element={<ExamConfiguration />} />
        <Route path="/school-admin/exam/scheduler" element={<ExamScheduler />} />

        {/* Announcements Routes (Admin) */}
        <Route path="/school-admin/announcements" element={<SchoolAdminAnnouncements />} />
        <Route path="/school-admin/announcements/create" element={<CreateAnnouncementAdmin />} />

        {/* Notifications */}
        <Route path="/school-admin/notifications" element={<NotificationsPage />} />

        <Route path="/school-admin/location" element={<SchoolLocation />} />
        <Route path="/school-admin/profile" element={<SchoolAdminProfile />} />
      </Route>

      {/* Teacher Routes */}
      <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/classes" element={<TeacherClasses />} />
        <Route path="/teacher/students" element={<TeacherStudents />} />
        <Route path="/teacher/parents" element={<TeacherParents />} />
        <Route path="/teacher/attendance" element={<TeacherAttendance />} />
        <Route path="/teacher/my-requests" element={<TeacherMyRequests />} />
        <Route path="/teacher/leave/apply" element={<TeacherApplyLeave />} />
        <Route path="/teacher/leave/my" element={<TeacherMyLeaves />} />
        <Route path="/teacher/leave/students" element={<TeacherStudentLeaves />} />
        <Route path="/teacher/timetable" element={<TeacherTimetable />} />
        <Route path="/teacher/exam/marks" element={<MarksEntry />} />

        {/* Homework Routes (Teacher) */}
        <Route path="/teacher/homework" element={<TeacherHomework />} />
        <Route path="/teacher/homework/create" element={<CreateHomework />} />

        {/* Announcements Routes (Teacher) */}
        <Route path="/teacher/announcements" element={<SchoolAdminAnnouncements />} />
        <Route path="/teacher/announcements/create" element={<CreateAnnouncementAdmin />} />

        {/* Notifications */}
        <Route path="/teacher/notifications" element={<NotificationsPage />} />

        <Route path="/teacher/profile" element={<TeacherProfile />} />
      </Route>

      {/* Student Routes */}
      <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/classes" element={<StudentClasses />} />
        <Route path="/student/attendance" element={<StudentAttendance />} />
        <Route path="/student/attendance/history" element={<StudentAttendanceHistory />} />
        <Route path="/student/results" element={<StudentResults />} />
        <Route path="/student/my-requests" element={<StudentMyRequests />} />
        <Route path="/student/leave/apply" element={<StudentApplyLeave />} />
        <Route path="/student/leave/my" element={<StudentMyLeaves />} />
        <Route path="/student/timetable" element={<StudentTimetable />} />
        <Route path="/student/exam/my-exams" element={<MyExams />} />
        <Route path="/student/homework" element={<StudentHomework />} />
        <Route path="/student/notifications" element={<NotificationsPage />} />
        <Route path="/student/profile" element={<StudentProfile />} />
      </Route>

      {/* Parent Routes */}
      <Route element={<ProtectedRoute allowedRoles={["parent"]} />}>
        <Route path="/parent/dashboard" element={<ParentDashboard />} />
        <Route path="/parent/children" element={<ParentChildren />} />
        <Route path="/parent/children/:studentId" element={<ChildProfile />} />
        <Route path="/parent/announcements" element={<ParentAnnouncements />} />
        <Route path="/parent/homework" element={<ParentHomework />} />
        <Route path="/parent/attendance" element={<ParentAttendance />} />
        <Route path="/parent/teachers" element={<ParentTeachers />} />
        <Route path="/parent/timetable" element={<ParentTimetable />} />
        <Route path="/parent/leave/apply" element={<ParentApplyLeave />} />
        <Route path="/parent/leave/history" element={<ParentLeaveHistory />} />
        <Route path="/parent/exam/schedule" element={<ParentExamSchedule />} />
        <Route path="/parent/exam/results" element={<ParentExamResults />} />
        <Route path="/parent/notifications" element={<NotificationsPage />} />
      </Route>

      {/* 404 Not Found - Catch All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default MainRouters;
