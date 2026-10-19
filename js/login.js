/* ============================================================
   login.js — Login page logic & MFA
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect
  if (Auth.getSession()) {
    window.location.href = 'dashboard.html';
    return;
  }

  spawnParticles();

  const loginForm    = document.getElementById('loginForm');
  const loginFormArea= document.getElementById('loginFormArea');
  const mfaArea      = document.getElementById('mfaArea');
  const mfaBtn       = document.getElementById('mfaBtn');
  const mfaBack      = document.getElementById('mfaBack');
  const togglePw     = document.getElementById('togglePw');
  const pwField      = document.getElementById('password');
  const forgotLink   = document.getElementById('forgotLink');
  const btnLoader    = document.getElementById('btnLoader');
  const btnText      = document.querySelector('.btn-text');

  let pendingCredentials = null;

  // Toggle password visibility
  togglePw.addEventListener('click', () => {
    const isText = pwField.type === 'text';
    pwField.type = isText ? 'password' : 'text';
  });

  // Forgot password
  forgotLink.addEventListener('click', e => {
    e.preventDefault();
    showToast('Password reset: Contact your system administrator.', 'info', 5000);
  });

  // Login form
  loginForm.addEventListener('submit', e => {
    e.preventDefault();

    // Clear errors
    document.getElementById('usernameError').textContent = '';
    document.getElementById('passwordError').textContent = '';

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    let valid = true;
    if (!username) { document.getElementById('usernameError').textContent = 'Username is required.'; valid = false; }
    if (!password) { document.getElementById('passwordError').textContent = 'Password is required.'; valid = false; }
    if (!valid) return;

    // Show loader
    btnText.style.display = 'none';
    btnLoader.style.display = '';

    // Simulated async delay
    setTimeout(() => {
      const session = Auth.login(username, password);

      btnText.style.display = '';
      btnLoader.style.display = 'none';

      if (!session) {
        document.getElementById('passwordError').textContent = 'Invalid username or password.';
        // Audit failed attempt
        DB.insert('auditLog', {
          userId: '—', username, role: '—',
          action: 'LOGIN_FAILED', recordType: 'AUTH',
          detail: `Failed login attempt: username "${username}"`,
          ip: '10.0.0.x', session: '—',
          result: 'FAILURE', timestamp: new Date().toISOString(),
        });
        return;
      }

      // Store pending session for after MFA
      pendingCredentials = { username, password };
      sessionStorage.removeItem('slaf_atc_session'); // Clear until MFA done

      // Show MFA
      loginFormArea.style.display = 'none';
      mfaArea.style.display = '';
      document.getElementById('mfa0').focus();
    }, 900);
  });

  // MFA digit inputs
  document.querySelectorAll('.mfa-digit').forEach((input, i, all) => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g,'').slice(0,1);
      if (input.value && i < all.length - 1) all[i+1].focus();
      checkMfaComplete();
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !input.value && i > 0) all[i-1].focus();
    });
  });

  function checkMfaComplete() {
    const digits = [...document.querySelectorAll('.mfa-digit')].map(d => d.value);
    if (digits.every(d => d)) {
      setTimeout(() => mfaBtn.click(), 150);
    }
  }

  // MFA verify
  mfaBtn.addEventListener('click', () => {
    const digits = [...document.querySelectorAll('.mfa-digit')].map(d => d.value);
    if (digits.some(d => !d)) {
      showToast('Please enter all 6 digits.', 'warn');
      return;
    }
    // Demo: any 6 digits accepted
    if (!pendingCredentials) return;

    const session = Auth.login(pendingCredentials.username, pendingCredentials.password);
    if (session) {
      showToast('Authentication successful. Redirecting…', 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 800);
    }
  });

  // Back to login
  mfaBack.addEventListener('click', () => {
    mfaArea.style.display = 'none';
    loginFormArea.style.display = '';
    pendingCredentials = null;
    document.querySelectorAll('.mfa-digit').forEach(d => d.value = '');
  });
});

// ── Animated particles ──────────────────────────────────────
function spawnParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    const size = Math.random() * 3 + 1;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const duration = Math.random() * 15 + 10;
    const delay = Math.random() * 10;
    const opacity = Math.random() * 0.4 + 0.05;

    p.style.cssText = `
      position:absolute;
      left:${x}%;top:${y}%;
      width:${size}px;height:${size}px;
      border-radius:50%;
      background:${Math.random()>0.5?'#38bdf8':'#6366f1'};
      opacity:${opacity};
      animation: floatParticle ${duration}s ${delay}s ease-in-out infinite alternate;
    `;
    container.appendChild(p);
  }

  const style = document.createElement('style');
  style.textContent = `
    @keyframes floatParticle {
      0%   { transform: translate(0,0) scale(1); }
      100% { transform: translate(${Math.random()*40-20}px,${Math.random()*40-20}px) scale(${Math.random()*1.5+0.5}); }
    }
  `;
  document.head.appendChild(style);
}
