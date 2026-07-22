/**
 * @file aiController.js
 * @description Controller อัจฉริยะสำหรับจัดการฟีเจอร์ AI ทั้งหมด
 * ทำหน้าที่รับข้อความ (Prompt) จากผู้ใช้ ส่งไปให้ Google Gemini AI สกัดเป็นข้อมูลที่มีโครงสร้าง (JSON)
 * เพื่อนำไปบันทึกลงฐานข้อมูลได้อย่างแม่นยำ
 */

// 1. Internal Modules
const ai = require("../config/ai");
const db = require("../config/db");

/**
 * วิเคราะห์เจตนาของผู้ใช้ (Intent Detection)
 *
 * @description
 * ฟังก์ชันนี้เปรียบเสมือนสมองส่วนหน้า ที่คอยอ่านข้อความแรกที่ผู้ใช้พิมพ์เข้ามา
 * เพื่อแยกว่าผู้ใช้ต้องการทำอะไร (สร้างใบเสนอราคา, เพิ่มรายชื่อลูกค้า, หรือเพิ่มสินค้าเข้าสต็อก)
 * โดยจะคืนค่าโหมด (Mode) กลับไปให้หน้าบ้านเลือก UI ให้ตรงกับงาน
 *
 * @param {Object} req - Express Request object (ต้องมี req.body.prompt)
 * @param {Object} res - Express Response object
 * @returns {Promise<void>} - ส่งคืน { mode: "quote" | "customer" | "product" | "employee" }
 */
exports.detectMode = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    const systemPrompt = `Analyze the user's prompt and determine the intended action mode.
Modes available:
1. "quote": User wants to create or generate a quotation (ใบเสนอราคา), sell something, order items.
2. "customer": User wants to add or update customer/client information (เพิ่มลูกค้า, บริษัท).
3. "product": User wants to add or update product/item information (เพิ่มสินค้า, รหัสสินค้า, ราคาต้นทุน).
4. "employee": User wants to add or update employee/staff information (พนักงานใหม่, แผนก, เซลส์).

Return ONLY a JSON object:
{
  "mode": "quote" | "customer" | "product" | "employee"
}`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { systemInstruction: systemPrompt },
    });

    let text = result.text;
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) text = jsonMatch[0];

    res.json(JSON.parse(text));
  } catch (e) {
    console.error("Detect mode error:", e);
    res.status(500).json({ error: e.message });
  }
};

/**
 * สกัดข้อมูลลูกค้า (Customer) จากข้อความทั่วไปให้อยู่ในรูป JSON
 */
exports.aiCustomer = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    // ดึง Context ลูกค้าเดิมไปให้ AI ดู เพื่อให้ AI เดาชื่อเซลส์หรือข้อมูลที่ขาดหายได้แม่นขึ้น
    const [existingCustomers] = await db.query(
      "SELECT code, name FROM customers LIMIT 50",
    );
    const [employees] = await db.query(
      "SELECT pic_code, pic_name FROM employees LIMIT 50",
    );
    const custContext = existingCustomers
      .map((c) => c.code + ": " + c.name)
      .join(", ");
    const empContext = employees
      .map((e) => e.pic_code + ": " + e.pic_name)
      .join(", ");

    const systemPrompt = `You are a Customer Data Extraction AI.\nHere are existing customers in the database for reference: ${custContext}\nHere are existing sales reps (pic_code): ${empContext}\n\nExtract the customer details from the user's text into a JSON object.\nUse these rules:\n1. name: Company name or Person's full name.\n2. tax_id: Tax ID or Citizen ID (13 digits usually).\n3. contact_person: Contact person's name. If no company name is given, name and contact_person can be the same.\n4. phone: Phone number.\n5. email: Email address.\n6. address: Full address.\n7. pic_code: If they mention a sales rep name (like 'Sales John' or 'EMP-001'), try to guess, otherwise leave blank.\n\nOutput ONLY valid JSON matching this exact structure (no markdown, no extra text):\n{\n  "name": "",\n  "tax_id": "",\n  "contact_person": "",\n  "phone": "",\n  "email": "",\n  "address": "",\n  "pic_code": ""\n}`;

    let aiParsed;
    try {
      if (!ai || !process.env.GEMINI_API_KEY) throw new Error("No API Key");
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: systemPrompt + "\\n\\nUser Input: " + prompt,
      });
      let text = response.text.trim();
      let jsonMatch = text.match(/\\{.*\\}/s);
      aiParsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch (e) {
      console.warn("AI Extraction error:", e.message);
      // Fallback: ใช้ Regex แบบลวกๆ ในกรณีที่ Gemini ล่ม
      aiParsed = {
        name: prompt.split(" ")[0] || "",
        phone: prompt.match(/0\\d{1,2}-\\d{3}-\\d{4}|0\\d{9}/)
          ? prompt.match(/0\\d{1,2}-\\d{3}-\\d{4}|0\\d{9}/)[0]
          : "",
        address: prompt,
      };
    }
    res.json(aiParsed);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
};

