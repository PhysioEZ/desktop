const pool = require('../../config/db');

exports.getSystemStatus = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT setting_key, setting_value FROM system_settings");

        const settings = {};
        rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });

        res.json({
            status: "success",
            data: {
                maintenance_mode: settings.maintenance_mode === '1',
                maintenance_message: settings.maintenance_message || "System under maintenance",
                current_app_version: settings.current_app_version || "1.0.0",
                download_url: settings.download_url || "https://prospine.in/download",
                force_logout: settings.force_logout === '1'
            }
        });
    } catch (error) {
        console.error("System Status Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};
