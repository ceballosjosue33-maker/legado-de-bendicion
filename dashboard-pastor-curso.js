// dashboard-pastor-curso.js
let currentModuloId = null;

document.addEventListener('DOMContentLoaded', () => {
    cargarArbolCurso();
    
    // Listeners para botones globales
    document.getElementById('btn-refresh-course')?.addEventListener('click', cargarArbolCurso);
    document.getElementById('btn-add-level')?.addEventListener('click', () => renderLevelForm());
});

// FUNCIÓN 1 — cargarArbolCurso()
async function cargarArbolCurso() {
    const treeContainer = document.getElementById('course-tree');
    if(!treeContainer) return;

    treeContainer.innerHTML = '<div class="loading-spinner">Cargando estructura...</div>';

    try {
        const { data: niveles, error: errN } = await _s.from('niveles_curso').select('*, modulos:modulos_curso(*)').order('orden');
        if(errN) throw errN;

        treeContainer.innerHTML = '';
        
        for (const nivel of niveles) {
            const nivelEl = document.createElement('div');
            nivelEl.className = 'tree-level';
            nivelEl.innerHTML = `
                <div class="tree-node level-node" onclick="renderLevelForm(${JSON.stringify(nivel).replace(/"/g, '&quot;')})">
                    <span>${nivel.titulo}</span>
                    <span class="badge-gold">${nivel.modulos?.length || 0} Módulos</span>
                </div>
                <div class="tree-children"></div>
            `;

            const childrenContainer = nivelEl.querySelector('.tree-children');
            
            for (const modulo of nivel.modulos || []) {
                const { count: countFiles } = await _s.from('archivos_leccion').select('*', { count: 'exact', head: true }).in('leccion_id', 
                    (await _s.from('lecciones').select('id').eq('modulo_id', modulo.id)).data?.map(l => l.id) || []
                );
                const { data: trabajo } = await _s.from('trabajos_modulo').select('*').eq('modulo_id', modulo.id).single();
                
                const moduloEl = document.createElement('div');
                moduloEl.className = 'tree-node modulo-node';
                moduloEl.innerHTML = `
                    <span style="display:flex; align-items:center; gap:5px;">📂 ${modulo.titulo} <span id="badge-entregas-${trabajo?.id || ''}"></span></span>
                    <div class="node-badges">
                        <span class="badge-subtle">📄 ${countFiles || 0}</span>
                        <span class="badge-subtle">✅ ${trabajo ? 1 : 0}</span>
                    </div>
                `;
                moduloEl.onclick = (e) => {
                    e.stopPropagation();
                    seleccionarModulo(modulo.id);
                };
                childrenContainer.appendChild(moduloEl);

                if(trabajo) {
                    renderBadgeEntregas(trabajo.id, moduloEl.querySelector(`#badge-entregas-${trabajo.id}`));
                }
            }
            treeContainer.appendChild(nivelEl);
        }
    } catch (e) {
        console.error(e);
        treeContainer.innerHTML = '<div class="error">Error al cargar el árbol</div>';
    }
}

// FUNCIÓN 2 — seleccionarModulo(moduloId)
async function seleccionarModulo(moduloId) {
    currentModuloId = moduloId;
    const panel = document.getElementById('course-editor-panel');
    panel.innerHTML = '<div class="loading">Cargando módulo...</div>';

    const { data: modulo } = await _s.from('modulos_curso').select('*').eq('id', moduloId).single();
    const { data: lecciones } = await _s.from('lecciones').select('*, archivos_leccion(*)').eq('modulo_id', moduloId).order('orden');
    const { data: trabajo } = await _s.from('trabajos_modulo').select('*').eq('modulo_id', moduloId).single();

    panel.innerHTML = `
        <div class="modulo-header">
            <h2>${modulo.titulo}</h2>
            <div class="tabs">
                <button class="tab-btn active" onclick="switchTab('tab-lecciones')">Lecciones</button>
                <button class="tab-btn" onclick="switchTab('tab-trabajos')">Trabajos</button>
            </div>
        </div>

        <div id="tab-lecciones" class="tab-content active">
            <div class="actions-row">
                <button class="btn-primary btn-small" onclick="renderLessonForm('${moduloId}')">+ Nueva Lección</button>
            </div>
            <div class="lecciones-list mt-2">
                ${lecciones.map(l => `
                    <div class="leccion-card">
                        <div class="flex-between">
                            <h4>${l.orden}. ${l.titulo}</h4>
                            <button class="btn-outline-gold btn-xs" onclick="renderLessonForm('${moduloId}', ${JSON.stringify(l).replace(/"/g, '&quot;')})">Editar</button>
                        </div>
                        <div class="file-upload-zone" ondrop="dropFile(event, '${l.id}')" ondragover="allowDrop(event)">
                            <p>Arrastra archivos aquí para subir a la lección</p>
                            <input type="file" onchange="subirArchivoLeccion('${l.id}', this.files[0])" style="display:none" id="file-${l.id}">
                            <button class="btn-xs" onclick="document.getElementById('file-${l.id}').click()">Seleccionar Archivo</button>
                        </div>
                        <div class="progress-bar" id="progress-${l.id}"><div class="progress-fill"></div></div>
                        <ul class="files-list">
                            ${l.archivos_leccion?.map(f => `<li>📎 <a href="${f.archivo_url}" target="_blank">${f.nombre}</a></li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        </div>

        <div id="tab-trabajos" class="tab-content">
            ${trabajo ? `
                <div class="trabajo-info">
                    <h3>${trabajo.titulo}</h3>
                    <p>${trabajo.descripcion}</p>
                    <div style="display:flex; gap:10px; margin-top:15px;">
                        <button class="btn-primary" onclick="verEntregasDeModulo('${trabajo.id}', '${trabajo.titulo}')">Ver Entregas</button>
                        <button class="btn-outline-gold" onclick="renderTrabajoForm('${moduloId}', ${JSON.stringify(trabajo).replace(/"/g, '&quot;')})">Editar Trabajo</button>
                    </div>
                </div>
            ` : `
                <div class="empty-state">
                    <p>No hay trabajos asignados a este módulo.</p>
                    <button class="btn-primary" onclick="renderTrabajoForm('${moduloId}')">Crear Trabajo</button>
                </div>
            `}
        </div>
    `;
}

