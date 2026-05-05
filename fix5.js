const fs = require('fs');
let js = fs.readFileSync('dashboard-pastor-web.js', 'utf8');

// Add sendLivePreview function
const newFunc = `
function sendLivePreview() {
    const iframe = document.getElementById('cms-preview-iframe');
    if (!iframe || !iframe.contentWindow) return;

    // Collect current form payloads
    const currentSection = currentCmsSection;
    const form = document.getElementById('cms-form');
    if (!form) return;

    const payloads = [];
    form.querySelectorAll('.cms-value-input').forEach(input => {
        const campo = input.getAttribute('data-campo');
        const isCheckbox = input.type === 'checkbox';
        const val = isCheckbox ? (input.checked ? 'true' : 'false') : input.value;
        payloads.push({ seccion: currentSection, campo: campo, valor_texto: val });
    });
    form.querySelectorAll('.cms-image-url-input').forEach(input => {
        const campo = input.getAttribute('data-campo');
        let p = payloads.find(x => x.campo === campo);
        if(p) p.valor_imagen_url = input.value;
        else payloads.push({ seccion: currentSection, campo: campo, valor_imagen_url: input.value });
    });

    // Merge with existing cmsData (convert cmsData object to array)
    const allData = Object.values(cmsData).map(row => {
        // If this row belongs to the current section being edited, we skip it here and use the payload instead
        const p = payloads.find(x => x.seccion === row.seccion && x.campo === row.campo);
        if (p) return null;
        return row;
    }).filter(Boolean);

    // Concatenate allData with current payloads
    const mergedData = allData.concat(payloads);

    iframe.contentWindow.postMessage({
        type: 'cms_live_preview',
        payload: mergedData
    }, '*');
}
`;

// Insert the new function at the end
js += newFunc;

// Call sendLivePreview inside the input event listeners
js = js.replace(/document\.getElementById\('cms-form'\)\.addEventListener\('input', \(\) => hasUnsavedCmsChanges = true\);/g, `document.getElementById('cms-form').addEventListener('input', () => { hasUnsavedCmsChanges = true; sendLivePreview(); });`);

// Inside setupJSONLists, update renderItems to call sendLivePreview
js = js.replace(/hiddenInput\.value = JSON\.stringify\(items\);\s*hasUnsavedCmsChanges = true;/g, `hiddenInput.value = JSON.stringify(items); hasUnsavedCmsChanges = true; sendLivePreview();`);

// Also call sendLivePreview initially after rendering the form
js = js.replace(/setupJSONLists\(section\);\s*\/\/ Submit logic/g, `setupJSONLists(section);\n    sendLivePreview();\n\n    // Submit logic`);

// When file is uploaded to drag&drop, reader.onload finishes, we update preview and call sendLivePreview.
// But wait, the file isn't uploaded yet! It's just a local DataURL. We can put the DataURL in the hidden input TEMPORARILY just for the preview!
js = js.replace(/reader\.onload = \(e\) => \{\s*preview\.innerHTML = `<img src="\$\{e\.target\.result\}"> <p class="text-gold text-micro mt-1">Pendiente por guardar\.\.\.<\/p>`;\s*\}/g, `reader.onload = (e) => {
                    preview.innerHTML = \`<img src="\${e.target.result}"> <p class="text-gold text-micro mt-1">Pendiente por guardar...</p>\`;
                    const urlInput = zone.querySelector('.cms-image-url-input');
                    if (urlInput) urlInput.value = e.target.result; // Use base64 for live preview
                    sendLivePreview();
                }`);

fs.writeFileSync('dashboard-pastor-web.js', js, 'utf8');
console.log('dashboard-pastor-web.js patched');
