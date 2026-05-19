// dashboard-pastor-curso.js — Constructor de Curso Bíblico (Pastor)
let currentModuloId = null;

document.addEventListener('DOMContentLoaded', () => {
    cargarArbolCurso();
    document.getElementById('btn-refresh-course')?.addEventListener('click', cargarArbolCurso);
    document.getElementById('btn-add-level')?.addEventListener('click', () => renderLevelForm());
});

// ── ÁRBOL DEL CURSO ──
async function cargarArbolCurso() {
    const tree = document.getElementById('course-tree');
    if (!tree) return;
    tree.innerHTML = '<div style="padding:1rem;color:var(--text-secondary);text-align:center;">Cargando...</div>';
    try {
        const { data: niveles, error } = await _s.from('niveles_curso').select('*, modulos:modulos_curso(*)').order('orden');
        if (error) throw error;
        tree.innerHTML = '';
        if (!niveles || niveles.length === 0) {
            tree.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-secondary);">No hay niveles. Crea uno con "+ Nuevo Nivel".</div>';
            return;
        }
        for (const nivel of niveles) {
            const el = document.createElement('div');
            el.className = 'tree-level';
            el.innerHTML = `
                <div class="tree-node level-node" style="padding:10px 12px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;border-radius:6px;margin-bottom:2px;transition:background 0.2s;border-left:3px solid var(--color-primary);background:rgba(201,168,76,0.05);" onmouseover="this.style.background='rgba(201,168,76,0.12)'" onmouseout="this.style.background='rgba(201,168,76,0.05)'">
                    <span style="font-weight:600;color:var(--text-primary);">📁 ${nivel.titulo}</span>
                    <span style="background:rgba(201,168,76,0.15);color:var(--color-primary);padding:2px 8px;border-radius:10px;font-size:0.75rem;">${nivel.modulos?.length || 0} Módulos</span>
                </div>
                <div class="tree-children" style="padding-left:18px;"></div>
            `;
            el.querySelector('.level-node').onclick = () => renderLevelForm(nivel);
            const children = el.querySelector('.tree-children');
            for (const mod of (nivel.modulos || []).sort((a,b) => a.orden - b.orden)) {
                const modEl = document.createElement('div');
                modEl.style.cssText = 'padding:8px 12px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;border-radius:5px;margin-bottom:2px;transition:background 0.2s;color:var(--text-secondary);font-size:0.9rem;';
                modEl.onmouseover = () => modEl.style.background = 'rgba(255,255,255,0.05)';
                modEl.onmouseout = () => modEl.style.background = 'transparent';
                modEl.innerHTML = `<span>📂 ${mod.titulo}</span><span style="font-size:0.75rem;opacity:0.6;">Orden ${mod.orden}</span>`;
                modEl.onclick = (e) => { e.stopPropagation(); seleccionarModulo(mod.id); };
                children.appendChild(modEl);
            }
            // Botón agregar módulo dentro del nivel
            const addBtn = document.createElement('div');
            addBtn.style.cssText = 'padding:6px 12px;cursor:pointer;color:var(--color-primary);font-size:0.82rem;opacity:0.7;transition:opacity 0.2s;';
            addBtn.onmouseover = () => addBtn.style.opacity = '1';
            addBtn.onmouseout = () => addBtn.style.opacity = '0.7';
            addBtn.textContent = '+ Agregar Módulo';
            addBtn.onclick = (e) => { e.stopPropagation(); renderModuleForm(nivel.id); };
            children.appendChild(addBtn);
            tree.appendChild(el);
        }
    } catch (e) {
        console.error(e);
        tree.innerHTML = '<div style="color:#ff6b6b;padding:1rem;text-align:center;">Error al cargar</div>';
    }
}

