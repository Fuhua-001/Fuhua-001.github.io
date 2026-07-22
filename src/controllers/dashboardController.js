/**
 * @file dashboardController.js
 * @description Controller สำหรับจัดการและดึงข้อมูลสถิติของ Dashboard
 * ทำหน้าที่ประมวลผลสรุปยอดรวม (Aggregations) และสถิติต่างๆ เพื่อแสดงผลหน้าแรก
 */

// 1. Internal Modules
const db = require("../config/db");

/**
 * ดึงข้อมูลภาพรวม (Stats) ทั้งหมดในครั้งเดียว
 *
 * @description
 * ฟังก์ชันนี้รวบรวมข้อมูลหลายส่วน (ยอดขาย, ออเดอร์, ลูกค้า, กราฟรายเดือน)
 * โดยใช้ `Promise.all` เพื่อให้ Query วิ่งขนานกัน (Parallel) ซึ่งเร็วกว่าการรอให้เสร็จทีละอัน
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @returns {Promise<void>} - ส่งคืน JSON สรุปสถิติทั้งหมด
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // ใช้ Promise.all เพื่อ Query ข้อมูลหลายๆ ส่วนพร้อมกัน ช่วยลดเวลา Latency ได้มาก (N+1 Optimization)
    const [
      salesResRaw,
      quotesResRaw,
      customersResRaw,
      productsResRaw,
      monthlyResRaw,
    ] = await Promise.all([
      db.query(
        "SELECT COALESCE(SUM(amount), 0) as total_sales FROM sub_sales_pr",
      ),
      db.query("SELECT COUNT(*) as total_quotes FROM sales_pr"),
      db.query("SELECT COUNT(*) as total_customers FROM customers"),
      db.query("SELECT COUNT(*) as total_products FROM products"),
      db.query(`
        SELECT EXTRACT(MONTH FROM sp.doc_date) as month, SUM(ssp.amount) as total
        FROM sales_pr sp
        JOIN sub_sales_pr ssp ON sp.id = ssp.sales_pr_id
        WHERE EXTRACT(YEAR FROM sp.doc_date) = EXTRACT(YEAR FROM CURRENT_DATE)
        GROUP BY EXTRACT(MONTH FROM sp.doc_date)
        ORDER BY month
      `),
    ]);

    const salesRows = Array.isArray(salesResRaw[0])
      ? salesResRaw[0]
      : salesResRaw.rows || salesResRaw || [];
    const quotesRows = Array.isArray(quotesResRaw[0])
      ? quotesResRaw[0]
      : quotesResRaw.rows || quotesResRaw || [];
    const customersRows = Array.isArray(customersResRaw[0])
      ? customersResRaw[0]
      : customersResRaw.rows || customersResRaw || [];
    const productsRows = Array.isArray(productsResRaw[0])
      ? productsResRaw[0]
      : productsResRaw.rows || productsResRaw || [];
    const monthlyRows = Array.isArray(monthlyResRaw[0])
      ? monthlyResRaw[0]
      : monthlyResRaw.rows || monthlyResRaw || [];

    // สร้าง Array เก็บยอดขาย 12 เดือน (Index 0-11) ไว้สำหรับให้ Chart.js นำไปแสดงผลง่ายๆ
    let monthly_sales = Array(12).fill(0);
    if (monthlyRows && Array.isArray(monthlyRows)) {
      monthlyRows.forEach((row) => {
        // Postgres EXTRACT ฟังก์ชันจะคืนค่าเป็น String หรือ Float ต้องลบ 1 เพื่อให้ตรงกับ Zero-indexed ของ Array
        const m = parseInt(row.month, 10) - 1;
        if (m >= 0 && m < 12) {
          monthly_sales[m] = parseFloat(row.total);
        }
      });
    }

    // หาลูกค้าที่มียอดสั่งซื้อสูงสุด 5 อันดับแรก
    let top_customers = [];
    try {
      const [topRes] = await db.query(`
        SELECT sp.contact_person as customer_name, SUM(ssp.amount) as total
        FROM sales_pr sp
        JOIN sub_sales_pr ssp ON sp.id = ssp.sales_pr_id
        GROUP BY sp.contact_person
        ORDER BY total DESC
        LIMIT 5
      `);
      top_customers = topRes || [];
    } catch (e) {
      top_customers = [];
    }

    // หาใบเสนอราคาที่เพิ่งถูกสร้างล่าสุด 5 รายการ
    let recent_quotes = [];
    try {
      const [recentRes] = await db.query(`
        SELECT sp.doc_no, sp.contact_person as customer_name, sp.doc_date,
               COALESCE(SUM(ssp.total_amount), 0) as total_amount
        FROM sales_pr sp
        LEFT JOIN sub_sales_pr ssp ON sp.id = ssp.sales_pr_id
        GROUP BY sp.id, sp.doc_no, sp.contact_person, sp.doc_date
        ORDER BY sp.created_at DESC
        LIMIT 5
      `);
      recent_quotes = recentRes || [];
    } catch (e) {
      recent_quotes = [];
    }

    const stats = {
      total_sales: salesRows[0]?.total_sales || 0,
      total_quotes: quotesRows[0]?.total_quotes || 0,
      total_customers: customersRows[0]?.total_customers || 0,
      total_products: productsRows[0]?.total_products || 0,
      monthly_sales: monthly_sales,
      top_customers: top_customers,
      recent_quotes: recent_quotes,
    };
    res.json(stats);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to load dashboard stats", details: err.message });
  }
};

/**
 * ดึงข้อมูลการแก้ไข (Audit Logs) ถ้ามี
 * (ใช้ try-catch ครอบไว้เผื่อตารางนี้ยังไม่มีใน Database เพื่อป้องกันระบบล่ม)
 * @param {Object} req
 * @param {Object} res
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100",
    );
    res.json(rows);
  } catch (err) {
    // หากไม่มีตารางนี้ คืนค่าเป็น Array ว่างอย่างปลอดภัย
    res.json([]);
  }
};
