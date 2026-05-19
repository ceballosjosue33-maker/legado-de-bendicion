// dashboard-miembro-curso.js
// Plataforma de Estudio - Vista de Miembro

let lmsData = { niveles: [], modulos: [], lecciones: [], progresoLec: [], progresoMod: [] };
let currentUserLMS = null;

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initLMS, 1000);
});

async function initLMS() {
    const { data: { session } } = await _s.auth.getSession();
    if (!session) return;
    currentUserLMS = session.user.id;
    await fetchLMSData();
    renderLMSHome();
}

async function fetchLMSData() {
    const [
        {data: n}, {data: m}, {data: l}, {data: pl}, {data: pm}
    ] = await Promise.all([
        _s.from('niveles_curso').select('*').eq('activo', true).order('orden', {ascending: true}),
        _s.from('modulos_curso').select('*').eq('activo', true).order('orden', {ascending: true}),
        _s.from('lecciones').select('*').eq('activo', true).order('orden', {ascending: true}),
        _s.from('progreso_leccion').select('*').eq('usuario_id', currentUserLMS),
        _s.from('progreso_modulo').select('*').eq('usuario_id', currentUserLMS)
    ]);
    lmsData.niveles = n || [];
    lmsData.modulos = m || [];
    lmsData.lecciones = l || [];
    lmsData.progresoLec = pl || [];
    lmsData.progresoMod = pm || [];
    
    // Update summary view in dashboard-miembro.html if it exists
    updateDashboardSummary();
}

function updateDashboardSummary() {
    const totalMods = lmsData.modulos.length;
    const comps = lmsData.progresoMod.filter(p => p.completado).length;
    const pct = totalMods > 0 ? Math.round((comps / totalMods) * 100) : 0;
    
    const kpiCompleted = document.getElementById('kpi-completed');
    const kpiTotal = document.getElementById('kpi-total');
    const coursePercent = document.getElementById('course-percent');
    const courseFill = document.getElementById('course-fill');
    
    if (kpiCompleted) kpiCompleted.textContent = comps;
    if (kpiTotal) kpiTotal.textContent = totalMods;
    if (coursePercent) coursePercent.textContent = pct + '%';
    if (courseFill) courseFill.style.width = pct + '%';
}

function renderLMSHome() {
    const root = document.getElementById('lms-app-root');
    if (!root) return;

    if (lmsData.niveles.length === 0) {
        root.innerHTML = `<div class="text-center text-secondary py-4">Próximamente... el curso está en preparación.</div>`;
        return;
    }

    let html = `
        <div style="background: linear-gradient(135deg, rgba(201,168,76,0.1), transparent); border: 1px solid var(--border-color); border-radius: 12px; padding: 2rem; margin-bottom: 2rem; position: relative; overflow: hidden;">
            <div style="position: relative; z-index: 2;">
                <h1 style="color: var(--color-primary); font-family: var(--font-heading); font-size: 2.5rem; margin-bottom: 0.5rem;">Escuela de Liderazgo</h1>
                <p style="color: var(--text-secondary); max-width: 600px; margin-bottom: 1.5rem; font-size: 1.1rem;">Fórmate y crece en tu propósito. Sigue la ruta de aprendizaje a tu propio ritmo.</p>
                <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 15px; display: inline-block;">
                    <span style="color: var(--text-main); font-weight: bold;">Tu Progreso General:</span>
                    <span style="color: var(--color-primary); font-size: 1.2rem; margin-left: 10px;">${calculateGlobalProgress()}%</span>
                </div>
            </div>
            <div style="position: absolute; right: -20px; top: -50px; font-size: 15rem; opacity: 0.05;">🎓</div>
        </div>

        <h3 class="section-heading mb-3" style="font-size: 1.8rem;">Ruta de Aprendizaje</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
    `;

    let previoCompletado = true;
    lmsData.niveles.forEach((nivel, idx) => {
        const mods = lmsData.modulos.filter(m => m.nivel_id === nivel.id);
        const modsIds = mods.map(m => m.id);
        const pm = lmsData.progresoMod.filter(p => modsIds.includes(p.modulo_id) && p.completado);
        const isCompleted = mods.length > 0 && pm.length === mods.length;
        const progressPct = mods.length > 0 ? Math.round((pm.length / mods.length) * 100) : 0;
        
        const isLocked = !previoCompletado;
        
        html += `
            <div class="kpi-card" style="flex-direction: column; align-items: flex-start; padding: 0; overflow: hidden; opacity: ${isLocked ? '0.5' : '1'}; position: relative; cursor: ${isLocked ? 'not-allowed' : 'pointer'}; transition: transform 0.3s;" ${!isLocked ? `onclick="renderLevelView('${nivel.id}')"` : ''}>
                ${isLocked ? `<div style="position:absolute;top:10px;right:10px;background:rgba(0,0,0,0.8);padding:5px 10px;border-radius:20px;color:#fff;font-size:0.8rem;">🔒 Bloqueado</div>` : ''}
                ${isCompleted ? `<div style="position:absolute;top:10px;right:10px;background:#C9A84C;padding:5px 10px;border-radius:20px;color:#0A0F0A;font-size:0.8rem;font-weight:bold;">🏆 Completado</div>` : ''}
                
                <div style="height: 140px; width: 100%; background: #1A3A1A url('${nivel.imagen_url || ''}') center/cover; border-bottom: 1px solid var(--border-color);"></div>
                <div style="padding: 1.5rem; width: 100%; box-sizing: border-box;">
                    <h4 style="font-family: var(--font-heading); font-size: 1.5rem; color: var(--color-primary); margin-bottom: 0.5rem;">Nivel ${nivel.orden}: ${nivel.titulo}</h4>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1rem; line-height: 1.4; height: 40px; overflow: hidden;">${nivel.descripcion || 'Sin descripción'}</p>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-main); margin-bottom: 5px;">
                        <span>${mods.length} Módulos</span>
                        <span>${progressPct}%</span>
                    </div>
                    <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                        <div style="width: ${progressPct}%; height: 100%; background: var(--color-primary);"></div>
                    </div>
                </div>
            </div>
        `;
        
        if (!isCompleted) previoCompletado = false;
    });

    html += `</div>`;
    root.innerHTML = html;
}

