const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// NAVBAR
html = html.replace('<span>Legado de Bendición</span>', '<span data-editable="navbar-nombre">Legado de Bendición</span>');
html = html.replace('<a href="auth.html" class="btn-outline-gold" style="padding: 0.5rem 1.2rem; font-size: 0.95rem; border-radius: 25px;">Iniciar sesión</a>', '<a href="auth.html" class="btn-outline-gold" style="padding: 0.5rem 1.2rem; font-size: 0.95rem; border-radius: 25px;" data-editable="navbar-cta1">Iniciar sesión</a>');
html = html.replace('<a href="auth.html" class="btn-primary-solid" style="padding: 0.5rem 1.2rem; font-size: 0.95rem; border-radius: 25px;">Registrarse</a>', '<a href="auth.html" class="btn-primary-solid" style="padding: 0.5rem 1.2rem; font-size: 0.95rem; border-radius: 25px;" data-editable="navbar-cta">Registrarse</a>');
html = html.replace(/<img src="[^"]*" alt="LDB Logo"/, '<img data-editable-img="navbar-logo" src="https://scontent.fclo1-4.fna.fbcdn.net/v/t39.30808-6/486432710_931766482503686_3903717456267471297_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=90jPxAqwdXoQ7kNvwH3M0Yr&_nc_oc=AdpAVk7ivquIhFz0g65Uz437PJ6YuyjFIb4TlWmJ76EqiXmDBvWhXVsrAHziTcvqgfgJJdi3ABabnclm-kPJCG5m&_nc_zt=23&_nc_ht=scontent.fclo1-4.fna&_nc_gid=GwZoJS7PzoGJtfoCLfV56Q&_nc_ss=7b2a8&oh=00_Af6HrvQGFpD6yeTzozSFHAG_uJnekNPrcmu2fPBgcjljaw&oe=69FF3CB6" alt="LDB Logo"');

// HERO
html = html.replace('<h1 class="title">Legado de <span class="text-gold-italic">Bendición</span></h1>', '<h1 class="title"><span data-editable="hero-titulo1">Legado de</span> <br> <span class="text-gold-italic" data-editable="hero-titulo2">Bendición</span></h1>');
html = html.replace('<p class="description">Un lugar donde la fe transforma vidas</p>', '<p class="description" data-editable="hero-subtitulo">Un lugar donde la fe transforma vidas</p>');
html = html.replace('<a href="#unete" class="btn-primary-solid">Únete a nosotros</a>', '<a href="#unete" class="btn-primary-solid" data-editable="hero-boton1">Únete a nosotros</a>');
html = html.replace('<a href="#horarios" class="btn-outline-gold">Ver horarios</a>', '<a href="#horarios" class="btn-outline-gold" data-editable="hero-boton2">Ver horarios</a>');
// Background image for hero? The user wants `data-editable-img="hero-fondo" src=""`. The hero uses a background image in CSS currently.
// I will add an img tag for it or modify the background image inline style. The user requested: `<img data-editable-img="hero-fondo" src="">`. I'll add an img with object-fit: cover positioned absolute inside .hero.
html = html.replace('<div class="hero-bg-logo"></div>', '<img data-editable-img="hero-fondo" src="" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; z-index:-2;"><div class="hero-bg-logo"></div>');

// NOSOTROS
html = html.replace('<h2 class="section-title text-white">Nuestra Historia</h2>', '<h2 class="section-title text-white" data-editable="nosotros-titulo">Nuestra Historia</h2>');
html = html.replace('<p class="history-desc">Todo comenzó con un pequeño grupo', '<p class="history-desc" data-editable="nosotros-historia">Todo comenzó con un pequeño grupo');
html = html.replace('<span class="quote-title">Nuestra Misión</span>', '<span class="quote-title" data-editable="nosotros-mision-titulo">Nuestra Misión</span>');
html = html.replace('Edificar una familia espiritual fundamentada en el amor de Cristo, donde cada persona es\r\n                        equipada para vivir en victoria.', '<span data-editable="nosotros-mision-texto">Edificar una familia espiritual fundamentada en el amor de Cristo, donde cada persona es equipada para vivir en victoria.</span>');
html = html.replace('<span class="quote-title">Nuestra Visión</span>', '<span class="quote-title" data-editable="nosotros-vision-titulo">Nuestra Visión</span>');
html = html.replace('Trascender generaciones, dejando un legado de fe inquebrantable que impacte nuestra ciudad y las\r\n                        naciones.', '<span data-editable="nosotros-vision-texto">Trascender generaciones, dejando un legado de fe inquebrantable que impacte nuestra ciudad y las naciones.</span>');
html = html.replace('<img src="assets/history-bg.png" alt="Nuestra Congregación" class="history-img">', '<img src="assets/history-bg.png" alt="Nuestra Congregación" class="history-img" data-editable-img="nosotros-foto">');

