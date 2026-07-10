const db = require('./db');

async function createStockTable() {
    try {
        console.log("Creating stock table...");
        
        const query = `
        CREATE TABLE IF NOT EXISTS stock (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(50) NOT NULL COMMENT 'รหัส',
            name VARCHAR(255) NOT NULL COMMENT 'ชื่อ',
            quantity DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'จำนวน',
            unit VARCHAR(50) COMMENT 'หน่วย',
            product_type_1 VARCHAR(100) COMMENT 'ประเภทสินค้า',
            product_type_2 VARCHAR(100) COMMENT 'ประเภทสินค้า2',
            barcode VARCHAR(100) COMMENT 'บาร์โค้ด',
            keywords TEXT COMMENT 'คีย์เวิร์ด (ครีเวิด)',
            status VARCHAR(50) DEFAULT 'Active' COMMENT 'สถานะ',
            brand VARCHAR(100) COMMENT 'แบรนด์',
            product_group VARCHAR(100) COMMENT 'กลุ่มสินค้า',
            received_date TIMESTAMP NULL DEFAULT NULL COMMENT 'วันที่รับเข้า',
            sold_out_date TIMESTAMP NULL DEFAULT NULL COMMENT 'วันที่ขายออก',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'วันที่แก้ไขล่าสุด'
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `;
        
        await db.query(query);
        console.log("Stock table created successfully with UTF-8 support.");
        
        process.exit(0);
    } catch (error) {
        console.error("Error creating stock table:", error);
        process.exit(1);
    }
}

createStockTable();
