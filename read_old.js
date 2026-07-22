const fs = require('fs');
const lines = fs.readFileSync('old_script.js', 'utf8').split('\n');
const idx = lines.findIndex(l => l.includes('const renderItems = ()'));
if (idx > 0) {
  console.log(lines.slice(idx, idx+40).join('\n'));
}
