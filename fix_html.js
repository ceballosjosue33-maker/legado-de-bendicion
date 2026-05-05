const fs = require('fs');
let html = fs.readFileSync('dashboard-pastor.html', 'utf8');

const regex = /<section id="view-content" class="view-section" style="height: calc\(100vh - 100px\); display: flex; flex-direction: column;">[\s\S]*?<\/section>/;

const newHTML = `
            <!-- VIEW: CONTENT -->
            <section id="view-content" class="view-section" style="height: calc(100vh - 100px); display: flex; flex-direction: column;">
                <div class="cms-editor-container" style="display: flex; flex: 1; min-height: 0; width: 100%; background: #0A0F0A; position: relative;">
                    
                    <!-- Panel Izquierdo 45%: Editor -->
                    <div class="cms-editor-panel" style="width: 45%; border-right: 1px solid var(--color-primary); display: flex; flex-direction: column; background: #0A0F0A; position: relative; z-index: 2;">
                        <div style="padding: 1rem; border-bottom: 2px solid var(--color-primary); background: #0F1F0F; display: flex; justify-content: space-between; align-items: center;">
                            <h3 style="margin:0; color: var(--color-primary); font-family: var(--font-heading); font-size: 1.5rem;">Editor de Contenido</h3>
                            <button id="btn-cms-preview-mobile" class="btn-outline-gold btn-small" style="display: none;">Ver vista previa</button>
                        </div>

                        <!-- Horizontal Tabs -->
                        <div class="cms-tabs-container" style="display: flex; overflow-x: auto; background: #0F1F0F; border-bottom: 1px solid rgba(201,168,76,0.2);">
                            <button class="cms-tab active" data-section="navbar" style="flex-shrink:0; padding:12px 20px; background: #1A3A1A; border:none; border-bottom: 2px solid var(--color-primary); color: #C9A84C; font-weight:bold; cursor:pointer;">Navbar</button>
                            <button class="cms-tab" data-section="hero" style="flex-shrink:0; padding:12px 20px; background: transparent; border:none; border-bottom: 2px solid transparent; color: #8A9E8A; cursor:pointer;">Hero</button>
                            <button class="cms-tab" data-section="horarios" style="flex-shrink:0; padding:12px 20px; background: transparent; border:none; border-bottom: 2px solid transparent; color: #8A9E8A; cursor:pointer;">Horarios</button>
                            <button class="cms-tab" data-section="nosotros" style="flex-shrink:0; padding:12px 20px; background: transparent; border:none; border-bottom: 2px solid transparent; color: #8A9E8A; cursor:pointer;">Nosotros</button>
                            <button class="cms-tab" data-section="eventos" style="flex-shrink:0; padding:12px 20px; background: transparent; border:none; border-bottom: 2px solid transparent; color: #8A9E8A; cursor:pointer;">Eventos</button>
                            <button class="cms-tab" data-section="sermones" style="flex-shrink:0; padding:12px 20px; background: transparent; border:none; border-bottom: 2px solid transparent; color: #8A9E8A; cursor:pointer;">Sermones</button>
                            <button class="cms-tab" data-section="contacto" style="flex-shrink:0; padding:12px 20px; background: transparent; border:none; border-bottom: 2px solid transparent; color: #8A9E8A; cursor:pointer;">Contacto</button>
                            <button class="cms-tab" data-section="footer" style="flex-shrink:0; padding:12px 20px; background: transparent; border:none; border-bottom: 2px solid transparent; color: #8A9E8A; cursor:pointer;">Footer</button>
                        </div>

                        <!-- Formularios de Edición -->
                        <div class="cms-forms-area custom-scrollbar" id="cms-forms-area" style="flex: 1; overflow-y: auto; padding: 1.5rem; background: #0A0F0A; padding-bottom: 80px;">
                            <div class="text-center text-secondary">Cargando editor...</div>
                        </div>

                    </div>

                    <!-- Panel Derecho 55%: iframe Preview -->
                    <div class="cms-preview-panel" id="cms-preview-panel" style="width: 55%; background: #000; position: relative;">
                        <div style="position:absolute; top:0; left:0; right:0; padding:10px; background: rgba(0,0,0,0.8); border-bottom: 0.5px solid rgba(201,168,76,0.3); z-index: 10; display:flex; justify-content: flex-end; align-items:center;">
                            <span style="color:#8A9E8A; font-size:0.85rem; margin-right:auto;">Vista Previa en Vivo</span>
                            <button class="btn-cms-close-preview btn-outline-gold btn-small" style="display:none; margin-right:10px;">Cerrar Preview</button>
                            <a href="index.html" target="_blank" class="btn-primary-solid btn-small" style="text-decoration:none;">Abrir en nueva pestaña ↗</a>
                        </div>
                        <iframe id="preview-iframe" src="index.html?cms=true" style="width: 100%; height: 100%; border: none; border-left: 0.5px solid rgba(201,168,76,0.3);"></iframe>
                    </div>
                </div>
            </section>
`;

html = html.replace(regex, newHTML);

fs.writeFileSync('dashboard-pastor.html', html, 'utf8');
console.log('HTML actualizado');
