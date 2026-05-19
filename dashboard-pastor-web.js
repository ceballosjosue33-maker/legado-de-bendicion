// dashboard-pastor-web.js — REFACTORED
// Fixes: usa window.sb, preview DOM, tabs funcionales, listas dinámicas
// NOTA: No declara _s localmente — usa window.sb directamente para evitar
// conflicto con la const _s de dashboard-pastor.js

let usuarioActual = null;
let currentTab = 'navbar';
let cmsData = {};
let listData = { horarios: [], eventos: [], sermones: [] };
let cmsInitialized = false;

// Expuesto globalmente para que setupNav() en dashboard-pastor.js lo llame
window.initCMS = async function() {
  if (cmsInitialized) {
    // Si ya se inicializó, solo re-renderizar la pestaña activa
    renderForma(currentTab);
    renderPreview(currentTab);
    return;
  }
  cmsInitialized = true;
  try {
    const { data: { session } } = await window.sb.auth.getSession();
    if (session) usuarioActual = session.user;
  } catch(e) {}
  setupCMSTabs();
  await cargarDatosCMS();
  renderForma(currentTab);
  renderPreview(currentTab);
};

// initCMS() ha sido reemplazada por window.initCMS() arriba

function setupCMSTabs() {
  const tabs = document.querySelectorAll('.cms-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.style.background = 'transparent';
        t.style.borderBottom = '2px solid transparent';
        t.style.color = '#8A9E8A';
        t.style.fontWeight = 'normal';
      });
      tab.classList.add('active');
      tab.style.background = '#1A3A1A';
      tab.style.borderBottom = '2px solid #C9A84C';
      tab.style.color = '#C9A84C';
      tab.style.fontWeight = 'bold';
      currentTab = tab.dataset.section;
      renderForma(currentTab);
      renderPreview(currentTab);
    });
  });
}

async function cargarDatosCMS() {
  try {
    const { data } = await window.sb.from('contenido_pagina').select('clave,valor_texto,valor_imagen_url');
    if (data) data.forEach(r => { cmsData[r.clave] = r.valor_imagen_url || r.valor_texto || ''; });
  } catch(e) { console.warn('CMS: no se pudieron cargar datos de contenido_pagina', e); }
  try {
    for (const t of ['horarios','eventos','sermones']) {
      const { data: rows } = await window.sb.from('cms_' + t).select('*').order('orden', { ascending: true });
      if (rows) listData[t] = rows;
    }
  } catch(e) { console.warn('CMS: tablas de listas no disponibles, usando estado local.', e); }
}