// ── FORMULARIO DE NIVEL ──
function renderLevelForm(nivel = null) {
    const panel = document.getElementById('course-editor-panel');
    if (!panel) return;
    const isEdit = !!nivel;
    panel.innerHTML = `
        <h2 style="color:var(--color-primary);font-family:var(--font-heading);font-size:1.8rem;margin-bottom:1.5rem;">${isEdit ? '✏️ Editar Nivel' : '📁 Nuevo Nivel'}</h2>
        <form id="form-nivel">
            <div class="form-group"><label style="color:var(--text-secondary);display:block;margin-bottom:5px;">Título del Nivel</label>
                <input type="text" class="form-input" id="nivel-titulo" value="${isEdit ? nivel.titulo : ''}" required></div>
            <div class="form-group"><label style="color:var(--text-secondary);display:block;margin-bottom:5px;">Descripción</label>
                <textarea class="form-input" id="nivel-desc" rows="3">${isEdit ? (nivel.descripcion||'') : ''}</textarea></div>
            <div class="form-group"><label style="color:var(--text-secondary);display:block;margin-bottom:5px;">Orden</label>
                <input type="number" class="form-input" id="nivel-orden" value="${isEdit ? nivel.orden : 1}" min="1" required></div>
            <div class="form-group"><label style="color:var(--text-secondary);display:block;margin-bottom:5px;">URL Imagen (opcional)</label>
                <input type="text" class="form-input" id="nivel-img" value="${isEdit ? (nivel.imagen_url||'') : ''}" placeholder="https://..."></div>
            <div class="form-group"><label style="display:flex;align-items:center;gap:8px;color:var(--text-secondary);"><input type="checkbox" id="nivel-activo" ${(!isEdit || nivel.activo) ? 'checked' : ''}> Nivel Activo</label></div>
            <div style="display:flex;gap:10px;margin-top:1.5rem;">
                <button type="submit" class="btn-primary" style="flex:1;" id="btn-save-nivel">💾 ${isEdit ? 'Guardar Cambios' : 'Crear Nivel'}</button>
                ${isEdit ? `<button type="button" class="btn-danger" onclick="eliminarNivel('${nivel.id}')">🗑 Eliminar</button>` : ''}
            </div>
        </form>
    `;
    document.getElementById('form-nivel').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-save-nivel');
        btn.disabled = true; btn.textContent = 'Guardando...';
        const payload = {
            titulo: document.getElementById('nivel-titulo').value.trim(),
            descripcion: document.getElementById('nivel-desc').value.trim(),
            orden: parseInt(document.getElementById('nivel-orden').value),
            imagen_url: document.getElementById('nivel-img').value.trim() || null,
            activo: document.getElementById('nivel-activo').checked
        };
        try {
            if (isEdit) {
                const { error } = await _s.from('niveles_curso').update(payload).eq('id', nivel.id);
                if (error) throw error;
            } else {
                const { error } = await _s.from('niveles_curso').insert(payload);
                if (error) throw error;
            }
            showToast(isEdit ? 'Nivel actualizado' : 'Nivel creado');
            await cargarArbolCurso();
            panel.innerHTML = '<div style="padding:3rem;text-align:center;color:var(--text-secondary);font-size:1.1rem;">✅ Guardado correctamente. Selecciona un elemento del árbol.</div>';
        } catch (err) {
            showToast('Error: ' + err.message, true);
            btn.disabled = false; btn.textContent = '💾 Guardar';
        }
    });
}

async function eliminarNivel(id) {
    if (!confirm('¿Eliminar este nivel y todos sus módulos/lecciones?')) return;
    const { error } = await _s.from('niveles_curso').delete().eq('id', id);
    if (error) showToast('Error: ' + error.message, true);
    else { showToast('Nivel eliminado'); cargarArbolCurso(); document.getElementById('course-editor-panel').innerHTML = '<div style="padding:3rem;text-align:center;color:var(--text-secondary);">Nivel eliminado.</div>'; }
}

