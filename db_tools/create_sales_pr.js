const db = require('./db');

async function createSalesPrTable() {
    try {
        console.log("Creating sales_pr table...");
        
        const query = `
        CREATE TABLE IF NOT EXISTS sales_pr (
            id INT AUTO_INCREMENT PRIMARY KEY,
            doc_date DATE COMMENT 'วันที่',
            doc_no VARCHAR(50) UNIQUE NOT NULL COMMENT 'เลขที่',
            pic_code VARCHAR(50) COMMENT 'PIC',
            customer_code VARCHAR(50) COMMENT 'ลูกค้า-ผู้ขาย',
            contact_person VARCHAR(255) COMMENT 'ผู้ติดต่อ',
            phone VARCHAR(50) COMMENT 'โทรศัพท์',
            additional_phone VARCHAR(50) COMMENT 'เบอร์ติดต่อเพิ่มเติม',
            validity_date DATE COMMENT 'กำหนดการยืนราคา',
            email VARCHAR(255) COMMENT 'Email',
            credit_days INT DEFAULT 0 COMMENT 'เครดิต (วัน)',
            transaction_type VARCHAR(100) COMMENT 'ประเภทธุรกรรม',
            payment_terms VARCHAR(255) COMMENT 'เงื่อนไขการชำระเงิน',
            created_by VARCHAR(100) COMMENT 'ผู้สร้าง',
            updated_by VARCHAR(100) COMMENT 'ผู้แก้ไขล่าสุด',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'วันที่สร้าง',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'วันที่แก้ไขล่าสุด'
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `;
        
        await db.query(query);
        console.log("Sales PR table created successfully with UTF-8 support.");
        
        process.exit(0);
    } catch (error) {
        console.error("Error creating sales_pr table:", error);
        process.exit(1);
    }
}

createSalesPrTable();
