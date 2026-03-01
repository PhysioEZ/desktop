const mysql = require('mysql2/promise');
require('dotenv').config({ path: '/srv/http/admin/desktop/server/.env' });

async function check() {
    const pool = mysql.createPool({ host: 'localhost', user: 'prospine', password: '1234', database: 'prospine' });
    try {
        const [rows] = await pool.query(`
            SELECT p.patient_id, a.status as today_attendance 
            FROM patients p 
            LEFT JOIN attendance a ON p.patient_id = a.patient_id AND a.attendance_date = CURDATE()
            WHERE p.patient_id IN (16, 17, 19, 22)
        `);
        console.log(rows);
    } catch(e) { console.error(e); }
    process.exit(0);
}
check();
