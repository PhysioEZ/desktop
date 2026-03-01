const { getLocalDb } = require('./src/config/sqlite');
const fs = require('fs');
const path = require('path');

async function reconcileAll() {
    const db = await getLocalDb();
    const mapPath = path.join(__dirname, 'database/sync_status.json');
    const syncMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
    const mappings = syncMap.idMappings || {};

    console.log(`Checking ${Object.keys(mappings).length} mappings for reconciliation...`);

    for (const [key, remoteId] of Object.entries(mappings)) {
        const [tableName, localIdStr] = key.split(':');
        const localId = parseInt(localIdStr);

        if (localId === remoteId) {
            console.log(`[OK] ${tableName} ${localId} already reconciled.`);
            continue;
        }

        // Let's check if the localId still exists in the local table
        const pkName = tableName === 'patient_master' ? 'master_patient_id' :
            tableName === 'registration' ? 'registration_id' :
                tableName === 'patients' ? 'patient_id' :
                    tableName === 'tests' ? 'test_id' : 'id';

        const row = await db.get(`SELECT "${pkName}" FROM "${tableName}" WHERE "${pkName}" = ?`, [localId]);
        if (row) {
            console.log(`[FIXING] ${tableName} ${localId} needs update to ${remoteId}...`);
            try {
                await db.run('BEGIN TRANSACTION');

                // 1. Check if the remoteId already exists (merge needed)
                const exists = await db.get(`SELECT "${pkName}" FROM "${tableName}" WHERE "${pkName}" = ?`, [remoteId]);
                if (exists) {
                    console.log(`[MERGE] ${tableName} ${remoteId} already exists locally. Merging ${localId} items into ${remoteId}...`);
                    // Find all tables that refer to this PK
                    const tables = ['attendance', 'payments', 'patients_treatment', 'registration', 'registration_payments', 'test_items', 'test_payments', 'tests', 'notifications', 'bill_summary', 'pending_sync_queue'];

                    for (const t of tables) {
                        try {
                            const pragma = await db.all(`PRAGMA table_info("${t}")`);
                            const hasCol = pragma.some(c => c.name.toLowerCase() === pkName.toLowerCase());
                            if (hasCol) {
                                await db.run(`UPDATE "${t}" SET "${pkName}" = ? WHERE "${pkName}" = ?`, [remoteId, localId]);
                            }
                        } catch (e) { /* skip */ }
                    }
                    // Delete the old one
                    await db.run(`DELETE FROM "${tableName}" WHERE "${pkName}" = ?`, [localId]);
                } else {
                    // Just update the ID
                    await db.run(`UPDATE "${tableName}" SET "${pkName}" = ? WHERE "${pkName}" = ?`, [remoteId, localId]);
                    // Update refs
                    const tables = ['attendance', 'payments', 'patients_treatment', 'registration', 'registration_payments', 'test_items', 'test_payments', 'tests', 'notifications', 'bill_summary', 'pending_sync_queue'];
                    for (const t of tables) {
                        try {
                            const pragma = await db.all(`PRAGMA table_info("${t}")`);
                            const hasCol = pragma.some(c => c.name.toLowerCase() === pkName.toLowerCase());
                            if (hasCol) {
                                await db.run(`UPDATE "${t}" SET "${pkName}" = ? WHERE "${pkName}" = ?`, [remoteId, localId]);
                            }
                        } catch (e) { /* skip */ }
                    }
                }

                await db.run('COMMIT');
                console.log(`[SUCCESS] Reconciled ${tableName} ${localId} -> ${remoteId}`);
            } catch (e) {
                await db.run('ROLLBACK');
                console.error(`[FAIL] ${key}:`, e.message);
            }
        } else {
            console.log(`[OK] ${tableName} ${localId} not found locally (already deleted or reconciled).`);
        }
    }

    console.log("Reconciliation finished.");
    process.exit(0);
}

reconcileAll();