// ── FORMULARIO DE MÓDULO ──
function renderModuleForm(nivelId, modulo = null) {
    const panel = document.getElementById('course-editor-panel');
    if (!panel) return;
    const isEdit = !!modulo;
    panel.innerHTML = `
        <h2 style="color:var(--color-primary);font-family:var(--font-heading);font-size:1.8rem;margin-bottom:1.5rem;">${isEdit ? '✏️ Editar Módulo' : '📂 Nuevo Módulo'}</h2>
        <form id="form-modulo">
            <div class="form-group"><label style="color:var(--text-secondary);display:block;margin-bottom:5px;">Título del Módulo</label>
                <input type="text" class="form-input" id="mod-titulo" value="${isEdit ? modulo.titulo : ''}" required></div>
            <div class="form-group"><label style="color:var(--text-secondary);display:block;margin-bottom:5px;">Descripción</label>
                <textarea class="form-input" id="mod-desc" rows="3">${isEdit ? (modulo.descripcion||'') : ''}</textarea></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                <div class="form-group"><label style="color:var(--text-secondary);display:block;margin-bottom:5px;">Orden</label>
                    <input type="number" class="form-input" id="mod-orden" value="${isEdit ? modulo.orden : 1}" min="1" required></div>
                <div class="form-group"><label style="color:var(--text-secondary);display:block;margin-bottom:5px;">Duración Estimada</label>
                    <input type="text" class="form-input" id="mod-duracion" value="${isEdit ? (modulo.duracion_estimada||'') : ''}" placeholder="ej: 2 horas"></div>
            </div>
            <div class="form-group"><label style="display:flex;align-items:center;gap:8px;color:var(--text-secondary);"><input type="checkbox" id="mod-activo" ${(!isEdit || modulo.activo) ? 'checked' : ''}> Módulo Activo</label></div>
            <div style="display:flex;gap:10px;margin-top:1.5rem;">
                <button type="submit" class="btn-primary" style="flex:1;" id="btn-save-mod">💾 ${isEdit ? 'Guardar Cambios' : 'Crear Módulo'}</button>
                ${isEdit ? `<button type="button" class="btn-danger" onclick="eliminarModulo('${modulo.id}')">🗑 Eliminar</button>` : ''}
            </div>
        </form>
    `;
    document.getElementById('form-modulo').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-save-mod');
        btn.disabled = true; btn.textContent = 'Guardando...';
        const payload = {
            nivel_id: nivelId,
            titulo: document.getElementById('mod-titulo').value.trim(),
            descripcion: document.getElementById('mod-desc').value.trim(),
            orden: parseInt(document.getElementById('mod-orden').value),
            duracion_estimada: document.getElementById('mod-duracion').value.trim() || null,
            activo: document.getElementById('mod-activo').checked
        };
        try {
            if (isEdit) {
                const { error } = await _s.from('modulos_curso').update(payload).eq('id', modulo.id);
                if (error) throw error;
            } else {
                const { error } = await _s.from('modulos_curso').insert(payload);
                if (error) throw error;
            }
            showToast(isEdit ? 'Módulo actualizado' : 'Módulo creado');
            await cargarArbolCurso();
        } catch (err) { showToast('Error: ' + err.message, true); btn.disabled = false; btn.textContent = '💾 Guardar'; }
    });
}

async function eliminarModulo(id) {
    if (!confirm('¿Eliminar este módulo y todo su contenido?')) return;
    const { error } = await _s.from('modulos_curso').delete().eq('id', id);
    if (error) showToast('Error: ' + error.message, true);
    else { showToast('Módulo eliminado'); cargarArbolCurso(); document.getElementById('course-editor-panel').innerHTML = '<div style="padding:3rem;text-align:center;color:var(--text-secondary);">Módulo eliminado.</div>'; }
}


