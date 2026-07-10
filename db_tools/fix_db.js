const db = require('./db');

async function fixDatabase() {
    try {
        console.log("Fixing Database Encoding...");
        
        // 1. Fix Database and Table Charset
        await db.query(`ALTER DATABASE quotation_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        await db.query(`ALTER TABLE customers CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        
        // 2. Clear corrupted data
        await db.query(`TRUNCATE TABLE customers;`);
        console.log("Table cleared.");

        // 3. Insert correct Thai data
        const query = `
        INSERT INTO customers (
            code, name, pic_code, tax_id, group_name, level_group, contact_person, address_1, 
            email, phone, all_contacts, remark, created_by, district, province, is_domestic, 
            lead_source, sales_region, credit_days, credit_limit, industry_type, 
            company_name_additional, sales_remark, type, category, area
        ) VALUES 
        ('CA001', 'บริษัท สยามเทค อินโนเวชั่น จำกัด', 'PIC-TH01', '0105566778899', 'Siam Group', 'Customer Credit', 
         'สมชาย ใจดี', '123/45 ถนนสุขุมวิท แขวงคลองเตย', 'somchai@siamtech.co.th', '02-111-2222', 
         'สมชาย (MD: 081-123-4567), สมหญิง (บัญชี: 082-987-6543)', 'ลูกค้ารายใหญ่ จ่ายตรงเวลา', 'Admin', 'คลองเตย', 
         'กรุงเทพมหานคร', 'ในประเทศ', 'Website', 'ภาคกลาง', 30, 500000.00, 'Technology', 
         'SiamTech (Thailand) Co., Ltd.', 'เน้นขายสินค้าระดับ Enterprise', 'B2B', 'Tech', 'BKK-Central'),
        
        ('CA002', 'บริษัท วีฟู้ดส์ คอร์ปอเรชั่น จำกัด', 'PIC-TH02', '0105577889900', 'VFoods', 'Customer Cash', 
         'วิชัย รักดี', '99 หมู่ 1 ถนนบางนา-ตราด', 'wichai@vfoods.com', '02-333-4444', 
         'วิชัย (จัดซื้อ: 083-444-5555)', 'ซื้อประจำทุกเดือน', 'Admin', 'บางพลี', 
         'สมุทรปราการ', 'ในประเทศ', 'Referral', 'ภาคตะวันออก', 0, 100000.00, 'Food & Beverage', 
         'V-Foods Corp.', 'ชอบขอของแถมและส่วนลดพิเศษ', 'B2B', 'Food', 'East'),
        
        ('CA003', 'ร้านคอมพิวเตอร์ ไอทีช็อป', 'PIC-TH03', '3102233445566', 'IT Shop', 'Customer Credit', 
         'สมเกียรติ ยอดเยี่ยม', '55/6 ถนนเชียงใหม่-ลำปาง', 'somkiat@itshop.net', '053-111-222', 
         'สมเกียรติ (เจ้าของ: 085-111-2222)', 'ลูกค้าต่างจังหวัด ยอดสั่งปานกลาง', 'Admin', 'เมืองเชียงใหม่', 
         'เชียงใหม่', 'ในประเทศ', 'Social Media', 'ภาคเหนือ', 15, 200000.00, 'Retail', 
         'IT Shop (Chiang Mai)', 'จัดส่งผ่านบริษัทขนส่งเอกชนประจำ', 'B2C', 'Retail', 'North'),
        
        ('CA004', 'Global Trading Inc.', 'PIC-EN01', 'US9988776655', 'Global Partners', 'Customer Credit', 
         'John Smith', '789 Business Parkway, NY', 'john@globaltrading.com', '+1-555-1234', 
         'John (Purchasing: +1-555-1111), Sarah (Finance)', 'ลูกค้านำเข้าส่งออก', 'Admin', 'New York', 
         'New York', 'ต่างประเทศ', 'Exhibition', 'International', 60, 2000000.00, 'Trading', 
         'Global Trading USA', 'ชำระเงินผ่าน T/T ล่วงหน้า', 'B2B', 'Import/Export', 'USA'),
        
        ('P0001', 'บริษัท อุปกรณ์สำนักงานไทย จำกัด', 'PIC-VN01', '0105544332211', 'Thai Office', 'Vendor', 
         'สมศรี รักงาน', '44/5 ถนนรัชดาภิเษก', 'somsri@thaioffice.co.th', '02-555-6666', 
         'สมศรี (ฝ่ายขาย: 089-000-1111)', 'ผู้ขายอุปกรณ์คอมพิวเตอร์และเครื่องใช้สำนักงานให้เรา', 'Admin', 'ดินแดง', 
         'กรุงเทพมหานคร', 'ในประเทศ', 'Direct Contact', 'ภาคกลาง', 30, 0.00, 'Supplier', 
         'Thai Office Supply Co., Ltd.', 'ติดต่อสั่งของทุกวันที่ 15 ของเดือน', 'Supplier', 'IT Equipment', 'BKK-North');
        `;
        
        await db.query(query);
        console.log("Mock data inserted successfully with UTF-8.");
        
        // 4. Update the comments to make sure they are UTF-8
        await db.query(`ALTER TABLE customers 
            MODIFY code VARCHAR(20) UNIQUE NOT NULL COMMENT 'รหัสลูกค้า/ผู้ขาย (CAxxx / Pxxxx)',
            MODIFY name VARCHAR(255) NOT NULL COMMENT 'ชื่อลูกค้า/ผู้ขาย',
            MODIFY pic_code VARCHAR(50) COMMENT 'รหัส PIC',
            MODIFY tax_id VARCHAR(50) COMMENT 'เลขประจำตัวผู้เสียภาษีอากร',
            MODIFY group_name VARCHAR(100) COMMENT 'ชื่อกลุ่ม',
            MODIFY level_group VARCHAR(50) COMMENT 'ชื่อกลุ่มระดับลูกค้า/ผู้ขาย',
            MODIFY contact_person VARCHAR(255) COMMENT 'ผู้ติดต่อ',
            MODIFY address_1 TEXT COMMENT 'ที่อยู่ 1',
            MODIFY email VARCHAR(255) COMMENT 'อีเมล',
            MODIFY phone VARCHAR(50) COMMENT 'โทรศัพท์',
            MODIFY all_contacts TEXT COMMENT 'รายชื่อผู้ติดต่อทั้งหมด',
            MODIFY remark TEXT COMMENT 'หมายเหตุ',
            MODIFY created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'วันที่สร้าง',
            MODIFY created_by VARCHAR(100) COMMENT 'ผู้สร้าง',
            MODIFY updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'วันที่แก้ไขล่าสุด',
            MODIFY district VARCHAR(100) COMMENT 'อำเภอ',
            MODIFY province VARCHAR(100) COMMENT 'จังหวัด',
            MODIFY is_domestic VARCHAR(50) DEFAULT 'ในประเทศ' COMMENT 'ลูกค้าในประเทศ/ต่างประเทศ',
            MODIFY lead_source VARCHAR(100) COMMENT 'แหล่งที่มาชื่อ',
            MODIFY sales_region VARCHAR(100) COMMENT 'เขตการขาย',
            MODIFY credit_days INT DEFAULT 0 COMMENT 'เครดิต (วัน)',
            MODIFY credit_limit DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'วงเงิน',
            MODIFY industry_type VARCHAR(100) COMMENT 'ประเภทอุตสาหกรรม',
            MODIFY company_name_additional VARCHAR(255) COMMENT 'ชื่อบริษัท (เพิ่มเติม)',
            MODIFY sales_remark TEXT COMMENT 'Sales Remark',
            MODIFY type VARCHAR(50) COMMENT 'Type',
            MODIFY category VARCHAR(50) COMMENT 'Category',
            MODIFY area VARCHAR(100) COMMENT 'Area'
        ;`);
        
        console.log("Table comments fixed.");
        process.exit(0);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

fixDatabase();
