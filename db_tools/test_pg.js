const { Client } = require('pg');

async function test(port) {
    const connStr = `postgresql://postgres.rhcrbdlaeyrsdrmjaije:L1ATi5nwLm0cdXRe@aws-0-ap-northeast-2.pooler.supabase.com:${port}/postgres`;
    const client = new Client({
        connectionString: connStr,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        const res = await client.query('SELECT NOW()');
        console.log(`Port ${port} success:`, res.rows[0]);
    } catch (e) {
        console.error(`Port ${port} failed:`, e.message);
    } finally {
        await client.end();
    }
}

async function run() {
    await test(6543);
    await test(5432);
}

run();
