const fs = require('fs');
const { Client } = require('pg');
require('dotenv').config();

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();

        // Drop existing tables
        await client.query(`
          DROP TABLE IF EXISTS audit_logs CASCADE;
          DROP TABLE IF EXISTS sub_sales_pr CASCADE;
          DROP TABLE IF EXISTS sales_pr CASCADE;
          DROP TABLE IF EXISTS products CASCADE;
          DROP TABLE IF EXISTS customers CASCADE;
          DROP TABLE IF EXISTS employees CASCADE;
        `);

        // Recreate tables with exact matching schema
        await client.query(`
          CREATE TABLE employees (
            id SERIAL PRIMARY KEY,
            pic_code VARCHAR(50) UNIQUE NOT NULL,
            pic_name VARCHAR(255) NOT NULL,
            pic_name_eng VARCHAR(255),
            keywords TEXT,
            department VARCHAR(100),
            contact_number VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by VARCHAR(100),
            updated_by VARCHAR(100)
          );

          CREATE TABLE customers (
            id SERIAL PRIMARY KEY,
            code VARCHAR(20) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            pic_code VARCHAR(50),
            tax_id VARCHAR(50),
            level_group VARCHAR(50),
            contact_person VARCHAR(255),
            address_1 TEXT,
            email VARCHAR(255),
            phone VARCHAR(50),
            remark TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by VARCHAR(100),
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            district VARCHAR(100),
            province VARCHAR(100),
            credit_days INTEGER DEFAULT 0,
            industry_type VARCHAR(100),
            type VARCHAR(50),
            category VARCHAR(50),
            area VARCHAR(100),
            updated_by VARCHAR(100)
          );

          CREATE TABLE products (
            id SERIAL PRIMARY KEY,
            code VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            unit VARCHAR(50),
            purchase_price DECIMAL(15,2) DEFAULT 0.00,
            selling_price DECIMAL(15,2) DEFAULT 0.00,
            keywords TEXT,
            status VARCHAR(50) DEFAULT 'Active',
            brand VARCHAR(100),
            created_by VARCHAR(100),
            updated_by VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE sales_pr (
            id SERIAL PRIMARY KEY,
            doc_date DATE,
            doc_no VARCHAR(50) UNIQUE NOT NULL,
            pic_code VARCHAR(50),
            customer_code VARCHAR(50),
            contact_person VARCHAR(255),
            phone VARCHAR(50),
            validity_date DATE,
            email VARCHAR(255),
            credit_days INTEGER DEFAULT 0,
            transaction_type VARCHAR(100),
            payment_terms VARCHAR(255),
            created_by VARCHAR(100),
            updated_by VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE sub_sales_pr (
            id SERIAL PRIMARY KEY,
            sales_pr_id INTEGER REFERENCES sales_pr(id) ON DELETE CASCADE,
            product_code VARCHAR(50),
            product_name VARCHAR(255),
            specific_info TEXT,
            quantity DECIMAL(15,2) DEFAULT 0.00,
            unit VARCHAR(50),
            unit_price DECIMAL(15,2) DEFAULT 0.00,
            amount DECIMAL(15,2) DEFAULT 0.00,
            tax DECIMAL(15,2) DEFAULT 0.00,
            total_amount DECIMAL(15,2) DEFAULT 0.00
          );

          CREATE TABLE audit_logs (
            id SERIAL PRIMARY KEY,
            action_type VARCHAR(50) NOT NULL,
            table_name VARCHAR(50) NOT NULL,
            record_id VARCHAR(100) NOT NULL,
            record_name VARCHAR(255),
            record_details TEXT,
            action_by VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);

        console.log('Successfully created tables in Supabase!');
    } catch (err) {
        console.error('Error creating tables:', err);
    } finally {
        await client.end();
    }
}

run();
