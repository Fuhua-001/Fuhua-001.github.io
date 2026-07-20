const mysql = require('mysql2/promise');
const { Client } = require('pg');

const pgUrl = 'postgresql://postgres.rhcrbdlaeyrsdrmjaije:L1ATi5nwLm0cdXRe@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres';

async function run() {
    const myPool = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'quotation_db', multipleStatements: true });
    
    // Create correct tables
    const schema = `
    CREATE TABLE IF NOT EXISTS sales_pr (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doc_no VARCHAR(50) NOT NULL,
        doc_date DATE,
        pic_code VARCHAR(50),
        customer_code VARCHAR(50),
        contact_person VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(100),
        validity_date DATE,
        credit_days INT DEFAULT 30,
        transaction_type VARCHAR(100),
        payment_terms VARCHAR(100),
        created_by VARCHAR(100),
        updated_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sub_sales_pr (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sales_pr_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        quantity DECIMAL(15, 2) DEFAULT 1.00,
        unit VARCHAR(50),
        unit_price DECIMAL(15, 2) DEFAULT 0.00,
        total_amount DECIMAL(15, 2) DEFAULT 0.00,
        vat_amount DECIMAL(15, 2) DEFAULT 0.00,
        net_amount DECIMAL(15, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sales_pr_id) REFERENCES sales_pr(id) ON DELETE CASCADE
    );
    `;
    await myPool.query(schema);

    // Migrate data from Postgres
    const pgClient = new Client({ connectionString: pgUrl, ssl: { rejectUnauthorized: false } });
    await pgClient.connect();

    for (const table of ['sales_pr', 'sub_sales_pr']) {
        const res = await pgClient.query(`SELECT * FROM ${table}`);
        if(res.rows.length === 0) continue;

        await myPool.query('SET FOREIGN_KEY_CHECKS = 0;');
        await myPool.query(`TRUNCATE TABLE ${table};`);
        await myPool.query('SET FOREIGN_KEY_CHECKS = 1;');

        const [myCols] = await myPool.query(`SHOW COLUMNS FROM ${table}`);
        const validCols = myCols.map(c => c.Field);

        for (const row of res.rows) {
            const colsToInsert = Object.keys(row).filter(c => validCols.includes(c));
            const placeholders = colsToInsert.map(() => '?').join(', ');
            const values = colsToInsert.map(c => {
                let v = row[c];
                if (v instanceof Date) {
                    return v.toISOString().slice(0, 19).replace('T', ' ');
                }
                return v;
            });
            const sql = `INSERT INTO ${table} (${colsToInsert.join(', ')}) VALUES (${placeholders})`;
            try {
                await myPool.query(sql, values);
            } catch (err) { console.log(err.message); }
        }
        console.log(`Migrated ${res.rows.length} rows for ${table}.`);
    }

    pgClient.end();
    myPool.end();
}
run().catch(console.error);
