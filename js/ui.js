/* ============================================================
   ui.js — Shared sidebar, nav, and layout rendering
   ============================================================ */

const SIDEBAR_HTML = `
<div class="sidebar-logo">
  <div class="sidebar-logo-icon">
    <img src="slaf_logo.png" alt="SLAF Emblem" style="width:40px;height:40px;object-fit:contain;filter:drop-shadow(0 0 6px rgba(56,189,248,0.5));" />
  </div>
  <div>
    <div class="sidebar-title">SLAF ATC</div>
    <div class="sidebar-sub">CMS v2.0</div>
  </div>
</div>

<nav class="sidebar-nav">
  <div class="nav-section-label">MAIN</div>
  <a href="dashboard.html" class="nav-item" id="nav-dashboard">
    <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 01-16 0z"/><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"/></svg>
    Dashboard
  </a>
  <a href="airbases.html" class="nav-item" id="nav-airbases">
    <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2H4a1 1 0 110-2V4zm3 1a1 1 0 011 1v1a1 1 0 11-2 0V6a1 1 0 011-1zm3 0a1 1 0 011 1v1a1 1 0 11-2 0V6a1 1 0 011-1zm-3 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm3 0a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z" clip-rule="evenodd"/></svg>
    Air Bases
  </a>
  <a href="personnel.html" class="nav-item" id="nav-personnel">
    <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
    Personnel
  </a>
  <a href="assessments.html" class="nav-item" id="nav-assessments">
    <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>
    Assessments
  </a>

  <div class="nav-section-label">ANALYSIS</div>
  <a href="rankings.html" class="nav-item" id="nav-rankings">
    <svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>
    Rankings
  </a>
  <a href="reports.html" class="nav-item" id="nav-reports">
    <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clip-rule="evenodd"/></svg>
    Reports
  </a>

  <div class="nav-section-label admin-only">ADMINISTRATION</div>
  <a href="users.html"    class="nav-item admin-only" id="nav-users">
    <svg viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>
    User Management
  </a>
  <a href="settings.html" class="nav-item admin-only" id="nav-settings">
    <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg>
    System Settings
  </a>
  <a href="audit.html"    class="nav-item admin-only" id="nav-audit">
    <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
    Audit Log
  </a>
</nav>

<div class="sidebar-user" id="sidebarUser">
  <div class="sidebar-avatar" id="sidebarAvatar">?</div>
  <div class="sidebar-user-info">
    <div class="sidebar-user-name" id="sidebarUserName">Loading…</div>
    <div class="sidebar-user-role" id="sidebarUserRole">—</div>
  </div>
  <button class="sidebar-logout" id="sidebarLogout" title="Logout">
    <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd"/></svg>
  </button>
</div>`;

function initSidebar() {
  const session = Auth.requireAuth();
  if (!session) return;

  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.innerHTML = SIDEBAR_HTML;

    // Set active link
    const current = window.location.pathname.split('/').pop().replace('.html','');
    const navId = `nav-${current}`;
    const navEl = document.getElementById(navId);
    if (navEl) navEl.classList.add('active');

    // User info
    const userInfo = ROLES[session.role];
    document.getElementById('sidebarUserName').textContent = session.name;
    document.getElementById('sidebarUserRole').textContent = userInfo?.label || session.role;
    document.getElementById('sidebarAvatar').textContent = session.name.charAt(0).toUpperCase();

    // Logout
    document.getElementById('sidebarLogout').addEventListener('click', Auth.logout.bind(Auth));

    // RBAC visibility
    if (!Auth.can('canManageUsers') && !Auth.can('canEditSettings')) {
      document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = 'none';
      });
    }
  }

  // Mobile hamburger
  const hamburger = document.getElementById('hamburger');
  const mobileLogout = document.getElementById('mobileLogout');
  if (hamburger && sidebar) {
    hamburger.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', e => {
      if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }
  if (mobileLogout) mobileLogout.addEventListener('click', Auth.logout.bind(Auth));

  return session;
}

// ── Pagination ──────────────────────────────────────────────
function renderPagination(container, totalItems, perPage, currentPage, onPageChange) {
  const totalPages = Math.ceil(totalItems / perPage);
  if (totalPages <= 1) { container.innerHTML = ''; return; }
  let html = '';
  html += `<button class="pg-btn" ${currentPage===1?'disabled':''} data-pg="${currentPage-1}">‹</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage-2 && i <= currentPage+2)) {
      html += `<button class="pg-btn ${i===currentPage?'active':''}" data-pg="${i}">${i}</button>`;
    } else if (i === currentPage-3 || i === currentPage+3) {
      html += `<span class="pg-btn" style="border:none;cursor:default">…</span>`;
    }
  }
  html += `<button class="pg-btn" ${currentPage===totalPages?'disabled':''} data-pg="${currentPage+1}">›</button>`;
  container.innerHTML = html;
  container.querySelectorAll('.pg-btn[data-pg]').forEach(btn => {
    btn.addEventListener('click', () => onPageChange(parseInt(btn.dataset.pg)));
  });
}

// ── Populate select from array ──────────────────────────────
function populateSelect(selector, items, valueKey, labelKey, addAll = false) {
  const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!el) return;
  const val = el.value;
  el.innerHTML = addAll ? '<option value="">All</option>' : '<option value="">Select…</option>';
  items.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item[valueKey];
    opt.textContent = item[labelKey];
    el.appendChild(opt);
  });
  if (val) el.value = val;
}

// ── Trend sparkline (text) ──────────────────────────────────
function trendArrow(scores) {
  if (!scores || scores.length < 2) return '<span class="trend-flat">–</span>';
  const last  = scores[scores.length - 1];
  const prev  = scores[scores.length - 2];
  const diff  = parseFloat((last - prev).toFixed(1));
  if (diff > 1)  return `<span class="trend-up">↑ ${diff}%</span>`;
  if (diff < -1) return `<span class="trend-down">↓ ${Math.abs(diff)}%</span>`;
  return `<span class="trend-flat">→ Stable</span>`;
}

// ── Export CSV ──────────────────────────────────────────────
function exportCSV(filename, headers, rows) {
  const lines = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Auto-init sidebar on app pages
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('sidebar')) initSidebar();
});
