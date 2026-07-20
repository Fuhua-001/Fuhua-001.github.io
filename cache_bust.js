const fs = require('fs');
const files = ['public/ai-assistant.html', 'public/index.html', 'public/history.html', 'public/customers.html', 'public/products.html'];
const t = Date.now();
for (const file of files) {
  if (fs.existsSync(file)) {
    let html = fs.readFileSync(file, 'utf8');
    html = html.replace(/src=\"js\/script\.js\??[^\"]*\"/g, 'src="js/script.js?v=' + t + '"');
    fs.writeFileSync(file, html);
    console.log('Updated', file);
  }
}
