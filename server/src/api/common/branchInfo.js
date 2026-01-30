const pool = require('../../config/db');

exports.getBranchInfo = async (req, res) => {
    const branchId = req.query.branch_id || (req.user ? req.user.branch_id : null);

    if (!branchId) {
        return res.status(400).json({ status: "error", message: "Branch ID required" });
    }

    try {
        const [rows] = await pool.query("SELECT branch_name, logo_primary_path FROM branches WHERE branch_id = ? LIMIT 1", [branchId]);
        const branch = rows[0];

        if (branch) {
            let logo = branch.logo_primary_path;
            // Support legacy relative paths
            logo = logo.replace('../', '/admin/');
            if (!logo.startsWith('/admin/') && !logo.startsWith('http')) {
                logo = '/admin/' + logo;
            }

            res.json({
                status: "success",
                data: {
                    name: branch.branch_name,
                    logo: logo
                }
            });
        } else {
            res.json({ status: "error", message: "Branch not found" });
        }
    } catch (error) {
        console.error("Branch Info Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};
