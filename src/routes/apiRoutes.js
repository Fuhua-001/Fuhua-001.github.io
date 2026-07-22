/**
 * @file apiRoutes.js
 * @description รวบรวมและกำหนดเส้นทาง API (Endpoints) ทั้งหมดของโปรเจกต์
 * ทำหน้าที่เป็นเสมือน "พนักงานต้อนรับ" ที่คอยรับ Request จากหน้าบ้าน (Frontend)
 * แล้วส่งต่อไปให้ Controller ที่เกี่ยวข้องเป็นคนจัดการ (Business Logic)
 */

// 1. Built-in / External Libraries
const express = require("express");
const router = express.Router();

// 2. Internal Modules (Controllers)
const aiController = require("../controllers/aiController");
const customerController = require("../controllers/customerController");
const employeeController = require("../controllers/employeeController");
const productController = require("../controllers/productController");
const dashboardController = require("../controllers/dashboardController");
const quoteController = require("../controllers/quoteController");

// --- 3. API Routes Configuration ---

/**
 * 🤖 AI Routes (สำหรับฟีเจอร์ AI Assistant)
 * ใช้ HTTP POST เพื่อส่ง Prompt หรือข้อความยาวๆ ไปให้ AI ประมวลผล
 */
router.post("/ai-detect-mode", aiController.detectMode); // วิเคราะห์ว่าผู้ใช้ต้องการทำอะไร (สร้างบิล, เพิ่มลูกค้า, เพิ่มสินค้า ฯลฯ)
router.post("/ai-customer", aiController.aiCustomer); // ให้ AI ดึงข้อมูลลูกค้าใหม่จากข้อความ
router.post("/ai-employee", aiController.aiEmployee); // ให้ AI ดึงข้อมูลพนักงานใหม่จากข้อความ
router.post("/ai-product", aiController.aiProduct); // ให้ AI ดึงข้อมูลสินค้าใหม่จากข้อความ

/**
 * 📄 Quote Routes (ระบบใบเสนอราคา)
 */
router.post("/generate-quote", quoteController.generateQuote); // ให้ AI สร้างโครงสร้างใบเสนอราคา
router.post("/save-quote", quoteController.saveQuote); // บันทึกข้อมูลใบเสนอราคาลง Database
router.get("/quote/:id", quoteController.getQuote); // ดึงข้อมูลใบเสนอราคารายใบ (ตาม ID)
router.get("/history", quoteController.getHistory); // ดึงประวัติการทำใบเสนอราคาทั้งหมด

/**
 * 📊 Dashboard Routes (สถิติและประวัติการใช้งาน)
 */
router.get("/dashboard-stats", dashboardController.getDashboardStats); // ดึงข้อมูลสถิติไปโชว์หน้า Dashboard (เช่น ยอดขายรวม, จำนวนบิล)
router.get("/audit_logs", dashboardController.getAuditLogs); // ดึงประวัติการเคลื่อนไหวของระบบ (ใคร ทำอะไร เมื่อไหร่)

/**
 * 👥 Customers (ระบบจัดการข้อมูลลูกค้า)
 * ใช้โครงสร้างแบบ RESTful API (GET, POST, PUT, DELETE)
 */
router.get("/customers", customerController.getCustomers);
router.post("/customers", customerController.createCustomer);
router.put("/customers/:id", customerController.updateCustomer);
router.delete("/customers/:id", customerController.deleteCustomer);

/**
 * 📦 Products (ระบบจัดการข้อมูลสินค้าคงคลัง)
 */
router.get("/products", productController.getProducts);
router.post("/products", productController.createProduct);
router.put("/products/:id", productController.updateProduct);
router.delete("/products/:id", productController.deleteProduct);

/**
 * 👔 Employees (ระบบจัดการข้อมูลพนักงาน/เซลส์)
 */
router.get("/employees", employeeController.getEmployees);
router.post("/employees", employeeController.createEmployee);
router.put("/employees/:id", employeeController.updateEmployee);
router.delete("/employees/:id", employeeController.deleteEmployee);

// 4. Exports
module.exports = router;
