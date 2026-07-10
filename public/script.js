document.addEventListener("DOMContentLoaded", () => {
  const aiPrompt = document.getElementById("ai-prompt");
  const generateBtn = document.getElementById("generate-btn");
  const aiLoader = document.getElementById("ai-loader");

  const quoteForm = document.getElementById("quote-form");
  const customerNameInput = document.getElementById("customer-name");
  const quoteItemsContainer = document.getElementById("quote-items");
  const addItemBtn = document.getElementById("add-item-btn");
  const grandTotalEl = document.getElementById("grand-total");

  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");

  let items = [];
  window.productsList = [];

  // Fetch data for dropdowns
  const fetchDropdownData = async () => {
    try {
      const [custRes, prodRes, empRes] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/products"),
        fetch("/api/employees"),
      ]);

      if (custRes.ok) {
        const customers = await custRes.json();
        window.customersList = customers;
        const custSelect = document.getElementById("customer-name");
        if (custSelect) {
          customers
            .filter(
              (c) => c.level_group !== "Vender" && c.level_group !== "Vendor",
            )
            .forEach((c) => {
              const opt = document.createElement("option");
              opt.value = c.name;
              opt.textContent = c.name;
              custSelect.appendChild(opt);
            });
        }
      }

      if (empRes.ok) {
        const employees = await empRes.json();
        window.employeesList = employees;
        const empSelect = document.getElementById("form-sales-rep");
        if (empSelect) {
          employees.forEach((e) => {
            const opt = document.createElement("option");
            opt.value = e.pic_code;
            opt.textContent = `${e.pic_code} - ${e.pic_name}`;
            empSelect.appendChild(opt);
          });
        }
      }

      if (prodRes.ok) {
        window.productsList = await prodRes.json();
      }

      // Call loadDraft here so that the <option>s exist before setting values
      const urlParamsInit = new URLSearchParams(window.location.search);
      const viewIdInit = urlParamsInit.get("view");
      const editIdInit = urlParamsInit.get("edit");
      if (viewIdInit || editIdInit) {
        // Load from DB instead of draft
        window.loadQuoteData(viewIdInit, editIdInit);
      } else {
        loadDraft();
      }
      renderItems();
    } catch (e) {
      console.error("Error fetching dropdown data:", e);
    }
  };
  fetchDropdownData();

  // Custom update function for product selection
  window.updateProductSelection = (index, productName) => {
    const product = window.productsList.find((p) => p.name === productName);
    if (product) {
      items[index].description = product.name;
      items[index].unit_price = parseFloat(product.selling_price) || 0;
      renderItems();
      saveDraft();
    }
  };

  // --- Mode Switching ---
  window.switchMode = (mode) => {
    const btnAi = document.getElementById("btn-mode-ai");
    const btnManual = document.getElementById("btn-mode-manual");
    const aiSection = document.getElementById("ai-prompt-section");
    const formSection = document.getElementById("quotation-form-section");

    if (mode === "ai") {
      btnAi.className = "btn btn-primary";
      btnManual.className = "btn btn-outline";
      aiSection.style.display = "block";
      // Only hide form if items are empty to not lose user's work
      if (items.length === 0) formSection.classList.add("hidden");
    } else {
      btnAi.className = "btn btn-outline";
      btnManual.className = "btn btn-primary";
      aiSection.style.display = "none";
      formSection.classList.remove("hidden");
      if (items.length === 0) {
        // Add a blank row by default for manual entry
        items.push({ description: "", quantity: 1, unit_price: 0 });
        renderItems();
      }
    }
  };
  // ----------------------

  // Draft persistence
  const saveDraft = () => {
    if (!aiPrompt || !customerNameInput) return;
    const draft = {
      prompt: aiPrompt.value,
      customerName: customerNameInput.value,
      items: items,
      isFormVisible: !document
        .getElementById("quotation-form-section")
        .classList.contains("hidden"),
      salesRep: document.getElementById("form-sales-rep")
        ? document.getElementById("form-sales-rep").value
        : "",
    };
    sessionStorage.setItem("quotationDraft", JSON.stringify(draft));
  };

  const loadDraft = () => {
    if (!aiPrompt || !customerNameInput) return;
    const draftStr = sessionStorage.getItem("quotationDraft");
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr);
        aiPrompt.value = draft.prompt || "";
        customerNameInput.value = draft.customerName || "";
        if (draft.salesRep) {
          const fSalesRep = document.getElementById("form-sales-rep");
          if (fSalesRep) fSalesRep.value = draft.salesRep;
        }
        if (draft.items && Array.isArray(draft.items)) {
          items = draft.items;
        }
        if (draft.isFormVisible) {
          document
            .getElementById("quotation-form-section")
            .classList.remove("hidden");
        }
      } catch (e) {
        console.error("Failed to load draft", e);
      }
    }
  };

  if (aiPrompt) aiPrompt.addEventListener("input", saveDraft);
  if (customerNameInput) {
    customerNameInput.addEventListener("change", (e) => {
      if (window.customersList) {
        const matched = window.customersList.find(
          (c) => c.name === e.target.value,
        );
        if (matched) {
          const fCredit = document.getElementById("form-credit-days");
          if (fCredit && matched.credit_days !== undefined)
            fCredit.value = matched.credit_days;

          const fSalesRep = document.getElementById("form-sales-rep");
          if (fSalesRep && matched.pic_code) fSalesRep.value = matched.pic_code;
        }
      }
      saveDraft();
    });
    customerNameInput.addEventListener("input", saveDraft);
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  // Render items to the table
  const renderItems = () => {
    quoteItemsContainer.innerHTML = "";
    let total = 0;

    const subTotalEl = document.getElementById("sub-total");
    const vatTotalEl = document.getElementById("vat-total");

    items.forEach((item, index) => {
      const itemTotal = item.quantity * item.unit_price;
      total += itemTotal;

      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td>
                    <select onchange="window.updateProductSelection(${index}, this.value)" required style="width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px;">
                        <option value="" disabled ${!item.description ? "selected" : ""}>-- เลือกสินค้า --</option>
                        ${(window.productsList || []).map((p) => `<option value="${p.name}" ${p.name === item.description ? "selected" : ""}>${p.name}</option>`).join("")}
                    </select>
                </td>
                <td>
                    <input type="number" value="${item.quantity}" min="1" onchange="updateItem(${index}, 'quantity', this.value)" required style="width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px;">
                </td>
                <td>
                    <input type="number" value="${item.unit_price}" min="0" step="0.01" onchange="updateItem(${index}, 'unit_price', this.value)" required style="width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px;" readonly>
                </td>
                <td class="font-medium">${formatCurrency(itemTotal)}</td>
                <td>
                    <button type="button" class="btn-delete" onclick="removeItem(${index})"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
      quoteItemsContainer.appendChild(tr);
    });

    const vat = total * 0.07;
    const grandTotal = total + vat;

    if (subTotalEl) subTotalEl.textContent = formatCurrency(total);
    if (vatTotalEl) vatTotalEl.textContent = formatCurrency(vat);
    if (grandTotalEl) grandTotalEl.textContent = formatCurrency(grandTotal);
  };

  // Update item
  window.updateItem = (index, field, value) => {
    if (field === "quantity" || field === "unit_price") {
      items[index][field] = parseFloat(value) || 0;
    } else {
      items[index][field] = value;
    }
    renderItems();
    saveDraft();
  };

  // Remove item
  window.removeItem = (index) => {
    items.splice(index, 1);
    renderItems();
    saveDraft();
  };

  // Add empty item
  if (addItemBtn) {
    addItemBtn.addEventListener("click", () => {
      items.push({ description: "", quantity: 1, unit_price: 0 });
      renderItems();
      saveDraft();
    });
  }

  // Show Toast
  const showToast = (message, isError = false) => {
    toastMessage.textContent = message;
    toast.querySelector("i").className = isError
      ? "fa-solid fa-circle-xmark"
      : "fa-solid fa-circle-check";
    toast.querySelector("i").style.color = isError
      ? "#ef4444"
      : "var(--success)";

    toast.classList.remove("hidden");
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 3000);
  };

  // Generate with AI
  generateBtn.addEventListener("click", async () => {
    const prompt = aiPrompt.value.trim();
    if (!prompt) {
      showToast("กรุณาพิมพ์คำสั่งก่อนให้ AI สร้าง", true);
      return;
    }

    generateBtn.disabled = true;
    aiLoader.classList.remove("hidden");

    try {
      const response = await fetch("/api/generate-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.customer_name && data.customer_name !== "Unknown") {
          customerNameInput.value = data.customer_name;
          customerNameInput.dispatchEvent(new Event("change"));
        }

        if (data.items && Array.isArray(data.items)) {
          items = data.items;
          renderItems();
        }

        // Show the form section after AI generation
        document
          .getElementById("quotation-form-section")
          .classList.remove("hidden");

        saveDraft();

        if (data.warnings && data.warnings.length > 0) {
          const warningModal = document.getElementById("ai-warning-modal");
          const warningText = document.getElementById("ai-warning-text");
          if (warningModal && warningText) {
            warningText.innerHTML = data.warnings.join("<br><br>");
            warningModal.classList.remove("hidden");
          } else {
            alert("⚠️ แจ้งเตือนจาก AI:\n\n" + data.warnings.join("\n"));
          }
          showToast("AI สร้างเสร็จ แต่มีการปรับจำนวนสินค้าตามสต๊อก", true);
        } else {
          showToast("AI สร้างใบเสนอราคาสำเร็จ");
        }
      } else {
        throw new Error(data.error || "Failed to generate");
      }
    } catch (error) {
      const warningModal = document.getElementById("ai-warning-modal");
      const warningText = document.getElementById("ai-warning-text");
      if (warningModal && warningText) {
        warningText.innerHTML = `<strong>ระบบ AI ขัดข้อง:</strong><br><br>ไม่สามารถสร้างใบเสนอราคาได้ในขณะนี้<br><br><span style="font-size: 0.9em; color: #ef4444;">สาเหตุ: ${error.message || "ข้อมูลผิดพลาด โปรดลองใหม่อีกครั้ง"}</span>`;
        warningModal.classList.remove("hidden");
      } else {
        alert(
          "⚠️ ระบบแจ้งเตือน:\n\nไม่สามารถสร้างใบเสนอราคาได้\nสาเหตุ: " +
            (error.message || "ข้อมูลผิดพลาด หรือระบบ AI ขัดข้อง"),
        );
      }
    } finally {
      generateBtn.disabled = false;
      aiLoader.classList.add("hidden");
    }
  });

  // Manual Save Logic Removed (now part of PDF generation)

  // Export PDF via Preview Modal
  const previewModal = document.getElementById("preview-modal");
  const closeModalBtn = document.getElementById("close-modal");
  const cancelPrintBtn = document.getElementById("cancel-print-btn");
  const confirmPdfBtn = document.getElementById("confirm-pdf-btn");
  const previewContainer = document.getElementById("preview-container");

  const closeModal = () => {
    previewModal.classList.add("hidden");
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("modal") === "true") {
      window.parent.postMessage("close_iframe", "*");
    } else if (urlParams.get("view")) {
      window.location.href = "history.html";
    }
  };

  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (cancelPrintBtn) cancelPrintBtn.addEventListener("click", closeModal);

  if (quoteForm) {
    quoteForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (items.length === 0) {
        alert(
          "⚠️ แจ้งเตือน:\n\nคุณยังไม่ได้เพิ่มสินค้าในใบเสนอราคาครับ กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการก่อนเพื่อตรวจสอบเอกสาร",
        );
        return;
      }

      let crDays = 30;
      const fCredit = document.getElementById("form-credit-days");
      if (fCredit) crDays = parseInt(fCredit.value) || 30;

      let pTerms = "Cash/Transfer";
      const fPayment = document.getElementById("form-payment-terms");
      if (fPayment) pTerms = fPayment.value;

      let uRemarks = "";
      const fRemarks = document.getElementById("form-remarks");
      if (fRemarks) uRemarks = fRemarks.value;

      let cusInfo = {
        code: "",
        tax_id: "",
        address_1: "",
        level_group: "",
        phone: "",
        email: "",
        pic_code: "",
        pic_name: "Sales Team",
        pic_phone: "",
        credit_days: crDays,
        doc_no: "(กำลังออกเลข...)",
        doc_date_str: new Date().toLocaleDateString("en-GB"),
        due_date_str: new Date(
          Date.now() + crDays * 86400000,
        ).toLocaleDateString("en-GB"),
        payment_terms: pTerms,
        remarks: uRemarks,
      };

      if (
        window.loadedQuoteData &&
        window.loadedQuoteData.customer_name === customerNameInput.value
      ) {
        const dDate = window.loadedQuoteData.doc_date
          ? new Date(window.loadedQuoteData.doc_date)
          : new Date();
        cusInfo.code = window.loadedQuoteData.customer_code || "";
        cusInfo.tax_id = "";
        cusInfo.address_1 = "";
        cusInfo.phone = window.loadedQuoteData.phone || "";
        cusInfo.email = window.loadedQuoteData.email || "";
        cusInfo.pic_code = window.loadedQuoteData.pic_code || "";
        cusInfo.pic_name = window.loadedQuoteData.pic_name || "Sales Team";
        cusInfo.pic_phone = window.loadedQuoteData.pic_phone || "";
        cusInfo.doc_no = window.loadedQuoteData.doc_no || "(กำลังออกเลข...)";
        cusInfo.doc_date_str = dDate.toLocaleDateString("en-GB");
        cusInfo.due_date_str = new Date(
          dDate.getTime() + crDays * 86400000,
        ).toLocaleDateString("en-GB");
      }

      // Enrich with customer details from cached data
      try {
        const allCustomers = window.customersList || [];
        const cName = customerNameInput.value;
        const matched = allCustomers.find(
          (c) => c.name === cName || c.contact_person === cName,
        );
        if (matched) {
          cusInfo.code = cusInfo.code || matched.code || "";
          cusInfo.tax_id = matched.tax_id || "";
          cusInfo.address_1 = matched.address_1 || "";
          cusInfo.district = matched.district || "";
          cusInfo.province = matched.province || "";
          cusInfo.level_group = matched.level_group || "";
          cusInfo.phone = cusInfo.phone || matched.phone || "";
          cusInfo.email = cusInfo.email || matched.email || "";
          if (
            !window.loadedQuoteData ||
            window.loadedQuoteData.customer_name !== cName
          ) {
            cusInfo.pic_code = matched.pic_code || "";
            cusInfo.pic_name = matched.pic_name || matched.pic_code || "Sales Team";
            cusInfo.pic_phone = matched.pic_phone || "";
            cusInfo.credit_days = crDays;
            cusInfo.due_date_str = new Date(
              Date.now() + crDays * 86400000,
            ).toLocaleDateString("en-GB");
          }
        }
      } catch (err) {
        console.error("Could not enrich customer info for quote", err);
      }

      // Override PIC with selected sales rep from form
      const fSalesRepForm = document.getElementById("form-sales-rep");
      if (fSalesRepForm && fSalesRepForm.value && window.employeesList) {
        const emp = window.employeesList.find(
          (e) => e.pic_code === fSalesRepForm.value,
        );
        if (emp) {
          cusInfo.pic_code = emp.pic_code;
          cusInfo.pic_name = emp.pic_name;
          cusInfo.pic_phone = emp.contact_number || "";
        }
      }

      // Generate locked signature image
      function generateSignatureCanvas(salesperson, docDate) {
          const canvas = document.createElement('canvas');
          const scale = 3;
          canvas.width = 734 * scale;
          canvas.height = 145 * scale;
          const ctx = canvas.getContext('2d');
          ctx.scale(scale, scale);
          
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 734, 145);
          
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          
          function roundRect(x, y, w, h, r) {
              ctx.beginPath();
              ctx.moveTo(x + r, y);
              ctx.lineTo(x + w - r, y);
              ctx.quadraticCurveTo(x + w, y, x + w, y + r);
              ctx.lineTo(x + w, y + h - r);
              ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
              ctx.lineTo(x + r, y + h);
              ctx.quadraticCurveTo(x, y + h, x, y + h - r);
              ctx.lineTo(x, y + r);
              ctx.quadraticCurveTo(x, y, x + r, y);
              ctx.closePath();
              ctx.stroke();
          }
          
          roundRect(0, 5, 359, 135, 8);
          roundRect(374, 5, 359, 135, 8);
          
          ctx.textAlign = 'center';
          
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 13px "Prompt", "Sarabun", sans-serif';
          ctx.fillText('ในนาม ลูกค้า / Customer', 179.5, 35);
          
          ctx.beginPath();
          ctx.moveTo(79.5, 95);
          ctx.lineTo(279.5, 95);
          ctx.stroke();
          
          ctx.font = '12px "Prompt", "Sarabun", sans-serif';
          ctx.fillStyle = '#666666';
          ctx.fillText('(............................................................)', 179.5, 110);
          ctx.fillStyle = '#000000';
          ctx.fillText('ผู้อนุมัติสั่งซื้อ / Accepted By', 179.5, 125);
          ctx.fillText('วันที่ / Date: ......../......../........', 179.5, 140);
          
          ctx.font = 'bold 13px "Prompt", "Sarabun", sans-serif';
          ctx.fillText('ในนาม โซลโซไซตี้ (Soul Society)', 553.5, 35);
          
          ctx.beginPath();
          ctx.moveTo(453.5, 95);
          ctx.lineTo(653.5, 95);
          ctx.stroke();
          
          ctx.font = '12px "Prompt", "Sarabun", sans-serif';
          ctx.fillStyle = '#0f172a';
          ctx.fillText('( ' + (salesperson || '............................................................') + ' )', 553.5, 110);
          ctx.fillStyle = '#000000';
          ctx.fillText('ผู้เสนอราคา / Quoted By', 553.5, 125);
          ctx.fillText('วันที่ / Date: ' + (docDate || '......../......../........'), 553.5, 140);
          
          return '<img src="' + canvas.toDataURL('image/png') + '" style="width: 100%; max-width: 734px; margin-top: 5px;" alt="Locked Signatures" />';
      }

      // Create a printable element HTML
      let tableHTML = `
                <div style="width: 794px; min-height: 1080px; box-sizing: border-box; display: flex; flex-direction: column; font-family: 'Prompt', 'Sarabun', sans-serif !important; letter-spacing: 0px !important; color: #000; padding: 20px 30px; background: white; font-size: 13px; line-height: 1.15; margin: 0; text-align: left;">
                    
                    <!-- Header Section -->
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <div style="flex: 1; display: flex; align-items: flex-start;">
                            <!-- Placeholder for Corporate Logo -->
                            <div style="width: 60px; height: 60px; background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 10px; font-weight: bold;">
                                [ LOGO ]
                            </div>
                        </div>
                        <div style="flex: 2; text-align: center;">
                            <h2 style="margin: 0; font-size: 22px; font-weight: bold; color: #0f172a;">บริษัท โซลโซไซตี้ จำกัด</h2>
                            <p style="margin: 2px 0; font-weight: 500; font-size: 14px;">Soul Society Co., Ltd.</p>
                            <p style="margin: 2px 0; font-size: 13px;">15/5 ถนนพุทธรักษา ต.บางเมือง อ.เมือง จ.สมุทรปราการ 10270</p>
                            <p style="margin: 2px 0; font-size: 13px;">Tel: 02-789-5541 | Email: sales@soulsociety.co.th</p>
                        </div>
                        <div style="flex: 1; text-align: right; display: flex; flex-direction: column; justify-content: flex-start;">
                            <h2 style="margin: 0; font-size: 20px; font-weight: bold; color: var(--primary-color);">ใบเสนอราคา</h2>
                            <p style="margin: 2px 0; font-size: 14px; font-weight: 500;">Quotation</p>
                        </div>
                    </div>
                    
                    <div style="text-align: left; margin-bottom: 10px;">
                        <p style="margin: 0;">เลขประจำตัวผู้เสียภาษี / Tax ID 6611611200003 สำนักงานใหญ่</p>
                    </div>

                    <!-- Info Box Section -->
                    <div style="display: flex; border: 1px solid #000; border-radius: 8px; margin-bottom: 2px; overflow: hidden;">
                        
                        <!-- Left Box -->
                        <div style="flex: 1; padding: 10px; border-right: 1px solid #000;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                <tr style="page-break-inside: avoid; break-inside: avoid;">
                                    <td style="width: 140px; padding-bottom: 5px;">
                                        <div style="line-height: 1.2;">ลูกค้า</div>
                                        <div style="font-size:10px; line-height: 1.2;">Customer</div>
                                    </td>
                                    <td style="padding-bottom: 5px;" colspan="3">${cusInfo.code}<br><span style="color: transparent;">-</span></td>
                                </tr>
                                <tr style="page-break-inside: avoid; break-inside: avoid;">
                                    <td colspan="4" style="padding-bottom: 5px;">
                                        <div style="font-weight:bold; margin-bottom: 2px;">${customerNameInput.value || "ลูกค้าทั่วไป"}</div>
                                        <div style="margin-bottom: 2px;">${cusInfo.address_1 || "-"}</div>
                                        <div style="margin-bottom: 2px;">${cusInfo.district ? 'อ.'+cusInfo.district : ''} ${cusInfo.province ? 'จ.'+cusInfo.province : ''}</div>
                                        ${cusInfo.level_group ? "<div style='margin-bottom: 2px;'>กลุ่มลูกค้าระดับ: " + cusInfo.level_group + "</div>" : ""}
                                    </td>
                                </tr>
                                <tr style="page-break-inside: avoid; break-inside: avoid;">
                                    <td style="padding-bottom: 5px;">โทร.</td>
                                    <td style="padding-bottom: 5px;" colspan="3">${cusInfo.phone}</td>
                                </tr>
                                <tr style="page-break-inside: avoid; break-inside: avoid;">
                                    <td style="padding-bottom: 5px;">
                                        <div style="line-height: 1.2;">เลขประจำตัวผู้เสียภาษี</div>
                                        <div style="font-size:10px; line-height: 1.2;">Tax ID</div>
                                    </td>
                                    <td style="padding-bottom: 5px;">${cusInfo.tax_id}</td>
                                    <td style="padding-bottom: 5px; text-align: right;"></td>
                                    <td></td>
                                </tr>
                            </table>
                        </div>

                        <!-- Right Box -->
                        <div style="flex: 1; padding: 10px;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                <tr style="page-break-inside: avoid; break-inside: avoid;">
                                    <td style="width: 120px; padding-bottom: 5px;">
                                        <div style="line-height: 1.2;">เลขที่ใบเสนอราคา</div>
                                        <div style="font-size:10px; line-height: 1.2;">Quotation No.</div>
                                    </td>
                                    <td style="padding-bottom: 5px;"><span id="pdf-doc-no">${cusInfo.doc_no}</span></td>
                                </tr>
                                <tr style="page-break-inside: avoid; break-inside: avoid;">
                                    <td style="padding-bottom: 5px;">
                                        <div style="line-height: 1.2;">วันที่</div>
                                        <div style="font-size:10px; line-height: 1.2;">Date</div>
                                    </td>
                                    <td style="padding-bottom: 5px;">${cusInfo.doc_date_str}</td>
                                </tr>
                                <tr style="page-break-inside: avoid; break-inside: avoid;">
                                    <td style="padding-bottom: 5px;">
                                        <div style="line-height: 1.2;">เครดิต</div>
                                        <div style="font-size:10px; line-height: 1.2;">Credit Terms</div>
                                    </td>
                                    <td style="padding-bottom: 5px;">${cusInfo.credit_days} วัน <span style="font-size:10px">Days</span></td>
                                </tr>
                                <tr style="page-break-inside: avoid; break-inside: avoid;">
                                    <td style="padding-bottom: 5px;">
                                        <div style="line-height: 1.2;">วันยืนราคา</div>
                                        <div style="font-size:10px; line-height: 1.2;">Valid Until</div>
                                    </td>
                                    <td style="padding-bottom: 5px;">${cusInfo.due_date_str}</td>
                                </tr>
                                <tr style="page-break-inside: avoid; break-inside: avoid;">
                                    <td style="padding-bottom: 5px;">
                                        <div style="line-height: 1.2;">เงื่อนไขชำระเงิน</div>
                                        <div style="font-size:10px; line-height: 1.2;">Payment Terms</div>
                                    </td>
                                    <td style="padding-bottom: 5px;">${cusInfo.payment_terms}</td>
                                </tr>
                                <tr style="page-break-inside: avoid; break-inside: avoid;">
                                    <td style="padding-bottom: 5px;">
                                        <div style="line-height: 1.2;">พนักงานขาย</div>
                                        <div style="font-size:10px; line-height: 1.2;">Salesman</div>
                                    </td>
                                    <td style="padding-bottom: 5px;">
                                        ${cusInfo.pic_name}<br>
                                        <span style="font-size:11px">Tel: ${cusInfo.pic_phone || "-"}</span>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </div>

                    <!-- Items Table -->
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 0;">
                        <thead>
                            <tr style="background-color: #ff6666 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
                                <th style="letter-spacing: 0px !important; text-transform: none !important; padding: 5px; border: 1px solid #000; width: 50px; text-align: center;">
                                    <div style="line-height: 1.2;">ลำดับ</div>
                                    <div style="font-size:10px; line-height: 1.2;">No.</div>
                                </th>
                                <th style="letter-spacing: 0px !important; text-transform: none !important; padding: 5px; border: 1px solid #000; text-align: center;">
                                    <div style="line-height: 1.2;">รหัสสินค้า / รายละเอียด</div>
                                    <div style="font-size:10px; line-height: 1.2;">Code / Descriptions</div>
                                </th>
                                <th style="letter-spacing: 0px !important; text-transform: none !important; padding: 5px; border: 1px solid #000; width: 60px; text-align: center;">
                                    <div style="line-height: 1.2;">จำนวน</div>
                                    <div style="font-size:10px; line-height: 1.2;">Quantity</div>
                                </th>
                                <th style="letter-spacing: 0px !important; text-transform: none !important; padding: 5px; border: 1px solid #000; width: 60px; text-align: center;">
                                    <div style="line-height: 1.2;">หน่วย</div>
                                    <div style="font-size:10px; line-height: 1.2;">Unit</div>
                                </th>
                                <th style="letter-spacing: 0px !important; text-transform: none !important; padding: 5px; border: 1px solid #000; width: 100px; text-align: center;">
                                    <div style="line-height: 1.2;">หน่วยละ</div>
                                    <div style="font-size:10px; line-height: 1.2;">Unit Price</div>
                                </th>
                                <th style="letter-spacing: 0px !important; text-transform: none !important; padding: 5px; border: 1px solid #000; width: 120px; text-align: center;">
                                    <div style="line-height: 1.2;">จำนวนเงิน</div>
                                    <div style="font-size:10px; line-height: 1.2;">Amount</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody style="min-height: 150px; display: table-row-group;">
            `;

      let sumTotal = 0;
      items.forEach((item, index) => {
        const rowTotal = item.quantity * item.unit_price;
        sumTotal += rowTotal;
        tableHTML += `
                            <tr style="page-break-inside: avoid; break-inside: avoid;">
                                <td style="padding: 4px 5px; border-left: 1px solid #000; border-right: 1px solid #000; text-align: center; vertical-align: top;">${index + 1}</td>
                                <td style="padding: 4px 5px; border-right: 1px solid #000; vertical-align: top;">${item.description}</td>
                                <td style="padding: 4px 5px; border-right: 1px solid #000; text-align: center; vertical-align: top;">${item.quantity.toLocaleString()}</td>
                                <td style="padding: 4px 5px; border-right: 1px solid #000; text-align: center; vertical-align: top;">${item.unit || 'ชิ้น'}</td>
                                <td style="padding: 4px 5px; border-right: 1px solid #000; text-align: right; vertical-align: top;">${formatCurrency(item.unit_price)}</td>
                                <td style="padding: 4px 5px; border-right: 1px solid #000; text-align: right; vertical-align: top;">${formatCurrency(rowTotal)}</td>
                            </tr>
                `;
      });

      const bahtText = (amount) => {
        const number = Math.round(amount * 100) / 100;
        const numberStr = number.toFixed(2);
        const parts = numberStr.split('.');
        const integerPart = parts[0];
        const fractionalPart = parts[1];
        const text = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
        const unit = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
        const convert = (numStr) => {
            let result = '';
            for (let i = 0; i < numStr.length; i++) {
                const n = parseInt(numStr[i]);
                const pos = numStr.length - 1 - i;
                if (n !== 0) {
                    if (pos === 1 && n === 1) result += 'สิบ';
                    else if (pos === 1 && n === 2) result += 'ยี่สิบ';
                    else if (pos === 0 && n === 1 && numStr.length > 1 && numStr[numStr.length-2] !== '0') result += 'เอ็ด';
                    else result += text[n] + unit[pos % 6]; // Quick mod for larger numbers
                }
            }
            return result || 'ศูนย์';
        };
        let baht = convert(integerPart) + 'บาท';
        let satang = parseInt(fractionalPart) === 0 ? 'ถ้วน' : convert(fractionalPart) + 'สตางค์';
        return '( ' + baht + satang + ' )';
      };

      const gTotal = sumTotal * 1.07;
      const vat = sumTotal * 0.07;

      tableHTML += `
                            <tr style="page-break-inside: avoid; break-inside: avoid;">
                                <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px solid #000;"></td>
                                <td style="border-right: 1px solid #000; border-bottom: 1px solid #000;"></td>
                                <td style="border-right: 1px solid #000; border-bottom: 1px solid #000;"></td>
                                <td style="border-right: 1px solid #000; border-bottom: 1px solid #000;"></td>
                                <td style="border-right: 1px solid #000; border-bottom: 1px solid #000;"></td>
                                <td style="border-right: 1px solid #000; border-bottom: 1px solid #000;"></td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Summary Section -->
                    <div style="page-break-inside: avoid; break-inside: avoid; margin-top: 5px;">
                    <!-- Top: Remarks and Subtotals -->
                    <div style="display: flex; border: 1px solid #000; border-top: none; overflow: hidden;">
                        <!-- Left Remarks -->
                        <div style="flex: 1; border-right: 1px solid #000; padding: 10px; font-size: 11px;">
                            <strong>หมายเหตุ (Remarks):</strong><br>
                            - การเสนอราคานี้ยืนราคา ${cusInfo.credit_days} วัน<br>
                            ${cusInfo.remarks ? "- " + cusInfo.remarks + "<br>" : ""}
                            - ชำระเงินเข้าบัญชี: ธนาคารกสิกรไทย เลขที่บัญชี 123-4-56789-0 ชื่อบัญชี บจก. โซลโซไซตี้
                        </div>
                        
                        <!-- Right Totals -->
                        <div style="width: 260px; background: white; display: flex; flex-direction: column; justify-content: center;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                <tr style="page-break-inside: avoid; break-inside: avoid;">
                                    <td style="padding: 2px 10px;">รวมเป็นเงิน <span style="font-size:10px">(Gross Amount)</span></td>
                                    <td style="padding: 2px 10px; text-align: right;">${formatCurrency(sumTotal)}</td>
                                </tr>
                                <tr style="page-break-inside: avoid; break-inside: avoid;">
                                    <td style="padding: 2px 10px;">ภาษีมูลค่าเพิ่ม 7% <span style="font-size:10px">(VAT)</span></td>
                                    <td style="padding: 2px 10px; text-align: right;">${formatCurrency(vat)}</td>
                                </tr>
                            </table>
                        </div>
                    </div>

                    <!-- Bottom: Red Grand Total -->
                    <div style="display: flex; border: 1px solid #000; border-top: 1px solid #000; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; margin-bottom: 2px; overflow: hidden; background-color: #ff6666 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-weight: bold;">
                        <div style="flex: 1; border-right: 1px solid #000; padding: 10px; text-align: center; display: flex; align-items: center; justify-content: center;">
                            ${bahtText(gTotal)}
                        </div>
                        <div style="width: 260px; padding: 10px; display: flex; align-items: center; justify-content: space-between; font-size: 13px; box-sizing: border-box;">
                            <span>ยอดรวมทั้งสิ้น <span style="font-size:10px">(Grand Total)</span></span>
                            <span>${formatCurrency(gTotal)}</span>
                        </div>
                    </div>

                    <!-- Footer Signatures (Locked as Image) -->
                    ${generateSignatureCanvas(cusInfo.salesperson, cusInfo.doc_date_str)}

                    </div> <!-- End of page-break-avoid wrapper for Summary and Signature -->
                </div>
            `;

      previewContainer.innerHTML = tableHTML;
      previewModal.classList.remove("hidden");
    });
  }

  if (confirmPdfBtn) {
    confirmPdfBtn.addEventListener("click", async () => {
      const oldBtnText = confirmPdfBtn.innerHTML;
      confirmPdfBtn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึกและสร้าง PDF...';
      confirmPdfBtn.disabled = true;

      // Save Logic (Skip if we are just viewing an old quote)
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.get("view")) {
        try {
          const total = items.reduce(
            (sum, item) => sum + item.quantity * item.unit_price,
            0,
          );
          const fCredit = document.getElementById("form-credit-days");
          const fPayment = document.getElementById("form-payment-terms");
          const fSalesRepForm = document.getElementById("form-sales-rep");
          const payload = {
            customer_name: customerNameInput.value,
            total_amount: total,
            items: items,
            ai_prompt: aiPrompt.value,
            credit_days: fCredit ? fCredit.value : 30,
            payment_terms: fPayment ? fPayment.value : "Cash/Transfer",
            pic_code: fSalesRepForm ? fSalesRepForm.value : null,
            id: document.getElementById("quote-form").getAttribute("data-edit-id") || null,
          };

          const response = await fetch("/api/save-quote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            console.error("Auto-save failed but proceeding to PDF");
          } else {
            const data = await response.json();
            if (data.doc_no) {
                const docNoSpan = previewContainer.querySelector('#pdf-doc-no');
                if (docNoSpan) docNoSpan.innerText = data.doc_no;
                
                // Update memory so it persists if they preview again
                if (!window.loadedQuoteData) window.loadedQuoteData = {};
                window.loadedQuoteData.doc_no = data.doc_no;
                
                if (data.quoteId) {
                  document.getElementById("quote-form").setAttribute("data-edit-id", data.quoteId);
                }
            }
          }
        } catch (err) {
          console.error("Error auto-saving:", err);
        }
      }

      // 2. Generate PDF
      const opt = {
        margin: 0,
        filename: `quotation-${Date.now()}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, scrollY: 0, y: 0 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ['css', 'legacy'] },
      };

      // Critical fix for html2canvas blank/offset bug
      // 1. Force the page and modal to top
      window.scrollTo(0, 0);
      const modalBody = document.querySelector(".modal-body");
      const originalScroll = modalBody ? modalBody.scrollTop : 0;
      if (modalBody) modalBody.scrollTop = 0;

      // 2. Temporarily remove scroll limits so it renders fully
      const modalContent = document.querySelector(".modal-content");
      const origContentStyle = modalContent.getAttribute("style") || "";
      const origBodyStyle = modalBody.getAttribute("style") || "";

      modalContent.style.maxHeight = "none";
      modalContent.style.height = "auto";
      modalBody.style.maxHeight = "none";
      modalBody.style.height = "auto";
      modalBody.style.overflow = "visible";

      // 3. Allow DOM to repaint the updated doc_no before capturing
      await new Promise(r => setTimeout(r, 100));

      html2pdf()
        .set(opt)
        .from(previewContainer.firstElementChild)
        .save()
        .then(() => {
          // Restore styles and scroll
          modalContent.setAttribute("style", origContentStyle);
          modalBody.setAttribute("style", origBodyStyle);
          modalBody.scrollTop = originalScroll;

          confirmPdfBtn.innerHTML = oldBtnText;
          confirmPdfBtn.disabled = false;
          closeModal();

          if (urlParams.get("view")) {
            showToast("ดาวน์โหลด PDF สำเร็จ!");
            // Remove ?view from URL without reloading
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname,
            );
          } else {
            showToast("พิมพ์ PDF และบันทึกลงระบบอัตโนมัติสำเร็จ!");
          }

          // Clear draft so the next quote is fresh
          sessionStorage.removeItem("quotationDraft");

          // Reset the AI screen UI
          items = [];
          aiPrompt.value = "";
          customerNameInput.value = "";
          renderItems();
          document
            .getElementById("quotation-form-section")
            .classList.add("hidden");

          if (urlParams.get("edit")) {
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname,
            );
          }

          if (urlParams.get("modal") === "true") {
            window.parent.postMessage("quote_saved", "*");
          }
        });
    });
  }

  
  const urlParams = new URLSearchParams(window.location.search);
  const isModal = urlParams.get("modal") === "true";

  if (isModal) {
    document.querySelector(".sidebar").style.display = "none";
    document.querySelector(".main-content").style.marginLeft = "0";
    document.querySelector(".main-content").style.padding = "1rem";
    document.querySelector(".top-header").style.display = "none";
  }

window.loadQuoteData = (viewId, editId) => {
  const id = viewId || editId;
  fetch("/api/quote/" + id)
    .then((res) => res.json())
    .then((data) => {
      if (data.quote) {
        window.loadedQuoteData = data.quote;
        
        // Show form section
        const quotationFormSection = document.getElementById("quotation-form-section");
        if (quotationFormSection) {
          quotationFormSection.classList.remove("hidden");
        }

        // Set customer name
        const customerNameInput = document.getElementById("customer-name");
        if (customerNameInput) customerNameInput.value = data.quote.customer_name || "";
        
        // Set credit days and payment terms
        const fCredit = document.getElementById("form-credit-days");
        const fPayment = document.getElementById("form-payment-terms");
        if (fCredit) fCredit.value = data.quote.credit_days || 30;
        if (fPayment) fPayment.value = data.quote.payment_terms || "Cash/Transfer";
        
        // Set sales rep from DB
        const fSalesRep = document.getElementById("form-sales-rep");
        if (fSalesRep && data.quote.pic_code) {
          fSalesRep.value = data.quote.pic_code;
        }
        
        // Mark form as editing this record
        if (editId) {
          const form = document.getElementById("quote-form");
          if (form) form.setAttribute("data-edit-id", editId);
        }

        // Load items
        items = data.items.map((item) => ({
          description: item.description,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price),
        }));
        renderItems();

        if (editId) {
          const toastEl = document.getElementById("toast");
          const toastMsg = document.getElementById("toast-message");
          if (toastMsg) toastMsg.innerText = "โหลดข้อมูลสำหรับแก้ไขเรียบร้อยแล้ว";
          if (toastEl) {
            toastEl.classList.remove("hidden");
            setTimeout(() => toastEl.classList.add("hidden"), 3000);
          }
        }
      }
    })
    .catch((err) => {
      console.error("loadQuoteData error:", err);
    });
};

});
