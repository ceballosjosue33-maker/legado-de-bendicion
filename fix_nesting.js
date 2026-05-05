const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regex = /<div class="contact-text">\s+<h4>Escríbenos<\/h4>\s+<p>info@legadodebendicion\.org<\/p>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<div class="social-links">/;

const replacement = `                            <div class="contact-text">
                                <h4>Escríbenos</h4>
                                <p>info@legadodebendicion.org</p>
                            </div>
                        </div>
                    </div>

                    <div class="social-links">`;

if (regex.test(html)) {
    html = html.replace(regex, replacement);
    fs.writeFileSync('index.html', html, 'utf8');
    console.log('Fixed nested structure of contact section.');
} else {
    console.log('Regex did not match.');
}
