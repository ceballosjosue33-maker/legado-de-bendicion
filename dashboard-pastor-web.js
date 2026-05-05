// dashboard-pastor-web.js

let usuarioActual = null;
let hasUnsavedChanges = false;
let currentTab = 'navbar';

const FORM_STRUCTURES = {
    navbar: [
        { type: 'text', label: 'Nombre de la iglesia', clave: 'navbar-nombre' },
        { type: 'text', label: 'Texto botón CTA', clave: 'navbar-cta' },
        { type: 'image', label: 'Logo', clave: 'navbar-logo' }
    ],
    hero: [
        { type: 'text', label: 'Título línea 1', clave: 'hero-titulo1' },
        { type: 'text', label: 'Título línea 2 dorada', clave: 'hero-titulo2' },
        { type: 'text', label: 'Subtítulo', clave: 'hero-subtitulo' },
        { type: 'text', label: 'Botón primario', clave: 'hero-boton1' },
        { type: 'text', label: 'Botón secundario', clave: 'hero-boton2' },
        { type: 'text', label: 'Versículo decorativo', clave: 'hero-versiculo' },
        { type: 'image', label: 'Imagen de fondo', clave: 'hero-fondo' }
    ],
    horarios: [
        { type: 'text', label: 'Título sección', clave: 'horarios-titulo' },
        ...Array.from({length:4}, (_, i) => [
            { type: 'title', label: `Culto ${i+1}` },
            { type: 'text', label: 'Nombre', clave: `horario${i+1}-nombre` },
            { type: 'text', label: 'Día', clave: `horario${i+1}-dia` },
            { type: 'text', label: 'Hora', clave: `horario${i+1}-hora` },
            { type: 'textarea', label: 'Descripción', clave: `horario${i+1}-descripcion` }
        ]).flat()
    ],
    nosotros: [
        { type: 'text', label: 'Título sección', clave: 'nosotros-titulo' },
        { type: 'textarea', label: 'Historia', clave: 'nosotros-historia' },
        { type: 'text', label: 'Título Misión', clave: 'nosotros-mision-titulo' },
        { type: 'textarea', label: 'Texto Misión', clave: 'nosotros-mision-texto' },
        { type: 'text', label: 'Título Visión', clave: 'nosotros-vision-titulo' },
        { type: 'textarea', label: 'Texto Visión', clave: 'nosotros-vision-texto' },
        { type: 'image', label: 'Foto principal', clave: 'nosotros-foto' },
        { type: 'title', label: 'Métricas' },
        { type: 'text', label: 'Número 1', clave: 'nosotros-metrica1-numero' },
        { type: 'text', label: 'Etiqueta 1', clave: 'nosotros-metrica1-etiqueta' },
        { type: 'text', label: 'Número 2', clave: 'nosotros-metrica2-numero' },
        { type: 'text', label: 'Etiqueta 2', clave: 'nosotros-metrica2-etiqueta' },
        { type: 'text', label: 'Número 3', clave: 'nosotros-metrica3-numero' },
        { type: 'text', label: 'Etiqueta 3', clave: 'nosotros-metrica3-etiqueta' }
    ],
    eventos: [
        { type: 'text', label: 'Título sección', clave: 'eventos-titulo' },
        ...Array.from({length:6}, (_, i) => [
            { type: 'title', label: `Evento ${i+1}` },
            { type: 'text', label: 'Título', clave: `evento${i+1}-titulo` },
            { type: 'text', label: 'Día (Número)', clave: `evento${i+1}-fecha-dia` },
            { type: 'text', label: 'Mes (Nombre corto)', clave: `evento${i+1}-fecha-mes` },
            { type: 'textarea', label: 'Descripción', clave: `evento${i+1}-descripcion` },
            { type: 'image', label: 'Imagen', clave: `evento${i+1}-imagen` },
            { type: 'text', label: 'Link de inscripción', clave: `evento${i+1}-link` }
        ]).flat()
    ],
    sermones: [
        { type: 'text', label: 'Título sección', clave: 'sermones-titulo' },
        ...Array.from({length:9}, (_, i) => [
            { type: 'title', label: `Sermón ${i+1}` },
            { type: 'text', label: 'Título', clave: `sermon${i+1}-titulo` },
            { type: 'text', label: 'Predicador', clave: `sermon${i+1}-predicador` },
            { type: 'text', label: 'Fecha (Ej: 20 May 2025)', clave: `sermon${i+1}-fecha` },
            { type: 'text', label: 'Categoría', clave: `sermon${i+1}-categoria` },
            { type: 'text', label: 'URL de Video', clave: `sermon${i+1}-video` }
        ]).flat()
    ],
    contacto: [
        { type: 'text', label: 'Título sección', clave: 'contacto-titulo' },
        { type: 'text', label: 'Dirección', clave: 'contacto-direccion' },
        { type: 'text', label: 'Teléfono', clave: 'contacto-telefono' },
        { type: 'text', label: 'Email', clave: 'contacto-email' },
        { type: 'image', label: 'Embed Google Maps URL', clave: 'contacto-mapa' } // iframe src
    ],
    footer: [
        { type: 'text', label: 'Slogan', clave: 'footer-slogan' },
        { type: 'text', label: 'Copyright', clave: 'footer-copyright' }
    ]
};

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await _s.auth.getSession();
    if (session) usuarioActual = session.user;

    setupTabs();
    renderAllForms();
    await cargarEditorContenido();
    setupMobilePreview();
});