// ── SELECCIONAR MÓDULO (Panel derecho con tabs) ──
async function seleccionarModulo(moduloId) {
    currentModuloId = moduloId;
    const panel = document.getElementById('course-editor-panel');
    panel.innerHTML = '<div style="padding:2rem;text-align:center;color:#8A9E8A;">Cargando módulo...</div>';
    try {
        const { data: modulo } = await _s.from('modulos_curso').select('*').eq('id', moduloId).single();
        const { data: lecciones } = await _s.from('lecciones').select('*, archivos_leccion(*)').eq('modulo_id', moduloId).order('orden');
        const { data: trabajo } = await _s.from('trabajos_modulo').select('*').eq('modulo_id', moduloId).maybeSingle();

        const lecHTML = (lecciones || []).map(l => {
            const archivos = (l.archivos_leccion||[]).map(f =>
                '<div style="display:flex;align-items:center;gap:8px;padding:4px 0;"><span style="color:#8A9E8A;font-size:0.85rem;">📄 ' + f.nombre + '</span><a href="' + f.archivo_url + '" target="_blank" style="color:#C9A84C;font-size:0.8rem;">Descargar</a><button style="background:none;border:none;color:#ff6b6b;cursor:pointer;font-size:0.8rem;" onclick="eliminarArchivo(\'' + f.id + '\')">✕</button></div>'
            ).join('');
            return '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(201,168,76,0.15);border-radius:8px;padding:1rem;margin-bottom:0.8rem;">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">' +
                '<h4 style="color:#F5F0E8;margin:0;">' + l.orden + '. ' + l.titulo + '</h4>' +
                '<div style="display:flex;gap:5px;"><button class="btn-small" style="background:rgba(201,168,76,0.1);border:1px solid #C9A84C;color:#C9A84C;padding:4px 10px;border-radius:5px;cursor:pointer;font-size:0.8rem;" onclick="renderLessonForm(\'' + moduloId + '\',\'' + l.id + '\')">✏️ Editar</button>' +
                '<button class="btn-small" style="background:rgba(255,80,80,0.1);border:1px solid #ff6b6b;color:#ff6b6b;padding:4px 10px;border-radius:5px;cursor:pointer;font-size:0.8rem;" onclick="eliminarLeccion(\'' + l.id + '\')">🗑</button></div></div>' +
                (l.video_url ? '<div style="color:#C9A84C;font-size:0.85rem;margin-bottom:5px;">🎥 Video adjunto</div>' : '') +
                '<div style="margin-top:8px;"><input type="file" id="file-' + l.id + '" style="display:none;" onchange="subirArchivoLeccion(\'' + l.id + '\', this.files[0])">' +
                '<button style="background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);color:#C9A84C;padding:5px 12px;border-radius:5px;cursor:pointer;font-size:0.82rem;" onclick="document.getElementById(\'file-' + l.id + '\').click()">📎 Subir Archivo</button>' +
                '<span id="progress-' + l.id + '" style="display:none;color:#C9A84C;font-size:0.8rem;margin-left:8px;">Subiendo...</span></div>' +
                (archivos ? '<div style="margin-top:8px;">' + archivos + '</div>' : '') +
                '</div>';
        }).join('');

        panel.innerHTML =
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">' +
            '<h2 style="color:#C9A84C;font-family:var(--font-heading);font-size:1.8rem;margin:0;">📂 ' + modulo.titulo + '</h2>' +
            '<button style="background:rgba(201,168,76,0.1);border:1px solid #C9A84C;color:#C9A84C;padding:5px 14px;border-radius:5px;cursor:pointer;" onclick="renderModuleForm(\'' + modulo.nivel_id + '\')">✏️ Editar Módulo</button></div>' +
            '<div style="display:flex;gap:0;border-bottom:1px solid rgba(201,168,76,0.2);margin-bottom:1.5rem;">' +
            '<button class="curso-tab" id="ctab-lec" onclick="switchCursoTab(\'tab-lecciones\',this)" style="padding:10px 20px;background:transparent;border:none;border-bottom:2px solid #C9A84C;color:#C9A84C;cursor:pointer;font-size:0.9rem;">📖 Lecciones</button>' +
            '<button class="curso-tab" id="ctab-trab" onclick="switchCursoTab(\'tab-trabajo\',this)" style="padding:10px 20px;background:transparent;border:none;border-bottom:2px solid transparent;color:#8A9E8A;cursor:pointer;font-size:0.9rem;">📝 Trabajo</button>' +
            '<button class="curso-tab" id="ctab-ent" onclick="switchCursoTab(\'tab-entregas\',this)" style="padding:10px 20px;background:transparent;border:none;border-bottom:2px solid transparent;color:#8A9E8A;cursor:pointer;font-size:0.9rem;">📋 Entregas</button></div>' +
            '<div id="tab-lecciones" class="curso-tab-content" style="display:block;">' +
            '<button class="btn-primary" style="margin-bottom:1rem;" onclick="renderLessonForm(\'' + moduloId + '\')">+ Nueva Lección</button>' +
            (lecHTML || '<div style="color:#8A9E8A;text-align:center;padding:2rem;">No hay lecciones aún.</div>') + '</div>' +
            '<div id="tab-trabajo" class="curso-tab-content" style="display:none;">' +
            (trabajo ?
                '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(201,168,76,0.15);border-radius:8px;padding:1.5rem;"><h3 style="color:#C9A84C;margin-bottom:0.5rem;">' + trabajo.titulo + '</h3><p style="color:#8A9E8A;margin-bottom:1rem;">' + (trabajo.descripcion||'') + '</p><div style="display:flex;gap:10px;"><button class="btn-primary" onclick="renderTrabajoForm(\'' + moduloId + '\',\'' + trabajo.id + '\')">✏️ Editar</button><button class="btn-danger" onclick="eliminarTrabajo(\'' + trabajo.id + '\')">🗑 Eliminar</button></div></div>'
                : '<div style="text-align:center;padding:2rem;color:#8A9E8A;"><p style="margin-bottom:1rem;">Sin trabajo asignado.</p><button class="btn-primary" onclick="renderTrabajoForm(\'' + moduloId + '\')">+ Crear Trabajo</button></div>'
            ) + '</div>' +
            '<div id="tab-entregas" class="curso-tab-content" style="display:none;"><div id="entregas-container">Cargando...</div></div>';

        if (trabajo) cargarEntregas(trabajo.id);
        else { const ec = document.getElementById('entregas-container'); if(ec) ec.innerHTML = '<div style="color:#8A9E8A;text-align:center;padding:2rem;">Crea un trabajo primero.</div>'; }
    } catch(e) {
        console.error(e);
        panel.innerHTML = '<div style="color:#ff6b6b;padding:2rem;text-align:center;">Error: ' + e.message + '</div>';
    }
}

