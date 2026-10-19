/* ============================================================
   settings.js — System Settings page
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const session = Auth.requireRole('admin');
  if (!session) return;

  renderSkillLevels();
  renderCategories();
  loadRankingConfig();
  loadAssmtSettings();

  document.getElementById('addSkillBtn')?.addEventListener('click', () => openSettingEdit('skill', null));
  document.getElementById('addCategoryBtn')?.addEventListener('click', () => openSettingEdit('category', null));

  document.getElementById('rankingConfigForm')?.addEventListener('submit', saveRankingConfig);
  document.getElementById('assmtSettingsForm')?.addEventListener('submit', saveAssmtSettings);

  document.getElementById('rc_method')?.addEventListener('change', function() {
    document.getElementById('weightedOptions').style.display = this.value === 'weighted' ? 'grid' : 'none';
  });

  document.getElementById('settingEditClose')?.addEventListener('click', closeSettingEdit);
  document.getElementById('settingEditCancel')?.addEventListener('click', closeSettingEdit);
  document.getElementById('settingEditForm')?.addEventListener('submit', handleSettingSubmit);
});

function renderSkillLevels() {
  const list = document.getElementById('skillLevelsList');
  const items = DB.get('skillLevels');
  list.innerHTML = items.map(s => `<div class="settings-list-item">
    <div>
      <div class="settings-list-item-label"><span class="${getSkillClass(s.name)}">${s.name}</span></div>
      <div class="settings-list-item-sub">${s.description}</div>
    </div>
    <div class="settings-list-actions">
      <button class="btn-icon" onclick="openSettingEdit('skill','${s.id}')" title="Edit">
        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
      </button>
    </div>
  </div>`).join('') || '<div class="settings-list-item"><span class="text-muted">None configured.</span></div>';
}

function renderCategories() {
  const list = document.getElementById('categoriesList');
  const items = DB.get('categories');
  list.innerHTML = items.map(c => `<div class="settings-list-item">
    <div class="settings-list-item-label">${c.name}</div>
    <div class="settings-list-actions">
      <button class="btn-icon" onclick="openSettingEdit('category','${c.id}')" title="Edit">
        <svg viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
      </button>
      <button class="btn-danger btn-sm" onclick="deleteCategory('${c.id}')">✕</button>
    </div>
  </div>`).join('') || '<div class="settings-list-item"><span class="text-muted">None configured.</span></div>';
}

function loadRankingConfig() {
  const configs = DB.get('rankingConfig');
  const c = configs[0] || {};
  if (c.method)    document.getElementById('rc_method').value    = c.method;
  if (c.tiebreak)  document.getElementById('rc_tiebreak').value  = c.tiebreak;
  if (c.wAnnual)   document.getElementById('rc_w_annual').value  = c.wAnnual;
  if (c.wTests)    document.getElementById('rc_w_tests').value   = c.wTests;
  if (c.minTests)  document.getElementById('rc_min_tests').value = c.minTests;
  if (c.method === 'weighted') document.getElementById('weightedOptions').style.display = 'grid';
}

function saveRankingConfig(e) {
  e.preventDefault();
  const data = {
    method:    document.getElementById('rc_method').value,
    tiebreak:  document.getElementById('rc_tiebreak').value,
    wAnnual:   parseInt(document.getElementById('rc_w_annual').value)||60,
    wTests:    parseInt(document.getElementById('rc_w_tests').value)||40,
    minTests:  parseInt(document.getElementById('rc_min_tests').value)||6,
  };
  const existing = DB.get('rankingConfig');
  if (existing[0]) DB.update('rankingConfig', existing[0].id, data);
  else DB.insert('rankingConfig', data);
  Auth.audit('RECORD_AMENDED','SETTINGS','Updated ranking configuration','SUCCESS');
  showToast('Ranking settings saved.', 'success');
}

function loadAssmtSettings() {
  const items = DB.get('assmtSettings');
  const s = items[0] || {};
  if (s.maxMarks)        document.getElementById('as_maxmarks').value       = s.maxMarks;
  if (s.passThreshold)   document.getElementById('as_pass_threshold').value = s.passThreshold;
  if (s.maxFileMB)       document.getElementById('as_max_file').value       = s.maxFileMB;
  if (s.frequency)       document.getElementById('as_freq').value           = s.frequency;
}

function saveAssmtSettings(e) {
  e.preventDefault();
  const data = {
    maxMarks:       parseInt(document.getElementById('as_maxmarks').value)||100,
    passThreshold:  parseInt(document.getElementById('as_pass_threshold').value)||60,
    maxFileMB:      parseInt(document.getElementById('as_max_file').value)||10,
    frequency:      document.getElementById('as_freq').value,
  };
  const existing = DB.get('assmtSettings');
  if (existing[0]) DB.update('assmtSettings', existing[0].id, data);
  else DB.insert('assmtSettings', data);
  Auth.audit('RECORD_AMENDED','SETTINGS','Updated assessment settings','SUCCESS');
  showToast('Assessment settings saved.', 'success');
}

function openSettingEdit(type, id) {
  const modal = document.getElementById('settingEditModal');
  const f2wrap = document.getElementById('se_field2_wrap');
  document.getElementById('se_type').value = type;
  document.getElementById('se_id').value   = id || '';

  if (type === 'skill') {
    document.getElementById('settingEditTitle').textContent = id ? 'Edit Skill Level' : 'Add Skill Level';
    document.getElementById('settingField1Label').textContent = 'Level Name *';
    f2wrap.style.display = '';
    document.getElementById('settingField2Label').textContent = 'Description';
    if (id) {
      const s = DB.getOne('skillLevels', id);
      document.getElementById('se_field1').value = s.name;
      document.getElementById('se_field2').value = s.description||'';
    } else { document.getElementById('se_field1').value=''; document.getElementById('se_field2').value=''; }
  } else {
    document.getElementById('settingEditTitle').textContent = id ? 'Edit Category' : 'Add Category';
    document.getElementById('settingField1Label').textContent = 'Category Name *';
    f2wrap.style.display = 'none';
    if (id) document.getElementById('se_field1').value = DB.getOne('categories',id)?.name||'';
    else document.getElementById('se_field1').value = '';
  }
  modal.style.display = 'flex';
}

function closeSettingEdit() { document.getElementById('settingEditModal').style.display = 'none'; }

function handleSettingSubmit(e) {
  e.preventDefault();
  const type = document.getElementById('se_type').value;
  const id   = document.getElementById('se_id').value;
  const f1   = document.getElementById('se_field1').value.trim();
  const f2   = document.getElementById('se_field2').value.trim();

  if (type === 'skill') {
    const data = { name:f1, description:f2 };
    if (id) DB.update('skillLevels',id,data); else DB.insert('skillLevels',data);
    renderSkillLevels();
  } else {
    const data = { name:f1 };
    if (id) DB.update('categories',id,data); else DB.insert('categories',data);
    renderCategories();
  }
  Auth.audit('RECORD_AMENDED','SETTINGS',`${id?'Updated':'Added'} ${type}: ${f1}`,'SUCCESS');
  showToast('Saved successfully.', 'success');
  closeSettingEdit();
}

async function deleteCategory(id) {
  const c = DB.getOne('categories',id);
  if (!await confirmDialog(`Delete category "${c?.name}"?`)) return;
  DB.delete('categories',id);
  Auth.audit('RECORD_DELETED','SETTINGS',`Deleted category: ${c?.name}`,'SUCCESS');
  showToast('Category deleted.','success');
  renderCategories();
}