// ── Helpers ──────────────────────────────────────────
function g(k) { return (cmsData[k] || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function gRaw(k) { return cmsData[k] || ''; }

function fieldHTML(clave, label, type='text', rows=3) {
  const val = (cmsData[clave] || '').replace(/"/g, '&quot;');
  if (type === 'textarea') {
    return `<div class="cms-field">
      <label class="cms-label">${label}</label>
      <textarea class="form-input cms-input" data-input="${clave}" rows="${rows}"
        oninput="cmsOnInput()">${cmsData[clave] || ''}</textarea>
    </div>`;
  }
  return `<div class="cms-field">
    <label class="cms-label">${label}</label>
    <input type="text" class="form-input cms-input" data-input="${clave}" value="${val}" oninput="cmsOnInput()">
  </div>`;
}

function saveBtnHTML(tab) {
  return `<div class="cms-save-bar">
    <button class="btn-primary" style="width:100%;padding:0.9rem;font-size:1rem;"
      onclick="guardarSeccionCMS('${tab}',this)">💾 Guardar Cambios</button>
  </div>`;
}

// ── Formularios ───────────────────────────────────────
function renderForma(tab) {
  const area = document.getElementById('cms-forms-area');
  if (!area) return;
  const map = { navbar:formNavbar, hero:formHero, horarios:formHorarios,
                nosotros:formNosotros, eventos:formEventos, sermones:formSermones };
  area.innerHTML = map[tab] ? map[tab]() : '<p style="color:#8A9E8A;padding:2rem;">Sección no encontrada.</p>';
}

function formNavbar() {
  return `<h2 class="cms-form-title">🧭 Navbar</h2>
    ${fieldHTML('navbar-nombre','Nombre de la Iglesia')}
    ${fieldHTML('navbar-cta','Texto Botón CTA')}
    ${fieldHTML('navbar-logo','URL del Logo')}
    ${saveBtnHTML('navbar')}`;
}

function formHero() {
  return `<h2 class="cms-form-title">🏛️ Hero</h2>
    ${fieldHTML('hero-titulo1','Título Línea 1')}
    ${fieldHTML('hero-titulo2','Título Línea 2 (dorado)')}
    ${fieldHTML('hero-subtitulo','Subtítulo','textarea',2)}
    ${fieldHTML('hero-boton1','Botón Primario')}
    ${fieldHTML('hero-boton2','Botón Secundario')}
    ${fieldHTML('hero-versiculo','Versículo Decorativo')}
    ${fieldHTML('hero-fondo','URL Imagen de Fondo')}
    ${saveBtnHTML('hero')}`;
}

function formHorarios() {
  const rows = listData.horarios.map((h,i) => rowHorario(h,i)).join('');
  return `<h2 class="cms-form-title">🕐 Horarios de Culto</h2>
    <div id="list-horarios">${rows || '<p class="cms-empty">Sin servicios. Agrega uno abajo.</p>'}</div>
    <button class="btn-secondary" style="margin-top:1rem;width:100%;" onclick="addListItem('horarios')">+ Agregar Servicio</button>
    ${saveBtnHTML('horarios')}`;
}

function rowHorario(h, i) {
  return `<div class="list-row" data-idx="${i}">
    <div class="list-row-header"><span class="list-row-num">Culto ${i+1}</span>
      <button class="btn-danger btn-small" onclick="removeListItem('horarios',${i})">🗑 Eliminar</button></div>
    <div class="list-row-fields">
      <input class="form-input" placeholder="Nombre del culto" value="${h.nombre||''}" data-field="nombre">
      <input class="form-input" placeholder="Día (ej: Domingo)" value="${h.dia||''}" data-field="dia">
      <input class="form-input" placeholder="Hora (ej: 10:00 AM)" value="${h.hora||''}" data-field="hora">
      <input class="form-input" placeholder="Descripción breve" value="${h.descripcion||''}" data-field="descripcion">
    </div>
  </div>`;
}

function formNosotros() {
  return `<h2 class="cms-form-title">🏛 Nosotros</h2>
    ${fieldHTML('nosotros-titulo','Título Sección')}
    ${fieldHTML('nosotros-historia','Historia de la Iglesia','textarea',4)}
    ${fieldHTML('nosotros-mision-titulo','Título Misión')}
    ${fieldHTML('nosotros-mision-texto','Texto Misión','textarea',3)}
    ${fieldHTML('nosotros-vision-titulo','Título Visión')}
    ${fieldHTML('nosotros-vision-texto','Texto Visión','textarea',3)}
    ${fieldHTML('nosotros-foto','URL Foto del Pastor')}
    ${saveBtnHTML('nosotros')}`;
}

function formEventos() {
  const rows = listData.eventos.map((e,i) => rowEvento(e,i)).join('');
  return `<h2 class="cms-form-title">📅 Eventos</h2>
    <div id="list-eventos">${rows || '<p class="cms-empty">Sin eventos. Agrega uno abajo.</p>'}</div>
    <button class="btn-secondary" style="margin-top:1rem;width:100%;" onclick="addListItem('eventos')">+ Agregar Evento</button>
    ${saveBtnHTML('eventos')}`;
}

function rowEvento(e, i) {
  return `<div class="list-row" data-idx="${i}">
    <div class="list-row-header"><span class="list-row-num">Evento ${i+1}</span>
      <button class="btn-danger btn-small" onclick="removeListItem('eventos',${i})">🗑 Eliminar</button></div>
    <div class="list-row-fields">
      <input class="form-input" placeholder="Nombre del evento" value="${e.nombre||''}" data-field="nombre">
      <input class="form-input" placeholder="Fecha (ej: 15 Jun 2025)" value="${e.fecha||''}" data-field="fecha">
      <textarea class="form-input" placeholder="Descripción" rows="2" data-field="descripcion">${e.descripcion||''}</textarea>
      <input class="form-input" placeholder="URL de la imagen" value="${e.imagen||''}" data-field="imagen">
    </div>
  </div>`;
}

function formSermones() {
  const rows = listData.sermones.map((s,i) => rowSermon(s,i)).join('');
  return `<h2 class="cms-form-title">🎤 Sermones</h2>
    <div id="list-sermones">${rows || '<p class="cms-empty">Sin sermones. Agrega uno abajo.</p>'}</div>
    <button class="btn-secondary" style="margin-top:1rem;width:100%;" onclick="addListItem('sermones')">+ Agregar Sermón</button>
    ${saveBtnHTML('sermones')}`;
}

function rowSermon(s, i) {
  return `<div class="list-row" data-idx="${i}">
    <div class="list-row-header"><span class="list-row-num">Sermón ${i+1}</span>
      <button class="btn-danger btn-small" onclick="removeListItem('sermones',${i})">🗑 Eliminar</button></div>
    <div class="list-row-fields">
      <input class="form-input" placeholder="Título del sermón" value="${s.titulo||''}" data-field="titulo">
      <input class="form-input" placeholder="Predicador" value="${s.predicador||''}" data-field="predicador">
      <input class="form-input" placeholder="Fecha (ej: 20 May 2025)" value="${s.fecha||''}" data-field="fecha">
      <input class="form-input" placeholder="URL YouTube / Video" value="${s.video||''}" data-field="video">
    </div>
  </div>`;
}

// ── Listas dinámicas ──────────────────────────────────
function addListItem(lista) {
  const defaults = {
    horarios: {nombre:'',dia:'',hora:'',descripcion:''},
    eventos: {nombre:'',fecha:'',descripcion:'',imagen:''},
    sermones: {titulo:'',predicador:'',fecha:'',video:''}
  };
  listData[lista].push({...defaults[lista]});
  renderForma(lista);
  renderPreview(lista);
}

function removeListItem(lista, idx) {
  listData[lista].splice(idx, 1);
  renderForma(lista);
  renderPreview(lista);
}

function cmsOnInput() {
  document.querySelectorAll('[data-input]').forEach(el => {
    cmsData[el.dataset.input] = el.value;
  });
  renderPreview(currentTab);
}

// ── Guardar ───────────────────────────────────────────
async function guardarSeccionCMS(tab, btn) {
  btn.disabled = true;
  const orig = btn.innerHTML;
  btn.innerHTML = '⏳ Guardando...';
  try {
    if (['horarios','eventos','sermones'].includes(tab)) {
      const rows = [];
      document.querySelectorAll('.list-row').forEach((row, i) => {
        const obj = { orden: i };
        row.querySelectorAll('[data-field]').forEach(f => { obj[f.dataset.field] = f.value || f.textContent; });
        rows.push(obj);
      });
      listData[tab] = rows;
      try {
        await window.sb.from('cms_' + tab).delete().gte('orden', 0);
        if (rows.length) await window.sb.from('cms_' + tab).insert(rows);
      } catch(e) { console.warn('Tabla cms_'+tab+' no existe, guardado local.'); }
    } else {
      document.querySelectorAll('[data-input]').forEach(el => { cmsData[el.dataset.input] = el.value; });
      const filas = Object.entries(cmsData)
        .filter(([k]) => k.startsWith(tab + '-') || k.startsWith(tab))
        .map(([clave, valor_texto]) => ({
          clave, valor_texto,
          updated_at: new Date().toISOString(),
          actualizado_por: usuarioActual?.id || null
        }));
      if (filas.length) {
        try {
          await window.sb.from('contenido_pagina').upsert(filas, { onConflict: 'clave' });
        } catch(e) { console.warn('Error guardando en Supabase:', e); }
      }
    }
    mostrarToastCMS('✓ Cambios guardados correctamente');
    renderPreview(tab);
  } catch(e) {
    mostrarToastCMS('⚠ Error: ' + e.message, 'error');
  }
  btn.disabled = false;
  btn.innerHTML = orig;
}

// ── Preview DOM ───────────────────────────────────────
function renderPreview(tab) {
  const panel = document.getElementById('cms-preview-content');
  if (!panel) return;
  const map = {
    navbar: previewNavbar, hero: previewHero, horarios: previewHorarios,
    nosotros: previewNosotros, eventos: previewEventos, sermones: previewSermones
  };
  panel.innerHTML = map[tab] ? map[tab]() : '<p style="color:#8A9E8A;padding:2rem;text-align:center;">Vista previa no disponible.</p>';
}

function previewNavbar() {
  const logo = gRaw('navbar-logo');
  const nombre = g('navbar-nombre') || 'Legado de Bendición';
  const cta = g('navbar-cta') || 'Únete';
  const logoEl = logo
    ? `<img src="${logo}" style="height:36px;width:36px;border-radius:50%;object-fit:cover;border:2px solid #C9A84C;" onerror="this.style.display='none'">`
    : `<div style="width:36px;height:36px;border-radius:50%;background:#C9A84C;display:flex;align-items:center;justify-content:center;font-weight:bold;color:#0d1f0e;font-size:1rem;">L</div>`;
  return `<div style="background:#0d1f0e;padding:.8rem 1.5rem;display:flex;align-items:center;gap:.8rem;border-bottom:1px solid rgba(201,168,76,0.3);">
    ${logoEl}
    <span style="color:#F5F0E8;font-size:1rem;font-weight:600;">${nombre}</span>
    <div style="margin-left:auto;display:flex;gap:1rem;align-items:center;">
      ${['Inicio','Nosotros','Eventos','Sermones'].map(l=>`<span style="color:#8A9E8A;font-size:0.8rem;">${l}</span>`).join('')}
      <span style="background:#C9A84C;color:#0d1f0e;padding:5px 14px;border-radius:4px;font-size:0.8rem;font-weight:bold;">${cta}</span>
    </div>
  </div>
  <div style="padding:3rem;text-align:center;color:#4a6a4a;font-size:0.85rem;">↑ Vista previa del Navbar</div>`;
}

function previewHero() {
  const bg = gRaw('hero-fondo');
  const bgStyle = bg ? `url('${bg}') center/cover` : 'linear-gradient(135deg,#0d1f0e 0%,#1a3a1a 100%)';
  return `<div style="position:relative;min-height:320px;background:${bgStyle};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2rem;">
    <div style="position:absolute;inset:0;background:rgba(0,0,0,0.55);"></div>
    <div style="position:relative;z-index:1;max-width:500px;">
      <p style="color:#C9A84C;font-size:0.75rem;letter-spacing:3px;text-transform:uppercase;margin-bottom:.5rem;">${g('hero-versiculo')}</p>
      <h1 style="color:#F5F0E8;font-size:2rem;line-height:1.15;margin-bottom:.2rem;font-family:Georgia,serif;">${g('hero-titulo1') || 'Bienvenido a'}</h1>
      <h1 style="color:#C9A84C;font-size:2rem;line-height:1.15;margin-bottom:1rem;font-family:Georgia,serif;">${g('hero-titulo2') || 'Legado de Bendición'}</h1>
      <p style="color:#ccc;margin-bottom:1.5rem;font-size:0.9rem;">${g('hero-subtitulo')}</p>
      <div style="display:flex;gap:.8rem;justify-content:center;flex-wrap:wrap;">
        <span style="background:#C9A84C;color:#0d1f0e;padding:10px 22px;border-radius:5px;font-weight:bold;font-size:0.9rem;">${g('hero-boton1') || 'Conócenos'}</span>
        <span style="border:1.5px solid #C9A84C;color:#C9A84C;padding:10px 22px;border-radius:5px;font-size:0.9rem;">${g('hero-boton2') || 'Ver más'}</span>
      </div>
    </div>
  </div>`;
}

function previewHorarios() {
  const items = listData.horarios;
  if (!items.length) return `<div style="padding:3rem;text-align:center;color:#8A9E8A;"><div style="font-size:2rem;margin-bottom:.5rem;">🕐</div>No hay servicios configurados.<br><small>Agrega horarios en el editor.</small></div>`;
  return `<div style="background:#0d1f0e;padding:1.5rem;">
    <h2 style="color:#C9A84C;font-size:1.4rem;text-align:center;margin-bottom:1.2rem;font-family:Georgia,serif;">Nuestros Cultos</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:.8rem;">
      ${items.map(h=>`<div style="background:#1A3A1A;border:1px solid rgba(201,168,76,0.25);border-top:3px solid #C9A84C;border-radius:8px;padding:1.2rem;text-align:center;">
        <div style="color:#C9A84C;font-size:1rem;font-weight:bold;margin-bottom:.3rem;">${h.nombre||'Culto'}</div>
        <div style="color:#F5F0E8;font-size:.9rem;margin:.2rem 0;">${h.dia||''}</div>
        <div style="color:#C9A84C;font-size:0.85rem;font-weight:600;">${h.hora||''}</div>
        <div style="color:#8A9E8A;font-size:0.78rem;margin-top:.4rem;">${h.descripcion||''}</div>
      </div>`).join('')}
    </div>
  </div>`;
}

function previewNosotros() {
  const foto = gRaw('nosotros-foto');
  return `<div style="background:#0d1f0e;padding:1.5rem;">
    <h2 style="color:#C9A84C;font-size:1.4rem;text-align:center;margin-bottom:1.2rem;font-family:Georgia,serif;">${g('nosotros-titulo') || 'Nosotros'}</h2>
    <div style="display:grid;grid-template-columns:${foto?'1fr 1fr':'1fr'};gap:1.5rem;align-items:start;">
      <div>
        <p style="color:#ccc;margin-bottom:1rem;font-size:.9rem;line-height:1.6;">${g('nosotros-historia')}</p>
        <div style="background:#1A3A1A;border-left:3px solid #C9A84C;padding:1rem;margin-bottom:.8rem;border-radius:0 6px 6px 0;">
          <h4 style="color:#C9A84C;margin-bottom:.3rem;font-size:1rem;">${g('nosotros-mision-titulo') || 'Misión'}</h4>
          <p style="color:#8A9E8A;font-size:.85rem;">${g('nosotros-mision-texto')}</p>
        </div>
        <div style="background:#1A3A1A;border-left:3px solid #C9A84C;padding:1rem;border-radius:0 6px 6px 0;">
          <h4 style="color:#C9A84C;margin-bottom:.3rem;font-size:1rem;">${g('nosotros-vision-titulo') || 'Visión'}</h4>
          <p style="color:#8A9E8A;font-size:.85rem;">${g('nosotros-vision-texto')}</p>
        </div>
      </div>
      ${foto?`<img src="${foto}" style="width:100%;border-radius:8px;object-fit:cover;max-height:280px;border:2px solid rgba(201,168,76,0.3);" onerror="this.style.display='none'">`:'' }
    </div>
  </div>`;
}

function previewEventos() {
  const items = listData.eventos;
  if (!items.length) return `<div style="padding:3rem;text-align:center;color:#8A9E8A;"><div style="font-size:2rem;margin-bottom:.5rem;">📅</div>No hay eventos configurados.<br><small>Agrega eventos en el editor.</small></div>`;
  return `<div style="background:#0d1f0e;padding:1.5rem;">
    <h2 style="color:#C9A84C;font-size:1.4rem;text-align:center;margin-bottom:1.2rem;font-family:Georgia,serif;">Próximos Eventos</h2>
    <div style="display:flex;flex-direction:column;gap:.8rem;">
      ${items.map(e=>`<div style="background:#1A3A1A;border:1px solid rgba(201,168,76,0.2);border-radius:8px;padding:1rem;display:flex;gap:1rem;align-items:center;">
        ${e.imagen?`<img src="${e.imagen}" style="width:65px;height:65px;object-fit:cover;border-radius:6px;flex-shrink:0;" onerror="this.outerHTML='<div style=width:65px;height:65px;background:#0d1f0e;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:1.5rem>📅</div>'">`:'<div style="width:65px;height:65px;background:#0d1f0e;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:1.5rem;">📅</div>'}
        <div style="flex:1;min-width:0;">
          <div style="color:#C9A84C;font-weight:bold;margin-bottom:.2rem;">${e.nombre||'Evento'}</div>
          <div style="color:#8A9E8A;font-size:.8rem;margin-bottom:.3rem;">${e.fecha||''}</div>
          <div style="color:#ccc;font-size:.82rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${e.descripcion||''}</div>
        </div>
      </div>`).join('')}
    </div>
  </div>`;
}

function previewSermones() {
  const items = listData.sermones;
  if (!items.length) return `<div style="padding:3rem;text-align:center;color:#8A9E8A;"><div style="font-size:2rem;margin-bottom:.5rem;">🎤</div>No hay sermones configurados.<br><small>Agrega sermones en el editor.</small></div>`;
  return `<div style="background:#0d1f0e;padding:1.5rem;">
    <h2 style="color:#C9A84C;font-size:1.4rem;text-align:center;margin-bottom:1.2rem;font-family:Georgia,serif;">Sermones</h2>
    <div style="display:flex;flex-direction:column;gap:.7rem;">
      ${items.map((s,i)=>`<div style="background:#1A3A1A;border:1px solid rgba(201,168,76,0.2);border-radius:8px;padding:1rem;display:flex;justify-content:space-between;align-items:center;gap:1rem;">
        <div style="display:flex;align-items:center;gap:.8rem;min-width:0;">
          <div style="width:36px;height:36px;background:rgba(201,168,76,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#C9A84C;font-weight:bold;flex-shrink:0;">${i+1}</div>
          <div style="min-width:0;">
            <div style="color:#F5F0E8;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.titulo||'Sermón'}</div>
            <div style="color:#C9A84C;font-size:.8rem;">${s.predicador||''} ${s.fecha?'· '+s.fecha:''}</div>
          </div>
        </div>
        ${s.video?`<a href="${s.video}" target="_blank" style="background:#C9A84C;color:#0d1f0e;padding:7px 14px;border-radius:5px;font-size:.8rem;font-weight:bold;text-decoration:none;flex-shrink:0;">▶ Ver</a>`:''}
      </div>`).join('')}
    </div>
  </div>`;
}

// ── Toast ─────────────────────────────────────────────
function mostrarToastCMS(msg, type='success') {
  const c = document.getElementById('toast-container') || document.body;
  const t = document.createElement('div');
  t.style.cssText = `background:#1A3A1A;border-left:4px solid ${type==='error'?'#ff6b6b':'#C9A84C'};color:#F5F0E8;padding:14px 20px;border-radius:6px;box-shadow:0 8px 24px rgba(0,0,0,.5);font-family:'Outfit',sans-serif;font-size:.95rem;`;
  t.innerHTML = msg;
  c.appendChild(t);
  setTimeout(()=>{ t.style.transition='opacity .3s'; t.style.opacity='0'; setTimeout(()=>t.remove(),300); },3000);
}