function switchCursoTab(tabId, btn) {
    document.querySelectorAll('.curso-tab-content').forEach(c => c.style.display = 'none');
    document.querySelectorAll('.curso-tab').forEach(b => { b.style.borderBottomColor = 'transparent'; b.style.color = '#8A9E8A'; });
    const el = document.getElementById(tabId);
    if(el) el.style.display = 'block';
    btn.style.borderBottomColor = '#C9A84C';
    btn.style.color = '#C9A84C';
}

// ── FORMULARIO DE LECCIÓN ──
async function renderLessonForm(moduloId, leccionId) {
    const panel = document.getElementById('course-editor-panel');
    let le = {};
    if (leccionId) {
        const { data } = await _s.from('lecciones').select('*').eq('id', leccionId).single();
        if (data) le = data;
    }
    const isEdit = !!le.id;
    panel.innerHTML =
        '<button style="background:transparent;border:1px solid #8A9E8A;color:#8A9E8A;padding:5px 12px;border-radius:5px;cursor:pointer;margin-bottom:1rem;" onclick="seleccionarModulo(\'' + moduloId + '\')">← Volver</button>' +
        '<h2 style="color:#C9A84C;font-family:var(--font-heading);font-size:1.8rem;margin-bottom:1.5rem;">' + (isEdit ? '✏️ Editar Lección' : '📖 Nueva Lección') + '</h2>' +
        '<form id="form-leccion">' +
        '<div class="form-group"><label style="color:#8A9E8A;display:block;margin-bottom:5px;">Título</label><input type="text" class="form-input" id="lec-titulo" value="' + (le.titulo||'').replace(/"/g,'&quot;') + '" required></div>' +
        '<div class="form-group"><label style="color:#8A9E8A;display:block;margin-bottom:5px;">Contenido de la lección</label><textarea class="form-input" id="lec-contenido" rows="8">' + (le.contenido_texto||'') + '</textarea></div>' +
        '<div class="form-group"><label style="color:#8A9E8A;display:block;margin-bottom:5px;">URL de Video (YouTube/Vimeo)</label><input type="text" class="form-input" id="lec-video" value="' + (le.video_url||'') + '" placeholder="https://youtube.com/watch?v=..."></div>' +
        '<div class="form-group"><label style="color:#8A9E8A;display:block;margin-bottom:5px;">Orden</label><input type="number" class="form-input" id="lec-orden" value="' + (le.orden||1) + '" min="1" required></div>' +
        '<div style="display:flex;gap:10px;margin-top:1.5rem;"><button type="submit" class="btn-primary" style="flex:1;" id="btn-save-lec">💾 ' + (isEdit ? 'Guardar' : 'Crear') + '</button>' +
        (isEdit ? '<button type="button" class="btn-danger" onclick="eliminarLeccion(\'' + le.id + '\')">🗑</button>' : '') +
        '</div></form>';

    document.getElementById('form-leccion').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-save-lec');
        btn.disabled = true; btn.textContent = 'Guardando...';
        const payload = {
            modulo_id: moduloId,
            titulo: document.getElementById('lec-titulo').value.trim(),
            contenido_texto: document.getElementById('lec-contenido').value,
            video_url: document.getElementById('lec-video').value.trim() || null,
            orden: parseInt(document.getElementById('lec-orden').value),
            activo: true
        };
        try {
            if (isEdit) { const { error } = await _s.from('lecciones').update(payload).eq('id', le.id); if (error) throw error; }
            else { const { error } = await _s.from('lecciones').insert(payload); if (error) throw error; }
            showToast(isEdit ? 'Lección actualizada' : 'Lección creada');
            await cargarArbolCurso();
            seleccionarModulo(moduloId);
        } catch(err) { showToast('Error: ' + err.message, true); btn.disabled = false; btn.textContent = 'Guardar'; }
    });
}

