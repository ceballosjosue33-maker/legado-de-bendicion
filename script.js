// ==========================================
// script.js — LÓGICA DE LA PÁGINA PÚBLICA (index.html)
// Requiere: config.js (window.sb)
// ==========================================

const _s = window.sb;

document.addEventListener('DOMContentLoaded', async () => {

    // ── 1. NAVBAR SCROLL EFFECT ─────────────
    const navbar = document.getElementById('navbar');
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });

    // ── 2. MOBILE MENU ───────────────────────
    const mobileBtn = document.getElementById('mobile-toggle');
    const navLinks  = document.querySelector('.nav-links');
    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            const open = navLinks.classList.toggle('active');
            const spans = mobileBtn.querySelectorAll('span');
            spans[0].style.transform = open ? 'rotate(45deg) translate(5px, 5px)' : 'none';
            spans[1].style.opacity   = open ? '0' : '1';
            spans[2].style.transform = open ? 'rotate(-45deg) translate(7px, -6px)' : 'none';
        });
        navLinks.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const spans = mobileBtn.querySelectorAll('span');
                spans[0].style.transform = spans[2].style.transform = 'none';
                spans[1].style.opacity = '1';
            });
        });
    }

    // ── 3. ACTIVE LINK ON SCROLL ─────────────
    const sections = document.querySelectorAll('section[id], header[id]');
    const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(s => { if (scrollY >= s.offsetTop - 250) current = s.id; });
        navAnchors.forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
        });
    }, { passive: true });

    // ── 4. CARGAR CONTENIDO DINÁMICO ─────────
    loadPageContent();

    // ── 5. AUTH STATE & NAVBAR ───────────────
    const { data: { session } } = await _s.auth.getSession();
    const authContainer = document.querySelector('.nav-auth-buttons');

    if (session) {
        const { data: u } = await _s.from('usuarios').select('rol, nombre, foto_url').eq('id', session.user.id).maybeSingle();
        if (u && authContainer) {
            const firstName = (u.nombre || 'Usuario').split(' ')[0];
            const dashUrl = u.rol === 'pastor' ? 'dashboard-pastor.html' : u.rol === 'lider' ? 'dashboard-lider.html' : 'dashboard-miembro.html';
            const avatarHtml = u.foto_url
                ? `<img src="${u.foto_url}" alt="${firstName}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid #C9A84C;">`
                : `<div style="width:36px;height:36px;border-radius:50%;background:#C9A84C;color:#0A0F0A;display:flex;align-items:center;justify-content:center;font-weight:700;font-family:'Cormorant Garamond',serif;font-size:1.2rem;">${firstName[0].toUpperCase()}</div>`;

            authContainer.innerHTML = `
                <a href="${dashUrl}" style="display:flex;align-items:center;gap:.6rem;color:#F5F0E8;text-decoration:none;">
                    ${avatarHtml}
                    <span style="font-size:.95rem;font-weight:500;">Hola, ${firstName}</span>
                </a>
                <button id="btn-nav-logout" style="padding:.4rem 1rem;background:rgba(220,53,69,.12);color:#ff6b6b;border:1px solid rgba(220,53,69,.3);border-radius:4px;cursor:pointer;font-family:'Outfit',sans-serif;font-size:.85rem;">Salir</button>
            `;
            document.getElementById('btn-nav-logout').addEventListener('click', async () => {
                await _s.auth.signOut();
                window.location.reload();
            });

            if (u.rol === 'pastor' && new URLSearchParams(window.location.search).get('mode') === 'edit') {
                enableEditMode();
            }
        }

        // Desbloquear secciones protegidas
        unlockSection('sermones');
        unlockSection('curso-biblico');
    } else {
        // Bloquear secciones de contenido premium
        lockSection('sermones');
        lockSection('curso-biblico');
    }

    // ── 6. ACTUALIZACIONES EN TIEMPO REAL ────
    _s.channel('public-content')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'contenido_pagina' }, payload => {
            console.log('Cambio detectado en la web, actualizando en tiempo real...');
            loadPageContent();
        })
        .subscribe();
});


window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'cms_live_preview') {
        loadPageContent(event.data.payload);
    }
});

