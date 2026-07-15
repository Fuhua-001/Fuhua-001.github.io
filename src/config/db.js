/**
 * @file db.js
 * @description จัดการการเชื่อมต่อฐานข้อมูล PostgreSQL ผ่านไลบรารี 'pg' (node-postgres)
 * รวมถึงสร้าง Adapter เพื่อแปลงคำสั่ง SQL แบบ MySQL ให้สามารถทำงานบน PostgreSQL ได้
 */

// 1. Built-in / External Libraries
const { Pool } = require('pg');
require('dotenv').config();

// 2. Configuration
// โหลด DATABASE_URL จากไฟล์ .env (ลบช่องว่างที่อาจติดมาเพื่อป้องกัน error)
const dbUrl = (process.env.DATABASE_URL || "").replace(/\s+/g, "");

// สร้าง Connection Pool เพื่อแชร์ Connection ให้กับ Request ต่างๆ (ช่วยให้ไม่ต้องเชื่อมต่อ DB ใหม่ทุกครั้ง)
const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false } // อนุญาตให้เชื่อมต่อ SSL แบบไม่ตรวจสอบ Certificate (พบบ่อยในการพัฒนา/ใช้งานบน Cloud บางตัว)
});

// --- 3. Database Functions ---

/**
 * ฟังก์ชัน pgifyQuery: แปลงคำสั่ง SQL แบบ MySQL ให้เข้ากับ PostgreSQL
 * 
 * @description
 * เนื่องจากก่อนหน้านี้ระบบอาจใช้ MySQL แต่ตอนนี้เปลี่ยนมาใช้ PostgreSQL
 * ฟังก์ชันนี้จึงมีหน้าที่แปลง Syntax (Dialect) ให้ทำงานบน Postgres ได้โดยไม่ต้องรื้อแก้ SQL ทั้งระบบ
 * 
 * @param {string} sql - คำสั่ง SQL ตั้งต้นที่เป็นแบบ MySQL
 * @returns {string} - คำสั่ง SQL ที่แปลงเป็นรูปแบบ PostgreSQL แล้ว
 * 
 * @example
 * // Before (MySQL): SELECT * FROM users WHERE id = ?
 * // After (Postgres): SELECT * FROM users WHERE id = $1
 */
function pgifyQuery(sql) {
    let pgSql = sql;
    
    // แปลงฟังก์ชันหาปัจุบัน: MySQL CURDATE() -> Postgres CURRENT_DATE
    pgSql = pgSql.replace(/CURDATE\(\)/ig, 'CURRENT_DATE');
    
    // แปลงการบวกวัน: MySQL DATE_ADD(x, INTERVAL ? DAY) -> Postgres (x + (? || ' days')::interval)
    pgSql = pgSql.replace(/DATE_ADD\(([^,]+),\s*INTERVAL\s*\?\s*DAY\)/ig, "($1 + (? || ' days')::interval)");
    
    // แปลงตัวแปร (Parameterized query): MySQL ใช้ '?' -> Postgres ใช้ '$1', '$2', '$3'
    let i = 1;
    return pgSql.replace(/\?/g, () => `$${i++}`);
}

/**
 * ฟังก์ชัน adapterQuery: รันคำสั่ง SQL ผ่าน Pool หรือ Client
 * 
 * @description
 * รับหน้าที่ยิง SQL ไปที่ Postgres และจัดการรูปแบบผลลัพธ์ (Response) ให้เหมือนกับที่ MySQL (mysql2) ตอบกลับ
 * เพื่อไม่ให้กระทบโค้ดใน Controller ที่เขียนไว้ก่อนหน้านี้
 * 
 * @param {Object} clientOrPool - instance ของ Pool (ใช้งานทั่วไป) หรือ Client (ใช้งานตอนทำ Transaction)
 * @param {string} sql - คำสั่ง SQL ที่ส่งมาจาก Controller
 * @param {Array} params - (Optional) ตัวแปร (Bind parameters) ที่จะส่งเข้าไปใน Query
 * @returns {Promise<Array>} - 
 *   - ถ้าเป็น SELECT/SHOW: คืนค่า `[rows, fields]`
 *   - ถ้าเป็น INSERT/UPDATE/DELETE: คืนค่า `[{ insertId, affectedRows }]`
 */
async function adapterQuery(clientOrPool, sql, params) {
    // 1. นำ SQL ไปแปลง Syntax ให้เป็น Postgres ก่อน
    const pgSql = pgifyQuery(sql);
    let isInsert = pgSql.trim().toUpperCase().startsWith('INSERT');
    let finalSql = pgSql;
    
    // 2. สำหรับ Postgres ต้องเติม 'RETURNING id' ลงไปท้ายคำสั่ง INSERT เสมอ ถึงจะได้ ID (Primary Key) ที่เพิ่งสร้างกลับมา
    // (MySQL จะคืนค่า insertId ให้เลยโดยอัตโนมัติ)
    if (isInsert && !finalSql.toUpperCase().includes('RETURNING')) {
        finalSql += ' RETURNING id';
    }

    // 3. สั่ง Execute SQL 
    const res = await clientOrPool.query(finalSql, params);
    
    // 4. แปลงรูปแบบผลลัพธ์กลับให้เหมือนการใช้ MySQL
    if (res.command === 'SELECT' || res.command === 'SHOW') {
        return [res.rows, res.fields]; // [ ข้อมูล, รายละเอียดของคอลัมน์ ]
    }
    
    // ดึงค่า ID คืนมาถ้าเป็นการ Insert
    let insertId = res.rows.length > 0 ? res.rows[0].id : 0;
    return [{ insertId, affectedRows: res.rowCount }];
}

// 4. Exports
module.exports = {
    /**
     * สั่งรันคำสั่ง SQL ทั่วไป (เช่น SELECT, INSERT ธรรมดา)
     * ฟังก์ชันนี้จะใช้ Connection จาก Pool ส่วนกลางโดยอัตโนมัติ
     * @param {string} text - คำสั่ง SQL
     * @param {Array} params - ตัวแปร Parameter
     * @returns {Promise<Array>}
     */
    query: (text, params) => adapterQuery(pool, text, params),
    
    /**
     * ดึง Client (Connection) ออกมาจาก Pool แบบ Exclusive
     * @description
     * ใช้สำหรับจำลองการทำงานของ Transaction (ที่ต้องมี BEGIN/COMMIT/ROLLBACK) 
     * เพื่อให้คำสั่ง SQL หลายๆ ตัวทำงานอยู่ใน Session เดียวกัน
     * @returns {Promise<Object>} Object ที่มีฟังก์ชัน query(), release(), beginTransaction(), commit(), rollback()
     */
    getConnection: async () => {
        const client = await pool.connect(); // ขอเช่า Connection ออกมาจาก Pool 1 ตัว
        return {
            // ใช้ adapterQuery ส่ง client เข้าไปทำงาน
            query: (text, params) => adapterQuery(client, text, params),
            
            // เมื่อทำงานเสร็จต้องเรียก release เพื่อคืน Connection กลับเข้าสู่ Pool
            release: () => client.release(),
            
            // คำสั่งจำลองสำหรับเริ่มและสิ้นสุด Transaction
            beginTransaction: () => client.query('BEGIN'),
            commit: () => client.query('COMMIT'),
            rollback: () => client.query('ROLLBACK')
        };
    }
};
