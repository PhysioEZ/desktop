const BridgeService = require('../services/BridgeService');

/**
 * TRANSPARENT BRIDGE PROXY
 * This module redirects all "Remote" SQL queries through the PHP Bridge via HTTP.
 * This allows the Node.js application to maintain ALL its original logic while
 * bypassing the firewall blocks on port 3306.
 */
const pool = {
    query: async (sql, params = []) => {
        try {
            const response = await BridgeService.rawQuery(sql, params);
            const data = response.data;

            // Handle SELECT vs INSERT/UPDATE return formats
            if (Array.isArray(data)) {
                return [data, []];
            } else {
                return [data, []]; // Result info (affectedRows, etc)
            }
        } catch (error) {
            console.error("Bridge Proxy Query Error:", error.message);
            throw error;
        }
    },
    execute: async (sql, params = []) => {
        return pool.query(sql, params);
    },
    getConnection: async () => {
        return {
            query: (sql, params) => pool.query(sql, params),
            beginTransaction: async () => { },
            commit: async () => { },
            rollback: async () => { },
            release: () => { }
        };
    }
};

module.exports = pool;