// Metrics
html = html.replace('<div class="metric-number">15+</div>', '<div class="metric-number" data-editable="nosotros-metrica1-numero">15+</div>');
html = html.replace('<div class="metric-label">Años de ministerio</div>', '<div class="metric-label" data-editable="nosotros-metrica1-etiqueta">Años de ministerio</div>');
html = html.replace('<div class="metric-number">200+</div>', '<div class="metric-number" data-editable="nosotros-metrica2-numero">200+</div>');
html = html.replace('<div class="metric-label">Familias</div>', '<div class="metric-label" data-editable="nosotros-metrica2-etiqueta">Familias</div>');
html = html.replace('<div class="metric-number">8</div>', '<div class="metric-number" data-editable="nosotros-metrica3-numero">8</div>');
html = html.replace('<div class="metric-label">Grupos de vida</div>', '<div class="metric-label" data-editable="nosotros-metrica3-etiqueta">Grupos de vida</div>');

// HORARIOS
html = html.replace('<h2 class="section-title">Nuestros Cultos</h2>', '<h2 class="section-title" data-editable="horarios-titulo">Nuestros Cultos</h2>');
// Assuming the 4 cards are structured as `schedule-card`
// Let's just do a regex replace to catch them dynamically up to 4
let i = 1;
html = html.replace(/<div class="schedule-card">[\s\S]*?<h3 class="schedule-name">([^<]*)<\/h3>[\s\S]*?<div class="time">([^<]*)<\/div>[\s\S]*?<p class="schedule-desc">([^<]*)<\/p>[\s\S]*?<\/div>/g, (match, p1, p2, p3) => {
    if (i > 4) return match;
    let parts = p2.split(' - ');
    let dia = parts[0] || '';
    let hora = parts[1] || p2;
    let res = `<div class="schedule-card" data-editable-container="horario${i}">
        <div class="schedule-icon">📖</div>
        <h3 class="schedule-name" data-editable="horario${i}-nombre">${p1}</h3>
        <div class="time"><span data-editable="horario${i}-dia">${dia}</span> - <span data-editable="horario${i}-hora">${hora}</span></div>
        <p class="schedule-desc" data-editable="horario${i}-descripcion">${p3}</p>
    </div>`;
    i++;
    return res;
});

// EVENTOS
html = html.replace('<h2 class="section-title">Próximos Eventos</h2>', '<h2 class="section-title" data-editable="eventos-titulo">Próximos Eventos</h2>');
let j = 1;
html = html.replace(/<div class="event-card">[\s\S]*?background-image: url\('([^']+)'\)[\s\S]*?<div class="event-date">[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<div class="event-info">[\s\S]*?<h3 class="event-title">([^<]*)<\/h3>[\s\S]*?<p class="event-desc">([^<]*)<\/p>[\s\S]*?<a href="#" class="btn-outline-gold mt-1">Saber más<\/a>[\s\S]*?<\/div>[\s\S]*?<\/div>/g, (match, img, t, desc) => {
    if (j > 6) return match;
    let res = `<div class="event-card" data-editable-container="evento${j}">
        <!-- Usamos un img oculto para mantener compatibilidad con el script del pastor si quiere img src -->
        <img src="${img}" data-editable-img="evento${j}-imagen" style="display:none;" onload="this.parentElement.style.backgroundImage='url('+this.src+')'">
        <div class="event-img" style="background-image: url('${img}')">
            <div class="event-date">
                <span class="date-number" data-editable="evento${j}-fecha-dia">15</span>
                <span class="date-month" data-editable="evento${j}-fecha-mes">Mayo</span>
            </div>
        </div>
        <div class="event-info">
            <h3 class="event-title" data-editable="evento${j}-titulo">${t}</h3>
            <span data-editable="evento${j}-fecha" style="display:none;">15 Mayo 2025</span> <!-- fecha completa oculta para el editor -->
            <p class="event-desc" data-editable="evento${j}-descripcion">${desc}</p>
            <a href="#" class="btn-outline-gold mt-1" data-editable="evento${j}-link">Saber más</a>
        </div>
    </div>`;
    j++;
    return res;
});

