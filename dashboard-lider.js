// ==========================================
// dashboard-lider.js — PANEL DE LÍDER COMPLETO
// Requiere: config.js (window.sb)
// ==========================================
const _s = window.sb;
let currentUser = null, myDisciples = [], allMods = [];

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await _s.auth.getSession();
    if (!session) return window.location.href = 'auth.html';
    currentUser = session.user;

    const { data: u, error } = await _s.from('usuarios').select('rol, nombre').eq('id', currentUser.id).maybeSingle();
    if (error || !u || (u.rol !== 'lider' && u.rol !== 'pastor')) {
        alert('Acceso denegado: área exclusiva para Líderes.');
        return window.location.href = 'auth.html';
    }

    document.getElementById('user-name').textContent = u.nombre;
    document.getElementById('user-avatar').textContent = u.nombre.charAt(0).toUpperCase();
    document.getElementById('btn-logout').addEventListener('click', async () => { await _s.auth.signOut(); window.location.href = 'index.html'; });

    setupNav();
    await loadData();
    setupAddDisciple();
});

// ── NAVEGACIÓN ────────────────────────────
function setupNav() {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.getAttribute('data-target');
            document.getElementById(target).classList.add('active');
            document.getElementById('page-title').textContent = btn.textContent.trim();
        });
    });
}

// ── CARGA INICIAL ─────────────────────────
async function loadData() {
    const [{ data: disciples }, { data: mods }] = await Promise.all([
        _s.from('usuarios').select('id, nombre, email, foto_url, rol, fecha_registro, notas_lider').eq('lider_asignado_id', currentUser.id),
        _s.from('modulos_curso').select('id, titulo, descripcion, orden').eq('activo', true).order('orden', { ascending: true })
    ]);
    myDisciples = disciples || [];
    allMods = mods || [];

    renderKPIs();
    renderDisciplesTable();
    buildCharts();
    renderCourseReadonly();
}

// ── KPIs ──────────────────────────────────
async function renderKPIs() {
    document.getElementById('kpi-mis-discipulos').textContent = myDisciples.length;

    if (myDisciples.length === 0 || allMods.length === 0) {
        document.getElementById('kpi-progreso-grupo').textContent = '0%';
        return;
    }
    const ids = myDisciples.map(d => d.id);
    const { data: prog } = await _s.from('progreso_curso').select('usuario_id').eq('leido', true).in('usuario_id', ids);
    const possible = myDisciples.length * allMods.length;
    const read = (prog || []).length;
    document.getElementById('kpi-progreso-grupo').textContent = `${Math.round(read / possible * 100)}%`;
}