/**
 * สกัดข้อมูลพนักงาน (Employee) จากข้อความทั่วไปให้อยู่ในรูป JSON
 */
exports.aiEmployee = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    const [existingEmps] = await db.query(
      "SELECT pic_code, pic_name, department FROM employees LIMIT 50",
    );
    const empContext2 = existingEmps
      .map((e) => e.pic_code + ": " + e.pic_name + " (" + e.department + ")")
      .join(", ");

    const systemPrompt = `You are an Employee Data Extraction AI.\nHere are existing employees and their departments for reference: ${empContext2}\n\nExtract the employee/sales details from the user's text into a JSON object.\nUse these rules:\n1. pic_code: Employee code or Sales code (e.g., EMP-001, S-001). Leave blank if not found.\n2. pic_name: Employee name in Thai or primary language.\n3. pic_name_eng: Employee name in English. Leave blank if not found.\n4. contact_number: Phone number or extension.\n5. department: Department or branch name.\n\nOutput ONLY valid JSON matching this exact structure (no markdown, no extra text):\n{\n  "pic_code": "",\n  "pic_name": "",\n  "pic_name_eng": "",\n  "contact_number": "",\n  "department": ""\n}`;

    let aiParsed;
    try {
      if (!ai || !process.env.GEMINI_API_KEY) throw new Error("No API Key");
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: systemPrompt + "\\n\\nUser Input: " + prompt,
      });
      let text = response.text.trim();
      let jsonMatch = text.match(/\\{.*\\}/s);
      aiParsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch (e) {
      console.warn("AI Extraction error:", e.message);
      aiParsed = {
        pic_name: prompt.split(" ")[0] || "",
        contact_number: prompt.match(/0\\d{1,2}-\\d{3}-\\d{4}|0\\d{9}/)
          ? prompt.match(/0\\d{1,2}-\\d{3}-\\d{4}|0\\d{9}/)[0]
          : "",
        pic_code: "",
      };
    }
    res.json(aiParsed);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
};

/**
 * สกัดข้อมูลสินค้า (Product) จากข้อความทั่วไปให้อยู่ในรูป JSON
 */
exports.aiProduct = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    const [existingProducts] = await db.query(
      "SELECT code, name FROM products LIMIT 50",
    );
    const prodContext = existingProducts
      .map((p) => p.code + ": " + p.name)
      .join(", ");

    const systemPrompt = `You are a Product Data Extraction AI.\nHere are existing products in the database for reference: ${prodContext}\n\nExtract the product details from the user's text into a JSON object.\nUse these rules:\n1. code: Product code or SKU (e.g., P001, SS-01). Leave blank if not found.\n2. name: Product name (e.g., ท่อสแตนเลส 304 2 นิ้ว).\n3. barcode: Barcode or scan code. Leave blank if not found.\n4. unit: Unit of measurement (e.g., ชิ้น, แผ่น, เส้น, kg). Default to "ชิ้น" if not explicitly stated.\n5. cost_price: Cost price (number only). Default to 0.\n6. selling_price: Selling price (number only). Default to 0.\n\nOutput ONLY valid JSON matching this exact structure (no markdown, no extra text):\n{\n  "code": "",\n  "name": "",\n  "barcode": "",\n  "unit": "",\n  "cost_price": 0,\n  "selling_price": 0\n}`;

    let aiParsed;
    try {
      if (!ai || !process.env.GEMINI_API_KEY) throw new Error("No API Key");
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: systemPrompt + "\\n\\nUser Input: " + prompt,
      });
      let text = response.text.trim();
      let jsonMatch = text.match(/\\{.*\\}/s);
      aiParsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch (e) {
      console.warn("AI Extraction error:", e.message);
      aiParsed = {
        name: prompt.split(" ").slice(0, 3).join(" "),
        cost_price: 0,
        selling_price: prompt.match(/\\d+/)
          ? parseInt(prompt.match(/\\d+/)[0])
          : 0,
        unit: "ชิ้น",
      };
    }
    res.json(aiParsed);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
};
