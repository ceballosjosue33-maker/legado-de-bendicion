// dashboard-pastor-curso.js
let courseTreeData = [];

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-refresh-course')?.addEventListener('click', loadCourseTree);
    document.getElementById('btn-add-level')?.addEventListener('click', () => renderLevelForm());
    // Iniciar carga tras 1s para asegurar que supabase (_s) esté listo
    setTimeout(loadCourseTree, 1000);
});

async function loadCourseTree() {
    const tc = document.getElementById('course-tree');
    if(!tc) return;
    tc.innerHTML = '<div class="text-center text-secondary mt-2">Cargando...</div>';
    try {
        const [{data: niveles}, {data: modulos}, {data: lecciones}] = await Promise.all([
            _s.from('niveles_curso').select('*').order('orden', {ascending: true}),
            _s.from('modulos_curso').select('*').order('orden', {ascending: true}),
            _s.from('lecciones').select('*').order('orden', {ascending: true})
        ]);
        courseTreeData = (niveles || []).map(n => ({
            ...n, type: 'nivel',
            children: (modulos || []).filter(m => m.nivel_id === n.id).map(m => ({
                ...m, type: 'modulo',
                children: (lecciones || []).filter(l => l.modulo_id === m.id).map(l => ({...l, type: 'leccion'}))
            }))
        }));
        renderTree();
    } catch (e) { tc.innerHTML = `<div style="color:red">${e.message}</div>`; }
}

function renderTree() {
    const tc = document.getElementById('course-tree');
    tc.innerHTML = '';
    if(courseTreeData.length === 0) { tc.innerHTML = '<p class="text-secondary text-center">No hay niveles.</p>'; return; }

    courseTreeData.forEach(n => {
        const div = document.createElement('div'); div.style.marginBottom = '10px';
        const hn = document.createElement('div');
        hn.style.cssText = 'padding:8px;background:rgba(201,168,76,0.1);border-left:3px solid #C9A84C;border-radius:4px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;';
        hn.innerHTML = `<span><strong>Nivel ${n.orden}:</strong> ${n.titulo}</span> <button class="btn-small btn-outline-gold" style="padding:2px 5px;" onclick="event.stopPropagation(); renderModuleForm('${n.id}')">+ Mód</button>`;
        hn.onclick = () => renderLevelForm(n);
        
        const mc = document.createElement('div'); mc.style.paddingLeft = '15px';
        n.children.forEach(m => {
            const hm = document.createElement('div');
            hm.style.cssText = 'padding:6px;background:rgba(255,255,255,0.05);border-radius:4px;cursor:pointer;display:flex;justify-content:space-between;font-size:0.9rem;margin-bottom:3px;';
            hm.innerHTML = `<span>📂 <strong>Mód ${m.orden}:</strong> ${m.titulo}</span> <button class="btn-small btn-outline-gold" style="padding:2px 5px;" onclick="event.stopPropagation(); renderLessonForm('${m.id}')">+ Lec</button>`;
            hm.onclick = () => renderModuleForm(n.id, m);
            
            const lc = document.createElement('div'); lc.style.paddingLeft = '20px'; lc.style.marginBottom = '10px';
            m.children.forEach(l => {
                const hl = document.createElement('div');
                hl.style.cssText = 'padding:4px;cursor:pointer;font-size:0.85rem;color:#8A9E8A;';
                hl.innerHTML = `📄 Lec ${l.orden}: ${l.titulo}`;
                hl.onclick = () => renderLessonForm(m.id, l);
                lc.appendChild(hl);
            });
            mc.appendChild(hm); mc.appendChild(lc);
        });
        div.appendChild(hn); div.appendChild(mc); tc.appendChild(div);
    });
}

function clearEditor() {
    const panel = document.getElementById('course-editor-panel');
    panel.innerHTML = '';
    return panel;
}

