const {
  SchoolModel: School,
  UserModel: User,
  MenuModel: Menu,
  AdminModel: adminModel,
} = require("@sms/shared");
const generateMenuId = require("../utils/generateMenuID");

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    // Get total schools count
    const totalSchools = await School.countDocuments();

    // Get total users (school admins) count
    const totalUsers = await User.countDocuments();

    // Get active schools count
    const activeSchools = await School.countDocuments({ status: "active" });

    // Get active users count
    const activeUsers = await User.countDocuments({ status: "active" });

    res.status(200).json({
      success: true,
      data: {
        totalSchools,
        totalUsers,
        activeSchools,
        activeUsers,
      },
    });
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get dashboard stats",
      error: error.message,
    });
  }
};

const getMenus = async (req, res) => {
  try {
    const { role } = req.params;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required to fetch menus",
      });
    }

    const user = await adminModel.findOne({ role });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Match menus either by role or explicit username in the access list
    const accessTokens = [user.role].filter(Boolean);

    const menus = await Menu.find(
      {
        menuAccessRoles: { $in: accessTokens },
      },
      { menuAccessRoles: 0 },
    ).sort({ menuOrder: 1 });

    return res.status(200).json({
      success: true,
      message: "Menus fetched successfully",
      data: menus,
      count: menus.length,
    });
  } catch (error) {
    console.error("Error fetching menus:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch menus",
      error: error.message,
    });
  }
};

// Create menu
const createMenu = async (req, res) => {
  try {
    const {
      menuName,
      menuUrl,
      menuOrder,
      menuType,
      parentMenuId,
      menuAccessRoles,
      menuIcon,
      schoolId,
      status,
    } = req.body;

    // Normalize menuAccessRoles to array if it is a string
    let roles = menuAccessRoles;
    if (typeof roles === "string") {
      roles = [roles];
    }

    if (
      !menuName ||
      !menuUrl ||
      menuOrder === undefined ||
      !menuType ||
      !Array.isArray(roles) ||
      roles.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "menuName, menuUrl, menuOrder, menuType, and menuAccessRoles are required",
      });
    }

    const effectiveParentMenuId = parentMenuId || req.body.parentId || null;

    if (menuType === "sub" && !effectiveParentMenuId) {
      return res.status(400).json({
        success: false,
        message: "parentMenuId is required for submenus",
      });
    }

    const existingMenu = await Menu.findOne({
      menuName,
      schoolId: schoolId || null,
      parentMenuId: effectiveParentMenuId,
    });

    if (existingMenu) {
      return res.status(400).json({
        success: false,
        message: `Menu with name "${menuName}" already exists for this ${
          effectiveParentMenuId ? "parent menu" : "school"
        }`,
      });
    }

    const menuId = await generateMenuId();

    const newMenu = new Menu({
      menuId,
      menuName,
      menuUrl,
      menuOrder,
      menuType,

      parentMenuId: effectiveParentMenuId,
      menuAccessRoles: roles,
      menuIcon: menuIcon || null,
      schoolId: schoolId || null,
      status: status || "active",
    });

    const savedMenu = await newMenu.save();

    return res.status(201).json({
      success: true,
      message: "Menu created successfully",
      data: savedMenu,
    });
  } catch (error) {
    console.error("Error creating menu:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create menu",
      error: error.message,
    });
  }
};

// Update menu by menuId
const updateMenu = async (req, res) => {
  try {
    const { menuId } = req.params;
    const updateData = { ...req.body };

    // Prevent menuId overwrite
    delete updateData.menuId;

    // Normalize menuAccessRoles to array if it is a string
    if (
      updateData.menuAccessRoles &&
      typeof updateData.menuAccessRoles === "string"
    ) {
      updateData.menuAccessRoles = [updateData.menuAccessRoles];
    }

    if (
      updateData.menuAccessRoles &&
      (!Array.isArray(updateData.menuAccessRoles) ||
        updateData.menuAccessRoles.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "menuAccessRoles must be a non-empty array when provided",
      });
    }

    const effectiveParentMenuId =
      updateData.parentMenuId !== undefined
        ? updateData.parentMenuId
        : updateData.parentId !== undefined
          ? updateData.parentId
          : undefined;

    // Check for duplicate menu name in the same school and parent during update
    if (
      updateData.menuName ||
      updateData.schoolId !== undefined ||
      effectiveParentMenuId !== undefined ||
      updateData.menuType !== undefined
    ) {
      const currentMenu = await Menu.findOne({ menuId });
      if (!currentMenu) {
        return res.status(404).json({
          success: false,
          message: "Menu not found",
        });
      }

      const checkName = updateData.menuName || currentMenu.menuName;
      const checkSchoolId =
        updateData.schoolId !== undefined
          ? updateData.schoolId
          : currentMenu.schoolId;
      const checkParentMenuId =
        effectiveParentMenuId !== undefined
          ? effectiveParentMenuId
          : currentMenu.parentMenuId;
      const checkMenuType = updateData.menuType || currentMenu.menuType;

      if (checkMenuType === "sub" && !checkParentMenuId) {
        return res.status(400).json({
          success: false,
          message: "parentMenuId is required for submenus",
        });
      }

      const existingMenu = await Menu.findOne({
        menuName: checkName,
        schoolId: checkSchoolId || null,
        parentMenuId: checkParentMenuId || null,
        menuId: { $ne: menuId },
      });

      if (existingMenu) {
        return res.status(400).json({
          success: false,
          message: `Menu with name "${checkName}" already exists for this ${
            checkParentMenuId ? "parent menu" : "school"
          }`,
        });
      }
    }

    // Ensure we save it as parentMenuId in the DB
    if (
      updateData.parentId !== undefined &&
      updateData.parentMenuId === undefined
    ) {
      updateData.parentMenuId = updateData.parentId;
      delete updateData.parentId;
    }

    const updatedMenu = await Menu.findOneAndUpdate({ menuId }, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedMenu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Menu updated successfully",
      data: updatedMenu,
    });
  } catch (error) {
    console.error("Error updating menu:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update menu",
      error: error.message,
    });
  }
};

// Delete menu by menuId
const deleteMenu = async (req, res) => {
  try {
    const { menuId } = req.params;

    const deletedMenu = await Menu.findOneAndDelete({ menuId });

    if (!deletedMenu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Menu deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting menu:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete menu",
      error: error.message,
    });
  }
};

// Get all menus (for Super Admin management)
const getAllMenus = async (req, res) => {
  try {
    const menus = await Menu.find().sort({ menuOrder: 1 });

    return res.status(200).json({
      success: true,
      message: "All menus fetched successfully",
      data: menus,
      count: menus.length,
    });
  } catch (error) {
    console.error("Error fetching all menus:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch all menus",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getMenus,
  getAllMenus,
  createMenu,
  updateMenu,
  deleteMenu,
};