async function eliminarLeccion(id) {
    if (!confirm('¿Eliminar esta lección?')) return;
    const { error } = await _s.from('lecciones').delete().eq('id', id);
    if (error) showToast('Error: ' + error.message, true);
    else { showToast('Lección eliminada'); if (currentModuloId) seleccionarModulo(currentModuloId); }
}

// ── ARCHIVOS ──
async function subirArchivoLeccion(leccionId, file) {
    if (!file) return;
    const prog = document.getElementById('progress-' + leccionId);
    if (prog) { prog.style.display = 'inline'; prog.textContent = 'Subiendo...'; }
    try {
        const path = 'contenido-modulos/' + leccionId + '/' + Date.now() + '_' + file.name;
        const { error } = await _s.storage.from('contenido-modulos').upload(path, file);
        if (error) throw error;
        const url = _s.storage.from('contenido-modulos').getPublicUrl(path).data.publicUrl;
        await _s.from('archivos_leccion').insert({ leccion_id: leccionId, nombre: file.name, archivo_url: url, tipo: file.type, tamano_kb: Math.round(file.size / 1024) });
        showToast('Archivo subido: ' + file.name);
        if (currentModuloId) seleccionarModulo(currentModuloId);
    } catch(e) { showToast('Error: ' + e.message, true); }
    if (prog) prog.style.display = 'none';
}

async function eliminarArchivo(id) {
    if (!confirm('¿Eliminar este archivo?')) return;
    const { error } = await _s.from('archivos_leccion').delete().eq('id', id);
    if (error) showToast('Error: ' + error.message, true);
    else { showToast('Archivo eliminado'); if (currentModuloId) seleccionarModulo(currentModuloId); }
}

