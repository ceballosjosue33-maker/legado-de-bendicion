// ==========================================
// dashboard-miembro.js — PANEL DE MIEMBRO COMPLETO
// Requiere: config.js (window.sb)
// ==========================================
const _s = window.sb;
let currentUser = null, dbUser = null, allMods = [], userProg = [];

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await _s.auth.getSession();
    if (!session) return window.location.href = 'auth.html';
    currentUser = session.user;

    const { data: u, error } = await _s.from('usuarios').select('*, lider:usuarios!lider_asignado_id(nombre, foto_url)').eq('id', currentUser.id).maybeSingle();
    if (error || !u || (u.rol !== 'estudiante' && u.rol !== 'discipulo')) {
        alert('Acceso denegado.');
        return window.location.href = 'auth.html';
    }
    dbUser = u;

    document.getElementById('btn-logout').addEventListener('click', async () => { await _s.auth.signOut(); window.location.href = 'index.html'; });
    setupNav();
    populateProfile();
    await loadCourse();
});

// ── NAVEGACIÓN ────────────────────────────
function setupNav() {
    const navBtns = document.querySelectorAll('.nav-btn:not(#btn-logout)');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.getAttribute('data-target')).classList.add('active');
        });
    });
}

// ── PERFIL ────────────────────────────────
function populateProfile() {
    const firstName = dbUser.nombre.split(' ')[0];
    document.getElementById('user-firstname').textContent = firstName;

    if (dbUser.lider) {
        document.getElementById('leader-name').textContent = dbUser.lider.nombre;
        const la = document.getElementById('leader-avatar');
        if (la) {
            if (dbUser.lider.foto_url) {
                la.style.backgroundImage = `url('${dbUser.lider.foto_url}')`;
                la.style.backgroundSize = 'cover';
                la.style.backgroundPosition = 'center';
            } else la.textContent = dbUser.lider.nombre.charAt(0);
        }
    }

    document.getElementById('prof-nombre').value   = dbUser.nombre;
    document.getElementById('prof-email').value    = dbUser.email;
    document.getElementById('prof-telefono').value = dbUser.telefono || '';

    const bigAvatar = document.getElementById('profile-avatar-large');
    if (bigAvatar) {
        if (dbUser.foto_url) { bigAvatar.style.backgroundImage = `url('${dbUser.foto_url}')`; bigAvatar.style.backgroundSize = 'cover'; bigAvatar.textContent = ''; }
        else bigAvatar.textContent = firstName.charAt(0).toUpperCase();
    }

    // Guardar info personal
    document.getElementById('form-profile')?.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = document.getElementById('btn-save-profile');
        const msg = document.getElementById('msg-profile');
        btn.disabled = true; btn.textContent = 'Guardando...';
        const nombre   = document.getElementById('prof-nombre').value.trim();
        const telefono = document.getElementById('prof-telefono').value.trim();
        const { error } = await _s.from('usuarios').update({ nombre, telefono }).eq('id', currentUser.id);
        if (error) showMsg(msg, 'error', error.message);
        else { showMsg(msg, 'success', 'Perfil actualizado.'); document.getElementById('user-firstname').textContent = nombre.split(' ')[0]; }
        btn.disabled = false; btn.textContent = 'Guardar Cambios';
    });

    // Cambiar contraseña
    document.getElementById('form-password')?.addEventListener('submit', async e => {
        e.preventDefault();
        const btn  = document.getElementById('btn-save-password');
        const msg  = document.getElementById('msg-password');
        const p1   = document.getElementById('prof-pass1').value;
        const p2   = document.getElementById('prof-pass2').value;
        if (p1 !== p2) return showMsg(msg, 'error', 'Las contraseñas no coinciden.');
        btn.disabled = true; btn.textContent = 'Actualizando...';
        const { error } = await _s.auth.updateUser({ password: p1 });
        if (error) showMsg(msg, 'error', error.message);
        else { showMsg(msg, 'success', 'Contraseña actualizada.'); document.getElementById('form-password').reset(); }
        btn.disabled = false; btn.textContent = 'Actualizar Contraseña';
    });

    // Subir foto
    document.getElementById('upload-avatar')?.addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;
        const ext  = file.name.split('.').pop();
        const path = `${currentUser.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await _s.storage.from('fotos-perfil').upload(path, file, { upsert: true });
        if (upErr) { alert('Error al subir foto: ' + upErr.message); return; }
        const { data: { publicUrl } } = _s.storage.from('fotos-perfil').getPublicUrl(path);
        const { error: dbErr } = await _s.from('usuarios').update({ foto_url: publicUrl }).eq('id', currentUser.id);
        if (dbErr) { alert('Foto subida pero no guardada: ' + dbErr.message); return; }
        const bigAv = document.getElementById('profile-avatar-large');
        if (bigAv) { bigAv.style.backgroundImage = `url('${publicUrl}')`; bigAv.style.backgroundSize = 'cover'; bigAv.textContent = ''; }
    });
}

// ── CURSO ─────────────────────────────────
async function loadCourse() {
    const [{ data: mods }, { data: prog }] = await Promise.all([
        _s.from('modulos_curso').select('*').eq('activo', true).order('orden', { ascending: true }),
        _s.from('progreso_curso').select('modulo_id, fecha_lectura').eq('usuario_id', currentUser.id).eq('leido', true)
    ]);
    allMods  = mods  || [];
    userProg = prog  || [];
    renderProgress();
    renderModules();
}

function renderProgress() {
    const total = allMods.length;
    const done  = userProg.length;
    const pct   = total > 0 ? Math.round(done / total * 100) : 0;
    document.getElementById('kpi-completed').textContent = done;
    document.getElementById('kpi-total').textContent     = total;
    document.getElementById('course-percent').textContent = `${pct}%`;
    document.getElementById('course-fill').style.width   = `${pct}%`;
}

function renderModules() {
    const container = document.getElementById('modules-list');
    if (!container) return;
    if (allMods.length === 0) { container.innerHTML = '<p class="text-center text-secondary">No hay módulos disponibles.</p>'; return; }
    const doneIds = new Set(userProg.map(p => p.modulo_id));
    container.innerHTML = '';
    let prevDone = true; // El primer módulo siempre disponible

    allMods.forEach((m, idx) => {
        const done      = doneIds.has(m.id);
        const available = done || prevDone;
        let cls = 'locked', icon = '🔒';
        if (done)           { cls = 'completed'; icon = '✓'; }
        else if (available) { cls = 'available'; icon = '📖'; }

        const div = document.createElement('div');
        div.className = `module-item ${cls}`;
        div.innerHTML = `<div class="mod-icon">${icon}</div><div class="mod-info"><h3 class="mod-title">Módulo ${m.orden}: ${m.titulo}</h3><p class="mod-desc">${m.descripcion || ''}</p></div>`;
        if (available) div.addEventListener('click', () => openLesson(m, done));
        container.appendChild(div);
        prevDone = done;
    });
}

// ── LECCIÓN ───────────────────────────────
let currentModId = null;
function openLesson(m, isRead) {
    currentModId = m.id;
    document.getElementById('lesson-title').textContent = `Módulo ${m.orden}: ${m.titulo}`;
    const lessonText = document.getElementById('lesson-text');
    if (lessonText) lessonText.textContent = m.contenido_texto || 'Sin contenido de texto disponible.';

    const attBox  = document.getElementById('lesson-attachment-box');
    const dlBtn   = document.getElementById('lesson-download-btn');
    if (attBox) attBox.style.display = m.archivo_url ? 'flex' : 'none';
    if (dlBtn && m.archivo_url) dlBtn.href = m.archivo_url;

    const readBtn = document.getElementById('btn-mark-read');
    if (readBtn) readBtn.style.display = isRead ? 'none' : 'block';

    document.getElementById('modal-lesson').classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-close-lesson')?.addEventListener('click', () => document.getElementById('modal-lesson').classList.remove('active'));

    document.getElementById('btn-mark-read')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-mark-read');
        btn.disabled = true; btn.textContent = 'Guardando...';
        try {
            const { error } = await _s.from('progreso_curso').upsert(
                { usuario_id: currentUser.id, modulo_id: currentModId, leido: true, fecha_lectura: new Date().toISOString() },
                { onConflict: 'usuario_id,modulo_id' }
            );
            if (error) throw error;
            document.getElementById('modal-lesson').classList.remove('active');
            await loadCourse();
        } catch (err) {
            alert('Error al guardar progreso: ' + err.message);
        } finally {
            btn.disabled = false; btn.textContent = 'Marcar como Leído ✓';
        }
    });
});

// ── UTILIDADES ────────────────────────────
function showMsg(el, type, text) {
    el.className = `form-message ${type}`;
    el.textContent = text;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
}
