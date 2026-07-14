const fs = require('fs');

// 1. Fix min-height in script.js
let scriptContent = fs.readFileSync('public/script.js', 'utf8');
scriptContent = scriptContent.replace(/min-height:\s*1080px/g, 'min-height: 1045px');
fs.writeFileSync('public/script.js', scriptContent);
console.log('Fixed script.js min-height');

// 2. Fix history.html
let histContent = fs.readFileSync('public/history.html', 'utf8');

// Fix signature parameter
histContent = histContent.replace(/function generateSignatureCanvas\(salesperson, docDate\) \{/, "function generateSignatureCanvas(salesperson, docDate, sigW = '734px') {");

histContent = histContent.replace(
  /return '<img src="' \+ canvas\.toDataURL\('image\/png'\) \+ '" style="width: 100%; max-width: 734px; margin-top: 5px;" alt="Locked Signatures" \/>';/,
  `return '<img src="' + canvas.toDataURL('image/png') + '" style="width: 100%; max-width: ' + sigW + '; margin-top: 5px;" alt="Locked Signatures" />';`
);

// Inject scaling logic
const oldLogic = `const isMany = items.length >= 15;
            const fBase = isMany ? '10px' : '12px';
            const fSmall = isMany ? '8px' : '9px';
            const pCell = isMany ? '1px 2px' : '2px 4px';`;

const newLogic = `const itemCount = items.length;
            let fBase = '12px', fSmall = '9px', pCell = '2px 4px', lh = '1.15', fH2 = '20px', fH2s = '18px', sigW = '734px', padCont = '10px 20px', pBox = '6px 10px', pTotal = '6px 10px';
            if (itemCount > 20) {
              fBase = '9px'; fSmall = '7px'; pCell = '1px 2px'; lh = '1.0'; fH2 = '16px'; fH2s = '14px'; sigW = '450px'; padCont = '4px 10px'; pBox = '2px 5px'; pTotal = '2px 5px';
            } else if (itemCount >= 15) {
              fBase = '10px'; fSmall = '8px'; pCell = '1.5px 3px'; lh = '1.05'; fH2 = '18px'; fH2s = '16px'; sigW = '550px'; padCont = '6px 12px'; pBox = '4px 8px'; pTotal = '4px 8px';
            } else if (itemCount >= 10) {
              fBase = '11px'; fSmall = '8px'; pCell = '2px 3px'; lh = '1.1'; fH2 = '19px'; fH2s = '17px'; sigW = '650px'; padCont = '8px 16px'; pBox = '5px 8px'; pTotal = '5px 8px';
            }`;

histContent = histContent.replace(oldLogic, newLogic);

// Fix layout variables in the template
histContent = histContent.replace(/<div style="width:794px;min-height:1080px;box-sizing:border-box;display:flex;flex-direction:column;font-family:'Prompt','Sarabun',sans-serif;letter-spacing:0px;color:#000;padding:40px;background:white;font-size:13px;line-height:1.4;margin:0;text-align:left;">/,
  `<div style="width:794px;min-height:1045px;box-sizing:border-box;display:flex;flex-direction:column;font-family:'Prompt','Sarabun',sans-serif;letter-spacing:0px;color:#000;padding:\${padCont};background:white;font-size:\${fBase};line-height:\${lh};margin:0;text-align:left;">`
);

histContent = histContent.replace(/<h2 style="margin:0;font-size:20px;font-weight:bold;">โซลโซไซตี้<\/h2>/,
  `<h2 style="margin:0;font-size:\${fH2};font-weight:bold;">โซลโซไซตี้</h2>`
);

histContent = histContent.replace(/<h2 style="margin:0;font-size:18px;font-weight:normal;">ใบเสนอราคา<\/h2>/,
  `<h2 style="margin:0;font-size:\${fH2s};font-weight:normal;">ใบเสนอราคา</h2>`
);

histContent = histContent.replace(/<div style="flex:1;padding:10px;border-right:1px solid #000;">/,
  `<div style="flex:1;padding:\${pBox};border-right:1px solid #000;">`
);

histContent = histContent.replace(/padding:4px 5px;/g, 'padding:${pCell};');
histContent = histContent.replace(/font-size:13px;/g, 'font-size:${fBase};');
histContent = histContent.replace(/font-size:12px;/g, 'font-size:${fBase};');
histContent = histContent.replace(/font-size:10px;/g, 'font-size:${fSmall};');
histContent = histContent.replace(/font-size:9px;/g, 'font-size:${fSmall};');

// Remove page-break-avoid
histContent = histContent.replace(/page-break-inside: avoid; break-inside: avoid;/g, 'page-break-inside: auto; break-inside: auto;');

// Pass sigW
histContent = histContent.replace(/\$\{generateSignatureCanvas\(q\.pic_name, docDateStr\)\}/, '${generateSignatureCanvas(q.pic_name, docDateStr, sigW)}');

fs.writeFileSync('public/history.html', histContent);
console.log('Fixed history.html completely');
