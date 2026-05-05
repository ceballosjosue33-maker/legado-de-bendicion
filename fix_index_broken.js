const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const target = `                    </div>

                </a>`;

const replacement = `                    </div>

                    <div class="social-links">
                        <h4>Síguenos</h4>
                        <div class="social-icons">
                            <a href="https://www.instagram.com/legadodebendicion/" target="_blank" class="social-circle">Ig</a>
                            <a href="https://www.facebook.com/Legadodebendicion" target="_blank" class="social-circle">Fb</a>
                            <a href="https://www.youtube.com/@legadodebendicion" target="_blank" class="social-circle">Yt</a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Map Wrapper with Requested Image -->
            <div class="map-wrapper">
                <img src="https://scontent.fclo1-3.fna.fbcdn.net/v/t39.30808-6/515444183_997261929287474_3789510606078508766_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=b895b5&_nc_ohc=LcUhS-8JwmIQ7kNvwGapNCH&_nc_oc=Adq37iDjtsv_4zP2q8LJ0nty-DyjMJYvI0DtwVbXjQ2lokdCr-nDZhbMUGhdVBsKf44aFnsCZYSR7JK_E54f_3EU&_nc_zt=23&_nc_ht=scontent.fclo1-3.fna&_nc_gid=7bSTwH_Zkpow8RDIKWgUfQ&_nc_ss=7b2a8&oh=00_Af7uaHE4LILDJfzuj7BKhxeUTBNS23DEwqZmvrYz4FaKgw&oe=69FF6B50" alt="Mapa" style="width: 100%; height: 100%; object-fit: cover;" data-editable-img="contacto-mapa">
                <div class="map-overlay"></div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer-new">
        <div class="footer-gradient-line"></div>
        <div class="container footer-grid-new">
            <div class="footer-brand">
                <a href="#" class="logo" style="display: flex; align-items: center; gap: 12px; text-decoration: none;">
                    <img src="https://scontent.fclo1-4.fna.fbcdn.net/v/t39.30808-6/486432710_931766482503686_3903717456267471297_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=90jPxAqwdXoQ7kNvwH3M0Yr&_nc_oc=AdpAVk7ivquIhFz0g65Uz437PJ6YuyjFIb4TlWmJ76EqiXmDBvWhXVsrAHziTcvqgfgJJdi3ABabnclm-kPJCG5m&_nc_zt=23&_nc_ht=scontent.fclo1-4.fna&_nc_gid=GwZoJS7PzoGJtfoCLfV56Q&_nc_ss=7b2a8&oh=00_Af6HrvQGFpD6yeTzozSFHAG_uJnekNPrcmu2fPBgcjljaw&oe=69FF3CB6" alt="LDB Logo" style="height: 42px; width: 42px; border-radius: 50%; object-fit: cover; border: 2px solid var(--color-primary);">
                    <span>Legado de Bendición</span>
                </a>`;

if (html.includes(target)) {
    html = html.replace(target, replacement);
    fs.writeFileSync('index.html', html, 'utf8');
    console.log('Fixed index.html structure and added image.');
} else {
    console.log('Target not found. Please check index.html.');
}
