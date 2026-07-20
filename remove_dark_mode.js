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
            if(file.endsWith('.html') || file.endsWith('.js')) results.push(file);
        }
    });
    return results;
}

const files = walk(publicDir);

let changedCount = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Remove the inline script
    content = content.replace(/<script>\(function\(\)\{var t=localStorage.*?\}\)\(\);<\/script>\n?/g, '');
    
    // Remove the toggle button
    content = content.replace(/<button class="dark-mode-toggle"[^>]*>[\s\S]*?<\/button>\n?/g, '');
    
    if (file.endsWith('script.js')) {
        content = content.replace(/\/\/ --- Dark Mode Logic ---[\s\S]*?setupDarkMode\(\);\n/g, '');
    }
    
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedCount++;
        console.log('Removed dark mode from:', file);
    }
});
console.log('Total files processed:', changedCount);
