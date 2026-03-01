const { getLocalDb } = require('./src/config/sqlite');
const pool = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function cleanupInquiryDuplicates() {
    console.log('Starting inquiry duplicate cleanup...');

    try {
        const db = await getLocalDb();
        
        // 1. Clear pending sync queue for inquiry operations to prevent re-syncing
        console.log('[1/5] Clearing pending inquiry sync queue...');
        await db.run(`
            DELETE FROM pending_sync_queue 
            WHERE body LIKE '%quick_inquiry%' OR body LIKE '%test_inquiry%'
        `);
        
        // 2. Get all inquiries from MySQL (source of truth)
        console.log('[2/5] Fetching inquiries from MySQL...');
        const [consultationInquiries] = await pool.queryRemote(
            'SELECT * FROM quick_inquiry WHERE branch_id = 1 ORDER BY created_at DESC'
        );
        const [testInquiries] = await pool.queryRemote(
            'SELECT * FROM test_inquiry WHERE branch_id = 1 ORDER BY created_at DESC'
        );
        
        console.log(`Found ${consultationInquiries.length} consultation inquiries and ${testInquiries.length} test inquiries in MySQL`);
        
        // 3. Clear SQLite inquiry tables
        console.log('[3/5] Clearing SQLite inquiry tables...');
        await db.run('DELETE FROM quick_inquiry');
        await db.run('DELETE FROM test_inquiry');
        
        // 4. Re-populate SQLite from MySQL data
        console.log('[4/5] Re-populating SQLite with MySQL data...');
        
        for (const row of consultationInquiries) {
            const cols = Object.keys(row);
            const vals = Object.values(row);
            const placeholders = cols.map(() => '?').join(', ');
            const colNames = cols.map(c => `"${c}"`).join(', ');
            
            await db.run(
                `INSERT OR REPLACE INTO quick_inquiry (${colNames}) VALUES (${placeholders})`,
                vals
            );
        }
        
        for (const row of testInquiries) {
            const cols = Object.keys(row);
            const vals = Object.values(row);
            const placeholders = cols.map(() => '?').join(', ');
            const colNames = cols.map(c => `"${c}"`).join(', ');
            
            await db.run(
                `INSERT OR REPLACE INTO test_inquiry (${colNames}) VALUES (${placeholders})`,
                vals
            );
        }
        
        console.log('SQLite tables repopulated successfully');
        
        // 5. Reset sync timestamps for inquiry tables
        console.log('[5/5] Resetting sync timestamps...');
        const syncStatusFile = path.join(__dirname, 'database/sync_status.json');
        
        if (fs.existsSync(syncStatusFile)) {
            const syncStatus = JSON.parse(fs.readFileSync(syncStatusFile, 'utf8'));
            
            // Reset timestamps for inquiry tables
            if (syncStatus.tables) {
                delete syncStatus.tables.quick_inquiry;
                delete syncStatus.tables.test_inquiry;
            }
            
            // Clear inquiry-related ID mappings (old local IDs are no longer valid)
            if (syncStatus.idMappings) {
                const newMappings = {};
                for (const [key, value] of Object.entries(syncStatus.idMappings)) {
                    if (!key.startsWith('quick_inquiry:') && !key.startsWith('test_inquiry:')) {
                        newMappings[key] = value;
                    }
                }
                syncStatus.idMappings = newMappings;
            }
            
            fs.writeFileSync(syncStatusFile, JSON.stringify(syncStatus, null, 2));
            console.log('Sync status reset for inquiry tables');
        }
        
        console.log('\n✅ Cleanup completed successfully!');
        console.log('Summary:');
        console.log(`- Consultation inquiries in SQLite: ${consultationInquiries.length}`);
        console.log(`- Test inquiries in SQLite: ${testInquiries.length}`);
        console.log('\nYou can now restart the server. The sync engine will maintain proper ID mappings going forward.');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    }
}

cleanupInquiryDuplicates();
