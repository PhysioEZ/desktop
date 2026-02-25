const SyncService = require('../services/SyncService');

const TEST_TOKEN = '0f89e3a09848a6b0bb8ca315348e880e811ec0173ca1d60fcfa7c58044c521f4';

async function test() {
    console.log("Starting test sync...");
    try {
        await SyncService.initialSync(TEST_TOKEN);
        console.log("Test sync completed successfully!");
    } catch (err) {
        console.error("Test sync failed:", err);
    }
}

test();