// SERMONES
html = html.replace('<h2 class="section-title">Últimos Sermones</h2>', '<h2 class="section-title" data-editable="sermones-titulo">Últimos Sermones</h2>');
let k = 1;
html = html.replace(/<div class="sermon-card">[\s\S]*?<span class="sermon-category">([^<]*)<\/span>[\s\S]*?<h3 class="sermon-title">([^<]*)<\/h3>[\s\S]*?<span>Predicador: ([^<]*)<\/span>[\s\S]*?<span>([^<]*)<\/span>[\s\S]*?<\/div>[\s\S]*?<\/div>/g, (match, cat, tit, pred, fecha) => {
    if (k > 9) return match;
    let res = `<div class="sermon-card" data-editable-container="sermon${k}">
        <div class="sermon-thumb" style="background-image: url('assets/sermon-placeholder.jpg')">
            <!-- La URL del video se usa para extraer el thumbnail o redirigir -->
            <a href="#" target="_blank" class="sermon-play" data-editable="sermon${k}-video">▶</a>
            <span class="sermon-category" data-editable="sermon${k}-categoria">${cat}</span>
        </div>
        <div class="sermon-info">
            <h3 class="sermon-title" data-editable="sermon${k}-titulo">${tit}</h3>
            <div class="sermon-meta">
                <span>Predicador: <span data-editable="sermon${k}-predicador">${pred}</span></span>
                <span data-editable="sermon${k}-fecha">${fecha}</span>
            </div>
        </div>
    </div>`;
    k++;
    return res;
});

// CONTACTO
html = html.replace('<h2 class="section-title">Ubicación y Horarios</h2>', '<h2 class="section-title" data-editable="contacto-titulo">Ubicación y Horarios</h2>');
// Fix address block
html = html.replace(/<div class="contact-info-block">[\s\S]*?<h3>Dirección<\/h3>[\s\S]*?<p>([^<]*)<\/p>[\s\S]*?<\/div>/, `<div class="contact-info-block">
                        <div class="contact-icon">📍</div>
                        <h3>Dirección</h3>
                        <p data-editable="contacto-direccion">$1</p>
                    </div>`);
html = html.replace(/<div class="contact-info-block">[\s\S]*?<h3>Contacto<\/h3>[\s\S]*?<p>Tel: ([^<]*)<br>Email: ([^<]*)<\/p>[\s\S]*?<\/div>/, `<div class="contact-info-block">
                        <div class="contact-icon">📞</div>
                        <h3>Contacto</h3>
                        <p>Tel: <span data-editable="contacto-telefono">$1</span><br>Email: <span data-editable="contacto-email">$2</span></p>
                    </div>`);
html = html.replace(/<iframe src="[^"]*" width="100%" height="450" style="border:0;" allowfullscreen="" loading="lazy"><\/iframe>/, `<iframe data-editable-img="contacto-mapa" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15865.748154101188!2d-75.5861111!3d6.2411111!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e4428dfb80fad05%3A0x42137cfcc7b53b56!2sMedell%C3%ADn%2C%20Antioquia%2C%20Colombia!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus" width="100%" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`);

// FOOTER
html = html.replace(/<p style="color: var\(--text-secondary\); font-style: italic; max-width: 300px;">[\s\S]*?"Un legado de fe para las próximas generaciones."[\s\S]*?<\/p>/, `<p style="color: var(--text-secondary); font-style: italic; max-width: 300px;" data-editable="footer-slogan">"Un legado de fe para las próximas generaciones."</p>`);
html = html.replace(/<div class="footer-bottom">[\s\S]*?<p>&copy; 2025 Legado de Bendición\. Todos los derechos reservados\.<\/p>[\s\S]*?<\/div>/, `<div class="footer-bottom">
            <p><span data-editable="footer-copyright">&copy; 2025 Legado de Bendición. Todos los derechos reservados.</span></p>
        </div>`);
html = html.replace('<p class="hero-versiculo">Josué 1:9</p>', '<p class="hero-versiculo" data-editable="hero-versiculo">Josué 1:9</p>');

// Add the loader script before body closing
const loaderScript = `
    <!-- SCRIPT DE CARGA DINÁMICA DEL CONTENIDO -->
    <script>
    async function cargarContenido() {
      try {
        const { data, error } = await _s
          .from('contenido_pagina')
          .select('clave, valor_texto, valor_imagen_url');

        if (error || !data) return;

        data.forEach(({ clave, valor_texto, valor_imagen_url }) => {
          // Textos
          if (valor_texto) {
            document.querySelectorAll(\`[data-editable="\${clave}"]\`)
              .forEach(el => el.textContent = valor_texto);
          }
          // Imágenes e iframes
          if (valor_imagen_url) {
            document.querySelectorAll(\`[data-editable-img="\${clave}"]\`)
              .forEach(el => {
                if (el.tagName === 'IFRAME') el.src = valor_imagen_url;
                else el.src = valor_imagen_url;
              });
          }
        });
      } catch (e) {
        console.log('Usando contenido por defecto');
      }
    }
    
    // Cargar contenido despues de Supabase
    document.addEventListener('DOMContentLoaded', () => {
        if(typeof _s !== 'undefined') cargarContenido();
    });
    </script>
`;
html = html.replace('</body>', loaderScript + '\n</body>');

fs.writeFileSync('index.html', html, 'utf8');
console.log('index.html modificado.');
