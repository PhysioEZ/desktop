const pool = require('../../config/db');
const path = require('path');
const fs = require('fs');

exports.handleExpensesRequest = async (req, res) => {
    const action = req.body.action || 'fetch';
    const branchId = req.user.branch_id || req.body.branch_id;

    if (!branchId) {
        return res.status(400).json({ status: 'error', message: 'Branch ID required' });
    }

    try {
        if (action === 'fetch') {
            await fetchExpenses(req, res, branchId);
        } else if (action === 'add') {
            await addExpense(req, res, branchId);
        } else if (action === 'update_bill') {
            await updateExpenseBill(req, res, branchId);
        } else {
            res.status(400).json({ status: 'error', message: 'Invalid action' });
        }
    } catch (error) {
        console.error("Expenses Controller Error:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

async function fetchExpenses(req, res, branchId) {
    const { start_date, end_date, page = 1, limit = 10, search = '' } = req.body;
    const offset = (page - 1) * limit;

    const startDate = start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endDate = end_date || new Date().toISOString().split('T')[0];

    const connection = await pool.getConnection();
    try {
        let sql = `
            FROM expenses e
            LEFT JOIN employees emp ON e.user_id = emp.employee_id
            LEFT JOIN roles r ON emp.role_id = r.role_id
            WHERE e.branch_id = ? AND r.role_name = 'reception'
              AND e.expense_date BETWEEN ? AND ?
        `;
        const params = [branchId, startDate, endDate];

        if (search) {
            sql += ` AND (e.voucher_no LIKE ? OR e.paid_to LIKE ? OR e.description LIKE ?)`;
            const s = `%${search}%`;
            params.push(s, s, s);
        }

        // 1. Fetch Expenses
        const [expenses] = await connection.query(`
            SELECT e.*, 
                   CONCAT(emp.first_name, ' ', emp.last_name) as creator_username
            ${sql}
            ORDER BY e.expense_date DESC, e.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), parseInt(offset)]);

        // 2. Fetch Total Count for Pagination
        const [totalRows] = await connection.query(`
            SELECT COUNT(*) as count
            ${sql}
        `, params);
        const totalCount = totalRows[0].count;
        const totalPages = Math.ceil(totalCount / limit);

        // 3. Stats Logic
        const today = new Date().toISOString().split('T')[0];

        // Daily Budget
        const [budgetRows] = await connection.query(`
            SELECT daily_budget_amount FROM branch_budgets
            WHERE branch_id = ? AND effective_from_date <= ?
            ORDER BY effective_from_date DESC
            LIMIT 1
        `, [branchId, today]);
        const dailyLimit = parseFloat(budgetRows[0]?.daily_budget_amount || 0);

        // Daily Spent
        const [dailySpentRows] = await connection.query(`
            SELECT SUM(e.amount) as total FROM expenses e
            LEFT JOIN employees emp ON e.user_id = emp.employee_id
            LEFT JOIN roles r ON emp.role_id = r.role_id
            WHERE e.branch_id = ? 
              AND e.expense_date = ? 
              AND e.status != 'rejected'
              AND r.role_name = 'reception'
        `, [branchId, today]);
        const dailySpent = parseFloat(dailySpentRows[0].total || 0);

        // Monthly Stats
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const monthlyLimit = dailyLimit * daysInMonth;

        const [monthlySpentRows] = await connection.query(`
            SELECT SUM(e.amount) as total FROM expenses e
            LEFT JOIN employees emp ON e.user_id = emp.employee_id
            LEFT JOIN roles r ON emp.role_id = r.role_id
            WHERE e.branch_id = ? 
              AND e.expense_date BETWEEN ? AND ? 
              AND e.status != 'rejected'
              AND r.role_name = 'reception'
        `, [branchId, monthStart, monthEnd]);
        const monthlySpent = parseFloat(monthlySpentRows[0].total || 0);

        // Total Spent for Selected Period
        const [periodSpentRows] = await connection.query(`
            SELECT SUM(e.amount) as total FROM expenses e
            LEFT JOIN employees emp ON e.user_id = emp.employee_id
            LEFT JOIN roles r ON emp.role_id = r.role_id
            WHERE e.branch_id = ? 
              AND e.expense_date BETWEEN ? AND ? 
              AND e.status != 'rejected'
              AND r.role_name = 'reception'
        `, [branchId, startDate, endDate]);
        const periodSpent = parseFloat(periodSpentRows[0].total || 0);

        const stats = {
            total_count: totalCount,
            total_spent: periodSpent, // Use period-specific spending for the main card
            monthly_spent: monthlySpent, // Original monthly value kept for reference
            daily_limit: dailyLimit,
            daily_rem: dailyLimit - dailySpent,
            monthly_limit: monthlyLimit,
            monthly_rem: monthlyLimit - monthlySpent
        };

        // Format expenses for frontend
        const data = expenses.map(exp => ({
            id: exp.expense_id,
            voucher_no: exp.voucher_no,
            date: exp.expense_date,
            paid_to: exp.paid_to,
            category: exp.expense_for,
            amount: parseFloat(exp.amount),
            payment_method: exp.payment_method,
            status: exp.status.charAt(0).toUpperCase() + exp.status.slice(1),
            has_bill: !!exp.bill_image_path,
            bill_path: exp.bill_image_path,
            reason: exp.description,
            expense_done_by: exp.expense_done_by
        }));

        res.json({
            status: 'success',
            data: data,
            stats: stats,
            total_pages: totalPages,
            current_page: parseInt(page)
        });

    } catch (error) {
        throw error;
    } finally {
        connection.release();
    }
}

async function addExpense(req, res, branchId) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            date,
            paid_to,
            expense_done_by,
            category,
            amount,
            payment_method,
            reason: description
        } = req.body;

        const employeeId = req.user.employee_id;
        const userId = req.user.employee_id; // user_id in expenses table seems to reference employee_id
        const amountFloat = parseFloat(amount);

        if (!date || !paid_to || isNaN(amountFloat) || amountFloat <= 0 || !expense_done_by || !category) {
            throw new Error("Missing required fields or invalid amount");
        }

        // Budget Logic (Same as legacy)
        const [budgetRows] = await connection.query(`
            SELECT daily_budget_amount FROM branch_budgets
            WHERE branch_id = ? AND effective_from_date <= ?
            ORDER BY effective_from_date DESC
            LIMIT 1
        `, [branchId, date]);
        const dailyBudget = parseFloat(budgetRows[0]?.daily_budget_amount || 0);

        const [spentRows] = await connection.query(`
            SELECT SUM(amount) as total FROM expenses 
            WHERE branch_id = ? 
              AND expense_date = ? 
              AND status IN ('approved', 'paid')
        `, [branchId, date]);
        const totalSpentToday = parseFloat(spentRows[0].total || 0);

        const status = ((totalSpentToday + amountFloat) <= dailyBudget) ? 'approved' : 'pending';
        const approvedAt = (status === 'approved') ? new Date() : null;

        // Voucher No
        let voucherNo = 'EXP-' + new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

        // Handle file if present
        let bill_image_path = null;
        if (req.file) {
            bill_image_path = 'uploads/expenses/' + req.file.filename;
        }

        const [insertResult] = await connection.query(`
            INSERT INTO expenses (
                branch_id, user_id, employee_id, voucher_no, expense_date, 
                paid_to, expense_done_by, expense_for, description, amount, 
                payment_method, status, approved_at, bill_image_path, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            branchId, userId, employeeId, voucherNo, date,
            paid_to, expense_done_by, category, description, amountFloat,
            payment_method, status, approvedAt, bill_image_path
        ]);

        const newExpenseId = insertResult.insertId;

        // Notification for Admin if pending
        if (status === 'pending') {
            const msg = `New high-value expense req: ₹${amountFloat} (${voucherNo})`;
            const link = `expenses.php`; // Or the new react route if known

            const [admins] = await connection.query(`
                SELECT e.employee_id
                FROM employees e
                JOIN roles r ON e.role_id = r.role_id
                WHERE e.branch_id = ? AND r.role_name IN ('admin', 'superadmin')
            `, [branchId]);

            for (const admin of admins) {
                await connection.query(`
                    INSERT INTO notifications (employee_id, branch_id, message, link_url, created_by_employee_id, created_at)
                    VALUES (?, ?, ?, ?, ?, NOW())
                `, [admin.employee_id, branchId, msg, link, employeeId]);
            }
        }

        await connection.commit();

        res.json({
            status: 'success',
            message: `Expense voucher ${voucherNo} added successfully! Status: ${status}`,
            expense_id: newExpenseId,
            voucher_no: voucherNo,
            approval_status: status
        });

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function updateExpenseBill(req, res, branchId) {
    const { expense_id } = req.body;
    if (!expense_id || !req.file) {
        throw new Error("Expense ID and file are required");
    }

    const bill_image_path = 'uploads/expenses/' + req.file.filename;

    const [result] = await pool.query(`
        UPDATE expenses 
        SET bill_image_path = ?
        WHERE expense_id = ? AND branch_id = ?
    `, [bill_image_path, expense_id, branchId]);

    if (result.affectedRows === 0) {
        throw new Error("Expense not found or unauthorized");
    }

    res.json({
        status: 'success',
        message: 'Bill uploaded successfully',
        bill_path: bill_image_path
    });
}
