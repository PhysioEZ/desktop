const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const authenticate = require('../../middleware/auth');

// Apply auth middleware to all report routes
router.use(authenticate);

// Utility to safely extract branch_id
const getBranchId = (req) => req.user?.branch_id || req.query.branch_id;

// GET /api/reception/reports/tests
router.get('/tests', async (req, res) => {
    try {
        const branchId = getBranchId(req);
        if (!branchId) return res.status(400).json({ success: false, message: 'Branch ID required' });

        const filters = req.query;
        let whereClauses = ['t.branch_id = ?'];
        let params = [branchId];

        if (filters.start_date) {
            whereClauses.push('DATE(t.created_at) >= ?');
            params.push(filters.start_date);
        }
        if (filters.end_date) {
            whereClauses.push('DATE(t.created_at) <= ?');
            params.push(filters.end_date);
        }
        if (filters.test_name) {
            whereClauses.push('t.test_name = ?');
            params.push(filters.test_name);
        }
        if (filters.referralSource) {
            whereClauses.push('t.referred_by = ?');
            params.push(filters.referralSource);
        }
        if (filters.reffered_by) {
            whereClauses.push('t.referred_by = ?');
            params.push(filters.reffered_by);
        }
        if (filters.payment_status) {
            whereClauses.push('t.payment_status = ?');
            params.push(filters.payment_status);
        }
        if (filters.status) {
            whereClauses.push('t.test_status = ?');
            params.push(filters.status);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const dataSql = `
            SELECT 
                t.test_id, t.created_at, t.patient_name, t.age, t.gender,
                t.phone_number, t.test_name, t.total_amount, t.advance_amount,
                t.due_amount, t.payment_status, t.test_status, t.referred_by
            FROM tests t
            ${whereSql}
            ORDER BY t.created_at DESC
        `;

        const totalsSql = `
            SELECT 
                SUM(t.total_amount) as total_revenue,
                SUM(t.advance_amount) as total_collected,
                SUM(t.due_amount) as total_outstanding
            FROM tests t
            ${whereSql}
        `;

        const [data] = await pool.query(dataSql, params);
        const [totalsRows] = await pool.query(totalsSql, params);

        res.json({
            success: true,
            tests: data,
            totals: totalsRows[0] || { total_revenue: 0, total_collected: 0, total_outstanding: 0 }
        });
    } catch (error) {
        console.error("Test Reports Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/reception/reports/registrations
router.get('/registrations', async (req, res) => {
    try {
        const branchId = getBranchId(req);
        if (!branchId) return res.status(400).json({ success: false, message: 'Branch ID required' });

        const filters = req.query;
        let whereClauses = ['r.branch_id = ?'];
        let params = [branchId];

        if (filters.start_date) {
            whereClauses.push('DATE(r.created_at) >= ?');
            params.push(filters.start_date);
        }
        if (filters.end_date) {
            whereClauses.push('DATE(r.created_at) <= ?');
            params.push(filters.end_date);
        }
        if (filters.chief_complain) {
            whereClauses.push('r.chief_complain = ?');
            params.push(filters.chief_complain);
        }
        if (filters.consultation_type) {
            whereClauses.push('r.consultation_type = ?');
            params.push(filters.consultation_type);
        }
        if (filters.referralSource) {
            whereClauses.push('r.referralSource = ?');
            params.push(filters.referralSource);
        }
        if (filters.reffered_by) {
            whereClauses.push('r.reffered_by = ?');
            params.push(filters.reffered_by);
        }
        if (filters.status) {
            whereClauses.push('r.status = ?');
            params.push(filters.status);
        }

        const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

        const dataSql = `
            SELECT 
                r.created_at, r.appointment_date, r.patient_name, r.age, r.gender,
                r.chief_complain, r.referralSource, r.reffered_by, r.consultation_type,
                r.consultation_amount, r.payment_method, r.status
            FROM registration r
            ${whereSql}
            ORDER BY r.created_at DESC
        `;

        const totalsSql = `
            SELECT 
                SUM(CASE WHEN r.status = 'consulted' THEN r.consultation_amount ELSE 0 END) as consulted_sum,
                SUM(CASE WHEN r.status = 'pending' THEN r.consultation_amount ELSE 0 END) as pending_sum,
                SUM(CASE WHEN r.status = 'closed' THEN r.consultation_amount ELSE 0 END) as closed_sum
            FROM registration r
            ${whereSql}
        `;

        const [data] = await pool.query(dataSql, params);
        const [totalsRows] = await pool.query(totalsSql, params);

        res.json({
            success: true,
            registrations: data,
            totals: totalsRows[0] || { consulted_sum: 0, pending_sum: 0, closed_sum: 0 }
        });
    } catch (error) {
        console.error("Registrations Report Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/reception/reports/patients
router.get('/patients', async (req, res) => {
    try {
        const branchId = getBranchId(req);
        if (!branchId) return res.status(400).json({ success: false, message: 'Branch ID required' });

        const filters = req.query;
        const startDate = filters.start_date || '1970-01-01';
        const endDate = filters.end_date || new Date().toISOString().split('T')[0];

        // 1. Stats Queries
        const [[{ count: regPeriodCount }]] = await pool.query(
            "SELECT COUNT(*) as count FROM registration WHERE branch_id = ? AND DATE(created_at) BETWEEN ? AND ?",
            [branchId, startDate, endDate]
        );
        const [[{ count: patConvertedCount }]] = await pool.query(
            "SELECT COUNT(*) as count FROM patients WHERE branch_id = ? AND DATE(created_at) BETWEEN ? AND ?",
            [branchId, startDate, endDate]
        );
        const [statusRows] = await pool.query(
            "SELECT status, COUNT(*) as cnt FROM patients WHERE branch_id = ? GROUP BY status",
            [branchId]
        );

        const statusCounts = {};
        let totalPatientsGlobal = 0;
        statusRows.forEach(row => {
            statusCounts[row.status] = row.cnt;
            totalPatientsGlobal += row.cnt;
        });

        const stats = {
            registrations_period: regPeriodCount,
            converted_period: patConvertedCount,
            active: statusCounts['active'] || 0,
            completed: statusCounts['completed'] || 0,
            cancelled: statusCounts['cancelled'] || statusCounts['discontinued'] || 0,
            inactive: statusCounts['inactive'] || 0,
            total_patients_global: totalPatientsGlobal
        };

        // 2. Main Data Query
        let whereClauses = ['p.branch_id = ?'];
        let params = [branchId];

        whereClauses.push(`(
            (DATE(p.created_at) BETWEEN ? AND ?) 
            OR 
            EXISTS (SELECT 1 FROM payments py WHERE py.patient_id = p.patient_id AND py.payment_date BETWEEN ? AND ?)
        )`);
        params.push(startDate, endDate, startDate, endDate);

        if (filters.assigned_doctor) {
            whereClauses.push('p.assigned_doctor = ?');
            params.push(filters.assigned_doctor);
        }
        if (filters.treatment_type) {
            whereClauses.push('p.treatment_type = ?');
            params.push(filters.treatment_type);
        }
        if (filters.status) {
            whereClauses.push('p.status = ?');
            params.push(filters.status);
        }

        const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

        const dataSql = `
            SELECT 
                p.patient_id, pm.patient_uid, r.patient_name, r.gender, r.age, r.consultation_amount,
                p.assigned_doctor, p.treatment_type, p.treatment_days, p.total_amount AS treatment_total_amount,
                p.advance_payment, p.due_amount, p.start_date, p.end_date, p.created_at, p.status,
                (SELECT COALESCE(COUNT(*), 0) FROM attendance WHERE patient_id = p.patient_id AND status = 'present') AS attendance_present_count,
                (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE patient_id = p.patient_id) AS total_paid_all_time,
                (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE patient_id = p.patient_id AND payment_date BETWEEN ? AND ?) AS total_paid_in_range,
                pay.max_payment_date
            FROM patients p
            JOIN registration r ON p.registration_id = r.registration_id
            LEFT JOIN patient_master pm ON r.master_patient_id = pm.master_patient_id
            LEFT JOIN (
                SELECT patient_id, MAX(payment_date) as max_payment_date FROM payments GROUP BY patient_id
            ) pay ON p.patient_id = pay.patient_id
            ${whereSql}
            ORDER BY COALESCE(pay.max_payment_date, p.created_at) DESC
        `;

        const fullParams = [startDate, endDate, ...params];
        const [data] = await pool.query(dataSql, fullParams);

        // Row calculations
        let totalBilledSum = 0;
        let paidInRangeSum = 0;
        let totalDueSum = 0;

        const processedData = data.map(row => {
            const billed = parseFloat(row.consultation_amount || 0) + parseFloat(row.treatment_total_amount || 0);
            const paidAllTime = parseFloat(row.consultation_amount || 0) + parseFloat(row.total_paid_all_time || 0);
            const paidInRange = parseFloat(row.consultation_amount || 0) + parseFloat(row.total_paid_in_range || 0);
            const due = billed - paidAllTime;

            totalBilledSum += billed;
            paidInRangeSum += paidInRange;
            totalDueSum += due;

            return {
                ...row,
                calculated_billed: billed,
                calculated_paid_all_time: paidAllTime,
                calculated_paid_in_period: paidInRange,
                calculated_due: due
            };
        });

        res.json({
            success: true,
            patients: processedData,
            totals: {
                total_sum: totalBilledSum,
                paid_sum: paidInRangeSum,
                due_sum: totalDueSum
            },
            stats
        });
    } catch (error) {
        console.error("Patients Report Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/reception/reports/inquiries
router.get('/inquiries', async (req, res) => {
    try {
        const branchId = getBranchId(req);
        if (!branchId) return res.status(400).json({ success: false, message: 'Branch ID required' });

        const filters = req.query;
        let whereClauses = ['i.branch_id = ?'];
        let params = [branchId];

        if (filters.start_date) {
            whereClauses.push('DATE(i.created_at) >= ?');
            params.push(filters.start_date);
        }
        if (filters.end_date) {
            whereClauses.push('DATE(i.created_at) <= ?');
            params.push(filters.end_date);
        }
        if (filters.referralSource) {
            whereClauses.push('i.referralSource = ?');
            params.push(filters.referralSource);
        }
        if (filters.chief_complain) {
            whereClauses.push('i.chief_complain = ?');
            params.push(filters.chief_complain);
        }
        if (filters.status) {
            whereClauses.push('i.status = ?');
            params.push(filters.status);
        }

        const whereSql = `WHERE ${whereClauses.join(' AND ')}`;
        const dataSql = `
            SELECT i.created_at, i.name, i.age, i.gender, i.referralSource, i.chief_complain, i.phone_number, i.status
            FROM quick_inquiry i
            ${whereSql}
            ORDER BY i.created_at DESC
        `;

        const [data] = await pool.query(dataSql, params);

        let registeredCount = 0;
        let newCount = 0;
        data.forEach(inq => {
            const st = (inq.status || '').toLowerCase();
            if (st === 'registered') registeredCount++;
            else if (st === 'new' || st === 'pending') newCount++;
        });

        res.json({
            success: true,
            inquiries: data,
            totals: {
                total_inquiries: data.length,
                registered_count: registeredCount,
                new_count: newCount
            }
        });
    } catch (error) {
        console.error("Inquiries Report Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/reception/reports/filters/:type
// Returns distinct filter options for the given report type
router.get('/filters/:type', async (req, res) => {
    try {
        const branchId = getBranchId(req);
        if (!branchId) return res.status(400).json({ success: false, message: 'Branch ID required' });

        const { type } = req.params;
        const options = {};

        if (type === 'tests') {
            const queries = {
                tests: "SELECT DISTINCT t.test_name as name FROM tests t WHERE t.branch_id = ? AND t.test_name IS NOT NULL",
                sources: "SELECT DISTINCT referred_by as referralSource FROM tests WHERE branch_id = ? AND referred_by IS NOT NULL AND referred_by != ''",
                reffered_by: "SELECT DISTINCT referred_by as reffered_by FROM tests WHERE branch_id = ? AND referred_by IS NOT NULL AND referred_by != ''",
                statuses: "SELECT DISTINCT test_status as status FROM tests WHERE branch_id = ?",
                payment_statuses: "SELECT DISTINCT payment_status FROM tests WHERE branch_id = ?"
            };
            const [testRows] = await pool.query(queries.tests, [branchId]);
            const [sourceRows] = await pool.query(queries.sources, [branchId]);
            const [refRows] = await pool.query(queries.reffered_by, [branchId]);
            const [statusRows] = await pool.query(queries.statuses, [branchId]);
            const [payStatusRows] = await pool.query(queries.payment_statuses, [branchId]);

            options.tests = testRows.map(r => r.name).filter(Boolean);
            options.sources = sourceRows.map(r => r.referralSource).filter(Boolean);
            options.reffered_by = refRows.map(r => r.reffered_by).filter(Boolean);
            options.statuses = Array.from(new Set([...statusRows.map(r => r.status), 'pending', 'completed', 'cancelled'])).filter(Boolean);
            options.payment_statuses = Array.from(new Set([...payStatusRows.map(r => r.payment_status), 'unpaid', 'paid', 'partially_paid'])).filter(Boolean);
        } else if (type === 'registrations') {
            const queries = {
                complains: "SELECT DISTINCT chief_complain FROM registration WHERE branch_id = ? AND chief_complain IS NOT NULL AND chief_complain != ''",
                sources: "SELECT DISTINCT referralSource FROM registration WHERE branch_id = ? AND referralSource IS NOT NULL AND referralSource != ''",
                consultation_types: "SELECT DISTINCT consultation_type FROM registration WHERE branch_id = ? AND consultation_type IS NOT NULL AND consultation_type != ''",
                reffered_by: "SELECT DISTINCT reffered_by FROM registration WHERE branch_id = ? AND reffered_by IS NOT NULL AND reffered_by != ''",
                statuses: "SELECT DISTINCT status FROM registration WHERE branch_id = ?"
            };
            for (const key of Object.keys(queries)) {
                const [rows] = await pool.query(queries[key], [branchId]);
                options[key] = rows.map(r => Object.values(r)[0]).filter(v => Boolean(v));
            }
            options.statuses = Array.from(new Set([...options.statuses, 'consulted', 'pending', 'closed']));
        } else if (type === 'patients') {
            const queries = {
                doctors: "SELECT DISTINCT assigned_doctor FROM patients WHERE branch_id = ? AND assigned_doctor IS NOT NULL AND assigned_doctor != ''",
                treatment_types: "SELECT DISTINCT treatment_type FROM patients WHERE branch_id = ? AND treatment_type IS NOT NULL AND treatment_type != ''",
                statuses: "SELECT DISTINCT status FROM patients WHERE branch_id = ?"
            };
            for (const key of Object.keys(queries)) {
                const [rows] = await pool.query(queries[key], [branchId]);
                options[key] = rows.map(r => Object.values(r)[0]).filter(v => Boolean(v));
            }
            options.statuses = Array.from(new Set([...options.statuses, 'active', 'completed', 'cancelled', 'inactive']));
        } else if (type === 'inquiries') {
            const queries = {
                sources: "SELECT DISTINCT referralSource FROM quick_inquiry WHERE branch_id = ? AND referralSource IS NOT NULL AND referralSource != ''",
                complains: "SELECT DISTINCT chief_complain FROM quick_inquiry WHERE branch_id = ? AND chief_complain IS NOT NULL AND chief_complain != ''",
                statuses: "SELECT DISTINCT status FROM quick_inquiry WHERE branch_id = ?"
            };
            for (const key of Object.keys(queries)) {
                const [rows] = await pool.query(queries[key], [branchId]);
                options[key] = rows.map(r => Object.values(r)[0]).filter(v => Boolean(v));
            }
            options.statuses = Array.from(new Set([...options.statuses, 'new', 'contacted', 'registered', 'lost']));
        }

        res.json({ success: true, options });
    } catch (error) {
        console.error("Filters Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
