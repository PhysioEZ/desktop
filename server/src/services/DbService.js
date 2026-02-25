const sqlite = require('../config/sqlite');

class DbService {
    /**
     * Executes a query against the local SQLite cache.
     * Mimics mysql2's pool.query return format [rows, fields]
     */
    static async query(sql, params = []) {
        // Convert MySQL syntax to SQLite syntax roughly if needed
        // Most simple queries (SELECT, INSERT, UPDATE) are compatible.
        // We replace '?' with indexed parameters for better-sqlite3 if necessary,
        // but better-sqlite3 handles '?' fine.

        const trimmedSql = sql.trim().toLowerCase();

        try {
            if (trimmedSql.startsWith('select')) {
                const stmt = sqlite.prepare(sql);
                const rows = stmt.all(...params);
                return [rows, []];
            } else {
                const stmt = sqlite.prepare(sql);
                const info = stmt.run(...params);
                // Return format similar to mysql2 result
                return [{
                    insertId: info.lastInsertRowid,
                    affectedRows: info.changes
                }, []];
            }
        } catch (error) {
            console.error("Local DB Query Error:", error.message, "| SQL:", sql);
            throw error;
        }
    }

    /**
     * Specialized helper for Dashboard stats
     */
    static async getDashboardStats(branchId) {
        // Example of a local high-speed aggregation
        const stats = sqlite.prepare(`
            SELECT 
                COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as new_today,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
                COUNT(*) as total_count
            FROM patients 
            WHERE branch_id = ?
        `).get(branchId);

        return stats;
    }
}

module.exports = DbService;
