const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf8');

// Modificamos loadPageContent para aceptar dataOverride
js = js.replace(/async function loadPageContent\(\) \{[\s\S]*?const \{ data, error \} = await _s\.from\('contenido_pagina'\)\.select\('\*'\);\s*if \(error \|\| !data \|\| data\.length === 0\) return; \/\/ Usa defaults del HTML/, 
`async function loadPageContent(dataOverride) {
    let data = dataOverride;
    if (!data) {
        const { data: dbData, error } = await _s.from('contenido_pagina').select('*');
        if (error || !dbData || dbData.length === 0) return;
        data = dbData;
    }`);

// Añadimos el listener de postMessage al inicio (después de imports o _s init)
const msgListener = `
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'cms_live_preview') {
        loadPageContent(event.data.payload);
    }
});
`;
js = js.replace('// ── CONTENT CMS ──────────────────────────', msgListener + '\n// ── CONTENT CMS ──────────────────────────');

fs.writeFileSync('script.js', js, 'utf8');
console.log('script.js actualizado');
