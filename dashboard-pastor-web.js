// dashboard-pastor-web.js
// Editor de Página Web Avanzado

let cmsData = {}; // Guardará { "seccion_campo": { valor_texto, valor_imagen_url } }
let currentCmsSection = 'navbar';
let hasUnsavedCmsChanges = false;

document.addEventListener('DOMContentLoaded', () => {
    // Escuchar clics en los tabs (solo cuando estamos en la vista de contenido web)
    document.getElementById('nav-content')?.addEventListener('click', initCMS);
    
    document.querySelectorAll('.cms-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            if (hasUnsavedCmsChanges) {
                if (!confirm('Tienes cambios sin guardar. ¿Deseas continuar y perder los cambios?')) return;
            }
            document.querySelectorAll('.cms-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentCmsSection = e.target.getAttribute('data-section');
            renderCMSForm(currentCmsSection);
        });
    });

    // Inyectar estilos para los tabs si no existen
    const style = document.createElement('style');
    style.innerHTML = `
        .cms-tab { background: transparent; color: #8A9E8A; border: none; padding: 15px 20px; text-align: left; font-family: var(--font-body); font-size: 1rem; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05); transition: all 0.3s; }
        .cms-tab:hover { background: rgba(201,168,76,0.05); color: #F5F0E8; }
        .cms-tab.active { background: #1A3A1A; border-left: 4px solid #C9A84C; color: #C9A84C; font-weight: bold; }
        
        .cms-field-group { margin-bottom: 25px; background: rgba(0,0,0,0.2); padding: 20px; border-radius: 8px; border: 0.5px solid rgba(201,168,76,0.2); }
        .cms-label { display: block; color: #C9A84C; font-family: var(--font-heading); font-size: 1.2rem; margin-bottom: 10px; }
        .cms-input { width: 100%; background: #1A3A1A; border: 0.5px solid rgba(201,168,76,0.3); color: #F5F0E8; padding: 12px; border-radius: 6px; font-family: var(--font-body); font-size: 1rem; box-sizing: border-box; }
        .cms-input:focus { outline: none; border-color: #C9A84C; }
        
        .drop-zone { border: 2px dashed rgba(201,168,76,0.5); padding: 30px; text-align: center; border-radius: 8px; cursor: pointer; transition: background 0.3s; background: rgba(0,0,0,0.2); position: relative; overflow: hidden; }
        .drop-zone:hover { background: rgba(201,168,76,0.1); }
        .drop-zone img { max-height: 150px; border-radius: 4px; margin-top: 15px; }
    `;
    document.head.appendChild(style);

    setTimeout(initCMS, 1000);
});

async function initCMS() {
    const area = document.getElementById('cms-content-area');
    if (!area) return;
    area.innerHTML = '<div class="text-center text-secondary mt-5"><div class="spinner mb-2"></div>Cargando datos del servidor...</div>';
    
    try {
        const { data, error } = await _s.from('contenido_pagina').select('*');
        if (error) throw error;
        
        cmsData = {};
        (data || []).forEach(row => {
            cmsData[`${row.seccion}_${row.campo}`] = row;
        });

        hasUnsavedCmsChanges = false;
        renderCMSForm(currentCmsSection);
    } catch (err) {
        area.innerHTML = `<div class="text-center" style="color:#ff6b6b">Error cargando CMS: ${err.message}</div>`;
    }
}

// Helper para obtener el valor guardado
function getCMSVal(seccion, campo, isImage = false) {
    const key = `${seccion}_${campo}`;
    if (!cmsData[key]) return '';
    return isImage ? (cmsData[key].valor_imagen_url || '') : (cmsData[key].valor_texto || '');
}

