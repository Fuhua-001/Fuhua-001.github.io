/**
 * @file quoteController.js
 * @description Controller หลักสำหรับจัดการระบบใบเสนอราคา (Quotation)
 * ครอบคลุมตั้งแต่การใช้ AI ตีความคำสั่ง (generateQuote),
 * การบันทึกข้อมูลแบบ Transaction (saveQuote), และการดูประวัติ (getHistory)
 */

// 1. Internal Modules
const db = require("../config/db");
const ai = require("../config/ai");

// --- Constants ---
const VAT_RATE = 0.07; // ภาษีมูลค่าเพิ่ม 7%

/**
 * สร้างใบเสนอราคาด้วย AI (Google Gemini)
 *
 * @description
 * ฟังก์ชันนี้ทำงานแบบ "RAG" (Retrieval-Augmented Generation) เบื้องต้น
 * โดยจะไปดึงรายชื่อลูกค้า และรายการสินค้าที่มีอยู่ในสต็อก (Stock > 0) มาก่อน
 * แล้วแนบข้อมูลนี้ไปพร้อมกับ Prompt ของผู้ใช้ เพื่อบังคับให้ AI เลือกชื่อลูกค้าและสินค้า
 * ให้ตรงกับฐานข้อมูลจริงเท่านั้น (ลดปัญหา AI คิดชื่อขึ้นมาเอง หรือ Hallucination)
 *
 * @param {Object} req - Express Request object
 * @param {Object} req.body - ต้องมีตัวแปร `prompt` ส่งมาจาก Frontend
 * @param {Object} res - Express Response object
 * @returns {Promise<void>} - ส่งคืน JSON สรุปโครงสร้างบิล (Customer, Items, Warnings)
 */
