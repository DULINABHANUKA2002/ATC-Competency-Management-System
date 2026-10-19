/* ============================================================
   dashboard.js — Main dashboard page logic
   ============================================================ */

let trendChartInst  = null;
let skillChartInst  = null;
let allPersonnel    = [];
let allAssessments  = [];
let dashSearch      = '';
const YEAR          = 2026;
const CURRENT_MONTH = new Date().getMonth() + 1;

document.addEventListener('DOMContentLoaded', () => {
  const session = Auth.requireAuth();
  if (!session) return;

  allPersonnel   = DB.get('personnel');
  allAssessments = DB.get('assessments');

  // Welcome name
  document.getElementById('welcomeName').textContent = session.name.split(' ').pop();
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  // Populate base selector
  const bases = DB.get('bases').filter(b => b.status === 'active');
  const baseSelector = document.getElementById('dashBaseSelector');
  const trendBaseFilter = document.getElementById('trendBaseFilter');
  bases.forEach(b => {
    [baseSelector, trendBaseFilter].forEach(sel => {
      const opt = document.createElement('option');
      opt.value = b.id; opt.textContent = b.name;
      sel.appendChild(opt);
    });
  });

  // Session base scope
  if (session.role === 'user' && session.baseId !== 'all') {
    baseSelector.value = session.baseId;
    baseSelector.disabled = true;
  }

  baseSelector.addEventListener('change', renderDashboard);
  trendBaseFilter.addEventListener('change', renderTrendChart);

  document.getElementById('dashSearch').addEventListener('input', e => {
    dashSearch = e.target.value.toLowerCase();
    renderPersonnelTable(getFilteredPersonnel(baseSelector.value));
  });

  renderDashboard();
  renderAlerts();
  renderActivity();
});

function getFilteredPersonnel(baseId) {
  return allPersonnel.filter(p => baseId === 'all' || !baseId || p.baseId === baseId);
}

function renderDashboard() {
  const baseId = document.getElementById('dashBaseSelector').value;
  const personnel = getFilteredPersonnel(baseId);

  // KPIs
  const bases = DB.get('bases');
  const thisMonthTests = allAssessments.filter(a => a.year === YEAR && a.month === CURRENT_MONTH &&
    (baseId === 'all' || !baseId || allPersonnel.find(p => p.id === a.personnelId)?.baseId === baseId));

  const allThisYearTests = allAssessments.filter(a => a.year === YEAR &&
    (baseId === 'all' || !baseId || allPersonnel.find(p => p.id === a.personnelId)?.baseId === baseId));
  const avgScore = allThisYearTests.length ? parseFloat((allThisYearTests.reduce((s,a) => s + a.percentage, 0) / allThisYearTests.length).toFixed(1)) : 0;

  document.getElementById('kpiAirbasesVal').textContent = baseId === 'all' || !baseId ? bases.filter(b=>b.status==='active').length : 1;
  document.getElementById('kpiPersonnelVal').textContent = personnel.length;
  document.getElementById('kpiTestsVal').textContent = thisMonthTests.length;
  document.getElementById('kpiAvgVal').textContent = `${avgScore}%`;

  const testTrend = thisMonthTests.length >= personnel.length * 0.8 ? 'kpi-trend-up' : 'kpi-trend-down';
  document.getElementById('kpiTestsTrend').className = `kpi-trend ${testTrend}`;
  document.getElementById('kpiTestsTrend').textContent = thisMonthTests.length >= personnel.length * 0.8 ? '↑ On Track' : '↓ Behind';

  const avgClass = avgScore >= 80 ? 'kpi-trend kpi-trend-up' : avgScore >= 60 ? 'kpi-trend' : 'kpi-trend kpi-trend-down';
  document.getElementById('kpiAvgTrend').className = avgClass;
  document.getElementById('kpiAvgTrend').textContent = avgScore >= 80 ? '↑ Good' : avgScore >= 60 ? '→ Fair' : '↓ Low';

  renderTrendChart();
  renderSkillChart(personnel);
  renderPersonnelTable(personnel);
}

function renderTrendChart() {
  const baseId = document.getElementById('trendBaseFilter').value;
  const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyAvgs = [];
  for (let m = 1; m <= 12; m++) {
    const asses = allAssessments.filter(a => {
      if (a.year !== YEAR || a.month !== m) return false;
      if (baseId && baseId !== 'all') {
        const p = allPersonnel.find(p => p.id === a.personnelId);
        if (!p || p.baseId !== baseId) return false;
      }
      return true;
    });
    monthlyAvgs.push(asses.length ? parseFloat((asses.reduce((s,a)=>s+a.percentage,0)/asses.length).toFixed(1)) : null);
  }

  const ctx = document.getElementById('trendChart');
  if (!ctx) return;
  if (trendChartInst) trendChartInst.destroy();

  trendChartInst = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Avg Competency %',
        data: monthlyAvgs,
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56,189,248,0.08)',
        borderWidth: 2.5,
        pointBackgroundColor: '#38bdf8',
        pointBorderColor: '#0d1529',
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
        spanGaps: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(13,21,41,0.95)',
          borderColor: 'rgba(56,189,248,0.3)',
          borderWidth: 1,
          titleColor: '#38bdf8',
          bodyColor: '#94afc8',
          callbacks: { label: ctx => ` ${ctx.parsed.y}%` }
        },
      },
      scales: {
        x: { grid: { color:'rgba(255,255,255,0.04)' }, ticks: { color:'#5a7a9a', font:{size:11} } },
        y: {
          min: 40, max: 100,
          grid: { color:'rgba(255,255,255,0.04)' },
          ticks: { color:'#5a7a9a', font:{size:11}, callback: v => `${v}%` },
        },
      },
    }
  });
}

