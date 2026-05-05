const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');
let css = fs.readFileSync('styles.css', 'utf8');
let js = fs.readFileSync('script.js', 'utf8');

// Replace CSS link with inline style
html = html.replace('<link rel="stylesheet" href="styles.css">', `<style>\n${css}\n</style>`);

// Replace JS src with inline script
html = html.replace('<script src="script.js"></script>', `<script>\n${js}\n</script>`);

// Update cross opacity to 3%
html = html.replace(/rgba\(201, 168, 76, 0\.05\)/g, 'rgba(201, 168, 76, 0.03)');

// Replace navbar button
const navAuthHtml = `
            <div class="nav-auth-buttons" style="display: flex; gap: 1rem;">
                <a href="auth.html" class="btn-outline-gold" style="padding: 0.5rem 1.5rem;">Iniciar sesión</a>
                <a href="auth.html" class="btn-primary-solid" style="padding: 0.5rem 1.5rem;">Registrarse</a>
            </div>
`;
html = html.replace('<a href="#unete" class="btn-cta">Únete</a>', navAuthHtml);

// Make sure auth buttons hide on very small mobile if necessary
html = html.replace('.btn-cta { display: none; }', '.nav-auth-buttons { display: none; }');

// Update Schedule CSS to add left border
html = html.replace('border: 1px solid rgba(255,255,255,0.05);', 'border: 1px solid rgba(255,255,255,0.05);\n    border-left: 4px solid var(--color-primary);');

// Update Schedule HTML
const oldSchedule = `<div class="schedule-grid">
                <div class="schedule-card">
                    <h3>Servicio Dominical</h3>
                    <div class="time">Domingos • 10:00 AM</div>
                    <p>Tiempo de alabanza, adoración y mensaje de fe.</p>
                </div>
                <div class="schedule-card">
                    <h3>Estudio Bíblico</h3>
                    <div class="time">Miércoles • 7:30 PM</div>
                    <p>Profundizando en las verdades de la Palabra de Dios.</p>
                </div>
                <div class="schedule-card">
                    <h3>Reunión de Jóvenes</h3>
                    <div class="time">Sábados • 6:00 PM</div>
                    <p>Un espacio dinámico para la nueva generación.</p>
                </div>
            </div>`;

const newSchedule = `<div class="schedule-grid">
                <div class="schedule-card">
                    <h3>Culto Dominical</h3>
                    <div class="time">Dom 9:00 AM y 11:30 AM</div>
                    <p>Tiempo de alabanza, adoración y mensaje de fe.</p>
                </div>
                <div class="schedule-card">
                    <h3>Estudio Bíblico</h3>
                    <div class="time">Mié 7:00 PM</div>
                    <p>Profundizando en las verdades de la Palabra de Dios.</p>
                </div>
                <div class="schedule-card">
                    <h3>Jóvenes</h3>
                    <div class="time">Vie 7:00 PM</div>
                    <p>Un espacio dinámico para la nueva generación.</p>
                </div>
                <div class="schedule-card">
                    <h3>Oración</h3>
                    <div class="time">Mar 6:30 AM</div>
                    <p>Buscando la dirección y el favor del Señor juntos.</p>
                </div>
            </div>`;

html = html.replace(oldSchedule, newSchedule);

fs.writeFileSync('index.html', html);
console.log('Done!');
