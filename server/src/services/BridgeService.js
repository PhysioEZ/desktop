const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const BRIDGE_URL = process.env.BRIDGE_URL;

class BridgeService {
    /**
     * Internal helper for making authenticated requests to the PHP bridge
     */
    static async _request(path, params = {}, method = 'GET', data = null, userToken = null) {
        if (!BRIDGE_URL) {
            throw new Error('BRIDGE_URL not configured in .env');
        }

        const url = `${BRIDGE_URL}/${path}`;

        // We send token in both header AND params for maximum compatibility 
        // with shared hosting environments that might strip headers
        const headers = userToken ? {
            'Authorization': `Bearer ${userToken}`
        } : {};

        const paramsWithToken = userToken ? { ...params, token: userToken } : params;

        try {
            const response = await axios({
                url,
                method,
                params: paramsWithToken,
                data,
                headers,
                timeout: 15000 // 15 seconds timeout
            });

            if (response.data && response.data.success) {
                return response.data;
            } else {
                throw new Error(response.data?.message || 'Bridge request failed');
            }
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            console.error(`Bridge Service Error [${path}]:`, msg);
            throw new Error(msg);
        }
    }

    /**
     * Read data from the remote MySQL via PHP Bridge
     */
    static async read(table, id = null, options = {}, userToken) {
        const params = {
            table,
            id,
            limit: options.limit || 500,
            offset: options.offset || 0,
            pk: options.pk || 'id'
        };
        if (options.branch_id) params.branch_id = options.branch_id;
        if (options.since) params.since = options.since;
        if (options.order_by) params.order_by = options.order_by;

        return this._request('read.php', params, 'GET', null, userToken);
    }

    /**
     * Write data to the remote MySQL via PHP Bridge (Insert or Update)
     */
    static async write(table, action, data, pkInfo = {}, userToken) {
        const payload = {
            table,
            action, // 'insert' or 'update'
            data,
            pk: pkInfo.pk || 'id',
            pk_val: pkInfo.pk_val
        };

        return this._request('write.php', {}, 'POST', payload, userToken);
    }

    /**
     * Batch process multiple writes in a single transaction
     */
    static async batch(operations, userToken) {
        const payload = { operations };
        return this._request('batch.php', {}, 'POST', payload, userToken);
    }

    /**
     * Get recent changes from remote (Delta Sync)
     */
    static async getChanges(since, userToken) {
        return this._request('sync.php', { since }, 'GET', null, userToken);
    }

    /**
     * Verify token and get user details (Used for Auth)
     */
    static async getMe(userToken) {
        return this._request('read.php', { table: 'employees', token_me: 1 }, 'GET', null, userToken);
    }

    /**
     * Execute Raw SQL on remote MySQL via PHP Bridge (Proxy Mode)
     */
    static async rawQuery(sql, params = []) {
        // Use the System Security Token for pool-level queries
        const systemToken = process.env.BRIDGE_SECURITY_TOKEN;
        return this._request('query.php', {}, 'POST', { sql, params }, systemToken);
    }
}

module.exports = BridgeService;
