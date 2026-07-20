const mysql = require('mysql2/promise');
async function run() {
    const c = await mysql.createConnection({host:'localhost', user:'root', database:'quotation_db'});
    const [tables] = await c.query('SHOW TABLES');
    for (let t of tables) {
        const tableName = Object.values(t)[0];
        const [count] = await c.query(`SELECT COUNT(*) as c FROM ${tableName}`);
        const [idx] = await c.query(`SHOW INDEX FROM ${tableName}`);
        console.log(tableName, count[0].c, 'rows, Indexes:', idx.map(i => i.Key_name).join(', '));
    }
    c.end();
}
run();