function renderLevelView(nivelId) {
    const nivel = lmsData.niveles.find(n => n.id === nivelId);
    const mods = lmsData.modulos.filter(m => m.nivel_id === nivelId);
    const root = document.getElementById('lms-app-root');
    
    let html = `
        <button onclick="renderLMSHome()" class="btn-outline-gold btn-small mb-3">&larr; Volver a la Ruta</button>
        <div style="background: linear-gradient(to right, rgba(201,168,76,0.1), transparent); border: 1px solid var(--border-color); border-radius: 12px; padding: 2rem; margin-bottom: 2rem; display: flex; align-items: center; gap: 20px;">
            ${nivel.imagen_url ? `<img src="${nivel.imagen_url}" style="width: 120px; height: 120px; border-radius: 8px; object-fit: cover; border: 2px solid var(--color-primary);">` : `<div style="width: 120px; height: 120px; border-radius: 8px; background: #1A3A1A; display:flex; align-items:center; justify-content:center; font-size:3rem;">📚</div>`}
            <div>
                <h2 style="color: var(--color-primary); font-family: var(--font-heading); font-size: 2.2rem; margin-bottom: 0.5rem;">Nivel ${nivel.orden}: ${nivel.titulo}</h2>
                <p style="color: var(--text-secondary); max-width: 600px;">${nivel.descripcion || ''}</p>
            </div>
        </div>
        <h3 class="section-heading mb-3">Módulos de este Nivel</h3>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
    `;

    let prevModCompleted = true;
    mods.forEach(m => {
        const lecs = lmsData.lecciones.filter(l => l.modulo_id === m.id);
        const lecsIds = lecs.map(l => l.id);
        const pm = lmsData.progresoMod.find(p => p.modulo_id === m.id);
        const pl = lmsData.progresoLec.filter(p => lecsIds.includes(p.leccion_id) && p.completada);
        const isCompleted = pm && pm.completado;
        const pct = lecs.length > 0 ? Math.round((pl.length / lecs.length) * 100) : 0;
        
        const isLocked = !prevModCompleted;

        html += `
            <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 8px; padding: 1.5rem; display: flex; align-items: center; justify-content: space-between; opacity: ${isLocked ? '0.5' : '1'}; transition: background 0.3s;" ${!isLocked ? `onmouseover="this.style.background='rgba(201,168,76,0.05)'" onmouseout="this.style.background='rgba(255,255,255,0.02)'"` : ''}>
                <div style="display: flex; gap: 20px; align-items: center; flex: 1;">
                    <div style="width: 60px; height: 60px; border-radius: 50%; background: ${isCompleted ? '#C9A84C' : '#1A3A1A'}; color: ${isCompleted ? '#0A0F0A' : '#C9A84C'}; display: flex; justify-content: center; align-items: center; font-size: 1.5rem; font-weight: bold;">
                        ${isCompleted ? '✓' : m.orden}
                    </div>
                    <div>
                        <h4 style="font-size: 1.2rem; color: #F5F0E8; margin-bottom: 5px;">${m.titulo}</h4>
                        <div style="color: var(--text-secondary); font-size: 0.85rem; display: flex; gap: 15px;">
                            <span>⏱ ${m.duracion_estimada || '1 hr'}</span>
                            <span>📖 ${lecs.length} lecciones</span>
                        </div>
                    </div>
                </div>
                <div style="width: 200px; display: flex; flex-direction: column; align-items: flex-end; gap: 10px;">
                    ${isLocked ? 
                        `<span style="color:#ff6b6b;font-size:0.9rem;">🔒 Bloqueado</span>` : 
                        `<button class="btn-primary" onclick="openModuleViewer('${m.id}')">${isCompleted ? 'Repasar Módulo' : (pct > 0 ? 'Continuar Módulo' : 'Iniciar Módulo')}</button>`
                    }
                    <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                        <div style="width: ${pct}%; height: 100%; background: var(--color-primary);"></div>
                    </div>
                </div>
            </div>
        `;
        if(!isCompleted) prevModCompleted = false;
    });

    html += `</div>`;
    root.innerHTML = html;
}

