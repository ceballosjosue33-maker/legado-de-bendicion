const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf8');

const regex = /window\.addEventListener\('message'[\s\S]*?\/\/ ── EFECTOS DE SCROLL Y NAVBAR ──/;

if (regex.test(js)) {
    js = js.replace(regex, '// ── EFECTOS DE SCROLL Y NAVBAR ──');
    fs.writeFileSync('script.js', js, 'utf8');
    console.log('Cleaned old loadPageContent logic.');
} else {
    console.log('Regex did not match.');
}
