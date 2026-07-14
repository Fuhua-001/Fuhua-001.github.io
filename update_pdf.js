const fs = require('fs');

function updateFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace page-break-inside: avoid on summary
  content = content.replace(/<div style="page-break-inside: avoid; break-inside: avoid; margin-top: auto;">/g, '<div style="margin-top: auto; page-break-inside: auto; break-inside: auto;">');
  content = content.replace(/<div style="margin-top: auto; page-break-inside: avoid; break-inside: avoid;">/g, '<div style="margin-top: auto; page-break-inside: auto; break-inside: auto;">');
  
  // Reduce margins before table
  content = content.replace(/margin-bottom: 5px; overflow: hidden;/g, 'margin-bottom: 2px; overflow: hidden;');
  
  // Reduce td padding in history (it was 4px 5px, make it 2px 4px like script)
  content = content.replace(/padding:4px 5px;/g, 'padding:2px 4px;');
  
  // Add dynamic font sizing logic in script.js
  if (file.includes('script.js')) {
    content = content.replace(/let tableHTML = `/, `const isMany = items.length >= 15;
      const fBase = isMany ? '10px' : '12px';
      const fSmall = isMany ? '8px' : '9px';
      const pCell = isMany ? '1px 2px' : '2px 4px';
      
      let tableHTML = \``);
    
    // Replace font sizes in template with variables
    content = content.replace(/font-size: 12px;/g, 'font-size: ${fBase};');
    content = content.replace(/font-size: 9px;/g, 'font-size: ${fSmall};');
    content = content.replace(/padding: 4px;/g, 'padding: ${pCell};'); // for th
    content = content.replace(/padding: 3px 4px;/g, 'padding: ${pCell};'); // for td
  }
  
  // Add dynamic font sizing logic in history.html
  if (file.includes('history.html')) {
    content = content.replace(/pdfContent.innerHTML = `/, `const isMany = items.length >= 15;
            const fBase = isMany ? '10px' : '12px';
            const fSmall = isMany ? '8px' : '9px';
            const pCell = isMany ? '1px 2px' : '2px 4px';
            
            pdfContent.innerHTML = \``);
            
    content = content.replace(/font-size:12px;/g, 'font-size:${fBase};');
    content = content.replace(/font-size:9px;/g, 'font-size:${fSmall};');
    content = content.replace(/padding:4px;/g, 'padding:${pCell};'); // th
    content = content.replace(/padding:2px 4px;/g, 'padding:${pCell};'); // td (after being replaced from 4px 5px)
  }

  fs.writeFileSync(file, content);
  console.log('Updated', file);
}

updateFile('C:/Promtp/quotation-app/public/script.js');
updateFile('C:/Promtp/quotation-app/public/history.html');