// ── CONTENT CMS ──────────────────────────
// ── CONTENT CMS (Avanzado) ──────────────────────────
async function loadPageContent(dataOverride) {
    let data = dataOverride;
    if (!data) {
        const { data: dbData, error } = await _s.from('contenido_pagina').select('*');
        if (error || !dbData || dbData.length === 0) return;
        data = dbData;
    }

    const cms = {};
    data.forEach(row => { cms[`${row.seccion}_${row.campo}`] = row; });

    const getVal = (sec, campo, def = '') => cms[`${sec}_${campo}`]?.valor_texto || def;
    const getImg = (sec, campo) => cms[`${sec}_${campo}`]?.valor_imagen_url || null;
    const setHtml = (sel, val) => { if(val) { const el = document.querySelector(sel); if(el) el.innerHTML = val; } };
    const setText = (sel, val) => { if(val) { const el = document.querySelector(sel); if(el) el.textContent = val; } };

    // ── ESTILOS (Variables CSS) ──
    const styleEl = document.getElementById('dynamic-cms-styles') || document.createElement('style');
    styleEl.id = 'dynamic-cms-styles';
    styleEl.innerHTML = `:root {
        ${cms['estilos_color_dorado'] ? `--color-primary: ${getVal('estilos', 'color_dorado')};` : ''}
        ${cms['estilos_color_fondo'] ? `--bg-main: ${getVal('estilos', 'color_fondo')};` : ''}
        ${cms['estilos_color_verde'] ? `--bg-card: ${getVal('estilos', 'color_verde')};` : ''}
        ${cms['estilos_color_texto'] ? `--text-secondary: ${getVal('estilos', 'color_texto')};` : ''}
        ${cms['estilos_fuente_titulos'] ? `--font-heading: '${getVal('estilos', 'fuente_titulos')}', serif;` : ''}
        ${cms['estilos_fuente_cuerpo'] ? `--font-body: '${getVal('estilos', 'fuente_cuerpo')}', sans-serif;` : ''}
    }`;
    document.head.appendChild(styleEl);

    // Cargar fuentes dinámicamente si no son las default
    const fontHeading = getVal('estilos', 'fuente_titulos');
    const fontBody = getVal('estilos', 'fuente_cuerpo');
    if(fontHeading || fontBody) {
        const fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = `https://fonts.googleapis.com/css2?family=${(fontHeading||'Cormorant Garamond').replace(/ /g, '+')}:wght@400;600;700&family=${(fontBody||'Outfit').replace(/ /g, '+')}:wght@300;400;500;600&display=swap`;
        document.head.appendChild(fontLink);
    }

    // ── NAVBAR ──
    setHtml('.nav-logo span', getVal('navbar', 'iglesia_nombre'));
    const logoImg = getImg('navbar', 'logo');
    if(logoImg) {
        const img = document.querySelector('.nav-logo img');
        if(img) img.src = logoImg;
    }
    const btnCta = document.querySelector('.nav-links .btn-outline-gold');
    if(btnCta && getVal('navbar', 'btn_cta')) btnCta.textContent = getVal('navbar', 'btn_cta');

    // ── HERO ──
    const t1 = getVal('hero', 'titulo_1');
    const t2 = getVal('hero', 'titulo_2');
    if(t1 || t2) setHtml('.hero-content .title', `${t1||'Legado de'}<br><span class="text-gold" style="font-style:italic;">${t2||'Bendición'}</span>`);
    setText('.hero-content .description', getVal('hero', 'subtitulo'));
    
    const hImg = getImg('hero', 'fondo');
    if(hImg) {
        const heroEl = document.querySelector('.hero');
        if(heroEl) {
            heroEl.style.backgroundImage = `url('${hImg}')`;
            heroEl.style.backgroundSize = 'cover';
            heroEl.style.backgroundPosition = 'center';
            heroEl.style.backgroundAttachment = 'fixed';
            // Ocultar elementos de fondo viejos
            const oldGlow = document.querySelector('.hero-glow'); if(oldGlow) oldGlow.style.display = 'none';
            const oldCross = document.querySelector('.hero-bg-cross'); if(oldCross) oldCross.style.display = 'none';
        }
    }

    // ── NOSOTROS ──
    setText('#nosotros .section-title', getVal('nosotros', 'titulo'));
    setText('#nosotros .history-desc', getVal('nosotros', 'historia'));
    const misionTitle = getVal('nosotros', 'mision_titulo');
    const misionText = getVal('nosotros', 'mision_texto');
    const hq = document.querySelectorAll('#nosotros .history-quote');
    if(hq.length > 0) {
        if(misionTitle) hq[0].querySelector('.quote-title').textContent = misionTitle;
        if(misionText) hq[0].childNodes[hq[0].childNodes.length - 1].textContent = ' ' + misionText;
    }
    const visionTitle = getVal('nosotros', 'vision_titulo');
    const visionText = getVal('nosotros', 'vision_texto');
    if(hq.length > 1) {
        if(visionTitle) hq[1].querySelector('.quote-title').textContent = visionTitle;
        if(visionText) hq[1].childNodes[hq[1].childNodes.length - 1].textContent = ' ' + visionText;
    }
    const nosImg = getImg('nosotros', 'foto_principal');
    if(nosImg) { const img = document.querySelector('.history-img'); if(img) img.src = nosImg; }

    // Métricas Nosotros
    try {
        const metricas = JSON.parse(getVal('nosotros', 'metricas') || '[]');
        if(metricas.length > 0) {
            const mg = document.querySelector('.metrics-grid');
            if(mg) {
                mg.innerHTML = '';
                metricas.forEach(m => {
                    mg.innerHTML += `<div class="metric-item"><div class="metric-value">${m.valor}</div><div class="metric-label">${m.etiqueta}</div></div>`;
                });
            }
        }
    } catch(e){}

    // ── HORARIOS ──
    setText('#horarios .section-title', getVal('horarios', 'titulo'));
    try {
        const cultos = JSON.parse(getVal('horarios', 'lista_cultos') || '[]');
        if(cultos.length > 0) {
            const hg = document.querySelector('.schedule-grid');
            if(hg) {
                hg.innerHTML = '';
                cultos.forEach(c => {
                    hg.innerHTML += `<div class="schedule-card">
                        <div class="schedule-icon">${c.icono || '📖'}</div>
                        <h3 class="schedule-name">${c.nombre}</h3>
                        <div class="schedule-time">${c.dia_hora}</div>
                        <p class="schedule-desc">${c.descripcion}</p>
                    </div>`;
                });
            }
        }
    } catch(e){}

    // ── EVENTOS ──
    setText('#eventos .section-title', getVal('eventos', 'titulo'));
    try {
        const eventos = JSON.parse(getVal('eventos', 'lista_eventos') || '[]');
        if(eventos.length > 0) {
            const eg = document.querySelector('.events-grid');
            if(eg) {
                eg.innerHTML = '';
                eventos.forEach(e => {
                    eg.innerHTML += `<div class="event-card">
                        <div class="event-img" style="background-image: url('${e.imagen_url || ''}')">
                            <div class="event-date">
                                <span class="date-number">${new Date(e.fecha).getDate() || ''}</span>
                                <span class="date-month">${new Date(e.fecha).toLocaleString('es-ES', {month:'short'}) || ''}</span>
                            </div>
                        </div>
                        <div class="event-info">
                            <h3 class="event-title">${e.titulo}</h3>
                            <p class="event-desc">${e.descripcion}</p>
                            ${e.link ? `<a href="${e.link}" class="btn-outline-gold mt-1">Saber más</a>` : ''}
                        </div>
                    </div>`;
                });
            }
        }
    } catch(e){}

    // ── SERMONES ──
    setText('#sermones .section-title', getVal('sermones', 'titulo'));
    try {
        const sermones = JSON.parse(getVal('sermones', 'lista_sermones') || '[]');
        if(sermones.length > 0) {
            const sg = document.querySelector('.sermons-grid');
            if(sg) {
                sg.innerHTML = '';
                sermones.forEach(s => {
                    let ytid = '';
                    if(s.video_url?.includes('v=')) ytid = s.video_url.split('v=')[1]?.split('&')[0];
                    else if(s.video_url?.includes('youtu.be/')) ytid = s.video_url.split('youtu.be/')[1]?.split('?')[0];
                    const thumb = ytid ? `https://img.youtube.com/vi/${ytid}/maxresdefault.jpg` : '';
                    
                    sg.innerHTML += `<div class="sermon-card">
                        <div class="sermon-thumb" style="background-image: url('${thumb}')">
                            <a href="${s.video_url}" target="_blank" class="sermon-play">▶</a>
                            <span class="sermon-category">${s.categoria}</span>
                        </div>
                        <div class="sermon-info">
                            <h3 class="sermon-title">${s.titulo}</h3>
                            <div class="sermon-meta">
                                <span>Predicador: ${s.predicador}</span>
                                <span>${new Date(s.fecha).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>`;
                });
            }
        }
    } catch(e){}

    // ── CONTACTO Y FOOTER ──
    // Se podrían seguir mapeando más campos si la página los necesita.
}

