const fs = require('fs');

let html = fs.readFileSync('dashboard-pastor.html', 'utf8');

const regex = /<section id="view-content" class="view-section" style="height: calc\(100vh - 100px\); display: flex; flex-direction: column;">[\s\S]*?<\/section>/;

const newLayout = `<section id="view-content" class="view-section" style="height: calc(100vh - 100px); display: flex; flex-direction: column;">
                <div style="background: rgba(201, 168, 76, 0.1); border: 1px solid var(--color-primary); padding: 15px; border-radius: 8px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3 class="section-heading mb-0" style="color: var(--color-primary); font-size: 1.5rem;">
                            ⚠️ Editor de Página Web (En Vivo)
                        </h3>
                        <p style="color: var(--text-secondary); margin: 0; font-size: 0.9rem;">Escribe a la derecha y los cambios se verán a la izquierda al instante. No olvides Guardar.</p>
                    </div>
                    <a href="index.html" target="_blank" class="btn-outline-gold">Ver página pública ↗</a>
                </div>
                
                <div style="display: flex; flex: 1; min-height: 0; gap: 1rem;">
                    <!-- LEFT: Realtime iframe preview -->
                    <div style="flex: 1.5; border: 2px solid var(--color-primary); border-radius: 8px; overflow: hidden; background: #fff; position: relative;">
                        <iframe id="cms-preview-iframe" src="index.html?mode=editpreview" style="width: 100%; height: 100%; border: none;"></iframe>
                    </div>

                    <!-- RIGHT: Editor Panel with Vertical Tabs -->
                    <div style="width: 450px; min-width: 450px; background: rgba(0,0,0,0.2); border: 1px solid rgba(201, 168, 76, 0.2); border-radius: 8px; display: flex; overflow: hidden;">
                        <!-- Vertical Tabs -->
                        <div style="width: 130px; background: #0F1F0F; border-right: 1px solid rgba(201, 168, 76, 0.1); overflow-y: auto;" id="cms-tabs">
                            <button class="cms-tab active" data-section="navbar" style="width:100%; text-align:left; padding:12px; border:none; background:transparent; color:#8A9E8A; border-left:3px solid transparent; cursor:pointer;">Navbar</button>
                            <button class="cms-tab" data-section="hero" style="width:100%; text-align:left; padding:12px; border:none; background:transparent; color:#8A9E8A; border-left:3px solid transparent; cursor:pointer;">Hero</button>
                            <button class="cms-tab" data-section="horarios" style="width:100%; text-align:left; padding:12px; border:none; background:transparent; color:#8A9E8A; border-left:3px solid transparent; cursor:pointer;">Horarios</button>
                            <button class="cms-tab" data-section="nosotros" style="width:100%; text-align:left; padding:12px; border:none; background:transparent; color:#8A9E8A; border-left:3px solid transparent; cursor:pointer;">Nosotros</button>
                            <button class="cms-tab" data-section="eventos" style="width:100%; text-align:left; padding:12px; border:none; background:transparent; color:#8A9E8A; border-left:3px solid transparent; cursor:pointer;">Eventos</button>
                            <button class="cms-tab" data-section="sermones" style="width:100%; text-align:left; padding:12px; border:none; background:transparent; color:#8A9E8A; border-left:3px solid transparent; cursor:pointer;">Sermones</button>
                            <button class="cms-tab" data-section="contacto" style="width:100%; text-align:left; padding:12px; border:none; background:transparent; color:#8A9E8A; border-left:3px solid transparent; cursor:pointer;">Contacto</button>
                            <button class="cms-tab" data-section="footer" style="width:100%; text-align:left; padding:12px; border:none; background:transparent; color:#8A9E8A; border-left:3px solid transparent; cursor:pointer;">Footer</button>
                            <button class="cms-tab" data-section="estilos" style="width:100%; text-align:left; padding:12px; border:none; background:transparent; color:#8A9E8A; border-left:3px solid transparent; cursor:pointer;">🎨 Estilos</button>
                        </div>
                        
                        <!-- Content Area -->
                        <div style="flex: 1; padding: 1.5rem; overflow-y: auto; background: #111A11;" class="custom-scrollbar" id="cms-content-area">
                            <div class="text-center text-secondary">Cargando editor...</div>
                        </div>
                    </div>
                </div>
            </section>`;

html = html.replace(regex, newLayout);
fs.writeFileSync('dashboard-pastor.html', html, 'utf8');
console.log('Done');
