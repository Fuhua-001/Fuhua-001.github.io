const mysql = require('mysql2/promise');
const { Client } = require('pg');

const pgUrl = 'postgresql://postgres.rhcrbdlaeyrsdrmjaije:L1ATi5nwLm0cdXRe@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres';

async function run() {
    const myPool = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'quotation_db', multipleStatements: true });
    
    const pgClient = new Client({ connectionString: pgUrl, ssl: { rejectUnauthorized: false } });
    await pgClient.connect();

    const res = await pgClient.query('SELECT * FROM audit_logs');
    if (res.rows.length > 0) {
        await myPool.query('TRUNCATE TABLE audit_logs;');

        for (const row of res.rows) {
            // Map PG to MySQL
            const action = `${row.action_type || ''} ${row.table_name || ''}`.trim();
            const details = row.record_details || row.record_name || '';
            const created_by = row.action_by || 'System';
            
            let created_at = row.created_at;
            if (created_at instanceof Date) {
                created_at = created_at.toISOString().slice(0, 19).replace('T', ' ');
            } else {
                created_at = null;
            }

            const sql = 'INSERT INTO audit_logs (id, action, details, created_by, created_at) VALUES (?, ?, ?, ?, ?)';
            try {
                await myPool.query(sql, [row.id, action, details, created_by, created_at]);
            } catch (err) {
                console.log(err.message);
            }
        }
        console.log(`Migrated ${res.rows.length} rows for audit_logs with remapping.`);
    }

    pgClient.end();
    myPool.end();
}
run().catch(console.error);
