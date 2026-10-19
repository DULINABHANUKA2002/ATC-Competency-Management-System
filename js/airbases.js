/* ============================================================
   airbases.js — Air Bases page
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const session = Auth.requireAuth();
  if (!session) return;

  renderBaseGrid();

  // Add button
  const addBtn = document.getElementById('addBaseBtn');
  if (addBtn) {
    if (!Auth.can('canManageBases')) addBtn.style.display = 'none';
    addBtn.addEventListener('click', () => openBaseEdit(null));
  }

  // Modal close
  document.getElementById('baseModalClose')?.addEventListener('click', () =>
    document.getElementById('baseModal').style.display = 'none');
  document.getElementById('baseEditClose')?.addEventListener('click', () =>
    document.getElementById('baseEditModal').style.display = 'none');
  document.getElementById('baseEditCancel')?.addEventListener('click', () =>
    document.getElementById('baseEditModal').style.display = 'none');

  document.getElementById('baseEditForm')?.addEventListener('submit', handleBaseSubmit);
});

function renderBaseGrid() {
  const bases     = DB.get('bases');
  const personnel = DB.get('personnel');
  const assessments = DB.get('assessments');
  const grid      = document.getElementById('baseGrid');
  if (!grid) return;

  const session = Auth.getSession();

  grid.innerHTML = bases.map(b => {
    const persList  = personnel.filter(p => p.baseId === b.id);
    const skillA    = persList.filter(p => p.skillLevel === 'A').length;
    const thisMonth = assessments.filter(a => a.year === 2026 && a.month === new Date().getMonth()+1 &&
      persList.some(p => p.id === a.personnelId)).length;
    const avgScores = assessments.filter(a => a.year === 2026 && persList.some(p => p.id === a.personnelId));
    const avg = avgScores.length ? (avgScores.reduce((s,a)=>s+a.percentage,0)/avgScores.length).toFixed(1) : '—';

    return `<div class="base-card" onclick="viewBaseDetail('${b.id}')">
      <div class="base-card-header">
        <div class="base-icon">🛫</div>
        ${getStatusBadge(b.status)}
      </div>
      <div class="base-name">${b.name}</div>
      <div class="base-location">📍 ${b.location}</div>
      <div class="base-stats">
        <div class="base-stat">
          <div class="base-stat-value">${persList.length}</div>
          <div class="base-stat-label">Personnel</div>
        </div>
        <div class="base-stat">
          <div class="base-stat-value" style="color:var(--green)">${skillA}</div>
          <div class="base-stat-label">Level A</div>
        </div>
        <div class="base-stat">
          <div class="base-stat-value" style="color:var(--teal)">${thisMonth}</div>
          <div class="base-stat-label">Tests/Month</div>
        </div>
        <div class="base-stat">
          <div class="base-stat-value">${avg}${avg!=='—'?'%':''}</div>
          <div class="base-stat-label">Avg Score</div>
        </div>
      </div>
      <div class="base-footer">
        <span style="font-size:.75rem;color:var(--text-3)">CO: ${b.co||'—'}</span>
        ${Auth.can('canManageBases') ? `
          <div style="display:flex;gap:.4rem">
            <button class="btn-sm btn-outline" onclick="event.stopPropagation();openBaseEdit('${b.id}')">Edit</button>
            <button class="btn-sm" style="background:rgba(239,68,68,.15);color:#f87171;border:1px solid rgba(239,68,68,.3);border-radius:6px;padding:.25rem .65rem;font-size:.75rem;font-weight:600;cursor:pointer;transition:all .2s" onmouseover="this.style.background='rgba(239,68,68,.3)'" onmouseout="this.style.background='rgba(239,68,68,.15)'" onclick="event.stopPropagation();confirmDeleteBase('${b.id}','${b.name}')">Delete</button>
          </div>` : ''}
      </div>
    </div>`;
  }).join('');
}

function viewBaseDetail(baseId) {
  const base      = DB.getOne('bases', baseId);
  const personnel = DB.get('personnel').filter(p => p.baseId === baseId);
  const asses     = DB.get('assessments').filter(a => personnel.some(p => p.id === a.personnelId) && a.year===2026);
  const avg = asses.length ? (asses.reduce((s,a)=>s+a.percentage,0)/asses.length).toFixed(1) : '—';

  const skillCount = { A:0, B:0, C:0, Beginner:0 };
  personnel.forEach(p => { if (skillCount[p.skillLevel]!==undefined) skillCount[p.skillLevel]++; });

  const modal = document.getElementById('baseModal');
  document.getElementById('baseModalTitle').textContent = `Air Base: ${base.name}`;
  document.getElementById('baseModalBody').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
      <div><label>LOCATION</label><div style="color:var(--text-1);font-size:.95rem">${base.location}</div></div>
      <div><label>STATUS</label>${getStatusBadge(base.status)}</div>
      <div><label>COMMANDING OFFICER</label><div style="color:var(--text-1)">${base.co||'—'}</div></div>
      <div><label>TOTAL PERSONNEL</label><div style="font-size:1.2rem;font-weight:700;color:var(--primary)">${personnel.length}</div></div>
      <div><label>2026 AVG COMPETENCY</label><div style="font-size:1.2rem;font-weight:700;color:var(--teal)">${avg}${avg!=='—'?'%':''}</div></div>
      <div><label>TOTAL ASSESSMENTS</label><div style="font-size:1.2rem;font-weight:700;color:var(--amber)">${asses.length}</div></div>
    </div>
    <div style="font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-2);margin-bottom:.75rem">SKILL DISTRIBUTION</div>
    ${Object.entries(skillCount).map(([k,v]) => {
      const pct = personnel.length ? Math.round(v/personnel.length*100) : 0;
      const colors = { A:'var(--green)', B:'var(--primary)', C:'var(--amber)', Beginner:'var(--text-3)' };
      return `<div class="skill-bar-row">
        <div class="skill-bar-label">Level ${k}</div>
        <div class="skill-bar-track"><div class="skill-bar-fill" style="width:${pct}%;background:${colors[k]}"></div></div>
        <div class="skill-bar-count">${v}</div>
      </div>`;
    }).join('')}
    <div style="font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-2);margin:1.25rem 0 .75rem">PERSONNEL</div>
    <div style="overflow-x:auto">
    <table class="data-table">
      <thead><tr><th>Rank</th><th>Name</th><th>Category</th><th>Skill</th><th>Status</th></tr></thead>
      <tbody>
        ${personnel.map(p => `<tr>
          <td>${p.rank}</td>
          <td><strong>${p.name}</strong></td>
          <td>${getCategoryName(p.categoryId)}</td>
          <td><span class="${getSkillClass(p.skillLevel)}">${p.skillLevel}</span></td>
          <td>${getStatusBadge(p.status)}</td>
        </tr>`).join('')}
      </tbody>
    </table></div>
    <div class="modal-footer">
      <a href="personnel.html?base=${baseId}" class="btn-outline">View All Personnel →</a>
    </div>
  `;
  modal.style.display = 'flex';
}

function openBaseEdit(id) {
  const modal = document.getElementById('baseEditModal');
  const title = document.getElementById('baseEditTitle');
  const form  = document.getElementById('baseEditForm');

  form.dataset.editId = id || '';
  if (id) {
    const b = DB.getOne('bases', id);
    title.textContent = 'Edit Air Base';
    document.getElementById('be_name').value     = b.name;
    document.getElementById('be_location').value = b.location;
    document.getElementById('be_status').value   = b.status;
    document.getElementById('be_co').value        = b.co||'';
  } else {
    title.textContent = 'Add Air Base';
    form.reset();
  }
  modal.style.display = 'flex';
}

function handleBaseSubmit(e) {
  e.preventDefault();
  const id   = e.target.dataset.editId;
  const data = {
    name:     document.getElementById('be_name').value.trim(),
    location: document.getElementById('be_location').value.trim(),
    status:   document.getElementById('be_status').value,
    co:       document.getElementById('be_co').value.trim(),
  };

  if (id) {
    DB.update('bases', id, data);
    Auth.audit('RECORD_AMENDED', 'BASE', `Amended base: ${data.name}`, 'SUCCESS');
    showToast('Air base updated.', 'success');
  } else {
    const nb = DB.insert('bases', data);
    Auth.audit('RECORD_CREATED', 'BASE', `Added base: ${data.name}`, 'SUCCESS');
    showToast('Air base added.', 'success');
  }

  document.getElementById('baseEditModal').style.display = 'none';
  renderBaseGrid();
}

function confirmDeleteBase(id, name) {
  // Build or reuse the confirm modal
  let overlay = document.getElementById('baseDeleteModal');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'baseDeleteModal';
    overlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1000;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
    overlay.innerHTML = `
      <div style="background:var(--surface-2,#1e2535);border:1px solid rgba(239,68,68,.3);border-radius:16px;padding:2rem;max-width:420px;width:90%;box-shadow:0 24px 48px rgba(0,0,0,.5);animation:fadeInUp .25s ease">
        <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1rem">
          <div style="width:40px;height:40px;border-radius:50%;background:rgba(239,68,68,.15);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0">🗑️</div>
          <h3 style="margin:0;font-size:1.1rem;color:var(--text-1,#e2e8f0)">Remove Air Base</h3>
        </div>
        <p id="baseDeleteMsg" style="margin:0 0 1.5rem;color:var(--text-2,#94a3b8);line-height:1.6"></p>
        <div style="display:flex;gap:.75rem;justify-content:flex-end">
          <button id="baseDeleteCancel" style="padding:.5rem 1.25rem;border-radius:8px;border:1px solid var(--border,rgba(255,255,255,.08));background:transparent;color:var(--text-2,#94a3b8);cursor:pointer;font-size:.875rem">Cancel</button>
          <button id="baseDeleteConfirm" style="padding:.5rem 1.25rem;border-radius:8px;border:none;background:#ef4444;color:#fff;cursor:pointer;font-size:.875rem;font-weight:600">Remove Base</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.getElementById('baseDeleteCancel').addEventListener('click', () => overlay.style.display = 'none');
  }

  document.getElementById('baseDeleteMsg').textContent =
    `Are you sure you want to permanently remove "${name}"? This cannot be undone.`;

  const confirmBtn = document.getElementById('baseDeleteConfirm');
  // Clone to remove previous listeners
  const fresh = confirmBtn.cloneNode(true);
  confirmBtn.replaceWith(fresh);
  fresh.addEventListener('click', () => {
    DB.delete('bases', id);
    Auth.audit('RECORD_DELETED', 'BASE', `Removed base: ${name}`, 'SUCCESS');
    showToast(`"${name}" has been removed.`, 'success');
    overlay.style.display = 'none';
    renderBaseGrid();
  });

  overlay.style.display = 'flex';
}