// ── TABLA DISCÍPULOS ──────────────────────
async function renderDisciplesTable() {
    const tbody = document.getElementById('table-disciples-body');
    tbody.innerHTML = '';

    if (myDisciples.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Aún no tienes discípulos asignados.</td></tr>';
        return;
    }

    const ids = myDisciples.map(d => d.id);
    const { data: prog } = await _s.from('progreso_curso').select('usuario_id, leido').eq('leido', true).in('usuario_id', ids);

    myDisciples.forEach(d => {
        const read = (prog || []).filter(p => p.usuario_id === d.id).length;
        const pct = allMods.length > 0 ? Math.round(read / allMods.length * 100) : 0;
        const avatar = d.foto_url
            ? `<img src="${d.foto_url}" class="table-avatar" alt="">`
            : `<div class="table-avatar-placeholder">${d.nombre.charAt(0)}</div>`;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${avatar}</td>
            <td><strong>${d.nombre}</strong></td>
            <td>${d.email}</td>
            <td>
                <div style="display:flex;align-items:center;gap:.5rem;">
                    <span style="min-width:2.5rem;font-size:.9rem;color:#C9A84C">${pct}%</span>
                    <div style="flex:1;background:rgba(255,255,255,.1);border-radius:4px;height:6px;">
                        <div style="width:${pct}%;background:#C9A84C;height:6px;border-radius:4px;transition:width .4s"></div>
                    </div>
                </div>
            </td>
            <td><button class="btn-primary btn-small" onclick="openProfile('${d.id}')">Ver Perfil</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// ── CHARTS ────────────────────────────────
async function buildCharts() {
    Chart.defaults.color = '#8A9E8A';
    Chart.defaults.font.family = "'Outfit', sans-serif";
    const gold = '#C9A84C';

    // Progreso individual
    const ids = myDisciples.map(d => d.id);
    let progData = [];
    if (ids.length > 0) {
        const { data } = await _s.from('progreso_curso').select('usuario_id').eq('leido', true).in('usuario_id', ids);
        progData = data || [];
    }
    const names = myDisciples.map(d => d.nombre.split(' ')[0]);
    const scores = myDisciples.map(d => {
        const r = progData.filter(p => p.usuario_id === d.id).length;
        return allMods.length > 0 ? Math.round(r / allMods.length * 100) : 0;
    });

    const ctxBar = document.getElementById('chartBarProgress');
    if (ctxBar) {
        new Chart(ctxBar, {
            type: 'bar',
            data: { labels: names.length ? names : ['Sin discípulos'], datasets: [{ label: '% Avance', data: scores.length ? scores : [0], backgroundColor: gold, borderRadius: 4 }] },
            options: { responsive: true, scales: { y: { beginAtZero: true, max: 100 } } }
        });
    }

    // Asistencia semanal (datos reales si existen)
    if (ids.length > 0) {
        const fourW = new Date(); fourW.setDate(fourW.getDate() - 28);
        const { data: att } = await _s.from('asistencia').select('fecha, presente').eq('evento_tipo', 'dominical').eq('presente', true).in('usuario_id', ids).gte('fecha', fourW.toISOString().split('T')[0]);
        const weeks = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
        const attByWeek = [0, 0, 0, 0];
        (att || []).forEach(a => {
            const diff = Math.floor((new Date() - new Date(a.fecha)) / (7 * 864e5));
            if (diff < 4) attByWeek[3 - diff]++;
        });
        const ctxLine = document.getElementById('chartLineAttendance');
        if (ctxLine) {
            new Chart(ctxLine, {
                type: 'line',
                data: { labels: weeks, datasets: [{ label: 'Asistentes', data: attByWeek, borderColor: '#E8C97A', backgroundColor: 'rgba(232,201,122,.15)', fill: true, tension: .4 }] },
                options: { responsive: true, scales: { y: { beginAtZero: true } } }
            });
        }
    }
}

// ── AGREGAR DISCÍPULO ─────────────────────
function setupAddDisciple() {
    document.getElementById('btn-open-add')?.addEventListener('click', () => document.getElementById('modal-add-disciple').classList.add('active'));
    document.getElementById('btn-close-add')?.addEventListener('click', () => document.getElementById('modal-add-disciple').classList.remove('active'));

    let searchTimeout;
    document.getElementById('search-unassigned')?.addEventListener('input', e => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => searchUnassigned(e.target.value), 300);
    });
    document.getElementById('btn-search-unassigned')?.addEventListener('click', () => {
        searchUnassigned(document.getElementById('search-unassigned').value);
    });
}

async function searchUnassigned(term) {
    const container = document.getElementById('unassigned-container');
    container.innerHTML = '<p class="text-secondary text-center">Buscando...</p>';
    let query = _s.from('usuarios').select('id, nombre, email').in('rol', ['estudiante', 'discipulo']).is('lider_asignado_id', null);
    if (term.trim()) query = query.ilike('nombre', `%${term.trim()}%`);
    const { data, error } = await query.limit(15);
    if (error) { container.innerHTML = `<p style="color:#ff6b6b">${error.message}</p>`; return; }
    if (!data || data.length === 0) { container.innerHTML = '<p class="text-secondary text-center">Sin resultados sin líder asignado.</p>'; return; }
    container.innerHTML = '';
    data.forEach(u => {
        const div = document.createElement('div');
        div.className = 'unassigned-item';
        div.innerHTML = `<div><strong>${u.nombre}</strong><br><small style="color:#8A9E8A">${u.email}</small></div><button class="btn-primary btn-small" onclick="assignDisciple('${u.id}','${u.nombre.replace(/'/g,"\\'")}')">Asignar</button>`;
        container.appendChild(div);
    });
}

window.assignDisciple = async (userId, nombre) => {
    const { error } = await _s.from('usuarios').update({ lider_asignado_id: currentUser.id }).eq('id', userId);
    if (error) { alert('Error: ' + error.message); return; }
    showToast(`${nombre} añadido a tu grupo`);
    document.getElementById('modal-add-disciple').classList.remove('active');
    await loadData();
};

// ── PERFIL Y NOTAS ────────────────────────
let profileId = null;
window.openProfile = async (userId) => {
    const d = myDisciples.find(x => x.id === userId);
    if (!d) return;
    profileId = userId;
    document.getElementById('profile-name').textContent = d.nombre;
    document.getElementById('profile-notes').value = d.notas_lider || '';

    const { data: prog } = await _s.from('progreso_curso').select('modulo_id').eq('usuario_id', userId).eq('leido', true);
    const readIds = new Set((prog || []).map(p => p.modulo_id));
    const modsEl = document.getElementById('profile-modules');
    modsEl.innerHTML = allMods.map(m => `<li>${readIds.has(m.id) ? '<span style="color:#8ade8a">✓</span>' : '<span style="opacity:.4">○</span>'} Módulo ${m.orden}: ${m.titulo}</li>`).join('') || '<li style="opacity:.5">Sin módulos</li>';
    document.getElementById('modal-profile').classList.add('active');
};
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-close-profile')?.addEventListener('click', () => document.getElementById('modal-profile').classList.remove('active'));
    document.getElementById('btn-save-notes')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-save-notes');
        btn.disabled = true; btn.textContent = 'Guardando...';
        const notes = document.getElementById('profile-notes').value;
        const { error } = await _s.from('usuarios').update({ notas_lider: notes }).eq('id', profileId);
        if (error) showToast('Error: ' + error.message, true);
        else {
            showToast('Notas guardadas');
            const d = myDisciples.find(x => x.id === profileId);
            if (d) d.notas_lider = notes;
        }
        btn.disabled = false; btn.textContent = 'Guardar Notas';
    });
});

// ── CURSO (READONLY) ──────────────────────
function renderCourseReadonly() {
    const container = document.getElementById('modules-container');
    if (!container) return;
    container.innerHTML = allMods.length === 0
        ? '<p class="text-secondary text-center">Sin módulos activos.</p>'
        : allMods.map(m => `<div class="module-row"><div class="mod-info"><h4>Módulo ${m.orden}: ${m.titulo}</h4><p>${m.descripcion || ''}</p></div></div>`).join('');
}

// ── TOAST ─────────────────────────────────
function showToast(msg, isError = false) {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.style.borderLeftColor = isError ? '#ff6b6b' : '#C9A84C';
    t.innerHTML = `<span>${isError ? '✕' : '✓'}</span><span>${msg}</span>`;
    c.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}
