const fs = require('fs');
let content = fs.readFileSync('/srv/http/admin/desktop/server/src/api/reception/patients.js', 'utf8');

content = content.replace(
    /SELECT a.patient_id, COUNT\(\*\) as count\s+FROM attendance a\s+JOIN patients p2 ON a.patient_id = p2.patient_id\s+WHERE a.attendance_date >= COALESCE\(p2.start_date, '2000-01-01'\) AND a.status = 'present'\s+GROUP BY a.patient_id/g,
    `SELECT a.patient_id, COUNT(DISTINCT SUBSTR(a.attendance_date, 1, 10)) as count 
            FROM attendance a 
            JOIN patients p2 ON a.patient_id = p2.patient_id
            WHERE a.attendance_date >= COALESCE(p2.start_date, '2000-01-01') AND a.status = 'present'
            GROUP BY a.patient_id`
);

fs.writeFileSync('/srv/http/admin/desktop/server/src/api/reception/patients.js', content);
console.log('Patched');
