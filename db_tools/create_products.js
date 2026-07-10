const db = require('./db');

async function createProductsTable() {
    try {
        console.log("Creating products table...");
        
        const query = `
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(50) UNIQUE NOT NULL COMMENT 'รหัส',
            name VARCHAR(255) NOT NULL COMMENT 'ชื่อ',
            specific_name VARCHAR(255) COMMENT 'ชื่อจำเพาะ',
            unit VARCHAR(50) COMMENT 'หน่วย',
            product_type_1 VARCHAR(100) COMMENT 'ประเภทสินค้า',
            product_type_2 VARCHAR(100) COMMENT 'ประเภทสินค้า2',
            purchase_price DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'ราคาซื้อ',
            selling_price DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'ราคาขาย',
            purchase_tax_rate DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'อัตราภาษีซื้อ',
            selling_tax_rate DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'อัตราภาษีขาย',
            barcode VARCHAR(100) COMMENT 'บาร์โค้ด',
            keywords TEXT COMMENT 'คีย์เวิร์ด (ครีเวิด)',
            limit_qty INT DEFAULT 0 COMMENT 'จำกัดจำนวน',
            status VARCHAR(50) DEFAULT 'Active' COMMENT 'สถานะ',
            brand VARCHAR(100) COMMENT 'แบรนด์',
            product_group VARCHAR(100) COMMENT 'กลุ่มสินค้า',
            created_by VARCHAR(100) COMMENT 'ผู้สร้าง',
            updated_by VARCHAR(100) COMMENT 'ผู้แก้ไขล่าสุด',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'วันที่สร้าง',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'วันที่แก้ไขล่าสุด',
            remark_1 TEXT COMMENT 'หมายเหตุ1',
            remark_2 TEXT COMMENT 'หมายเหตุ2'
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `;
        
        await db.query(query);
        console.log("Products table created successfully with UTF-8 support.");
        
        process.exit(0);
    } catch (error) {
        console.error("Error creating products table:", error);
        process.exit(1);
    }
}

createProductsTable();
