/* ============================================================
   personnel.js — Personnel list & profile
   ============================================================ */

let allP = [], currentPage = 1, perPage = 15, filteredP = [];
let trendChart = null;

document.addEventListener('DOMContentLoaded', () => {
  const session = Auth.requireAuth();
  if (!session) return;

  allP = DB.get('personnel');

  // Pre-filter by base for 'user' role
  if (session.role === 'user' && session.baseId !== 'all') {
    allP = allP.filter(p => p.baseId === session.baseId);
  }

  // Populate filters
  populateSelect('#filterBase', DB.get('bases'), 'id', 'name', true);
  populateSelect('#filterCategory', DB.get('categories'), 'id', 'name', true);

  // Button visibility
  const addBtn = document.getElementById('addPersonnelBtn');
  if (addBtn && !Auth.can('canInput')) addBtn.style.display = 'none';
  if (addBtn) addBtn.addEventListener('click', () => openPersonnelEdit(null));

  // Filters
  ['personnelSearch','filterBase','filterSkill','filterCategory','filterStatus'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyFilters);
    document.getElementById(id)?.addEventListener('change', applyFilters);
  });

  // Modals
  document.getElementById('profileModalClose')?.addEventListener('click', () =>
    document.getElementById('profileModal').style.display = 'none');
  document.getElementById('personnelEditClose')?.addEventListener('click', closePersonnelEdit);
  document.getElementById('personnelEditCancel')?.addEventListener('click', closePersonnelEdit);
  document.getElementById('personnelEditForm')?.addEventListener('submit', handlePersonnelSubmit);

  // Export
  document.getElementById('exportPersonnelBtn')?.addEventListener('click', exportPersonnelCSV);

  // Check URL params
  const params = new URLSearchParams(window.location.search);
  const profileId = params.get('profile');
  const baseFilter = params.get('base');

  if (baseFilter) document.getElementById('filterBase').value = baseFilter;

  applyFilters();

  if (profileId) {
    setTimeout(() => openProfile(profileId), 300);
  }
});

function applyFilters() {
  const search   = document.getElementById('personnelSearch')?.value.toLowerCase()||'';
  const base     = document.getElementById('filterBase')?.value||'';
  const skill    = document.getElementById('filterSkill')?.value||'';
  const category = document.getElementById('filterCategory')?.value||'';
  const status   = document.getElementById('filterStatus')?.value||'';

  filteredP = allP.filter(p => {
    if (base     && p.baseId !== base)         return false;
    if (skill    && p.skillLevel !== skill)     return false;
    if (category && p.categoryId !== category) return false;
    if (status   && p.status !== status)       return false;
    if (search   && !p.name.toLowerCase().includes(search) &&
                    !p.serviceNo.toLowerCase().includes(search)) return false;
    return true;
  });

  currentPage = 1;
  document.getElementById('recordCount').textContent = `${filteredP.length} records found`;
  renderTable();
}

function renderTable() {
  const tbody = document.getElementById('personnelListBody');
  const start = (currentPage - 1) * perPage;
  const page  = filteredP.slice(start, start + perPage);

  if (!page.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="table-loading">No personnel found.</td></tr>';
    document.getElementById('personnelPagination').innerHTML = '';
    return;
  }

  tbody.innerHTML = page.map(p => {
    const stats = getPersonnelStats(p.id, 2026);
    return `<tr>
      <td><span style="font-size:.8rem;color:var(--text-3)">${p.serviceNo}</span></td>
      <td>
        <div style="font-weight:600">${p.name}</div>
        <div style="font-size:.75rem;color:var(--text-3)">${p.rank}</div>
      </td>
      <td>${getBaseName(p.baseId)}</td>
      <td>${getCategoryName(p.categoryId)}</td>
      <td><span class="${getSkillClass(p.skillLevel)}">${p.skillLevel}</span></td>
      <td>${stats.monthlyAvg ? `${stats.monthlyAvg}%` : '<span class="text-muted">—</span>'}</td>
      <td>${stats.annualAvg  ? `${stats.annualAvg}%`  : '<span class="text-muted">—</span>'}</td>
      <td>${getStatusBadge(p.status)}</td>
      <td style="display:flex;gap:.3rem;align-items:center">
        <button class="btn-icon" onclick="openProfile('${p.id}')" title="View Profile">
          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
        </button>
        ${Auth.can('canEdit') ? `<button class="btn-icon" onclick="openPersonnelEdit('${p.id}')" title="Edit">
          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
        </button>` : ''}
      </td>
    </tr>`;
  }).join('');

  renderPagination(document.getElementById('personnelPagination'), filteredP.length, perPage, currentPage,
    pg => { currentPage = pg; renderTable(); });
}