exports.generateQuote = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    // ดึงข้อมูลบริบทจาก DB เพื่อส่งเป็น Context ให้ AI ป้องกันการมั่ว (Hallucination)
    const [customers] = await db.query("SELECT name FROM customers LIMIT 50");
    const stockQuery = `
            SELECT p.name, p.selling_price, p.unit,
                   COALESCE((SELECT SUM(quantity) FROM stock WHERE code = p.code), 0) as stock_qty
            FROM products p 
            WHERE p.status = 'Active'
            AND COALESCE((SELECT SUM(quantity) FROM stock WHERE code = p.code), 0) > 0
            LIMIT 50
        `;
    const [products] = await db.query(stockQuery);

    const customerList = customers.map((c) => c.name).join(", ");
    const productList = products
      .map(
        (p) =>
          `${p.name} (ราคาขาย: ${p.selling_price} บาท, หน่วย: ${p.unit || "ชิ้น"}, จำนวนสต็อก: ${p.stock_qty})`,
      )
      .join("\n");

    const systemPrompt = `You are an Enterprise Quotation Generation AI.\n        \n        Here is the data from our company database:\n        [Existing Customers]: ${customerList}\n        [Available Products in Stock & Standard Prices]:\n        ${productList}\n\n        Instructions:\n        1. Try to match the customer name in the prompt to one of the [Existing Customers]. If it matches partially, use the full official name from the database.\n        2. Match the requested items to the [Available Products in Stock]. You MUST ONLY use products from this list. Use the exact standard price.\n        3. ONLY include products that the user EXPLICITLY requested. DO NOT add any extra products or assume the user wants all of them.\n        4. Do NOT exceed the available stock quantity for any product. If a user asks for more than the stock, reduce the quantity to the maximum available stock.\n        5. If the item is NOT in the database, DO NOT include it. Never invent products or guess prices.\n        6. FINAL RECHECK: Before responding, verify that every item you included exists in the [Available Products in Stock] list, the price is exactly as stated, and the quantity is within the stock limit.\n        7. VERY IMPORTANT: If the user explicitly asks for ANY product that is NOT in the [Available Products in Stock], you MUST add the requested product's name to the "missing_products" array.\n        8. CAUTION ON QUANTITY (CRITICAL): The numbers '304', '316', and '316L' are Stainless Steel GRADES, NOT quantities! Never put 304 or 316 as the 'quantity' unless the user explicitly requested 304 pieces. Always look for words like 'อย่างละ 10 ชิ้น' or 'เอา 20 อัน' to determine the true quantity.\n        9. CHAIN OF THOUGHT: You MUST use a <thought> block to analyze the request step-by-step BEFORE outputting the JSON. \n        Example:\n        <thought>\n        1. Customer: ACA -> matches 'ACA INDUSTRIAL...'\n        2. Item: 2 inch pipe -> Not found. Add to missing.\n        3. Item: 1 item -> Only add this 1 specific item requested.\n        </thought>\n        \`\`\`json\n        ...\n        \`\`\`\n        \n        Return strictly in JSON format matching this schema after the thought block:\n        {\n          "customer_name": "Matched Customer Name from DB or 'Unknown'",\n          "items": [\n            { "description": "Matched Product Name", "quantity": 1, "unit": "Matched Unit", "unit_price": 100 }\n          ],\n          "missing_products": ["Name of product requested but not found in stock"],\n          "warnings": []\n        }\n        Do not include markdown blocks or any other text. Only return valid JSON.`;

    let aiParsed;
    try {
      if (
        !ai ||
        !process.env.GEMINI_API_KEY ||
        process.env.GEMINI_API_KEY === "your_api_key_here"
      ) {
        throw new Error("AI API Key not configured.");
      }
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `${systemPrompt}\n\nUser Request: ${prompt}`,
      });
      let text = response.response.text();
      aiParsed = JSON.parse(text.replace(/```json/g, "").replace(/```/g, ""));
    } catch (e) {
      // Fallback: หาก AI พังหรือติดขัด ให้ใช้ logic พื้นฐานดึงข้อมูลจากสินค้าที่มี
      let matchedCustomer = "Unknown";
      for (let c of customers) {
        if (prompt.includes(c.name)) matchedCustomer = c.name;
      }

      let items = [];
      for (let p of products) {
        // Strict fallback logic: Ensure the user's prompt contains the full product name to prevent false positives
        if (prompt.toLowerCase().includes(p.name.toLowerCase())) {
          const qtyRegex = new RegExp(
            `(?:จำนวน|เอา)?\\s*(\\d+)\\s*(ชิ้น|เส้น|อัน|แผ่น|กล่อง|kg|เมตร|ท่อน|ม้วน)`,
            "i",
          );
          const match = prompt.match(qtyRegex);
          let qty = 1;

          if (match && match[1]) {
            qty = parseInt(match[1]);
          } else {
            const fallbackMatch = prompt.match(
              new RegExp(
                `${p.name.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}.*?(?<!304|316|316L)\\b(\\d+)\\b(?!\\s*(มม|นิ้ว|mm|inch))`,
              ),
            );
            if (fallbackMatch && fallbackMatch[1]) {
              qty = parseInt(fallbackMatch[1]);
            }
          }
          // ป้องกันความสับสนของชื่อเกรดสแตนเลส เช่น 304, 316 ที่บังเอิญถูกจับเป็นจำนวน
          if (qty === 304 || qty === 316 || qty === 430) qty = 1;

          items.push({
            description: p.name,
            quantity: qty || 1,
            unit_price: p.selling_price,
          });
        }
      }

      aiParsed = {
        customer_name: matchedCustomer,
        items,
        missing_products: [],
        warnings: [],
      };
    }

    const quoteData = aiParsed;
    if (!quoteData.warnings) quoteData.warnings = [];
    const verifiedItems = [];

    // รีเช็กความถูกต้องอีกครั้งหลัง AI ทำงานเสร็จ (Business Logic Validation)
    for (const item of quoteData.items) {
      const realProduct = products.find(
        (p) => p.name.toLowerCase() === item.description.toLowerCase(),
      );
      if (realProduct) {
        const finalQty = item.quantity;
        const finalPrice = realProduct.selling_price;

        if (finalQty > realProduct.stock_qty) {
          quoteData.warnings.push(
            `แจ้งเตือน: "${realProduct.name}" มีสต็อกคงเหลือ ${realProduct.stock_qty} ชิ้น แต่ขอ ${finalQty} ชิ้น กรุณาตรวจสอบจำนวนก่อนยืนยัน`,
          );
        }
        if (finalQty > 0) {
          verifiedItems.push({
            description: realProduct.name,
            quantity: finalQty,
            unit: realProduct.unit,
            unit_price: finalPrice,
          });
        }
      } else {
        quoteData.warnings.push(`ไม่พบสินค้า "${item.description}" ในระบบ`);
      }
    }

    if (
      quoteData.missing_products &&
      Array.isArray(quoteData.missing_products)
    ) {
      for (const missing of quoteData.missing_products) {
        quoteData.warnings.push(`ไม่พบสินค้า "${missing}" ในคลังสินค้าของเรา`);
      }
    }

    quoteData.items = verifiedItems;
    res.json(quoteData);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to generate quotation", details: error.message });
  }
};

