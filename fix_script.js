const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf8');

// Find and delete everything related to loadPageContent
const startStr = '// ── CONTENT CMS ──────────────────────────';
const endStr = '// ── EFECTOS DE SCROLL Y NAVBAR ──';

const startIndex = js.indexOf(startStr);
const endIndex = js.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    js = js.substring(0, startIndex) + '\n\n' + js.substring(endIndex);
    fs.writeFileSync('script.js', js, 'utf8');
    console.log('Removed old CMS logic from script.js');
} else {
    console.log('Could not find boundaries, check script.js manually');
}
