const pool = require('../../config/db');
const path = require('path');
const fs = require('fs');

function isGlobalSupportUser(role) {
    return ['admin', 'developer', 'superadmin', 'owner'].includes(String(role || '').toLowerCase());
}

exports.handleSupportRequest = async (req, res) => {
    const action = req.body.action || 'fetch';
    const userBranchId = Number(req.user.branch_id || 0);

    try {
        if (action === 'fetch') {
            await fetchTickets(req, res, userBranchId);
        } else if (action === 'submit') {
            if (!userBranchId) return res.status(400).json({ status: 'error', message: 'Branch ID required' });
            await submitTicket(req, res, userBranchId);
        } else if (action === 'get_status') {
            await getSystemStatus(req, res);
        } else if (action === 'details') {
            if (!userBranchId) return res.status(400).json({ status: 'error', message: 'Branch ID required' });
            await getTicketDetails(req, res, userBranchId);
        } else if (action === 'respond') {
            await respondToTicket(req, res);
        } else if (action === 'get_branches') {
            await getBranches(req, res);
        } else {
            res.status(400).json({ status: 'error', message: 'Invalid action' });
        }
    } catch (error) {
        console.error("Support Controller Error:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

async function fetchTickets(req, res, branchId) {
    const isGlobalAdmin = isGlobalSupportUser(req.user.role);
    const scope = (req.body.scope || '').toLowerCase() === 'global' ? 'global' : 'branch';
    const requestedBranchId = Number(req.body.branch_id || 0);
    const effectiveBranchId = isGlobalAdmin
        ? (requestedBranchId || branchId)
        : branchId;

    let query = `
        SELECT i.issue_id, i.subject, i.description, i.priority, i.category, i.status, i.created_at, b.branch_name
        FROM system_issues i
        LEFT JOIN branches b ON i.branch_id = b.branch_id
    `;
    let params = [];

    if (!isGlobalAdmin || scope !== 'global') {
        query += " WHERE i.branch_id = ?";
        params.push(effectiveBranchId);
    }

    query += " ORDER BY i.created_at DESC";

    const [tickets] = await pool.query(query, params);

    let statsQuery = `
        SELECT 
            COUNT(*) as total,
            COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending,
            COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as resolved
        FROM system_issues
    `;
    let statsParams = [];

    if (!isGlobalAdmin || scope !== 'global') {
        statsQuery += " WHERE branch_id = ?";
        statsParams.push(effectiveBranchId);
    }

    const [stats] = await pool.query(statsQuery, statsParams);

    res.json({
        status: 'success',
        data: {
            tickets,
            stats: stats[0],
            active_scope: (!isGlobalAdmin || scope !== 'global') ? 'branch' : 'global',
            active_branch_id: (!isGlobalAdmin || scope !== 'global') ? effectiveBranchId : null
        }
    });
}

async function submitTicket(req, res, branchId) {
    const { subject, description, priority, category, metadata } = req.body;
    const employeeId = req.user.employee_id;
    const role = String(req.user.role || '').toLowerCase();
    const metadataObj = typeof metadata === 'string'
        ? (() => {
            try { return JSON.parse(metadata); } catch { return {}; }
        })()
        : (metadata || {});
    const mergedMetadata = {
        ...metadataObj,
        branch_id: branchId,
        user_role: role,
        app_version: metadataObj.app_version || 'desktop-web',
        browser_engine: metadataObj.browser_engine || req.headers['user-agent'] || null
    };

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [result] = await connection.query(`
            INSERT INTO system_issues 
            (branch_id, reported_by, subject, description, priority, category, system_metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [branchId, employeeId, subject, description, priority || 'medium', category || 'general', JSON.stringify(mergedMetadata)]);

        const issueId = result.insertId;

        // Handle Multiple Attachments
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const filePath = 'uploads/support/' + file.filename;
                await connection.query(`
                    INSERT INTO issue_attachments (issue_id, file_path)
                    VALUES (?, ?)
                `, [issueId, filePath]);
            }
        }

        await connection.commit();
        res.json({
            status: 'success',
            message: 'Ticket submitted successfully',
            issue_id: issueId
        });
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function getSystemStatus(req, res) {
    const [services] = await pool.query(`
        SELECT service_name, service_slug, current_status, last_updated
        FROM system_services
        ORDER BY service_name ASC
    `);
    res.json({ status: 'success', data: services });
}

async function getTicketDetails(req, res, branchId) {
    const { issue_id } = req.body;
    const isGlobalAdmin = isGlobalSupportUser(req.user.role);

    let query = `
        SELECT i.*, CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) as reported_by_name, b.branch_name
        FROM system_issues i
        LEFT JOIN employees e ON i.reported_by = e.employee_id
        LEFT JOIN branches b ON i.branch_id = b.branch_id
        WHERE i.issue_id = ?
    `;
    let params = [issue_id];

    if (!isGlobalAdmin) {
        query += " AND i.branch_id = ?";
        params.push(branchId);
    }

    const [issue] = await pool.query(query, params);

    if (issue.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Ticket not found' });
    }

    const [attachments] = await pool.query(`
        SELECT file_path FROM issue_attachments WHERE issue_id = ?
    `, [issue_id]);

    res.json({
        status: 'success',
        data: {
            ...issue[0],
            attachments: attachments.map(a => a.file_path)
        }
    });
}

async function respondToTicket(req, res) {
    const { issue_id, status, response } = req.body;
    const isGlobalAdmin = isGlobalSupportUser(req.user.role);

    if (!isGlobalAdmin) {
        return res.status(403).json({ status: 'error', message: 'Permission denied' });
    }

    await pool.query(`
        UPDATE system_issues 
        SET status = ?, admin_response = ?
        WHERE issue_id = ?
    `, [status || 'Responded', response, issue_id]);

    res.json({ status: 'success', message: 'Response saved successfully' });
}

async function getBranches(req, res) {
    const isGlobalAdmin = isGlobalSupportUser(req.user.role);
    if (!isGlobalAdmin) {
        return res.status(403).json({ status: 'error', message: 'Permission denied' });
    }
    const [branches] = await pool.query("SELECT branch_id, branch_name FROM branches ORDER BY branch_name ASC");
    res.json({ status: 'success', data: branches });
}
