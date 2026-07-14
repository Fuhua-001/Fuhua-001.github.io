const fs = require('fs');

function fixHistory() {
  let content = fs.readFileSync('public/history.html', 'utf8');

  // Fix generateSignatureCanvas parameter
  content = content.replace(/function generateSignatureCanvas\(salesperson, docDate\) \{/, "function generateSignatureCanvas(salesperson, docDate, sigW = '734px') {");

  // Fix the image return inside generateSignatureCanvas
  // Wait, there might be multiple. We only replace the one inside history.html's generateSignatureCanvas.
  content = content.replace(/return '<img src="' \+ canvas\.toDataURL\('image\/png'\) \+ '" style="width: 100%; max-width: 734px; margin-top: 5px;" alt="Locked Signatures" \/>';/, `return '<img src="' + canvas.toDataURL('image/png') + '" style="width: 100%; max-width: ' + sigW + '; margin-top: 5px;" alt="Locked Signatures" />';`);

  // Fix the call inside pdfContent.innerHTML
  content = content.replace(/\$\{generateSignatureCanvas\(q\.pic_name, docDateStr\)\}/, '${generateSignatureCanvas(q.pic_name, docDateStr, sigW)}');

  fs.writeFileSync('public/history.html', content);
  console.log('Fixed history.html signature');
}

fixHistory();
