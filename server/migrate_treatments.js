const pool = require('./src/config/db');

async function migrate() {
    console.log("Starting migration of patients_treatment data...");

    const [rows] = await pool.query("SELECT * FROM patients_treatment");

    for (const treatment of rows) {
        const { treatment_id, patient_id, treatment_type, start_date, end_date, package_cost, treatment_cost_per_day, treatment_days } = treatment;

        const [attRows] = await pool.query(
            "SELECT COUNT(*) as count FROM attendance WHERE patient_id = ? AND attendance_date >= ? AND attendance_date < ? AND status = 'present'",
            [patient_id, start_date, end_date || '2099-12-31']
        );

        const count = attRows[0].count;
        const rate = (treatment_type === 'package' && treatment_days > 0)
            ? (parseFloat(package_cost) / treatment_days)
            : parseFloat(treatment_cost_per_day);

        const consumed = count * rate;

        await pool.query(
            "UPDATE patients_treatment SET attendance_count = ?, consumed_amount = ? WHERE treatment_id = ?",
            [count, consumed, treatment_id]
        );

        console.log(`Updated treatment ${treatment_id} for patient ${patient_id}: ${count} attendances, ${consumed} consumed.`);
    }

    console.log("Migration complete.");
}

migrate().then(() => process.exit()).catch(err => { console.error(err); process.exit(1); });
