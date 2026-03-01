const { getLocalDb } = require('./src/config/sqlite');

async function fix() {
    const db = await getLocalDb();
    
    // Convert ALL attendance correctly.
    const rows = await db.all("SELECT * FROM attendance");
    for (const r of rows) {
        let rd = r.attendance_date;
        let needsUpdate = false;
        
        let d = null;
        if (typeof rd === 'string' && /^\d+\.\d+$/.test(rd)) d = new Date(parseFloat(rd));
        else if (typeof rd === 'number') d = new Date(rd);
        else if (typeof rd === 'string' && /^\d+$/.test(rd)) d = new Date(parseInt(rd));
        
        if (d) {
            rd = d.getFullYear() + '-' +
                 String(d.getMonth() + 1).padStart(2, '0') + '-' +
                 String(d.getDate()).padStart(2, '0');
            needsUpdate = true;
        }

        let cAt = r.created_at;
        let cd = null;
        if (typeof cAt === 'string' && /^\d+\.\d+$/.test(cAt)) cd = new Date(parseFloat(cAt));
        else if (typeof cAt === 'number') cd = new Date(cAt);
        else if (typeof cAt === 'string' && /^\d+$/.test(cAt)) cd = new Date(parseInt(cAt));
        
        if (cd) {
            cAt = cd.getFullYear() + '-' +
                  String(cd.getMonth() + 1).padStart(2, '0') + '-' +
                  String(cd.getDate()).padStart(2, '0') + ' ' +
                  String(cd.getHours()).padStart(2, '0') + ':' +
                  String(cd.getMinutes()).padStart(2, '0') + ':' +
                  String(cd.getSeconds()).padStart(2, '0');
            needsUpdate = true;
        }

        if (needsUpdate) {
            await db.run("UPDATE attendance SET attendance_date = ?, created_at = ? WHERE attendance_id = ?", [rd, cAt, r.attendance_id]);
        }
    }
    
    // Deduplicate
    const sqRows = await db.all("SELECT * FROM attendance ORDER BY created_at ASC");
    let seenSq = new Set();
    let toDeleteSQLite = [];
    for (const r of sqRows) {
        let rd = r.attendance_date;
        if (rd && rd.length > 10) rd = rd.substring(0, 10);
        let key = `${r.patient_id}_${rd}`;
        if (seenSq.has(key)) toDeleteSQLite.push(r.attendance_id);
        else seenSq.add(key);
    }
    for (let id of toDeleteSQLite) await db.run("DELETE FROM attendance WHERE attendance_id=?", [id]);
    
    console.log("Cleanup finished.");
}
fix();
