


require("dotenv").config();

const User = require("../../models/User");

const getAppearanceSettings = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId).select("appearanceSettings");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const appearanceSettings = user.appearanceSettings || {
            theme: "system",
            sidebarPosition: "left",
        };

        return res.status(200).json({ success: true, appearanceSettings });
    } catch (error) {
        return res
            .status(500)
            .json({ success: false, message: "Error while fetching appearance settings" });
    }
};

const updateAppearanceSettings = async (req, res) => {
    try {
        const userId = req.userId;
        const { theme, sidebarPosition } = req.body;

        if (!theme && !sidebarPosition) {
            return res.status(400).json({ success: false, message: "No settings to update" });
        }

        const validThemes = ["light", "dark", "system"];
        const validPositions = ["left", "right"];

        if (theme && !validThemes.includes(theme)) {
            return res.status(400).json({ success: false, message: "Invalid theme value" });
        }

        if (sidebarPosition && !validPositions.includes(sidebarPosition)) {
            return res.status(400).json({ success: false, message: "Invalid sidebar position value" });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (theme) {
            user.appearanceSettings.theme = theme;
        }

        if (sidebarPosition) {
            user.appearanceSettings.sidebarPosition = sidebarPosition;
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Appearance settings updated successfully",
            appearanceSettings: user.appearanceSettings,
        });
    } catch (error) {
        return res
            .status(500)
            .json({ success: false, message: "Error while updating appearance settings" });
    }
};

module.exports = {
    getAppearanceSettings,
    updateAppearanceSettings,
};
