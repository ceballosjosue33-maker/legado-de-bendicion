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
    
    // Inclusive role check
    const rolesStr = (u?.roles || []).join(',') + ',' + (u?.rol || '');
    if (error || !u || (!rolesStr.includes('estudiante') && !rolesStr.includes('discipulo') && !rolesStr.includes('lider'))) {
        alert('Acceso denegado.');
        return window.location.href = 'auth.html';
    }
    dbUser = u;

    document.getElementById('btn-logout').addEventListener('click', async () => { await _s.auth.signOut(); window.location.href = 'index.html'; });
    setupNav();
    populateProfile();
    // loadCourse is now handled by dashboard-miembro-curso.js initLMS
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

// ── UTILIDADES ────────────────────────────
function showMsg(el, type, text) {
    el.className = `form-message ${type}`;
    el.textContent = text;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
}