function setupTabs() {
    const tabs = document.querySelectorAll('.cms-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            if (hasUnsavedChanges) {
                if (!confirm("Tienes cambios sin guardar ¿deseas continuar?")) return;
            }
            
            tabs.forEach(t => {
                t.classList.remove('active');
                t.style.background = 'transparent';
                t.style.borderBottom = '2px solid transparent';
                t.style.color = '#8A9E8A';
                t.style.fontWeight = 'normal';
            });
            
            const btn = e.target;
            btn.classList.add('active');
            btn.style.background = '#1A3A1A';
            btn.style.borderBottom = '2px solid var(--color-primary)';
            btn.style.color = '#C9A84C';
            btn.style.fontWeight = 'bold';

            currentTab = btn.getAttribute('data-section');
            showForm(currentTab);
        });
    });
}

function renderAllForms() {
    const area = document.getElementById('cms-forms-area');
    area.innerHTML = '';

    Object.keys(FORM_STRUCTURES).forEach(section => {
        const formDiv = document.createElement('div');
        formDiv.id = `form-${section}`;
        formDiv.style.display = section === currentTab ? 'block' : 'none';

        let html = `<h2 style="font-family: var(--font-heading); font-size: 1.8rem; color: #C9A84C; margin-bottom: 1.5rem;">Editar ${section.charAt(0).toUpperCase() + section.slice(1)}</h2>`;
        html += `<form data-section="${section}" onsubmit="guardarSeccion(event, '${section}')">`;

        FORM_STRUCTURES[section].forEach(field => {
            if (field.type === 'title') {
                html += `<h4 style="color:#C9A84C; margin-top:2rem; margin-bottom:0.5rem; font-family:var(--font-heading); border-bottom:0.5px solid rgba(201,168,76,0.3); padding-bottom:5px;">${field.label}</h4>`;
            } else if (field.type === 'text') {
                html += `
                <div style="margin-bottom: 1.2rem;">
                    <label style="display:block; color:#8A9E8A; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:5px;">${field.label}</label>
                    <input type="text" data-input="${field.clave}" style="width:100%; background:#1A3A1A; border:0.5px solid rgba(201,168,76,0.3); color:#F5F0E8; padding:0.75rem; font-family:var(--font-body); border-radius:4px;" placeholder="${field.label}">
                </div>`;
            } else if (field.type === 'textarea') {
                html += `
                <div style="margin-bottom: 1.2rem;">
                    <label style="display:block; color:#8A9E8A; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:5px;">${field.label}</label>
                    <textarea data-input="${field.clave}" rows="4" style="width:100%; background:#1A3A1A; border:0.5px solid rgba(201,168,76,0.3); color:#F5F0E8; padding:0.75rem; font-family:var(--font-body); border-radius:4px;" placeholder="${field.label}"></textarea>
                </div>`;
            } else if (field.type === 'image') {
                html += `
                <div style="margin-bottom: 1.5rem;">
                    <label style="display:block; color:#8A9E8A; font-size:0.75rem; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:5px;">${field.label}</label>
                    <div style="border: 1px dashed rgba(201,168,76,0.4); background: #0F1F0F; padding: 2rem; text-align: center; border-radius: 4px; cursor: pointer; position: relative;" onclick="document.getElementById('file-${field.clave}').click()">
                        <div style="color: #C9A84C; font-size: 2rem; margin-bottom: 0.5rem;">📤</div>
                        <div style="color: #F5F0E8; font-size: 0.9rem;">Arrastra o haz clic para subir</div>
                        <input type="file" id="file-${field.clave}" accept="image/*" style="display:none;" onchange="subirImagenEditor(this.files[0], '${field.clave}')">
                        <img data-preview-img="${field.clave}" src="" style="display:none; max-width:100%; max-height:150px; margin-top:15px; border-radius:4px; border:1px solid rgba(201,168,76,0.5);">
                    </div>
                </div>`;
            }
        });

        html += `
            <div style="position: sticky; bottom: 0; padding: 20px 0; background: #0A0F0A; border-top: 1px solid rgba(201,168,76,0.2); margin-top: 20px; z-index: 10;">
                <button type="submit" class="btn-primary" style="width:100%; background:#C9A84C; color:#0A0F0A; font-weight:600; padding:0.85rem; border:none; border-radius:4px; cursor:pointer;">Guardar Cambios</button>
            </div>
        </form>`;

        formDiv.innerHTML = html;
        area.appendChild(formDiv);
    });

    // Listeners para live preview
    document.querySelectorAll('[data-input]').forEach(input => {
        input.addEventListener('input', () => {
            hasUnsavedChanges = true;
            const clave = input.dataset.input;
            const iframe = document.getElementById('preview-iframe');
            if (!iframe || !iframe.contentDocument) return;
            
            iframe.contentDocument.querySelectorAll(\`[data-editable="\${clave}"]\`)
                .forEach(el => el.textContent = input.value);
        });
    });
}

function showForm(section) {
    Object.keys(FORM_STRUCTURES).forEach(s => {
        const f = document.getElementById(`form-${s}`);
        if(f) f.style.display = s === section ? 'block' : 'none';
    });
    hasUnsavedChanges = false;
}

async function cargarEditorContenido() {
    const { data } = await _s.from('contenido_pagina').select('clave, valor_texto, valor_imagen_url');
    if (!data) return;

    data.forEach(({ clave, valor_texto, valor_imagen_url }) => {
        const input = document.querySelector(\`[data-input="\${clave}"]\`);
        if (input && valor_texto) input.value = valor_texto;

        const preview = document.querySelector(\`[data-preview-img="\${clave}"]\`);
        if (preview && valor_imagen_url) {
            preview.src = valor_imagen_url;
            preview.style.display = 'block';
        }
    });
}

async function guardarSeccion(event, section) {
    event.preventDefault();
    const boton = event.target.querySelector('button[type="submit"]');
    boton.disabled = true;
    const oldText = boton.textContent;
    boton.innerHTML = '⏳ Guardando...';

    // Collect all inputs in this form
    const inputs = event.target.querySelectorAll('[data-input]');
    const filas = Array.from(inputs).map(input => {
        return {
            clave: input.dataset.input,
            valor_texto: input.value || null,
            updated_at: new Date().toISOString(),
            actualizado_por: usuarioActual?.id
        };
    }).filter(f => f.valor_texto !== null && f.valor_texto !== ''); // Only upsert non-empty or empty? We upsert all so we can clear

    const { error } = await _s.from('contenido_pagina').upsert(filas, { onConflict: 'clave' });

    boton.disabled = false;
    boton.textContent = oldText;

    if (!error) {
        mostrarToast('✓ Cambios guardados');
        hasUnsavedChanges = false;
    } else {
        mostrarToast('Error al guardar', 'error');
        console.error(error);
    }
}

async function subirImagenEditor(file, clave) {
    if (!file) return;
    const botonParent = document.querySelector(\`#file-\${clave}\`).parentElement;
    botonParent.style.opacity = '0.5';
    
    const ext = file.name.split('.').pop();
    const path = \`editor/\${clave}-\${Date.now()}.\${ext}\`;

    const { error } = await _s.storage.from('imagenes-pagina').upload(path, file, { upsert: true });

    if (error) { 
        mostrarToast('Error al subir imagen', 'error'); 
        botonParent.style.opacity = '1';
        return; 
    }

    const url = _s.storage.from('imagenes-pagina').getPublicUrl(path).data.publicUrl;

    // Guardar URL en Supabase
    await _s.from('contenido_pagina').upsert({
        clave,
        valor_imagen_url: url,
        updated_at: new Date().toISOString(),
        actualizado_por: usuarioActual?.id
    }, { onConflict: 'clave' });

    // Actualizar preview del iframe
    const iframe = document.getElementById('preview-iframe');
    if (iframe && iframe.contentDocument) {
        iframe.contentDocument.querySelectorAll(\`[data-editable-img="\${clave}"]\`)
            .forEach(el => {
                if(el.tagName === 'IFRAME') el.src = url;
                else el.src = url;
                
                // Si es hero-fondo (que tiene estilo absolute), actualiza su src.
                // Eventos también usan data-editable-img y tienen un fallback onload en el HTML que actualiza su background-image.
            });
    }

    // Mostrar miniatura en el editor
    const preview = document.querySelector(\`[data-preview-img="\${clave}"]\`);
    if (preview) { 
        preview.src = url; 
        preview.style.display = 'block'; 
    }

    botonParent.style.opacity = '1';
    mostrarToast('✓ Imagen guardada');
}

function mostrarToast(msg, type = 'success') {
    const t = document.createElement('div');
    t.style.cssText = \`position:fixed;bottom:20px;right:20px;background:#1A3A1A;border-left:3px solid \${type==='error'?'#ff6b6b':'#C9A84C'};color:#fff;padding:15px 25px;border-radius:4px;box-shadow:0 10px 30px rgba(0,0,0,0.5);z-index:99999;transition:opacity 0.3s;\`;
    t.innerHTML = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity='0'; setTimeout(()=>t.remove(), 300); }, 3000);
}

function setupMobilePreview() {
    const btnPreview = document.getElementById('btn-cms-preview-mobile');
    const panelRight = document.getElementById('cms-preview-panel');
    const btnClose = document.querySelector('.btn-cms-close-preview');

    if (window.innerWidth <= 900) {
        btnPreview.style.display = 'block';
        panelRight.style.display = 'none';
        panelRight.style.position = 'fixed';
        panelRight.style.top = '0';
        panelRight.style.left = '0';
        panelRight.style.width = '100%';
        panelRight.style.height = '100vh';
        panelRight.style.zIndex = '9999';
        btnClose.style.display = 'block';
    }

    btnPreview.addEventListener('click', () => {
        panelRight.style.display = 'block';
    });
    btnClose.addEventListener('click', () => {
        panelRight.style.display = 'none';
    });
}

// Check if iframe updates on load
document.getElementById('preview-iframe').addEventListener('load', () => {
    // We don't need to force update here because index.html calls cargarContenido() itself.
    // But we can just make sure inputs match the view just in case.
});
