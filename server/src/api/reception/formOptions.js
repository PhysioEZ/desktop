const pool = require('../../config/db');
const sqlite = require('../../config/sqlite');

/**
 * Helper: run a SELECT on SQLite, return rows array or empty array on error
 */
function localQuery(sql, params = []) {
    try {
        return sqlite.prepare(sql).all(...params);
    } catch {
        return [];
    }
}

exports.getFormOptions = async (req, res) => {
    try {
        let branchId = req.user ? req.user.branch_id : req.query.branch_id;
        if (!branchId && req.query.branch_id) branchId = req.query.branch_id;

        if (!branchId) {
            return res.status(400).json({ status: 'error', message: 'Invalid branch_id' });
        }

        // ─────────────────────────────────────────────────────────────
        // LOCAL: Tables already in SQLite cache
        // ─────────────────────────────────────────────────────────────

        // 1. Referrers (build from local registration + test_inquiry + tests)
        const regReferrers = localQuery(
            "SELECT DISTINCT reffered_by AS name FROM registration WHERE branch_id = ? AND reffered_by IS NOT NULL AND reffered_by != ''",
            [branchId]
        );
        const testInqReferrers = localQuery(
            "SELECT DISTINCT reffered_by AS name FROM test_inquiry WHERE branch_id = ? AND reffered_by IS NOT NULL AND reffered_by != ''",
            [branchId]
        );
        const testReferrers = localQuery(
            "SELECT DISTINCT referred_by AS name FROM tests WHERE branch_id = ? AND referred_by IS NOT NULL AND referred_by != ''",
            [branchId]
        );
        const referrerSet = new Set([
            ...regReferrers.map(r => r.name),
            ...testInqReferrers.map(r => r.name),
            ...testReferrers.map(r => r.name),
        ]);
        const referrers = [...referrerSet].sort();

        // 2. Payment Methods (local)
        const paymentMethods = localQuery(
            "SELECT method_code, method_name FROM payment_methods WHERE branch_id = ? AND is_active = 1 ORDER BY display_order",
            [branchId]
        );

        // 3. Employees (local — doctors/doctors for assignment dropdowns)
        const employees = localQuery(
            "SELECT employee_id, (first_name || ' ' || COALESCE(last_name, '')) as first_name, '' as last_name, job_title FROM employees WHERE branch_id = ? AND is_active = 1 ORDER BY first_name ASC",

            [branchId]
        );

        // ─────────────────────────────────────────────────────────────
        // REMOTE: Config tables not yet in SQLite cache (Batch 5 will add them)
        // Run in parallel so they don't slow each other down
        // ─────────────────────────────────────────────────────────────
        const [
            resStaff,
            resTestTypes,
            resLimbTypes,
            resChiefComplaints,
            resReferralSources,
            resConsultationTypes,
            resInquiryServiceTypes,
            resExpCategories
        ] = await Promise.all([
            pool.query("SELECT staff_id, staff_name, job_title FROM test_staff WHERE branch_id = ? AND is_active = 1 ORDER BY display_order, staff_name", [branchId]),
            pool.query("SELECT test_type_id, test_name, test_code, default_cost, requires_limb_selection FROM test_types WHERE branch_id = ? AND is_active = 1 ORDER BY display_order", [branchId]),
            pool.query("SELECT limb_type_id, limb_name, limb_code FROM limb_types WHERE branch_id = ? AND is_active = 1 ORDER BY display_order", [branchId]),
            pool.query("SELECT complaint_code, complaint_name FROM chief_complaints WHERE branch_id = ? AND is_active = 1 ORDER BY display_order", [branchId]),
            pool.query("SELECT source_code, source_name FROM referral_sources WHERE branch_id = ? AND is_active = 1 ORDER BY display_order", [branchId]),
            pool.query("SELECT consultation_code, consultation_name FROM consultation_types WHERE branch_id = ? AND is_active = 1 ORDER BY display_order", [branchId]),
            pool.query("SELECT service_code, service_name FROM inquiry_service_types WHERE branch_id = ? AND is_active = 1 ORDER BY display_order", [branchId]),
            pool.query("SELECT category_name FROM expense_categories WHERE is_active = 1 ORDER BY display_order ASC"),
        ]);

        const staffMembers = resStaff[0];
        const testTypes = resTestTypes[0];
        const limbTypes = resLimbTypes[0];
        const chiefComplaints = resChiefComplaints[0];
        const referralSources = resReferralSources[0];
        const consultationTypes = resConsultationTypes[0];
        const inquiryServiceTypes = resInquiryServiceTypes[0];
        const expenseCategories = resExpCategories[0].map(c => c.category_name);

        // ─────────────────────────────────────────────────────────────
        // Time Slots (local — purely computational, needs only booked appointments)
        // ─────────────────────────────────────────────────────────────
        const appointmentDate = req.query.appointment_date || new Date().toISOString().slice(0, 10);
        const serviceType = req.query.service_type || 'physio';

        // Check local cache for booked slots (registration table with appointment_date)
        const bookedRaw = localQuery(
            "SELECT appointment_time as time_slot FROM registration WHERE branch_id = ? AND appointment_date = ? AND status != 'Cancelled'",
            [branchId, appointmentDate]
        );
        const bookedSlots = bookedRaw.map(r => r.time_slot).filter(Boolean);

        const timeSlots = [];
        const capacity = serviceType === 'physio' ? 10 : 1;
        const baseDateStr = '2000-01-01T';

        let current, end, interval;
        if (serviceType === 'physio') {
            current = new Date(baseDateStr + '09:00:00');
            end = new Date(baseDateStr + '19:00:00');
            interval = 90;
        } else {
            current = new Date(baseDateStr + '15:00:00');
            end = new Date(baseDateStr + '19:00:00');
            interval = 60;
        }

        while (current < end) {
            const time24 = current.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            const time12 = current.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            const bookedCount = bookedSlots.filter(slot => slot && slot.startsWith(time24)).length;
            timeSlots.push({ value: time24, label: time12, booked: bookedCount >= capacity, booked_count: bookedCount, capacity });
            current.setMinutes(current.getMinutes() + interval);
        }

        res.json({
            status: 'success',
            data: {
                referrers,
                paymentMethods,
                staffMembers,
                testTypes,
                limbTypes,
                chiefComplaints,
                referralSources,
                consultationTypes,
                inquiryServiceTypes,
                timeSlots,
                employees,
                expenseCategories
            }
        });

    } catch (error) {
        console.error("Form Options Error:", error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};