// ── FORMULARIO DE TRABAJO ──
async function renderTrabajoForm(moduloId, trabajoId) {
    const panel = document.getElementById('course-editor-panel');
    let t = {};
    if (trabajoId) {
        const { data } = await _s.from('trabajos_modulo').select('*').eq('id', trabajoId).single();
        if (data) t = data;
    }
    const isEdit = !!t.id;
    panel.innerHTML =
        '<button style="background:transparent;border:1px solid #8A9E8A;color:#8A9E8A;padding:5px 12px;border-radius:5px;cursor:pointer;margin-bottom:1rem;" onclick="seleccionarModulo(\'' + moduloId + '\')">← Volver</button>' +
        '<h2 style="color:#C9A84C;font-family:var(--font-heading);font-size:1.8rem;margin-bottom:1.5rem;">' + (isEdit ? '✏️ Editar Trabajo' : '📝 Nuevo Trabajo') + '</h2>' +
        '<form id="form-trabajo">' +
        '<div class="form-group"><label style="color:#8A9E8A;display:block;margin-bottom:5px;">Título</label><input type="text" class="form-input" id="trab-titulo" value="' + (t.titulo||'').replace(/"/g,'&quot;') + '" required></div>' +
        '<div class="form-group"><label style="color:#8A9E8A;display:block;margin-bottom:5px;">Descripción breve</label><textarea class="form-input" id="trab-desc" rows="2">' + (t.descripcion||'') + '</textarea></div>' +
        '<div class="form-group"><label style="color:#8A9E8A;display:block;margin-bottom:5px;">Instrucciones detalladas</label><textarea class="form-input" id="trab-instrucciones" rows="5">' + (t.instrucciones_detalladas||'') + '</textarea></div>' +
        '<div class="form-group"><label style="color:#8A9E8A;display:block;margin-bottom:5px;">Archivo de referencia (PDF)</label><input type="file" class="form-input" id="trab-file" accept=".pdf,.doc,.docx"></div>' +
        (t.archivo_referencia_url ? '<p style="color:#8A9E8A;font-size:0.85rem;">Archivo actual: <a href="' + t.archivo_referencia_url + '" target="_blank" style="color:#C9A84C;">Ver</a></p>' : '') +
        '<div style="display:flex;gap:10px;margin-top:1.5rem;"><button type="submit" class="btn-primary" style="flex:1;" id="btn-save-trab">💾 ' + (isEdit ? 'Guardar' : 'Crear') + '</button></div></form>';

    document.getElementById('form-trabajo').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-save-trab');
        btn.disabled = true; btn.textContent = 'Guardando...';
        let archivoUrl = t.archivo_referencia_url || null;
        const file = document.getElementById('trab-file').files[0];
        if (file) {
            const path = 'trabajos-ref/' + moduloId + '/' + Date.now() + '_' + file.name;
            const { error: ue } = await _s.storage.from('contenido-modulos').upload(path, file);
            if (!ue) archivoUrl = _s.storage.from('contenido-modulos').getPublicUrl(path).data.publicUrl;
        }
        const payload = { modulo_id: moduloId, titulo: document.getElementById('trab-titulo').value.trim(), descripcion: document.getElementById('trab-desc').value.trim(), instrucciones_detalladas: document.getElementById('trab-instrucciones').value, archivo_referencia_url: archivoUrl, activo: true };
        try {
            if (isEdit) { const { error } = await _s.from('trabajos_modulo').update(payload).eq('id', t.id); if (error) throw error; }
            else { const { error } = await _s.from('trabajos_modulo').insert(payload); if (error) throw error; }
            showToast(isEdit ? 'Trabajo actualizado' : 'Trabajo creado');
            seleccionarModulo(moduloId);
        } catch(err) { showToast('Error: ' + err.message, true); btn.disabled = false; btn.textContent = 'Guardar'; }
    });
}

