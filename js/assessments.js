/* ============================================================
   assessments.js — Assessment upload and management
   ============================================================ */

let allAssessments = [], filteredAss = [], assPage = 1, assPerPage = 15;

document.addEventListener('DOMContentLoaded', () => {
  const session = Auth.requireAuth();
  if (!session) return;

  allAssessments = DB.get('assessments');

  // Upload button
  const uploadBtn = document.getElementById('uploadAssessmentBtn');
  if (uploadBtn) {
    if (!Auth.can('canUpload')) uploadBtn.style.display = 'none';
    uploadBtn.addEventListener('click', () => openUploadModal(null));
  }

  // Populate filters
  populateSelect('#assmtBaseFilter', DB.get('bases').filter(b=>b.status==='active'), 'id', 'name', true);

  // Filter events
  ['assmtBaseFilter','assmtMonthFilter','assmtYearFilter','assmtSearch'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyAssFilters);
    document.getElementById(id)?.addEventListener('change', applyAssFilters);
  });

  // Upload modal
  document.getElementById('uploadModalClose')?.addEventListener('click', closeUploadModal);
  document.getElementById('uploadCancel')?.addEventListener('click', closeUploadModal);
  document.getElementById('assessmentForm')?.addEventListener('submit', handleAssessmentSubmit);

  // Base / personnel cascade
  document.getElementById('af_base')?.addEventListener('change', populatePersonnelForBase);

  // Auto-calculate percentage
  ['af_maxmarks','af_marks'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', calcPct);
  });

  // PDF upload zone
  initUploadZone();

  // Export
  document.getElementById('exportAssmtBtn')?.addEventListener('click', exportAssCSV);

  // Check URL params
  const params = new URLSearchParams(window.location.search);
  const personnelId = params.get('personnel');
  if (personnelId && Auth.can('canUpload')) {
    setTimeout(() => openUploadModal(null, personnelId), 300);
  }

  applyAssFilters();
});

function applyAssFilters() {
  const base   = document.getElementById('assmtBaseFilter')?.value||'';
  const month  = parseInt(document.getElementById('assmtMonthFilter')?.value)||0;
  const year   = parseInt(document.getElementById('assmtYearFilter')?.value)||2026;
  const search = document.getElementById('assmtSearch')?.value.toLowerCase()||'';
  const personnel = DB.get('personnel');

  filteredAss = DB.get('assessments').filter(a => {
    const p = personnel.find(p => p.id === a.personnelId);
    if (!p) return false;
    if (base  && p.baseId !== base) return false;
    if (month && a.month !== month) return false;
    if (year  && a.year  !== year)  return false;
    if (search && !p.name.toLowerCase().includes(search)) return false;
    return true;
  }).sort((a,b) => new Date(b.assessmentDate) - new Date(a.assessmentDate));

  assPage = 1;
  document.getElementById('assmtCount').textContent = `${filteredAss.length} records found`;
  renderAssTable();
}

function renderAssTable() {
  const tbody = document.getElementById('assmtTableBody');
  const start = (assPage-1)*assPerPage;
  const page  = filteredAss.slice(start, start+assPerPage);
  const personnel = DB.get('personnel');

  if (!page.length) {
    tbody.innerHTML = '<tr><td colspan="11" class="table-loading">No assessments found.</td></tr>';
    document.getElementById('assmtPagination').innerHTML = '';
    return;
  }

  tbody.innerHTML = page.map(a => {
    const p = personnel.find(p => p.id === a.personnelId);
    const pctColor = a.percentage>=85?'var(--green)':a.percentage>=70?'var(--primary)':a.percentage>=55?'var(--amber)':'var(--red)';
    return `<tr>
      <td>${fmtDate(a.assessmentDate)}</td>
      <td><strong>${p?.name||'—'}</strong></td>
      <td>${getBaseName(p?.baseId||'')}</td>
      <td>${MONTHS[a.month]} ${a.year}</td>
      <td>${a.maxMarks}</td>
      <td>${a.marksObtained}</td>
      <td><strong style="color:${pctColor}">${a.percentage}%</strong></td>
      <td><span class="${getSkillClass(a.skillLevel)}">${a.skillLevel}</span></td>
      <td style="font-size:.75rem;color:var(--text-3)">${a.examinerId||'—'}</td>
      <td>
        ${a.pdfName ? `<button class="btn-sm btn-outline" onclick="viewPDF_('${a.pdfName}')">📄 View</button>` : '<span class="text-muted">—</span>'}
      </td>
      <td style="display:flex;gap:.3rem">
        ${Auth.can('canEdit') ? `<button class="btn-icon" onclick="openUploadModal('${a.id}')" title="Edit">
          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
        </button>` : ''}
        ${Auth.can('canDelete') ? `<button class="btn-icon" onclick="deleteAssessment('${a.id}')" title="Delete" style="color:var(--red)">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
        </button>` : ''}
      </td>
    </tr>`;
  }).join('');

  renderPagination(document.getElementById('assmtPagination'), filteredAss.length, assPerPage, assPage,
    pg => { assPage = pg; renderAssTable(); });
}