// ── SECTION LOCK / UNLOCK ────────────────
function lockSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    const container = section.querySelector('.container');
    if (!container) return;
    const titleEl = container.querySelector('.text-center');
    const titleHtml = titleEl ? titleEl.outerHTML : '';
    container.innerHTML = titleHtml + `
        <div style="text-align:center;padding:4rem 2rem;background:rgba(26,58,26,.4);border:1px solid rgba(201,168,76,.2);border-radius:8px;margin-top:2rem;">
            <div style="font-size:3rem;margin-bottom:1rem;">🔒</div>
            <h3 style="color:#C9A84C;margin-bottom:1rem;font-family:'Cormorant Garamond',serif;font-size:2rem;">Contenido Exclusivo</h3>
            <p style="color:#8A9E8A;margin-bottom:2rem;font-family:'Outfit',sans-serif;">Inicia sesión para acceder al contenido completo de esta sección.</p>
            <a href="auth.html" style="display:inline-block;padding:.8rem 2rem;background:#C9A84C;color:#0A0F0A;border-radius:4px;font-family:'Outfit',sans-serif;font-weight:600;text-decoration:none;">Iniciar Sesión</a>
        </div>`;
}

function unlockSection(sectionId) {
    // El HTML original ya tiene el contenido; solo aseguramos que no esté bloqueado
    // (si la página se cargó sin sesión y luego se detectó sesión, el contenido original se restaura)
    // En este flujo, el HTML base siempre tiene el contenido; lockSection lo reemplaza solo si no hay sesión.
    const section = document.getElementById(sectionId);
    if (section) section.style.display = '';
}

