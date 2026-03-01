const { getLocalDb } = require('./src/config/sqlite');
async function test() {
    const localDb = await getLocalDb();
    const sqRows = await localDb.all("SELECT * FROM attendance WHERE patient_id=27");
    console.log(sqRows);
}
test();
