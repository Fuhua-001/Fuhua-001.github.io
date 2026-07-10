const db = require('./db.js');

async function test() {
    try {
        console.log("Connecting to db...");
        const res = await db.query('SELECT NOW()');
        console.log("DB Success:", res);
        
        console.log("Testing employees query...");
        const emp = await db.query('SELECT * FROM employees LIMIT 1');
        console.log("Emp:", emp);

        console.log("Done.");
    } catch (e) {
        console.error("DB Error:", e);
    }
}
test();
