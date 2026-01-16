// Common API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  count?: number;
}

// School Types
export interface School {
  schoolId: string;
  schoolName: string;
  schoolLogo?: string;
  schoolDbName: string;
  status: "active" | "inactive";
  schoolAddress?: string;
  schoolEmail?: string;
  schoolContact?: string;
  schoolWebsite?: string;
  location?: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };
  attendanceSettings?: {
    mode: "simple" | "period_wise" | "check_in_out";
    workingHours: {
      start: string;
      end: string;
    };
    lateThresholdMinutes: number;
    halfDayThresholdMinutes: number;
    periodsPerDay: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSchoolPayload {
  schoolName: string;
  schoolLogo?: string;
  dbName: string;
  schoolAddress?: string;
  schoolEmail?: string;
  schoolContact?: string;
  schoolWebsite?: string;
  attendanceSettings?: {
    mode?: "simple" | "period_wise" | "check_in_out";
    workingHours?: {
      start?: string;
      end?: string;
    };
    lateThresholdMinutes?: number;
    halfDayThresholdMinutes?: number;
    periodsPerDay?: number;
  };
}

export interface UpdateSchoolPayload {
  schoolName?: string;
  schoolLogo?: string;
  status?: "active" | "inactive";
  schoolAddress?: string;
  schoolEmail?: string;
  schoolContact?: string;
  schoolWebsite?: string;
  location?: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };
  attendanceSettings?: {
    mode?: "simple" | "period_wise" | "check_in_out";
    workingHours?: {
      start?: string;
      end?: string;
    };
    lateThresholdMinutes?: number;
    halfDayThresholdMinutes?: number;
    periodsPerDay?: number;
  };
}