// Generador de formularios dinámico
function renderCMSForm(section) {
    const area = document.getElementById('cms-content-area');
    let html = `<h2 style="color: #C9A84C; font-family: var(--font-heading); font-size: 2.5rem; margin-top: 0; margin-bottom: 2rem; border-bottom: 1px solid rgba(201,168,76,0.2); padding-bottom: 15px;">Editar ${section.charAt(0).toUpperCase() + section.slice(1)}</h2>`;
    html += `<form id="cms-form" data-section="${section}">`;

    if (section === 'navbar') {
        html += renderTextInput('Nombre de la Iglesia', 'iglesia_nombre');
        html += renderTextInput('Texto Botón Principal', 'btn_cta');
        html += renderImageUpload('Logo de la Iglesia', 'logo');
        html += `<h3 class="cms-label mt-4">Enlaces del Menú</h3>`;
        ['inicio', 'horarios', 'nosotros', 'eventos', 'sermones', 'curso', 'contacto'].forEach(link => {
            html += renderToggle(`Mostrar link: ${link.charAt(0).toUpperCase() + link.slice(1)}`, `show_link_${link}`, 'true');
        });
    } 
    else if (section === 'hero') {
        html += renderTextInput('Título Línea 1', 'titulo_1');
        html += renderTextInput('Título Línea 2 (Cursiva Dorada)', 'titulo_2');
        html += renderTextInput('Subtítulo', 'subtitulo');
        html += renderTextInput('Texto Botón Primario', 'btn_primario');
        html += renderTextInput('Texto Botón Secundario', 'btn_secundario');
        html += renderTextInput('Versículo Decorativo', 'versiculo');
        html += renderImageUpload('Imagen de Fondo (Reemplaza degradado)', 'fondo');
    }
    else if (section === 'horarios') {
        html += renderTextInput('Título de la Sección', 'titulo');
        html += renderJSONListEditor('Bloques de Culto', 'lista_cultos', [
            { key: 'nombre', label: 'Nombre del Culto', type: 'text' },
            { key: 'dia_hora', label: 'Día y Hora', type: 'text' },
            { key: 'descripcion', label: 'Descripción corta', type: 'text' },
            { key: 'icono', label: 'Ícono (cruz/libro/corazon/estrella)', type: 'text' }
        ], 5);
    }
    else if (section === 'nosotros') {
        html += renderTextInput('Título de la Sección', 'titulo');
        html += renderTextArea('Historia de la Iglesia', 'historia');
        html += renderTextInput('Título Misión', 'mision_titulo');
        html += renderTextArea('Texto Misión', 'mision_texto');
        html += renderTextInput('Título Visión', 'vision_titulo');
        html += renderTextArea('Texto Visión', 'vision_texto');
        html += renderImageUpload('Foto Principal', 'foto_principal');
        html += renderJSONListEditor('Métricas (Máx 3)', 'metricas', [
            { key: 'valor', label: 'Número o Valor (ej: 15+)', type: 'text' },
            { key: 'etiqueta', label: 'Etiqueta (ej: Años)', type: 'text' }
        ], 3);
    }
    else if (section === 'eventos') {
        html += renderTextInput('Título de la Sección', 'titulo');
        html += renderJSONListEditor('Lista de Eventos', 'lista_eventos', [
            { key: 'titulo', label: 'Título del Evento', type: 'text' },
            { key: 'fecha', label: 'Fecha', type: 'date' },
            { key: 'descripcion', label: 'Descripción corta', type: 'text' },
            { key: 'link', label: 'Link de inscripción (opcional)', type: 'text' },
            { key: 'imagen_url', label: 'URL de Imagen (pegar link)', type: 'text' }
        ], 6);
    }
    else if (section === 'sermones') {
        html += renderTextInput('Título de la Sección', 'titulo');
        html += renderJSONListEditor('Lista de Sermones', 'lista_sermones', [
            { key: 'titulo', label: 'Título del Sermón', type: 'text' },
            { key: 'predicador', label: 'Predicador', type: 'text' },
            { key: 'fecha', label: 'Fecha', type: 'date' },
            { key: 'categoria', label: 'Categoría', type: 'text' },
            { key: 'video_url', label: 'URL de YouTube', type: 'text' }
        ], 9);
    }
    else if (section === 'contacto') {
        html += renderTextInput('Título de la Sección', 'titulo');
        html += renderTextInput('Dirección Física', 'direccion');
        html += renderTextInput('Número de Teléfono', 'telefono');
        html += renderTextInput('Email de Contacto', 'email');
        html += renderTextInput('URL Embed Google Maps', 'mapa_url');
        html += `<h3 class="cms-label mt-4">Redes Sociales (Dejar vacío para ocultar)</h3>`;
        ['facebook', 'instagram', 'youtube', 'whatsapp', 'tiktok'].forEach(rs => {
            html += renderTextInput(`URL de ${rs.charAt(0).toUpperCase() + rs.slice(1)}`, `social_${rs}`);
        });
    }
    else if (section === 'footer') {
        html += renderTextInput('Versículo Decorativo', 'versiculo');
        html += renderTextInput('Texto de Copyright', 'copyright');
        html += renderTextInput('Slogan de la Iglesia', 'slogan');
    }
    else if (section === 'estilos') {
        html += renderColorInput('Color Dorado Principal', 'color_dorado', '#C9A84C');
        html += renderColorInput('Color de Fondo', 'color_fondo', '#0A0F0A');
        html += renderColorInput('Color Verde Oscuro', 'color_verde', '#0F1F0F');
        html += renderColorInput('Color de Texto Secundario', 'color_texto', '#8A9E8A');
        
        html += `<div class="cms-field-group">
            <label class="cms-label">Fuente para Títulos</label>
            <select class="cms-input cms-value-input" data-campo="fuente_titulos">
                <option value="Cormorant Garamond">Cormorant Garamond</option>
                <option value="Playfair Display">Playfair Display</option>
                <option value="EB Garamond">EB Garamond</option>
                <option value="Cinzel">Cinzel</option>
            </select>
        </div>`;
        html += `<div class="cms-field-group">
            <label class="cms-label">Fuente para Cuerpo de Texto</label>
            <select class="cms-input cms-value-input" data-campo="fuente_cuerpo">
                <option value="Outfit">Outfit</option>
                <option value="Inter">Inter</option>
                <option value="Nunito">Nunito</option>
            </select>
        </div>`;
    }

    html += `
        <div style="position: sticky; bottom: 0; background: #111A11; padding: 20px 0; border-top: 1px solid rgba(201,168,76,0.2); margin-top: 40px; display: flex; justify-content: flex-end; z-index: 10;">
            <button type="submit" class="btn-primary" style="font-size: 1.1rem; padding: 12px 30px;" id="btn-save-cms">💾 Guardar Cambios</button>
        </div>
    </form>`;

    area.innerHTML = html;

    // Set values
    if (section === 'estilos') {
        const t = document.querySelector('[data-campo="fuente_titulos"]');
        if(t) t.value = getCMSVal('estilos', 'fuente_titulos') || 'Cormorant Garamond';
        const c = document.querySelector('[data-campo="fuente_cuerpo"]');
        if(c) c.value = getCMSVal('estilos', 'fuente_cuerpo') || 'Outfit';
    }

    // Set change listener for unsaved warning
    document.getElementById('cms-form').addEventListener('input', () => { hasUnsavedCmsChanges = true; sendLivePreview(); });
    
    // File uploads logic
    setupDragAndDrop(section);

    // Dynamic Lists logic
    setupJSONLists(section);
    sendLivePreview();

    // Submit logic
    document.getElementById('cms-form').addEventListener('submit', handleCMSSubmit);
}

