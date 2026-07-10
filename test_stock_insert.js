const { Pool } = require('pg');
require('dotenv').config();

const p = new Pool({
    connectionString: process.env.DATABASE_URL.replace(/\s+/g, ''),
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const [r] = await Promise.all([p.query("SELECT * FROM products")]);
        const products = r.rows;
        let count = 0;
        for (const prod of products) {
            await p.query("INSERT INTO stock (code, name, quantity, unit, status) VALUES ($1, $2, $3, $4, 'Active')", [prod.code, prod.name, 100, prod.unit]);
            count++;
        }
        console.log(`Inserted 100 stock for ${count} products.`);
    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        p.end();
    }
}
run();
