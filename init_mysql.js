const mysql = require('mysql2/promise');
const fs = require('fs');

async function run() {
    const connection = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', multipleStatements: true });
    
    console.log('Running schema.sql...');
    const schema = fs.readFileSync('db_tools/schema.sql', 'utf8');
    await connection.query(schema);
    
    console.log('Running mock_data.sql...');
    const mockData = fs.readFileSync('db_tools/mock_data.sql', 'utf8');
    await connection.query(mockData);
    
    console.log('Done!');
    connection.end();
}
run().catch(console.error);
