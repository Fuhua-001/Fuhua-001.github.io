CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(100),
    address_1 TEXT,
    code VARCHAR(50),
    pic_code VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    pic_code VARCHAR(50) UNIQUE NOT NULL,
    pic_name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(50),
    active_status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50),
    selling_price DECIMAL(15, 2) DEFAULT 0.00,
    purchase_price DECIMAL(15, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales_pr (
    id SERIAL PRIMARY KEY,
    doc_no VARCHAR(50) NOT NULL,
    doc_date DATE,
    pic_code VARCHAR(50),
    customer_code VARCHAR(50),
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(100),
    validity_date DATE,
    credit_days INT DEFAULT 30,
    transaction_type VARCHAR(100),
    payment_terms VARCHAR(100),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sub_sales_pr (
    id SERIAL PRIMARY KEY,
    sales_pr_id INT NOT NULL REFERENCES sales_pr(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(15, 2) DEFAULT 1.00,
    unit VARCHAR(50),
    unit_price DECIMAL(15, 2) DEFAULT 0.00,
    total_amount DECIMAL(15, 2) DEFAULT 0.00,
    vat_amount DECIMAL(15, 2) DEFAULT 0.00,
    net_amount DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(255),
    details TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
