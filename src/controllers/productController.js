/**
 * @file productController.js
 * @description Controller สำหรับจัดการข้อมูลสินค้าและบริการ (CRUD)
 * ดึงรายการ เพิ่ม แก้ไข และลบสินค้า
 */

// 1. Internal Modules
const db = require("../config/db");

/**
 * ดึงรายการสินค้าทั้งหมด
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - ส่งคืน Array ข้อมูลสินค้า
 */
exports.getProducts = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM products");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

/**
 * เพิ่มสินค้าใหม่เข้าระบบ
 * @param {Object} req 
 * @param {Object} res 
 */
exports.createProduct = async (req, res) => {
  try {
    const { code, name, unit, selling_price, purchase_price, status } = req.body;
    await db.query('INSERT INTO products (code, name, unit, selling_price, purchase_price, status) VALUES (?, ?, ?, ?, ?, ?)', [code, name, unit, selling_price, purchase_price, status || 'Active']);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed', details: err.message }); }
};

/**
 * แก้ไขข้อมูลสินค้า
 * @param {Object} req 
 * @param {Object} res 
 */
exports.updateProduct = async (req, res) => {
  try {
    const { code, name, unit, selling_price, purchase_price, status } = req.body;
    await db.query('UPDATE products SET code=?, name=?, unit=?, selling_price=?, purchase_price=?, status=? WHERE id=?', [code, name, unit, selling_price, purchase_price, status || 'Active', req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed', details: err.message }); }
};

/**
 * ลบสินค้าออกจากระบบ
 * @param {Object} req 
 * @param {Object} res 
 */
exports.deleteProduct = async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed', details: err.message }); }
};
