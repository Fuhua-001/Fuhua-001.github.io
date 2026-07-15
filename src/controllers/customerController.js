/**
 * @file customerController.js
 * @description Controller สำหรับจัดการข้อมูลลูกค้า (CRUD: Create, Read, Update, Delete)
 * รับหน้าที่ดึงข้อมูล สร้าง แก้ไข และลบรายชื่อลูกค้าในระบบ
 */

// 1. Internal Modules
const db = require("../config/db");

/**
 * ดึงรายการลูกค้าทั้งหมด (จำกัด 200 รายการล่าสุดเพื่อลดภาระเซิร์ฟเวอร์)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - ส่งคืน Array ข้อมูลลูกค้าในรูปแบบ JSON
 */
exports.getCustomers = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM customers ORDER BY id DESC LIMIT 200");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customers", details: err.message });
  }
};

/**
 * สร้างข้อมูลลูกค้าใหม่
 * @param {Object} req - ข้อมูลลูกค้าใน req.body
 * @param {Object} res 
 */
exports.createCustomer = async (req, res) => {
  try {
    const { name, code, contact_person, phone, email, address_1, pic_code, tax_id } = req.body;
    await db.query('INSERT INTO customers (name, code, contact_person, phone, email, address_1, pic_code, tax_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [name, code, contact_person, phone, email, address_1, pic_code, tax_id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed', details: err.message }); }
};

/**
 * อัปเดตข้อมูลลูกค้า
 * @param {Object} req - ข้อมูลลูกค้าใน req.body, ไอดีลูกค้าใน req.params.id
 * @param {Object} res 
 */
exports.updateCustomer = async (req, res) => {
  try {
    const { name, code, contact_person, phone, email, address_1, pic_code, tax_id } = req.body;
    await db.query('UPDATE customers SET name=?, code=?, contact_person=?, phone=?, email=?, address_1=?, pic_code=?, tax_id=? WHERE id=?', [name, code, contact_person, phone, email, address_1, pic_code, tax_id, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed', details: err.message }); }
};

/**
 * ลบข้อมูลลูกค้า
 * @param {Object} req - req.params.id
 * @param {Object} res 
 */
exports.deleteCustomer = async (req, res) => {
  try {
    await db.query('DELETE FROM customers WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed', details: err.message }); }
};
