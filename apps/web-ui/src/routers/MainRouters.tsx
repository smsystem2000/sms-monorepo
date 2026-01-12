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
import { TimetableConfig, TimetableMaster } from "../pages/SchoolAdmin/Timetable";

// Teacher Pages
import TeacherDashboard from "../pages/Teacher/Dashboard";
import TeacherClasses from "../pages/Teacher/Classes";
import TeacherStudents from "../pages/Teacher/Students";
import TeacherParents from "../pages/Teacher/Parents";
import TeacherAttendance from "../pages/Teacher/Attendance";
import TeacherProfile from "../pages/Teacher/Profile";
import TeacherMyRequests from "../pages/Teacher/MyRequests";

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

// Teacher Leave Pages (reuse Student structure with minor changes)
import TeacherApplyLeave from "../pages/Teacher/Leave/ApplyLeave";
import TeacherMyLeaves from "../pages/Teacher/Leave/MyLeaves";
import TeacherStudentLeaves from "../pages/Teacher/Leave/StudentLeaves";
import { MyTimetable as TeacherTimetable } from "../pages/Teacher/Timetable";

// Parent Pages
import ParentDashboard from "../pages/Parent/Dashboard";

// Student Timetable
import { MyTimetable as StudentTimetable } from "../pages/Student/Timetable";

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
        <Route path="/student/profile" element={<StudentProfile />} />
      </Route>

      {/* Parent Routes */}
      <Route element={<ProtectedRoute allowedRoles={["parent"]} />}>
        <Route path="/parent/dashboard" element={<ParentDashboard />} />
      </Route>

      {/* 404 Not Found - Catch All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default MainRouters;


