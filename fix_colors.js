const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if(file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.css')) results.push(file);
        }
    });
    return results;
}

const files = walk(publicDir);

const replacements = [
    { pattern: /#ef4444/gi, replacement: 'var(--accent-danger)' },
    { pattern: /#10b981/gi, replacement: 'var(--accent-success)' },
    { pattern: /#3b82f6/gi, replacement: 'var(--accent-primary)' },
    { pattern: /#eab308/gi, replacement: 'var(--accent-warning)' },
    { pattern: /#f8fafc/gi, replacement: 'var(--bg-card)' },
    { pattern: /#f1f5f9/gi, replacement: 'var(--bg-body)' },
    { pattern: /#e2e8f0/gi, replacement: 'var(--border-color)' },
    { pattern: /#0f172a/gi, replacement: 'var(--text-main)' },
    { pattern: /#64748b/gi, replacement: 'var(--text-muted)' },
    { pattern: /Stainless\.Stell\@gmail\.com/g, replacement: 'Stainless.Steel@gmail.com' }
];

let changedCount = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    replacements.forEach(r => {
        content = content.replace(r.pattern, r.replacement);
    });
    
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedCount++;
        console.log('Fixed:', file);
    }
});
console.log('Total files fixed:', changedCount);
