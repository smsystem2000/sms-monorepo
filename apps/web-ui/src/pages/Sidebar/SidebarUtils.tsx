import {
  MuiIcons,
} from "../../utils/Icons";

export interface SideBarMenuItemType {
  name: string;
  icon: React.ReactNode;
  path?: string;
  isExpandable?: boolean;
  subItems?: SideBarMenuItemType[];
}

// Super Admin Menu Items
export const SuperAdminMenuItems: SideBarMenuItemType[] = [
  {
    name: "Dashboard",
    icon: <MuiIcons.Dashboard />,
    path: "/super-admin/dashboard",
    isExpandable: false,
  },
  {
    name: "Schools",
    icon: <MuiIcons.AccountBalance />,
    path: "/super-admin/schools",
    isExpandable: false,
  },
  {
    name: "Users",
    icon: <MuiIcons.People />,
    path: "/super-admin/users",
    isExpandable: false,
  },
];

// School Admin Menu Items
export const SchoolAdminMenuItems: SideBarMenuItemType[] = [
  {
    name: "Dashboard",
    icon: <MuiIcons.Dashboard />,
    path: "/school-admin/dashboard",
    isExpandable: false,
  },
  {
    name: "School",
    icon: <MuiIcons.AccountBalance />,
    path: "/school-admin/school",
    isExpandable: false,
  },
  {
    name: "Classes",
    icon: <MuiIcons.Class />,
    path: "/school-admin/classes",
    isExpandable: false,
  },
  {
    name: "Subjects",
    icon: <MuiIcons.MenuBook />,
    path: "/school-admin/subjects",
    isExpandable: false,
  },
  {
    name: "Users",
    icon: <MuiIcons.People />,
    isExpandable: true,
    subItems: [
      {
        name: "Teachers",
        icon: <MuiIcons.Person />,
        path: "/school-admin/teachers",
      },
      {
        name: "Students",
        icon: <MuiIcons.Group />,
        path: "/school-admin/students",
      },
      {
        name: "Parents",
        icon: <MuiIcons.People />,
        path: "/school-admin/parents",
      },
    ],
  },
  {
    name: "Requests",
    icon: <MuiIcons.Assignment />,
    path: "/school-admin/requests",
    isExpandable: false,
  },
  {
    name: "Attendance",
    icon: <MuiIcons.CheckCircle />,
    path: "/school-admin/attendance",
    isExpandable: false,
  },
  {
    name: "Leave Requests",
    icon: <MuiIcons.EventNote />,
    path: "/school-admin/leave",
    isExpandable: false,
  },
  {
    name: "Timetable",
    icon: <MuiIcons.Schedule />,
    isExpandable: true,
    subItems: [
      {
        name: "Configuration",
        icon: <MuiIcons.Settings />,
        path: "/school-admin/timetable/config",
      },
      {
        name: "Master Timetable",
        icon: <MuiIcons.TableChart />,
        path: "/school-admin/timetable/master",
      },
      {
        name: "Conflicts",
        icon: <MuiIcons.Warning />,
        path: "/school-admin/timetable/conflicts",
      },
      {
        name: "Substitutes",
        icon: <MuiIcons.SwapHoriz />,
        path: "/school-admin/timetable/substitutes",
      },
    ],
  },
  {
    name: "School Location",
    icon: <MuiIcons.LocationOn />,
    path: "/school-admin/location",
    isExpandable: false,
  },
  {
    name: "Profile",
    icon: <MuiIcons.AccountCircle />,
    path: "/school-admin/profile",
    isExpandable: false,
  },
];

// Teachers Menu Items
export const TeachersMenuItems: SideBarMenuItemType[] = [
  {
    name: "Dashboard",
    icon: <MuiIcons.Dashboard />,
    path: "/teacher/dashboard",
    isExpandable: false,
  },
  {
    name: "Classes",
    icon: <MuiIcons.Book />,
    path: "/teacher/classes",
    isExpandable: false,
  },
  {
    name: "Students",
    icon: <MuiIcons.Group />,
    path: "/teacher/students",
    isExpandable: false,
  },
  {
    name: "Parents",
    icon: <MuiIcons.People />,
    path: "/teacher/parents",
    isExpandable: false,
  },
  {
    name: "Attendance",
    icon: <MuiIcons.CheckCircle />,
    path: "/teacher/attendance",
    isExpandable: false,
  },
  {
    name: "My Requests",
    icon: <MuiIcons.Assignment />,
    path: "/teacher/my-requests",
    isExpandable: false,
  },
  {
    name: "Leave",
    icon: <MuiIcons.EventNote />,
    isExpandable: true,
    subItems: [
      {
        name: "Apply Leave",
        icon: <MuiIcons.AddCircle />,
        path: "/teacher/leave/apply",
      },
      {
        name: "My Leaves",
        icon: <MuiIcons.EventNote />,
        path: "/teacher/leave/my",
      },
      {
        name: "Student Leaves",
        icon: <MuiIcons.Group />,
        path: "/teacher/leave/students",
      },
    ],
  },
  {
    name: "My Timetable",
    icon: <MuiIcons.Schedule />,
    path: "/teacher/timetable",
    isExpandable: false,
  },
  {
    name: "Profile",
    icon: <MuiIcons.AccountCircle />,
    path: "/teacher/profile",
    isExpandable: false,
  },
];

// Students Menu Items
export const StudentsMenuItems: SideBarMenuItemType[] = [
  {
    name: "Dashboard",
    icon: <MuiIcons.Dashboard />,
    path: "/student/dashboard",
    isExpandable: false,
  },
  {
    name: "Classes",
    icon: <MuiIcons.Book />,
    path: "/student/classes",
    isExpandable: false,
  },
  {
    name: "Attendance",
    icon: <MuiIcons.CheckCircle />,
    path: "/student/attendance",
    isExpandable: false,
  },
  {
    name: "Results",
    icon: <MuiIcons.Assessment />,
    path: "/student/results",
    isExpandable: false,
  },
  {
    name: "My Requests",
    icon: <MuiIcons.Assignment />,
    path: "/student/my-requests",
    isExpandable: false,
  },
  {
    name: "Leave",
    icon: <MuiIcons.EventNote />,
    isExpandable: true,
    subItems: [
      {
        name: "Apply Leave",
        icon: <MuiIcons.AddCircle />,
        path: "/student/leave/apply",
      },
      {
        name: "My Leaves",
        icon: <MuiIcons.EventNote />,
        path: "/student/leave/my",
      },
    ],
  },
  {
    name: "My Timetable",
    icon: <MuiIcons.Schedule />,
    path: "/student/timetable",
    isExpandable: false,
  },
  {
    name: "Profile",
    icon: <MuiIcons.AccountCircle />,
    path: "/student/profile",
    isExpandable: false,
  },
];

// Parent Menu Items
export const ParentMenuItems: SideBarMenuItemType[] = [
  {
    name: "Dashboard",
    icon: <MuiIcons.Dashboard />,
    path: "/parent/dashboard",
    isExpandable: false,
  },
];

