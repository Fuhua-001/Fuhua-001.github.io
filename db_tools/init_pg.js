const fs = require('fs');
const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        const sql = fs.readFileSync('db_tools/schema_pg.sql', 'utf8');
        await client.query(sql);
        console.log('Successfully created tables in Supabase!');
    } catch (err) {
        console.error('Error creating tables:', err);
    } finally {
        await client.end();
    }
}

run();
