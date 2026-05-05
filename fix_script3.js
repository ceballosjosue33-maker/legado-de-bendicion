const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf8');

const start = js.indexOf("window.addEventListener('message'");
const end = js.indexOf("// ── EFECTOS DE SCROLL Y NAVBAR ──");

if (start !== -1 && end !== -1) {
    js = js.substring(0, start) + js.substring(end);
    fs.writeFileSync('script.js', js, 'utf8');
    console.log('Cleaned successfully.');
} else {
    console.log('Not found.');
}