function renderTextInput(label, campo) {
    const val = getCMSVal(currentCmsSection, campo).replace(/"/g, '&quot;');
    return `<div class="cms-field-group">
        <label class="cms-label">${label}</label>
        <input type="text" class="cms-input cms-value-input" data-campo="${campo}" value="${val}">
    </div>`;
}

function renderColorInput(label, campo, def) {
    const val = getCMSVal(currentCmsSection, campo) || def;
    return `<div class="cms-field-group" style="display:flex; align-items:center; gap: 15px;">
        <label class="cms-label" style="margin:0;">${label}</label>
        <input type="color" class="cms-value-input" data-campo="${campo}" value="${val}" style="width:50px;height:40px;cursor:pointer;border:none;background:transparent;">
    </div>`;
}

function renderTextArea(label, campo) {
    const val = getCMSVal(currentCmsSection, campo);
    return `<div class="cms-field-group">
        <label class="cms-label">${label}</label>
        <textarea class="cms-input cms-value-input" data-campo="${campo}" rows="4">${val}</textarea>
    </div>`;
}

function renderToggle(label, campo, defVal = 'false') {
    const val = getCMSVal(currentCmsSection, campo) || defVal;
    const isChecked = val === 'true';
    return `<div class="cms-field-group" style="display:flex; align-items:center; gap:10px; padding: 10px 20px;">
        <input type="checkbox" class="cms-value-input" data-campo="${campo}" ${isChecked ? 'checked' : ''} style="width:20px;height:20px;accent-color:#C9A84C;">
        <label class="cms-label" style="margin:0;">${label}</label>
    </div>`;
}

function renderImageUpload(label, campo) {
    const url = getCMSVal(currentCmsSection, campo, true);
    return `<div class="cms-field-group">
        <label class="cms-label">${label}</label>
        <div class="drop-zone" id="drop-${campo}" data-campo="${campo}">
            <div style="font-size:2rem;color:#C9A84C;margin-bottom:10px;">☁️</div>
            <div style="color:#F5F0E8;">Arrastra tu imagen aquí o haz clic para seleccionar</div>
            <input type="file" id="file-${campo}" accept="image/*" style="display:none;">
            <div id="preview-${campo}">
                ${url ? `<img src="${url}">` : ''}
            </div>
            <!-- guardamos url actual en input oculto -->
            <input type="hidden" class="cms-image-url-input" data-campo="${campo}" value="${url}">
        </div>
    </div>`;
}

function renderJSONListEditor(label, campo, template, maxItems) {
    const jsonStr = getCMSVal(currentCmsSection, campo) || '[]';
    // Se dibujará vacío aquí y JS lo poblará
    return `<div class="cms-field-group json-list-group" data-campo="${campo}" data-template='${JSON.stringify(template)}' data-max="${maxItems}">
        <label class="cms-label flex-between">${label} <span class="text-secondary text-small">(Máx ${maxItems})</span></label>
        <div class="json-list-container" id="list-${campo}"></div>
        <button type="button" class="btn-outline-gold btn-small mt-2 btn-add-json" data-campo="${campo}">+ Agregar Ítem</button>
        <input type="hidden" class="cms-value-input" data-campo="${campo}" value='${jsonStr}'>
    </div>`;
}

function setupDragAndDrop(section) {
    document.querySelectorAll('.drop-zone').forEach(zone => {
        const fileInput = zone.querySelector('input[type="file"]');
        const preview = zone.querySelector('div[id^="preview-"]');
        
        zone.addEventListener('click', () => fileInput.click());
        zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.style.background = 'rgba(201,168,76,0.2)'; });
        zone.addEventListener('dragleave', (e) => { e.preventDefault(); zone.style.background = 'rgba(0,0,0,0.2)'; });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.style.background = 'rgba(0,0,0,0.2)';
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                fileInput.dispatchEvent(new Event('change'));
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files && fileInput.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.innerHTML = `<img src="${e.target.result}"> <p class="text-gold text-micro mt-1">Pendiente por guardar...</p>`;
                    const urlInput = zone.querySelector('.cms-image-url-input');
                    if (urlInput) urlInput.value = e.target.result; // Use base64 for live preview
                    sendLivePreview();
                }
                reader.readAsDataURL(fileInput.files[0]);
                hasUnsavedCmsChanges = true;
            }
        });
    });
}

