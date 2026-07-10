const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });
require('dotenv').config(); // Check both paths just in case

const dbUrl = (process.env.DATABASE_URL || "").replace(/\s+/g, "");

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

const sql = `
-- Customers
CREATE OR REPLACE FUNCTION log_customer_changes() RETURNS TRIGGER LANGUAGE PLPGSQL AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (action_type, table_name, record_id, record_name, record_details, action_by)
        VALUES ('CREATE', 'ลูกค้า (Customers)', NEW.code, NEW.name, row_to_json(NEW)::text, COALESCE(NEW.updated_by, 'System'));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (action_type, table_name, record_id, record_name, record_details, action_by)
        VALUES ('UPDATE', 'ลูกค้า (Customers)', NEW.code, NEW.name, 'Before: ' || row_to_json(OLD)::text || ' | After: ' || row_to_json(NEW)::text, COALESCE(NEW.updated_by, 'System'));
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (action_type, table_name, record_id, record_name, record_details, action_by)
        VALUES ('DELETE', 'ลูกค้า (Customers)', OLD.code, OLD.name, row_to_json(OLD)::text, COALESCE(OLD.updated_by, 'System'));
        RETURN OLD;
    END IF;
END;
$$;
DROP TRIGGER IF EXISTS customer_audit ON customers;
CREATE TRIGGER customer_audit AFTER INSERT OR UPDATE OR DELETE ON customers FOR EACH ROW EXECUTE PROCEDURE log_customer_changes();

-- Products
CREATE OR REPLACE FUNCTION log_product_changes() RETURNS TRIGGER LANGUAGE PLPGSQL AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (action_type, table_name, record_id, record_name, record_details, action_by)
        VALUES ('CREATE', 'สินค้า (Products)', NEW.code, NEW.name, row_to_json(NEW)::text, COALESCE(NEW.updated_by, 'System'));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (action_type, table_name, record_id, record_name, record_details, action_by)
        VALUES ('UPDATE', 'สินค้า (Products)', NEW.code, NEW.name, 'Before: ' || row_to_json(OLD)::text || ' | After: ' || row_to_json(NEW)::text, COALESCE(NEW.updated_by, 'System'));
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (action_type, table_name, record_id, record_name, record_details, action_by)
        VALUES ('DELETE', 'สินค้า (Products)', OLD.code, OLD.name, row_to_json(OLD)::text, COALESCE(OLD.updated_by, 'System'));
        RETURN OLD;
    END IF;
END;
$$;
DROP TRIGGER IF EXISTS product_audit ON products;
CREATE TRIGGER product_audit AFTER INSERT OR UPDATE OR DELETE ON products FOR EACH ROW EXECUTE PROCEDURE log_product_changes();

-- Employees
CREATE OR REPLACE FUNCTION log_employee_changes() RETURNS TRIGGER LANGUAGE PLPGSQL AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (action_type, table_name, record_id, record_name, record_details, action_by)
        VALUES ('CREATE', 'พนักงาน (Employees)', NEW.pic_code, NEW.pic_name, row_to_json(NEW)::text, COALESCE(NEW.updated_by, 'System'));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (action_type, table_name, record_id, record_name, record_details, action_by)
        VALUES ('UPDATE', 'พนักงาน (Employees)', NEW.pic_code, NEW.pic_name, 'Before: ' || row_to_json(OLD)::text || ' | After: ' || row_to_json(NEW)::text, COALESCE(NEW.updated_by, 'System'));
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (action_type, table_name, record_id, record_name, record_details, action_by)
        VALUES ('DELETE', 'พนักงาน (Employees)', OLD.pic_code, OLD.pic_name, row_to_json(OLD)::text, COALESCE(OLD.updated_by, 'System'));
        RETURN OLD;
    END IF;
END;
$$;
DROP TRIGGER IF EXISTS employee_audit ON employees;
CREATE TRIGGER employee_audit AFTER INSERT OR UPDATE OR DELETE ON employees FOR EACH ROW EXECUTE PROCEDURE log_employee_changes();

-- Quotations
CREATE OR REPLACE FUNCTION log_quotation_changes() RETURNS TRIGGER LANGUAGE PLPGSQL AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (action_type, table_name, record_id, record_name, record_details, action_by)
        VALUES ('CREATE', 'ใบเสนอราคา (Quotations)', NEW.doc_no, NEW.customer_code, row_to_json(NEW)::text, COALESCE(NEW.updated_by, 'System'));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (action_type, table_name, record_id, record_name, record_details, action_by)
        VALUES ('UPDATE', 'ใบเสนอราคา (Quotations)', NEW.doc_no, NEW.customer_code, 'Before: ' || row_to_json(OLD)::text || ' | After: ' || row_to_json(NEW)::text, COALESCE(NEW.updated_by, 'System'));
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (action_type, table_name, record_id, record_name, record_details, action_by)
        VALUES ('DELETE', 'ใบเสนอราคา (Quotations)', OLD.doc_no, OLD.customer_code, row_to_json(OLD)::text, COALESCE(OLD.updated_by, 'System'));
        RETURN OLD;
    END IF;
END;
$$;
DROP TRIGGER IF EXISTS quotation_audit ON sales_pr;
CREATE TRIGGER quotation_audit AFTER INSERT OR UPDATE OR DELETE ON sales_pr FOR EACH ROW EXECUTE PROCEDURE log_quotation_changes();
`;

async function applyTriggers() {
  console.log("Applying triggers...");
  try {
    await pool.query(sql);
    console.log("Triggers applied successfully!");
  } catch (e) {
    console.error("Error applying triggers:", e);
  } finally {
    pool.end();
  }
}

applyTriggers();
