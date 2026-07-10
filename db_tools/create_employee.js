const db = require('./db');

async function createEmployeeTable() {
    try {
        console.log("Creating employees table...");
        
        const query = `
        CREATE TABLE IF NOT EXISTS employees (
            id INT AUTO_INCREMENT PRIMARY KEY,
            pic_code VARCHAR(50) UNIQUE NOT NULL COMMENT 'รหัสpic',
            pic_name VARCHAR(255) NOT NULL COMMENT 'ชื่อpic',
            pic_name_eng VARCHAR(255) COMMENT 'ชื่อภาษาอังกฤษpic',
            keywords TEXT COMMENT 'คีย์เวิร์ด (ครีเวิด)',
            department VARCHAR(100) COMMENT 'แผนก',
            contact_number VARCHAR(50) COMMENT 'เบอร์ติดต่อ',
            pcl_imag_url VARCHAR(255) COMMENT 'pcl_imag_url',
            remark_1 TEXT COMMENT 'หมายเหตุ1',
            remark_2 TEXT COMMENT 'หมายเหตุ2',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'วันที่สร้าง',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'วันที่แก้ไขล่าสุด'
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `;
        
        await db.query(query);
        console.log("Employees table created successfully with UTF-8 support.");
        
        process.exit(0);
    } catch (error) {
        console.error("Error creating employees table:", error);
        process.exit(1);
    }
}

createEmployeeTable();