function setupJSONLists(section) {
    document.querySelectorAll('.json-list-group').forEach(group => {
        const campo = group.getAttribute('data-campo');
        const template = JSON.parse(group.getAttribute('data-template'));
        const max = parseInt(group.getAttribute('data-max'));
        const container = document.getElementById(`list-${campo}`);
        const hiddenInput = group.querySelector('.cms-value-input');
        const btnAdd = group.querySelector('.btn-add-json');

        let items = [];
        try { items = JSON.parse(hiddenInput.value); } catch(e){}

        const renderItems = () => {
            container.innerHTML = '';
            items.forEach((item, idx) => {
                const box = document.createElement('div');
                box.style.cssText = 'background:rgba(255,255,255,0.02); border:1px solid var(--border-color); padding:15px; border-radius:6px; margin-bottom:15px; position:relative;';
                box.innerHTML = `<button type="button" style="position:absolute;top:10px;right:10px;background:#ff6b6b;color:#fff;border:none;border-radius:4px;padding:3px 8px;cursor:pointer;font-size:0.8rem;" onclick="removeJSONItem('${campo}', ${idx})">✕ Eliminar</button>`;
                
                template.forEach(t => {
                    const id = `item_${campo}_${idx}_${t.key}`;
                    box.innerHTML += `<div style="margin-bottom:10px;"><label style="display:block;color:#8A9E8A;font-size:0.85rem;margin-bottom:5px;">${t.label}</label>
                    <input type="${t.type}" id="${id}" value="${(item[t.key]||'').replace(/"/g, '&quot;')}" style="width:100%;padding:8px;background:#1A3A1A;border:1px solid rgba(201,168,76,0.3);color:#fff;border-radius:4px;"></div>`;
                });
                container.appendChild(box);

                // bind changes
                template.forEach(t => {
                    document.getElementById(`item_${campo}_${idx}_${t.key}`).addEventListener('input', (e) => {
                        items[idx][t.key] = e.target.value;
                        hiddenInput.value = JSON.stringify(items); hasUnsavedCmsChanges = true; sendLivePreview();
                    });
                });
            });
            btnAdd.style.display = items.length >= max ? 'none' : 'inline-block';
        };

        window.removeJSONItem = (c, i) => {
            if(c !== campo) return;
            items.splice(i, 1);
            hiddenInput.value = JSON.stringify(items); hasUnsavedCmsChanges = true; sendLivePreview();
            renderItems();
        };

        btnAdd.addEventListener('click', () => {
            items.push({});
            hiddenInput.value = JSON.stringify(items); hasUnsavedCmsChanges = true; sendLivePreview();
            renderItems();
        });

        renderItems();
    });
}

