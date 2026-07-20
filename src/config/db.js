/**
 * @file db.js
 * @description ไฟล์ตั้งค่าและเชื่อมต่อฐานข้อมูล MySQL
 * ทำหน้าที่สร้าง Connection Pool เพื่อให้แอปพลิเคชันสามารถทำ Database Query 
 * แบบใช้การเชื่อมต่อซ้ำได้เพื่อประสิทธิภาพสูงสุด
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// สร้าง Connection Pool แทนการเปิดการเชื่อมต่อใหม่ทุกครั้งที่มี request เข้ามา
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'quotation_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = {
    /**
     * ฟังก์ชันสำหรับการสั่งคิวรีข้อมูลทั่วไป (Shorthand Method)
     * @param {string} sql - คำสั่ง SQL
     * @param {Array} params - พารามิเตอร์ที่จะถูกใส่ลงใน Prepared Statement ป้องกัน SQL Injection
     * @returns {Promise<Array>} คืนค่าผลลัพธ์จากฐานข้อมูล (rows และ fields)
     */
    query: async (sql, params) => {
        return await pool.query(sql, params);
    },

    /**
     * ดึง Connection พิเศษออกจาก Pool 
     * @description ใช้สำหรับกระบวนการ Transaction ที่ต้องทำหลายคำสั่งรวดเดียว
     * (เช่น การบันทึกใบเสนอราคาพร้อมสินค้าย่อย) และต้อง commit/rollback เอง
     * @returns {Promise<Object>} Object MySQL Connection
     */
    getConnection: async () => {
        const connection = await pool.getConnection();
        return connection;
    }
};
