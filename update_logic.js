const fs = require('fs');

function updateFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Replace the simple logic with advanced progressive scaling
  const oldLogic = `const isMany = items.length >= 15;
      const fBase = isMany ? '10px' : '12px';
      const fSmall = isMany ? '8px' : '9px';
      const pCell = isMany ? '1px 2px' : '2px 4px';
      const lh = isMany ? '1.05' : '1.15';`;

  const newLogic = `const itemCount = items.length;
      let fBase = '12px', fSmall = '9px', pCell = '2px 4px', lh = '1.15', fH2 = '20px', fH2s = '18px', sigW = '734px', padCont = '10px 20px', pBox = '6px 10px', pTotal = '6px 10px';
      
      if (itemCount > 20) {
        fBase = '9px'; fSmall = '7px'; pCell = '1px 2px'; lh = '1.0'; fH2 = '16px'; fH2s = '14px'; sigW = '450px'; padCont = '4px 10px'; pBox = '2px 5px'; pTotal = '2px 5px';
      } else if (itemCount >= 15) {
        fBase = '10px'; fSmall = '8px'; pCell = '1.5px 3px'; lh = '1.05'; fH2 = '18px'; fH2s = '16px'; sigW = '550px'; padCont = '6px 12px'; pBox = '4px 8px'; pTotal = '4px 8px';
      } else if (itemCount >= 10) {
        fBase = '11px'; fSmall = '8px'; pCell = '2px 3px'; lh = '1.1'; fH2 = '19px'; fH2s = '17px'; sigW = '650px'; padCont = '8px 16px'; pBox = '5px 8px'; pTotal = '5px 8px';
      }`;

  if (content.includes(oldLogic)) {
    content = content.replace(oldLogic, newLogic);
  } else {
    // try to replace the history.html version
    const oldLogicHist = `const isMany = items.length >= 15;
            const fBase = isMany ? '10px' : '12px';
            const fSmall = isMany ? '8px' : '9px';
            const pCell = isMany ? '1px 2px' : '2px 4px';
            const lh = isMany ? '1.05' : '1.15';`;
            
    const newLogicHist = `const itemCount = items.length;
            let fBase = '12px', fSmall = '9px', pCell = '2px 4px', lh = '1.15', fH2 = '20px', fH2s = '18px', sigW = '734px', padCont = '10px 20px', pBox = '6px 10px', pTotal = '6px 10px';
            if (itemCount > 20) {
              fBase = '9px'; fSmall = '7px'; pCell = '1px 2px'; lh = '1.0'; fH2 = '16px'; fH2s = '14px'; sigW = '450px'; padCont = '4px 10px'; pBox = '2px 5px'; pTotal = '2px 5px';
            } else if (itemCount >= 15) {
              fBase = '10px'; fSmall = '8px'; pCell = '1.5px 3px'; lh = '1.05'; fH2 = '18px'; fH2s = '16px'; sigW = '550px'; padCont = '6px 12px'; pBox = '4px 8px'; pTotal = '4px 8px';
            } else if (itemCount >= 10) {
              fBase = '11px'; fSmall = '8px'; pCell = '2px 3px'; lh = '1.1'; fH2 = '19px'; fH2s = '17px'; sigW = '650px'; padCont = '8px 16px'; pBox = '5px 8px'; pTotal = '5px 8px';
            }`;
    content = content.replace(oldLogicHist, newLogicHist);
  }

  // Now replace the dynamic variables into the template
  // H2 sizes
  content = content.replace(/font-size: 20px;/g, 'font-size: ${fH2};');
  content = content.replace(/font-size: 18px;/g, 'font-size: ${fH2s};');
  
  // Padding Container
  content = content.replace(/padding: 10px 20px;/g, 'padding: ${padCont};');
  
  // Padding Info Box / Summary
  content = content.replace(/padding: 6px 10px;/g, 'padding: ${pBox};');
  content = content.replace(/padding:6px 10px;/g, 'padding:${pBox};'); // for history.html
  
  // Signature width
  content = content.replace(/max-width: 734px;/g, 'max-width: ${sigW};');

  fs.writeFileSync(file, content);
  console.log('Updated', file);
}

updateFile('C:/Promtp/quotation-app/public/script.js');
updateFile('C:/Promtp/quotation-app/public/history.html');
