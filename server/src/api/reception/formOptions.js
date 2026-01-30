const pool = require('../../config/db');

exports.getFormOptions = async (req, res) => {
    try {
        let branchId = req.user ? req.user.branch_id : req.query.branch_id;
        if (!branchId && req.query.branch_id) branchId = req.query.branch_id;

        if (!branchId) {
            return res.status(400).json({ status: 'error', message: 'Invalid branch_id' });
        }

        // Set timezone (Optional in Node if env is correct, but safer to match PHP)
        await pool.query("SET time_zone = '+05:30'");

        // 1. Referrers
        const [referrersRes] = await pool.query(`
            (SELECT DISTINCT reffered_by AS name FROM registration WHERE branch_id = ? AND reffered_by IS NOT NULL AND reffered_by != '')
            UNION
            (SELECT DISTINCT reffered_by AS name FROM test_inquiry WHERE branch_id = ? AND reffered_by IS NOT NULL AND reffered_by != '')
            UNION
            (SELECT DISTINCT referred_by AS name FROM tests WHERE branch_id = ? AND referred_by IS NOT NULL AND referred_by != '')
            ORDER BY name ASC
        `, [branchId, branchId, branchId]);
        const referrers = referrersRes.map(r => r.name);

        // 2. Payment Methods
        const [paymentMethods] = await pool.query("SELECT method_code, method_name FROM payment_methods WHERE branch_id = ? AND is_active = 1 ORDER BY display_order", [branchId]);

        // 3. Staff Members
        const [staffMembers] = await pool.query("SELECT staff_id, staff_name, job_title FROM test_staff WHERE branch_id = ? AND is_active = 1 ORDER BY display_order, staff_name", [branchId]);

        // 4. Test Types
        const [testTypes] = await pool.query("SELECT test_type_id, test_name, test_code, default_cost, requires_limb_selection FROM test_types WHERE branch_id = ? AND is_active = 1 ORDER BY display_order", [branchId]);

        // 5. Limb Types
        const [limbTypes] = await pool.query("SELECT limb_type_id, limb_name, limb_code FROM limb_types WHERE branch_id = ? AND is_active = 1 ORDER BY display_order", [branchId]);

        // 6. Chief Complaints
        const [chiefComplaints] = await pool.query("SELECT complaint_code, complaint_name FROM chief_complaints WHERE branch_id = ? AND is_active = 1 ORDER BY display_order", [branchId]);

        // 7. Referral Sources
        const [referralSources] = await pool.query("SELECT source_code, source_name FROM referral_sources WHERE branch_id = ? AND is_active = 1 ORDER BY display_order", [branchId]);

        // 8. Consultation Types
        const [consultationTypes] = await pool.query("SELECT consultation_code, consultation_name FROM consultation_types WHERE branch_id = ? AND is_active = 1 ORDER BY display_order", [branchId]);

        // 9. Inquiry Service Types
        const [inquiryServiceTypes] = await pool.query("SELECT service_code, service_name FROM inquiry_service_types WHERE branch_id = ? AND is_active = 1 ORDER BY display_order", [branchId]);

        // 10. Time Slots
        const appointmentDate = req.query.appointment_date || new Date().toISOString().slice(0, 10);
        const serviceType = req.query.service_type || 'physio';

        // Get booked slots
        // Note: appointment_date in DB is YYYY-MM-DD
        const [bookedRes] = await pool.query(`
            SELECT time_slot 
            FROM patient_appointments 
            WHERE branch_id = ? AND appointment_date = ? AND service_type = ? AND status != 'cancelled'
        `, [branchId, appointmentDate, serviceType]);

        const bookedSlots = bookedRes.map(r => r.time_slot); // These are usually strings like "10:30"

        // Slot Generation Logic
        const timeSlots = [];
        const capacity = (serviceType === 'physio') ? 10 : 1;

        let current, end, interval;

        // Base times (Assuming today or specific date)
        const baseDateStr = '2000-01-01T'; // Arbitrary date for time calc

        if (serviceType === 'physio') {
            // 9:00 to 19:00, 90 mins
            current = new Date(baseDateStr + '09:00:00');
            end = new Date(baseDateStr + '19:00:00');
            interval = 90; // minutes
        } else {
            // 15:00 to 19:00, 60 mins
            current = new Date(baseDateStr + '15:00:00');
            end = new Date(baseDateStr + '19:00:00');
            interval = 60; // minutes
        }

        while (current < end) {
            const time24 = current.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            const time12 = current.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

            // Count bookings for this slot
            // Matches partial string "10:30"
            const bookedCount = bookedSlots.filter(slot => slot.startsWith(time24)).length;
            const isFull = bookedCount >= capacity;

            timeSlots.push({
                value: time24,
                label: time12,
                booked: isFull,
                booked_count: bookedCount,
                capacity: capacity
            });

            current.setMinutes(current.getMinutes() + interval);
        }

        // 11. Employees
        const [employees] = await pool.query("SELECT employee_id, first_name, last_name, job_title FROM employees WHERE branch_id = ? AND is_active = 1 AND role_id = 1 ORDER BY first_name ASC", [branchId]);

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
                employees
            }
        });

    } catch (error) {
        console.error("Form Options Error:", error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};
