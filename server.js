const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");
const db = require("./db");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"), {
  etag: false,
  maxAge: 0,
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

let ai;
try {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
} catch (e) {
  console.log("Gemini API key not configured properly.");
}

app.post("/api/generate-quote", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    // Fetch context from database
    const [customers] = await db.query("SELECT name FROM customers LIMIT 50");

    // Fetch products with stock_qty (Bug fix: was missing stock_qty in original query)
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
      .map((p) => `${p.name} (ราคาขาย: ${p.selling_price} บาท, หน่วย: ${p.unit || 'ชิ้น'}, จำนวนสต็อก: ${p.stock_qty})`)
      .join("\n");

    const systemPrompt = `You are an Enterprise Quotation Generation AI.
        
        Here is the data from our company database:
        [Existing Customers]: ${customerList}
        [Available Products in Stock & Standard Prices]:
        ${productList}

        Instructions:
        1. Try to match the customer name in the prompt to one of the [Existing Customers]. If it matches partially, use the full official name from the database.
        2. Match the requested items to the [Available Products in Stock]. You MUST ONLY use products from this list. Use the exact standard price.
        3. Do NOT exceed the available stock quantity for any product. If a user asks for more than the stock, reduce the quantity to the maximum available stock.
        4. If the item is NOT in the database, DO NOT include it. Never invent products or guess prices.
        5. FINAL RECHECK: Before responding, verify that every item you included exists in the [Available Products in Stock] list, the price is exactly as stated, and the quantity is within the stock limit.
        6. VERY IMPORTANT: If the user explicitly asks for ANY product that is NOT in the [Available Products in Stock], you MUST add the requested product's name to the "missing_products" array.
        7. CHAIN OF THOUGHT: You MUST use a <thought> block to analyze the request step-by-step BEFORE outputting the JSON. 
        Example:
        <thought>
        1. Customer: ACA -> matches 'ACA INDUSTRIAL...'
        2. Item: 2 inch pipe -> Not found. Add to missing.
        </thought>
        \`\`\`json
        ...
        \`\`\`
        
        Return strictly in JSON format matching this schema after the thought block:
        {
          "customer_name": "Matched Customer Name from DB or 'Unknown'",
          "items": [
            { "description": "Matched Product Name", "quantity": 1, "unit": "Matched Unit", "unit_price": 100 }
          ],
          "missing_products": ["Name of product requested but not found in stock"],
          "warnings": []
        }
        Do not include markdown blocks or any other text. Only return valid JSON.`;

    let aiParsed;
    try {
      if (!ai || !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_api_key_here") {
        throw new Error("AI API Key not configured.");
      }
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `${systemPrompt}\n\nUser Request: ${prompt}`,
      });
      let text = response.text.trim();
      let jsonMatch = text.match(/```json([\s\S]*?)```/);
      let jsonText = jsonMatch ? jsonMatch[1].trim() : text.substring(text.indexOf('{')).trim();
      
      aiParsed = JSON.parse(jsonText);
    } catch (apiError) {
      console.warn("AI API Error, falling back to Regex Matcher:", apiError.message);
      const [fbCustomers] = await db.query("SELECT name FROM customers");
      const [fbProducts] = await db.query("SELECT name, selling_price as price FROM products");

      let matchedCustomer = "Unknown";
      for (let c of fbCustomers) {
        if (prompt.toLowerCase().includes(c.name.split(" ")[0].toLowerCase())) {
          matchedCustomer = c.name;
          break;
        }
      }

      let items = [];
      for (let p of fbProducts) {
        const keyword = p.name.split(" ")[0].toLowerCase();
        if (prompt.toLowerCase().includes(keyword)) {
          const qtyMatch = prompt.match(new RegExp(`(\\d+)\\s*${keyword}|${keyword}.*?(\\d+)`));
          const qty = qtyMatch ? parseInt(qtyMatch[1] || qtyMatch[2]) : 1;
          items.push({ description: p.name, quantity: qty || 1, unit_price: p.price });
        }
      }

      aiParsed = { customer_name: matchedCustomer, items, missing_products: [], warnings: [] };
    }

    const quoteData = aiParsed;
    if (!quoteData.warnings) quoteData.warnings = [];
    const verifiedItems = [];

    for (const item of quoteData.items) {
      const realProduct = products.find((p) => p.name.toLowerCase() === item.description.toLowerCase());
      if (realProduct) {
        const finalQty = item.quantity;
        const finalPrice = realProduct.selling_price;

        if (finalQty > realProduct.stock_qty) {
          quoteData.warnings.push(
            `แจ้งเตือน: "${realProduct.name}" มีสต็อกคงเหลือ ${realProduct.stock_qty} ชิ้น แต่ขอ ${finalQty} ชิ้น กรุณาตรวจสอบจำนวนก่อนยืนยัน`
          );
        }
        if (finalQty > 0) {
          verifiedItems.push({ description: realProduct.name, quantity: finalQty, unit: realProduct.unit, unit_price: finalPrice });
        }
      } else {
        quoteData.warnings.push(`ไม่พบสินค้า "${item.description}" ในระบบ`);
      }
    }

    if (quoteData.missing_products && Array.isArray(quoteData.missing_products)) {
      for (const missing of quoteData.missing_products) {
        quoteData.warnings.push(`ไม่พบสินค้า "${missing}" ในคลังสินค้าของเรา`);
      }
    }

    quoteData.items = verifiedItems;
    res.json(quoteData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate quotation", details: error.message });
  }
});

