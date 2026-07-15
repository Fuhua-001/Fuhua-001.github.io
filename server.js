/**
 * @file server.js
 * @description จุดเริ่มต้นของแอปพลิเคชัน (Entry Point) 
 * มีหน้าที่โหลด Environment Variables, นำเข้า Express App, และเปิด HTTP Server เพื่อรอรับ Request จาก Client
 */

// 1. Built-in / External Libraries
require("dotenv").config(); // โหลดตัวแปรสภาพแวดล้อมจากไฟล์ .env (เช่น PORT, DATABASE_URL)

// 2. Internal Modules
const app = require("./src/app"); // นำเข้า Express App ที่ประกอบ Middleware และ Router ไว้แล้ว

// 3. Configuration
const PORT = process.env.PORT || 3000; // ใช้ PORT จาก .env ถ้าไม่มีให้ใช้ 3000 แทน

/**
 * เงื่อนไข require.main === module
 * - ตรวจสอบว่าไฟล์นี้ถูกรันโดยตรงด้วยคำสั่ง `node server.js` หรือไม่
 * - ถ้าใช่ จะทำการเปิด HTTP Server (app.listen)
 * - ถ้าไม่ใช่ (เช่น ถูกเรียกใช้ในไฟล์ Unit Test ผ่าน require) จะไม่รัน Server ซ้ำ เพื่อป้องกันปัญหา Port in use
 */
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[SERVER] Running at http://localhost:${PORT}`);
  });
}

// ส่งออก app เพื่อใช้ในการรัน Test (Supertest) ในอนาคต
module.exports = app;