// ── VISUAL EDIT MODE ─────────────────────
function enableEditMode() {
    const style = document.createElement('style');
    style.innerHTML = `
        .editable-section { position: relative; border: 2px dashed rgba(201,168,76,0.3) !important; transition: border 0.3s; margin: 5px; border-radius: 8px; }
        .editable-section:hover { border-color: #C9A84C !important; background: rgba(201,168,76,0.02); }
        .btn-edit-overlay {
            position: absolute; top: 15px; right: 15px;
            background: #C9A84C; color: #0A0F0A; padding: 6px 14px;
            font-size: 0.85rem; font-family: 'Outfit', sans-serif; font-weight: 600;
            border-radius: 4px; cursor: pointer; z-index: 100;
            display: block; box-shadow: 0 4px 10px rgba(0,0,0,0.5); border: none;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); box-shadow: 0 4px 15px rgba(201,168,76,0.6); }
            100% { transform: scale(1); }
        }
        .modal-edit-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(10,15,10,0.9); z-index: 99999;
            display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px);
        }
        .modal-edit-box {
            background: #111A11; border: 1px solid #C9A84C; border-radius: 12px;
            padding: 2rem; width: 450px; max-width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }
        .modal-edit-box label { display: block; color: #C9A84C; margin-bottom: 8px; font-family: 'Outfit', sans-serif; font-size: 0.9rem;}
        .modal-edit-box input, .modal-edit-box textarea { 
            width: 100%; padding: 10px; margin-bottom: 1.5rem; background: rgba(0,0,0,0.4); 
            border: 1px solid rgba(201,168,76,0.3); color: #F5F0E8; border-radius: 6px; font-family: 'Outfit', sans-serif; font-size: 0.95rem; box-sizing: border-box;
        }
        .modal-edit-box input:focus, .modal-edit-box textarea:focus { outline: none; border-color: #C9A84C; }
    `;
    document.head.appendChild(style);

    const sections = [
        { id: 'inicio', key: 'hero', titleSel: '.title', subSel: '.description' },
        { id: 'nosotros', key: 'nosotros', titleSel: '.section-title', subSel: '.history-quote:first-of-type', textSel: '.history-desc' },
        { id: 'horarios', key: 'horarios', titleSel: '.section-title', subSel: '.section-subtitle' },
        { id: 'eventos', key: 'eventos', titleSel: '.section-title', subSel: '.section-subtitle' }
    ];

    setTimeout(() => {
        sections.forEach(s => {
            const el = document.getElementById(s.id);
            if(!el) return;
            el.classList.add('editable-section');
            const btn = document.createElement('button');
            btn.className = 'btn-edit-overlay';
            btn.innerHTML = '✏️ Editar Sección';
            btn.onclick = () => openEditModal(s, el);
            el.appendChild(btn);
        });
    }, 500);
}

