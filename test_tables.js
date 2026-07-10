const { Pool } = require('pg');
require('dotenv').config();

const p = new Pool({
    connectionString: process.env.DATABASE_URL.replace(/\s+/g, ''),
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const r1 = await p.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.table(r1.rows);
        
        const r2 = await p.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sub_sales_pr'");
        console.table(r2.rows);
    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        p.end();
    }
}
run();
