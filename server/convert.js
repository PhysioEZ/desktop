const { getLocalDb } = require('./src/config/sqlite');
async function fix() {
    const db = await getLocalDb();
    const rows = await db.all("SELECT * FROM attendance");
    let converted = 0;
    
    for (const r of rows) {
        let rd = r.attendance_date;
        let needsUpdate = false;
        
        // Fix dates stored as float strings
        if (typeof rd === 'string' && /^\d+\.\d+$/.test(rd)) {
            rd = new Date(parseFloat(rd) + 5.5*3600*1000).toISOString().split('T')[0];
            needsUpdate = true;
        } else if (typeof rd === 'number') {
            rd = new Date(rd + 5.5*3600*1000).toISOString().split('T')[0];
            needsUpdate = true;
        }
        
        let cAt = r.created_at;
        if (typeof cAt === 'string' && /^\d+\.\d+$/.test(cAt)) {
            cAt = new Date(parseFloat(cAt) + 5.5*3600*1000).toISOString().replace('T', ' ').substring(0, 19);
            needsUpdate = true;
        }
        
        if (needsUpdate) {
            await db.run("UPDATE attendance SET attendance_date = ?, created_at = ? WHERE attendance_id = ?", [rd, cAt, r.attendance_id]);
            converted++;
        }
    }
    console.log(`Converted ${converted} records to YYYY-MM-DD format`);
    
    // Now deduplicate again
    const sqRows = await db.all("SELECT * FROM attendance ORDER BY created_at ASC");
    let seenSq = new Set();
    let toDeleteSQLite = [];
    for (const r of sqRows) {
        let key = `${r.patient_id}_${r.attendance_date.split('T')[0]}`;
        if (seenSq.has(key)) toDeleteSQLite.push(r.attendance_id);
        else seenSq.add(key);
    }
    
    for (let id of toDeleteSQLite) {
        await db.run("DELETE FROM attendance WHERE attendance_id=?", [id]);
    }
    console.log(`Deleted ${toDeleteSQLite.length} duplicates from SQLite`);
}
fix();
