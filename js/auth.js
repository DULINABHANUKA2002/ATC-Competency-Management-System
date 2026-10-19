/* ============================================================
   auth.js — Authentication & Role-based Access Control
   ============================================================ */

const AUTH_SESSION_KEY = 'slaf_atc_session';

const ROLES = {
  director: {
    label: 'Director',
    color: '#a855f7',
    canView:        true,
    canInput:       false,
    canEdit:        false,
    canDelete:      false,
    canUpload:      false,
    canManageUsers: false,
    canManageBases: false,
    canEditSettings:false,
    canViewAudit:   true,
    baseScope:      'all',
  },
  admin: {
    label: 'Admin',
    color: '#38bdf8',
    canView:        true,
    canInput:       true,
    canEdit:        true,
    canDelete:      true,
    canUpload:      true,
    canManageUsers: true,
    canManageBases: true,
    canEditSettings:true,
    canViewAudit:   true,
    baseScope:      'all',
  },
  user: {
    label: 'User',
    color: '#2dd4bf',
    canView:        true,
    canInput:       true,
    canEdit:        false,
    canDelete:      false,
    canUpload:      true,
    canManageUsers: false,
    canManageBases: false,
    canEditSettings:false,
    canViewAudit:   false,
    baseScope:      'assigned',
  },
  viewer: {
    label: 'Viewer',
    color: '#f59e0b',
    canView:        true,
    canInput:       false,
    canEdit:        false,
    canDelete:      false,
    canUpload:      false,
    canManageUsers: false,
    canManageBases: false,
    canEditSettings:false,
    canViewAudit:   false,
    baseScope:      'all',
  },
};

const PERMISSIONS_MATRIX = [
  { label: 'View all air bases',          director: true,  admin: true,  user: false, viewer: true  },
  { label: 'View all personnel',          director: true,  admin: true,  user: true,  viewer: true  },
  { label: 'View all test records',       director: true,  admin: true,  user: true,  viewer: true  },
  { label: 'View rankings',               director: true,  admin: true,  user: true,  viewer: true  },
  { label: 'View reports',                director: true,  admin: true,  user: true,  viewer: true  },
  { label: 'Enter assessment results',    director: false, admin: true,  user: true,  viewer: false },
  { label: 'Upload PDF documents',        director: false, admin: true,  user: true,  viewer: false },
  { label: 'Add/edit personnel',          director: false, admin: true,  user: false, viewer: false },
  { label: 'Delete records',             director: false, admin: true,  user: false, viewer: false },
  { label: 'Create/manage users',         director: false, admin: true,  user: false, viewer: false },
  { label: 'Modify system settings',      director: false, admin: true,  user: false, viewer: false },
  { label: 'Add/remove air bases',        director: false, admin: true,  user: false, viewer: false },
  { label: 'View audit log',              director: true,  admin: true,  user: false, viewer: false },
  { label: 'Export reports',              director: true,  admin: true,  user: false, viewer: true  },
  { label: 'Change authorization / roles',director: false, admin: true,  user: false, viewer: false },
];

const Auth = {
  // ── Login ───────────────────────────────────────────────
  login(username, password) {
    const users = DB.get('users');
    const user = users.find(u => u.username === username && u.passwordHash === password && u.status === 'active');
    if (!user) return null;

    const session = {
      userId:   user.id,
      username: user.username,
      name:     user.name,
      role:     user.role,
      baseId:   user.baseId,
    };
    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));

    // Update last login
    DB.update('users', user.id, { lastLogin: new Date().toISOString() });

    // Audit
    Auth.audit('LOGIN', 'AUTH', 'Successful login', 'SUCCESS', session);

    return session;
  },

  // ── Logout ──────────────────────────────────────────────
  logout() {
    const s = Auth.getSession();
    if (s) Auth.audit('LOGOUT', 'AUTH', 'User logged out', 'SUCCESS', s);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    window.location.href = 'index.html';
  },

  // ── Session ─────────────────────────────────────────────
  getSession() {
    const raw = sessionStorage.getItem(AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  requireAuth() {
    const s = Auth.getSession();
    if (!s) { window.location.href = 'index.html'; return null; }
    return s;
  },

  can(permission) {
    const s = Auth.getSession();
    if (!s) return false;
    return ROLES[s.role]?.[permission] === true;
  },

  getRoleInfo(role) { return ROLES[role] || ROLES.viewer; },

  // ── Admin page guard ────────────────────────────────────
  requireRole(...roles) {
    const s = Auth.requireAuth();
    if (!s) return null;
    if (!roles.includes(s.role)) {
      showToast('Access denied. Insufficient privileges.', 'error');
      setTimeout(() => window.location.href = 'dashboard.html', 1500);
      return null;
    }
    return s;
  },

  // ── Audit logging helper ────────────────────────────────
  audit(action, recordType, detail, result = 'SUCCESS', session = null) {
    const s = session || Auth.getSession();
    if (!s) return;
    DB.insert('auditLog', {
      userId:     s.userId,
      username:   s.username,
      role:       s.role,
      action,
      recordType,
      detail,
      ip:         '10.0.0.x',
      session:    `SES-${s.userId}`,
      result,
      timestamp:  new Date().toISOString(),
    });
  },
};

// ── Global toast ────────────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✓', error: '✕', warn: '⚠', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span style="color:${type==='success'?'var(--green)':type==='error'?'var(--red)':type==='warn'?'var(--amber)':'var(--primary)'}">${icons[type]||'ℹ'}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideInRight .25s reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Confirm dialog ──────────────────────────────────────────
function confirmDialog(message) {
  return new Promise(resolve => {
    // Simple browser confirm fallback
    resolve(window.confirm(message));
  });
}

// ── Format helpers ──────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
}
function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' });
}
function fmtPct(n) { return n != null ? `${n}%` : '—'; }
function getSkillClass(level) {
  const m = { A:'skill-a', B:'skill-b', C:'skill-c', Beginner:'skill-beginner' };
  return m[level] || '';
}
function getStatusBadge(status) {
  const map = {
    current:  '<span class="badge badge-green"><span class="status-dot" style="background:var(--green);box-shadow:0 0 6px var(--green)"></span>Current</span>',
    review:   '<span class="badge badge-amber"><span class="status-dot" style="background:var(--amber);box-shadow:0 0 6px var(--amber)"></span>Review</span>',
    inactive: '<span class="badge badge-gray"><span class="status-dot" style="background:var(--text-3)"></span>Inactive</span>',
    active:   '<span class="badge badge-green">Active</span>',
  };
  return map[status] || `<span class="badge badge-gray">${status}</span>`;
}
function getRoleBadge(role) {
  const info = ROLES[role];
  if (!info) return `<span class="badge badge-gray">${role}</span>`;
  const cls = { director:'badge-purple', admin:'badge-blue', user:'badge-teal', viewer:'badge-amber' };
  return `<span class="badge ${cls[role]||'badge-gray'}">${info.label}</span>`;
}
