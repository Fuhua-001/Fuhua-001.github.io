/**
 * @file app.js
 * @description ประกอบร่าง Express Application (ตั้งค่า Middleware, กำหนด Static Files และเชื่อมต่อ Router)
 * แยกไฟล์นี้ออกจาก server.js เพื่อให้สามารถนำ app ไปทำ Unit Test ได้โดยไม่ต้องรัน Server จริง
 */

// 1. Built-in / External Libraries
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// 2. Internal Modules
const apiRoutes = require("./routes/apiRoutes");

const app = express();

// --- 3. Middleware Configurations ---

// อนุญาตให้เรียก API ข้ามโดเมน (Cross-Origin Resource Sharing)
app.use(cors());

// ตีความหมาย Request Body ที่อยู่ในรูปแบบ JSON ให้กลายเป็น JavaScript Object (req.body)
app.use(express.json());

/**
 * เสิร์ฟไฟล์ Static จากโฟลเดอร์ public (เช่น HTML, CSS, JS, รูปภาพ)
 * การตั้งค่า: ปิด Cache ชั่วคราว (no-cache)
 * เหตุผล (Why): เพื่อให้มั่นใจว่าเมื่อมีการแก้ไขไฟล์หน้าบ้าน (Frontend) ระบบจะดึงไฟล์เวอร์ชันล่าสุดเสมอระหว่างการพัฒนา
 * // TODO: หากขึ้น production ควรลบการตั้งค่า header เหล่านี้ออก และให้ Browser จัดการเรื่อง Cache ตามปกติเพื่อเพิ่มประสิทธิภาพ
 */
app.use(
  express.static(path.join(__dirname, "../public"), {
    etag: false,
    maxAge: 0,
    setHeaders: (res, reqPath) => {
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    },
  }),
);

// --- 4. Routing ---

// นำเข้า Routing ทั้งหมดของระบบ และกำหนด Prefix URL ให้เริ่มต้นด้วย /api เสมอ
// ตัวอย่าง: ไปที่หน้า /api/history จะไปเรียกใช้งาน apiRoutes
app.use("/api", apiRoutes);

// ส่งออกโครงสร้างของ app
module.exports = app;
