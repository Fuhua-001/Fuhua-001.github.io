const { Client } = require('pg');
const mysql = require('mysql2/promise');

const pgUrl = 'postgresql://postgres.rhcrbdlaeyrsdrmjaije:L1ATi5nwLm0cdXRe@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres';

function pgToMysqlType(pgType) {
    const t = pgType.toLowerCase();
    if (t.includes('character varying')) return 'VARCHAR(255)';
    if (t === 'text') return 'TEXT';
    if (t === 'integer') return 'INT';
    if (t === 'numeric') return 'DECIMAL(15,2)';
    if (t.includes('timestamp')) return 'TIMESTAMP NULL DEFAULT NULL';
    if (t === 'date') return 'DATE';
    if (t === 'boolean') return 'TINYINT(1)';
    return 'TEXT';
}

async function sync() {
    console.log('Connecting...');
    const pgClient = new Client({ connectionString: pgUrl, ssl: { rejectUnauthorized: false } });
    await pgClient.connect();

    const myPool = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'quotation_db', multipleStatements: true });

    const tables = ['customers', 'employees', 'products', 'sales_pr', 'sub_sales_pr', 'audit_logs'];

    await myPool.query('SET FOREIGN_KEY_CHECKS = 0;');

    for (const table of tables) {
        console.log(`Syncing schema for ${table}...`);
        await myPool.query(`DROP TABLE IF EXISTS ${table}`);

        const res = await pgClient.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = $1
            ORDER BY ordinal_position;
        `, [table]);
        
        const cols = res.rows;
        
        let createSql = `CREATE TABLE ${table} (\n`;
        let colDefs = [];
        for (const col of cols) {
            if (col.column_name === 'id') {
                colDefs.push(`  id INT AUTO_INCREMENT PRIMARY KEY`);
            } else {
                colDefs.push(`  ${col.column_name} ${pgToMysqlType(col.data_type)}`);
            }
        }
        createSql += colDefs.join(',\n') + '\n) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;';
        
        await myPool.query(createSql);

        const dataRes = await pgClient.query(`SELECT * FROM ${table} ORDER BY id ASC`);
        if (dataRes.rows.length === 0) continue;

        const validCols = cols.map(c => c.column_name);
        for (const row of dataRes.rows) {
            const colsToInsert = Object.keys(row).filter(c => validCols.includes(c));
            const placeholders = colsToInsert.map(() => '?').join(', ');
            const values = colsToInsert.map(c => {
                let v = row[c];
                if (v instanceof Date) return v.toISOString().slice(0, 19).replace('T', ' ');
                return v;
            });
            const sql = `INSERT INTO ${table} (${colsToInsert.join(', ')}) VALUES (${placeholders})`;
            try {
                await myPool.query(sql, values);
            } catch(e) {
                console.log('Error inserting row:', e.message);
            }
        }
        console.log(`Migrated ${dataRes.rows.length} rows for ${table}`);
    }

    await myPool.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('Sync complete!');
    pgClient.end();
    myPool.end();
}
sync().catch(console.error);
