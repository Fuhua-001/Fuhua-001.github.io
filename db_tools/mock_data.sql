USE quotation_db;

INSERT INTO customers (
    code, name, pic_code, tax_id, group_name, level_group, contact_person, address_1, 
    email, phone, all_contacts, remark, created_by, district, province, is_domestic, 
    lead_source, sales_region, credit_days, credit_limit, industry_type, 
    company_name_additional, sales_remark, type, category, area
) VALUES 
-- Customer 1
('CA001', 'บริษัท สยามเทค อินโนเวชั่น จำกัด', 'PIC-TH01', '0105566778899', 'Siam Group', 'Customer Credit', 
 'สมชาย ใจดี', '123/45 ถนนสุขุมวิท แขวงคลองเตย', 'somchai@siamtech.co.th', '02-111-2222', 
 'สมชาย (MD: 081-123-4567), สมหญิง (บัญชี: 082-987-6543)', 'ลูกค้ารายใหญ่ จ่ายตรงเวลา', 'Admin', 'คลองเตย', 
 'กรุงเทพมหานคร', 'ในประเทศ', 'Website', 'ภาคกลาง', 30, 500000.00, 'Technology', 
 'SiamTech (Thailand) Co., Ltd.', 'เน้นขายสินค้าระดับ Enterprise', 'B2B', 'Tech', 'BKK-Central'),

-- Customer 2
('CA002', 'บริษัท วีฟู้ดส์ คอร์ปอเรชั่น จำกัด', 'PIC-TH02', '0105577889900', 'VFoods', 'Customer Cash', 
 'วิชัย รักดี', '99 หมู่ 1 ถนนบางนา-ตราด', 'wichai@vfoods.com', '02-333-4444', 
 'วิชัย (จัดซื้อ: 083-444-5555)', 'ซื้อประจำทุกเดือน', 'Admin', 'บางพลี', 
 'สมุทรปราการ', 'ในประเทศ', 'Referral', 'ภาคตะวันออก', 0, 100000.00, 'Food & Beverage', 
 'V-Foods Corp.', 'ชอบขอของแถมและส่วนลดพิเศษ', 'B2B', 'Food', 'East'),

-- Customer 3
('CA003', 'ร้านคอมพิวเตอร์ ไอทีช็อป', 'PIC-TH03', '3102233445566', 'IT Shop', 'Customer Credit', 
 'สมเกียรติ ยอดเยี่ยม', '55/6 ถนนเชียงใหม่-ลำปาง', 'somkiat@itshop.net', '053-111-222', 
 'สมเกียรติ (เจ้าของ: 085-111-2222)', 'ลูกค้าต่างจังหวัด ยอดสั่งปานกลาง', 'Admin', 'เมืองเชียงใหม่', 
 'เชียงใหม่', 'ในประเทศ', 'Social Media', 'ภาคเหนือ', 15, 200000.00, 'Retail', 
 'IT Shop (Chiang Mai)', 'จัดส่งผ่านบริษัทขนส่งเอกชนประจำ', 'B2C', 'Retail', 'North'),

-- Customer 4
('CA004', 'Global Trading Inc.', 'PIC-EN01', 'US9988776655', 'Global Partners', 'Customer Credit', 
 'John Smith', '789 Business Parkway, NY', 'john@globaltrading.com', '+1-555-1234', 
 'John (Purchasing: +1-555-1111), Sarah (Finance)', 'ลูกค้านำเข้าส่งออก', 'Admin', 'New York', 
 'New York', 'ต่างประเทศ', 'Exhibition', 'International', 60, 2000000.00, 'Trading', 
 'Global Trading USA', 'ชำระเงินผ่าน T/T ล่วงหน้า', 'B2B', 'Import/Export', 'USA'),

-- Vendor 1 (Seller / ผู้ขาย)
('P0001', 'บริษัท อุปกรณ์สำนักงานไทย จำกัด', 'PIC-VN01', '0105544332211', 'Thai Office', 'Vendor', 
 'สมศรี รักงาน', '44/5 ถนนรัชดาภิเษก', 'somsri@thaioffice.co.th', '02-555-6666', 
 'สมศรี (ฝ่ายขาย: 089-000-1111)', 'ผู้ขายอุปกรณ์คอมพิวเตอร์และเครื่องใช้สำนักงานให้เรา', 'Admin', 'ดินแดง', 
 'กรุงเทพมหานคร', 'ในประเทศ', 'Direct Contact', 'ภาคกลาง', 30, 0.00, 'Supplier', 
 'Thai Office Supply Co., Ltd.', 'ติดต่อสั่งของทุกวันที่ 15 ของเดือน', 'Supplier', 'IT Equipment', 'BKK-North');