// ── VIEWER Y LECCIONES ──
let currentLessons = [];
let currentLessonIndex = 0;
let lessonTimer = null;
let secondsInLesson = 0;

function openModuleViewer(moduloId) {
    const mod = lmsData.modulos.find(m => m.id === moduloId);
    currentLessons = lmsData.lecciones.filter(l => l.modulo_id === moduloId);
    if(currentLessons.length === 0) { alert('Este módulo aún no tiene lecciones.'); return; }
    
    let startIndex = 0;
    for(let i=0; i<currentLessons.length; i++) {
        if(!lmsData.progresoLec.find(p => p.leccion_id === currentLessons[i].id && p.completada)) {
            startIndex = i; break;
        }
    }
    
    document.getElementById('lms-viewer-breadcrumb').innerHTML = `<strong>${mod.titulo}</strong>`;
    document.getElementById('modal-lms-viewer').classList.add('active');
    
    loadLesson(startIndex);
}

function loadLesson(index) {
    if(index < 0 || index >= currentLessons.length) return;
    currentLessonIndex = index;
    const lec = currentLessons[index];
    
    const sb = document.getElementById('lms-lessons-list');
    sb.innerHTML = '';
    currentLessons.forEach((l, i) => {
        const isComp = lmsData.progresoLec.find(p => p.leccion_id === l.id && p.completada);
        const div = document.createElement('div');
        div.style.cssText = `padding:10px; border-radius:6px; margin-bottom:5px; cursor:pointer; font-size:0.9rem; display:flex; gap:10px; align-items:center; transition:background 0.2s; ${i === index ? 'background:rgba(201,168,76,0.15); border-left:3px solid #C9A84C;' : 'color:var(--text-secondary);'}`;
        div.innerHTML = `<span style="color:${isComp ? '#8ade8a' : 'inherit'}">${isComp ? '✓' : '○'}</span> <span>${i+1}. ${l.titulo}</span>`;
        div.onclick = () => loadLesson(i);
        sb.appendChild(div);
    });

    const mc = document.getElementById('lms-main-content');
    let videoHtml = '';
    if(lec.video_url) {
        let embed = lec.video_url;
        if(embed.includes('youtube.com/watch?v=')) embed = embed.replace('watch?v=', 'embed/');
        else if(embed.includes('youtu.be/')) embed = embed.replace('youtu.be/', 'youtube.com/embed/');
        videoHtml = `<div style="position:relative; padding-bottom:56.25%; height:0; margin-bottom:2rem; border-radius:8px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
            <iframe src="${embed}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:none;" allowfullscreen></iframe>
        </div>`;
    }

    mc.innerHTML = `
        <h1 style="color: var(--color-primary); font-family: var(--font-heading); font-size: 2.5rem; margin-bottom: 1.5rem;">${lec.titulo}</h1>
        ${videoHtml}
        <div style="font-size:1.05rem; line-height:1.6; color:#F5F0E8;" class="quill-content-render">
            ${lec.contenido_texto || ''}
        </div>
    `;

    const btnPrev = document.getElementById('btn-lms-prev');
    const btnNext = document.getElementById('btn-lms-next');
    const btnComp = document.getElementById('btn-lms-complete');
    const msgTimer = document.getElementById('lms-timer-msg');

    btnPrev.style.visibility = index > 0 ? 'visible' : 'hidden';
    btnNext.style.visibility = index < currentLessons.length - 1 ? 'visible' : 'hidden';
    
    btnPrev.onclick = () => loadLesson(index - 1);
    btnNext.onclick = () => loadLesson(index + 1);

    const isComp = lmsData.progresoLec.find(p => p.leccion_id === lec.id && p.completada);
    if(isComp) {
        btnComp.style.display = 'block';
        btnComp.textContent = 'Lección Completada ✓';
        btnComp.className = 'btn-secondary';
        btnComp.disabled = true;
        msgTimer.style.display = 'none';
    } else {
        btnComp.style.display = 'none';
        btnComp.textContent = 'Marcar como Completada ✓';
        btnComp.className = 'btn-primary-solid';
        btnComp.disabled = false;
        msgTimer.style.display = 'block';
        
        clearInterval(lessonTimer);
        secondsInLesson = 0;
        lessonTimer = setInterval(() => {
            secondsInLesson++;
            if(secondsInLesson >= 5) {
                clearInterval(lessonTimer);
                msgTimer.style.display = 'none';
                btnComp.style.display = 'block';
            }
        }, 1000);
    }

    btnComp.onclick = async () => {
        btnComp.disabled = true; btnComp.textContent = 'Guardando...';
        await _s.from('progreso_leccion').upsert({
            usuario_id: currentUserLMS,
            leccion_id: lec.id,
            completada: true,
            fecha_completada: new Date().toISOString()
        });
        await fetchLMSData();
        
        // Check if there's a work/task for this module
        const { data: trabajo } = await _s.from('trabajos_modulo').select('*').eq('modulo_id', lec.modulo_id).single();

        if(index < currentLessons.length - 1) {
            loadLesson(index + 1);
        } else if (trabajo) {
            // All lessons done, show work section
            renderModuloTrabajoSection(lec.modulo_id, trabajo);
        } else {
            // No work, complete module
            await _s.from('progreso_modulo').upsert({
                usuario_id: currentUserLMS, modulo_id: lec.modulo_id, completado: true, porcentaje: 100, fecha_completado: new Date().toISOString()
            });
            await fetchLMSData();
            document.getElementById('modal-lms-viewer').classList.remove('active');
            renderLevelView(lmsData.modulos.find(m => m.id === lec.modulo_id).nivel_id);
            alert('¡Módulo completado con éxito! 🎉');
        }
    };
}

