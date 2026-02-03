const pool = require('../../config/db');

exports.getDailyIntelligence = async (req, res) => {
    try {
        const branchId = req.user?.branch_id || req.query.branch_id;
        console.log(`[Intelligence] Hit for branch: ${branchId}`);
        if (!branchId) {
            return res.status(400).json({ status: "error", message: "Branch ID required" });
        }

        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        console.log(`[Intelligence] Branch: ${branchId}, Today: ${today}, Yesterday: ${yesterday}`);

        const insights = [];

        // 1. Retention Alert
        const [noShowRows] = await pool.query(`
            SELECT p.patient_id, r.patient_name, r.phone_number, p.treatment_type, 
                   MAX(a.attendance_date) as last_visit
            FROM attendance a
            JOIN patients p ON a.patient_id = p.patient_id
            JOIN registration r ON p.registration_id = r.registration_id
            WHERE a.attendance_date = ?
              AND p.status = 'active'
              AND p.patient_id NOT IN (
                  SELECT patient_id FROM attendance WHERE attendance_date = ?
              )
            GROUP BY p.patient_id
        `, [yesterday, today]);

        console.log(`[Intelligence] Retention count: ${noShowRows.length}`);

        if (noShowRows.length > 0) {
            insights.push({
                id: 'retention_alert',
                type: 'retention',
                priority: 'medium',
                title: 'Retention Alert',
                message: `${noShowRows.length} patient(s) from yesterday haven't shown up today.`,
                data: noShowRows.map(r => ({
                    id: r.patient_id,
                    name: r.patient_name,
                    phone: r.phone_number,
                    type: r.treatment_type
                }))
            });
        }

        // 2. Payment Recoup
        const [debtorRows] = await pool.query(`
            SELECT p.patient_id, r.patient_name, r.phone_number, a.attendance_date, 
                   pt.due_amount
            FROM attendance a
            JOIN patients p ON a.patient_id = p.patient_id
            JOIN registration r ON p.registration_id = r.registration_id
            JOIN patients_treatment pt ON p.patient_id = pt.patient_id
            WHERE a.attendance_date = ?
              AND (a.payment_id IS NULL OR a.payment_id = 0)
              AND a.approved_at IS NOT NULL
            GROUP BY p.patient_id
        `, [yesterday]);

        console.log(`[Intelligence] Debtor count: ${debtorRows.length}`);

        if (debtorRows.length > 0) {
            insights.push({
                id: 'payment_recoup',
                type: 'billing',
                priority: 'high',
                title: 'Payment Collection',
                message: `${debtorRows.length} patient(s) attended yesterday without payment.`,
                data: debtorRows.map(r => ({
                    id: r.patient_id,
                    name: r.patient_name,
                    phone: r.phone_number,
                    due: r.due_amount
                }))
            });
        }

        // 3. Package Expiry
        const [expiryRows] = await pool.query(`
            SELECT p.patient_id, r.patient_name, pt.treatment_days, pt.attendance_count
            FROM patients_treatment pt
            JOIN patients p ON pt.patient_id = p.patient_id
            JOIN registration r ON p.registration_id = r.registration_id
            WHERE pt.status = 'active'
              AND pt.treatment_type = 'package'
              AND (pt.treatment_days - pt.attendance_count) <= 1
        `, []);

        console.log(`[Intelligence] Expiry count: ${expiryRows.length}`);

        if (expiryRows.length > 0) {
            insights.push({
                id: 'package_expiry',
                type: 'billing',
                priority: 'medium',
                title: 'Package Renewal',
                message: `${expiryRows.length} patient(s) packages are nearing completion.`,
                data: expiryRows.map(r => ({
                    id: r.patient_id,
                    name: r.patient_name,
                    remaining: r.treatment_days - r.attendance_count
                }))
            });
        }

        // 4. Test Results
        const [testRows] = await pool.query(`
            SELECT t.test_id, t.patient_name, t.test_name, t.test_uid
            FROM tests t
            WHERE t.test_status = 'completed'
              AND t.updated_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `, []);

        console.log(`[Intelligence] Test count: ${testRows.length}`);

        if (testRows.length > 0) {
            insights.push({
                id: 'test_results',
                type: 'lab',
                priority: 'low',
                title: 'New Reports Ready',
                message: `${testRows.length} test report(s) completed in the last 24 hours.`,
                data: testRows.map(t => ({
                    id: t.test_id,
                    name: t.patient_name,
                    test: t.test_name,
                    uid: t.test_uid
                }))
            });
        }

        // 5. Inquiry Follow-ups
        const [inqRows] = await pool.query(`
            SELECT i.inquiry_id, i.name, i.phone_number, i.next_followup_date
            FROM quick_inquiry i
            WHERE i.branch_id = ?
              AND (DATE(i.next_followup_date) = ? OR i.status = 'pending')
              AND i.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `, [branchId, today]);

        console.log(`[Intelligence] Inquiry count: ${inqRows.length}`);

        if (inqRows.length > 0) {
            insights.push({
                id: 'inquiry_followup',
                type: 'conversion',
                priority: 'medium',
                title: 'Inquiry Follow-up',
                message: `${inqRows.length} lead(s) require follow-up today.`,
                data: inqRows.map(i => ({
                    id: i.inquiry_id,
                    name: i.name,
                    phone: i.phone_number
                }))
            });
        }

        res.json({
            status: "success",
            data: insights
        });

    } catch (error) {
        console.error("Intelligence API Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
};
