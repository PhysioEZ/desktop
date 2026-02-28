const { getLocalDb } = require('./src/config/sqlite');
const pool = require('./src/config/db');

async function fix() {
    let toDeleteSQLite = [];
    let toDeleteMySQL = [];

    try {
        const sqliteDb = await getLocalDb();
        const sqRows = await sqliteDb.all("SELECT * FROM attendance ORDER BY created_at ASC");
        let seenSq = new Set();
        for (const r of sqRows) {
            let rd = r.attendance_date;
            if (typeof rd === 'string' && /^\d+\.\d+$/.test(rd)) rd = new Date(parseFloat(rd)).toISOString().split('T')[0];
            else if (typeof rd === 'string') rd = rd.split('T')[0].substring(0, 10);
            
            let key = `${r.patient_id}_${rd}`;
            if (seenSq.has(key)) toDeleteSQLite.push(r.attendance_id);
            else seenSq.add(key);
        }
        
        if (toDeleteSQLite.length > 0) {
            for(let id of toDeleteSQLite) await sqliteDb.run("DELETE FROM attendance WHERE attendance_id=?", [id]);
            console.log(`Deleted ${toDeleteSQLite.length} duplicates from SQLite`);
        } else {
            console.log(`No duplicates found in SQLite`);
        }
    } catch(e) { console.log('Sqlite error', e); }

    try {
        const [myRows] = await pool.query("SELECT attendance_id, patient_id, attendance_date, created_at FROM attendance ORDER BY created_at ASC");
        let seenMy = new Set();
        for (const r of myRows) {
            let rd = r.attendance_date;
            if (rd instanceof Date) rd = new Date(rd.getTime() + 5.5 * 3600 * 1000).toISOString().split('T')[0];
            else if (typeof rd === 'string') rd = rd.split('T')[0].substring(0, 10);
            
            let key = `${r.patient_id}_${rd}`;
            if (seenMy.has(key)) toDeleteMySQL.push(r.attendance_id);
            else seenMy.add(key);
        }
        
        if (toDeleteMySQL.length > 0) {
            await pool.query(`DELETE FROM attendance WHERE attendance_id IN (?)`, [toDeleteMySQL]);
            console.log(`Deleted ${toDeleteMySQL.length} duplicates from MySQL`);
        } else {
            console.log(`No duplicates found in MySQL`);
        }
    } catch(e) { console.log('MySQL error', e); }
    
    process.exit(0);
}
fix();