app.post("/api/save-quote", async (req, res) => {
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

    // Lookup customer data
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
      if (!pic_code) c_pic = customerRows[0].pic_code || "EMP-001";
      c_contact = customer_name.trim();
    }


    // Use a single transaction covering both sales_pr and sub_sales_pr
    const conn = await db.getConnection();
    await conn.beginTransaction();
    let salesPrId;
    try {
      if (req.body.id) {
        // UPDATE existing
        salesPrId = req.body.id;
        await conn.query(
          `UPDATE sales_pr 
           SET pic_code=?, customer_code=?, contact_person=?, phone=?, email=?,
               validity_date=DATE_ADD(CURDATE(), INTERVAL ? DAY), credit_days=?, payment_terms=?, updated_by='Sales Team'
           WHERE id = ?`,
          [c_pic, c_code, c_contact, c_phone, c_email, finalCreditDays, finalCreditDays, finalPaymentTerms, salesPrId]
        );
        // Delete old items (fixed: column is sales_pr_id, not pr_id)
        await conn.query(`DELETE FROM sub_sales_pr WHERE sales_pr_id = ?`, [salesPrId]);
      } else {
        // Generate document number
        const doc_no = "PR-" + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);
        const [result] = await conn.query(
          `INSERT INTO sales_pr 
                (doc_no, doc_date, pic_code, customer_code, contact_person, 
  phone, email, validity_date, credit_days, transaction_type, payment_terms, 
  created_by, updated_by) 
                VALUES (?, CURDATE(), ?, ?, ?, ?, ?, DATE_ADD(CURDATE(), 
  INTERVAL ? DAY), ?, 'Quotation', ?, 'Sales Team', 'Sales Team')`,
          [doc_no, c_pic, c_code, c_contact, c_phone, c_email, finalCreditDays, finalCreditDays, finalPaymentTerms]
        );
        salesPrId = result.insertId;
      }

      const itemQueries = items.map(async (item) => {
        const rowTotal = item.quantity * item.unit_price;
        const [productRows] = await conn.query(
          "SELECT code, unit FROM products WHERE name = ? LIMIT 1",
          [item.description],
        );
        const p_code = productRows.length > 0 ? productRows[0].code : null;
        const p_unit = productRows.length > 0 ? (productRows[0].unit || "ชิ้น") : "ชิ้น";

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
            rowTotal * 0.07,
            rowTotal * 1.07,
          ],
        );
      });

      await Promise.all(itemQueries);
      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
    let finalDocNo = "";
    try {
        const [prRows] = await db.query("SELECT doc_no FROM sales_pr WHERE id = ?", [salesPrId]);
        if (prRows.length > 0) finalDocNo = prRows[0].doc_no;
    } catch(e) {}
    res.json({ success: true, quoteId: salesPrId, doc_no: finalDocNo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save quotation", details: error.message });
  }
});


app.post("/api/ai-customer", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    const systemPrompt = `You are a Customer Data Extraction AI.
Extract the customer details from the user's text into a JSON object.
Use these rules:
1. name: Company name or Person's full name.
2. tax_id: Tax ID or Citizen ID (13 digits usually).
3. contact_person: Contact person's name. If no company name is given, name and contact_person can be the same.
4. phone: Phone number.
5. email: Email address.
6. address: Full address.
7. pic_code: If they mention a sales rep name (like 'Sales John' or 'EMP-001'), try to guess, otherwise leave blank.

Output ONLY valid JSON matching this exact structure (no markdown, no extra text):
{
  "name": "",
  "tax_id": "",
  "contact_person": "",
  "phone": "",
  "email": "",
  "address": "",
  "pic_code": ""
}`;

    let aiParsed;
    try {
      if (!ai || !process.env.GEMINI_API_KEY) throw new Error("No API Key");
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: systemPrompt + "\n\nUser Input: " + prompt,
      });
      let text = response.text.trim();
      let jsonMatch = text.match(/\{.*\}/s);
      aiParsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch (e) {
      console.warn("AI Extraction error:", e.message);
      // Fallback
      aiParsed = {
        name: prompt.split(" ")[0] || "",
        phone: prompt.match(/0\d{1,2}-\d{3}-\d{4}|0\d{9}/) ? prompt.match(/0\d{1,2}-\d{3}-\d{4}|0\d{9}/)[0] : "",
        address: prompt
      };
    }
    res.json(aiParsed);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

app.get("/api/customers", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM customers");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customers", details: err.message });
  }
});

