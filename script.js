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

// ── CONTENT CMS ──────────────────────────
async function loadPageContent() {
    const { data, error } = await _s.from('contenido_pagina').select('seccion, titulo, subtitulo, imagen_url, texto');
    if (error || !data || data.length === 0) return; // Usa defaults del HTML

    data.forEach(row => {
        if (row.seccion === 'hero') {
            if (row.titulo) {
                const heroTitle = document.querySelector('.hero-content .title');
                if (heroTitle) heroTitle.innerHTML = row.titulo;
            }
            if (row.subtitulo) {
                const heroDesc = document.querySelector('.hero-content .description');
                if (heroDesc) heroDesc.textContent = row.subtitulo;
            }
        }
        if (row.seccion === 'nosotros') {
            if (row.titulo) {
                const h = document.querySelector('#nosotros .section-title');
                if (h) h.textContent = row.titulo;
            }
            if (row.texto) {
                const p = document.querySelector('#nosotros .history-desc');
                if (p) p.textContent = row.texto;
            }
            if (row.subtitulo) {
                const mision = document.querySelector('#nosotros .history-quote:first-of-type');
                if (mision) mision.childNodes[mision.childNodes.length - 1].textContent = row.subtitulo;
            }
            if (row.imagen_url) {
                const img = document.querySelector('.history-img');
                if (img) img.src = row.imagen_url;
            }
        }
        if (row.seccion === 'horarios') {
            if (row.titulo) {
                const h = document.querySelector('#horarios .section-title');
                if (h) h.textContent = row.titulo;
            }
            if (row.subtitulo) {
                const p = document.querySelector('#horarios .section-subtitle');
                if (p) p.textContent = row.subtitulo;
            }
        }
        if (row.seccion === 'eventos') {
            if (row.titulo) {
                const h = document.querySelector('#eventos .section-title');
                if (h) h.textContent = row.titulo;
            }
            if (row.subtitulo) {
                const p = document.querySelector('#eventos .section-subtitle');
                if (p) p.textContent = row.subtitulo;
            }
        }
    });
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
            display: none; box-shadow: 0 4px 10px rgba(0,0,0,0.5); border: none;
        }
        .editable-section:hover .btn-edit-overlay { display: block; }
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
        this.textContent = 'Guardando...';
        this.disabled = true;
        const payload = { 
            seccion: s.key,
            titulo: document.getElementById('edit-title').value.trim()
        };
        if(s.subSel) payload.subtitulo = document.getElementById('edit-sub').value.trim();
        if(s.textSel) payload.texto = document.getElementById('edit-text').value.trim();

        const { data: { session } } = await _s.auth.getSession();
        payload.actualizado_por = session.user.id;
        payload.updated_at = new Date().toISOString();

        const { error } = await _s.from('contenido_pagina').upsert(payload, { onConflict: 'seccion' });
        if(error) alert('Error: ' + error.message);
        else document.getElementById('edit-modal').remove();
    };
}
