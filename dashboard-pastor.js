// ==========================================
// dashboard-pastor.js — PANEL PASTORAL COMPLETO
// Requiere: config.js (window.sb)
// ==========================================
const _s = window.sb;
let currentUser = null;
let allUsers = [], allModules = [];
let progressData = [], sortCol = 'nombre', sortAsc = true;
let charts = {};

// ── GUARDIA DE SEGURIDAD ────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await _s.auth.getSession();
    if (!session) return window.location.href = 'auth.html';

    currentUser = session.user;
    const { data: u, error } = await _s.from('usuarios').select('rol, nombre, foto_url').eq('id', currentUser.id).maybeSingle();
    if (error || !u || u.rol !== 'pastor') {
        alert('Acceso denegado: solo pastores.');
        return window.location.href = 'auth.html';
    }

    document.getElementById('user-name').textContent = u.nombre;
    document.getElementById('user-avatar').textContent = u.nombre.charAt(0).toUpperCase();

    await loadAll();
    setupNav();
    setupFilters();
    setupModuleModal();
    // setupContentForms() eliminado: el CMS ahora usa dashboard-pastor-web.js
    setupTableSort();

    document.getElementById('btn-export-pdf').addEventListener('click', exportPDF);
    document.getElementById('btn-logout').addEventListener('click', async () => { await _s.auth.signOut(); window.location.href = 'index.html'; });

    _s.channel('pastor-rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, loadAll)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'progreso_curso' }, loadAll)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'roles_log' }, loadRolesLog)
        .subscribe();
});
// ── CARGA GENERAL ─────────────────────────
async function loadAll() {
    const [{ data: users }, { data: mods }] = await Promise.all([
        _s.from('usuarios').select('id, nombre, email, rol, fecha_registro, activo, foto_url, lider_asignado_id, lider:usuarios!lider_asignado_id(nombre)'),
        _s.from('modulos_curso').select('id').eq('activo', true)
    ]);
    allUsers = users || [];
    allModules = mods || [];
    renderKPIs();
    await buildCharts();
    renderUsersTable(allUsers);
    renderModules();
    await buildProgressTable();
}

// ── NAVEGACIÓN ────────────────────────────
function setupNav() {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.view-section').forEach(v => {
                v.classList.remove('active');
                v.style.display = 'none';
            });
            btn.classList.add('active');
            const target = btn.getAttribute('data-target');
            const el = document.getElementById(target);
            if (el) {
                el.classList.add('active');
                el.style.display = 'block';
            }
            const titleEl = document.getElementById('page-title');
            if (titleEl) titleEl.textContent = btn.textContent.trim();
            
            if (target === 'view-stats') Object.values(charts).forEach(c => c?.resize?.());
            if (target === 'view-roles-log') loadRolesLog();
            if (target === 'view-content' && typeof window.initCMS === 'function') window.initCMS();
            
            // Scroll to top of main content
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.scrollTo({ top: 0, behavior: 'smooth' });
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// ── KPIs ──────────────────────────────────
function renderKPIs() {
    const activos = allUsers.filter(u => u.activo).length;
    document.getElementById('kpi-activos').textContent = activos;

    const now = new Date();
    const cm = now.getMonth(), cy = now.getFullYear();
    let thisM = 0, lastM = 0;
    allUsers.forEach(u => {
        const d = new Date(u.fecha_registro);
        if (d.getFullYear() === cy && d.getMonth() === cm) thisM++;
        else if ((cm > 0 && d.getFullYear() === cy && d.getMonth() === cm - 1) || (cm === 0 && d.getFullYear() === cy - 1 && d.getMonth() === 11)) lastM++;
    });
    document.getElementById('kpi-crecimiento').textContent = `+${thisM}`;
    const pct = lastM > 0 ? ((thisM - lastM) / lastM * 100).toFixed(1) : null;
    document.getElementById('kpi-crecimiento-sub').innerHTML = pct !== null
        ? `<span style="color:${pct >= 0 ? '#8ade8a' : '#ff6b6b'}">${pct >= 0 ? '↑' : '↓'} ${Math.abs(pct)}%</span> vs mes ant.`
        : 'vs mes anterior';
}

