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

// Super Admin Menu Items (Fallback)
export const SuperAdminMenuItems: SideBarMenuItemType[] = [];

// School Admin Menu Items (Fallback)
export const SchoolAdminMenuItems: SideBarMenuItemType[] = [];

// Teachers Menu Items (Fallback)
export const TeachersMenuItems: SideBarMenuItemType[] = [];

// Students Menu Items (Fallback)
export const StudentsMenuItems: SideBarMenuItemType[] = [];

// Parent Menu Items (Fallback)
export const ParentMenuItems: SideBarMenuItemType[] = [];
