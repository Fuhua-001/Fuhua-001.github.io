USE quotation_db;
ALTER TABLE customers 
MODIFY sales_remark TEXT COMMENT 'Sales Remark', 
MODIFY category VARCHAR(50) COMMENT 'Category',
MODIFY level_group VARCHAR(50) COMMENT 'ชื่อกลุ่มระดับลูกค้า/ผู้ขาย';
