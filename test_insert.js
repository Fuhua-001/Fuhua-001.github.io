const db = require('./db.js');

async function testInsert() {
    try {
        console.log("Testing insert into audit_logs...");
        const res = await db.query("INSERT INTO audit_logs (action_type, table_name, record_id, action_by) VALUES ('TEST', 'test', '1', 'System')");
        console.log("Insert success:", res);
    } catch (e) {
        console.error("Insert failed:", e);
    }
}
testInsert();