/**
 * บันทึกใบเสนอราคา (สร้างใหม่หรืออัปเดตของเดิม)
 *
 * @description
 * ฟังก์ชันนี้รับข้อมูลที่ผู้ใช้ยืนยัน (หรือมาจาก AI โดยตรง)
 * เพื่อนำไปบันทึกลงฐานข้อมูล โดยใช้ระบบ Transaction เพื่อรับประกันว่า
 * ข้อมูลส่วนหัว (sales_pr) และส่วนรายการสินค้า (sub_sales_pr) จะถูกบันทึกสำเร็จพร้อมกัน
 *
 * @param {Object} req - Express Request object
 * @param {Object} req.body - ข้อมูลใบเสนอราคา
 * @param {string} req.body.customer_name - ชื่อลูกค้า
 * @param {number} req.body.total_amount - ยอดรวม
 * @param {Array} req.body.items - รายการสินค้าที่ต้องการเสนอราคา
 * @param {string} req.body.ai_prompt - ข้อความตั้งต้นจาก AI (ถ้ามี)
 * @param {number|string} req.body.credit_days - เครดิตเทอม (วัน)
 * @param {string} req.body.payment_terms - เงื่อนไขการชำระเงิน
 * @param {string} req.body.pic_code - รหัสพนักงานขาย (PIC)
 * @param {number} req.body.id - (Optional) ID ของใบเสนอราคาเดิม หากต้องการอัปเดต
 *
 * @param {Object} res - Express Response object
 * @returns {Promise<void>} - ส่งคืนผลลัพธ์เป็น JSON { success, quoteId, doc_no }
 */
