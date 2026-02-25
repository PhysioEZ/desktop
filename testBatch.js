const SyncService = require('./server/src/services/SyncService');
const BridgeService = require('./server/src/services/BridgeService');

async function test() {
    const token = '22f1d4bb1d8f7d7d655aafb6ce8d2d85';
    try {
        await SyncService.pushChanges(token);
        console.log("Done");
    } catch(e) { console.error("Error:", e); }
}
test();