function openUploadModal(id, prePersonnelId) {
  if (!Auth.can('canUpload')) return;

  const modal = document.getElementById('uploadModal');
  const form  = document.getElementById('assessmentForm');
  form.reset();
  document.getElementById('af_pct_display').textContent = '—';

  populateSelect('#af_base', DB.get('bases').filter(b=>b.status==='active'), 'id', 'name');

  if (id) {
    const a = DB.getOne('assessments', id);
    if (!a) return;
    document.getElementById('uploadModalTitle').textContent = 'Edit Assessment';
    document.getElementById('af_edit_id').value = id;
    const p = DB.getOne('personnel', a.personnelId);
    if (p) {
      document.getElementById('af_base').value = p.baseId;
      populatePersonnelForBase();
      setTimeout(() => document.getElementById('af_personnel').value = a.personnelId, 50);
    }
    document.getElementById('af_year').value     = a.year;
    document.getElementById('af_month').value    = a.month;
    document.getElementById('af_date').value     = a.assessmentDate;
    document.getElementById('af_examiner').value = a.examinerId||'';
    document.getElementById('af_maxmarks').value = a.maxMarks;
    document.getElementById('af_marks').value    = a.marksObtained;
    document.getElementById('af_skill').value    = a.skillLevel;
    document.getElementById('af_remarks').value  = a.remarks||'';
    calcPct();
  } else {
    document.getElementById('uploadModalTitle').textContent = 'Upload Monthly Assessment';
    document.getElementById('af_edit_id').value = '';
    // Default date to today
    document.getElementById('af_date').value = new Date().toISOString().split('T')[0];
    // Default year
    document.getElementById('af_year').value = '2026';
    populatePersonnelForBase();
    if (prePersonnelId) {
      const p = DB.getOne('personnel', prePersonnelId);
      if (p) {
        document.getElementById('af_base').value = p.baseId;
        populatePersonnelForBase();
        setTimeout(() => document.getElementById('af_personnel').value = prePersonnelId, 50);
      }
    }
  }
  modal.style.display = 'flex';
}

function closeUploadModal() {
  document.getElementById('uploadModal').style.display = 'none';
}

function populatePersonnelForBase() {
  const baseId = document.getElementById('af_base')?.value||'';
  const person = DB.get('personnel').filter(p => !baseId || p.baseId === baseId);
  populateSelect('#af_personnel', person, 'id', 'name');
}

function calcPct() {
  const max = parseFloat(document.getElementById('af_maxmarks')?.value)||0;
  const obt = parseFloat(document.getElementById('af_marks')?.value)||0;
  const el  = document.getElementById('af_pct_display');
  if (max > 0) {
    const pct = parseFloat(((obt/max)*100).toFixed(1));
    el.textContent = `${pct}%`;
    el.style.color = pct>=85?'var(--green)':pct>=70?'var(--primary)':pct>=55?'var(--amber)':'var(--red)';
    // Auto-set skill level
    const skill = pct>=85?'A':pct>=70?'B':pct>=55?'C':'Beginner';
    document.getElementById('af_skill').value = skill;
  } else {
    el.textContent = '—';
  }
}

function initUploadZone() {
  const zone = document.getElementById('uploadZone');
  const input = document.getElementById('af_pdf');
  const validation = document.getElementById('uploadValidation');
  if (!zone || !input) return;

  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) validateFile(e.dataTransfer.files[0]);
  });

  input.addEventListener('change', () => { if (input.files[0]) validateFile(input.files[0]); });
}

