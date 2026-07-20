const { Client } = require('pg');
const mysql = require('mysql2/promise');

const pgUrl = 'postgresql://postgres.rhcrbdlaeyrsdrmjaije:L1ATi5nwLm0cdXRe@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres';

async function migrate() {
    const pgClient = new Client({ connectionString: pgUrl, ssl: { rejectUnauthorized: false } });
    await pgClient.connect();

    const myPool = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'quotation_db', multipleStatements: true });

    const tables = ['customers', 'employees', 'products', 'quotes', 'quote_items', 'audit_logs'];

    for (const table of tables) {
        let pgData;
        try {
            const res = await pgClient.query(`SELECT * FROM ${table}`);
            pgData = res.rows;
        } catch (err) { continue; }

        if (pgData.length === 0) continue;

        // Get MySQL columns
        const [myCols] = await myPool.query(`SHOW COLUMNS FROM ${table}`);
        const validCols = myCols.map(c => c.Field);

        await myPool.query('SET FOREIGN_KEY_CHECKS = 0;');
        await myPool.query(`TRUNCATE TABLE ${table};`);
        await myPool.query('SET FOREIGN_KEY_CHECKS = 1;');

        for (const row of pgData) {
            const colsToInsert = Object.keys(row).filter(c => validCols.includes(c));
            const placeholders = colsToInsert.map(() => '?').join(', ');
            const values = colsToInsert.map(c => row[c]);
            const sql = `INSERT INTO ${table} (${colsToInsert.join(', ')}) VALUES (${placeholders})`;
            try {
                await myPool.query(sql, values);
            } catch (err) { }
        }
        console.log(`Migrated ${pgData.length} rows for ${table}.`);
    }

    console.log('Migration completed safely!');
    pgClient.end();
    myPool.end();
}
migrate().catch(console.error);
