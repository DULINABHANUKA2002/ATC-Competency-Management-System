/* ============================================================
   data.js — In-memory demo data store
   All data is stored in localStorage for persistence across pages
   ============================================================ */

const DB_KEY = 'slaf_atc_db_v2';

const DEFAULT_DATA = {
  users: [
    { id: 'u1', username: 'director',  passwordHash: 'admin123', name: 'Air Vice Marshal K. Silva',   role: 'director', baseId: 'all',  status: 'active', lastLogin: '2026-10-17T09:00:00' },
    { id: 'u2', username: 'admin',     passwordHash: 'admin123', name: 'Gp Capt R. Perera',           role: 'admin',    baseId: 'all',  status: 'active', lastLogin: '2026-10-17T08:45:00' },
    { id: 'u3', username: 'user1',     passwordHash: 'admin123', name: 'Sqn Ldr T. Fernando',         role: 'user',     baseId: 'b1',   status: 'active', lastLogin: '2026-10-16T14:00:00' },
    { id: 'u4', username: 'viewer',    passwordHash: 'admin123', name: 'Flt Lt A. Jayasinghe',        role: 'viewer',   baseId: 'all',  status: 'active', lastLogin: '2026-10-15T10:30:00' },
    { id: 'u5', username: 'user2',     passwordHash: 'admin123', name: 'Sqn Ldr M. Wickramasinghe',   role: 'user',     baseId: 'b2',   status: 'active', lastLogin: '2026-10-17T07:55:00' },
  ],

  bases: [
    { id: 'b1', name: 'Katunayake',  location: 'Western Province',       status: 'active', co: 'Gp Capt D. Peiris' },
    { id: 'b2', name: 'Weerawila',   location: 'Southern Province',      status: 'active', co: 'Wg Cdr S. Rathnayake' },
    { id: 'b3', name: 'Palaly',      location: 'Northern Province',      status: 'active', co: 'Wg Cdr N. Kumarasinghe' },
    { id: 'b5', name: 'Hingurakgoda',location: 'North Central Province', status: 'active', co: 'Sqn Ldr R. Karunanayake' },
    { id: 'b6', name: 'Koggala',     location: 'Southern Province',      status: 'active', co: 'Flt Lt T. Senaratne' },
    { id: 'b7', name: 'Vavuniya',    location: 'Northern Province',      status: 'active', co: 'Flt Lt B. Liyanage' },
    { id: 'b8', name: 'Colombo',     location: 'Western Province',       status: 'active', co: 'Gp Capt M. Jayasekara' },
    { id: 'b9', name: 'Iranamadu',   location: 'Kilinochchi',            status: 'active', co: 'Sqn Ldr P. Dissanayake' },
  ],

  categories: [
    { id: 'c1', name: 'ATC Controller' },
    { id: 'c2', name: 'ATC Supervisor' },
    { id: 'c3', name: 'Radar Controller' },
    { id: 'c4', name: 'Ground Controller' },
    { id: 'c5', name: 'Approach Controller' },
  ],

  skillLevels: [
    { id: 's1', name: 'A',        description: 'Expert – Full operational proficiency' },
    { id: 's2', name: 'B',        description: 'Competent – Standard operational proficiency' },
    { id: 's3', name: 'C',        description: 'Developing – Under supervised operation' },
    { id: 's4', name: 'Beginner', description: 'Trainee – Under full supervision' },
  ],

  personnel: [
    { id: 'p1',  serviceNo: 'ATC-2018-001', name: 'Sgt K. Abeywickrama',     rank: 'Sergeant',          baseId: 'b1', categoryId: 'c1', skillLevel: 'A',        status: 'current',  joined: '2018-03-12' },
    { id: 'p2',  serviceNo: 'ATC-2019-002', name: 'Cpl R. Bandara',           rank: 'Corporal',          baseId: 'b1', categoryId: 'c2', skillLevel: 'B',        status: 'current',  joined: '2019-06-15' },
    { id: 'p3',  serviceNo: 'ATC-2020-003', name: 'Cpl T. Chathuranga',       rank: 'Corporal',          baseId: 'b1', categoryId: 'c1', skillLevel: 'C',        status: 'review',   joined: '2020-01-20' },
    { id: 'p4',  serviceNo: 'ATC-2022-004', name: 'AC D. Dhanushka',          rank: 'Aircraftman',       baseId: 'b1', categoryId: 'c1', skillLevel: 'Beginner', status: 'review',   joined: '2022-08-01' },
    { id: 'p5',  serviceNo: 'ATC-2017-005', name: 'Sgt E. Ekanayake',         rank: 'Sergeant',          baseId: 'b2', categoryId: 'c3', skillLevel: 'A',        status: 'current',  joined: '2017-11-04' },
    { id: 'p6',  serviceNo: 'ATC-2019-006', name: 'Cpl F. Fernando',          rank: 'Corporal',          baseId: 'b2', categoryId: 'c4', skillLevel: 'B',        status: 'current',  joined: '2019-03-22' },
    { id: 'p7',  serviceNo: 'ATC-2021-007', name: 'AC G. Gunawardena',        rank: 'Aircraftman',       baseId: 'b2', categoryId: 'c1', skillLevel: 'C',        status: 'current',  joined: '2021-07-14' },
    { id: 'p8',  serviceNo: 'ATC-2016-008', name: 'FS H. Herath',             rank: 'Flight Sergeant',   baseId: 'b3', categoryId: 'c2', skillLevel: 'A',        status: 'current',  joined: '2016-05-28' },
    { id: 'p9',  serviceNo: 'ATC-2020-009', name: 'Sgt I. Illangasinghe',     rank: 'Sergeant',          baseId: 'b3', categoryId: 'c5', skillLevel: 'B',        status: 'current',  joined: '2020-09-09' },
    { id: 'p10', serviceNo: 'ATC-2023-010', name: 'AC J. Jayawardena',        rank: 'Aircraftman',       baseId: 'b3', categoryId: 'c1', skillLevel: 'Beginner', status: 'review',   joined: '2023-01-16' },
    { id: 'p11', serviceNo: 'ATC-2018-011', name: 'Cpl K. Karunarathne',      rank: 'Corporal',          baseId: 'b9', categoryId: 'c3', skillLevel: 'B',        status: 'current',  joined: '2018-12-03' },
    { id: 'p12', serviceNo: 'ATC-2019-012', name: 'Sgt L. Liyanage',          rank: 'Sergeant',          baseId: 'b9', categoryId: 'c1', skillLevel: 'A',        status: 'current',  joined: '2019-04-19' },
    { id: 'p13', serviceNo: 'ATC-2021-013', name: 'AC M. Marasinghe',         rank: 'Aircraftman',       baseId: 'b5', categoryId: 'c4', skillLevel: 'C',        status: 'review',   joined: '2021-10-07' },
    { id: 'p14', serviceNo: 'ATC-2017-014', name: 'FS N. Nanayakkara',        rank: 'Flight Sergeant',   baseId: 'b5', categoryId: 'c2', skillLevel: 'A',        status: 'current',  joined: '2017-02-25' },
    { id: 'p15', serviceNo: 'ATC-2020-015', name: 'Cpl O. Obeyesekere',       rank: 'Corporal',          baseId: 'b6', categoryId: 'c5', skillLevel: 'B',        status: 'current',  joined: '2020-06-11' },
    { id: 'p16', serviceNo: 'ATC-2022-016', name: 'SAC P. Pathirana',         rank: 'Senior Aircraftman',baseId: 'b6', categoryId: 'c1', skillLevel: 'C',        status: 'current',  joined: '2022-03-30' },
    { id: 'p17', serviceNo: 'ATC-2016-017', name: 'Sgt Q. Ratnasekera',       rank: 'Sergeant',          baseId: 'b7', categoryId: 'c3', skillLevel: 'A',        status: 'current',  joined: '2016-08-17' },
    { id: 'p18', serviceNo: 'ATC-2018-018', name: 'Cpl R. Ranasinghe',        rank: 'Corporal',          baseId: 'b7', categoryId: 'c1', skillLevel: 'B',        status: 'current',  joined: '2018-11-22' },
    { id: 'p19', serviceNo: 'ATC-2019-019', name: 'Sgt S. Samarawickrama',    rank: 'Sergeant',          baseId: 'b8', categoryId: 'c2', skillLevel: 'A',        status: 'current',  joined: '2019-09-05' },
    { id: 'p20', serviceNo: 'ATC-2021-020', name: 'AC T. Thennakoon',         rank: 'Aircraftman',       baseId: 'b8', categoryId: 'c4', skillLevel: 'Beginner', status: 'review',   joined: '2021-04-18' },
  ],

  assessments: [],  // Populated below

  auditLog: [
    { id: 'a1', userId: 'u1', username: 'director', role: 'director', action: 'LOGIN',            recordType: 'AUTH',       detail: 'Successful login',                         ip: '10.0.0.1',   session: 'SES-001', result: 'SUCCESS', timestamp: '2026-10-17T09:00:00' },
    { id: 'a2', userId: 'u2', username: 'admin',    role: 'admin',    action: 'LOGIN',            recordType: 'AUTH',       detail: 'Successful login',                         ip: '10.0.0.5',   session: 'SES-002', result: 'SUCCESS', timestamp: '2026-10-17T08:45:00' },
    { id: 'a3', userId: 'u2', username: 'admin',    role: 'admin',    action: 'RECORD_CREATED',   recordType: 'PERSONNEL',  detail: 'Added: AC T. Thennakoon (ATC-2021-020)',   ip: '10.0.0.5',   session: 'SES-002', result: 'SUCCESS', timestamp: '2026-10-17T08:52:00' },
    { id: 'a4', userId: 'u3', username: 'user1',    role: 'user',     action: 'ASSESSMENT_ADDED', recordType: 'ASSESSMENT', detail: 'Uploaded assessment for Sgt K. Abeywickrama – Oct 2026', ip: '10.0.0.8', session: 'SES-003', result: 'SUCCESS', timestamp: '2026-10-16T14:10:00' },
    { id: 'a5', userId: 'u3', username: 'user1',    role: 'user',     action: 'PDF_UPLOAD',       recordType: 'FILE',       detail: 'PDF uploaded: assessment_p1_oct2026.pdf',  ip: '10.0.0.8',   session: 'SES-003', result: 'SUCCESS', timestamp: '2026-10-16T14:11:00' },
    { id: 'a6', userId: 'u2', username: 'admin',    role: 'admin',    action: 'RECORD_AMENDED',   recordType: 'ASSESSMENT', detail: 'Corrected marks: Old 78 → New 82 (data entry error)', ip: '10.0.0.5', session: 'SES-002', result: 'SUCCESS', timestamp: '2026-10-15T15:30:00' },
    { id: 'a7', userId: 'u4', username: 'viewer',   role: 'viewer',   action: 'RECORD_VIEWED',    recordType: 'REPORT',     detail: 'Viewed annual report – Katunayake 2026',   ip: '10.0.0.12',  session: 'SES-004', result: 'SUCCESS', timestamp: '2026-10-15T10:35:00' },
    { id: 'a8', userId: 'u2', username: 'admin',    role: 'admin',    action: 'USER_CREATED',     recordType: 'USER',       detail: 'Created user: user2 (role: user, base: Weerawila)', ip: '10.0.0.5', session: 'SES-002', result: 'SUCCESS', timestamp: '2026-10-14T09:20:00' },
    { id: 'a9', userId: 'u1', username: 'director', role: 'director', action: 'RECORD_VIEWED',    recordType: 'RANKING',    detail: 'Viewed annual ranking 2026',               ip: '10.0.0.1',   session: 'SES-001', result: 'SUCCESS', timestamp: '2026-10-13T11:00:00' },
    { id: 'aX', userId: 'u0', username: 'unknown',  role: '—',        action: 'LOGIN_FAILED',     recordType: 'AUTH',       detail: 'Failed login attempt: username "hacker"',  ip: '192.168.10.99', session: '—', result: 'FAILURE', timestamp: '2026-10-12T03:15:00' },
  ],

  rankingConfig: {
    method: 'annual_avg',
    tiebreak: 'tests_count',
    wAnnual: 60,
    wTests: 40,
    minTests: 6,
  },

  assmtSettings: {
    maxMarks: 100,
    passThreshold: 60,
    maxFileMB: 10,
    frequency: 'monthly',
  },
};

