const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

function pgifyQuery(sql) {
    let pgSql = sql;
    pgSql = pgSql.replace(/CURDATE\(\)/ig, 'CURRENT_DATE');
    pgSql = pgSql.replace(/DATE_ADD\(([^,]+),\s*INTERVAL\s*\?\s*DAY\)/ig, "($1 + (? || ' days')::interval)");
    let i = 1;
    return pgSql.replace(/\?/g, () => `$${i++}`);
}

async function adapterQuery(clientOrPool, sql, params) {
    const pgSql = pgifyQuery(sql);
    let isInsert = pgSql.trim().toUpperCase().startsWith('INSERT');
    let finalSql = pgSql;
    if (isInsert && !finalSql.toUpperCase().includes('RETURNING')) {
        finalSql += ' RETURNING id';
    }

    const res = await clientOrPool.query(finalSql, params);
    
    if (res.command === 'SELECT' || res.command === 'SHOW') {
        return [res.rows, res.fields];
    }
    
    let insertId = res.rows.length > 0 ? res.rows[0].id : 0;
    return [{ insertId, affectedRows: res.rowCount }];
}

module.exports = {
    query: (text, params) => adapterQuery(pool, text, params),
    getConnection: async () => {
        const client = await pool.connect();
        return {
            query: (text, params) => adapterQuery(client, text, params),
            release: () => client.release(),
            beginTransaction: () => client.query('BEGIN'),
            commit: () => client.query('COMMIT'),
            rollback: () => client.query('ROLLBACK')
        };
    }
};
