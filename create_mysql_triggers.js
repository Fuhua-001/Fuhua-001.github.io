const mysql = require('mysql2/promise');

async function applyTriggers() {
    const myPool = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'quotation_db', multipleStatements: true });

    const sql = `
-- Drop existing triggers
DROP TRIGGER IF EXISTS customer_audit_insert;
DROP TRIGGER IF EXISTS customer_audit_update;
DROP TRIGGER IF EXISTS customer_audit_delete;

DROP TRIGGER IF EXISTS product_audit_insert;
DROP TRIGGER IF EXISTS product_audit_update;
DROP TRIGGER IF EXISTS product_audit_delete;

DROP TRIGGER IF EXISTS employee_audit_insert;
DROP TRIGGER IF EXISTS employee_audit_update;
DROP TRIGGER IF EXISTS employee_audit_delete;

DROP TRIGGER IF EXISTS quotation_audit_insert;
DROP TRIGGER IF EXISTS quotation_audit_update;
DROP TRIGGER IF EXISTS quotation_audit_delete;

-- Customer Triggers
CREATE TRIGGER customer_audit_insert AFTER INSERT ON customers
FOR EACH ROW BEGIN
    INSERT INTO audit_logs (action_type, table_name, record_id, record_name, record_details, action_by)
    VALUES ('CREATE', 'ลูกค้า (Customers)', NEW.code, NEW.name, JSON_OBJECT('name', NEW.name, 'code', NEW.code, 'email', NEW.email), 'System');
END;

CREATE TRIGGER customer_audit_update AFTER UPDATE ON customers
FOR EACH ROW BEGIN
    INSERT INTO audit_logs (action_type, table_name, record_id, record_name, record_details, action_by)
    VALUES ('UPDATE', 'ลูกค้า (Customers)', NEW.code, NEW.name, CONCAT('Before: ', JSON_OBJECT('name', OLD.name, 'code', OLD.code), ' | After: ', JSON_OBJECT('name', NEW.name, 'code', NEW.code)), 'System');
END;

CREATE TRIGGER customer_audit_delete AFTER DELETE ON customers
FOR EACH ROW BEGIN
    INSERT INTO audit_logs (action_type, table_name, record_id, record_name, record_details, action_by)
    VALUES ('DELETE', 'ลูกค้า (Customers)', OLD.code, OLD.name, JSON_OBJECT('name', OLD.name, 'code', OLD.code), 'System');
END;

-- Product Triggers
CREATE TRIGGER product_audit_insert AFTER INSERT ON products
FOR EACH ROW BEGIN
    INSERT INTO audit_logs (action_type, table_name, record_id, record_name, record_details, action_by)
    VALUES ('CREATE', 'สินค้า (Products)', NEW.code, NEW.name, JSON_OBJECT('name', NEW.name, 'code', NEW.code, 'selling_price', NEW.selling_price), 'System');
END;

CREATE TRIGGER product_audit_update AFTER UPDATE ON products
FOR EACH ROW BEGIN
    INSERT INTO audit_logs (action_type, table_name, record_id, record_name, record_details, action_by)
    VALUES ('UPDATE', 'สินค้า (Products)', NEW.code, NEW.name, CONCAT('Before: ', JSON_OBJECT('name', OLD.name, 'code', OLD.code, 'selling_price', OLD.selling_price), ' | After: ', JSON_OBJECT('name', NEW.name, 'code', NEW.code, 'selling_price', NEW.selling_price)), 'System');
END;

CREATE TRIGGER product_audit_delete AFTER DELETE ON products
FOR EACH ROW BEGIN
    INSERT INTO audit_logs (action_type, table_name, record_id, record_name, record_details, action_by)
    VALUES ('DELETE', 'สินค้า (Products)', OLD.code, OLD.name, JSON_OBJECT('name', OLD.name, 'code', OLD.code), 'System');
END;
    `;
    
    await myPool.query(sql);
    console.log("Triggers created successfully in MySQL!");
    myPool.end();
}
applyTriggers().catch(console.error);