async function eliminarTrabajo(id) {
    if (!confirm('¿Eliminar este trabajo?')) return;
    const { error } = await _s.from('trabajos_modulo').delete().eq('id', id);
    if (error) showToast('Error: ' + error.message, true);
    else { showToast('Trabajo eliminado'); if (currentModuloId) seleccionarModulo(currentModuloId); }
}

// ── ENTREGAS ──
async function cargarEntregas(trabajoId) {
    const c = document.getElementById('entregas-container');
    if (!c) return;
    try {
        const { data: entregas, error } = await _s.from('entregas_trabajo').select('*, usuarios(nombre, email)').eq('trabajo_id', trabajoId).order('entregado_at', {ascending: false});
        if (error) throw error;
        if (!entregas || entregas.length === 0) { c.innerHTML = '<div style="color:#8A9E8A;text-align:center;padding:2rem;">No hay entregas aún.</div>'; return; }
        let html = '<table style="width:100%;border-collapse:collapse;"><thead><tr style="border-bottom:1px solid rgba(201,168,76,0.2);">';
        ['Alumno','Fecha','Archivo','Estado','Nota','Acciones'].forEach(h => html += '<th style="padding:10px;text-align:left;color:#C9A84C;font-family:var(--font-heading);">' + h + '</th>');
        html += '</tr></thead><tbody>';
        entregas.forEach(e => {
            const colors = { entregado:'#4A9EFF', aprobado:'#4CAF50', rechazado:'#FF5252' };
            const col = colors[e.estado] || '#888';
            html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">' +
                '<td style="padding:10px;color:#F5F0E8;">' + (e.usuarios?.nombre||'N/A') + '</td>' +
                '<td style="padding:10px;color:#8A9E8A;">' + new Date(e.entregado_at).toLocaleDateString() + '</td>' +
                '<td style="padding:10px;">' + (e.archivo_url ? '<a href="' + e.archivo_url + '" target="_blank" style="color:#C9A84C;">📄 Ver</a>' : '-') + '</td>' +
                '<td style="padding:10px;"><span style="background:' + col + '22;color:' + col + ';padding:3px 10px;border-radius:12px;font-size:0.82rem;">' + e.estado + '</span></td>' +
                '<td style="padding:10px;"><input type="number" step="0.1" value="' + (e.calificacion||'') + '" id="cal-' + e.id + '" style="width:60px;background:rgba(255,255,255,0.05);border:1px solid rgba(201,168,76,0.3);color:white;padding:4px;border-radius:4px;"></td>' +
                '<td style="padding:10px;"><div style="display:flex;gap:5px;">' +
                '<button style="background:#C9A84C;color:#0A0F0A;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.8rem;" onclick="gestionarEntrega(\'' + e.id + '\',\'' + e.alumno_id + '\',true)">Aprobar</button>' +
                '<button style="background:#ff5252;color:white;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.8rem;" onclick="gestionarEntrega(\'' + e.id + '\',\'' + e.alumno_id + '\',false)">Devolver</button>' +
                '</div></td></tr>';
        });
        html += '</tbody></table>';
        c.innerHTML = html;
    } catch(e) { c.innerHTML = '<div style="color:#ff6b6b;">Error: ' + e.message + '</div>'; }
}

async function gestionarEntrega(entregaId, alumnoId, esAprobado) {
    const cal = document.getElementById('cal-' + entregaId)?.value;
    const retro = prompt((esAprobado ? 'Aprobación' : 'Devolución') + ' - Retroalimentación:');
    if (retro === null) return;
    const upd = { estado: esAprobado ? 'aprobado' : 'rechazado', retroalimentacion: retro, calificacion: cal || null, revisado_at: new Date().toISOString() };
    if (esAprobado) upd.modulo_completado = true;
    const { error } = await _s.from('entregas_trabajo').update(upd).eq('id', entregaId);
    if (error) showToast('Error: ' + error.message, true);
    else { showToast(esAprobado ? 'Aprobado' : 'Devuelto'); if (currentModuloId) seleccionarModulo(currentModuloId); }
}
