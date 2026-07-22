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
    const { code, name, unit, selling_price, purchase_price, status } =
      req.body;
      
    if (!code || !name) {
      return res.status(400).json({ error: "Product code and name are required." });
    }
    
    await db.query(
      "INSERT INTO products (code, name, unit, selling_price, purchase_price, status) VALUES (?, ?, ?, ?, ?, ?)",
      [code, name, unit, selling_price, purchase_price, status || "Active"],
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed", details: err.message });
  }
};

/**
 * แก้ไขข้อมูลสินค้า
 * @param {Object} req
 * @param {Object} res
 */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, unit, selling_price, purchase_price, status } =
      req.body;

    // Validate required params
    if (!id) {
      return res.status(400).json({ error: "Product ID is required." });
    }

    if (!code || !name) {
      return res.status(400).json({ error: "Product code and name are required." });
    }

    const [result] = await db.query(
      "UPDATE products SET code=?, name=?, unit=?, selling_price=?, purchase_price=?, status=? WHERE id=?",
      [
        code,
        name,
        unit,
        selling_price,
        purchase_price,
        status || "Active",
        id,
      ],
    );

    // ตรวจสอบว่า UPDATE กระทบ row จริง
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed", details: err.message });
  }
};

/**
 * ลบสินค้าออกจากระบบ
 * @param {Object} req
 * @param {Object} res
 */
exports.deleteProduct = async (req, res) => {
  try {
    await db.query("DELETE FROM products WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed", details: err.message });
  }
};
