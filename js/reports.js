/* ============================================================
   reports.js — Reports & Analytics
   ============================================================ */

let currentReport = 'individual';
let reportChart   = null;

document.addEventListener('DOMContentLoaded', () => {
  const session = Auth.requireAuth();
  if (!session) return;

  // Report type selection
  document.querySelectorAll('.report-type-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.report-type-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      currentReport = card.dataset.report;
      renderFilters();
    });
  });

  document.getElementById('generateReportBtn')?.addEventListener('click', generateReport);
  document.getElementById('printReportBtn')?.addEventListener('click', () => window.print());
  document.getElementById('exportReportCSV')?.addEventListener('click', exportCurrentReport);

  renderFilters();
});

function renderFilters() {
  const row = document.getElementById('filterRow');
  const bases = DB.get('bases').filter(b=>b.status==='active');
  const personnel = DB.get('personnel');

  const yearOpts = `<option value="2026">2026</option><option value="2025">2025</option>`;
  const baseOpts = bases.map(b=>`<option value="${b.id}">${b.name}</option>`).join('');
  const monthOpts = Array.from({length:12},(_,i)=>`<option value="${i+1}">${MONTHS[i+1]}</option>`).join('');
  const persOpts  = personnel.map(p=>`<option value="${p.id}">${p.name} (${getBaseName(p.baseId)})</option>`).join('');

  const templates = {
    individual: `
      <div class="form-group"><label>Personnel *</label><select id="rf_person" class="mini-select"><option value="">Select Personnel</option>${persOpts}</select></div>
      <div class="form-group"><label>Year</label><select id="rf_year" class="mini-select">${yearOpts}</select></div>`,
    base: `
      <div class="form-group"><label>Air Base *</label><select id="rf_base" class="mini-select"><option value="">Select Base</option>${baseOpts}</select></div>
      <div class="form-group"><label>Year</label><select id="rf_year" class="mini-select">${yearOpts}</select></div>`,
    monthly: `
      <div class="form-group"><label>Air Base</label><select id="rf_base" class="mini-select"><option value="">All Bases</option>${baseOpts}</select></div>
      <div class="form-group"><label>Month *</label><select id="rf_month" class="mini-select">${monthOpts}</select></div>
      <div class="form-group"><label>Year</label><select id="rf_year" class="mini-select">${yearOpts}</select></div>`,
    annual: `
      <div class="form-group"><label>Air Base</label><select id="rf_base" class="mini-select"><option value="">All Bases</option>${baseOpts}</select></div>
      <div class="form-group"><label>Year</label><select id="rf_year" class="mini-select">${yearOpts}</select></div>`,
    missing: `
      <div class="form-group"><label>Air Base</label><select id="rf_base" class="mini-select"><option value="">All Bases</option>${baseOpts}</select></div>
      <div class="form-group"><label>Month *</label><select id="rf_month" class="mini-select">${monthOpts}</select></div>
      <div class="form-group"><label>Year</label><select id="rf_year" class="mini-select">${yearOpts}</select></div>`,
    skill: `
      <div class="form-group"><label>Air Base</label><select id="rf_base" class="mini-select"><option value="">All Bases</option>${baseOpts}</select></div>
      <div class="form-group"><label>Year</label><select id="rf_year" class="mini-select">${yearOpts}</select></div>`,
  };
  row.innerHTML = templates[currentReport]||'';
}

function generateReport() {
  const output  = document.getElementById('reportOutput');
  const content = document.getElementById('reportContent');
  const title   = document.getElementById('reportTitle');
  output.style.display = '';

  const year  = parseInt(document.getElementById('rf_year')?.value)||2026;
  const baseId= document.getElementById('rf_base')?.value||'';
  const month = parseInt(document.getElementById('rf_month')?.value)||0;
  const personId = document.getElementById('rf_person')?.value||'';

  if (reportChart) { reportChart.destroy(); reportChart = null; }

  switch (currentReport) {
    case 'individual': renderIndividualReport(content, title, personId, year); break;
    case 'base':       renderBaseReport(content, title, baseId, year); break;
    case 'monthly':    renderMonthlyReport(content, title, baseId, month, year); break;
    case 'annual':     renderAnnualReport(content, title, baseId, year); break;
    case 'missing':    renderMissingReport(content, title, baseId, month, year); break;
    case 'skill':      renderSkillReport(content, title, baseId, year); break;
  }

  output.scrollIntoView({ behavior:'smooth' });
  Auth.audit('RECORD_VIEWED','REPORT',`Generated ${currentReport} report for ${year}`, 'SUCCESS');
}