app.post("/api/ai-product", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    const systemPrompt = `You are a Product Data Extraction AI.
Extract the product details from the user's text into a JSON object.
Use these rules:
1. code: Product code or SKU (e.g., P001, SS-01). Leave blank if not found.
2. name: Product name (e.g., ท่อสแตนเลส 304 2 นิ้ว).
3. barcode: Barcode or scan code. Leave blank if not found.
4. unit: Unit of measurement (e.g., ชิ้น, แผ่น, เส้น, kg). Default to "ชิ้น" if not explicitly stated.
5. cost_price: Cost price (number only). Default to 0.
6. selling_price: Selling price (number only). Default to 0.

Output ONLY valid JSON matching this exact structure (no markdown, no extra text):
{
  "code": "",
  "name": "",
  "barcode": "",
  "unit": "",
  "cost_price": 0,
  "selling_price": 0
}`;

    let aiParsed;
    try {
      if (!ai || !process.env.GEMINI_API_KEY) throw new Error("No API Key");
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: systemPrompt + "\n\nUser Input: " + prompt,
      });
      let text = response.text.trim();
      let jsonMatch = text.match(/\{.*\}/s);
      aiParsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch (e) {
      console.warn("AI Extraction error:", e.message);
      // Fallback
      aiParsed = {
        name: prompt.split(" ").slice(0, 3).join(" "),
        cost_price: 0,
        selling_price: prompt.match(/\d+/) ? parseInt(prompt.match(/\d+/)[0]) : 0,
        unit: "ชิ้น"
      };
    }
    res.json(aiParsed);
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM products");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.get("/api/employees", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM employees");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

app.post("/api/employees", async (req, res) => {
  try {
    const { pic_code, pic_name, contact_number, active_status } = req.body;
    await db.query('INSERT INTO employees (pic_code, pic_name, contact_number, active_status) VALUES (?, ?, ?, ?)', [pic_code, pic_name, contact_number, active_status || 'Active']);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add employee', details: err.message });
  }
});

app.put("/api/employees/:id", async (req, res) => {
  try {
    const { pic_code, pic_name, contact_number, active_status } = req.body;
    await db.query('UPDATE employees SET pic_code=?, pic_name=?, contact_number=?, active_status=? WHERE pic_code=?', [pic_code, pic_name, contact_number, active_status || 'Active', req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update employee', details: err.message });
  }
});

app.delete("/api/employees/:id", async (req, res) => {
  try {
    await db.query('DELETE FROM employees WHERE pic_code=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete employee', details: err.message });
  }
});

app.get("/api/quote/:id", async (req, res) => {
  try {
    const [headerRows] = await db.query("SELECT * FROM sales_pr WHERE id = ?", [req.params.id]);
    if (headerRows.length === 0) return res.status(404).json({ error: "Quote not found" });
    const [itemRows] = await db.query("SELECT * FROM sub_sales_pr WHERE sales_pr_id = ?", [req.params.id]);
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
        phone: headerRows[0].phone,
        email: headerRows[0].email,
      },
      items: itemRows.map(i => ({
          description: i.product_name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          unit: i.unit
      }))
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch quote" });
  }
});


app.get("/api/audit_logs", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM audit_logs ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch audits" });
  }
});


app.get("/api/history", async (req, res) => {
  try {
    const query = `            SELECT s.id, s.doc_no, s.contact_person as customer_name, s.created_at, 
                   COALESCE((SELECT SUM(total_amount) FROM sub_sales_pr WHERE sales_pr_id = s.id), 0) as total_amount,
                   e.pic_name as salesperson
            FROM sales_pr s
            LEFT JOIN employees e ON s.pic_code = e.pic_code
            ORDER BY s.created_at DESC
        `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { name, code, contact_person, phone, email, address_1, pic_code, tax_id } = req.body;
    await db.query('INSERT INTO customers (name, code, contact_person, phone, email, address_1, pic_code, tax_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [name, code, contact_person, phone, email, address_1, pic_code, tax_id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed', details: err.message }); }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { name, code, contact_person, phone, email, address_1, pic_code, tax_id } = req.body;
    await db.query('UPDATE customers SET name=?, code=?, contact_person=?, phone=?, email=?, address_1=?, pic_code=?, tax_id=? WHERE id=?', [name, code, contact_person, phone, email, address_1, pic_code, tax_id, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed', details: err.message }); }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM customers WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed', details: err.message }); }
});

app.post('/api/products', async (req, res) => {
  try {
    const { code, name, unit, selling_price, purchase_price, status } = req.body;
    await db.query('INSERT INTO products (code, name, unit, selling_price, purchase_price, status) VALUES (?, ?, ?, ?, ?, ?)', [code, name, unit, selling_price, purchase_price, status || 'Active']);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed', details: err.message }); }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { code, name, unit, selling_price, purchase_price, status } = req.body;
    await db.query('UPDATE products SET code=?, name=?, unit=?, selling_price=?, purchase_price=?, status=? WHERE id=?', [code, name, unit, selling_price, purchase_price, status || 'Active', req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed', details: err.message }); }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed', details: err.message }); }
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
module.exports = app;
