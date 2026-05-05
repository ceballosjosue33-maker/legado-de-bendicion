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
