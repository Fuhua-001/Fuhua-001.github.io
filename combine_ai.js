const fs = require('fs');

// 1. Rewrite ai-assistant.html
let aiHtml = fs.readFileSync('public/ai-assistant.html', 'utf8');

// Replace the dropdown with 4 options
const oldSelect = '<select id="ai-mode-select" class="input-field" style="max-width: 250px;">\n                    <option value="quote">AI สร้างใบเสนอราคา</option>\n                    <option value="employee">AI สร้างข้อมูลพนักงาน</option>\n                  </select>';
const newSelect = `<select id="ai-mode-select" class="input-field" style="max-width: 250px;">
                    <option value="quote">AI สร้างใบเสนอราคา</option>
                    <option value="customer">AI สร้างข้อมูลลูกค้า</option>
                    <option value="product">AI สร้างข้อมูลสินค้า</option>
                    <option value="employee">AI สร้างข้อมูลพนักงาน</option>
                  </select>`;
aiHtml = aiHtml.replace(/<select id="ai-mode-select"[\s\S]*?<\/select>/, newSelect);

// Remove script.js and add custom script
const customScript = `
    <script>
      document.addEventListener("DOMContentLoaded", () => {
        const aiModeSelect = document.getElementById("ai-mode-select");
        const aiPrompt = document.getElementById("ai-prompt");
        const generateBtn = document.getElementById("generate-btn");
        const aiLoader = document.getElementById("ai-loader");

        const placeholders = {
          quote: "ตัวอย่าง: สร้างใบเสนอราคาให้บริษัท ABC จำกัด ซื้อแล็ปท็อป 10 เครื่อง...",
          customer: "ตัวอย่าง: บริษัท สมาร์ท เทคโนโลยี จำกัด เบอร์ 0812345678 ที่อยู่...",
          product: "ตัวอย่าง: ท่อสแตนเลส 304 2 นิ้ว รหัส P001 ราคา 500 บาท มี 10 ชิ้น",
          employee: "ตัวอย่าง: เซลส์ชื่อ สมชาย ใจดี รหัสพนักงาน EMP-001 เบอร์โทร 081-111-2222"
        };

        const endpoints = {
          quote: "/api/generate-quote",
          customer: "/api/ai-customer",
          product: "/api/ai-product",
          employee: "/api/ai-employee"
        };

        const storageKeys = {
          quote: "aiQuotationData",
          customer: "aiCustomerData",
          product: "aiProductData",
          employee: "aiEmployeeData"
        };

        const targetPages = {
          quote: "index.html",
          customer: "customers.html",
          product: "products.html",
          employee: "employees.html"
        };

        aiModeSelect.addEventListener("change", (e) => {
          aiPrompt.placeholder = placeholders[e.target.value] || placeholders.quote;
        });

        generateBtn.addEventListener("click", async () => {
          const mode = aiModeSelect.value;
          const prompt = aiPrompt.value.trim();
          if (!prompt) {
            alert("กรุณาพิมพ์คำสั่งก่อน");
            return;
          }

          generateBtn.disabled = true;
          aiLoader.classList.remove("hidden");

          try {
            const res = await fetch(endpoints[mode], {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt }),
            });
            const data = await res.json();
            if (res.ok) {
              sessionStorage.setItem(storageKeys[mode], JSON.stringify(data));
              window.location.href = targetPages[mode];
            } else {
              alert("AI Error: " + (data.error || "Unknown"));
              generateBtn.disabled = false;
              aiLoader.classList.add("hidden");
            }
          } catch (e) {
            alert("Network Error");
            generateBtn.disabled = false;
            aiLoader.classList.add("hidden");
          }
        });
      });
    </script>
  </body>
`;

aiHtml = aiHtml.replace(/<script src="script\.js\?v=\d+"><\/script>[\s\S]*?<\/body>/, customScript);
fs.writeFileSync('public/ai-assistant.html', aiHtml);


// 2. Modify script.js (Remove AI logic, it's now in ai-assistant.html)
let scriptJs = fs.readFileSync('public/script.js', 'utf8');
scriptJs = scriptJs.replace(/const aiModeSelect = document\.getElementById\("ai-mode-select"\);\s*if \(aiModeSelect\) \{[\s\S]*?\}\s*\}\);\s*\}/, "");
// Remove generateBtn logic
const genBtnStart = scriptJs.indexOf('generateBtn.addEventListener("click"');
if (genBtnStart !== -1) {
    let genBtnEnd = scriptJs.indexOf('// Save Quotation', genBtnStart);
    if (genBtnEnd === -1) genBtnEnd = scriptJs.indexOf('const saveDraft', genBtnStart);
    if (genBtnEnd !== -1) {
        scriptJs = scriptJs.substring(0, genBtnStart) + scriptJs.substring(genBtnEnd);
    }
}
fs.writeFileSync('public/script.js', scriptJs);