function renderSkillChart(personnel) {
  const levels = { A:0, B:0, C:0, Beginner:0 };
  personnel.forEach(p => { if (levels[p.skillLevel] !== undefined) levels[p.skillLevel]++; });

  const colors = { A:'#22c55e', B:'#38bdf8', C:'#f59e0b', Beginner:'#94afc8' };
  const ctx = document.getElementById('skillChart');
  if (!ctx) return;
  if (skillChartInst) skillChartInst.destroy();

  skillChartInst = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(levels),
      datasets: [{
        data: Object.values(levels),
        backgroundColor: Object.keys(levels).map(k => colors[k]),
        borderColor: '#0d1529',
        borderWidth: 3,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(13,21,41,0.95)',
          borderColor: 'rgba(56,189,248,0.3)',
          borderWidth: 1,
          titleColor: '#38bdf8',
          bodyColor: '#94afc8',
        }
      }
    }
  });

  // Legend
  const legendEl = document.getElementById('skillLegend');
  if (legendEl) {
    legendEl.innerHTML = Object.entries(levels).map(([k,v]) =>
      `<div class="skill-legend-item"><span class="legend-dot" style="background:${colors[k]}"></span>Level ${k}: ${v}</div>`
    ).join('');
  }
}

function renderPersonnelTable(personnel) {
  const tbody = document.getElementById('personnelTableBody');
  const filtered = dashSearch ? personnel.filter(p => p.name.toLowerCase().includes(dashSearch) || p.serviceNo.toLowerCase().includes(dashSearch)) : personnel;

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="table-loading">No personnel found.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.slice(0, 10).map(p => {
    const stats = getPersonnelStats(p.id, YEAR);
    const lastAss = allAssessments.filter(a => a.personnelId === p.id && a.year === YEAR).sort((a,b) => b.month-a.month)[0];
    return `<tr>
      <td>${p.rank}</td>
      <td><strong>${p.name}</strong></td>
      <td><span class="text-muted">${p.serviceNo}</span></td>
      <td>${getBaseName(p.baseId)}</td>
      <td>${getCategoryName(p.categoryId)}</td>
      <td><span class="${getSkillClass(p.skillLevel)}">${p.skillLevel}</span></td>
      <td>${lastAss ? `${lastAss.percentage}% (${MONTHS[lastAss.month]})` : '<span class="text-muted">No record</span>'}</td>
      <td>${getStatusBadge(p.status)}</td>
      <td>
        <button class="btn-icon" onclick="viewProfile('${p.id}')" title="View Profile">
          <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>
        </button>
      </td>
    </tr>`;
  }).join('');
}

function viewProfile(id) {
  window.location.href = `personnel.html?profile=${id}`;
}

function renderAlerts() {
  const list = document.getElementById('alertList');
  if (!list) return;
  const personnel = DB.get('personnel');
  const alerts = [];

  // Under-review personnel
  const review = personnel.filter(p => p.status === 'review');
  if (review.length) {
    alerts.push({ type:'warn', msg:`${review.length} personnel under competency review` });
  }

  // Missing tests
  const done = new Set(DB.get('assessments').filter(a => a.year===YEAR && a.month===CURRENT_MONTH).map(a=>a.personnelId));
  const missing = personnel.filter(p => !done.has(p.id));
  if (missing.length) {
    alerts.push({ type:'warn', msg:`${missing.length} personnel have not completed ${MONTHS[CURRENT_MONTH]} assessment` });
  }

  if (!alerts.length) alerts.push({ type:'ok', msg:'All assessments up to date for this month.' });

  list.innerHTML = alerts.map(a =>
    `<div class="alert-item alert-${a.type}"><span class="alert-dot"></span><span>${a.msg}</span></div>`
  ).join('');
}

function renderActivity() {
  const list = document.getElementById('activityList');
  if (!list) return;
  const logs = DB.get('auditLog').slice().reverse().slice(0, 8);
  const icons = { LOGIN:'🔑', LOGOUT:'🚪', RECORD_CREATED:'➕', RECORD_AMENDED:'✏️', ASSESSMENT_ADDED:'📋', PDF_UPLOAD:'📄', USER_CREATED:'👤', RECORD_VIEWED:'👁', LOGIN_FAILED:'❌', default:'📝' };
  list.innerHTML = logs.map(l =>
    `<div class="act-item">
      <div class="act-icon">${icons[l.action]||icons.default}</div>
      <div style="flex:1">
        <div style="font-size:.82rem;color:var(--text-1)">${l.username} — ${l.action.replace(/_/g,' ')}</div>
        <div style="font-size:.72rem;color:var(--text-3)">${l.detail}</div>
      </div>
      <div class="act-time">${fmtDateTime(l.timestamp).split(',')[1]?.trim()||''}</div>
    </div>`
  ).join('');
}
