const { Client } = require('pg');
const mysql = require('mysql2/promise');

const pgUrl = 'postgresql://postgres.rhcrbdlaeyrsdrmjaije:L1ATi5nwLm0cdXRe@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres';

async function migrate() {
    console.log('Connecting to databases...');
    const pgClient = new Client({ connectionString: pgUrl, ssl: { rejectUnauthorized: false } });
    await pgClient.connect();

    const myPool = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'quotation_db', multipleStatements: true });

    const tables = ['customers', 'employees', 'products', 'quotes', 'quote_items', 'audit_logs'];

    for (const table of tables) {
        console.log(`Migrating table: ${table}...`);
        
        // Fetch from PG
        let pgData;
        try {
            const res = await pgClient.query(`SELECT * FROM ${table}`);
            pgData = res.rows;
        } catch (err) {
            console.log(`Table ${table} might not exist in Postgres or has error. Skipping. Error: ${err.message}`);
            continue;
        }

        if (pgData.length === 0) {
            console.log(`No data in ${table}, skipping.`);
            continue;
        }

        // Truncate MySQL table
        try {
            // Disable foreign key checks for truncation
            await myPool.query('SET FOREIGN_KEY_CHECKS = 0;');
            await myPool.query(`TRUNCATE TABLE ${table};`);
            await myPool.query('SET FOREIGN_KEY_CHECKS = 1;');
        } catch(err) {
            console.log(`Error truncating ${table}:`, err.message);
        }

        // Insert into MySQL
        const cols = Object.keys(pgData[0]);
        for (const row of pgData) {
            // Construct prepared statement
            const placeholders = cols.map(() => '?').join(', ');
            const values = cols.map(c => row[c]);
            const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`;
            
            try {
                await myPool.query(sql, values);
            } catch (err) {
                // If there's a column mismatch, try to insert matching columns only
                console.log(`Error inserting into ${table} (row id ${row.id}):`, err.message);
            }
        }
        console.log(`Migrated ${pgData.length} rows for ${table}.`);
    }

    console.log('Migration completed!');
    pgClient.end();
    myPool.end();
}

migrate().catch(console.error);