// ── Generate realistic assessments ──────────────────────────
function _genAssessments() {
  const months = [1,2,3,4,5,6,7,8,9,10];
  const personnel = DEFAULT_DATA.personnel;
  const asses = [];
  let aid = 1;
  const examiners = ['Sqn Ldr T. Fernando','Flt Lt A. Jayasinghe','Wg Cdr N. Kumara','Sqn Ldr P. Dissanayake'];
  const baseMarks = { p1:88, p2:79, p3:72, p4:60, p5:92, p6:83, p7:68, p8:95,
                      p9:80, p10:55, p11:78, p12:91, p13:65, p14:94, p15:82,
                      p16:70, p17:89, p18:76, p19:93, p20:58 };
  personnel.forEach(p => {
    const base = baseMarks[p.id] || 75;
    months.forEach(m => {
      if (m === 10 && p.id !== 'p1' && p.id !== 'p5' && p.id !== 'p8') return; // some haven't done Oct yet
      const variance = Math.round((Math.random() - 0.5) * 12);
      const marks = Math.max(40, Math.min(100, base + variance));
      const maxMarks = 100;
      const pct = parseFloat(((marks / maxMarks) * 100).toFixed(1));
      const date = new Date(2026, m - 1, 5 + Math.floor(Math.random() * 10));
      asses.push({
        id: `ass_${aid++}`,
        personnelId: p.id,
        assessmentDate: date.toISOString().split('T')[0],
        month: m,
        year: 2026,
        maxMarks,
        marksObtained: marks,
        percentage: pct,
        skillLevel: pct >= 85 ? 'A' : pct >= 70 ? 'B' : pct >= 55 ? 'C' : 'Beginner',
        examinerId: examiners[Math.floor(Math.random() * examiners.length)],
        remarks: marks >= 85 ? 'Excellent performance.' : marks >= 70 ? 'Satisfactory.' : 'Needs improvement.',
        pdfName: `assessment_${p.id}_m${m}_2026.pdf`,
        uploadedBy: 'u3',
        createdAt: date.toISOString(),
      });
    });
  });
  return asses;
}

