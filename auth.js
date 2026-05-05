// ==========================================
// auth.js — LÓGICA COMPLETA DE AUTENTICACIÓN
// Requiere: config.js (window.sb)
// ==========================================

const _s = window.sb;

// ── DOM refs ──────────────────────────────
const viewLogin    = document.getElementById('view-login');
const viewRegister = document.getElementById('view-register');
const viewRecover  = document.getElementById('view-recover');
const authSubtitle = document.getElementById('auth-subtitle');
const msgLogin     = document.getElementById('msg-login');
const msgRegister  = document.getElementById('msg-register');
const msgRecover   = document.getElementById('msg-recover');

// ── Redirect if already logged in ─────────
(async () => {
    const { data: { session } } = await _s.auth.getSession();
    if (session) {
        const { data: u } = await _s.from('usuarios').select('rol').eq('id', session.user.id).maybeSingle();
        if (u) redirectByRole(u.rol);
    }
})();

// ── View navigation ───────────────────────
function showView(view, subtitle) {
    [viewLogin, viewRegister, viewRecover].forEach(v => v.classList.remove('active'));
    [msgLogin, msgRegister, msgRecover].forEach(m => { m.className = 'form-message'; m.textContent = ''; });
    view.classList.add('active');
    authSubtitle.textContent = subtitle;
}

function showMsg(el, type, text) {
    el.className = `form-message ${type}`;
    el.textContent = text;
}

function redirectByRole(rol) {
    const map = { pastor: 'dashboard-pastor.html', lider: 'dashboard-lider.html' };
    window.location.href = map[rol] || 'dashboard-miembro.html';
}

document.getElementById('link-register').addEventListener('click', e => { e.preventDefault(); showView(viewRegister, 'Crea tu cuenta'); });
document.getElementById('link-back-login').addEventListener('click', e => { e.preventDefault(); showView(viewLogin, 'Inicia sesión en tu cuenta'); });
document.getElementById('link-forgot').addEventListener('click', e => { e.preventDefault(); showView(viewRecover, 'Recuperar contraseña'); });
document.getElementById('link-back-login2').addEventListener('click', e => { e.preventDefault(); showView(viewLogin, 'Inicia sesión en tu cuenta'); });

// ── LOGIN ─────────────────────────────────
document.getElementById('form-login').addEventListener('submit', async e => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn      = document.getElementById('btn-login');

    btn.disabled = true;
    btn.textContent = 'Ingresando...';
    showMsg(msgLogin, '', '');

    try {
        const { data, error } = await _s.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const { data: userData, error: uErr } = await _s
            .from('usuarios')
            .select('rol')
            .eq('id', data.user.id)
            .maybeSingle();

        if (uErr) throw new Error('Error consultando tu perfil: ' + uErr.message);
        if (!userData) throw new Error('Tu usuario no existe en la base de datos. Contacta al pastor.');

        redirectByRole(userData.rol);

    } catch (err) {
        let msg = err.message;
        if (msg === 'Invalid login credentials') msg = 'Correo o contraseña incorrectos.';
        if (msg === 'Email not confirmed') msg = 'Verifica tu correo antes de iniciar sesión.';
        showMsg(msgLogin, 'error', msg);
        btn.disabled = false;
        btn.textContent = 'Ingresar';
    }
});

// ── REGISTRO ──────────────────────────────
document.getElementById('form-register').addEventListener('submit', async e => {
    e.preventDefault();
    const nombre   = document.getElementById('reg-nombre').value.trim();
    const telefono = document.getElementById('reg-telefono').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm  = document.getElementById('reg-password-confirm').value;
    const btn      = document.getElementById('btn-register');

    if (password !== confirm) return showMsg(msgRegister, 'error', 'Las contraseñas no coinciden.');
    if (password.length < 6)  return showMsg(msgRegister, 'error', 'La contraseña debe tener al menos 6 caracteres.');

    btn.disabled = true;
    btn.textContent = 'Registrando...';

    try {
        const { data, error } = await _s.auth.signUp({ email, password, options: { data: { nombre } } });
        if (error) throw error;

        // Insertar en tabla usuarios (puede fallar si email_confirm está activo y usuario no confirma)
        if (data.user) {
            const { error: dbErr } = await _s.from('usuarios').upsert({
                id:       data.user.id,
                nombre,
                email,
                telefono: telefono || null,
                rol:      'estudiante',
                activo:   true
            });
            if (dbErr) console.warn('Perfil no guardado en tabla usuarios:', dbErr.message);
        }

        showMsg(msgRegister, 'success', '¡Registro exitoso! Revisa tu correo para verificar tu cuenta antes de iniciar sesión.');
        document.getElementById('form-register').reset();

    } catch (err) {
        showMsg(msgRegister, 'error', err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Crear Cuenta';
    }
});

// ── RECUPERAR CONTRASEÑA ──────────────────
document.getElementById('form-recover').addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('recover-email').value.trim();
    const btn   = document.getElementById('btn-recover');

    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
        const { error } = await _s.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/auth.html'
        });
        if (error) throw error;
        showMsg(msgRecover, 'success', 'Enlace enviado a tu correo. Revisa tu bandeja de entrada.');
        document.getElementById('form-recover').reset();
    } catch (err) {
        showMsg(msgRecover, 'error', err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Enviar Enlace';
    }
});