async function handleCMSSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-cms');
    btn.disabled = true;
    btn.textContent = 'Subiendo y Guardando...';

    const section = e.target.getAttribute('data-section');
    const { data: { session } } = await _s.auth.getSession();
    const userId = session?.user?.id;

    try {
        // 1. Upload new files if any
        const dropZones = e.target.querySelectorAll('.drop-zone');
        for (let zone of dropZones) {
            const campo = zone.getAttribute('data-campo');
            const fileInput = zone.querySelector('input[type="file"]');
            const urlInput = zone.querySelector('.cms-image-url-input');

            if (fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0];
                const path = `cms/${section}_${campo}_${Date.now()}_${file.name}`;
                const { error: upErr } = await _s.storage.from('imagenes-pagina').upload(path, file, { upsert: true });
                if (upErr) throw upErr;
                const { data: { publicUrl } } = _s.storage.from('imagenes-pagina').getPublicUrl(path);
                urlInput.value = publicUrl;
            }
        }

        // 2. Collect all fields
        const payloads = [];
        e.target.querySelectorAll('.cms-value-input').forEach(input => {
            const campo = input.getAttribute('data-campo');
            const isCheckbox = input.type === 'checkbox';
            const val = isCheckbox ? (input.checked ? 'true' : 'false') : input.value;
            
            payloads.push({
                seccion: section,
                campo: campo,
                valor_texto: val,
                actualizado_por: userId,
                updated_at: new Date().toISOString()
            });
        });

        e.target.querySelectorAll('.cms-image-url-input').forEach(input => {
            const campo = input.getAttribute('data-campo');
            const url = input.value;
            // merge with existing payload or create new
            let p = payloads.find(x => x.campo === campo);
            if(p) p.valor_imagen_url = url;
            else payloads.push({ seccion: section, campo: campo, valor_imagen_url: url, actualizado_por: userId, updated_at: new Date().toISOString() });
        });

        // 3. Upsert to DB
        const { error } = await _s.from('contenido_pagina').upsert(payloads, { onConflict: 'seccion,campo' });
        if (error) throw error;

        hasUnsavedCmsChanges = false;
        
        // Refrescar data en memoria
        payloads.forEach(p => {
            cmsData[`${p.seccion}_${p.campo}`] = p;
        });

        // Toast elegante
        const t = document.createElement('div');
        t.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#C9A84C;color:#0A0F0A;padding:15px 25px;border-radius:8px;font-weight:bold;box-shadow:0 10px 30px rgba(0,0,0,0.5);z-index:99999;animation:slideUp 0.3s;';
        t.innerHTML = '✓ Cambios guardados correctamente';
        document.body.appendChild(t);
        setTimeout(() => { t.style.opacity='0'; setTimeout(()=>t.remove(), 300); }, 3000);

    } catch (err) {
        alert('Error al guardar: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = '💾 Guardar Cambios';
    }
}

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
