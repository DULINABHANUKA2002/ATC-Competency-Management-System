/* ============================================================
   users.js — User Management page
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const session = Auth.requireRole('admin', 'director');
  if (!session) return;

  renderUsersTable('all');
  renderPermissionsMatrix();

  document.querySelectorAll('.role-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderUsersTable(tab.dataset.filter);
    });
  });

  document.getElementById('userSearch')?.addEventListener('input', e => {
    renderUsersTable(document.querySelector('.role-tab.active')?.dataset.filter||'all', e.target.value);
  });

  const addBtn = document.getElementById('addUserBtn');
  if (addBtn && !Auth.can('canManageUsers')) { addBtn.style.display='none'; }
  addBtn?.addEventListener('click', () => openUserEdit(null));

  document.getElementById('userEditClose')?.addEventListener('click', closeUserEdit);
  document.getElementById('userEditCancel')?.addEventListener('click', closeUserEdit);
  document.getElementById('userEditForm')?.addEventListener('submit', handleUserSubmit);

  populateSelect('#ue_base', [{ id:'all', name:'All Bases' }, ...DB.get('bases').filter(b=>b.status==='active')], 'id', 'name');
});

function renderUsersTable(filter, search='') {
  let users = DB.get('users');
  if (filter && filter !== 'all') users = users.filter(u => u.role === filter);
  if (search) users = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()) || u.name.toLowerCase().includes(search.toLowerCase()));

  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = users.map(u => `<tr>
    <td><strong>${u.username}</strong></td>
    <td>${u.name}</td>
    <td>${getRoleBadge(u.role)}</td>
    <td>${u.baseId === 'all' ? '<span class="badge badge-blue">All Bases</span>' : getBaseName(u.baseId)}</td>
    <td>${getStatusBadge(u.status)}</td>
    <td style="font-size:.78rem;color:var(--text-3)">${fmtDateTime(u.lastLogin)}</td>
    <td style="display:flex;gap:.3rem">
      ${Auth.can('canManageUsers') ? `
        <button class="btn-icon" onclick="openUserEdit('${u.id}')" title="Edit">
          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
        </button>
        ${u.id !== Auth.getSession()?.userId ? `<button class="btn-danger btn-sm" onclick="deleteUser('${u.id}')">Remove</button>` : ''}
      ` : ''}
    </td>
  </tr>`).join('') || '<tr><td colspan="7" class="table-loading">No users found.</td></tr>';
}

function renderPermissionsMatrix() {
  const tbody = document.getElementById('permissionsBody');
  tbody.innerHTML = PERMISSIONS_MATRIX.map(row => `<tr>
    <td>${row.label}</td>
    <td class="role-col"><span class="${row.director?'perm-yes':'perm-no'}">${row.director?'✓':'✗'}</span></td>
    <td class="role-col"><span class="${row.admin?'perm-yes':'perm-no'}">${row.admin?'✓':'✗'}</span></td>
    <td class="role-col"><span class="${row.user?'perm-yes':'perm-no'}">${row.user?'✓':'✗'}</span></td>
    <td class="role-col"><span class="${row.viewer?'perm-yes':'perm-no'}">${row.viewer?'✓':'✗'}</span></td>
  </tr>`).join('');
}

function openUserEdit(id) {
  const modal = document.getElementById('userEditModal');
  populateSelect('#ue_base', [{ id:'all', name:'All Bases' }, ...DB.get('bases').filter(b=>b.status==='active')], 'id', 'name');
  if (id) {
    const u = DB.getOne('users', id);
    document.getElementById('userEditTitle').textContent = 'Edit User';
    document.getElementById('ue_id').value       = id;
    document.getElementById('ue_username').value = u.username;
    document.getElementById('ue_name').value     = u.name;
    document.getElementById('ue_role').value     = u.role;
    document.getElementById('ue_base').value     = u.baseId;
    document.getElementById('ue_status').value   = u.status;
    document.getElementById('ue_password').value = '';
  } else {
    document.getElementById('userEditTitle').textContent = 'Add User';
    document.getElementById('ue_id').value = '';
    document.getElementById('userEditForm').reset();
  }
  modal.style.display = 'flex';
}

function closeUserEdit() { document.getElementById('userEditModal').style.display = 'none'; }

function handleUserSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('ue_id').value;
  const pw = document.getElementById('ue_password').value;
  const data = {
    username: document.getElementById('ue_username').value.trim(),
    name:     document.getElementById('ue_name').value.trim(),
    role:     document.getElementById('ue_role').value,
    baseId:   document.getElementById('ue_base').value,
    status:   document.getElementById('ue_status').value,
  };
  if (pw) data.passwordHash = pw;

  if (id) {
    DB.update('users', id, data);
    Auth.audit('RECORD_AMENDED','USER',`Amended user: ${data.username} (role: ${data.role})`,'SUCCESS');
    showToast('User updated.', 'success');
  } else {
    if (!pw) { showToast('Password is required for new users.', 'error'); return; }
    DB.insert('users', { ...data, passwordHash: pw, lastLogin: null });
    Auth.audit('USER_CREATED','USER',`Created user: ${data.username} (role: ${data.role}, base: ${data.baseId})`,'SUCCESS');
    showToast('User created.', 'success');
  }
  closeUserEdit();
  renderUsersTable('all');
}

async function deleteUser(id) {
  const u = DB.getOne('users', id);
  if (!await confirmDialog(`Remove user "${u?.username}"? This is logged.`)) return;
  DB.delete('users', id);
  Auth.audit('RECORD_DELETED','USER',`Removed user: ${u?.username}`,'SUCCESS');
  showToast('User removed.', 'success');
  renderUsersTable('all');
}
