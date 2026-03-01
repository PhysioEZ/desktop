const { getLocalDb } = require('./src/config/sqlite');

async function repairRegistrations() {
    const db = await getLocalDb();
    console.log("Searching for duplicate Registrations...");

    // Find duplicates by Name + Phone
    const duplicates = await db.all(`
        SELECT patient_name, phone_number, COUNT(*) as count 
        FROM registration 
        GROUP BY patient_name, phone_number 
        HAVING count > 1
    `);

    for (const dup of duplicates) {
        console.log(`Processing duplicate: ${dup.patient_name} (${dup.phone_number})`);

        const rows = await db.all("SELECT registration_id FROM registration WHERE patient_name = ? AND phone_number = ? ORDER BY registration_id ASC", [dup.patient_name, dup.phone_number]);
        const masterId = rows[0].registration_id;
        const others = rows.slice(1).map(r => r.registration_id);

        console.log(`Master Registration ID: ${masterId}, To Merge: ${others.join(', ')}`);

        try {
            await db.run('BEGIN TRANSACTION');

            for (const oldId of others) {
                // 1. Migrate patients pointing to this registration
                await db.run("UPDATE patients SET registration_id = ? WHERE registration_id = ?", [masterId, oldId]);
                // 2. Migrate test_inquiry
                await db.run("UPDATE test_inquiry SET registration_id = ? WHERE registration_id = ?", [masterId, oldId]);
                // 3. Migrate payments
                await db.run("UPDATE registration_payments SET registration_id = ? WHERE registration_id = ?", [masterId, oldId]);
                // 4. Delete the duplicate
                await db.run("DELETE FROM registration WHERE registration_id = ?", [oldId]);
            }

            await db.run('COMMIT');
            console.log(`Successfully merged ${others.length} registrations into #${masterId}`);
        } catch (e) {
            await db.run('ROLLBACK');
            console.error(`Failed to merge ${dup.patient_name}:`, e.message);
        }
    }

    console.log("Cleanup finished.");
    process.exit(0);
}

repairRegistrations();