window.openEditModal = function(s, el) {
    const titleVal = el.querySelector(s.titleSel)?.textContent.trim() || '';
    
    let subVal = '';
    if (s.subSel) {
        if (s.key === 'nosotros') {
             const m = el.querySelector(s.subSel);
             subVal = m ? m.childNodes[m.childNodes.length - 1].textContent.trim() : '';
        } else {
             subVal = el.querySelector(s.subSel)?.textContent.trim() || '';
        }
    }
    const textVal = s.textSel ? (el.querySelector(s.textSel)?.textContent.trim() || '') : '';
    const supportsImage = (s.key === 'hero' || s.key === 'nosotros');

    let html = `
        <div class="modal-edit-overlay" id="edit-modal">
            <div class="modal-edit-box">
                <h3 style="color:#F5F0E8;margin-top:0;margin-bottom:1.5rem;font-family:'Cormorant Garamond', serif;font-size:1.8rem;border-bottom:1px solid rgba(201,168,76,0.2);padding-bottom:10px;">Editar ${s.key.toUpperCase()}</h3>
                <label>Título Principal</label>
                <input type="text" id="edit-title" value="${titleVal.replace(/"/g, '&quot;')}">
    `;
    
    if(s.subSel) {
        html += `<label>Subtítulo / Misión</label><textarea id="edit-sub" rows="2">${subVal}</textarea>`;
    }
    if(s.textSel) {
        html += `<label>Texto Principal</label><textarea id="edit-text" rows="4">${textVal}</textarea>`;
    }
    if(supportsImage) {
        html += `<label>Cambiar Imagen de Fondo/Sección (Opcional)</label><input type="file" id="edit-img" accept="image/*" style="padding: 5px; cursor: pointer;">`;
    }

    html += `
                <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:10px;">
                    <button onclick="document.getElementById('edit-modal').remove()" style="padding:10px 20px;background:transparent;color:#8A9E8A;border:1px solid #8A9E8A;border-radius:4px;cursor:pointer;font-family:'Outfit',sans-serif;">Cancelar</button>
                    <button id="btn-save-edit" style="padding:10px 20px;background:#C9A84C;color:#0A0F0A;border:none;border-radius:4px;cursor:pointer;font-weight:600;font-family:'Outfit',sans-serif;">Guardar Cambios</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    document.getElementById('btn-save-edit').onclick = async function() {
        this.textContent = 'Subiendo y Guardando...';
        this.disabled = true;

        let imagen_url = null;
        if (supportsImage) {
            const imgFile = document.getElementById('edit-img').files[0];
            if (imgFile) {
                const path = `${s.key}/${Date.now()}_${imgFile.name}`;
                const { error: upErr } = await _s.storage.from('imagenes-pagina').upload(path, imgFile, { upsert: true });
                if (!upErr) {
                    const { data: { publicUrl } } = _s.storage.from('imagenes-pagina').getPublicUrl(path);
                    imagen_url = publicUrl;
                } else {
                    alert('Error subiendo imagen: ' + upErr.message);
                }
            }
        }

        const payload = { 
            seccion: s.key,
            titulo: document.getElementById('edit-title').value.trim()
        };
        if(s.subSel) payload.subtitulo = document.getElementById('edit-sub').value.trim();
        if(s.textSel) payload.texto = document.getElementById('edit-text').value.trim();
        if(imagen_url) payload.imagen_url = imagen_url;

        const { data: { session } } = await _s.auth.getSession();
        payload.actualizado_por = session.user.id;
        payload.updated_at = new Date().toISOString();

        const { error } = await _s.from('contenido_pagina').upsert(payload, { onConflict: 'seccion' });
        if(error) alert('Error: ' + error.message);
        else document.getElementById('edit-modal').remove();
    };
}
