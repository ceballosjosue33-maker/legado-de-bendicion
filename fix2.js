const fs = require('fs');

// Append mobile CSS
const css = `
/* MOBILE LAYOUT */
@media (max-width: 900px) {
    .dashboard-layout {
        flex-direction: column;
    }
    .sidebar {
        width: 100%;
        min-width: 100%;
        height: auto;
        max-height: 150px;
        position: sticky;
        top: 0;
        z-index: 100;
        border-right: none;
        border-bottom: 1px solid rgba(201, 168, 76, 0.2);
    }
    .sidebar-header {
        display: none; /* Hide logo on mobile to save space */
    }
    .sidebar-nav {
        flex-direction: row;
        overflow-x: auto;
        padding: 0.5rem;
        gap: 0.5rem;
        white-space: nowrap;
    }
    .nav-item {
        padding: 0.8rem 1rem;
        border-left: none;
        border-bottom: 3px solid transparent;
    }
    .nav-item.active {
        border-left-color: transparent;
        border-bottom-color: var(--color-primary);
    }
    .sidebar-footer {
        display: none; /* Can add a separate logout button in header */
    }
    .main-content {
        padding: 1.5rem;
        height: auto;
        min-height: calc(100vh - 60px);
    }
    .top-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }
}
`;
fs.appendFileSync('dashboard-pastor.css', css, 'utf8');

// Update JS for smooth scroll
let js = fs.readFileSync('dashboard-pastor.js', 'utf8');
const navLogic = `function setupNav() {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.view-section').forEach(v => {
                v.classList.remove('active');
                v.style.display = 'none';
            });
            btn.classList.add('active');
            const target = btn.getAttribute('data-target');
            const el = document.getElementById(target);
            if (el) {
                el.classList.add('active');
                el.style.display = 'block';
            }
            const titleEl = document.getElementById('page-title');
            if (titleEl) titleEl.textContent = btn.textContent.trim();
            
            if (target === 'view-stats') Object.values(charts).forEach(c => c?.resize?.());
            if (target === 'view-roles-log') loadRolesLog();
            
            // Scroll to top of main content
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.scrollTo({ top: 0, behavior: 'smooth' });
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}`;
js = js.replace(/function setupNav\(\) \{[\s\S]*?\n\}/, navLogic);
fs.writeFileSync('dashboard-pastor.js', js, 'utf8');
console.log('Styles and Nav fixed');
