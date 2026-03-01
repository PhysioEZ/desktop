const { getLocalDb } = require('./src/config/sqlite');

async function fixQueue() {
    const db = await getLocalDb();
    const rows = await db.all("SELECT id, body FROM pending_sync_queue WHERE status = 'pending' AND id IN (407, 408)");

    for (const row of rows) {
        try {
            // If it fails to parse, we fix it
            let bodyStr = row.body;
            // Basic fix for literal newlines in SQL
            bodyStr = bodyStr.replace(/\n/g, '\\n');

            // Validate it parses now
            const parsed = JSON.parse(bodyStr);

            // Ensure master_patient_id is correct in params if it was 45
            if (row.id === 407) {
                // We know param 0 is master_patient_id based on previous logs
                if (parsed.params[0] === 45) {
                    parsed.params[0] = 1;
                }
                parsed.local_id = 44;
                parsed.tableName = 'registration';
            }

            await db.run("UPDATE pending_sync_queue SET body = ?, status = 'pending', attempts = 0 WHERE id = ?", [JSON.stringify(parsed), row.id]);
            console.log(`Fixed Item #${row.id}`);
        } catch (e) {
            console.error(`Failed to fix #${row.id}:`, e.message);
        }
    }
    process.exit(0);
}

fixQueue();
