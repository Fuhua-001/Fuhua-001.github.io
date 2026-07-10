const db = require('./db');

async function createSubSalesPrTable() {
    try {
        console.log("Creating sub_sales_pr table...");
        
        const query = `
        CREATE TABLE IF NOT EXISTS sub_sales_pr (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sales_pr_id INT NOT NULL COMMENT 'ID ของใบเสนอราคาหลัก (เชื่อมกับ sales_pr)',
            product_code VARCHAR(50) COMMENT 'สินค้า',
            product_name VARCHAR(255) COMMENT 'ชื่อสินค้า',
            specific_info TEXT COMMENT 'ข้อมูลจำเพาะ',
            quantity DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'จำนวน',
            unit VARCHAR(50) COMMENT 'หน่วย',
            unit_price DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'ราคาต่อหน่วย',
            amount DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'จำนวนเงิน',
            tax DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'ภาษี',
            total_amount DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'จำนวนเงินรวม',
            FOREIGN KEY (sales_pr_id) REFERENCES sales_pr(id) ON DELETE CASCADE
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `;
        
        await db.query(query);
        console.log("sub_sales_pr table created successfully with UTF-8 support.");
        
        process.exit(0);
    } catch (error) {
        console.error("Error creating sub_sales_pr table:", error);
        process.exit(1);
    }
}

createSubSalesPrTable();