// ── NIVELES ──
function renderLevelForm(nivel = null) {
    const p = clearEditor();
    const isNew = !nivel;
    p.innerHTML = `
        <h2 style="color:#C9A84C;margin-bottom:20px;font-family:var(--font-heading);">${isNew ? 'Nuevo Nivel' : 'Editar Nivel'}</h2>
        <form id="form-nivel">
            <div class="form-group"><label>Título</label><input type="text" class="form-input" id="nl-titulo" value="${nivel?.titulo||''}" required></div>
            <div class="form-group"><label>Descripción</label><textarea class="form-input" id="nl-desc" rows="3">${nivel?.descripcion||''}</textarea></div>
            <div class="form-group"><label>Orden</label><input type="number" class="form-input" id="nl-orden" value="${nivel?.orden||1}" required></div>
            <div class="form-group"><label>Imagen Portada URL (Opcional)</label><input type="text" class="form-input" id="nl-img" value="${nivel?.imagen_url||''}"></div>
            <div class="form-group"><label><input type="checkbox" id="nl-activo" ${isNew||nivel.activo?'checked':''}> Nivel Activo</label></div>
            <div style="display:flex;gap:10px;margin-top:20px;">
                <button type="submit" class="btn-primary">Guardar Nivel</button>
                ${!isNew ? `<button type="button" class="btn-secondary" style="background:#ff6b6b;color:#fff;border:none;" onclick="deleteRecord('niveles_curso', '${nivel.id}')">Eliminar</button>` : ''}
            </div>
        </form>
    `;
    document.getElementById('form-nivel').onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            titulo: document.getElementById('nl-titulo').value,
            descripcion: document.getElementById('nl-desc').value,
            orden: document.getElementById('nl-orden').value,
            imagen_url: document.getElementById('nl-img').value,
            activo: document.getElementById('nl-activo').checked
        };
        if(!isNew) payload.id = nivel.id;
        const btn = e.submitter; btn.disabled=true; btn.textContent='Guardando...';
        const {error} = await _s.from('niveles_curso')[isNew?'insert':'upsert'](payload);
        if(error) alert(error.message); else { loadCourseTree(); p.innerHTML='<p class="text-center" style="color:#8ade8a;margin-top:20px;">Guardado correctamente.</p>'; }
    };
}

// ── MODULOS ──
function renderModuleForm(nivelId, modulo = null) {
    const p = clearEditor();
    const isNew = !modulo;
    p.innerHTML = `
        <h2 style="color:#C9A84C;margin-bottom:20px;font-family:var(--font-heading);">${isNew ? 'Nuevo Módulo' : 'Editar Módulo'}</h2>
        <form id="form-modulo">
            <div class="form-group"><label>Título</label><input type="text" class="form-input" id="mo-titulo" value="${modulo?.titulo||''}" required></div>
            <div class="form-group"><label>Descripción</label><textarea class="form-input" id="mo-desc" rows="3">${modulo?.descripcion||''}</textarea></div>
            <div class="form-group"><label>Duración Estimada (Ej: "2 horas")</label><input type="text" class="form-input" id="mo-dur" value="${modulo?.duracion_estimada||''}"></div>
            <div class="form-group"><label>Orden</label><input type="number" class="form-input" id="mo-orden" value="${modulo?.orden||1}" required></div>
            <div class="form-group"><label>Imagen Portada URL</label><input type="text" class="form-input" id="mo-img" value="${modulo?.imagen_portada_url||''}"></div>
            <div class="form-group"><label><input type="checkbox" id="mo-activo" ${isNew||modulo.activo?'checked':''}> Módulo Activo</label></div>
            <div style="display:flex;gap:10px;margin-top:20px;">
                <button type="submit" class="btn-primary">Guardar Módulo</button>
                ${!isNew ? `<button type="button" class="btn-secondary" style="background:#ff6b6b;color:#fff;border:none;" onclick="deleteRecord('modulos_curso', '${modulo.id}')">Eliminar</button>` : ''}
            </div>
        </form>
    `;
    document.getElementById('form-modulo').onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            nivel_id: nivelId,
            titulo: document.getElementById('mo-titulo').value,
            descripcion: document.getElementById('mo-desc').value,
            duracion_estimada: document.getElementById('mo-dur').value,
            orden: document.getElementById('mo-orden').value,
            imagen_portada_url: document.getElementById('mo-img').value,
            activo: document.getElementById('mo-activo').checked
        };
        if(!isNew) payload.id = modulo.id;
        const btn = e.submitter; btn.disabled=true; btn.textContent='Guardando...';
        const {error} = await _s.from('modulos_curso')[isNew?'insert':'upsert'](payload);
        if(error) alert(error.message); else { loadCourseTree(); p.innerHTML='<p class="text-center" style="color:#8ade8a;margin-top:20px;">Guardado correctamente.</p>'; }
    };
}

