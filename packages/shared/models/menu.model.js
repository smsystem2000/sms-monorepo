const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
    {
        menuId: {
            type: String,
            required: true,
            unique: true,
        },
        menuName: {
            type: String,
            required: true,
        },
        menuUrl: {
            type: String,
            required: true,
        },
        menuOrder: {
            type: Number,
            required: true,
        },
        menuType: {
            type: String,
            enum: ["main", "side"],    
            required: true,
        },
        parentMenuId: {
            type: String,
            default: null,
        },
        menuAccessRoles: {
            type: [String],
            required: true,
        }, 
        logo: {
            type: String,
            default: null,
        },
        schoolId: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Menu", menuSchema);