function validateFile(file) {
  const validation = document.getElementById('uploadValidation');
  validation.style.display = '';
  const settings = DB.get('assmtSettings')[0] || { maxFileMB: 10 };
  const maxBytes = (settings.maxFileMB||10) * 1024 * 1024;

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    validation.className = 'upload-validation invalid';
    validation.textContent = '✕ Invalid file type. Only PDF files are accepted.';
    return false;
  }
  if (file.size > maxBytes) {
    validation.className = 'upload-validation invalid';
    validation.textContent = `✕ File too large (${(file.size/1048576).toFixed(1)}MB). Maximum ${settings.maxFileMB}MB allowed.`;
    return false;
  }
  validation.className = 'upload-validation valid';
  validation.textContent = `✓ ${file.name} — ${(file.size/1024).toFixed(1)}KB — Valid PDF`;
  // Update drop zone
  document.querySelector('.upload-text strong').textContent = `📄 ${file.name}`;
  return true;
}

function handleAssessmentSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById('af_edit_id').value;
  const max = parseFloat(document.getElementById('af_maxmarks').value)||100;
  const obt = parseFloat(document.getElementById('af_marks').value)||0;
  const pct = parseFloat(((obt/max)*100).toFixed(1));
  const pdfFile = document.getElementById('af_pdf')?.files[0];

  // Validate PDF if new
  if (!editId && !pdfFile) {
    // Optional — allow no PDF
  }
  if (pdfFile && !validateFile(pdfFile)) return;

  const personnelId = document.getElementById('af_personnel').value;
  const p = DB.getOne('personnel', personnelId);

  const data = {
    personnelId,
    assessmentDate: document.getElementById('af_date').value,
    month:          parseInt(document.getElementById('af_month').value),
    year:           parseInt(document.getElementById('af_year').value),
    maxMarks:       max,
    marksObtained:  obt,
    percentage:     pct,
    skillLevel:     document.getElementById('af_skill').value,
    examinerId:     document.getElementById('af_examiner').value.trim(),
    remarks:        document.getElementById('af_remarks').value.trim(),
    pdfName:        pdfFile ? `assessment_${personnelId}_m${document.getElementById('af_month').value}_${document.getElementById('af_year').value}.pdf` : (editId ? DB.getOne('assessments',editId)?.pdfName : null),
    uploadedBy:     Auth.getSession()?.userId,
    createdAt:      new Date().toISOString(),
  };

  if (editId) {
    const old = DB.getOne('assessments', editId);
    DB.update('assessments', editId, data);
    Auth.audit('RECORD_AMENDED', 'ASSESSMENT',
      `Amended assessment for ${p?.name||personnelId} – ${MONTHS[data.month]} ${data.year}. Old: ${old?.marksObtained}, New: ${obt}`,
      'SUCCESS');
    showToast('Assessment updated.', 'success');
  } else {
    DB.insert('assessments', data);
    Auth.audit('ASSESSMENT_ADDED', 'ASSESSMENT',
      `Uploaded assessment for ${p?.name||personnelId} – ${MONTHS[data.month]} ${data.year}`,
      'SUCCESS');
    if (pdfFile) Auth.audit('PDF_UPLOAD', 'FILE', `PDF uploaded: ${data.pdfName}`, 'SUCCESS');
    showToast('Assessment uploaded successfully.', 'success');
  }

  closeUploadModal();
  applyAssFilters();
}

async function deleteAssessment(id) {
  if (!Auth.can('canDelete')) return;
  const a = DB.getOne('assessments', id);
  if (!a || !await confirmDialog(`Delete assessment from ${MONTHS[a.month]} ${a.year}? This action is logged.`)) return;

  DB.delete('assessments', id);
  Auth.audit('RECORD_DELETED', 'ASSESSMENT', `Deleted assessment ID ${id}`, 'SUCCESS');
  showToast('Assessment deleted.', 'success');
  applyAssFilters();
}

function viewPDF_(name) {
  showToast(`PDF: ${name} — In production this fetches from authenticated secure storage.`, 'info', 5000);
}

function exportAssCSV() {
  const personnel = DB.get('personnel');
  const headers = ['Date','Personnel','Air Base','Month','Year','Max Marks','Obtained','%','Skill Level','Examiner'];
  const rows = filteredAss.map(a => {
    const p = personnel.find(p => p.id === a.personnelId);
    return [fmtDate(a.assessmentDate), p?.name||'—', getBaseName(p?.baseId||''), MONTHS[a.month], a.year, a.maxMarks, a.marksObtained, `${a.percentage}%`, a.skillLevel, a.examinerId||'—'];
  });
  exportCSV('assessments_export.csv', headers, rows);
  Auth.audit('EXPORT','ASSESSMENT','Exported assessments CSV','SUCCESS');
}