// ── LECCIONES (con Quill) ──
function renderLessonForm(moduloId, leccion = null) {
    const p = clearEditor();
    const isNew = !leccion;
    p.innerHTML = `
        <h2 style="color:#C9A84C;margin-bottom:20px;font-family:var(--font-heading);">${isNew ? 'Nueva Lección' : 'Editar Lección'}</h2>
        <form id="form-leccion">
            <div class="form-group"><label>Título</label><input type="text" class="form-input" id="le-titulo" value="${leccion?.titulo||''}" required></div>
            <div class="form-group"><label>URL de Video (Youtube/Vimeo)</label><input type="text" class="form-input" id="le-vid" value="${leccion?.video_url||''}"></div>
            <div class="form-group"><label>Orden</label><input type="number" class="form-input" id="le-orden" value="${leccion?.orden||1}" required></div>
            <div class="form-group"><label>Contenido Enriquecido</label>
                <div id="editor-container" style="height:300px;background:#fff;color:#000;"></div>
            </div>
            <div class="form-group"><label><input type="checkbox" id="le-activo" ${isNew||leccion.activo?'checked':''}> Lección Activa</label></div>
            <div style="display:flex;gap:10px;margin-top:20px;">
                <button type="submit" class="btn-primary">Guardar Lección</button>
                ${!isNew ? `<button type="button" class="btn-secondary" style="background:#ff6b6b;color:#fff;border:none;" onclick="deleteRecord('lecciones', '${leccion.id}')">Eliminar</button>` : ''}
            </div>
        </form>
    `;
    
    const quill = new Quill('#editor-container', {
        theme: 'snow',
        modules: { toolbar: [
            [{ 'header': [2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'video', 'image'],
            ['clean']
        ]}
    });
    
    if(!isNew && leccion.contenido_texto) {
        quill.root.innerHTML = leccion.contenido_texto;
    }

    document.getElementById('form-leccion').onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            modulo_id: moduloId,
            titulo: document.getElementById('le-titulo').value,
            video_url: document.getElementById('le-vid').value,
            orden: document.getElementById('le-orden').value,
            contenido_texto: quill.root.innerHTML,
            activo: document.getElementById('le-activo').checked
        };
        if(!isNew) payload.id = leccion.id;
        const btn = e.submitter; btn.disabled=true; btn.textContent='Guardando...';
        const {error} = await _s.from('lecciones')[isNew?'insert':'upsert'](payload);
        if(error) alert(error.message); else { loadCourseTree(); p.innerHTML='<p class="text-center" style="color:#8ade8a;margin-top:20px;">Guardado correctamente.</p>'; }
    };
}

async function deleteRecord(table, id) {
    if(!confirm('¿Estás seguro de eliminar este registro y todo su contenido?')) return;
    const {error} = await _s.from(table).delete().eq('id', id);
    if(error) alert('Error: ' + error.message);
    else { alert('Eliminado correctamente.'); loadCourseTree(); clearEditor(); }
}
