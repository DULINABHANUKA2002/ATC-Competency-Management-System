/* ============================================================
   audit.js — Audit Log page
   ============================================================ */

let allLogs = [], filteredLogs = [], auditPage = 1, auditPerPage = 20;

document.addEventListener('DOMContentLoaded', () => {
  const session = Auth.requireRole('admin', 'director');
  if (!session) return;

  // Populate user filter
  const users = DB.get('users');
  const userFilter = document.getElementById('auditUserFilter');
  users.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u.username; opt.textContent = u.username;
    userFilter.appendChild(opt);
  });

  // Defaults for date range
  const today = new Date().toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0];
  document.getElementById('auditDateTo').value   = today;
  document.getElementById('auditDateFrom').value = monthAgo;

  ['auditTypeFilter','auditUserFilter','auditDateFrom','auditDateTo','auditSearch'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyAuditFilters);
    document.getElementById(id)?.addEventListener('change', applyAuditFilters);
  });

  document.getElementById('exportAuditBtn')?.addEventListener('click', exportAudit);

  applyAuditFilters();
});

function applyAuditFilters() {
  const type   = document.getElementById('auditTypeFilter')?.value||'';
  const user   = document.getElementById('auditUserFilter')?.value||'';
  const from   = document.getElementById('auditDateFrom')?.value||'';
  const to     = document.getElementById('auditDateTo')?.value||'';
  const search = document.getElementById('auditSearch')?.value.toLowerCase()||'';

  filteredLogs = DB.get('auditLog').filter(l => {
    if (type && !matchType(l.action, type)) return false;
    if (user && l.username !== user) return false;
    if (from && l.timestamp < from) return false;
    if (to   && l.timestamp.split('T')[0] > to) return false;
    if (search && !l.detail.toLowerCase().includes(search) &&
                  !l.username.toLowerCase().includes(search) &&
                  !l.action.toLowerCase().includes(search)) return false;
    return true;
  }).sort((a,b) => b.timestamp.localeCompare(a.timestamp));

  auditPage = 1;
  document.getElementById('auditCount').textContent = `${filteredLogs.length} events found`;
  renderAuditTable();
}

function matchType(action, type) {
  const map = {
    login:       ['LOGIN','LOGOUT','LOGIN_FAILED'],
    data_change: ['RECORD_CREATED','RECORD_AMENDED','RECORD_DELETED','ASSESSMENT_ADDED'],
    upload:      ['PDF_UPLOAD','UPLOAD'],
    user_change: ['USER_CREATED','ROLE_CHANGED'],
    security:    ['LOGIN_FAILED','ACCESS_DENIED'],
  };
  return (map[type]||[]).includes(action);
}

function renderAuditTable() {
  const tbody = document.getElementById('auditTableBody');
  const start = (auditPage-1)*auditPerPage;
  const page  = filteredLogs.slice(start, start+auditPerPage);

  if (!page.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="table-loading">No audit events found.</td></tr>';
    document.getElementById('auditPagination').innerHTML = '';
    return;
  }

  const actionColors = {
    LOGIN:'var(--primary)', LOGOUT:'var(--text-3)', LOGIN_FAILED:'var(--red)',
    RECORD_CREATED:'var(--green)', RECORD_AMENDED:'var(--amber)', RECORD_DELETED:'var(--red)',
    ASSESSMENT_ADDED:'var(--teal)', PDF_UPLOAD:'var(--teal)', USER_CREATED:'var(--purple)',
    RECORD_VIEWED:'var(--text-2)', EXPORT:'var(--amber)', default:'var(--text-2)'
  };

  tbody.innerHTML = page.map(l => {
    const color = actionColors[l.action]||actionColors.default;
    const resultClass = l.result==='SUCCESS'?'outcome-success':'outcome-fail';
    return `<tr>
      <td style="font-size:.78rem;color:var(--text-3);white-space:nowrap">${fmtDateTime(l.timestamp)}</td>
      <td><strong>${l.username}</strong></td>
      <td>${getRoleBadge(l.role)}</td>
      <td><span style="color:${color};font-weight:600;font-size:.8rem">${l.action.replace(/_/g,' ')}</span></td>
      <td><span class="badge badge-gray">${l.recordType}</span></td>
      <td style="font-size:.78rem;color:var(--text-2);max-width:280px;white-space:normal">${l.detail}</td>
      <td style="font-size:.72rem;color:var(--text-3)">${l.ip||'—'}</td>
      <td><span class="${resultClass}" style="font-weight:700;font-size:.8rem">${l.result}</span></td>
    </tr>`;
  }).join('');

  renderPagination(document.getElementById('auditPagination'), filteredLogs.length, auditPerPage, auditPage,
    pg => { auditPage = pg; renderAuditTable(); });
}

function exportAudit() {
  const headers = ['Timestamp','Username','Role','Action','Record Type','Detail','IP','Result'];
  const rows = filteredLogs.map(l => [fmtDateTime(l.timestamp),l.username,l.role,l.action,l.recordType,l.detail,l.ip||'—',l.result]);
  exportCSV('audit_log_export.csv', headers, rows);
  showToast('Audit log exported.', 'success');
}
