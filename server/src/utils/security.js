const crypto = require('crypto');
const pool = require('../config/db');

/**
 * Generate a new API token for a user
 * @param {number} employeeId
 * @param {string|null} userAgent
 * @param {string|null} ipAddress
 * @returns {Promise<string>}
 */
async function generateApiToken(employeeId, userAgent, ipAddress) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiryHours = 24;
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    // Format for MySQL DATETIME
    const expiresAtFormatted = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

    try {
        await pool.query(`
            INSERT INTO api_tokens (employee_id, token, expires_at, user_agent, ip_address)
            VALUES (?, ?, ?, ?, ?)
        `, [employeeId, token, expiresAtFormatted, userAgent, ipAddress]);

        return token;
    } catch (error) {
        console.error('Failed to generate API token:', error);
        throw error;
    }
}

module.exports = {
    generateApiToken
};