DEFAULT_DATA.assessments = _genAssessments();

// ── Database API ─────────────────────────────────────────────
const DB = {
  _load() {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const d = JSON.parse(JSON.stringify(DEFAULT_DATA));
      localStorage.setItem(DB_KEY, JSON.stringify(d));
      return d;
    }
    return JSON.parse(raw);
  },
  _save(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  },

  get(table) { return this._load()[table] || []; },

  getOne(table, id) { return this.get(table).find(r => r.id === id) || null; },

  insert(table, record) {
    const db = this._load();
    if (!db[table]) db[table] = [];
    record.id = record.id || `${table}_${Date.now()}`;
    db[table].push(record);
    this._save(db);
    return record;
  },

  update(table, id, updates) {
    const db = this._load();
    const idx = (db[table] || []).findIndex(r => r.id === id);
    if (idx === -1) return null;
    db[table][idx] = { ...db[table][idx], ...updates };
    this._save(db);
    return db[table][idx];
  },

  delete(table, id) {
    const db = this._load();
    const len = (db[table] || []).length;
    db[table] = (db[table] || []).filter(r => r.id !== id);
    this._save(db);
    return db[table].length < len;
  },

  reset() { localStorage.removeItem(DB_KEY); location.reload(); },
};

// ── Month names utility ─────────────────────────────────────
const MONTHS = ['','January','February','March','April','May','June',
                'July','August','September','October','November','December'];

// ── Lookup helpers ──────────────────────────────────────────
function getBaseName(id) {
  if (id === 'all') return 'All Bases';
  const b = DB.getOne('bases', id);
  return b ? b.name : id;
}
function getCategoryName(id) {
  const c = DB.getOne('categories', id);
  return c ? c.name : id;
}
function getPersonnelName(id) {
  const p = DB.getOne('personnel', id);
  return p ? p.name : id;
}

// ── Competency calculations ─────────────────────────────────
function getPersonnelStats(personnelId, year) {
  const asses = DB.get('assessments').filter(a => a.personnelId === personnelId && a.year === year);
  if (!asses.length) return { count: 0, monthlyAvg: 0, annualAvg: 0, lastPct: null };
  const sum = asses.reduce((s, a) => s + a.percentage, 0);
  const avg = parseFloat((sum / asses.length).toFixed(1));
  const sorted = [...asses].sort((a,b) => b.month - a.month);
  return { count: asses.length, monthlyAvg: avg, annualAvg: avg, lastPct: sorted[0]?.percentage || null, assessments: sorted };
}