function renderIndividualReport(el, title, personId, year) {
  if (!personId) { el.innerHTML='<p style="padding:1rem;color:var(--text-3)">Please select a person.</p>'; return; }
  const p = DB.getOne('personnel', personId);
  const asses = DB.get('assessments').filter(a=>a.personnelId===personId&&a.year===year).sort((a,b)=>a.month-b.month);
  const avg = asses.length ? (asses.reduce((s,a)=>s+a.percentage,0)/asses.length).toFixed(1) : '—';
  title.textContent = `Individual Performance Report – ${p.name} (${year})`;
  el.innerHTML = `
    <div class="annual-report">
      <div class="report-meta-grid">
        <div class="report-stat-card"><div class="report-stat-val">${p.name}</div><div class="report-stat-label">Personnel</div></div>
        <div class="report-stat-card"><div class="report-stat-val">${p.skillLevel}</div><div class="report-stat-label">Skill Level</div></div>
        <div class="report-stat-card"><div class="report-stat-val">${asses.length}/12</div><div class="report-stat-label">Tests Completed</div></div>
        <div class="report-stat-card"><div class="report-stat-val">${avg}${avg!=='—'?'%':''}</div><div class="report-stat-label">Annual Avg</div></div>
      </div>
      <div style="height:220px;margin-bottom:1.5rem"><canvas id="indivChart"></canvas></div>
      <table class="data-table">
        <thead><tr><th>Month</th><th>Date</th><th>Max</th><th>Marks</th><th>%</th><th>Skill</th><th>Examiner</th><th>Remarks</th></tr></thead>
        <tbody>${asses.map(a=>`<tr>
          <td>${MONTHS[a.month]}</td>
          <td>${fmtDate(a.assessmentDate)}</td>
          <td>${a.maxMarks}</td>
          <td>${a.marksObtained}</td>
          <td><strong style="color:${a.percentage>=85?'var(--green)':a.percentage>=70?'var(--primary)':a.percentage>=55?'var(--amber)':'var(--red)'}">${a.percentage}%</strong></td>
          <td><span class="${getSkillClass(a.skillLevel)}">${a.skillLevel}</span></td>
          <td style="font-size:.78rem;color:var(--text-3)">${a.examinerId||'—'}</td>
          <td style="font-size:.78rem;color:var(--text-3)">${a.remarks||'—'}</td>
        </tr>`).join('')||'<tr><td colspan="8" class="table-loading">No data</td></tr>'}</tbody>
      </table>
    </div>`;
  renderLineChart('indivChart', asses.map(a=>MONTHS[a.month].slice(0,3)), asses.map(a=>a.percentage));
}

