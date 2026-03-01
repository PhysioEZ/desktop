const { getLocalDb } = require('./src/config/sqlite');

async function repairTests() {
    const db = await getLocalDb();
    console.log("Searching for duplicate Test UIDs...");

    // Find UIDs with duplicates
    const duplicates = await db.all(`
        SELECT test_uid, COUNT(*) as count 
        FROM tests 
        GROUP BY test_uid 
        HAVING count > 1
    `);

    for (const dup of duplicates) {
        console.log(`Processing duplicate UID: ${dup.test_uid}`);

        // Pick the "Master" (usually the one with lowest ID or most complete)
        // Let's get them ordered by test_id
        const rows = await db.all("SELECT test_id FROM tests WHERE test_uid = ? ORDER BY test_id ASC", [dup.test_uid]);
        const masterId = rows[0].test_id;
        const others = rows.slice(1).map(r => r.test_id);

        console.log(`Master ID: ${masterId}, To Merge: ${others.join(', ')}`);

        try {
            await db.run('BEGIN TRANSACTION');

            for (const oldId of others) {
                // 1. Migrate Items
                await db.run("UPDATE test_items SET test_id = ? WHERE test_id = ?", [masterId, oldId]);
                // 2. Migrate Payments
                await db.run("UPDATE test_payments SET test_id = ? WHERE test_id = ?", [masterId, oldId]);
                // 3. Delete the duplicate record
                await db.run("DELETE FROM tests WHERE test_id = ?", [oldId]);
            }

            await db.run('COMMIT');
            console.log(`Successfully merged ${others.length} records into #${masterId}`);

            // Recalculate totals for the master record
            // Sum all payments
            const paidRows = await db.get("SELECT COALESCE(SUM(amount), 0) as total FROM test_payments WHERE test_id = ?", [masterId]);
            const totalPaid = parseFloat(paidRows.total);

            // Get total and discount
            const masterTest = await db.get("SELECT total_amount, discount FROM tests WHERE test_id = ?", [masterId]);
            const total = parseFloat(masterTest.total_amount);
            const discount = parseFloat(masterTest.discount || 0);
            const due = Math.max(0, total - totalPaid - discount);

            let status = 'pending';
            if (due <= 0) status = 'paid';
            else if (totalPaid > 0) status = 'partial';

            await db.run("UPDATE tests SET advance_amount = ?, due_amount = ?, payment_status = ? WHERE test_id = ?", [totalPaid, due, status, masterId]);
            console.log(`Recalculated Totals for #${masterId}: Paid=${totalPaid}, Due=${due}, Status=${status}`);

        } catch (e) {
            await db.run('ROLLBACK');
            console.error(`Failed to merge ${dup.test_uid}:`, e.message);
        }
    }

    console.log("Cleanup finished.");
    process.exit(0);
}

repairTests();