// FUNCIONES DE GESTIÓN DE ENTREGAS
async function verEntregasDeModulo(trabajoId, tituloTrabajo) {
    const { data: entregas, error } = await _s
        .from('entregas_trabajo')
        .select('*, usuarios(nombre, email)')
        .eq('trabajo_id', trabajoId)
        .order('entregado_at', {ascending: false});

    if(error) return alert(error.message);

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'modal-entregas';
    modal.innerHTML = `
        <div class="modal-content-large" style="max-width:1100px;">
            <div class="flex-between mb-2">
                <div>
                    <h3 style="color:var(--color-primary); font-family:var(--font-heading); font-size:1.8rem;">Entregas: ${tituloTrabajo}</h3>
                    <p class="text-secondary">Revisa y califica los trabajos de los alumnos.</p>
                </div>
                <button class="btn-close-modal" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Alumno</th>
                            <th>Fecha Entrega</th>
                            <th>Archivo</th>
                            <th>Estado</th>
                            <th>Calificación</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${entregas.length === 0 ? '<tr><td colspan="6" class="text-center py-4">No hay entregas registradas.</td></tr>' : ''}
                        ${entregas.map(e => `
                            <tr>
                                <td>
                                    <strong>${e.usuarios.nombre}</strong><br>
                                    <small class="text-secondary">${e.usuarios.email}</small>
                                </td>
                                <td>${new Date(e.entregado_at).toLocaleDateString()}</td>
                                <td>
                                    ${e.archivo_url ? `<a href="${e.archivo_url}" target="_blank" class="text-gold">📄 Ver Trabajo</a>` : '<span class="text-secondary">Sin archivo</span>'}
                                </td>
                                <td><span class="badge ${e.estado}">${e.estado}</span></td>
                                <td>
                                    <input type="number" step="0.1" value="${e.calificacion || ''}" id="cal-${e.id}" class="table-input" style="width:60px;">
                                </td>
                                <td style="display:flex; gap:5px;">
                                    <button class="btn-xs btn-primary" onclick="gestionarEntrega('${e.id}', '${e.alumno_id}', true)">Aprobar</button>
                                    <button class="btn-xs btn-secondary" style="background:#ff5252; color:white;" onclick="gestionarEntrega('${e.id}', '${e.alumno_id}', false)">Devolver</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function gestionarEntrega(entregaId, alumnoId, esAprobado) {
    const cal = document.getElementById(`cal-${entregaId}`).value;
    const retro = prompt(`Retroalimentación para el alumno (${esAprobado ? 'Aprobación' : 'Devolución'}):`);
    if(retro === null) return;

    if(esAprobado) {
        const { error } = await _s.from('entregas_trabajo').update({
            estado: 'aprobado',
            modulo_completado: true,
            retroalimentacion: retro,
            calificacion: cal,
            revisado_at: new Date().toISOString()
        }).eq('id', entregaId);
        
        if(error) alert(error.message);
        else {
            alert("✅ Módulo aprobado. El progreso del alumno se ha actualizado.");
            location.reload();
        }
    } else {
        const { error } = await _s.from('entregas_trabajo').update({
            estado: 'rechazado',
            retroalimentacion: retro,
            revisado_at: new Date().toISOString()
        }).eq('id', entregaId);
        
        if(error) alert(error.message);
        else {
            alert("↩️ Trabajo devuelto al alumno.");
            location.reload();
        }
    }
}

async function renderBadgeEntregas(trabajoId, container) {
    if(!container) return;
    const { count } = await _s.from('entregas_trabajo')
        .select('*', { count: 'exact', head: true })
        .eq('trabajo_id', trabajoId)
        .eq('estado', 'entregado');
    
    if(count > 0) {
        container.innerHTML = `<span class="badge-pending" title="Entregas sin revisar">${count}</span>`;
    }
}

// RESTO DE FUNCIONES (Niveles, Lecciones, etc. - Mantenidas de la versión anterior)
async function subirArchivoLeccion(leccionId, file) {
    if(!file) return;
    const progressBar = document.querySelector(`#progress-${leccionId}`);
    const progressFill = progressBar.querySelector('.progress-fill');
    progressBar.style.display = 'block';
    
    const path = `contenido-modulos/${leccionId}/${Date.now()}_${file.name}`;
    const { data, error } = await _s.storage.from('contenido-modulos').upload(path, file);
    
    if(error) alert(error.message);
    else {
        const url = _s.storage.from('contenido-modulos').getPublicUrl(path).data.publicUrl;
        await _s.from('archivos_leccion').insert({
            leccion_id: leccionId,
            nombre: file.name,
            archivo_url: url,
            tipo: file.type,
            tamano_kb: Math.round(file.size / 1024)
        });
        seleccionarModulo(currentModuloId);
    }
    progressBar.style.display = 'none';
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

function allowDrop(e) { e.preventDefault(); }
function dropFile(e, leccionId) {
    e.preventDefault();
    subirArchivoLeccion(leccionId, e.dataTransfer.files[0]);
}

// (Otras funciones de formularios omitidas por brevedad pero deben estar en el archivo final)
// renderLevelForm, renderModuleForm, renderLessonForm, renderTrabajoForm...
