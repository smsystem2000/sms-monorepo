import React from "react";
import { MuiIcons } from "../../utils/Icons";

export interface SideBarMenuItemType {
  name: string;
  icon: React.ReactNode;
  path?: string;
  isExpandable?: boolean;
  subItems?: SideBarMenuItemType[];
}

// Dynamic Icon Component for rendering Iconify icons
export const DynamicIcon = ({ icon }: { icon: string }) => {
  if (!icon) return null;
  return (
    <span
      className="dynamic-icon"
      style={{
        width: "1.5rem",
        height: "1.5rem",
        display: "inline-block",
        backgroundColor: "currentColor",
        mask: `url(https://api.iconify.design/${icon}.svg) no-repeat center / contain`,
        WebkitMask: `url(https://api.iconify.design/${icon}.svg) no-repeat center / contain`,
        flexShrink: 0,
      }}
      aria-hidden="true"
    />
  );
};

// Helper to transform API menu data to Sidebar format
export const transformMenuData = (
  menus: any[],
  role?: string,
): SideBarMenuItemType[] => {
  if (!menus || !Array.isArray(menus)) return [];

  const getBasePath = (userRole?: string) => {
    switch (userRole) {
      case "super_admin":
        return "/super-admin";
      case "sch_admin":
        return "/school-admin";
      case "teacher":
        return "/teacher";
      case "student":
        return "/student";
      case "parent":
        return "/parent";
      default:
        return "";
    }
  };

  const basePath = getBasePath(role);

  // Group menus: Main menus are those with type "main" OR no parentMenuId OR parentMenuId of "0"
  const mainMenus = menus.filter(
    (m) =>
      (m.menuType && m.menuType.trim() === "main") ||
      !m.parentMenuId ||
      m.parentMenuId === "0" ||
      m.parentMenuId === "",
  );

  // Sub menus are everything else (those with a parentMenuId)
  const subMenus = menus.filter(
    (m) =>
      m.menuType &&
      m.menuType.trim() === "sub" &&
      m.parentMenuId &&
      m.parentMenuId !== "0" &&
      m.parentMenuId !== "",
  );

  return mainMenus
    .sort((a, b) => (a.menuOrder || 0) - (b.menuOrder || 0))
    .map((menu: any) => {
      // Find children where parentMenuId matches this menu's menuId OR internal mongo _id
      const children = subMenus
        .filter(
          (sub) =>
            sub.parentMenuId === menu.menuId ||
            (menu._id && sub.parentMenuId === menu._id.toString()),
        )
        .sort((a, b) => (a.menuOrder || 0) - (b.menuOrder || 0));

      const hasChildren = children.length > 0;

      return {
        name: menu.menuName,
        icon: menu.menuIcon ? (
          <DynamicIcon icon={menu.menuIcon} />
        ) : (
          <MuiIcons.Dashboard />
        ),
        // If it has children, it shouldn't have a direct path so it can expand
        path: hasChildren
          ? undefined
          : `${basePath}${menu.menuUrl.startsWith("/") ? "" : "/"}${menu.menuUrl}`,
        isExpandable: hasChildren,
        subItems: hasChildren
          ? children.map((sub: any) => ({
              name: sub.menuName,
              icon: sub.menuIcon ? (
                <DynamicIcon icon={sub.menuIcon} />
              ) : (
                <MuiIcons.Circle sx={{ fontSize: "6px", color: "white" }} />
              ),
              path: `${basePath}${sub.menuUrl.startsWith("/") ? "" : "/"}${
                sub.menuUrl
              }`,
            }))
          : undefined,
      };
    });
};

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
  {
    name: "Menus",
    icon: <MuiIcons.ListAlt />,
    path: "/super-admin/menus",
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
    path: "/school-admin/leaverequest",
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
    name: "Exam Management",
    icon: <MuiIcons.Assessment />,
    isExpandable: true,
    subItems: [
      {
        name: "Configuration",
        icon: <MuiIcons.Settings />,
        path: "/school-admin/exam/config",
      },
      {
        name: "Exam Scheduler",
        icon: <MuiIcons.Event />,
        path: "/school-admin/exam/scheduler",
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
  {
    name: "Announcements",
    icon: <MuiIcons.Announcement />,
    path: "/school-admin/announcements",
    isExpandable: false,
  },
  {
    name: "Email Templates",
    icon: <MuiIcons.MailOutline />,
    path: "/school-admin/email-templates",
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
    name: "Exam",
    icon: <MuiIcons.Assessment />,
    isExpandable: true,
    subItems: [
      {
        name: "Marks Entry",
        icon: <MuiIcons.Create />,
        path: "/teacher/exam/marks",
      },
    ],
  },
  {
    name: "Profile",
    icon: <MuiIcons.AccountCircle />,
    path: "/teacher/profile",
    isExpandable: false,
  },
  {
    name: "Announcements",
    icon: <MuiIcons.Announcement />,
    path: "/teacher/announcements",
    isExpandable: false,
  },
  {
    name: "Homework",
    icon: <MuiIcons.Assignment />,
    path: "/teacher/homework",
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
    name: "My Exams",
    icon: <MuiIcons.Assignment />,
    path: "/student/exam/my-exams",
    isExpandable: false,
  },
  {
    name: "Profile",
    icon: <MuiIcons.AccountCircle />,
    path: "/student/profile",
    isExpandable: false,
  },
  {
    name: "Announcements",
    icon: <MuiIcons.Announcement />,
    path: "/student/announcements",
    isExpandable: false,
  },
  {
    name: "Homework",
    icon: <MuiIcons.Assignment />,
    path: "/student/homework",
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
  {
    name: "Attendance",
    icon: <MuiIcons.CheckCircle />,
    path: "/parent/attendance",
    isExpandable: false,
  },
  {
    name: "Announcements",
    icon: <MuiIcons.Announcement />,
    path: "/parent/announcements",
    isExpandable: false,
  },
  {
    name: "Homework",
    icon: <MuiIcons.Assignment />,
    path: "/parent/homework",
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
        path: "/parent/leave/apply",
      },
      {
        name: "Leave History",
        icon: <MuiIcons.EventNote />,
        path: "/parent/leave/history",
      },
    ],
  },
  {
    name: "Exam",
    icon: <MuiIcons.Assessment />,
    isExpandable: true,
    subItems: [
      {
        name: "Schedule",
        icon: <MuiIcons.Event />,
        path: "/parent/exam/schedule",
      },
      {
        name: "Results",
        icon: <MuiIcons.Assessment />,
        path: "/parent/exam/results",
      },
    ],
  },
  {
    name: "Notifications",
    icon: <MuiIcons.Notifications />,
    path: "/parent/notifications",
    isExpandable: false,
  },
  {
    name: "Profile",
    icon: <MuiIcons.AccountCircle />,
    path: "/parent/profile",
    isExpandable: false,
  },
];
];
