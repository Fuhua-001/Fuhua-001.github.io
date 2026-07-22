/**
 * @file employeeController.js
 * @description Controller สำหรับจัดการข้อมูลพนักงานและพนักงานขาย (CRUD)
 * ใช้สำหรับดึง, เพิ่ม, แก้ไข, และลบรายชื่อพนักงาน
 */

// 1. Internal Modules
const db = require("../config/db");

/**
 * ดึงรายการพนักงานทั้งหมด พร้อมสร้างตัวย่อ (keywords) สำหรับ UI
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - ส่งคืน Array ข้อมูลพนักงาน
 */
exports.getEmployees = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM employees");
    const processedRows = rows.map((row) => {
      // ดึงตัวอักษรตัวแรกของรหัสพนักงานมาทำเป็น keyword ไว้ใช้ Group ในฝั่ง UI (เช่น S สำหรับ S-001)
      if (row.pic_code && row.pic_code.length > 0) {
        row.keywords = row.pic_code.charAt(0).toUpperCase();
      }
      return row;
    });
    res.json(processedRows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch employees" });
  }
};

/**
 * เพิ่มพนักงานใหม่
 * @param {Object} req
 * @param {Object} res
 */
exports.createEmployee = async (req, res) => {
  try {
    const { pic_code, pic_name, pic_name_eng, contact_number, department } =
      req.body;
    const keywords =
      pic_code && pic_code.length > 0 ? pic_code.charAt(0).toUpperCase() : "";
    await db.query(
      "INSERT INTO employees (pic_code, pic_name, pic_name_eng, contact_number, department, keywords) VALUES (?, ?, ?, ?, ?, ?)",
      [
        pic_code,
        pic_name,
        pic_name_eng || null,
        contact_number,
        department || null,
        keywords,
      ],
    );
    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to add employee", details: err.message });
  }
};

/**
 * แก้ไขข้อมูลพนักงาน
 * @param {Object} req
 * @param {Object} res
 */
exports.updateEmployee = async (req, res) => {
  try {
    const { pic_code, pic_name, pic_name_eng, contact_number, department } =
      req.body;
    const keywords =
      pic_code && pic_code.length > 0 ? pic_code.charAt(0).toUpperCase() : "";
    await db.query(
      "UPDATE employees SET pic_code=?, pic_name=?, pic_name_eng=?, contact_number=?, department=?, keywords=? WHERE id=?",
      [
        pic_code,
        pic_name,
        pic_name_eng || null,
        contact_number,
        department || null,
        keywords,
        req.params.id,
      ],
    );
    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to update employee", details: err.message });
  }
};

/**
 * ลบพนักงาน
 * @param {Object} req
 * @param {Object} res
 */
exports.deleteEmployee = async (req, res) => {
  try {
    await db.query("DELETE FROM employees WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to delete employee", details: err.message });
  }
};
