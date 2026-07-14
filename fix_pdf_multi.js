const fs = require('fs');

function applyMultiPageFix(file) {
  let content = fs.readFileSync(file, 'utf8');

  // 1. Remove flexbox from .pdf-container and set min-height to auto
  content = content.replace(/min-height:\s*1045px;\s*box-sizing:\s*border-box;\s*display:\s*flex;\s*flex-direction:\s*column;/g, 'min-height: auto; box-sizing: border-box; display: block;');
  content = content.replace(/min-height:\s*1080px;\s*box-sizing:\s*border-box;\s*display:\s*flex;\s*flex-direction:\s*column;/g, 'min-height: auto; box-sizing: border-box; display: block;');
  
  // also handle the case where it was already min-height: auto just in case
  content = content.replace(/min-height:\s*auto;\s*box-sizing:\s*border-box;\s*display:\s*flex;\s*flex-direction:\s*column;/g, 'min-height: auto; box-sizing: border-box; display: block;');

  // 2. Remove flex: 1 from the table style
  content = content.replace(/table-layout:\s*fixed;\s*flex:\s*1;/g, 'table-layout: fixed;');

  // 3. Remove the empty placeholder row completely
  const emptyRowRegex = /<tr[^>]*height:\s*100%[^>]*>[\s\S]*?<\/tr>/g;
  content = content.replace(emptyRowRegex, '');

  // 4. Ensure tbody has no min-height
  content = content.replace(/<tbody style="min-height:\s*100px;\s*display:\s*table-row-group;">/g, '<tbody style="display: table-row-group;">');

  // 5. Ensure the summary div doesn't use margin-top: auto
  content = content.replace(/margin-top:\s*auto;/g, 'margin-top: 20px;');

  // 6. Ensure table header has table-header-group
  content = content.replace(/<thead>/g, '<thead style="display: table-header-group; page-break-inside: avoid; break-inside: avoid;">');

  // 7. Remove progressive scaling, back to standard
  const oldLogic = `const itemCount = items.length;
      let fBase = '12px', fSmall = '9px', pCell = '2px 4px', lh = '1.15', fH2 = '20px', fH2s = '18px', sigW = '734px', padCont = '10px 20px', pBox = '6px 10px', pTotal = '6px 10px';
      
      if (itemCount > 20) {
        fBase = '9px'; fSmall = '7px'; pCell = '1px 2px'; lh = '1.0'; fH2 = '16px'; fH2s = '14px'; sigW = '450px'; padCont = '4px 10px'; pBox = '2px 5px'; pTotal = '2px 5px';
      } else if (itemCount >= 15) {
        fBase = '10px'; fSmall = '8px'; pCell = '1.5px 3px'; lh = '1.05'; fH2 = '18px'; fH2s = '16px'; sigW = '550px'; padCont = '6px 12px'; pBox = '4px 8px'; pTotal = '4px 8px';
      } else if (itemCount >= 10) {
        fBase = '11px'; fSmall = '8px'; pCell = '2px 3px'; lh = '1.1'; fH2 = '19px'; fH2s = '17px'; sigW = '650px'; padCont = '8px 16px'; pBox = '5px 8px'; pTotal = '5px 8px';
      }`;
  
  const standardLogic = `let fBase = '13px', fSmall = '10px', pCell = '6px 8px', lh = '1.25', fH2 = '22px', fH2s = '20px', sigW = '734px', padCont = '20px 30px', pBox = '10px 15px', pTotal = '8px 12px';`;
  
  if (content.includes(oldLogic)) {
      content = content.replace(oldLogic, standardLogic);
  }

  const oldLogicHist = `const itemCount = items.length;
            let fBase = '12px', fSmall = '9px', pCell = '2px 4px', lh = '1.15', fH2 = '20px', fH2s = '18px', sigW = '734px', padCont = '10px 20px', pBox = '6px 10px', pTotal = '6px 10px';
            if (itemCount > 20) {
              fBase = '9px'; fSmall = '7px'; pCell = '1px 2px'; lh = '1.0'; fH2 = '16px'; fH2s = '14px'; sigW = '450px'; padCont = '4px 10px'; pBox = '2px 5px'; pTotal = '2px 5px';
            } else if (itemCount >= 15) {
              fBase = '10px'; fSmall = '8px'; pCell = '1.5px 3px'; lh = '1.05'; fH2 = '18px'; fH2s = '16px'; sigW = '550px'; padCont = '6px 12px'; pBox = '4px 8px'; pTotal = '4px 8px';
            } else if (itemCount >= 10) {
              fBase = '11px'; fSmall = '8px'; pCell = '2px 3px'; lh = '1.1'; fH2 = '19px'; fH2s = '17px'; sigW = '650px'; padCont = '8px 16px'; pBox = '5px 8px'; pTotal = '5px 8px';
            }`;

  const standardLogicHist = `let fBase = '13px', fSmall = '10px', pCell = '6px 8px', lh = '1.25', fH2 = '22px', fH2s = '20px', sigW = '734px', padCont = '20px 30px', pBox = '10px 15px', pTotal = '8px 12px';`;

  if (content.includes(oldLogicHist)) {
      content = content.replace(oldLogicHist, standardLogicHist);
  }

  fs.writeFileSync(file, content);
  console.log('Applied multi-page fixes to', file);
}

applyMultiPageFix('C:/Promtp/quotation-app/public/script.js');
applyMultiPageFix('C:/Promtp/quotation-app/public/history.html');