// 3. Update customers.html
let cusHtml = fs.readFileSync('public/customers.html', 'utf8');
// Remove old AI box
cusHtml = cusHtml.replace(/<div class="ai-customer-box"[\s\S]*?<\/div>\s*<div class="input-group">/g, '<div class="input-group">');
cusHtml = cusHtml.replace(/async function autoFillCustomerAI\(\) \{[\s\S]*?\}\s*\}\s*catch/g, "");
// Add sessionStorage listener
const cusScriptAdd = `
        const aiDataRaw = sessionStorage.getItem("aiCustomerData");
        if (aiDataRaw) {
          try {
            const data = JSON.parse(aiDataRaw);
            sessionStorage.removeItem("aiCustomerData");
            if(data.name) document.getElementById('cus-name').value = data.name;
            if(data.contact_person) document.getElementById('cus-contact').value = data.contact_person;
            if(data.phone) document.getElementById('cus-phone').value = data.phone;
            if(data.email) document.getElementById('cus-email').value = data.email;
            if(data.address) document.getElementById('cus-address').value = data.address;
            if(data.pic_code) document.getElementById('cus-pic').value = data.pic_code;
            showToast("โหลดข้อมูลจาก AI สำเร็จ กรุณาตรวจสอบและกดบันทึก");
          } catch(e) {}
        }
`;
cusHtml = cusHtml.replace('fetchCustomers();', 'fetchCustomers();\n' + cusScriptAdd);
fs.writeFileSync('public/customers.html', cusHtml);

// 4. Update products.html
let prodHtml = fs.readFileSync('public/products.html', 'utf8');
// Remove old AI box
prodHtml = prodHtml.replace(/<div class="ai-product-box"[\s\S]*?<\/div>\s*<div class="input-group">/g, '<div class="input-group">');
prodHtml = prodHtml.replace(/async function autoFillProductAI\(\) \{[\s\S]*?\}\s*\}\s*catch/g, "");
// Add sessionStorage listener
const prodScriptAdd = `
        const aiDataRaw = sessionStorage.getItem("aiProductData");
        if (aiDataRaw) {
          try {
            const data = JSON.parse(aiDataRaw);
            sessionStorage.removeItem("aiProductData");
            if(data.code) document.getElementById('prod-code').value = data.code;
            if(data.name) document.getElementById('prod-name').value = data.name;
            if(data.unit) document.getElementById('prod-unit').value = data.unit;
            if(data.cost_price) document.getElementById('prod-cost').value = data.cost_price;
            if(data.selling_price) document.getElementById('prod-sell').value = data.selling_price;
            showToast("โหลดข้อมูลจาก AI สำเร็จ กรุณาตรวจสอบและกดบันทึก");
          } catch(e) {}
        }
`;
prodHtml = prodHtml.replace('fetchProducts();', 'fetchProducts();\n' + prodScriptAdd);
fs.writeFileSync('public/products.html', prodHtml);

// 5. Update employees.html
let empHtml = fs.readFileSync('public/employees.html', 'utf8');
const empScriptAdd = `
        const aiDataRaw = sessionStorage.getItem("aiEmployeeData");
        if (aiDataRaw) {
          try {
            const data = JSON.parse(aiDataRaw);
            sessionStorage.removeItem("aiEmployeeData");
            if(data.pic_code) document.getElementById('emp-code').value = data.pic_code;
            if(data.pic_name) {
               const parts = data.pic_name.split(' ');
               document.getElementById('emp-fname-th').value = parts[0] || '';
               document.getElementById('emp-lname-th').value = parts.slice(1).join(' ') || '';
            }
            if(data.pic_name_eng) {
               const parts = data.pic_name_eng.split(' ');
               document.getElementById('emp-fname-en').value = parts[0] || '';
               document.getElementById('emp-lname-en').value = parts.slice(1).join(' ') || '';
            }
            if(data.contact_number) document.getElementById('emp-tel').value = data.contact_number;
            showToast("โหลดข้อมูลจาก AI สำเร็จ กรุณาตรวจสอบและกดบันทึก");
          } catch(e) {}
        }
`;
empHtml = empHtml.replace('fetchEmployees();', 'fetchEmployees();\n' + empScriptAdd);
fs.writeFileSync('public/employees.html', empHtml);