// ── CHARTS ────────────────────────────────
async function buildCharts() {
    Chart.defaults.color = '#8A9E8A';
    Chart.defaults.borderColor = 'rgba(138,158,138,0.1)';
    Chart.defaults.font.family = "'Outfit', sans-serif";
    const gold = '#C9A84C', greenL = '#8ade8a', dark = '#0A0F0A';
    const now = new Date();

    // 1. Crecimiento línea
    const counts = new Array(12).fill(0);
    allUsers.forEach(u => {
        const diff = (now.getFullYear() - new Date(u.fecha_registro).getFullYear()) * 12 + (now.getMonth() - new Date(u.fecha_registro).getMonth());
        if (diff >= 0 && diff < 12) counts[11 - diff]++;
    });
    let run = allUsers.length - counts.reduce((a, b) => a + b, 0);
    const accum = counts.map(c => (run += c));
    const labels = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
        return d.toLocaleString('es-ES', { month: 'short' }).toUpperCase();
    });
    if (charts.growth) charts.growth.destroy();
    charts.growth = new Chart(document.getElementById('chartGrowth'), {
        type: 'line',
        data: { labels, datasets: [{ label: 'Miembros', data: accum, borderColor: gold, backgroundColor: 'rgba(201,168,76,.12)', fill: true, tension: .4, pointBorderColor: gold, pointBackgroundColor: dark }] },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // 2. Asistencia barras
    const fourW = new Date(); fourW.setDate(fourW.getDate() - 28);
    const { data: att } = await _s.from('asistencia').select('evento_tipo').eq('presente', true).gte('fecha', fourW.toISOString().split('T')[0]);
    const ac = { dominical: 0, estudio: 0, jovenes: 0, oracion: 0 };
    (att || []).forEach(r => { if (ac[r.evento_tipo] !== undefined) ac[r.evento_tipo]++; });
    Object.keys(ac).forEach(k => ac[k] = Math.round(ac[k] / 4));
    if (charts.att) charts.att.destroy();
    charts.att = new Chart(document.getElementById('chartAttendance'), {
        type: 'bar',
        data: { labels: ['Dominical', 'Estudio', 'Jóvenes', 'Oración'], datasets: [{ label: 'Promedio', data: Object.values(ac), backgroundColor: [gold, greenL, '#E8C97A', '#8A9E8A'], borderRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // 3. Dona roles (Porcentajes)
    const rc = { lider: 0, discipulo: 0, nuevo: 0 };
    allUsers.forEach(u => { 
        if (u.rol === 'pastor' || u.rol === 'lider') rc.lider++;
        else if (u.rol === 'discipulo') rc.discipulo++;
        else rc.nuevo++;
    });
    const totalRoles = allUsers.length || 1;
    const dataRoles = [
        Math.round((rc.lider / totalRoles) * 100),
        Math.round((rc.discipulo / totalRoles) * 100),
        Math.round((rc.nuevo / totalRoles) * 100)
    ];

    if (charts.roles) charts.roles.destroy();
    charts.roles = new Chart(document.getElementById('chartRoles'), {
        type: 'pie', // Grafica redonda clásica
        data: { 
            labels: ['Líderes', 'Discípulos', 'Gente Nueva'], 
            datasets: [{ 
                data: dataRoles, 
                backgroundColor: [gold, greenL, '#8A9E8A'], 
                borderColor: dark, 
                borderWidth: 2 
            }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ' ' + context.label + ': ' + context.raw + '%';
                        }
                    }
                }
            }
        }
    });

    // 4. Top 5 líderes horizontal
    const { data: prog } = await _s.from('progreso_curso').select('usuario_id');
    const leaders = allUsers.filter(u => {
        const rolesStr = (u?.roles || []).join(',') + ',' + (u?.rol || '');
        return rolesStr.includes('lider') || rolesStr.includes('pastor');
    });
    const lStats = leaders.map(l => {
        const disc = allUsers.filter(u => u.lider_asignado_id === l.id);
        const possible = disc.length * allModules.length;
        if (possible === 0) return { name: l.nombre.split(' ')[0], score: 0 };
        const read = (prog || []).filter(p => disc.some(d => d.id === p.usuario_id)).length;
        return { name: l.nombre.split(' ')[0], score: Math.round(read / possible * 100) };
    }).sort((a, b) => b.score - a.score).slice(0, 5);
    if (charts.leaders) charts.leaders.destroy();
    charts.leaders = new Chart(document.getElementById('chartLeaders'), {
        type: 'bar',
        data: { labels: lStats.map(x => x.name), datasets: [{ label: '% Avance', data: lStats.map(x => x.score), backgroundColor: gold, borderRadius: 4 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false }
    });
}

// ── TABLA USUARIOS ────────────────────────
function renderUsersTable(users) {
    const tbody = document.getElementById('table-users-body');
    tbody.innerHTML = '';
    const leaders = allUsers.filter(u => {
        const rolesStr = (u?.roles || []).join(',') + ',' + (u?.rol || '');
        return rolesStr.includes('lider') || rolesStr.includes('pastor');
    });
    const page = parseInt(tbody.dataset.page || '0');
    const pageSize = 20;
    const slice = users.slice(page * pageSize, (page + 1) * pageSize);

    if (slice.length === 0) { tbody.innerHTML = '<tr><td colspan="7" class="text-center">Sin resultados.</td></tr>'; return; }

    slice.forEach(u => {
        const fecha = new Date(u.fecha_registro).toLocaleDateString('es-ES');
        const isSelf = u.id === currentUser.id;
        const rStr = (u.roles || []).join(',') + ',' + (u.rol || '');
        const mainRole = u.rol || 'estudiante';
        const roleSelect = isSelf
            ? `<span class="badge-gold">Pastor</span>`
            : `<div style="display:flex;align-items:center;gap:8px;">
                 <select class="form-select" style="padding:.35rem;font-size:.9rem;flex:1;" onchange="confirmRole('${u.id}','${u.nombre.replace(/'/g,"\\'")}',this.value,this)">
                   ${['pastor','lider','discipulo'].map(r => `<option value="${r}" ${mainRole===r?'selected':''}>${r.charAt(0).toUpperCase()+r.slice(1)}</option>`).join('')}
                 </select>
                 <label style="font-size:0.8rem;color:#8A9E8A;white-space:nowrap;margin:0;cursor:pointer;"><input type="checkbox" style="margin:0;" onchange="toggleEstudiante('${u.id}', this.checked)" ${rStr.includes('estudiante') ? 'checked' : ''}> Estudiante</label>
               </div>`;
        const leaderOpts = `<option value="">-- Sin Líder --</option>` + leaders.filter(l => l.id !== u.id).map(l => `<option value="${l.id}" ${u.lider_asignado_id===l.id?'selected':''}>${l.nombre}</option>`).join('');
        const leaderSelect = `<select class="form-select" style="padding:.35rem;font-size:.9rem" onchange="assignLeader('${u.id}',this.value)">${leaderOpts}</select>`;
        const avatar = u.foto_url ? `<img src="${u.foto_url}" class="table-avatar" alt="">` : `<div class="table-avatar-placeholder">${u.nombre.charAt(0)}</div>`;
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${avatar}</td><td><strong>${u.nombre}</strong></td><td>${u.email}</td><td>${roleSelect}</td><td>${leaderSelect}</td><td>${fecha}</td><td><span style="color:${u.activo?'#8ade8a':'#ff6b6b'}">${u.activo?'Activo':'Inactivo'}</span></td>`;
        tbody.appendChild(tr);
    });
}

// ── FILTROS USUARIOS ──────────────────────
function setupFilters() {
    const searchInput = document.getElementById('search-user');
    const roleFilter  = document.getElementById('filter-role');
    const filter = () => {
        const q = searchInput.value.toLowerCase();
        const r = roleFilter.value;
        const filtered = allUsers.filter(u =>
            (u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
            (r === '' || u.rol === r)
        );
        renderUsersTable(filtered);
    };
    searchInput.addEventListener('input', filter);
    roleFilter.addEventListener('change', filter);
}

// ── CAMBIO DE ROL ─────────────────────────
let pendingRole = null;
window.confirmRole = (userId, userName, newRole, selectEl) => {
    const user = allUsers.find(u => u.id === userId);
    pendingRole = { userId, userName, newRole, oldRole: user.rol, selectEl };
    document.getElementById('modal-role-user-name').textContent = userName;
    document.getElementById('modal-role-new').textContent = newRole.toUpperCase();
    document.getElementById('modal-role-confirm').classList.add('active');
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-cancel-role')?.addEventListener('click', () => {
        if (pendingRole) pendingRole.selectEl.value = pendingRole.oldRole;
        document.getElementById('modal-role-confirm').classList.remove('active');
        pendingRole = null;
    });
    document.getElementById('btn-confirm-role')?.addEventListener('click', async () => {
        if (!pendingRole) return;
        const btn = document.getElementById('btn-confirm-role');
        btn.disabled = true; btn.textContent = 'Guardando...';
        const { userId, userName, newRole, oldRole } = pendingRole;
        try {
            const { error } = await _s.from('usuarios').update({ rol: newRole }).eq('id', userId);
            if (error) throw error;
            await _s.from('roles_log').insert({ usuario_id: userId, rol_anterior: oldRole, rol_nuevo: newRole, cambiado_por: currentUser.id });
            showToast(`Rol de ${userName} actualizado a ${newRole}`);
            document.getElementById('modal-role-confirm').classList.remove('active');
            pendingRole = null;
        } catch (e) { showToast('Error: ' + e.message, true); }
        finally { btn.disabled = false; btn.textContent = 'Confirmar'; }
    });
});

window.assignLeader = async (userId, leaderId) => {
    const val = leaderId === '' ? null : leaderId;
    const { error } = await _s.from('usuarios').update({ lider_asignado_id: val }).eq('id', userId);
    if (error) showToast('Error: ' + error.message, true);
    else showToast('Líder asignado correctamente');
};

// ── HISTORIAL ROLES ───────────────────────
async function loadRolesLog() {
    const { data, error } = await _s.from('roles_log').select('*, afectado:usuarios!usuario_id(nombre), pastor:usuarios!cambiado_por(nombre)').order('fecha', { ascending: false }).limit(100);
    const tbody = document.getElementById('table-log-body');
    if (!tbody) return;
    if (error) { tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:#ff6b6b">${error.message}</td></tr>`; return; }
    tbody.innerHTML = '';
    (data || []).forEach(log => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${new Date(log.fecha).toLocaleString('es-ES')}</td><td><strong>${log.afectado?.nombre || '-'}</strong></td><td style="opacity:.7">${log.rol_anterior}</td><td class="text-gold">${log.rol_nuevo}</td><td>${log.pastor?.nombre || 'Sistema'}</td>`;
        tbody.appendChild(tr);
    });
}

// ── MÓDULOS ───────────────────────────────
async function renderModules() {
    const { data, error } = await _s.from('modulos_curso').select('*').order('orden', { ascending: true });
    const container = document.getElementById('modules-container');
    if (!container) return;
    if (error) { container.innerHTML = `<p style="color:#ff6b6b">${error.message}</p>`; return; }
    container.innerHTML = '';
    (data || []).forEach(m => {
        const div = document.createElement('div');
        div.className = 'module-row';
        div.innerHTML = `
            <div class="mod-info"><h4>Módulo ${m.orden}: ${m.titulo}</h4><p>${m.descripcion || ''}</p></div>
            <div class="mod-actions">
                <span style="padding:.25rem .6rem;border-radius:3px;font-size:.8rem;background:${m.activo?'rgba(138,222,138,.15)':'rgba(255,107,107,.15)'};color:${m.activo?'#8ade8a':'#ff6b6b'}">${m.activo?'Activo':'Inactivo'}</span>
                <button class="btn-danger btn-small" onclick="deleteModule('${m.id}')">Eliminar</button>
            </div>`;
        container.appendChild(div);
    });
}

function setupModuleModal() {
    document.getElementById('btn-open-new-module')?.addEventListener('click', () => document.getElementById('modal-new-module').classList.add('active'));
    document.getElementById('btn-cancel-module')?.addEventListener('click', () => document.getElementById('modal-new-module').classList.remove('active'));
    document.getElementById('form-new-module')?.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = document.getElementById('btn-save-module');
        btn.disabled = true; btn.textContent = 'Guardando...';
        try {
            let archivo_url = null;
            const file = document.getElementById('mod-file').files[0];
            if (file) {
                const path = `modulos/${Date.now()}_${file.name}`;
                const { error: upErr } = await _s.storage.from('curso-materiales').upload(path, file);
                if (upErr) throw upErr;
                const { data: { publicUrl } } = _s.storage.from('curso-materiales').getPublicUrl(path);
                archivo_url = publicUrl;
            }
            const payload = {
                titulo: document.getElementById('mod-title').value.trim(),
                descripcion: document.getElementById('mod-desc').value.trim(),
                contenido_texto: document.getElementById('mod-content').value.trim(),
                orden: parseInt(document.getElementById('mod-order').value),
                activo: document.getElementById('mod-active').checked,
                creado_por: currentUser.id,
                archivo_url
            };
            const { error } = await _s.from('modulos_curso').insert(payload);
            if (error) throw error;
            showToast('Módulo creado correctamente');
            document.getElementById('modal-new-module').classList.remove('active');
            document.getElementById('form-new-module').reset();
            await renderModules();
        } catch (err) { showToast('Error: ' + err.message, true); }
        finally { btn.disabled = false; btn.textContent = 'Guardar Módulo'; }
    });
}

window.deleteModule = async (id) => {
    if (!confirm('¿Eliminar este módulo permanentemente?')) return;
    const { error } = await _s.from('modulos_curso').delete().eq('id', id);
    if (error) showToast('Error: ' + error.message, true);
    else { showToast('Módulo eliminado'); await renderModules(); }
};

// ── CONTENIDO WEB CMS ─────────────────────
function setupContentForms() {
    // Pre-cargar
    _s.from('contenido_pagina').select('*').then(({ data }) => {
        if (!data) return;
        data.forEach(row => {
            if (row.seccion === 'hero') {
                if (document.getElementById('hero-title')) document.getElementById('hero-title').value = row.titulo || '';
                if (document.getElementById('hero-subtitle')) document.getElementById('hero-subtitle').value = row.subtitulo || '';
            }
            if (row.seccion === 'nosotros') {
                if (document.getElementById('nosotros-title')) document.getElementById('nosotros-title').value = row.titulo || '';
                if (document.getElementById('nosotros-text')) document.getElementById('nosotros-text').value = row.texto || '';
                if (document.getElementById('nosotros-mision')) document.getElementById('nosotros-mision').value = row.subtitulo || '';
            }
            if (row.seccion === 'horarios') {
                if (document.getElementById('horarios-title')) document.getElementById('horarios-title').value = row.titulo || '';
                if (document.getElementById('horarios-subtitle')) document.getElementById('horarios-subtitle').value = row.subtitulo || '';
            }
            if (row.seccion === 'eventos') {
                if (document.getElementById('eventos-title')) document.getElementById('eventos-title').value = row.titulo || '';
                if (document.getElementById('eventos-subtitle')) document.getElementById('eventos-subtitle').value = row.subtitulo || '';
            }
        });
    });

    async function saveSection(section, payload, btn, originalText) {
        btn.disabled = true; btn.textContent = 'Guardando...';
        try {
            const { error } = await _s.from('contenido_pagina').upsert({ seccion: section, ...payload, actualizado_por: currentUser.id, updated_at: new Date().toISOString() }, { onConflict: 'seccion' });
            if (error) throw error;
            showToast('Sección actualizada correctamente');
        } catch (err) { showToast('Error: ' + err.message, true); }
        finally { btn.disabled = false; btn.textContent = originalText; }
    }

    document.getElementById('form-hero')?.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = e.submitter; const t = btn.textContent;
        let imagen_url = null;
        const imgFile = document.getElementById('hero-image').files[0];
        if (imgFile) {
            const path = `hero/${Date.now()}_${imgFile.name}`;
            const { error } = await _s.storage.from('imagenes-pagina').upload(path, imgFile, { upsert: true });
            if (!error) ({ data: { publicUrl: imagen_url } } = _s.storage.from('imagenes-pagina').getPublicUrl(path));
        }
        await saveSection('hero', { titulo: document.getElementById('hero-title').value, subtitulo: document.getElementById('hero-subtitle').value, imagen_url }, btn, t);
    });

    document.getElementById('form-nosotros')?.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = e.submitter; const t = btn.textContent;
        await saveSection('nosotros', { titulo: document.getElementById('nosotros-title').value, texto: document.getElementById('nosotros-text').value, subtitulo: document.getElementById('nosotros-mision').value }, btn, t);
    });

    document.getElementById('form-horarios')?.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = e.submitter; const t = btn.textContent;
        await saveSection('horarios', { titulo: document.getElementById('horarios-title').value, subtitulo: document.getElementById('horarios-subtitle').value }, btn, t);
    });

    document.getElementById('form-eventos')?.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = e.submitter; const t = btn.textContent;
        await saveSection('eventos', { titulo: document.getElementById('eventos-title').value, subtitulo: document.getElementById('eventos-subtitle').value }, btn, t);
    });
}

// ── TABLA PROGRESO + SORT ─────────────────
async function buildProgressTable() {
    const { data: prog } = await _s.from('progreso_curso').select('usuario_id, modulo_id, fecha_lectura').eq('leido', true);
    progressData = allUsers.map(u => {
        const up = (prog || []).filter(p => p.usuario_id === u.id);
        const read = up.length, total = allModules.length;
        const pct = total > 0 ? Math.round(read / total * 100) : 0;
        const lastDate = up.sort((a,b)=>new Date(b.fecha_lectura)-new Date(a.fecha_lectura))[0]?.fecha_lectura;
        return { nombre: u.nombre, rol: u.rol, lider: u.lider?.nombre || '-', modulos: `${read}/${total}`, modulos_val: read, porcentaje: pct, actividad: lastDate ? new Date(lastDate).toLocaleDateString('es-ES') : 'Sin actividad', actividad_val: lastDate || '' };
    });
    renderProgressTable();
}

function renderProgressTable() {
    const tbody = document.getElementById('table-progress-body');
    if (!tbody) return;
    const sorted = [...progressData].sort((a, b) => {
        let av = a[sortCol === 'modulos' ? 'modulos_val' : sortCol === 'actividad' ? 'actividad_val' : sortCol];
        let bv = b[sortCol === 'modulos' ? 'modulos_val' : sortCol === 'actividad' ? 'actividad_val' : sortCol];
        return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    tbody.innerHTML = '';
    if (sorted.length === 0) { tbody.innerHTML = '<tr><td colspan="6" class="text-center">Sin datos.</td></tr>'; return; }
    sorted.forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><strong>${d.nombre}</strong></td><td>${d.rol}</td><td>${d.lider}</td><td>${d.modulos}</td><td class="text-gold">${d.porcentaje}%</td><td style="opacity:.7">${d.actividad}</td>`;
        tbody.appendChild(tr);
    });
}

function setupTableSort() {
    document.querySelectorAll('#table-progress th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.getAttribute('data-sort');
            if (sortCol === col) sortAsc = !sortAsc; else { sortCol = col; sortAsc = true; }
            renderProgressTable();
        });
    });
}

// ── PDF EXPORT ────────────────────────────
function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(201, 168, 76);
    doc.text('Reporte de Progreso — Legado de Bendición', 14, 18);
    doc.setFontSize(9); doc.setTextColor(120, 120, 120);
    doc.text(`Generado el ${new Date().toLocaleString('es-ES')}`, 14, 26);
    doc.autoTable({
        startY: 32,
        head: [['Nombre', 'Rol', 'Líder', 'Módulos', '%', 'Última Actividad']],
        body: progressData.map(d => [d.nombre, d.rol, d.lider, d.modulos, `${d.porcentaje}%`, d.actividad]),
        theme: 'grid',
        headStyles: { fillColor: [26, 58, 26], textColor: [201, 168, 76] },
        styles: { font: 'helvetica', fontSize: 8 }
    });
    doc.save(`Progreso_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ── TOAST ─────────────────────────────────
function showToast(msg, isError = false) {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = 'toast';
    t.style.borderLeftColor = isError ? '#ff6b6b' : '#C9A84C';
    t.innerHTML = `<span>${isError ? '✕' : '✓'}</span><span>${msg}</span>`;
    c.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}
