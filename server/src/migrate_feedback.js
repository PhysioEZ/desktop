const pool = require('./config/db');

async function migrate() {
    try {
        await pool.query("ALTER TABLE patient_feedback ADD COLUMN is_resolved TINYINT(1) DEFAULT 0;");
        await pool.query("ALTER TABLE patient_feedback ADD COLUMN resolution_note TEXT DEFAULT NULL;");
        await pool.query("ALTER TABLE patient_feedback ADD COLUMN resolved_by INT DEFAULT NULL;");
        await pool.query("ALTER TABLE patient_feedback ADD COLUMN resolved_at TIMESTAMP NULL DEFAULT NULL;");
        console.log("Migration successful");
    } catch (err) {
        console.error("Migration error:", err);
    }
    process.exit(0);
}

migrate();