function renderAnnualReport(el, title, baseId, year) {
  const personnel = DB.get('personnel').filter(p=>!baseId||p.baseId===baseId);
  const asses = DB.get('assessments').filter(a=>a.year===year && personnel.some(p=>p.id===a.personnelId));
  const expected = personnel.length * 12;
  const avg = asses.length ? (asses.reduce((s,a)=>s+a.percentage,0)/asses.length).toFixed(1) : '—';
  const completion = expected ? ((asses.length/expected)*100).toFixed(1) : '—';
  const skillCount = { A:0, B:0, C:0, Beginner:0 };
  personnel.forEach(p=>{ if(skillCount[p.skillLevel]!==undefined) skillCount[p.skillLevel]++; });
  const baseLabel = baseId ? getBaseName(baseId) : 'All Air Bases';
  title.textContent = `Annual ATC Competency Report – ${baseLabel} (${year})`;
  el.innerHTML = `
    <div class="annual-report">
      <div style="color:var(--text-2);font-size:.85rem;margin-bottom:1rem">Air Base: <strong style="color:var(--text-1)">${baseLabel}</strong> &nbsp;|&nbsp; Year: <strong style="color:var(--text-1)">${year}</strong></div>
      <div class="report-meta-grid">
        <div class="report-stat-card"><div class="report-stat-val">${personnel.length}</div><div class="report-stat-label">Personnel</div></div>
        <div class="report-stat-card"><div class="report-stat-val">${expected}</div><div class="report-stat-label">Tests Expected</div></div>
        <div class="report-stat-card"><div class="report-stat-val">${asses.length}</div><div class="report-stat-label">Tests Completed</div></div>
        <div class="report-stat-card"><div class="report-stat-val">${completion}${completion!=='—'?'%':''}</div><div class="report-stat-label">Completion Rate</div></div>
        <div class="report-stat-card"><div class="report-stat-val">${avg}${avg!=='—'?'%':''}</div><div class="report-stat-label">Avg Competency</div></div>
      </div>
      <div class="skill-bar-section">
        <div style="font-weight:700;font-size:.8rem;text-transform:uppercase;letter-spacing:.07em;color:var(--text-2);margin-bottom:.75rem">Skill Distribution</div>
        ${Object.entries(skillCount).map(([k,v])=>{
          const pct = personnel.length?Math.round(v/personnel.length*100):0;
          const colors={A:'var(--green)',B:'var(--primary)',C:'var(--amber)',Beginner:'var(--text-3)'};
          const blocks = '█'.repeat(Math.round(pct/5));
          return `<div class="skill-bar-row">
            <div class="skill-bar-label" style="color:${colors[k]}">Level ${k}</div>
            <div class="skill-bar-track"><div class="skill-bar-fill" style="width:${pct}%;background:${colors[k]}"></div></div>
            <div class="skill-bar-count">${v}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

function renderBaseReport(el, title, baseId, year) {
  if (!baseId) { el.innerHTML='<p style="padding:1rem;color:var(--text-3)">Please select a base.</p>'; return; }
  renderAnnualReport(el, title, baseId, year);
}

function renderMonthlyReport(el, title, baseId, month, year) {
  const personnel = DB.get('personnel').filter(p=>!baseId||p.baseId===baseId);
  const asses = DB.get('assessments').filter(a=>a.year===year&&a.month===month&&personnel.some(p=>p.id===a.personnelId));
  const avg = asses.length?(asses.reduce((s,a)=>s+a.percentage,0)/asses.length).toFixed(1):'—';
  title.textContent = `Monthly Report – ${MONTHS[month]} ${year}`;
  el.innerHTML=`
    <div class="annual-report">
      <div class="report-meta-grid">
        <div class="report-stat-card"><div class="report-stat-val">${asses.length}/${personnel.length}</div><div class="report-stat-label">Completed</div></div>
        <div class="report-stat-card"><div class="report-stat-val">${avg}${avg!=='—'?'%':''}</div><div class="report-stat-label">Avg Score</div></div>
        <div class="report-stat-card"><div class="report-stat-val">${personnel.length-asses.length}</div><div class="report-stat-label">Outstanding</div></div>
      </div>
      <table class="data-table"><thead><tr><th>Personnel</th><th>Air Base</th><th>Marks</th><th>%</th><th>Skill</th></tr></thead>
      <tbody>${asses.map(a=>{const p=DB.getOne('personnel',a.personnelId);return `<tr>
        <td>${p?.name||'—'}</td><td>${getBaseName(p?.baseId||'')}</td>
        <td>${a.marksObtained}/${a.maxMarks}</td>
        <td><strong style="color:${a.percentage>=85?'var(--green)':a.percentage>=70?'var(--primary)':a.percentage>=55?'var(--amber)':'var(--red)'}">${a.percentage}%</strong></td>
        <td><span class="${getSkillClass(a.skillLevel)}">${a.skillLevel}</span></td>
      </tr>`;}).join('')||'<tr><td colspan="5" class="table-loading">No data</td></tr>'}</tbody></table>
    </div>`;
}

function renderMissingReport(el, title, baseId, month, year) {
  const personnel = DB.get('personnel').filter(p=>!baseId||p.baseId===baseId);
  const done = new Set(DB.get('assessments').filter(a=>a.year===year&&a.month===month&&personnel.some(p=>p.id===a.personnelId)).map(a=>a.personnelId));
  const missing = personnel.filter(p=>!done.has(p.id));
  title.textContent = `Missing Assessments – ${MONTHS[month]||'Selected Month'} ${year}`;
  el.innerHTML=`
    <div class="annual-report">
      <div class="report-meta-grid">
        <div class="report-stat-card"><div class="report-stat-val" style="color:var(--red)">${missing.length}</div><div class="report-stat-label">Missing</div></div>
        <div class="report-stat-card"><div class="report-stat-val" style="color:var(--green)">${done.size}</div><div class="report-stat-label">Completed</div></div>
      </div>
      <table class="data-table"><thead><tr><th>Service No.</th><th>Name</th><th>Rank</th><th>Air Base</th><th>Category</th></tr></thead>
      <tbody>${missing.map(p=>`<tr>
        <td>${p.serviceNo}</td><td><strong>${p.name}</strong></td><td>${p.rank}</td>
        <td>${getBaseName(p.baseId)}</td><td>${getCategoryName(p.categoryId)}</td>
      </tr>`).join('')||'<tr><td colspan="5" class="table-loading">All complete!</td></tr>'}</tbody></table>
    </div>`;
}

function renderSkillReport(el, title, baseId, year) {
  const personnel = DB.get('personnel').filter(p=>!baseId||p.baseId===baseId);
  const skillCount = {A:0,B:0,C:0,Beginner:0};
  personnel.forEach(p=>{if(skillCount[p.skillLevel]!==undefined)skillCount[p.skillLevel]++;});
  title.textContent = `Skill Level Distribution – ${baseId?getBaseName(baseId):'All Bases'} (${year})`;
  const colors = {A:'#22c55e',B:'#38bdf8',C:'#f59e0b',Beginner:'#94afc8'};
  el.innerHTML=`
    <div class="annual-report">
      <div style="height:240px;margin-bottom:1.5rem"><canvas id="skillDistChart"></canvas></div>
      <div class="report-meta-grid">
        ${Object.entries(skillCount).map(([k,v])=>`<div class="report-stat-card">
          <div class="report-stat-val" style="color:${colors[k]}">${v}</div>
          <div class="report-stat-label">Level ${k}</div>
        </div>`).join('')}
      </div>
    </div>`;
  setTimeout(() => {
    const ctx = document.getElementById('skillDistChart');
    if (!ctx) return;
    if (reportChart) reportChart.destroy();
    reportChart = new Chart(ctx, {
      type:'bar',
      data:{
        labels:Object.keys(skillCount).map(k=>`Level ${k}`),
        datasets:[{data:Object.values(skillCount),backgroundColor:Object.keys(skillCount).map(k=>colors[k]),borderRadius:6}]
      },
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{
        x:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#5a7a9a'}},
        y:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#5a7a9a',stepSize:1}}
      }}
    });
  }, 100);
}

function renderLineChart(canvasId, labels, data) {
  setTimeout(() => {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (reportChart) reportChart.destroy();
    reportChart = new Chart(ctx, {
      type:'line',
      data:{labels,datasets:[{data,borderColor:'#38bdf8',backgroundColor:'rgba(56,189,248,.08)',borderWidth:2,pointRadius:5,tension:0.4,fill:true}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{
        x:{grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#5a7a9a'}},
        y:{min:40,max:100,grid:{color:'rgba(255,255,255,.04)'},ticks:{color:'#5a7a9a',callback:v=>`${v}%`}}
      }}
    });
  }, 100);
}

function exportCurrentReport() {
  showToast('Exporting report to CSV…', 'info');
  Auth.audit('EXPORT','REPORT',`Exported ${currentReport} report`,'SUCCESS');
}
