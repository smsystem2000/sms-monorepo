const { AdminModel: adminModel, MenuModel: menuModel, UserModel: usersModel } = require("@sms/shared");


const getMenus = async (req, res) => {
    try {
        const { schoolId, role } = req.params;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: "School ID is required",
            });
        }

        if (!role) {
            return res.status(400).json({
                success: false,
                message: "Role is required to fetch menus",
            });
        }

        const user = await usersModel.findOne({ role });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const accessTokens = [user.role].filter(Boolean);

        const menus = await menuModel.find({
            menuAccessRoles: { $in: accessTokens },
            schoolId: schoolId
        }, { menuAccessRoles: 0 }).sort({ menuOrder: 1 });

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
}

module.exports = {
    getMenus,
}