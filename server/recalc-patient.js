const { getLocalDb } = require('./src/config/sqlite');
const { recalculatePatientFinancials } = require('./src/utils/financials');

async function repair() {
    const db = await getLocalDb();
    const connection = {
        query: async (sql, params) => {
            const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
            if (isSelect) {
                const rows = await db.all(sql, params);
                return [rows]; // Wrap rows for destructuring like mysql
            } else {
                const result = await db.run(sql, params);
                return [result];
            }
        }
    };

    // We must use await db.each or db.all because sqlite3 direct methods aren't named .query
    // Wait, recalculatePatientFinancials uses connection.query
    // I will just wrap it.

    try {
        const result = await recalculatePatientFinancials(connection, 1);
        console.log("Result for Patient 1:", result);
    } catch (e) {
        console.error("Recalculation error:", e.message);
    }
    process.exit(0);
}

repair();
