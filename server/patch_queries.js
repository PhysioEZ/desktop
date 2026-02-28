const fs = require('fs');
let content = fs.readFileSync('/srv/http/admin/desktop/server/src/api/reception/patients.js', 'utf8');

content = content.replace(
    /SELECT COUNT\(\*\) as count FROM attendance WHERE patient_id = \? AND attendance_date >= \? AND attendance_date < \? AND status = 'present'/g,
    "SELECT COUNT(DISTINCT SUBSTR(attendance_date, 1, 10)) as count FROM attendance WHERE patient_id = ? AND attendance_date >= ? AND attendance_date < ? AND status = 'present'"
);

content = content.replace(
    /SELECT COUNT\(\*\) as count FROM attendance WHERE patient_id = \? AND attendance_date >= \? AND status = 'present'/g,
    "SELECT COUNT(DISTINCT SUBSTR(attendance_date, 1, 10)) as count FROM attendance WHERE patient_id = ? AND attendance_date >= ? AND status = 'present'"
);

// We should also deduplicate attendance log mapping
content = content.replace(
    /attendance = attendanceRows;/g,
    `// Safe deduplication of attendance history log mapped objects to block sync UI lagging duplicate IDs
        let seenLocalDates = new Set();
        attendance = attendanceRows.filter(r => {
            let key = typeof r.attendance_date === 'string' ? r.attendance_date.substring(0, 10) : r.attendance_date;
            if (seenLocalDates.has(key)) return false;
            seenLocalDates.add(key);
            return true;
        });`
);

fs.writeFileSync('/srv/http/admin/desktop/server/src/api/reception/patients.js', content);
console.log('Patched');