async function renderModuloTrabajoSection(moduloId, trabajo) {
    const mc = document.getElementById('lms-main-content');
    const { data: entrega } = await _s.from('entregas_trabajo').select('*').eq('trabajo_id', trabajo.id).eq('alumno_id', currentUserLMS).single();
    
    const estado = entrega ? entrega.estado : 'pendiente_entrega';
    const badges = {
        'pendiente_entrega': '<span class="badge" style="background:rgba(136,136,136,0.1);color:#888">📝 Pendiente de Entrega</span>',
        'entregado': '<span class="badge" style="background:rgba(74,158,255,0.1);color:#4A9EFF">⏳ En Revisión</span>',
        'aprobado': '<span class="badge" style="background:rgba(76,175,80,0.15);color:#4CAF50">✅ Módulo Aprobado</span>',
        'rechazado': '<span class="badge" style="background:rgba(255,82,82,0.1);color:#FF5252">↩️ Requiere Cambios</span>'
    };

    mc.innerHTML = `
        <div class="trabajo-section" style="padding: 2rem; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid var(--border-color);">
            <div class="flex-between mb-2">
                <h2 style="color: var(--color-primary); font-family: var(--font-heading); font-size: 2rem;">📝 Trabajo Final: ${trabajo.titulo}</h2>
                ${badges[estado] || ''}
            </div>
            
            <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">${trabajo.descripcion}</p>
            
            <div style="background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
                <h4 style="color: var(--color-primary); margin-bottom: 10px;">Instrucciones</h4>
                <div style="color: #F5F0E8; line-height: 1.6;">${trabajo.instrucciones_detalladas}</div>
                ${trabajo.archivo_referencia_url ? `
                    <a href="${trabajo.archivo_referencia_url}" target="_blank" class="btn-outline-gold btn-small mt-2" style="display:inline-block; text-decoration:none;">📥 Descargar Material de Apoyo</a>
                ` : ''}
            </div>

            ${estado === 'aprobado' ? `
                <div style="text-align:center; padding: 2rem; background: rgba(76,175,80,0.1); border: 1px solid #4CAF50; border-radius: 8px;">
                    <span style="font-size: 3rem;">🎉</span>
                    <h3 style="color: #4CAF50; margin: 10px 0;">¡Excelente trabajo!</h3>
                    <p>Has completado este módulo con éxito. El pastor ha calificado tu entrega.</p>
                    ${entrega.retroalimentacion ? `<p style="font-style:italic; margin-top:10px;">"${entrega.retroalimentacion}"</p>` : ''}
                </div>
            ` : `
                <form id="form-entrega" style="display: ${estado === 'entregado' ? 'none' : 'block'}">
                    <div class="form-group">
                        <label>Comentarios para el Pastor</label>
                        <textarea id="entrega-comentario" class="form-input" rows="3" placeholder="Describe brevemente tu entrega...">${entrega?.comentario || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Subir Trabajo (PDF, ZIP, DOCX - Máx 50MB)</label>
                        <input type="file" id="entrega-file" class="form-input" style="padding: 10px;">
                    </div>
                    <div id="upload-progress-container" style="display:none; margin-bottom: 1rem;">
                        <div style="width:100%; height:6px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden;">
                            <div id="upload-progress-fill" style="width:0%; height:100%; background:linear-gradient(90deg, #C9A84C, #E8C96C); transition:width 0.3s;"></div>
                        </div>
                        <small id="upload-status" style="color:var(--color-primary);">Subiendo archivo...</small>
                    </div>
                    <button type="submit" class="btn-primary-solid" style="width:100%">${estado === 'rechazado' ? 'Reenviar Trabajo' : '📤 Enviar Trabajo Final'}</button>
                    ${estado === 'rechazado' ? `
                        <div style="margin-top:1rem; padding:1rem; background:rgba(255,82,82,0.1); border-left:4px solid #FF5252; color:#FF5252;">
                            <strong>Motivo de devolución:</strong> ${entrega.retroalimentacion}
                        </div>
                    ` : ''}
                </form>
                ${estado === 'entregado' ? `<div style="text-align:center; color:var(--text-secondary);">Tu trabajo ha sido enviado y está esperando revisión.</div>` : ''}
            `}
        </div>
    `;

    document.getElementById('form-entrega')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = document.getElementById('entrega-file').files[0];
        const comentario = document.getElementById('entrega-comentario').value;
        if(!file && estado !== 'rechazado') return alert('Por favor selecciona un archivo');
        
        await entregarTrabajo(trabajo.id, moduloId, file, comentario);
    });
}

