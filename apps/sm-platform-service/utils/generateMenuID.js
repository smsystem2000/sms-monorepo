
const { MenuModel: menuModel } = require("@sms/shared");

// Generate sequential menuId values like M00001
const generateMenuId = async () => {
    const lastMenu = await menuModel.findOne().sort({ menuId: -1 });

    if (!lastMenu || !lastMenu.menuId) {
        return "M00001";
    }

    const lastIdNumber = parseInt(lastMenu.menuId.replace("M", ""), 10);
    const newIdNumber = lastIdNumber + 1;

    return `M${String(newIdNumber).padStart(5, "0")}`;
};

module.exports = generateMenuId; // ✅ correct
