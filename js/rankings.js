/* ============================================================
   rankings.js — Performance Rankings page
   ============================================================ */

let currentTab = 'annual';

document.addEventListener('DOMContentLoaded', () => {
  const session = Auth.requireAuth();
  if (!session) return;

  // Populate base filter
  populateSelect('#rankBaseFilter', DB.get('bases').filter(b=>b.status==='active'), 'id', 'name', true);

  // Events
  document.getElementById('rankBaseFilter')?.addEventListener('change', renderRankings);
  document.getElementById('rankYearFilter')?.addEventListener('change', renderRankings);
  document.getElementById('rankSearch')?.addEventListener('input', applyRankSearch);

  document.querySelectorAll('.rank-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.rank-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.dataset.tab;
      renderRankings();
    });
  });

  document.getElementById('exportRankBtn')?.addEventListener('click', exportRankings);

  renderRankings();
});

let rankData = [];

function renderRankings() {
  const baseId = document.getElementById('rankBaseFilter')?.value||'all';
  const year   = parseInt(document.getElementById('rankYearFilter')?.value)||2026;
  const config = DB.get('rankingConfig')[0] || { method:'annual_avg', tiebreak:'tests_count', minTests:6 };

  const personnel = DB.get('personnel').filter(p => baseId==='all' || !baseId || p.baseId===baseId);
  const assessments = DB.get('assessments');

  rankData = personnel.map(p => {
    const pAss = assessments.filter(a => a.personnelId === p.id && a.year === year);
    const sortedByMonth = [...pAss].sort((a,b)=>a.month-b.month);
    const avg = pAss.length ? parseFloat((pAss.reduce((s,a)=>s+a.percentage,0)/pAss.length).toFixed(1)) : 0;
    const scores = sortedByMonth.map(a=>a.percentage);
    return {
      personnel: p,
      count: pAss.length,
      avg,
      scores,
      lastScore: scores[scores.length-1]||null,
    };
  }).filter(r => r.count >= (config.minTests||1))
    .sort((a,b) => {
      if (b.avg !== a.avg) return b.avg - a.avg;
      // Tie-break
      if (config.tiebreak === 'tests_count') return b.count - a.count;
      if (config.tiebreak === 'latest_score') return (b.lastScore||0) - (a.lastScore||0);
      return a.personnel.name.localeCompare(b.personnel.name);
    });

  document.getElementById('rankingTableTitle').textContent = `${currentTab === 'annual' ? 'Annual' : 'Monthly'} Rankings – ${year}`;

  renderPodium(rankData);
  renderRankTable(rankData);
}

function renderPodium(data) {
  const top3 = data.slice(0,3);
  const ids  = [1,2,1,3]; // podium positions (1 is center/1st)
  ['podium2','podium1','podium3'].forEach((pid, i) => {
    const el = document.getElementById(pid);
    if (!el) return;
    const r = top3[i];
    if (!r) return;
    const p = r.personnel;
    const initials = p.name.split(' ').filter(w=>w[0]?.match(/[A-Z]/)).map(w=>w[0]).join('').slice(0,2)||'?';
    el.querySelector('.podium-avatar').textContent = initials;
    el.querySelector('.podium-name').textContent = p.name.split(' ').slice(1).join(' ') || p.name;
    el.querySelector('.podium-score').textContent = `${r.avg}% avg`;
    // Add base
    const existing = el.querySelector('.podium-base');
    if (existing) existing.remove();
    const baseDiv = document.createElement('div');
    baseDiv.className = 'podium-base';
    baseDiv.textContent = getBaseName(p.baseId);
    el.appendChild(baseDiv);
  });
}

function renderRankTable(data) {
  const tbody = document.getElementById('rankingTableBody');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="table-loading">No ranking data available. Ensure personnel have assessments recorded.</td></tr>';
    return;
  }

  tbody.innerHTML = data.map((r, i) => {
    const pos = i+1;
    const posClass = pos===1?'gold':pos===2?'silver':pos===3?'bronze':'';
    const p = r.personnel;
    const trend = trendArrow(r.scores);
    return `<tr class="${pos<=3?`pos-${pos}`:''}">
      <td><span class="rank-pos-badge ${posClass}">${pos<=3?['🥇','🥈','🥉'][pos-1]:pos}</span></td>
      <td><strong>${p.name}</strong></td>
      <td>${p.rank}</td>
      <td>${getBaseName(p.baseId)}</td>
      <td>${r.count}/12</td>
      <td><strong style="color:var(--primary)">${r.avg}%</strong></td>
      <td>${r.avg}%</td>
      <td><span class="${getSkillClass(p.skillLevel)}">${p.skillLevel}</span></td>
      <td>${trend}</td>
    </tr>`;
  }).join('');
}

function applyRankSearch() {
  const q = document.getElementById('rankSearch')?.value.toLowerCase()||'';
  const filtered = rankData.filter(r => r.personnel.name.toLowerCase().includes(q) || getBaseName(r.personnel.baseId).toLowerCase().includes(q));
  renderRankTable(filtered);
}

function exportRankings() {
  const headers = ['Position','Name','Rank','Air Base','Tests Done','Avg Score','Skill Level'];
  const rows = rankData.map((r,i) => [i+1, r.personnel.name, r.personnel.rank, getBaseName(r.personnel.baseId), r.count, `${r.avg}%`, r.personnel.skillLevel]);
  exportCSV('rankings_export.csv', headers, rows);
  Auth.audit('EXPORT','RANKING','Exported rankings CSV','SUCCESS');
}