exports.saveQuote = async (req, res) => {
  try {
    const {
      customer_name,
      total_amount,
      items,
      ai_prompt,
      credit_days,
      payment_terms,
      pic_code,
    } = req.body;
    const finalCreditDays = credit_days ? parseInt(credit_days) : 30;
    const finalPaymentTerms = payment_terms || "Cash/Transfer";

    // Defensive Check: ป้องกัน Frontend ส่ง items ว่างมา ทำให้พังตอนทำ Loop และกิน Connection ฟรี
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cannot save quotation without any items." });
    }

    // 1. ตรวจสอบข้อมูลลูกค้าจากฐานข้อมูล เพื่อดึงข้อมูลการติดต่อมาใส่ในบิล
    const [customerRows] = await db.query(
      "SELECT code, email, phone, pic_code, contact_person FROM customers WHERE name = ? OR contact_person = ? LIMIT 1",
      [customer_name, customer_name],
    );
    let c_code = null,
      c_email = null,
      c_phone = null,
      c_pic = pic_code || "EMP-001",
      c_contact = customer_name;

    if (customerRows.length > 0) {
      c_code = customerRows[0].code;
      c_email = customerRows[0].email;
      c_phone = customerRows[0].phone;
      // หากไม่มีการบังคับเลือกเซลส์ ให้ใช้เซลส์ประจำตัวลูกค้า (ถ้ามี)
      if (!pic_code) c_pic = customerRows[0].pic_code || "EMP-001";
      c_contact = customer_name.trim();
    }

    // 2. ขอ Connection พิเศษจาก Pool เพื่อเริ่มกระบวนการ Transaction
    // เหตุผล: ป้องกันข้อมูลค้างหรือแหว่ง (เช่น บันทึก Header ผ่าน แต่ Detail Error)
    const conn = await db.getConnection();
    await conn.beginTransaction();

    let salesPrId;
    try {
      if (req.body.id) {
        // --- กรณี: อัปเดตใบเสนอราคาเดิม (Update) ---
        salesPrId = req.body.id;
        await conn.query(
          `UPDATE sales_pr 
           SET pic_code=?, customer_code=?, contact_person=?, phone=?, email=?,
               validity_date=DATE_ADD(CURDATE(), INTERVAL ? DAY), credit_days=?, payment_terms=?, updated_by='Sales Team', updated_at=NOW()
           WHERE id = ?`,
          [
            c_pic,
            c_code,
            c_contact,
            c_phone,
            c_email,
            finalCreditDays,
            finalCreditDays,
            finalPaymentTerms,
            salesPrId,
          ],
        );
        // ลบรายการสินค้าของเก่าทิ้งทั้งหมดก่อน แล้วเดี๋ยว insert ใหม่ (เป็นวิธีที่ง่ายกว่าการไล่เช็คแก้ไข/ลบทีละบรรทัด)
        await conn.query(`DELETE FROM sub_sales_pr WHERE sales_pr_id = ?`, [
          salesPrId,
        ]);
      } else {
        // --- กรณี: สร้างใบเสนอราคาใหม่ (Insert) ---
        // เปลี่ยนเป็นการนับ Running Number ตามปี/เดือน (เช่น PR-2310-001)
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const prefix = `PR-${year}${month}-`;

        const [lastDocRows] = await conn.query(
          `SELECT doc_no FROM sales_pr WHERE doc_no LIKE ? ORDER BY id DESC LIMIT 1`,
          [`${prefix}%`],
        );

        let nextNumber = 1;
        if (lastDocRows.length > 0) {
          const lastNumberStr = lastDocRows[0].doc_no.replace(prefix, "");
          const lastNumber = parseInt(lastNumberStr, 10);
          if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
          }
        }

        const doc_no = `${prefix}${nextNumber.toString().padStart(3, "0")}`;
        const [result] = await conn.query(
          `INSERT INTO sales_pr 
                (doc_no, doc_date, pic_code, customer_code, contact_person, 
                phone, email, validity_date, credit_days, transaction_type, payment_terms, 
                created_by, updated_by, created_at, updated_at) 
                VALUES (?, CURDATE(), ?, ?, ?, ?, ?, DATE_ADD(CURDATE(), 
                INTERVAL ? DAY), ?, 'Quotation', ?, 'Sales Team', 'Sales Team', NOW(), NOW())`,
          [
            doc_no,
            c_pic,
            c_code,
            c_contact,
            c_phone,
            c_email,
            finalCreditDays,
            finalCreditDays,
            finalPaymentTerms,
          ],
        );
        salesPrId = result.insertId;
      }

      // 3. บันทึกรายการสินค้าทีละรายการ (Insert Details)
      const itemQueries = items.map(async (item) => {
        const rowTotal = item.quantity * item.unit_price;

        // พยายามดึงรหัสและหน่วยสินค้ามาตรฐานจากฐานข้อมูล
        const [productRows] = await conn.query(
          "SELECT code, unit FROM products WHERE name = ? LIMIT 1",
          [item.description],
        );
        const p_code = productRows.length > 0 ? productRows[0].code : null;
        const p_unit =
          productRows.length > 0 ? productRows[0].unit || "ชิ้น" : "ชิ้น";

        await conn.query(
          `INSERT INTO sub_sales_pr 
                  (sales_pr_id, product_code, product_name, specific_info, quantity, unit, unit_price, amount, tax, total_amount) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            salesPrId,
            p_code,
            item.description,
            ai_prompt || "",
            item.quantity,
            p_unit,
            item.unit_price,
            rowTotal,
            rowTotal * VAT_RATE,
            rowTotal * (1 + VAT_RATE),
          ],
        );
      });

      // รอให้คำสั่งบันทึกรายการสินค้าทั้งหมดทำงานเสร็จ
      await Promise.all(itemQueries);

      // 4. ยืนยันการบันทึก (Commit)
      await conn.commit();
    } catch (txErr) {
      // หากเกิดข้อผิดพลาดตรงไหนก็ตาม ยกเลิกสิ่งที่ทำมาทั้งหมดใน Transaction นี้ทันที (Rollback)
      await conn.rollback();
      throw txErr;
    } finally {
      // คืน Connection กลับสู่ Pool เสมอ (สำคัญมาก ไม่คืนเดี๋ยวเว็บค้าง)
      conn.release();
    }

    // 5. ค้นหาเลขที่เอกสารเพื่อส่งกลับไปให้หน้าบ้าน
    let finalDocNo = "";
    try {
      const [prRows] = await db.query(
        "SELECT doc_no FROM sales_pr WHERE id = ?",
        [salesPrId],
      );
      if (prRows.length > 0) finalDocNo = prRows[0].doc_no;
    } catch (e) {}

    res.json({ success: true, quoteId: salesPrId, doc_no: finalDocNo });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to save quotation", details: error.message });
  }
};

/**
 * ดึงข้อมูลใบเสนอราคารายใบ (ตาม ID)
 *
 * @description
 * สำหรับนำไปแสดงผลบนหน้า Preview หรือหน้าแก้ไข (Edit Mode)
 * โดยจะ Join ข้อมูลพนักงาน (Employees) เพื่อเอาชื่อเซลส์ไปแสดงใน PDF ด้วย
 *
 * @param {Object} req - Express Request object
 * @param {Object} res - Express Response object
 */
exports.getQuote = async (req, res) => {
  try {
    const [headerRows] = await db.query(
      `
      SELECT sp.*, e.pic_name 
      FROM sales_pr sp 
      LEFT JOIN employees e ON sp.pic_code = e.pic_code 
      WHERE sp.id = ?
    `,
      [req.params.id],
    );

    if (headerRows.length === 0)
      return res.status(404).json({ error: "Quote not found" });

    // ดึงรายการสินค้าย่อยทั้งหมดที่อยู่ในบิลใบนี้
    const [itemRows] = await db.query(
      "SELECT * FROM sub_sales_pr WHERE sales_pr_id = ?",
      [req.params.id],
    );

    res.json({
      quote: {
        id: headerRows[0].id,
        customer_name: headerRows[0].contact_person,
        customer_code: headerRows[0].customer_code,
        doc_no: headerRows[0].doc_no,
        doc_date: headerRows[0].doc_date,
        credit_days: headerRows[0].credit_days,
        payment_terms: headerRows[0].payment_terms,
        pic_code: headerRows[0].pic_code,
        pic_name: headerRows[0].pic_name,
        phone: headerRows[0].phone,
        email: headerRows[0].email,
      },
      items: itemRows.map((i) => ({
        description: i.product_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        unit: i.unit,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch quote" });
  }
};

/**
 * ดึงประวัติใบเสนอราคาทั้งหมด (สำหรับแสดงผลแบบตารางในหน้า History)
 *
 * @description
 * ฟังก์ชันนี้รวบรวมใบเสนอราคาทั้งหมด พร้อมหาผลรวมมูลค่า (SUM) จากตารางลูก (sub_sales_pr)
 * โดยใช้คำสั่ง GROUP BY เพื่อลดภาระของระบบ (แก้ไขปัญหา N+1 Query)
 *
 * @param {Object} req - Express Request object
 * @param {Object} res - Express Response object
 */
exports.getHistory = async (req, res) => {
  try {
    // ใช้ LEFT JOIN และ GROUP BY เพื่อหาผลรวม (total_amount) ของแต่ละบิลใน Query เดียว
    // ดีกว่าการวนลูป Query ย่อย (N+1) ซึ่งจะทำให้ฐานข้อมูลทำงานหนัก
    const query = `
            SELECT s.id, s.doc_no, s.contact_person as customer_name, s.doc_date, s.created_at, 
                   COALESCE(SUM(sub.total_amount), 0) as total_amount,
                   e.pic_name as salesperson
            FROM sales_pr s
            LEFT JOIN employees e ON s.pic_code = e.pic_code
            LEFT JOIN sub_sales_pr sub ON s.id = sub.sales_pr_id
            GROUP BY s.id, s.doc_no, s.contact_person, s.doc_date, s.created_at, e.pic_name
            ORDER BY s.id DESC
        `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
};