async function entregarTrabajo(trabajoId, moduloId, file, comentario) {
    const progressFill = document.getElementById('upload-progress-fill');
    const container = document.getElementById('upload-progress-container');
    if(container) container.style.display = 'block';

    let archivoUrl = null;
    let storagePath = null;

    if(file) {
        const path = `${trabajoId}/${currentUserLMS}/${Date.now()}_${file.name}`;
        const { data, error } = await _s.storage.from('entregas-alumnos').upload(path, file);
        if(error) return alert('Error subiendo archivo: ' + error.message);
        storagePath = path;
        archivoUrl = _s.storage.from('entregas-alumnos').getPublicUrl(path).data.publicUrl;
    }

    const { error: dbErr } = await _s.from('entregas_trabajo').upsert({
        trabajo_id: trabajoId,
        alumno_id: currentUserLMS,
        archivo_url: archivoUrl,
        storage_path: storagePath,
        comentario: comentario,
        estado: 'entregado',
        entregado_at: new Date().toISOString()
    });

    if(dbErr) alert(dbErr.message);
    else {
        alert('✅ Trabajo entregado correctamente.');
        location.reload();
    }
}

document.getElementById('btn-close-lms')?.addEventListener('click', () => {
    document.getElementById('modal-lms-viewer').classList.remove('active');
    clearInterval(lessonTimer);
});

function calculateGlobalProgress() {
    if(lmsData.modulos.length === 0) return 0;
    const comps = lmsData.progresoMod.filter(p => p.completado).length;
    return Math.round((comps / lmsData.modulos.length) * 100);
}
