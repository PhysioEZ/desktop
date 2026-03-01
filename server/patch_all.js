const fs = require('fs');

const files = [
    '/srv/http/admin/desktop/server/src/utils/financials.js',
    '/srv/http/admin/desktop/server/src/api/reception/tokens.js',
    '/srv/http/admin/desktop/server/src/api/reception/attendance.js',
    '/srv/http/admin/desktop/server/src/api/reception/getAttendanceHistory.js',
    '/srv/http/admin/desktop/server/src/api/reception/treatmentPlans.js'
];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace everywhere EXCEPT checkUpdates (which groups by 'created_at' and counts actual rows created)
    content = content.replace(
        /COUNT\(\*\) as count FROM attendance WHERE patient_id = \?/g,
        "COUNT(DISTINCT SUBSTR(attendance_date, 1, 10)) as count FROM attendance WHERE patient_id = ?"
    );
    
    fs.writeFileSync(file, content);
}
console.log('Patch complete.');