function openProfile(id) {
  const p = DB.getOne('personnel', id);
  if (!p) return;
  const stats = getPersonnelStats(p.id, 2026);
  const asses = (stats.assessments || []).sort((a,b) => a.month - b.month);

  const modal = document.getElementById('profileModal');
  document.getElementById('profileModalTitle').textContent = 'Personnel Profile';

  const initials = p.name.split(' ').filter(w => w[0]?.match(/[A-Z]/)).map(w=>w[0]).join('').slice(0,2) || p.name[0];

  document.getElementById('profileModalBody').innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar">${initials}</div>
      <div class="profile-info">
        <div class="profile-name">${p.name}</div>
        <div class="profile-meta">${p.rank} &nbsp;•&nbsp; ${p.serviceNo} &nbsp;•&nbsp; ${getBaseName(p.baseId)}</div>
        <div style="margin-top:.5rem;display:flex;gap:.5rem;flex-wrap:wrap">
          <span class="badge badge-blue">${getCategoryName(p.categoryId)}</span>
          <span class="badge badge-${p.skillLevel==='A'?'green':p.skillLevel==='B'?'blue':p.skillLevel==='C'?'amber':'gray'}">Level ${p.skillLevel}</span>
          ${getStatusBadge(p.status)}
        </div>
      </div>
    </div>

    <div class="profile-summary-grid">
      <div class="profile-stat"><div class="profile-stat-val">${p.skillLevel}</div><div class="profile-stat-label">Skill Level</div></div>
      <div class="profile-stat"><div class="profile-stat-val">${stats.monthlyAvg||'—'}${stats.monthlyAvg?'%':''}</div><div class="profile-stat-label">Monthly Avg</div></div>
      <div class="profile-stat"><div class="profile-stat-val">${stats.annualAvg||'—'}${stats.annualAvg?'%':''}</div><div class="profile-stat-label">Annual Avg</div></div>
      <div class="profile-stat"><div class="profile-stat-val">${stats.count}/12</div><div class="profile-stat-label">Tests Done</div></div>
    </div>

    <div class="profile-section-title">Monthly Assessment History</div>
    <div class="profile-table-wrap">
    <table class="data-table">
      <thead><tr><th>Month</th><th>Test Date</th><th>Max</th><th>Marks</th><th>%</th><th>Skill</th><th>Examiner</th><th>Remarks</th><th>PDF</th></tr></thead>
      <tbody>
        ${asses.length ? asses.map(a => `<tr>
          <td><strong>${MONTHS[a.month]}</strong></td>
          <td>${fmtDate(a.assessmentDate)}</td>
          <td>${a.maxMarks}</td>
          <td>${a.marksObtained}</td>
          <td><strong style="color:${a.percentage>=85?'var(--green)':a.percentage>=70?'var(--primary)':a.percentage>=55?'var(--amber)':'var(--red)'}">${a.percentage}%</strong></td>
          <td><span class="${getSkillClass(a.skillLevel)}">${a.skillLevel}</span></td>
          <td style="font-size:.78rem;color:var(--text-3)">${a.examinerId||'—'}</td>
          <td style="font-size:.78rem;color:var(--text-3)">${a.remarks||'—'}</td>
          <td><button class="btn-sm btn-outline" onclick="viewPDF('${a.pdfName}')">View</button></td>
        </tr>`).join('') :
        '<tr><td colspan="9" class="table-loading">No assessments recorded yet.</td></tr>'}
      </tbody>
    </table>
    </div>

    <div class="profile-trend-wrap">
      <div style="font-size:.8rem;font-weight:700;text-transform:uppercase;color:var(--text-2);margin-bottom:.5rem">Competency Trend</div>
      <div class="trend-chart-area"><canvas id="profileTrendCanvas"></canvas></div>
    </div>

    <div class="profile-actions">
      ${Auth.can('canInput') ? `<a href="assessments.html?personnel=${p.id}" class="btn-primary">+ Upload Assessment</a>` : ''}
      <button class="btn-outline" onclick="printProfile('${p.id}')">🖨 Print</button>
      ${Auth.can('canEdit') ? `<button class="btn-outline" onclick="openPersonnelEdit('${p.id}')">✏ Edit Profile</button>` : ''}
    </div>
  `;

  modal.style.display = 'flex';

  // Trend chart
  setTimeout(() => {
    const ctx = document.getElementById('profileTrendCanvas');
    if (!ctx || !asses.length) return;
    if (trendChart) trendChart.destroy();
    trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: asses.map(a => MONTHS[a.month].slice(0,3)),
        datasets: [{
          data: asses.map(a => a.percentage),
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56,189,248,0.08)',
          borderWidth: 2,
          pointBackgroundColor: asses.map(a => a.percentage>=85?'#22c55e':a.percentage>=70?'#38bdf8':a.percentage>=55?'#f59e0b':'#ef4444'),
          pointRadius: 5,
          tension: 0.4,
          fill: true,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend:{display:false}, tooltip:{
          backgroundColor:'rgba(13,21,41,.95)',borderColor:'rgba(56,189,248,.3)',borderWidth:1,
          callbacks:{label:c=>`${c.parsed.y}%`}
        }},
        scales: {
          x:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#5a7a9a',font:{size:11}}},
          y:{min:40,max:100,grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#5a7a9a',font:{size:11},callback:v=>`${v}%`}},
        }
      }
    });
  }, 100);
}

function viewPDF(name) {
  showToast(`PDF: ${name} — In production this would open the secured PDF from server storage.`, 'info', 5000);
}

function printProfile(id) {
  showToast('Printing profile… (In production, generates a formatted PDF report)', 'info');
}

function openPersonnelEdit(id) {
  if (!Auth.can('canInput')) return;
  const modal = document.getElementById('personnelEditModal');
  const title = document.getElementById('personnelEditTitle');
  const form  = document.getElementById('personnelEditForm');

  populateSelect('#pe_base', DB.get('bases').filter(b=>b.status==='active'), 'id', 'name');
  populateSelect('#pe_category', DB.get('categories'), 'id', 'name');

  form.dataset.editId = id || '';
  if (id) {
    const p = DB.getOne('personnel', id);
    title.textContent = 'Edit Personnel';
    document.getElementById('pe_service').value  = p.serviceNo;
    document.getElementById('pe_name').value     = p.name;
    document.getElementById('pe_rank').value     = p.rank;
    document.getElementById('pe_base').value     = p.baseId;
    document.getElementById('pe_category').value = p.categoryId;
    document.getElementById('pe_skill').value    = p.skillLevel;
    document.getElementById('pe_joined').value   = p.joined||'';
    document.getElementById('pe_status').value   = p.status;
    document.getElementById('pe_id').value       = id;
  } else {
    title.textContent = 'Add Personnel';
    form.reset();
    document.getElementById('pe_id').value = '';
  }
  modal.style.display = 'flex';
}

function closePersonnelEdit() {
  document.getElementById('personnelEditModal').style.display = 'none';
}

function handlePersonnelSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('pe_id').value;
  const data = {
    serviceNo:  document.getElementById('pe_service').value.trim(),
    name:       document.getElementById('pe_name').value.trim(),
    rank:       document.getElementById('pe_rank').value,
    baseId:     document.getElementById('pe_base').value,
    categoryId: document.getElementById('pe_category').value,
    skillLevel: document.getElementById('pe_skill').value,
    joined:     document.getElementById('pe_joined').value,
    status:     document.getElementById('pe_status').value,
  };

  if (id) {
    DB.update('personnel', id, data);
    Auth.audit('RECORD_AMENDED', 'PERSONNEL', `Amended: ${data.name}`, 'SUCCESS');
    showToast('Personnel record updated.', 'success');
  } else {
    DB.insert('personnel', data);
    Auth.audit('RECORD_CREATED', 'PERSONNEL', `Added: ${data.name}`, 'SUCCESS');
    showToast('Personnel added successfully.', 'success');
  }

  closePersonnelEdit();
  allP = DB.get('personnel');
  if (document.getElementById('profileModal').style.display !== 'none') {
    document.getElementById('profileModal').style.display = 'none';
  }
  applyFilters();
}

function exportPersonnelCSV() {
  const headers = ['Service No.','Name','Rank','Air Base','Category','Skill Level','Status'];
  const rows = filteredP.map(p => [p.serviceNo, p.name, p.rank, getBaseName(p.baseId), getCategoryName(p.categoryId), p.skillLevel, p.status]);
  exportCSV('personnel_export.csv', headers, rows);
  Auth.audit('EXPORT', 'PERSONNEL', 'Exported personnel CSV', 'SUCCESS');
}
