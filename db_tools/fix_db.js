const db = require('../src/config/db');

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
        ('CA001', 'เธเธฃเธดเธฉเธฑเธ— เธชเธขเธฒเธกเน€เธ—เธ เธญเธดเธเนเธเน€เธงเธเธฑเนเธ เธเธณเธเธฑเธ”', 'PIC-TH01', '0105566778899', 'Siam Group', 'Customer Credit', 
         'เธชเธกเธเธฒเธข เนเธเธ”เธต', '123/45 เธ–เธเธเธชเธธเธเธธเธกเธงเธดเธ— เนเธเธงเธเธเธฅเธญเธเน€เธ•เธข', 'somchai@siamtech.co.th', '02-111-2222', 
         'เธชเธกเธเธฒเธข (MD: 081-123-4567), เธชเธกเธซเธเธดเธ (เธเธฑเธเธเธต: 082-987-6543)', 'เธฅเธนเธเธเนเธฒเธฃเธฒเธขเนเธซเธเน เธเนเธฒเธขเธ•เธฃเธเน€เธงเธฅเธฒ', 'Admin', 'เธเธฅเธญเธเน€เธ•เธข', 
         'เธเธฃเธธเธเน€เธ—เธเธกเธซเธฒเธเธเธฃ', 'เนเธเธเธฃเธฐเน€เธ—เธจ', 'Website', 'เธ เธฒเธเธเธฅเธฒเธ', 30, 500000.00, 'Technology', 
         'SiamTech (Thailand) Co., Ltd.', 'เน€เธเนเธเธเธฒเธขเธชเธดเธเธเนเธฒเธฃเธฐเธ”เธฑเธ Enterprise', 'B2B', 'Tech', 'BKK-Central'),
        
        ('CA002', 'เธเธฃเธดเธฉเธฑเธ— เธงเธตเธเธนเนเธ”เธชเน เธเธญเธฃเนเธเธญเน€เธฃเธเธฑเนเธ เธเธณเธเธฑเธ”', 'PIC-TH02', '0105577889900', 'VFoods', 'Customer Cash', 
         'เธงเธดเธเธฑเธข เธฃเธฑเธเธ”เธต', '99 เธซเธกเธนเน 1 เธ–เธเธเธเธฒเธเธเธฒ-เธ•เธฃเธฒเธ”', 'wichai@vfoods.com', '02-333-4444', 
         'เธงเธดเธเธฑเธข (เธเธฑเธ”เธเธทเนเธญ: 083-444-5555)', 'เธเธทเนเธญเธเธฃเธฐเธเธณเธ—เธธเธเน€เธ”เธทเธญเธ', 'Admin', 'เธเธฒเธเธเธฅเธต', 
         'เธชเธกเธธเธ—เธฃเธเธฃเธฒเธเธฒเธฃ', 'เนเธเธเธฃเธฐเน€เธ—เธจ', 'Referral', 'เธ เธฒเธเธ•เธฐเธงเธฑเธเธญเธญเธ', 0, 100000.00, 'Food & Beverage', 
         'V-Foods Corp.', 'เธเธญเธเธเธญเธเธญเธเนเธ–เธกเนเธฅเธฐเธชเนเธงเธเธฅเธ”เธเธดเน€เธจเธฉ', 'B2B', 'Food', 'East'),
        
        ('CA003', 'เธฃเนเธฒเธเธเธญเธกเธเธดเธงเน€เธ•เธญเธฃเน เนเธญเธ—เธตเธเนเธญเธ', 'PIC-TH03', '3102233445566', 'IT Shop', 'Customer Credit', 
         'เธชเธกเน€เธเธตเธขเธฃเธ•เธด เธขเธญเธ”เน€เธขเธตเนเธขเธก', '55/6 เธ–เธเธเน€เธเธตเธขเธเนเธซเธกเน-เธฅเธณเธเธฒเธ', 'somkiat@itshop.net', '053-111-222', 
         'เธชเธกเน€เธเธตเธขเธฃเธ•เธด (เน€เธเนเธฒเธเธญเธ: 085-111-2222)', 'เธฅเธนเธเธเนเธฒเธ•เนเธฒเธเธเธฑเธเธซเธงเธฑเธ” เธขเธญเธ”เธชเธฑเนเธเธเธฒเธเธเธฅเธฒเธ', 'Admin', 'เน€เธกเธทเธญเธเน€เธเธตเธขเธเนเธซเธกเน', 
         'เน€เธเธตเธขเธเนเธซเธกเน', 'เนเธเธเธฃเธฐเน€เธ—เธจ', 'Social Media', 'เธ เธฒเธเน€เธซเธเธทเธญ', 15, 200000.00, 'Retail', 
         'IT Shop (Chiang Mai)', 'เธเธฑเธ”เธชเนเธเธเนเธฒเธเธเธฃเธดเธฉเธฑเธ—เธเธเธชเนเธเน€เธญเธเธเธเธเธฃเธฐเธเธณ', 'B2C', 'Retail', 'North'),
        
        ('CA004', 'Global Trading Inc.', 'PIC-EN01', 'US9988776655', 'Global Partners', 'Customer Credit', 
         'John Smith', '789 Business Parkway, NY', 'john@globaltrading.com', '+1-555-1234', 
         'John (Purchasing: +1-555-1111), Sarah (Finance)', 'เธฅเธนเธเธเนเธฒเธเธณเน€เธเนเธฒเธชเนเธเธญเธญเธ', 'Admin', 'New York', 
         'New York', 'เธ•เนเธฒเธเธเธฃเธฐเน€เธ—เธจ', 'Exhibition', 'International', 60, 2000000.00, 'Trading', 
         'Global Trading USA', 'เธเธณเธฃเธฐเน€เธเธดเธเธเนเธฒเธ T/T เธฅเนเธงเธเธซเธเนเธฒ', 'B2B', 'Import/Export', 'USA'),
        
        ('P0001', 'เธเธฃเธดเธฉเธฑเธ— เธญเธธเธเธเธฃเธ“เนเธชเธณเธเธฑเธเธเธฒเธเนเธ—เธข เธเธณเธเธฑเธ”', 'PIC-VN01', '0105544332211', 'Thai Office', 'Vendor', 
         'เธชเธกเธจเธฃเธต เธฃเธฑเธเธเธฒเธ', '44/5 เธ–เธเธเธฃเธฑเธเธ”เธฒเธ เธดเน€เธฉเธ', 'somsri@thaioffice.co.th', '02-555-6666', 
         'เธชเธกเธจเธฃเธต (เธเนเธฒเธขเธเธฒเธข: 089-000-1111)', 'เธเธนเนเธเธฒเธขเธญเธธเธเธเธฃเธ“เนเธเธญเธกเธเธดเธงเน€เธ•เธญเธฃเนเนเธฅเธฐเน€เธเธฃเธทเนเธญเธเนเธเนเธชเธณเธเธฑเธเธเธฒเธเนเธซเนเน€เธฃเธฒ', 'Admin', 'เธ”เธดเธเนเธ”เธ', 
         'เธเธฃเธธเธเน€เธ—เธเธกเธซเธฒเธเธเธฃ', 'เนเธเธเธฃเธฐเน€เธ—เธจ', 'Direct Contact', 'เธ เธฒเธเธเธฅเธฒเธ', 30, 0.00, 'Supplier', 
         'Thai Office Supply Co., Ltd.', 'เธ•เธดเธ”เธ•เนเธญเธชเธฑเนเธเธเธญเธเธ—เธธเธเธงเธฑเธเธ—เธตเน 15 เธเธญเธเน€เธ”เธทเธญเธ', 'Supplier', 'IT Equipment', 'BKK-North');
        `;
        
        await db.query(query);
        console.log("Mock data inserted successfully with UTF-8.");
        
        // 4. Update the comments to make sure they are UTF-8
        await db.query(`ALTER TABLE customers 
            MODIFY code VARCHAR(20) UNIQUE NOT NULL COMMENT 'เธฃเธซเธฑเธชเธฅเธนเธเธเนเธฒ/เธเธนเนเธเธฒเธข (CAxxx / Pxxxx)',
            MODIFY name VARCHAR(255) NOT NULL COMMENT 'เธเธทเนเธญเธฅเธนเธเธเนเธฒ/เธเธนเนเธเธฒเธข',
            MODIFY pic_code VARCHAR(50) COMMENT 'เธฃเธซเธฑเธช PIC',
            MODIFY tax_id VARCHAR(50) COMMENT 'เน€เธฅเธเธเธฃเธฐเธเธณเธ•เธฑเธงเธเธนเนเน€เธชเธตเธขเธ เธฒเธฉเธตเธญเธฒเธเธฃ',
            MODIFY group_name VARCHAR(100) COMMENT 'เธเธทเนเธญเธเธฅเธธเนเธก',
            MODIFY level_group VARCHAR(50) COMMENT 'เธเธทเนเธญเธเธฅเธธเนเธกเธฃเธฐเธ”เธฑเธเธฅเธนเธเธเนเธฒ/เธเธนเนเธเธฒเธข',
            MODIFY contact_person VARCHAR(255) COMMENT 'เธเธนเนเธ•เธดเธ”เธ•เนเธญ',
            MODIFY address_1 TEXT COMMENT 'เธ—เธตเนเธญเธขเธนเน 1',
            MODIFY email VARCHAR(255) COMMENT 'เธญเธตเน€เธกเธฅ',
            MODIFY phone VARCHAR(50) COMMENT 'เนเธ—เธฃเธจเธฑเธเธ—เน',
            MODIFY all_contacts TEXT COMMENT 'เธฃเธฒเธขเธเธทเนเธญเธเธนเนเธ•เธดเธ”เธ•เนเธญเธ—เธฑเนเธเธซเธกเธ”',
            MODIFY remark TEXT COMMENT 'เธซเธกเธฒเธขเน€เธซเธ•เธธ',
            MODIFY created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'เธงเธฑเธเธ—เธตเนเธชเธฃเนเธฒเธ',
            MODIFY created_by VARCHAR(100) COMMENT 'เธเธนเนเธชเธฃเนเธฒเธ',
            MODIFY updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'เธงเธฑเธเธ—เธตเนเนเธเนเนเธเธฅเนเธฒเธชเธธเธ”',
            MODIFY district VARCHAR(100) COMMENT 'เธญเธณเน€เธ เธญ',
            MODIFY province VARCHAR(100) COMMENT 'เธเธฑเธเธซเธงเธฑเธ”',
            MODIFY is_domestic VARCHAR(50) DEFAULT 'เนเธเธเธฃเธฐเน€เธ—เธจ' COMMENT 'เธฅเธนเธเธเนเธฒเนเธเธเธฃเธฐเน€เธ—เธจ/เธ•เนเธฒเธเธเธฃเธฐเน€เธ—เธจ',
            MODIFY lead_source VARCHAR(100) COMMENT 'เนเธซเธฅเนเธเธ—เธตเนเธกเธฒเธเธทเนเธญ',
            MODIFY sales_region VARCHAR(100) COMMENT 'เน€เธเธ•เธเธฒเธฃเธเธฒเธข',
            MODIFY credit_days INT DEFAULT 0 COMMENT 'เน€เธเธฃเธ”เธดเธ• (เธงเธฑเธ)',
            MODIFY credit_limit DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'เธงเธเน€เธเธดเธ',
            MODIFY industry_type VARCHAR(100) COMMENT 'เธเธฃเธฐเน€เธ เธ—เธญเธธเธ•เธชเธฒเธซเธเธฃเธฃเธก',
            MODIFY company_name_additional VARCHAR(255) COMMENT 'เธเธทเนเธญเธเธฃเธดเธฉเธฑเธ— (เน€เธเธดเนเธกเน€เธ•เธดเธก)',
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

