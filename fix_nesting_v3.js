const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const regex = /<p>info@legadodebendicion\.org<\/p>\s+<\/div>\s+<\/div>\s+<\/div>\s+<\/div>\s+<div class="social-links">/;
// The above matched 4 divs. The file has 3? No, line 1870, 1871, 1872. 
// Wait, line 1870 closes contact-item? 
// 1865 is contact-item start.
// 1867 is contact-text start.
// 1870 closes contact-text. 
// 1871 closes contact-item.
// 1872 closes contact-details.
// So 3 is correct to be OUTSIDE contact-details.
// But social-links should be INSIDE contact-info-wrapper.
// contact-info-wrapper starts at 1849.
// contact-details starts at 1850.
// So after 1872 (details closed), we are in info-wrapper.
// So we should have exactly 3 divs before social-links to be in info-wrapper.

const currentTarget = `<p>info@legadodebendicion.org</p>
                                                </div>
                </div>
            </div>

            <div class="social-links">`;

const replacement = `<p>info@legadodebendicion.org</p>
                            </div>
                        </div>
                    </div>

                    <div class="social-links">`;

// I'll just use a very simple string replacement for line 1870-1874
const lines = html.split(/\r?\n/);
// lines[1868] is line 1869
// lines[1869] is 1870
// lines[1870] is 1871
// lines[1871] is 1872
// lines[1872] is 1873
// lines[1873] is 1874

lines[1869] = '                            </div>';
lines[1870] = '                        </div>';
lines[1871] = '                    </div>';
lines[1872] = '';
lines[1873] = '                    <div class="social-links">';

fs.writeFileSync('index.html', lines.join('\n'), 'utf8');
console.log('Fixed nesting via line indexing.');
