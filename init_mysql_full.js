const mysql = require('mysql2/promise');

async function run() {
    const c = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', multipleStatements: true });
    
    await c.query('CREATE DATABASE IF NOT EXISTS quotation_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    await c.query('USE quotation_db;');
    
    const schema = `
    CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, tax_id VARCHAR(50), contact_person VARCHAR(255),
        phone VARCHAR(50), email VARCHAR(100), address_1 TEXT, code VARCHAR(50), pic_code VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY, pic_code VARCHAR(50) UNIQUE NOT NULL, pic_name VARCHAR(255) NOT NULL,
        contact_number VARCHAR(50), active_status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY, code VARCHAR(50) UNIQUE NOT NULL, name VARCHAR(255) NOT NULL,
        unit VARCHAR(50), selling_price DECIMAL(15, 2) DEFAULT 0.00, purchase_price DECIMAL(15, 2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'Active', stock_qty INT DEFAULT 100, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS quotes (
        id INT AUTO_INCREMENT PRIMARY KEY, customer_name VARCHAR(255) NOT NULL, total_amount DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, ai_prompt TEXT
    );
    CREATE TABLE IF NOT EXISTS quote_items (
        id INT AUTO_INCREMENT PRIMARY KEY, quote_id INT NOT NULL, description VARCHAR(255) NOT NULL,
        quantity INT NOT NULL, unit_price DECIMAL(10, 2) NOT NULL, total_price DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY, action VARCHAR(255), details TEXT, created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `;
    await c.query(schema);

    // Insert dummy data
    await c.query(`
    INSERT IGNORE INTO products (code, name, selling_price, stock_qty) VALUES 
    ('P001', 'ท่อสแตนเลส 304 ขนาด 1 นิ้ว', 500, 100),
    ('P002', 'ท่อสแตนเลส 316 ขนาด 2 นิ้ว', 1500, 50),
    ('P003', 'เหล็กแผ่นดำ 1.2 มม.', 1200, 200);
    
    INSERT IGNORE INTO employees (pic_code, pic_name) VALUES 
    ('EMP-001', 'สมชาย ใจดี'),
    ('EMP-002', 'สมศรี สุขสันต์');
    
    INSERT IGNORE INTO customers (name, contact_person, phone) VALUES 
    ('บริษัท เจริญกิจ จำกัด', 'คุณสมพงษ์', '081-222-3333'),
    ('บริษัท เอเชีย เมทัล จำกัด', 'คุณวิชัย', '089-999-8888');
    `);
    
    console.log('Database initialized successfully.');
    c.end();
}
run().catch(console.error);
