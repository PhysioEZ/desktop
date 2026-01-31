const pool = require('../config/db');

async function checkStats(branchId, date, label) {
    console.log(`\n--- checking for ${label} (${date}) ---`);

    try {
        // Test Revenue (based on visit_date)
        const [revRows] = await pool.query(
            "SELECT SUM(advance_amount) as total FROM tests WHERE branch_id = ? AND DATE(visit_date) = ? AND test_status != 'cancelled'",
            [branchId, date]
        );
        console.log(`Test Revenue (by visit_date): ${parseFloat(revRows[0].total || 0)}`);

        // Test Dues (based on created_at)
        const [dueRows] = await pool.query(
            "SELECT SUM(due_amount) as total FROM tests WHERE branch_id = ? AND DATE(created_at) = ?",
            [branchId, date]
        );
        console.log(`Test Dues (by created_at): ${parseFloat(dueRows[0].total || 0)}`);

        // Count tests
        const [countRows] = await pool.query(
            "SELECT COUNT(*) as total FROM tests WHERE branch_id = ? AND DATE(created_at) = ?",
            [branchId, date]
        );
        console.log(`Count Tests (by created_at): ${countRows[0].total}`);
    } catch (err) {
        console.error("Error checking stats:", err);
    }
}

async function main() {
    const branchId = 1;
    const today = new Date().toISOString().split('T')[0];

    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    console.log(`Current server time: ${new Date().toISOString()}`);
    console.log(`Date used for 'Today': ${today}`);
    console.log(`Date used for 'Yesterday': ${yesterday}`);

    await checkStats(branchId, today, "TODAY");
    await checkStats(branchId, yesterday, "YESTERDAY");

    process.exit(0);
}

main();
