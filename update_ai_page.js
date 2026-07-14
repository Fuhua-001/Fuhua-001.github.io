const fs = require('fs');
let indexContent = fs.readFileSync('public/index.html', 'utf8');

// 1. In index.html, remove the AI prompt section
const startIdx = indexContent.indexOf('<section id="ai-prompt-section"');
const endIdx = indexContent.indexOf('</section>', startIdx) + 10;
const newIndexContent = indexContent.substring(0, startIdx) + indexContent.substring(endIdx);
fs.writeFileSync('public/index.html', newIndexContent);

// 2. In ai-assistant.html, remove the Form Section
let aiContent = fs.readFileSync('public/ai-assistant.html', 'utf8');
const formStart = aiContent.indexOf('<section class="card" style="margin-bottom: 2rem;">'); // This contains the Quotation Form
const formEnd = aiContent.indexOf('</section>', formStart) + 10;
// We actually want to remove the whole Quotation Form Section which might end at a different </section>
// Let's just find "<!-- Quotation Form Section -->"
const formCommentStart = aiContent.indexOf('<!-- Quotation Form Section -->');
const mainEnd = aiContent.indexOf('</main>');
const newAiContent = aiContent.substring(0, formCommentStart) + aiContent.substring(mainEnd);
fs.writeFileSync('public/ai-assistant.html', newAiContent);

// Update sidebar in all files
const files = fs.readdirSync('public').filter(f => f.endsWith('.html'));
for (let file of files) {
  let content = fs.readFileSync('public/' + file, 'utf8');
  if (!content.includes('ai-assistant.html')) {
    content = content.replace(
      '<a href="index.html" class="menu-item',
      '<a href="ai-assistant.html" class="menu-item"><i class="fa-solid fa-wand-magic-sparkles"></i> ผู้ช่วย AI</a>\n          <a href="index.html" class="menu-item'
    );
    // Fix active class logic: remove active from ai-assistant if it's not ai-assistant.html
    if (file !== 'ai-assistant.html') {
      content = content.replace('href="ai-assistant.html" class="menu-item active"', 'href="ai-assistant.html" class="menu-item"');
    } else {
      content = content.replace('href="index.html" class="menu-item active"', 'href="index.html" class="menu-item"');
      content = content.replace('href="ai-assistant.html" class="menu-item"', 'href="ai-assistant.html" class="menu-item active"');
      // Change title
      content = content.replace('<h1>สร้างใบเสนอราคา</h1>', '<h1>ผู้ช่วย AI</h1>');
    }
    fs.writeFileSync('public/' + file, content);
  }
}
