const xlsx = require('xlsx');
const db = require('./db');

async function importData() {
    try {
        console.log("Reading Excel file...");
        const workbook = xlsx.readFile('C:\\Users\\yatta\\Downloads\\table_data.xlsx');
        
        // --- 1. EMPLOYEES ---
        console.log("Importing Employees...");
        const empSheet = workbook.Sheets['empolyee'];
        const empData = xlsx.utils.sheet_to_json(empSheet);
        
        await db.query(`TRUNCATE TABLE employees;`);
        console.log("Employees table cleared.");
        
        for (const row of empData) {
            const picCode = (row['รหัสpic'] || '').trim();
            if (!picCode) continue;
            
            const picName = (row['ชื่อpic'] || '').trim();
            const picNameEng = (row['ชื่อภาษาอังกฤษpic'] || '').trim();
            const keywords = (row['ครีเวิด'] || '').trim();
            const department = (row['แผนก'] || '').trim();
            const contactNumber = (row['เบอร์ติดต่อ'] || '').trim();
            
            await db.query(
                `INSERT INTO employees (pic_code, pic_name, pic_name_eng, keywords, department, contact_number)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [picCode, picName, picNameEng, keywords, department, contactNumber]
            );
        }
        console.log(`Inserted ${empData.length} employees.`);
        
        // --- 2. CUSTOMERS ---
        console.log("Importing Customers...");
        const custSheet = workbook.Sheets['customer'];
        const custData = xlsx.utils.sheet_to_json(custSheet);
        
        await db.query(`TRUNCATE TABLE customers;`);
        console.log("Customers table cleared.");
        
        for (const row of custData) {
            const code = (row['รหัสลูกค้า/ผู้ขาย'] || '').toString().trim();
            if (!code) continue;
            
            const name = (row['ชื่อลูกค้า/ผู้ขาย'] || '').toString().trim();
            const picCode = (row['รหัส PIC'] || '').toString().trim();
            const taxId = (row['เลขประจำตัวผู้เสียภาษีอากรของลูกค้า/ผู้ขาย'] || '').toString().trim();
            const groupName = (row['ชื่อกลุ่มลูกค้า/ผู้ขาย'] || '').toString().trim();
            const levelGroup = (row['ชื่อกลุ่มระดับลูกค้า/ผู้ขาย'] || '').toString().trim();
            const contactPerson = (row['ผู้ติดต่อ'] || '').toString().trim();
            const address1 = (row['ที่อยู่ 1'] || '').toString().trim();
            const email = (row['อีเมล'] || '').toString().trim();
            const phone = (row['โทรศัพท์'] || '').toString().trim();
            const allContacts = (row['รายชื่อผู้ติดต่อทั้งหมด'] || '').toString().trim();
            const remark = (row['หมายเหตุ'] || '').toString().trim();
            const createdBy = (row['ผู้สร้าง'] || '').toString().trim();
            const district = (row['อำเภอ'] || '').toString().trim();
            const province = (row['จังหวัด'] || '').toString().trim();
            const isDomestic = (row['ลูกค้าในประเทศ/ต่างประเทศ'] || 'ในประเทศ').toString().trim();
            const leadSource = (row['แหล่งที่มาชื่อ'] || '').toString().trim();
            const salesRegion = (row['เขตการขาย'] || '').toString().trim();
            const creditDays = parseInt(row['เครดิต (วัน)']) || 0;
            const industryType = (row['ประเภทอุตสาหกรรมชื่อ'] || '').toString().trim();
            const companyAdditional = (row['ชื่อบริษัท (เพิ่มเติม)'] || '').toString().trim();
            const salesRemark = (row['Sales RemarB'] || row['Sales Remark'] || '').toString().trim();
            const type = (row['Type'] || '').toString().trim();
            const category = (row['Catagory'] || '').toString().trim();
            const area = (row['Area'] || '').toString().trim();
            
            await db.query(
                `INSERT INTO customers (
                    code, name, pic_code, tax_id, group_name, level_group, contact_person, address_1, 
                    email, phone, all_contacts, remark, created_by, district, province, is_domestic, 
                    lead_source, sales_region, credit_days, industry_type, 
                    company_name_additional, sales_remark, type, category, area
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    code, name, picCode, taxId, groupName, levelGroup, contactPerson, address1,
                    email, phone, allContacts, remark, createdBy, district, province, isDomestic,
                    leadSource, salesRegion, creditDays, industryType,
                    companyAdditional, salesRemark, type, category, area
                ]
            );
        }
        console.log(`Inserted ${custData.length} customers.`);
        
        console.log("Import completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Import failed:", err);
        process.exit(1);
    }
}

importData();
