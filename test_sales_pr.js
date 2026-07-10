const { Pool } = require('pg');
require('dotenv').config();

const p = new Pool({
    connectionString: process.env.DATABASE_URL.replace(/\s+/g, ''),
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const r1 = await p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sales_pr'");
        console.table(r1.rows);

        const r2 = await p.query("SELECT * FROM products LIMIT 5");
        console.table(r2.rows);

        // Try generating stock query without stock table to see if it really fails
        try {
            await p.query("SELECT SUM(quantity) FROM stock");
        } catch (e) {
            console.log("Stock table definitely missing:", e.message);
            // Create stock table
            await p.query(`
                CREATE TABLE IF NOT EXISTS stock (
                    id SERIAL PRIMARY KEY,
                    code VARCHAR(50) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    quantity DECIMAL(15, 2) DEFAULT 0.00,
                    unit VARCHAR(50),
                    product_type_1 VARCHAR(100),
                    product_type_2 VARCHAR(100),
                    barcode VARCHAR(100),
                    keywords TEXT,
                    status VARCHAR(50) DEFAULT 'Active',
                    brand VARCHAR(100),
                    product_group VARCHAR(100),
                    received_date TIMESTAMP NULL DEFAULT NULL,
                    sold_out_date TIMESTAMP NULL DEFAULT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log("Created stock table.");
        }
    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        p.end();
    }
}
run();