// Admin Types (Super Admin)
export interface Admin {
  adminId: string;
  username: string;
  email: string;
  role: "super_admin";
  status?: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAdminPayload {
  username: string;
  email: string;
  password: string;
}

// School Admin (sch_admin) Types
export interface SchoolAdmin {
    userId: string;
    username: string;
    firstName?: string;
    lastName?: string;
    email: string;
    role: "sch_admin";
    schoolId: string;
    schoolName?: string;
    phone?: string;
    phoneNumber?: string;
    contactNumber?: string;
    profileImage?: string;
    status: "active" | "inactive";
    createdAt?: string;
    updatedAt?: string;
  userId: string;
  username: string;
  email: string;
  role: "sch_admin";
  schoolId: string;
  contactNumber?: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSchoolAdminPayload {
  username: string;
  email: string;
  password: string;
  schoolId: string;
  contactNumber?: string;
}

export interface UpdateSchoolAdminPayload {
    username?: string;
    email?: string;
    password?: string;
    contactNumber?: string;
    profileImage?: string;
    status?: "active" | "inactive";
  username?: string;
  email?: string;
  password?: string;
  contactNumber?: string;
  status?: "active" | "inactive";
}

// Teacher Types
export interface Teacher {
    teacherId: string;
    schoolId: string;
    schoolName?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    phoneNumber?: string;
    subjects: string[];
    subjectNames?: string[];
    classes: string[];
    classNames?: string[];
    sections?: string[];
    department?: string;
    status: "active" | "inactive";
    profileImage?: string;
    signature?: string;
    createdAt?: string;
    updatedAt?: string;
  teacherId: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subjects: string[];
  classes: string[];
  sections?: string[];
  status: "active" | "inactive";
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTeacherPayload {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    subjects?: string[];
    classes?: string[];
    sections?: string[];
    status?: "active" | "inactive";
    profileImage?: string;
    signature?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  subjects?: string[];
  classes?: string[];
  sections?: string[];
  status?: "active" | "inactive";
  profileImage?: string;
}

export interface UpdateTeacherPayload {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    phone?: string;
    subjects?: string[];
    classes?: string[];
    sections?: string[];
    status?: "active" | "inactive";
    profileImage?: string;
    signature?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  subjects?: string[];
  classes?: string[];
  sections?: string[];
  status?: "active" | "inactive";
  profileImage?: string;
}

// Student Types
export interface Student {
    studentId: string;
    schoolId: string;
    schoolName?: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    phoneNumber?: string;
    class: string;
    className?: string;
    section?: string;
    sectionName?: string;
    rollNumber?: string;
    parentId?: string;
    parentName?: string;
    dateOfBirth?: string;
    gender?: "male" | "female" | "other";
    address?: string;
    status: "active" | "inactive";
    profileImage?: string;
    signature?: string;
    createdAt?: string;
    updatedAt?: string;
  studentId: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  class: string;
  className?: string;
  section?: string;
  sectionName?: string;
  rollNumber?: string;
  parentId?: string;
  parentName?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  address?: string;
  status: "active" | "inactive";
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStudentPayload {
    firstName: string;
    lastName: string;
    email?: string;
    password: string;
    phone?: string;
    class: string;
    section?: string;
    rollNumber?: string;
    parentId?: string;
    dateOfBirth?: string;
    gender?: "male" | "female" | "other";
    address?: string;
    status?: "active" | "inactive";
    profileImage?: string;
    signature?: string;
  firstName: string;
  lastName: string;
  email?: string;
  password: string;
  phone?: string;
  class: string;
  section?: string;
  rollNumber?: string;
  parentId?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  address?: string;
  status?: "active" | "inactive";
  profileImage?: string;
}

export interface UpdateStudentPayload {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    phone?: string;
    class?: string;
    section?: string;
    rollNumber?: string;
    parentId?: string;
    dateOfBirth?: string;
    gender?: "male" | "female" | "other";
    address?: string;
    status?: "active" | "inactive";
    profileImage?: string;
    signature?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  class?: string;
  section?: string;
  rollNumber?: string;
  parentId?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  address?: string;
  status?: "active" | "inactive";
  profileImage?: string;
}

export interface Parent {
    parentId: string;
    schoolId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    studentIds: string[];
    relationship: "father" | "mother" | "guardian" | "other";
    occupation?: string;
    address?: string;
    status: "active" | "inactive";
    profileImage?: string;
    signature?: string;
    createdAt?: string;
    updatedAt?: string;
  parentId: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  studentIds: string[];
  relationship: "father" | "mother" | "guardian" | "other";
  occupation?: string;
  address?: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateParentPayload {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    studentIds?: string[];
    relationship: "father" | "mother" | "guardian" | "other";
    occupation?: string;
    address?: string;
    status?: "active" | "inactive";
    profileImage?: string;
    signature?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  studentIds?: string[];
  relationship: "father" | "mother" | "guardian" | "other";
  occupation?: string;
  address?: string;
  status?: "active" | "inactive";
}

export interface UpdateParentPayload {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    phone?: string;
    studentIds?: string[];
    relationship?: "father" | "mother" | "guardian" | "other";
    occupation?: string;
    address?: string;
    status?: "active" | "inactive";
    profileImage?: string;
    signature?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  studentIds?: string[];
  relationship?: "father" | "mother" | "guardian" | "other";
  occupation?: string;
  address?: string;
  status?: "active" | "inactive";
}

// Query Filter Types
export interface TeacherFilters {
  status?: "active" | "inactive";
}

export interface StudentFilters {
  class?: string;
  section?: string;
  status?: "active" | "inactive";
  parentId?: string;
}

export interface ParentFilters {
  status?: "active" | "inactive";
  relationship?: "father" | "mother" | "guardian" | "other";
}

// Request/Ticket Types
export interface Request {
    requestId: string;
    userType: "teacher" | "student" | "parent" | "sch_admin";
    userId: string;
    userName: string;
    requestType: "email_change" | "phone_change" | "signature_change" | "general";
    oldValue?: string;
    newValue?: string;
    message: string;
    status: "pending" | "approved" | "rejected";
    adminReply?: string;
    attachmentUrl?: string;
    createdAt?: string;
    updatedAt?: string;
  requestId: string;
  userType: "teacher" | "student" | "parent" | "sch_admin";
  userId: string;
  userName: string;
  requestType: "email_change" | "phone_change" | "general";
  oldValue?: string;
  newValue?: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  adminReply?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRequestPayload {
    userType: "teacher" | "student" | "parent" | "sch_admin";
    userId: string;
    userName: string;
    requestType: "email_change" | "phone_change" | "signature_change" | "general";
    oldValue?: string;
    newValue?: string;
    message: string;
    attachmentUrl?: string;
  userType: "teacher" | "student" | "parent" | "sch_admin";
  userId: string;
  userName: string;
  requestType: "email_change" | "phone_change" | "general";
  oldValue?: string;
  newValue?: string;
  message: string;
}

export interface UpdateRequestPayload {
  status: "pending" | "approved" | "rejected";
  adminReply?: string;
}

export interface RequestFilters {
  status?: "pending" | "approved" | "rejected";
  userType?: "teacher" | "student" | "parent" | "sch_admin";
}

// Section Types (nested in Class)
export interface Section {
  sectionId: string;
  name: string;
  classTeacherId?: string;
}

// Class Types
export interface Class {
  classId: string;
  schoolId: string;
  name: string;
  description?: string;
  sections: Section[];
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClassPayload {
  name: string;
  description?: string;
  sections?: { name: string; classTeacherId?: string }[];
}

export interface UpdateClassPayload {
  name?: string;
  description?: string;
  status?: "active" | "inactive";
}

export interface AddSectionPayload {
  name: string;
  classTeacherId?: string;
}

export interface AssignClassTeacherPayload {
  teacherId: string | null;
}

export interface ClassFilters {
  status?: "active" | "inactive";
}

// Subject Types
export interface Subject {
  subjectId: string;
  schoolId: string;
  name: string;
  code: string;
  description?: string;
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSubjectPayload {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateSubjectPayload {
  name?: string;
  code?: string;
  description?: string;
  status?: "active" | "inactive";
}

export interface SubjectFilters {
  status?: "active" | "inactive";
}

// ==========================================
// ATTENDANCE TYPES
// ==========================================

// Attendance Modes
export type AttendanceMode = "simple" | "period_wise" | "check_in_out";

// Attendance Status
export type AttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "half_day"
  | "leave"
  | "pending";

// School Attendance Settings
export interface AttendanceSettings {
  mode: AttendanceMode;
  workingHours: {
    start: string;
    end: string;
  };
  lateThresholdMinutes: number;
  halfDayThresholdMinutes: number;
  periodsPerDay: number;
}

// Simple Daily Attendance
export interface AttendanceSimple {
  attendanceId: string;
  schoolId: string;
  classId: string;
  sectionId?: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  markedBy: string;
  markedByRole: "teacher" | "sch_admin";
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Period-wise Attendance
export interface AttendancePeriod {
  attendanceId: string;
  schoolId: string;
  classId: string;
  sectionId?: string;
  studentId: string;
  date: string;
  period: number;
  subjectId: string;
  teacherId: string;
  status: "present" | "absent" | "late";
  markedBy: string;
  isSubstitute: boolean;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Check-In/Check-Out Attendance
export interface AttendanceCheckin {
  logId: string;
  schoolId: string;
  userId: string;
  userType: "student" | "teacher";
  classId?: string;
  sectionId?: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkInMethod: "manual" | "biometric" | "rfid" | "app";
  checkOutMethod?: "manual" | "biometric" | "rfid" | "app";
  totalMinutes: number;
  status: AttendanceStatus;
  markedBy?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Teacher Attendance
export interface TeacherAttendance {
  attendanceId: string;
  schoolId: string;
  teacherId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: AttendanceStatus;
  leaveType?: "casual" | "sick" | "earned" | "unpaid" | "other";
  totalMinutes: number;
  markedBy: string;
  markedByRole: "teacher" | "sch_admin";
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Payloads for marking attendance
export interface MarkSimpleAttendancePayload {
  classId: string;
  sectionId?: string;
  date?: string;
  attendanceRecords: {
    studentId: string;
    status: AttendanceStatus;
    remarks?: string;
  }[];
}

export interface MarkPeriodAttendancePayload {
  classId: string;
  sectionId?: string;
  date?: string;
  period: number;
  subjectId: string;
  teacherId: string;
  isSubstitute?: boolean;
  attendanceRecords: {
    studentId: string;
    status: "present" | "absent" | "late";
    remarks?: string;
  }[];
}

export interface CheckInPayload {
  userId: string;
  userType: "student" | "teacher";
  classId?: string;
  sectionId?: string;
  method?: "manual" | "biometric" | "rfid" | "app";
}

export interface MarkTeacherAttendancePayload {
  date?: string;
  attendanceRecords: {
    teacherId: string;
    status: AttendanceStatus;
    leaveType?: "casual" | "sick" | "earned" | "unpaid" | "other";
    remarks?: string;
  }[];
}

// Attendance Summary
export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  leave: number;
  percentage?: string;
}

// Report Types
export interface DailyReport {
  date: string;
  mode: AttendanceMode;
  students: {
    attendance: AttendanceSimple[] | AttendancePeriod[] | AttendanceCheckin[];
    summary: AttendanceSummary;
  };
  teachers: {
    attendance: TeacherAttendance[];
    summary: AttendanceSummary;
  };
}

export interface MonthlyReportStudent {
  studentId: string;
  classId: string;
  sectionId?: string;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  leave: number;
  total: number;
  percentage: string;
}

export interface MonthlyReportTeacher {
  teacherId: string;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  leave: number;
  total: number;
  percentage: string;
}

export interface MonthlyReport {
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  students?: {
    byStudent: MonthlyReportStudent[];
    totalRecords: number;
    workingDays: number;
  };
  teachers?: {
    byTeacher: MonthlyReportTeacher[];
    totalRecords: number;
    workingDays: number;
  };
}

export interface ClassWiseReport {
  classId: string;
  sectionId?: string;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  leave: number;
  total: number;
  percentage: string;
}

// ==========================================
// Leave Management Types
// ==========================================
export type LeaveType = "casual" | "sick" | "emergency" | "personal" | "other";
export type LeaveStatus = "pending" | "approved" | "rejected";
export type ApplicantType = "student" | "teacher";

export interface LeaveRequest {
  leaveId: string;
  schoolId: string;
  applicantId: string;
  applicantType: ApplicantType;
  applicantName?: string;
  classId?: string;
  sectionId?: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  processedBy?: string;
  processedByName?: string;
  processedAt?: string;
  approvalRemarks?: string;
  numberOfDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApplyLeavePayload {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  classId?: string;
  sectionId?: string;
}

export interface ProcessLeavePayload {
  action: "approve" | "reject";
  remarks?: string;
}

export interface LeaveSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  students?: number;
  teachers?: number;
}

// ==========================================
// Menu Types
// ==========================================
export interface Menu {
  _id?: string;
  menuId: string;
  schoolId?: string;
  menuName: string;
  menuUrl: string;
  menuOrder: number;
  menuIcon: string;
  menuAccessRoles: string | string[];
  menuType: "main" | "sub";
  hasSubmenu: boolean;
  parentId?: string;
  submenus?: Menu[];
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMenuPayload {
  schoolId?: string;
  menuName: string;
  menuUrl: string;
  menuIcon: string;
  menuAccessRoles: string | string[];
  menuType: string;
  hasSubmenu: boolean;
  parentId?: string;
  menuOrder: number;
  status: "active" | "inactive";
}

export interface UpdateMenuPayload {
  menuName?: string;
  menuUrl?: string;
  menuIcon?: string;
  menuAccessRoles?: string;
  menuType?: string;
  hasSubmenu?: boolean;
  parentId?: string;
}
