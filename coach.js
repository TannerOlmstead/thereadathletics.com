/* THE READ Athletics - coach workspace preview (fictional sample data only) */
(function () {
  'use strict';

  const POS = ['P', 'C', '1B', '2B', '3B', 'SS', 'OF'];
  const GRADES = ['F', 'D-', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+'];
  const GRADE_TABLE = { 'A+': 98, A: 95, 'A-': 92, 'B+': 88, B: 85, 'B-': 82, 'C+': 78, C: 75, 'C-': 72, 'D+': 68, D: 65, 'D-': 62, F: 50 };
  const STAFF_BASELINE = 80, STAFF_DIVISOR = 6, STAFF_CAP = 3;


  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = (v, d) => (v == null ? '&mdash;' : Number(v).toFixed(d == null ? 1 : d));
  const ftin = (h) => Math.floor(h / 12) + '\u2032' + (h % 12) + '\u2033';
  const avg = (a) => { a = a.filter((v) => v != null); return a.length ? a.reduce((s, v) => s + v, 0) / a.length : null; };
  const TRC = window.TheReadClassification;
  const confLabel = (c) => TRC.getConfidenceLevel(c);
  const tierBadge = (p, o) => TRC.renderTierBadge(p.rs, o);
  const confBadge = (p, o) => TRC.renderConfidenceBadge(p.conf, o);
  const rk = (v) => (v == null ? '&mdash;' : '#' + v);
  const letter = (s) => { let best = 'F', bd = Infinity; GRADES.forEach((g) => { const d = Math.abs(GRADE_TABLE[g] - s); if (d < bd) { bd = d; best = g; } }); return best; };
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));

  // ---------- Fictional data (seeded so it is the same every visit) ----------
  const seed = (s) => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const r = seed(20270);
  const FN = ['Marcus', 'Eli', 'Tyson', 'Calvin', 'Owen', 'Dante', 'Rhett', 'Julian', 'Brooks', 'Cole', 'Mateo', 'Gavin', 'Nolan', 'Silas', 'Quinn', 'Beckett', 'Jonah', 'Reid', 'Emmett', 'Wade'];
  const LN = ['Ellery', 'Whitlock', 'Okafor', 'Brandt', 'Castellan', 'Merrow', 'Vance', 'Lindqvist', 'Hale', 'Pruitt', 'Nakamura', 'Delacroix', 'Ashby', 'Rourke', 'Santini', 'Halvorsen', 'Mbeki', 'Corrigan', 'Fairbanks', 'Yoon', 'Sutter', 'Kincaid', 'Abernathy', 'Locke'];
  const POSCYC = ['P', 'P', 'SS', 'OF', 'C', 'P', '2B', 'OF', '3B', 'P', '1B', 'OF', 'SS', 'P', 'C', '2B', 'OF', 'P', '3B', 'OF', 'P', 'SS', '1B', 'OF', 'C', 'P', '2B', 'OF', 'P', '3B', 'SS', 'OF', 'P', 'C', '2B', 'OF', '1B', 'P', '3B', 'OF'];
  const SEC = ['OF', '3B', '1B', 'SS', '2B'];
  const STATES = ['TX', 'FL', 'CA', 'GA', 'AZ', 'NC', 'TN', 'OH', 'IL', 'LA'];
  const SCHOOLS = ['Sample State University', 'Northern Plains University', 'Gulf Coast College', 'Cascade Tech', 'Redwood State', 'Appalachian Valley', 'Midwest Metro', 'Sunbelt University'];
  const OUR = SCHOOLS[0];
  const BASE = { P: [72, 78, 175, 240], C: [68, 74, 180, 225], '1B': [72, 78, 195, 245], '2B': [67, 73, 155, 195], '3B': [70, 76, 175, 225], SS: [68, 74, 160, 200], OF: [69, 76, 165, 225] };
  const METHODS = ['Live Evaluation', 'Showcase Data', 'Video Review', 'Verified Event Data'];
  const COACHES = [
    { id: 'A', name: 'Head Coach A. Reyes', role: 'Head Baseball Coach' },
    { id: 'B', name: 'Assoc. Head Coach D. Lindgren', role: 'Associate Head Coach' },
    { id: 'C', name: 'Pitching Coach M. Oyelaran', role: 'Pitching Coach' },
    { id: 'D', name: 'Recruiting Coordinator S. Park', role: 'Recruiting Coordinator' }
  ];
  const ACTIONS = ['Schedule Live Evaluation', 'Verify Final Metrics', 'Send Program Questionnaire', 'Plan Campus Visit', 'Review New Video'];

  const players = [];
  for (let i = 0; i < 40; i++) {
    const pos = POSCYC[i];
    const q = r();
    const p = {
      id: 'P' + String(i + 1).padStart(3, '0'),
      name: FN[i % 20] + ' ' + LN[(i * 5) % 24],
      grad: 2027 + ((i * 3) % 4),
      bats: ['R', 'L', 'S'][i % 3 === 2 ? 1 : (i % 5 === 0 ? 2 : 0)],
      throws: i % 6 === 1 ? 'L' : 'R',
      pos: pos,
      sec: '',
      twoWay: i % 13 === 5,
      state: STATES[(i * 7 + (i >> 2)) % 10],
      gpa: Math.round((2.9 + r() * 1.1) * 100) / 100,
      method: METHODS[i % 4]
    };
    if (pos !== 'P' && i % 3 === 0) { const s = SEC[i % 5]; if (s !== pos) p.sec = s; }
    const b = BASE[pos];
    p.ht = Math.round(b[0] + (b[1] - b[0]) * r());
    p.wt = Math.round((b[2] + (b[3] - b[2]) * r()) / 5) * 5;
    p.rs = Math.round((62 + 34 * Math.pow(q, 1.1)) * 10) / 10;
    const isP = pos === 'P';
    p.avgEV = isP ? null : Math.round((83 + 13 * q + r() * 2) * 10) / 10;
    p.maxEV = p.avgEV == null ? null : Math.round((p.avgEV + 7 + r() * 3) * 10) / 10;
    p.avgFBV = (isP || p.twoWay) ? Math.round((79 + 11 * q + r() * 2) * 10) / 10 : null;
    p.maxFBV = p.avgFBV == null ? null : Math.round((p.avgFBV + 2 + r() * 3) * 10) / 10;
    p.tv = Math.round((78 + 15 * q + r() * 3) * 10) / 10;
    const t60Off = { OF: -0.12, SS: -0.1, '2B': -0.05, '3B': 0.05, '1B': 0.2, C: 0.25 }[pos] || 0;
    p.t60 = isP ? null : Math.round(Math.min(7.6, Math.max(6.4, 7.2 - 0.65 * q + r() * 0.2 + t60Off)) * 100) / 100;
    p.pop = pos === 'C' ? Math.round((2.15 - 0.3 * q + r() * 0.05) * 100) / 100 : null;
    p.opg = isP ? null : Math.round((p.rs + (r() - 0.5) * 12) * 10) / 10;
    p.dpg = isP ? null : Math.round((p.rs + (r() - 0.5) * 12) * 10) / 10;
    p.sopg = p.sec ? Math.round((p.opg - 4 - r() * 6) * 10) / 10 : null;
    p.sdpg = p.sec ? Math.round((p.dpg - 4 - r() * 6) * 10) / 10 : null;
    p.ppg = (isP || p.twoWay) ? Math.round((p.rs + (r() - 0.5) * 6) * 10) / 10 : null;
    p.ath = Math.round((54 + 30 * q + r() * 12) * 10) / 10;
    let miss = 0;
    if (i % 9 === 4 && p.avgEV != null) { p.avgEV = null; miss++; }
    if (i % 7 === 3 && p.avgFBV != null) { p.avgFBV = null; miss++; }
    if (i % 8 === 2) { if (p.maxEV != null) { p.maxEV = null; miss++; } }
    p.conf = Math.max(48, Math.min(100, Math.round(55 + 45 * r() - miss * 11)));
    for (let k = 0; k < 7; k++) r(); // keeps the seeded sample values below unchanged (these 7 slots used to be random scores)
    p.hc = null; p.pc = null; p.ac = null; p.staff = null; // coach-entered opinions: blank until a coach enters them
    p.eval = '2026-' + String(1 + (i % 9)).padStart(2, '0') + '-' + String(8 + ((i * 5) % 20)).padStart(2, '0');
    p.notes = ['Quick bat, clean actions.', 'Projectable frame; needs more live looks.', 'Strong arm, still filling out.', 'Plus runner with steady defense.', 'Impact bat; verify swing data.', 'Competes well; consistent reports.'][i % 6];
    p.coach = COACHES[i % 4].id;
    p.action = ACTIONS[i % 5];
    players.push(p);
  }
  // Sample edge cases so every Tier / Confidence combination (and the 94.96 / 89.96 rounding cases) appears.
  // Values are fictional; Tier and Confidence Level are always derived from these stored numbers.
  [[94.96, 89.96], [95, 90], [97.4, 72.5], [96.1, 54], [91.3, 93], [85, 60], [87.6, 41.5], [84.99, 95], [78.2, 70], [70, 59.99], [69.99, 91], [66.4, 64], [58.7, 47], [null, null], [null, null], [88, null]]
    .forEach((v, k) => { const p = players[k]; p.rs = v[0]; p.conf = v[1]; });
  // Current Playing Level: most sample prospects are high school; a few fictional JUCO and transfer-portal players are included.
  const LEVELS = ['High School', 'JUCO', '4-Year College / Transfer Portal', 'Other'];
  const LEVEL_SHORT = { 'High School': 'High School', 'JUCO': 'JUCO', '4-Year College / Transfer Portal': 'Transfer Portal', 'Other': 'Other' };
  [8, 17, 26, 35].forEach((k) => { players[k].level = 'JUCO'; });
  [13, 22, 31].forEach((k) => { players[k].level = '4-Year College / Transfer Portal'; });
  players.forEach((p) => { p.level = p.level || 'High School'; p.photo = ''; });
  // Master Database: coach-entered demo players live in this browser's localStorage and join the sample players here,
  // so every page (rankings, player card, H2H, dashboard...) reads the same list. Real storage needs a backend.
  const STORE_KEY = 'theReadDemoMasterDb';
  const loadAdded = () => { try { const a = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
  const saveAdded = (a) => { try { localStorage.setItem(STORE_KEY, JSON.stringify(a)); return true; } catch (e) { return false; } };
  loadAdded().forEach((a) => {
    if (!a || !a.id || !a.name || POS.indexOf(a.pos) < 0) return;
    const p = Object.assign({ sec: '', twoWay: false, state: '', method: 'Coach Entry (Unverified)', notes: '', eval: '', links: {}, ht: null, wt: null, gpa: null,
      staff: null, fit: null, need: null, adj: null, pri: null, hc: null, pc: null, ac: null, committed: '', coach: '', action: '', level: 'High School', photo: '' }, a, { entered: true });
    if (LEVELS.indexOf(p.level) < 0) p.level = 'Other';
    if (p.photo && !/^https?:\/\/\S+$/i.test(p.photo)) p.photo = '';
    ['opg', 'sopg', 'dpg', 'sdpg', 'ppg', 'ath', 'rs', 'conf'].forEach((k) => { p[k] = null; });
    players.push(p);
  });
  players.forEach((p) => { p.tier = TRC.getPlayerTier(p.rs); p.confLevel = TRC.getConfidenceLevel(p.conf); p.recruitScore = p.rs; p.confidencePercentage = p.conf; });
  // ---------- Program scores: documented formulas, no random numbers ----------
  const PHIL_OPTS = ['Prefer Pitching', 'Prefer Position Players', 'Balanced Approach', 'Best Player Available', 'Need-Based Recruiting'];
  const PHIL_KEY = 'theReadDemoPhilosophy';
  const PHIL_DEFAULT = [4, 5, 1, 2, 3];
  const validPhil = (a) => Array.isArray(a) && a.length === 5 && [1, 2, 3, 4, 5].every((n) => a.indexOf(n) >= 0);
  const loadPhil = () => { try { const a = JSON.parse(localStorage.getItem(PHIL_KEY) || 'null'); return validPhil(a) ? a : PHIL_DEFAULT.slice(); } catch (e) { return PHIL_DEFAULT.slice(); } };
  const PHIL = loadPhil();
  const RW = (rank) => 6 - rank;
  const POS_NEED = { P: 1, C: 2, SS: 3, OF: 4, '2B': 5, '3B': 6, '1B': 7 };
  const POS_PRI = { P: 1, C: 2, SS: 3, OF: 4, '2B': 5, '3B': 6, '1B': 7 };
  const SKILL_PRI = [['Pitching', 1, 'ppg'], ['Defense', 3, 'dpg'], ['Athleticism', 4, 'ath'], ['Speed', 6, 't60'], ['Power', 5, 'avgEV'], ['Immediate Impact', 2, 'rs'], ['Long-Term Projection', 7, null]];
  const posScale = (rank) => 100 - 40 * (rank - 1) / 6;
  const skillVal = (p, key) => {
    if (key === 't60') return p.t60 == null ? null : Math.max(0, Math.min(100, (7.6 - p.t60) / 1.2 * 100));
    if (key === 'avgEV') return p.avgEV == null ? null : Math.max(0, Math.min(100, (p.avgEV - 70) / 30 * 100));
    return key ? p[key] : null;
  };
  const computeProgramScores = (p) => {
    let need = posScale(POS_NEED[p.pos]);
    if (p.sec && POS_NEED[p.sec]) need = Math.max(need, posScale(POS_NEED[p.sec]) - 10);
    p.need = Math.round(need);
    const rP = PHIL[0], rPP = PHIL[1], rBal = PHIL[2], rBPA = PHIL[3], rNeed = PHIL[4];
    const d = RW(rP) - RW(rPP);
    let g = 50 + (p.pos === 'P' ? 12.5 : -12.5) * d;
    if (rBal < Math.min(rP, rPP)) g = 50;
    const parts = [[3, posScale(POS_PRI[p.pos])], [3, g]];
    SKILL_PRI.forEach((s) => { const v = skillVal(p, s[2]); if (v != null) parts.push([8 - s[1], v]); });
    const sw = parts.reduce((s, x) => s + x[0], 0);
    p.fit = Math.round(parts.reduce((s, x) => s + x[0] * x[1], 0) / sw);
    if (p.rs == null) { p.adj = null; p.pri = null; return; }
    const delta = Math.max(-2.5, Math.min(2.5, ((p.fit + p.need) / 2 - 50) / 20));
    const sd = p.staff == null ? 0 : Math.max(-STAFF_CAP, Math.min(STAFF_CAP, (p.staff - STAFF_BASELINE) / STAFF_DIVISOR));
    p.adj = Math.round(Math.max(0, Math.min(100, p.rs + delta + sd)) * 10) / 10;
    const wr = RW(rBPA), wn = RW(rNeed), wf = 3;
    p.pri = Math.round((p.rs * wr + p.fit * wf + p.need * wn) / (wr + wf + wn));
  };
  const adjPriority = (p) => (p.rs == null || p.fit == null || p.pri == null ? null : Math.round((p.rs + p.fit + p.pri) / 3 * 10) / 10);
  const nv = (v) => (v == null ? '&mdash;' : v);
  const staffTxt = (p) => (p.staff == null ? 'No staff grades yet' : p.staff.toFixed(1) + ' (' + letter(p.staff) + ')');
  // Coach Grading: staff grades are coach-entered opinions saved in this browser (demo). Staff Score = average of entered grades.
  const GR_KEY = 'theReadDemoCoachGrades';
  const loadGrades = () => { try { const g = JSON.parse(localStorage.getItem(GR_KEY) || '{}'); return g && typeof g === 'object' && !Array.isArray(g) ? g : {}; } catch (e) { return {}; } };
  const saveGrades = (g) => { try { localStorage.setItem(GR_KEY, JSON.stringify(g)); return true; } catch (e) { return false; } };
  const GRADE_STORE = loadGrades();
  const GROUPS = [['P', 'Pitchers', ['P']], ['C', 'Catchers', ['C']], ['IF', 'Infielders', ['1B', '2B', '3B', 'SS']], ['OF', 'Outfielders', ['OF']]];
  const groupOf = (pos) => { const g = GROUPS.filter((x) => x[2].indexOf(pos) >= 0)[0]; return g ? g[0] : null; };
  const WT_KEY = 'theReadDemoGradeWeights';
  const DEFAULT_WEIGHTS = { all: { A: 30, B: 25, C: 25, D: 20 }, groups: { P: { A: 25, B: 15, C: 45, D: 15 } } };
  const cloneW = (w) => JSON.parse(JSON.stringify(w));
  const validW = (w) => w && typeof w === 'object' && w.all && Object.keys(DEFAULT_WEIGHTS.all).every((k) => isFinite(Number(w.all[k])) && Number(w.all[k]) >= 0);
  const loadWeights = () => { try { const w = JSON.parse(localStorage.getItem(WT_KEY) || 'null'); if (validW(w)) { w.groups = w.groups && typeof w.groups === 'object' ? w.groups : {}; return w; } } catch (e) { /* use defaults */ } return cloneW(DEFAULT_WEIGHTS); };
  const saveWeights = (w) => { try { localStorage.setItem(WT_KEY, JSON.stringify(w)); return true; } catch (e) { return false; } };
  const WEIGHTS = loadWeights();
  const weightsFor = (w, pos) => { const g = groupOf(pos); return (g && w.groups[g] && Object.keys(DEFAULT_WEIGHTS.all).every((k) => isFinite(Number(w.groups[g][k])) && Number(w.groups[g][k]) >= 0)) ? w.groups[g] : w.all; };
  // Weighted staff score over the coaches who HAVE graded; weights re-normalised among them (missing graders are excluded, never 0/F).
  const staffCalc = (gradesForPlayer, pos, w) => {
    const wt = weightsFor(w, pos), rows = [];
    Object.keys(gradesForPlayer || {}).forEach((c) => { const e = gradesForPlayer[c], s = e && Number(e.score); if (isFinite(s) && s >= 0 && s <= 100) rows.push({ id: c, score: s, w: Number(wt[c]) || 0 }); });
    if (!rows.length) return { score: null, rows: [] };
    let tot = rows.reduce((a, r) => a + r.w, 0);
    if (tot <= 0) { rows.forEach((r) => { r.w = 1; }); tot = rows.length; }
    rows.forEach((r) => { r.share = r.w / tot; });
    return { score: Math.round(rows.reduce((a, r) => a + r.score * r.share, 0) * 10) / 10, rows: rows };
  };
  players.forEach((p) => {
    const g = GRADE_STORE[p.id] || {}, sc = (id) => (g[id] && isFinite(Number(g[id].score)) ? letter(Number(g[id].score)) : null);
    p.hc = sc('A'); p.ac = sc('B'); p.pc = sc('C');
    p.staff = staffCalc(g, p.pos, WEIGHTS).score;
  });  players.forEach(computeProgramScores);
  const formulaPanel = () => {
    const rk = (i) => PHIL[i];
    return '<section class="card coach-card wide how-calc"><h2>How This Is Calculated</h2><p class="coach-note">SAMPLE DATA / FICTIONAL EXAMPLE. Nothing here is random. Every score comes from the inputs below. If an input is missing it is skipped or the score stays blank (&mdash;); missing is never counted as 0. None of these scores can change Player Tier or Confidence.</p><ul>' +
      '<li><strong>Team Need Score</strong> = 100 &minus; 40 &times; (position need rank &minus; 1) &divide; 6, using this program\u2019s Positional Needs ranking (1 = biggest need = 100, 7 = 60). If the player has a secondary position, the higher of the primary score and the secondary score minus 10 is used.</li>' +
      '<li><strong>Coach Fit Score</strong> = weighted average of: position priority (same scale as above, weight 3); philosophy alignment (weight 3); and each skill priority this program ranks, scored from the player\u2019s own data (Pitching = PPG, Defense = DPG, Athleticism = Athletic Score, Speed = 60 Time scaled 7.6 s &rarr; 0 to 6.4 s &rarr; 100, Power = Avg EV scaled 70 mph &rarr; 0 to 100 mph &rarr; 100, Immediate Impact = Recruit Score), each with weight 8 &minus; its priority rank. Skills with no data for that player are skipped. Long-Term Projection has no data input yet, so it is not used.</li>' +
      '<li><strong>Philosophy alignment</strong> = 50 + 12.5 &times; (rank weight of Prefer Pitching &minus; rank weight of Prefer Position Players) for pitchers, the reverse for position players. If Balanced Approach is ranked above both, it is 50. Rank weights: rank 1 = 5, 2 = 4, 3 = 3, 4 = 2, 5 = 1.</li>' +
      '<li><strong>Adjusted Recruit Score</strong> = Recruit Score + a small adjustment, then kept between 0 and 100. Adjustment = ((Coach Fit + Team Need) &divide; 2 &minus; 50) &divide; 20, limited to &minus;2.5 to +2.5 points. Example: Recruit Score 95.0 with Coach Fit 90 and Team Need 100 gives 95.0 + 2.5 = 97.5. Plus a staff-grade adjustment of up to &plusmn;3 points once any staff grade exists (see Coach Grading). Blank when there is no Recruit Score.</li>' +
      '<li><strong>Priority Score</strong> = weighted average of Recruit Score (weight = rank weight of Best Player Available, now ' + RW(rk(3)) + '), Coach Fit (fixed weight 3) and Team Need (weight = rank weight of Need-Based Recruiting, now ' + RW(rk(4)) + '). Blank when there is no Recruit Score.</li>' +
      '<li><strong>Adjusted Priority Score</strong> (Coach Fit tab) = simple average of Recruit Score, Coach Fit Score and Priority Score. Blank if any of the three is missing.</li>' +
      '<li><strong>Staff Score</strong> = the Head Coach\u2019s weighted average of staff letter grades (Coach Grading tab). With no grades it stays blank.</li></ul></section>';
  };
  players.sort((a, b) => (a.rs == null ? 1 : b.rs == null ? -1 : b.rs - a.rs) || (a.name < b.name ? -1 : 1));
  const rated = players.filter((p) => p.rs != null);
  rated.forEach((p, i) => { p.overall = i + 1; });
  players.filter((p) => p.rs == null).forEach((p) => { p.overall = null; p.classRank = null; });
  [2027, 2028, 2029, 2030].forEach((g) => rated.filter((p) => p.grad === g).forEach((p, i) => { p.classRank = i + 1; }));
  const bySc = players.slice().sort((a, b) => (b.pri || 0) - (a.pri || 0));
  let tcount = { 1: 0, 2: 0, 3: 0 };
  bySc.forEach((p) => {
    if (p.overall != null && !p.entered && p.grad === 2027 && (p.overall % 2 === 0 || p.overall % 5 === 0)) {
      p.committed = p.overall % 3 === 0 ? OUR : SCHOOLS[1 + (p.overall % 7)];
      p.commitDate = '2026-' + String(2 + (p.overall % 8)).padStart(2, '0') + '-' + String(3 + ((p.overall * 3) % 24)).padStart(2, '0');
      return;
    }
    p.committed = '';
    p.board = tcount[1] < 8 ? 1 : tcount[2] < 10 ? 2 : 3;
    tcount[p.board]++;
  });
  const byId = {};
  players.forEach((p) => { byId[p.id] = p; });

  const db = {
    total: players.length,
    avgRS: avg(players.map((p) => p.rs)),
    avgConf: avg(players.map((p) => p.conf)),
    avgAth: avg(players.map((p) => p.ath))
  };
  const avgOf = (k, list) => avg((list || players).map((p) => p[k]));
  const cardLink = (p) => '<a href="coach-player-card.html?id=' + p.id + '">' + esc(p.name) + '</a>';
  const kpi = (l, v) => '<div class="kpi"><span>' + l + '</span><strong>' + v + '</strong></div>';
  const best = (k, list, low) => {
    const c = (list || players).filter((p) => p[k] != null);
    if (!c.length) return null;
    return c.reduce((m, p) => (low ? p[k] < m[k] : p[k] > m[k]) ? p : m);
  };
  const leader = (label, k, list, low, fmtd) => {
    const p = best(k, list, low);
    return '<tr><th scope="row">' + label + '</th><td>' + (p ? cardLink(p) : '&mdash;') + '</td><td>' + (p ? num(p[k], fmtd == null ? 1 : fmtd) : '&mdash;') + '</td></tr>';
  };
  const miniTable = (head, rows, cap) => '<div class="table-wrap"><table>' + (cap ? '<caption class="visually-hidden">' + cap + '</caption>' : '') + '<thead><tr>' + head.map((h) => '<th scope="col">' + h + '</th>').join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
  const card = (title, body, cls) => '<section class="card coach-card ' + (cls || '') + '"><h2>' + title + '</h2>' + body + '</section>';
  const tr = (cells) => '<tr>' + cells.map((c, i) => (i === 0 ? '<th scope="row">' + c + '</th>' : '<td>' + c + '</td>')).join('') + '</tr>';
  const ordinal = (n) => '#' + n;
  const cntTier = (n) => players.filter((p) => p.tier === n).length;
  const cntLevel = (l) => players.filter((p) => p.level === l).length;
  const theRead = (text) => '<aside class="read-note" aria-label="Preview of THE READ AI, generated from sample data"><strong class="read-label"><span class="tr">THE READ</span> AI Preview &mdash; Generated From Sample Data</strong> <span>' + text + '</span></aside>';

  function groupBy(list, k) {
    const m = {};
    list.forEach((p) => { (m[p[k]] = m[p[k]] || []).push(p); });
    return m;
  }

  // ---------- Pages ----------
  const pages = {};

  pages.dashboard = (root) => {
    const tierCount = (t) => players.filter((p) => p.tier === t).length;
    const top = players[0];
    const posCounts = POS.map((x) => tr([x, players.filter((p) => p.pos === x).length]));
    const classCounts = [2027, 2028, 2029, 2030].map((g) => tr([g, players.filter((p) => p.grad === g).length]));
    const conf = (lab) => players.filter((p) => confLabel(p.conf) === lab).length;
    const miss = (k) => players.filter((p) => p[k] == null && !(['avgFBV', 'maxFBV'].includes(k) && p.pos !== 'P' && !p.twoWay) && !(['avgEV', 'maxEV', 't60'].includes(k) && p.pos === 'P')).length;
    const newest = players.slice().sort((a, b) => (a.id < b.id ? 1 : -1))[0];
    const recentEval = best('eval', null);
    const latest = players.reduce((m, p) => (p.eval > m ? p.eval : m), '');
    root.innerHTML =
      '<div class="kpi-row">' + kpi('Total Players', db.total) + kpi('Avg Recruit Score', num(db.avgRS)) + kpi('Avg Confidence %', num(db.avgConf) + '%') + kpi('Avg Athletic Score', num(db.avgAth)) + '</div>' +
      '<div class="coach-grid">' +
      card('Database Health', miniTable(['Player Tier', 'Players'], TRC.TIER_NAMES.map((t) => tr([TRC.renderTierBadge(t === 'Not Rated' ? null : TRC.PLAYER_TIER_CONFIG[t].minimumScore, { showTooltip: false }) + ' <span class="rd-range">' + TRC.PLAYER_TIER_CONFIG[t].rangeLabel + '</span>', tierCount(t)])), 'Database health by Player Tier') + '<p class="coach-note">' + TRC.TEXT.cardTier + ' Tier is derived only from Recruit Score.</p>') +
      card('Top Recruits', miniTable(['Category', 'Player', 'Value'], [
        '<tr><th scope="row">#1 Overall</th><td>' + cardLink(top) + '</td><td>' + num(top.rs) + '</td></tr>',
        leader('Highest Recruit Score', 'rs'), leader('Highest OPG', 'opg'), leader('Highest DPG', 'dpg'), leader('Highest PPG', 'ppg'), leader('Highest Athletic Score', 'ath')], 'Top recruits')) +
      card('Position Breakdown', miniTable(['Position', 'Players'], posCounts, 'Position breakdown')) +
      card('Class Breakdown', miniTable(['Class', 'Players'], classCounts, 'Class breakdown')) +
      card('Database Leaders', miniTable(['Leader', 'Player', 'Value'], [
        leader('Highest Recruit Score', 'rs'), leader('Highest Confidence Score', 'conf', null, false, 0), leader('Highest Avg EV', 'avgEV'), leader('Highest Max EV', 'maxEV'),
        leader('Highest Avg FBV', 'avgFBV'), leader('Highest Max FBV', 'maxFBV'), leader('Fastest 60 Time', 't60', null, true, 2),
        '<tr><th scope="row">Top Ranked Player</th><td>' + cardLink(top) + '</td><td>#1</td></tr>'], 'Database leaders')) +
      card('Confidence Snapshot', miniTable(['Confidence Level', 'Players'], TRC.CONFIDENCE_NAMES.map((l) => tr([TRC.renderConfidenceBadge(l === 'Unknown' ? null : TRC.CONFIDENCE_LEVEL_CONFIG[l].minimumPercentage, { showPercentage: false, showTooltip: false }) + ' <span class="rd-range">' + TRC.CONFIDENCE_LEVEL_CONFIG[l].rangeLabel + '</span>', conf(l)])), 'Confidence snapshot') + '<p class="coach-note">' + TRC.TEXT.cardConfidence + ' It does not measure talent.</p>') +
      card('Database Coverage', miniTable(['Missing Data', 'Players'], [tr(['Players Missing Avg EV', miss('avgEV')]), tr(['Players Missing Max EV', miss('maxEV')]), tr(['Players Missing Avg FBV', miss('avgFBV')]), tr(['Players Missing Max FBV', miss('maxFBV')]), tr(['Players Missing 60 Time', miss('t60')])], 'Database coverage')) +
      card('Database Updates', miniTable(['Update', 'Value'], [tr(['Newest Player Added', cardLink(newest)]), tr(['Most Recent Evaluation', latest]), tr(['Last Database Update', latest])], 'Database updates')) +
      card('Recruiting Snapshot', miniTable(['Snapshot', 'Player', 'Value'], [leader('Highest Avg EV', 'avgEV'), leader('Highest Max EV', 'maxEV'), leader('Highest Avg FBV', 'avgFBV'), leader('Highest Max FBV', 'maxFBV'), leader('Fastest 60 Time', 't60', null, true, 2)], 'Recruiting snapshot')) +
      '</div>' +
      theRead('Sample summary built from this page\u2019s fictional data: ' + db.total + ' sample players, led by ' + esc(top.name) + ' (' + top.pos + ', Class of ' + top.grad + '). ' + cntTier('Platinum') + ' are Platinum and ' + cntTier('Gold') + ' are Gold, while ' + cntTier('Not Rated') + ' are Not Rated because no Recruit Score exists yet (missing data is not a low grade). ' + cntLevel('JUCO') + ' JUCO and ' + cntLevel('4-Year College / Transfer Portal') + ' transfer-portal players are mixed in with high school prospects; use the Playing Level filter on Rankings to separate them. The dashboard summarizes the shared database and is not a recruiting CRM.');
  };

  const RK_COLS = [
    ['overall', 'Overall Rank', (p) => rk(p.overall), 'c-rank'],
    ['classRank', 'Class Rank', (p) => rk(p.classRank), 'c-crank'],
    ['name', 'Player Name', (p) => cardLink(p) + '<small class="rd-mobile-meta">' + p.pos + ' &middot; Class of ' + p.grad + ' &middot; ' + p.state + '</small>', 'c-name'],
    ['grad', 'Grad Class', (p) => p.grad, 'c-grad'],
    ['pos', 'Primary Position', (p) => p.pos, 'c-pos'],
    ['sec', 'Secondary Position', (p) => p.sec || '&mdash;', 'c-sec'],
    ['rs', 'Recruit Score', (p) => TRC.formatRecruitScore(p.rs), 'c-rs rd-num', TRC.TEXT.recruitScoreTooltip],
    ['tier', 'Tier', (p) => tierBadge(p), 'c-tier', TRC.TEXT.tierTooltip],
    ['conf', 'Confidence', (p) => confBadge(p), 'c-conf', TRC.TEXT.confidenceTooltip],
    ['opg', 'OPG', (p) => num(p.opg), 'c-grade rd-num'],
    ['dpg', 'DPG', (p) => num(p.dpg), 'c-grade rd-num'],
    ['ppg', 'PPG', (p) => num(p.ppg), 'c-grade rd-num'],
    ['level', 'Playing Level', (p) => esc(LEVEL_SHORT[p.level] || p.level), 'c-level']
  ];
  const rankingRowHtml = (p) => '<tr>' + RK_COLS.map((c) => (c[0] === 'name'
    ? '<th scope="row" class="' + c[3] + '">' + c[2](p) + '</th>'
    : '<td class="' + c[3] + '" data-label="' + c[1] + '">' + c[2](p) + '</td>')).join('') + '</tr>';

  pages.rankings = (root) => {
    const state = { key: 'rs', dir: -1 };
    const checks = (name, label, names) => '<fieldset class="rd-multi"><legend>' + label + '</legend>' + names.map((n) => '<label class="rd-check"><input type="checkbox" name="' + name + '" value="' + n + '" /> <span>' + n + '</span></label>').join('') + '</fieldset>';
    root.innerHTML =
      '<form class="controls" id="r-form" aria-label="Filter rankings" onsubmit="return false">' +
      '<label>Search<input type="search" id="f-q" placeholder="Name, position, class, or state" /></label>' +
      '<label>Position<select id="f-pos"><option value="">All</option>' + POS.map((x) => '<option>' + x + '</option>').join('') + '</select></label>' +
      '<label>Class<select id="f-class"><option value="">All</option>' + [2027, 2028, 2029, 2030].map((g) => '<option>' + g + '</option>').join('') + '</select></label>' +
      '<label>Playing Level<select id="f-level"><option value="">All</option>' + LEVELS.map((x) => '<option>' + x + '</option>').join('') + '</select></label>' +
      checks('tier', 'Tier', TRC.TIER_NAMES) + checks('conf', 'Confidence', TRC.CONFIDENCE_NAMES) +
      '<button type="button" class="button button-secondary" id="r-reset">Reset</button>' +
      '</form><p class="coach-count" id="r-count" role="status"></p><div class="table-wrap"><table id="r-table" class="rd-table"></table></div>' +
      '<div class="rd-legend"><h2>How To Read Recruit Score, Tier, And Confidence</h2><ul>' +
      '<li><strong>Recruit Score:</strong> ' + TRC.TEXT.recruitScoreTooltip + '</li>' +
      '<li><strong>Tier:</strong> ' + TRC.TEXT.tierTooltip + ' Platinum 95.0&ndash;100.0, Gold 85.0&ndash;94.9, Silver 70.0&ndash;84.9, Bronze 0.0&ndash;69.9, Not Rated when no Recruit Score exists. Tier uses the full stored score before rounding, so a stored 94.96 displays as 95.0 and is Gold.</li>' +
      '<li><strong>Confidence:</strong> ' + TRC.TEXT.confidenceTooltip + ' High 90.0%&ndash;100.0%, Medium 60.0%&ndash;89.9%, Low 0.0%&ndash;59.9%, Unknown when it cannot be calculated. A stored 89.96% displays as 90.0% and is Medium. ' + TRC.TEXT.lowConfidenceTooltip + '</li></ul></div>' + formulaPanel() + theRead('Rankings sort the shared database by Recruit Score by default. Tier and Confidence are separate: Tier reflects the evaluated profile and Confidence reflects how much verified data supports it, so a high Confidence never makes a player more talented. Rows with no Recruit Score show Not Rated and sort last. Coach Fit, Team Need and Priority are program-specific and never change Tier.');
    const tbl = $('#r-table', root);
    const picked = (name) => Array.from(root.querySelectorAll('input[name="' + name + '"]:checked')).map((i) => i.value);
    function draw() {
      const fp = $('#f-pos', root).value, fc = $('#f-class', root).value, fl = $('#f-level', root).value;
      let list = TRC.filterAthletes(players, {
        search: $('#f-q', root).value, tiers: picked('tier'), confidences: picked('conf'),
        extra: (p) => (!fp || p.pos === fp) && (!fc || String(p.grad) === fc) && (!fl || p.level === fl)
      });
      const k = state.key, dir = state.dir === 1 ? 'asc' : 'desc';
      if (k === 'rs') list = TRC.sortAthletes(list, 'recruitScore', dir);
      else if (k === 'tier') list = TRC.sortAthletes(list, 'tier', dir);
      else if (k === 'conf') list = TRC.sortAthletes(list, 'confidence', dir);
      else {
        list = list.slice().sort((a, b) => {
          const x = a[k], y = b[k];
          if (x == null && y == null) return 0;
          if (x == null) return 1;
          if (y == null) return -1;
          if (typeof x === 'string') return x.localeCompare(y) * state.dir;
          return (x - y) * state.dir;
        });
      }
      $('#r-count', root).textContent = 'Showing ' + list.length + ' of ' + players.length + ' sample players';
      tbl.innerHTML = '<caption class="visually-hidden">Player rankings (sample data, fictional)</caption><thead><tr>' + RK_COLS.map((c) => '<th scope="col" class="' + c[3].replace('c-name', 'c-name-h') + '"' + (c[4] ? ' title="' + esc(c[4]) + '"' : '') + ' aria-sort="' + (state.key === c[0] ? (state.dir === 1 ? 'ascending' : 'descending') : 'none') + '"><button type="button" data-k="' + c[0] + '">' + c[1] + (state.key === c[0] ? (state.dir === 1 ? ' \u25B2' : ' \u25BC') : '') + '</button></th>').join('') + '</tr></thead><tbody>' +
        list.map(rankingRowHtml).join('') + '</tbody>';
      if (!list.length) tbl.querySelector('tbody').innerHTML = '<tr class="rd-empty"><td colspan="' + RK_COLS.length + '"><p>' + TRC.TEXT.empty + '</p><button type="button" class="button button-secondary" data-reset="1">Reset Filters</button></td></tr>';
    }
    function reset() {
      $('#r-form', root).reset();
      state.key = 'rs'; state.dir = -1;
      draw();
    }
    root.addEventListener('click', (e) => {
      if (e.target.closest('#r-reset, [data-reset]')) { reset(); const q = $('#f-q', root); if (q) q.focus(); return; }
      const b = e.target.closest('button[data-k]');
      if (!b) return;
      const k = b.dataset.k;
      if (state.key === k) state.dir *= -1; else { state.key = k; state.dir = (k === 'name' || k === 'grad' || k === 'pos' || k === 'sec' || k === 'overall' || k === 'classRank') ? 1 : -1; }
      draw();
      const nb = $('button[data-k="' + k + '"]', root); if (nb) nb.focus();
    });
    root.addEventListener('input', draw);
    draw();
  };

  function playerOptions(sel, selected) {
    sel.innerHTML = players.map((p) => '<option value="' + p.id + '"' + (p.id === selected ? ' selected' : '') + '>' + esc(p.name) + ' \u2014 ' + p.pos + ', ' + p.grad + '</option>').join('');
  }

  const field = (l, v) => '<div class="kv"><span>' + l + '</span><strong>' + v + '</strong></div>';
  const bench = (k, p, low, d) => {
    const a = avgOf(k, players);
    if (p[k] == null || a == null) return '&mdash;';
    const diff = p[k] - a;
    const good = low ? diff < 0 : diff > 0;
    return '<span class="' + (Math.abs(diff) < 0.05 ? '' : good ? 'adv-good' : 'adv-bad') + '">' + (diff > 0 ? '+' : '') + diff.toFixed(d == null ? 1 : d) + ' vs avg ' + a.toFixed(d == null ? 1 : d) + '</span>';
  };

  function playerCardHtml(p) {
    const stand = p.overall == null ? 'Not ranked (Not Rated)' : p.overall <= 5 ? 'Top 5 overall' : p.overall <= 15 ? 'Top 15 overall' : 'Rank ' + p.overall + ' of ' + players.filter((x) => x.rs != null).length;
      return photoHead(p) +
        '<div class="coach-grid">' +
        card(esc(p.name), field('Grad Year', p.grad) + field('Primary Position', p.pos) + field('Secondary Position', p.sec || '&mdash;') + field('Bats/Throws', p.bats + '/' + p.throws) + field('Height', ftin(p.ht)) + field('Weight', p.wt + ' lb') + field('GPA', p.gpa.toFixed(2)) + field('State', p.state) + field('Current Playing Level', esc(p.level)), 'kvs') +
        card('Rankings', field('Overall Rank', rk(p.overall)) + field('Class Rank', rk(p.classRank)) + field('Athletic Score', num(p.ath)), 'kvs') +
        card('Recruit Score, Player Tier, And Confidence', field('Recruit Score', '<span class="rd-num" title="' + esc(TRC.TEXT.recruitScoreTooltip) + '">' + TRC.formatRecruitScore(p.rs) + '</span>') + field('Player Tier', tierBadge(p, { focusable: true, size: 'large' })) + field('Confidence', confBadge(p, { focusable: true, size: 'large' })) +
          '<p class="coach-note">' + TRC.TEXT.cardTier + ' ' + TRC.TEXT.cardConfidence + ' Missing data lowers Confidence, not Recruit Score.</p>', 'kvs rd-triple') +
        card('Grades', field('OPG', num(p.opg)) + field('SOPG', num(p.sopg)) + field('DPG', num(p.dpg)) + field('SDPG', num(p.sdpg)) + field('PPG', num(p.ppg)), 'kvs') +
        card('Team Evaluation', field('HC Grade', nv(p.hc)) + field('PC Grade', nv(p.pc)) + field('AC Grade', nv(p.ac)) + field('Staff Score', staffTxt(p)) + field('Coach Fit Score', nv(p.fit)) + field('Team Need Score', nv(p.need)) + field('Adjusted Recruit Score', num(p.adj)) + field('Priority Score', nv(p.pri)), 'kvs') +
        card('Measurables', field('Avg EV', num(p.avgEV) + ' mph') + field('Max EV', num(p.maxEV) + ' mph') + field('Avg FBV', num(p.avgFBV) + ' mph') + field('Max FBV', num(p.maxFBV) + ' mph') + field('Throwing Velo', num(p.tv) + ' mph') + field('60 Time', num(p.t60, 2) + ' s') + field('Pop Time', num(p.pop, 2) + ' s'), 'kvs') +
        card('Database Benchmarks', field('Avg EV vs Avg', bench('avgEV', p)) + field('Max EV vs Avg', bench('maxEV', p)) + field('Avg FBV vs Avg', bench('avgFBV', p)) + field('60 Time vs Avg', bench('t60', p, true, 2)) + field('Overall Standing', stand), 'kvs') +
        card('External Profile Links', field('PBR', 'Not linked in demo') + field('PG', 'Not linked in demo') + field('NCSA', 'Not linked in demo') + field('Fieldlevel', 'Not linked in demo') + field('Video', 'Not linked in demo'), 'kvs') +
        '</div>' +
        theRead('Sample summary for ' + esc(p.name) + ' (fictional): ' + (p.rs == null ? 'Not Rated ' + p.pos + '. Recruit Score has not been calculated, so no Player Tier is assigned (this is not the same as Bronze).' : p.tier + ' ' + p.pos + ' with a Recruit Score of ' + TRC.formatRecruitScore(p.rs) + '.') + ' Confidence: ' + (p.conf == null ? 'Unknown (not calculated).' : confLabel(p.conf) + ' at ' + TRC.formatConfidencePercentage(p.conf) + ' of expected verified data.') + ' Evaluation method: ' + p.method + '. ' + esc(p.notes));
  }

  // Pop-up player card (opens from any player-name link; no page navigation)
  const SIL = '<svg viewBox="0 0 64 64" role="img" aria-label="No profile photo" focusable="false"><rect width="64" height="64" fill="#e9edf6"/><circle cx="32" cy="24" r="11" fill="#9aa6c0"/><path d="M10 62c2-16 12-24 22-24s20 8 22 24z" fill="#9aa6c0"/></svg>';
  function photoHead(p) {
    const img = p.photo ? '<img src="' + esc(p.photo) + '" alt="Profile photo of ' + esc(p.name) + '" loading="lazy" referrerpolicy="no-referrer">' : SIL;
    return '<div class="pc-head"><div class="pc-photo">' + img + '</div><div><h2 class="pc-name">' + esc(p.name) + '</h2><p class="pc-sub">' + esc(p.pos) + ' \u00b7 Class of ' + p.grad + ' \u00b7 ' + esc(p.state) + ' \u00b7 ' + esc(LEVEL_SHORT[p.level] || p.level) + '</p><p class="coach-note">' + (p.photo ? 'Photo provided with the profile.' : 'No athlete-provided photo yet. Photos appear here only when the athlete adds one.') + ' Sample Data / Fictional Example.</p></div></div>';
  }
  function openCardModal(id, opener) {
    const p = byId[id]; if (!p) return;
    const old = document.getElementById('pc-modal'); if (old) old.remove();
    const wrap = document.createElement('div');
    wrap.id = 'pc-modal'; wrap.className = 'pc-modal';
    wrap.innerHTML = '<div class="pc-backdrop" data-close="1"></div><div class="pc-dialog" role="dialog" aria-modal="true" aria-labelledby="pc-modal-title" tabindex="-1"><div class="pc-bar"><span id="pc-modal-title">Player Card: ' + esc(p.name) + '</span><span><a class="button button-outline pc-full" data-full="1" href="coach-player-card.html?id=' + p.id + '">Open Full Player Card</a> <button type="button" class="pc-close" data-close="1" aria-label="Close player card">&times; Close</button></span></div><div class="pc-body">' + playerCardHtml(p) + '</div></div>';
    document.body.appendChild(wrap);
    document.body.classList.add('pc-open');
    const dlg = wrap.querySelector('.pc-dialog');
    const focusables = () => Array.prototype.slice.call(dlg.querySelectorAll('a[href],button,[tabindex="0"],select,input'));
    const close = () => { wrap.remove(); document.body.classList.remove('pc-open'); document.removeEventListener('keydown', onKey, true); if (opener && opener.focus) opener.focus(); };
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      const f = focusables(); if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dlg)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    wrap.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', onKey, true);
    dlg.focus();
  }
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const a = e.target.closest && e.target.closest('a[href^="coach-player-card.html?id="]');
    if (!a || a.hasAttribute('data-full') || document.body.dataset.coachPage === 'player') return;
    e.preventDefault();
    openCardModal(a.getAttribute('href').split('id=')[1], a);
  });
  pages.player = (root) => {
    const qid = new URLSearchParams(location.search).get('id');
    root.innerHTML = '<form class="controls" onsubmit="return false"><label>Player<select id="pc-sel"></select></label></form><div id="pc-out"></div>';
    const sel = $('#pc-sel', root);
    playerOptions(sel, byId[qid] ? qid : players[0].id);
    function draw() { $('#pc-out', root).innerHTML = playerCardHtml(byId[sel.value]); }
    sel.addEventListener('change', () => { history.replaceState(null, '', '?id=' + sel.value); draw(); });
    draw();
  };

  pages.h2h = (root) => {
    root.innerHTML = '<div id="h-out"></div>';
    const SIDES = ['a', 'b'];
    const T = { rank: [['Overall Rank', 'overall', 'low', (v) => '#' + v], ['Class Rank', 'classRank', 'low', (v) => '#' + v], ['Athletic Score', 'ath', 'high'], ['Recruit Score', 'rs', 'high', (v) => TRC.formatRecruitScore(v)], ['Player Tier', 'rs', 'tier'], ['Confidence', 'conf', 'data']],
      info: [['Player Name', 'name'], ['Primary Position', 'pos'], ['Secondary Position', 'sec'], ['Grad Year', 'grad', null, (v) => String(v)], ['Height', 'ht', null, (v) => ftin(v)], ['Weight', 'wt', null, (v) => v + ' lb'], ['GPA', 'gpa', null, (v) => v.toFixed(2)]],
      grades: [['OPG', 'opg', 'high'], ['SOPG', 'sopg', 'high'], ['DPG', 'dpg', 'high'], ['SDPG', 'sdpg', 'high'], ['PPG', 'ppg', 'high']],
      meas: [['Avg EV', 'avgEV', 'high'], ['Max EV', 'maxEV', 'high'], ['Avg FBV', 'avgFBV', 'high'], ['Max FBV', 'maxFBV', 'high'], ['Throwing Velo', 'tv', 'high'], ['60 Time', 't60', 'low', (v) => v.toFixed(2)], ['Pop Time', 'pop', 'low', (v) => v.toFixed(2)]],
      team: [['HC Grade', 'hc', 'grade'], ['PC Grade', 'pc', 'grade'], ['AC Grade', 'ac', 'grade'], ['Staff Score', 'staff', 'high'], ['Coach Fit Score', 'fit', 'high'], ['Team Need Score', 'need', 'high'], ['Adjusted Recruit Score', 'adj', 'high'], ['Priority Score', 'pri', 'high']] };

    // Database Benchmarks: [label, key, lowerIsBetter, unit, decimals]
    const B = [['Avg EV vs Avg', 'avgEV', false, ' mph', 1], ['Max EV vs Avg', 'maxEV', false, ' mph', 1], ['Avg FBV vs Avg', 'avgFBV', false, ' mph', 1], ['Max FBV vs Avg', 'maxFBV', false, ' mph', 1], ['60 Time vs Avg', 't60', true, ' s', 2], ['Pop Time vs Avg', 'pop', true, ' s', 2]];
    const dbAvg = {}, dbN = {};
    B.forEach((b) => { const vals = players.map((p) => p[b[1]]).filter((v) => v != null); dbN[b[1]] = vals.length; dbAvg[b[1]] = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null; });
    const diffOf = (b, p) => (p[b[1]] == null || dbAvg[b[1]] == null ? null : p[b[1]] - dbAvg[b[1]]);
    const goodDiff = (b, df) => (b[2] ? df < 0 : df > 0);
    // Positive result favors A, negative favors B, 0 tie, null not comparable. Lower is better for 60 Time / Pop Time.
    const benchCmp = (b, pa, pb) => { const x = diffOf(b, pa), y = diffOf(b, pb); if (x == null || y == null) return null; const c = b[2] ? y - x : x - y; return Math.abs(c) < 1e-9 ? 0 : c; };
    const benchText = (b, p) => {
      const df = diffOf(b, p);
      if (df == null) return '&mdash;';
      const dd = b[4];
      const cls = Math.abs(df) < Math.pow(10, -dd) / 2 ? '' : goodDiff(b, df) ? 'adv-good' : 'adv-bad';
      return '<span class="' + cls + '">' + (df > 0 ? '+' : df < 0 ? '\u2212' : '') + Math.abs(df).toFixed(dd) + b[3] + '</span><small class="h2h-sub">' + p[b[1]].toFixed(dd) + b[3] + ' vs avg ' + dbAvg[b[1]].toFixed(dd) + '</small>';
    };
    const standOf = (p) => { let n = 0, m = 0; B.forEach((b) => { const df = diffOf(b, p); if (df == null) return; m++; if (goodDiff(b, df)) n++; }); return { n: n, m: m, r: m ? n / m : null }; };
    const standText = (p) => { const s = standOf(p); if (!s.m) return '&mdash;'; return s.n + ' Of ' + s.m + ' Above Avg<small class="h2h-sub">' + (s.r >= 0.75 ? 'Strong' : s.r >= 0.5 ? 'Above Average' : s.r >= 0.25 ? 'Below Average' : 'Well Below Average') + '</small>'; };
    const standCmp = (pa, pb) => { const x = standOf(pa).r, y = standOf(pb).r; if (x == null || y == null) return null; return Math.abs(x - y) < 1e-9 ? 0 : x - y; };

    const show = (d, p) => {
      if (d[2] === 'tier') return tierBadge(p, { focusable: true });
      if (d[2] === 'data') return confBadge(p, { focusable: true });
      const v = p[d[1]]; if (v == null || v === '') return '&mdash;'; return d[3] ? d[3](v) : (typeof v === 'number' ? num(v) : esc(v));
    };
    const tierOrder = (p) => TRC.PLAYER_TIER_CONFIG[p.tier].sortOrder;
    function cmpOf(d, pa, pb) {
      if (d[2] === 'tier') return pa.rs == null || pb.rs == null ? null : tierOrder(pa) - tierOrder(pb);
      if (d[2] === 'data') return null;
      const x = pa[d[1]], y = pb[d[1]];
      if (!d[2] || x == null || y == null) return null;
      const c = d[2] === 'grade' ? GRADES.indexOf(x) - GRADES.indexOf(y) : d[2] === 'low' ? y - x : x - y;
      return Math.abs(c) < 1e-9 ? 0 : c;
    }
    const edgeHtml = (c, pa, pb) => {
      if (c === null) return '';
      if (c === 0) return '<span class="adv-even">Tie</span>';
      return c > 0 ? '<span class="adv-a"><span aria-hidden="true">\u25C0</span> ' + esc(pa.name) + '</span>' : '<span class="adv-b">' + esc(pb.name) + ' <span aria-hidden="true">\u25B6</span></span>';
    };
    // Confidence is never a talent winner: the center only says who has more verified data behind the evaluation.
    const dataEdge = (pa, pb) => {
      if (pa.conf == null || pb.conf == null) return '<span class="adv-even">Data: Not Comparable</span>';
      if (pa.conf === pb.conf) return '<span class="adv-even">Same Verified Data</span>';
      return '<span class="adv-even">More Verified Data: ' + esc(pa.conf > pb.conf ? pa.name : pb.name) + '</span>';
    };
    const edge = (d, pa, pb) => (d[2] === 'data' ? dataEdge(pa, pb) : edgeHtml(cmpOf(d, pa, pb), pa, pb));

    // Self-check: lower 60 Time / Pop Time must win, higher Avg EV must win, benchmarks must agree.
    function selfCheck() {
      const fast = { t60: 6.8, pop: 1.9, avgEV: 90 }, slow = { t60: 7.4, pop: 2.1, avgEV: 85 };
      const d60 = T.meas.filter((d) => d[1] === 't60')[0], dpop = T.meas.filter((d) => d[1] === 'pop')[0], dev = T.meas.filter((d) => d[1] === 'avgEV')[0];
      const b60 = B.filter((b) => b[1] === 't60')[0], bpop = B.filter((b) => b[1] === 'pop')[0];
      const dtier = T.rank.filter((d) => d[2] === 'tier')[0], ddata = T.rank.filter((d) => d[2] === 'data')[0];
      const tests = [cmpOf(d60, fast, slow) > 0, cmpOf(d60, slow, fast) < 0, cmpOf(dpop, fast, slow) > 0, cmpOf(dpop, slow, fast) < 0, cmpOf(dev, fast, slow) > 0, cmpOf(dev, slow, fast) < 0, cmpOf(d60, fast, fast) === 0,
        cmpOf(dtier, { rs: 96, tier: 'Platinum' }, { rs: 90, tier: 'Gold' }) > 0, cmpOf(dtier, { rs: null, tier: 'Not Rated' }, { rs: 60, tier: 'Bronze' }) === null, cmpOf(ddata, { conf: 99 }, { conf: 10 }) === null];
      const bt = [fast, slow].map((p) => ({ t60: p.t60, pop: p.pop }));
      const bGood = dbAvg.t60 != null && dbAvg.pop != null && benchCmp(b60, bt[0], bt[1]) > 0 && benchCmp(b60, bt[1], bt[0]) < 0 && benchCmp(bpop, bt[0], bt[1]) > 0 && benchCmp(bpop, bt[1], bt[0]) < 0;
      const ok = tests.every(Boolean) && bGood;
      if (typeof console !== 'undefined') console[ok ? 'info' : 'error']('H2H self-check ' + (ok ? 'passed' : 'FAILED') + ': lower 60 Time and Pop Time win; higher exit velocity wins.');
      return ok;
    }
    const checkOk = selfCheck();

    const withData = players.filter((p) => p.t60 != null && p.rs != null && p.conf != null);
    let ids = { a: withData[0].id, b: withData[1].id };

    const row = (d, pa, pb, withEdge) => '<div class="h2h-row"><span class="h2h-l">' + d[0] + '</span><span class="h2h-a">' + show(d, pa) + '</span><span class="h2h-c">' + (withEdge ? edge(d, pa, pb) : '') + '</span><span class="h2h-b">' + show(d, pb) + '</span><span class="h2h-r" aria-hidden="true">' + d[0] + '</span></div>';
    const sec = (name, center) => '<div class="h2h-sec"><span class="h2h-l">' + name + '</span><span class="h2h-c">' + (center || '') + '</span><span class="h2h-r" aria-hidden="true">' + name + '</span></div>';
    const brow = (label, ta, tb, c, pa, pb) => '<div class="h2h-row"><span class="h2h-l">' + label + '</span><span class="h2h-a">' + ta + '</span><span class="h2h-c">' + edgeHtml(c, pa, pb) + '</span><span class="h2h-b">' + tb + '</span><span class="h2h-r" aria-hidden="true">' + label + '</span></div>';

    function breakdown(pa, pb) {
      const benchRows = B.map((b) => ({ name: b[0].replace(' vs Avg', ''), c: benchCmp(b, pa, pb), x: diffOf(b, pa), y: diffOf(b, pb) }));
      const groups = [
        ['Rankings', T.rank.map((d) => ({ name: d[0], c: cmpOf(d, pa, pb), x: pa[d[1]], y: pb[d[1]], num: d[2] === 'high' || d[2] === 'low' }))],
        ['Grades', T.grades.map((d) => ({ name: d[0], c: cmpOf(d, pa, pb), x: pa[d[1]], y: pb[d[1]], num: true }))],
        ['Measurables', T.meas.map((d) => ({ name: d[0], c: cmpOf(d, pa, pb), x: pa[d[1]], y: pb[d[1]], num: true }))],
        ['Database Benchmarks', benchRows.map((o) => ({ name: o.name + ' vs Avg', c: o.c, x: null, y: null, num: false })).concat([{ name: 'Overall Standing', c: standCmp(pa, pb), x: null, y: null, num: false }])],
        ['Team Evaluation', T.team.map((d) => ({ name: d[0], c: cmpOf(d, pa, pb), x: pa[d[1]], y: pb[d[1]], num: d[2] !== 'grade' }))]
      ];
      const tot = { a: 0, b: 0, t: 0 }, per = [], wonA = [], wonB = [], diffs = [];
      groups.forEach((g) => {
        const c = { a: 0, b: 0, t: 0 };
        g[1].forEach((o) => {
          if (o.c === null) return;
          if (o.c === 0) c.t++; else if (o.c > 0) { c.a++; wonA.push(o.name); } else { c.b++; wonB.push(o.name); }
          if (o.num && typeof o.x === 'number' && typeof o.y === 'number' && o.c !== 0) diffs.push([o.name, Math.abs(o.x - o.y) / ((Math.abs(o.x) + Math.abs(o.y)) / 2 || 1), o.c > 0 ? pa.name : pb.name]);
        });
        per.push([g[0], c]); tot.a += c.a; tot.b += c.b; tot.t += c.t;
      });
      const team = per[4][1];
      const lead = tot.a === tot.b ? 'The comparison is even overall.' : (tot.a > tot.b ? esc(pa.name) : esc(pb.name)) + ' wins more categories overall.';
      diffs.sort((x, y) => y[1] - x[1]);
      const list = (a) => (a.length ? a.join(', ') : 'none');
      const teamLine = team.a === team.b ? 'Team Edge is even (' + team.a + '\u2013' + team.b + ').' : 'Team Edge goes to ' + esc(team.a > team.b ? pa.name : pb.name) + ' (' + Math.max(team.a, team.b) + '\u2013' + Math.min(team.a, team.b) + (team.t ? ', ' + team.t + ' tied' : '') + '), with Priority Score ' + (pa.pri == null || pb.pri == null ? 'not comparable' : pa.pri === pb.pri ? 'tied' : 'favoring ' + esc(pa.pri > pb.pri ? pa.name : pb.name)) + '.';
      return '<section class="h2h-ai" aria-label="The READ AI preview"><h3><span class="tr">THE READ</span> AI</h3><p class="h2h-ai-tag">Preview Of THE READ AI &mdash; Generated From Sample Data</p>' +
        '<p class="h2h-ai-note">Rule-based text built in your browser from the selected sample players. It is not a live AI.</p>' +
        '<div class="h2h-ai-grid"><div><h4>Category Wins</h4><ul>' + per.map((p) => '<li><strong>' + p[0] + ':</strong> ' + esc(pa.name) + ' ' + p[1].a + ' \u2013 ' + p[1].b + ' ' + esc(pb.name) + (p[1].t ? ' (' + p[1].t + ' tied)' : '') + '</li>').join('') + '<li><strong>Total:</strong> ' + tot.a + ' \u2013 ' + tot.b + (tot.t ? ' (' + tot.t + ' tied)' : '') + '. ' + lead + '</li></ul></div>' +
        '<div><h4>Strengths</h4><ul><li><strong>' + esc(pa.name) + ':</strong> ' + list(wonA) + '</li><li><strong>' + esc(pb.name) + ':</strong> ' + list(wonB) + '</li></ul></div>' +
        '<div><h4>Biggest Differences</h4><ul>' + (diffs.length ? diffs.slice(0, 3).map((x) => '<li>' + x[0] + ' &mdash; edge to ' + esc(x[2]) + '</li>').join('') : '<li>No comparable differences.</li>') + '</ul></div>' +
        '<div><h4>Team Edge Summary</h4><p>' + teamLine + '</p></div>' +
        '<div><h4>Confidence (Verified Data)</h4><p>' + esc(pa.name) + ': ' + confBadge(pa, { showTooltip: false }) + ' &nbsp; ' + esc(pb.name) + ': ' + confBadge(pb, { showTooltip: false }) + '</p><p>Confidence shows how much verified data supports each evaluation. It is not counted in category wins, does not make either player more talented, and missing data is never treated as poor performance. ' + (pa.rs == null || pb.rs == null ? 'At least one player is Not Rated, so Recruit Score and Player Tier cannot be compared.' : 'Talent is compared by Recruit Score (' + TRC.formatRecruitScore(pa.rs) + ' vs ' + TRC.formatRecruitScore(pb.rs) + ') and Player Tier (' + pa.tier + ' vs ' + pb.tier + ').') + '</p></div></div>' +
        '<p class="h2h-ai-note">Rows with a blank value are skipped. Database Benchmarks use the sample database averages shown above. For 60 Time and Pop Time the lower value wins.</p></section>';
    }

    function avgTable() {
      return '<section class="h2h-avgs" aria-label="Sample database averages"><h3>Sample Database Averages</h3><p class="h2h-ai-tag">Sample Data / Fictional Example</p>' +
        miniTable(['Metric', 'Database Average', 'Players Counted', 'Better Direction'], B.map((b) => '<tr><th scope="row">' + b[0].replace(' vs Avg', '') + '</th><td>' + dbAvg[b[1]].toFixed(b[4]) + b[3] + '</td><td>' + dbN[b[1]] + ' of ' + players.length + '</td><td>' + (b[2] ? 'Lower' : 'Higher') + '</td></tr>'), 'Sample database averages') +
        '<p class="coach-note">Averages use only sample players who have the metric (blank values are ignored): Pop Time uses catchers, FBV uses pitchers and two-way players. &ldquo;vs Avg&rdquo; is the player&rsquo;s value minus the average; for 60 Time and Pop Time a negative difference is good. Self-check (lower 60 Time and Pop Time win): <strong>' + (checkOk ? 'Passed' : 'Failed') + '</strong>.</p></section>';
    }

    function draw() {
      const pa = byId[ids.a], pb = byId[ids.b];
      const pick = (s, label) => '<label class="h2h-pick"><span>' + label + '</span><select id="h-' + s + '" aria-label="' + label + '"></select></label>';
      const readTxt = 'Sample comparison (fictional). ' + (pa.rs == null || pb.rs == null ? 'Recruit Score difference is unavailable because a player is Not Rated.' : 'Recruit Score difference A\u2212B: ' + ((pa.rs - pb.rs) > 0 ? '+' : '') + (pa.rs - pb.rs).toFixed(1) + '.') + ' Benchmarks are measured against the sample database averages below.';
      const html = '<section class="h2h-sheet" aria-label="H2H Player Comparison">' +
        '<h2 class="h2h-title">H2H Player Comparison</h2>' +
        '<div class="h2h-top"><div class="h2h-pa">' + pick('a', 'Player A') + '</div><div class="h2h-mid">H2H</div><div class="h2h-pb">' + pick('b', 'Player B') + '</div></div>' +
        '<div class="h2h-block">' + T.info.map((d) => row(d, pa, pb, false)).join('') + '</div>' +
        '<div class="h2h-block">' + sec('Rankings', 'Advantage') + T.rank.map((d) => row(d, pa, pb, true)).join('') + '</div>' +
        '<div class="h2h-block">' + sec('Grades', 'Advantage') + T.grades.map((d) => row(d, pa, pb, true)).join('') + '</div>' +
        '<div class="h2h-block">' + sec('Measurables', 'Advantage') + T.meas.map((d) => row(d, pa, pb, true)).join('') + '</div>' +
        '<div class="h2h-block h2h-bench">' + sec('Database Benchmarks', 'Advantage') +
        B.map((b) => brow(b[0], benchText(b, pa), benchText(b, pb), benchCmp(b, pa, pb), pa, pb)).join('') +
        brow('Overall Standing', standText(pa), standText(pb), standCmp(pa, pb), pa, pb) + '</div>' +
        '<aside class="h2h-read" aria-label="Sample summary"><strong class="tr">THE READ</strong><span>' + readTxt + '</span></aside>' +
        avgTable() +
        '<div class="h2h-block">' + sec('Team Evaluation', 'Team Edge') + T.team.map((d) => row(d, pa, pb, true)).join('') + '</div>' + breakdown(pa, pb) +
        '</section>';
      $('#h-out', root).innerHTML = html;
      SIDES.forEach((s) => { const el = $('#h-' + s, root); playerOptions(el, ids[s]); });
    }
    root.addEventListener('change', (e) => {
      const t = e.target;
      if (!t || (t.id !== 'h-a' && t.id !== 'h-b')) return;
      ids[t.id === 'h-a' ? 'a' : 'b'] = t.value;
      draw();
      const f = $('#' + t.id, root); if (f) f.focus();
    });
    draw();
  };

  pages.needs = (root) => {
    const needs = POS_NEED;
    const skills = [['Pitching', 1], ['Defense', 2], ['Athleticism', 3], ['Speed', 4], ['Power', 5]];
    const ours = players.filter((p) => p.committed === OUR);
    const goals = { size: 14, pitchers: 6, posPlayers: 8 };
    const commitP = ours.filter((p) => p.pos === 'P').length;
    root.innerHTML =
      '<div class="coach-grid">' +
      card('Positional Needs', miniTable(['Position', 'Need Rank (1 = Biggest)'], POS.map((x) => tr([x, needs[x]])), 'Positional needs') + '<p class="coach-note">Secondary-position eligibility may partially satisfy a need.</p>') +
      card('Skill Needs', miniTable(['Skill', 'Need Rank (1\u20135)'], skills.map((s) => tr([s[0], s[1]])), 'Skill needs')) +
      card('Program Priorities', miniTable(['Priority', 'Importance (1\u20135)'], [tr(['Immediate Impact', 2]), tr(['Long-Term Projection', 1]), tr(['Academic Fit', 3])], 'Program priorities')) +
      card('Commitment Goals', miniTable(['Goal', 'Target', 'Committed', 'Open'], [tr(['Target Class Size', goals.size, ours.length, goals.size - ours.length]), tr(['Pitchers Needed', goals.pitchers, commitP, goals.pitchers - commitP]), tr(['Position Players Needed', goals.posPlayers, ours.length - commitP, goals.posPlayers - (ours.length - commitP)])], 'Commitment goals')) +
      card('Biggest Needs', miniTable(['Rank', 'Need'], [tr(['#1 Need', 'Pitcher (Positional)']), tr(['#2 Need', 'Catcher (Positional)']), tr(['#3 Need', 'Defense (Skill)']), tr(['#4 Need', 'Shortstop (Positional)']), tr(['#5 Need', 'Long-Term Projection (Priority)'])], 'Biggest needs')) +
      card('Team Breakdown', miniTable(['Type', 'Top Item'], [tr(['Positional Need', 'P']), tr(['Skill Need', 'Pitching']), tr(['Program Priority', 'Long-Term Projection'])], 'Team breakdown')) +
      card('Recruiting Philosophy (Rank 1\u20135)', '<form id="philo-form" class="philo" onsubmit="return false"><p class="coach-note">Rank every approach from 1 (most important) to 5. Each rank must be used once. These ranks feed Coach Fit and Priority Score (see How This Is Calculated).</p><div class="form-grid">' + PHIL_OPTS.map((x, i) => '<label>' + x + '<select name="ph' + i + '" aria-label="Rank for ' + x + '">' + [1, 2, 3, 4, 5].map((n) => '<option' + (PHIL[i] === n ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label>').join('') + '</div><ul class="md-errors" id="philo-errors" role="alert"></ul><div class="md-actions"><button type="submit" class="button button-primary">Save Rankings</button> <button type="button" class="button button-secondary" id="philo-reset">Reset To Sample Default</button></div><p class="coach-note">Sample program settings, saved only in this browser. Team Needs are private to each program and are not stored in the shared Master Database.</p></form>') +
      '</div>' + formulaPanel() + theRead('Sample program (fictional): ' + OUR + '. These private team settings feed Coach Fit and Team Need Score for this program only. Your rank 1 philosophy carries the most weight (rank 1 = 5 points down to rank 5 = 1 point), and the same player will score differently for a program with different rankings. Changing the ranks updates every score in this workspace immediately, but never a player\u2019s Tier or Confidence.');
    $('#philo-form', root).addEventListener('submit', (e) => {
      e.preventDefault();
      const v = PHIL_OPTS.map((x, i) => parseInt(e.target.elements['ph' + i].value, 10));
      if (!validPhil(v)) { $('#philo-errors', root).innerHTML = '<li>Each rank from 1 to 5 must be used exactly once. Please remove duplicates.</li>'; return; }
      try { localStorage.setItem(PHIL_KEY, JSON.stringify(v)); } catch (x) { $('#philo-errors', root).innerHTML = '<li>This browser blocked saving.</li>'; return; }
      location.reload();
    });
    $('#philo-reset', root).addEventListener('click', () => { try { localStorage.removeItem(PHIL_KEY); } catch (x) {} location.reload(); });
  };

  pages.fit = (root) => {
    const pr = SKILL_PRI.map((s) => [s[0] + (s[2] && s[0] !== 'Immediate Impact' ? ' Priority' : ''), s[1]]);
    const posPr = POS_PRI;
    const top = players.filter((p) => !p.committed).sort((a, b) => (b.fit || 0) - (a.fit || 0)).slice(0, 10);
    root.innerHTML =
      '<div class="coach-grid">' +
      card('Priority Rankings', miniTable(['Priority', 'Rank (1\u20137)'], pr.map((x) => tr(x)), 'Priority rankings')) +
      card('Positional Priorities', miniTable(['Position', 'Priority'], POS.map((x) => tr([x, posPr[x]])), 'Positional priorities')) +
      card('Fit Factors', '<ul class="plain-list"><li>Recruit Score</li><li>Athletic Score</li><li>Team Need Score</li><li>Primary Position Fit</li><li>Secondary Position Fit</li><li>Confidence Score</li><li>Staff Score</li><li>Adjusted Recruit Score</li><li>Priority Score</li></ul><p class="coach-note">Fit factor weights are set per program and are not published.</p>') +
      '</div>' +
      card('Top Coach Fit', miniTable(['Fit Rank', 'Player', 'Pos', 'Class', 'Coach Fit Score', 'Recruit Score', 'Priority Score', '<span title="Simple average of Recruit Score, Coach Fit Score and Priority Score. Blank if any is missing." tabindex="0">Adjusted Priority Score</span>'], top.map((p, i) => '<tr><th scope="row">#' + (i + 1) + ' Fit</th><td>' + cardLink(p) + '</td><td>' + p.pos + '</td><td>' + p.grad + '</td><td>' + p.fit + '</td><td>' + num(p.rs) + '</td><td>' + nv(p.pri) + '</td><td>' + num(adjPriority(p)) + '</td></tr>'), 'Top coach fit') + '<p class="coach-note">Sample Data / Fictional Example. Adjusted Priority Score = (Recruit Score + Coach Fit Score + Priority Score) &divide; 3.</p>') + formulaPanel() +
      theRead('Coach Fit measures program fit, not talent. Recruit Score stays the same for every program; Coach Fit changes with each program\u2019s priorities. Adjusted Priority Score is the simple average of Recruit Score, Coach Fit and Priority, so a player with a high Recruit Score but a poor fit can rank below a slightly lower-rated player who fits what you need. Blank scores are never treated as 0.');
  };

  pages.board = (root) => {
    const board = players.filter((p) => !p.committed);
    const ours = players.filter((p) => p.committed === OUR);
    const t = (n) => board.filter((p) => p.board === n);
    const tierName = { 1: 'Priority 1', 2: 'Priority 2', 3: 'Priority 3' };
    root.innerHTML =
      '<div class="kpi-row">' + kpi('Priority 1 Targets', t(1).length) + kpi('Priority 2 Targets', t(2).length) + kpi('Priority 3 Targets', t(3).length) + kpi('Committed Players', ours.length) + kpi('Open Spots', 14 - ours.length) + '</div>' +
      '<form class="controls" onsubmit="return false"><label>Priority Tier<select id="b-tier"><option value="">All</option><option value="1">Priority 1</option><option value="2">Priority 2</option><option value="3">Priority 3</option></select></label>' +
      '<label>Playing Level<select id="b-level"><option value="">All</option>' + LEVELS.map((x) => '<option>' + x + '</option>').join('') + '</select></label><label>Position<select id="b-pos"><option value="">All</option>' + POS.map((x) => '<option>' + x + '</option>').join('') + '</select></label></form>' +
      '<div class="table-wrap"><table id="b-table"></table></div>' +
      '<div class="coach-grid">' + card('Board Snapshot', miniTable(['Snapshot', 'Player', 'Value'], [
        '<tr><th scope="row">Highest Priority Score</th><td>' + cardLink(best('pri', board)) + '</td><td>' + best('pri', board).pri + '</td></tr>',
        '<tr><th scope="row">Highest Recruit Score</th><td>' + cardLink(best('rs', board)) + '</td><td>' + num(best('rs', board).rs) + '</td></tr>',
        '<tr><th scope="row">Highest Adjusted Recruit Score</th><td>' + cardLink(best('adj', board)) + '</td><td>' + num(best('adj', board).adj) + '</td></tr>',
        '<tr><th scope="row">Average Priority Score</th><td>&mdash;</td><td>' + num(avgOf('pri', board)) + '</td></tr>'], 'Board snapshot')) + '</div>' +
      theRead('Your private board (fictional): evaluation first, then priority. Players committed elsewhere are removed from the board automatically. Priority 1 targets are the players your staff would pursue first. Adjusted Recruit Score is the Recruit Score nudged by at most 2.5 points for fit and need, so it should always sit close to the Recruit Score. Playing Level separates high school recruits from JUCO and transfer-portal players.');
    function draw() {
      const ft = $('#b-tier', root).value, fp = $('#b-pos', root).value, fl = $('#b-level', root).value;
      const list = board.filter((p) => (!ft || String(p.board) === ft) && (!fp || p.pos === fp) && (!fl || p.level === fl)).sort((a, b) => a.board - b.board || (b.pri || 0) - (a.pri || 0));
      $('#b-table', root).innerHTML = '<caption class="visually-hidden">Recruiting board (fictional data)</caption><thead><tr>' + ['Priority Tier', 'Player Name', 'Primary Position', 'Secondary Position', 'Class', 'Playing Level', 'State', 'Athletic Score', 'Recruit Score', 'Tier', 'Confidence', 'Adjusted Recruit Score', 'Priority Score', 'Evaluation Method', 'Player Notes'].map((h) => '<th scope="col">' + h + '</th>').join('') + '</tr></thead><tbody>' +
        list.map((p) => '<tr><td><span class="pill pill-t' + p.board + '">' + tierName[p.board] + '</span></td><td>' + cardLink(p) + '</td><td>' + p.pos + '</td><td>' + (p.sec || '&mdash;') + '</td><td>' + p.grad + '</td><td>' + esc(LEVEL_SHORT[p.level] || p.level) + '</td><td>' + p.state + '</td><td>' + num(p.ath) + '</td><td class="rd-num">' + TRC.formatRecruitScore(p.rs) + '</td><td>' + tierBadge(p) + '</td><td>' + confBadge(p) + '</td><td>' + num(p.adj) + '</td><td>' + nv(p.pri) + '</td><td>' + p.method + '</td><td>' + esc(p.notes) + '</td></tr>').join('') + '</tbody>';
    }
    root.addEventListener('change', draw);
    draw();
  };

  function schoolStats() {
    const m = groupBy(players.filter((p) => p.committed), 'committed');
    return Object.keys(m).map((s) => ({ school: s, n: m[s].length, rs: avgOf('rs', m[s]), opg: avgOf('opg', m[s]), dpg: avgOf('dpg', m[s]), ppg: avgOf('ppg', m[s]), plat: m[s].filter((p) => p.tier === 'Platinum').length })).sort((a, b) => b.rs - a.rs);
  }
  const schoolRows = (list) => list.map((s, i) => '<tr><th scope="row">#' + (i + 1) + ' School</th><td>' + esc(s.school) + '</td><td>' + s.n + '</td><td>' + num(s.rs) + '</td></tr>');

  pages.commitments = (root) => {
    const list = players.filter((p) => p.committed).sort((a, b) => b.rs - a.rs);
    const schools = schoolStats();
    const posRows = POS.map((x) => tr([x, list.filter((p) => p.pos === x).length]));
    root.innerHTML =
      '<div class="kpi-row">' + kpi('Total Commitments', list.length) + kpi('Avg Recruit Score', num(avgOf('rs', list))) + kpi('Avg Adjusted Recruit Score', num(avgOf('adj', list))) + kpi('Highest Recruit Score', num(best('rs', list).rs)) + '</div>' +
      '<div class="commit-layout"><div class="commit-main"><div class="table-wrap"><table><caption class="visually-hidden">Commitments (fictional data)</caption><thead><tr>' + ['Player Name', 'Primary Position', 'Secondary Position', 'Class', 'State', 'Athletic Score', 'Recruit Score', 'Tier', 'Confidence', 'Adjusted Recruit Score', 'Committed School', 'Commitment Date', 'Evaluation Method', 'Player Notes'].map((h) => '<th scope="col">' + h + '</th>').join('') + '</tr></thead><tbody>' +
      list.map((p) => '<tr><td>' + cardLink(p) + '</td><td>' + p.pos + '</td><td>' + (p.sec || '&mdash;') + '</td><td>' + p.grad + '</td><td>' + p.state + '</td><td>' + num(p.ath) + '</td><td class="rd-num">' + TRC.formatRecruitScore(p.rs) + '</td><td>' + tierBadge(p) + '</td><td>' + confBadge(p) + '</td><td>' + num(p.adj) + '</td><td>' + esc(p.committed) + '</td><td>' + p.commitDate + '</td><td>' + p.method + '</td><td>' + esc(p.notes) + '</td></tr>').join('') + '</tbody></table></div></div>' +
      '<aside class="commit-side" aria-label="Commitment summary tables">' +
      card('Commitments By Position', miniTable(['Position', 'Commitments'], posRows, 'Commitments by position')) +
      card('Commitment Quality', miniTable(['Measure', 'Player', 'Value'], [
        '<tr><th scope="row">Avg Confidence Score</th><td>&mdash;</td><td>' + num(avgOf('conf', list)) + '%</td></tr>',
        leader('Highest Confidence Score Commit', 'conf', list, false, 0),
        '<tr><th scope="row">Avg Priority Score</th><td>&mdash;</td><td>' + num(avgOf('pri', list)) + '</td></tr>',
        leader('Highest Priority Score Commit', 'pri', list, false, 0),
        leader('Highest Adjusted Recruit Score Commitment', 'adj', list)], 'Commitment quality')) +
      card('College Rankings', miniTable(['Rank', 'School', 'Commits', 'Avg Recruit Score'], schoolRows(schools), 'College rankings') + '<p class="coach-note">Sample schools only. Rankings reflect the average Recruit Score of each school\u2019s fictional commits.</p>') +
      '</aside></div>' + theRead('Commitments are tracked in the shared database; your program\u2019s notes stay private. All schools and players are fictional. The tables on the right summarize the list: commits by position, the strongest commits by confidence, priority and adjusted score, and a school ranking by average Recruit Score. Scores come from the documented formulas, not opinion.');
  };

  pages.analytics = (root) => {
    const gp = groupBy(players, 'pos');
    const posBlocks = POS.map((x) => {
      const l = gp[x] || [];
      const rows = x === 'P'
        ? [['Avg FBV', avgOf('avgFBV', l), 1], ['Avg Max FBV', avgOf('maxFBV', l), 1], ['Avg PPG', avgOf('ppg', l), 1], ['Highest FBV', (best('avgFBV', l) || {}).avgFBV, 1], ['Highest Max FBV', (best('maxFBV', l) || {}).maxFBV, 1]]
        : [['Avg 60 Time', avgOf('t60', l), 2], ['Avg Throwing Velo', avgOf('tv', l), 1], ['Avg EV', avgOf('avgEV', l), 1], ['Avg Max EV', avgOf('maxEV', l), 1], ['Avg OPG', avgOf('opg', l), 1], ['Avg DPG', avgOf('dpg', l), 1]].concat(x === 'C' ? [['Avg Pop Time', avgOf('pop', l), 2], ['Best Pop Time', (best('pop', l, true) || {}).pop, 2]] : []);
      return card(x + ' Benchmarks', miniTable(['Metric', 'Value'], rows.map((q) => tr([q[0], num(q[1], q[2])])), x + ' benchmarks'));
    }).join('');
    const leaders = POS.map((x) => {
      const l = gp[x] || [];
      const rows = [leader('Top Recruit Score', 'rs', l), leader('Top Athletic Score', 'ath', l)];
      if (x === 'P') rows.push(leader('Top PPG', 'ppg', l), leader('Top Avg FBV', 'avgFBV', l), leader('Top Max FBV', 'maxFBV', l));
      else { rows.push(leader('Top OPG', 'opg', l), leader('Top DPG', 'dpg', l)); if (x === 'C') rows.push(leader('Best Pop Time', 'pop', l, true, 2)); }
      return card(x + ' Position Leaders', miniTable(['Leader', 'Player', 'Value'], rows, x + ' position leaders'));
    }).join('');
    root.innerHTML =
      '<div class="kpi-row">' + kpi('Total Players', db.total) + kpi('Avg Recruit Score', num(db.avgRS)) + kpi('Avg Confidence %', num(db.avgConf) + '%') + kpi('Platinum Players', players.filter((p) => p.tier === 'Platinum').length) + kpi('Gold Players', players.filter((p) => p.tier === 'Gold').length) + kpi('Not Rated Players', players.filter((p) => p.tier === 'Not Rated').length) + '</div>' +
      '<h2 class="coach-h2">Top Performers</h2><div class="coach-grid">' +
      card('Top Performers', miniTable(['Leader', 'Player', 'Value'], [leader('Highest Recruit Score', 'rs'), leader('Highest Athletic Score', 'ath'), leader('Highest OPG', 'opg'), leader('Highest DPG', 'dpg'), leader('Highest SOPG', 'sopg'), leader('Highest SDPG', 'sdpg'), leader('Highest PPG', 'ppg'), leader('Highest Avg EV', 'avgEV'), leader('Highest Max EV', 'maxEV'), leader('Highest Avg FBV', 'avgFBV'), leader('Highest Max FBV', 'maxFBV'), leader('Fastest 60 Time', 't60', null, true, 2)], 'Top performers')) +
      card('Database Benchmarks', miniTable(['Metric', 'Value'], [tr(['Avg Recruit Score', num(db.avgRS)]), tr(['Avg Athletic Score', num(db.avgAth)]), tr(['Avg DPG', num(avgOf('dpg'))]), tr(['Avg PPG', num(avgOf('ppg'))]), tr(['Avg EV', num(avgOf('avgEV'))]), tr(['Avg Max EV', num(avgOf('maxEV'))]), tr(['Avg FBV', num(avgOf('avgFBV'))]), tr(['Avg Max FBV', num(avgOf('maxFBV'))]), tr(['Avg 60 Time', num(avgOf('t60'), 2)])], 'Database benchmarks')) +
      card('School Rankings', miniTable(['Rank', 'School', 'Commits', 'Avg Recruit Score'], schoolRows(schoolStats()), 'School rankings')) + '</div>' +
      '<h2 class="coach-h2">Position Benchmarks</h2><div class="coach-grid">' + posBlocks + '</div>' +
      '<h2 class="coach-h2">Position Leaders By Metric</h2><p class="coach-note">For each position, the single player with the best value in each measure, among all ' + players.length + ' players in the shared database (sample data). Recruit Score and Athletic Score show the highest value; Pop Time shows the lowest (faster) time. Players with a missing value are skipped, never counted as 0.</p><div class="coach-grid">' + leaders + '</div>' +
      theRead('Analytics summarize the fictional sample database. Benchmarks are position-specific so speed and power are compared with players at the same position. For 60 Time and Pop Time a lower number is better. A value left blank is skipped in averages, not counted as 0, so averages can shift as more players get measured.');
  };

  pages.regional = (root) => {
    const gs = groupBy(players, 'state');
    const stats = Object.keys(gs).map((s) => { const l = gs[s]; return { state: s, n: l.length, elite: l.filter((p) => p.tier === 'Platinum').length, high: l.filter((p) => p.tier === 'Gold').length, rs: avgOf('rs', l), opg: avgOf('opg', l), dpg: avgOf('dpg', l), ppg: avgOf('ppg', l), l: l }; });
    const rank = (k, list, title) => card(title, miniTable(['Rank', 'State', 'Value', 'Players'], list.filter((s) => s[k] != null).sort((a, b) => b[k] - a[k]).map((s, i) => '<tr><th scope="row">#' + (i + 1) + ' State</th><td>' + s.state + '</td><td>' + (Number.isInteger(s[k]) ? s[k] : num(s[k])) + '</td><td>' + s.n + '</td></tr>'), title));
    const sch = schoolStats();
    const schRank = (k, title) => card(title, miniTable(['Rank', 'School', 'Value'], sch.filter((s) => s[k] != null).slice().sort((a, b) => b[k] - a[k]).map((s, i) => '<tr><th scope="row">#' + (i + 1) + ' School</th><td>' + esc(s.school) + '</td><td>' + num(s[k]) + '</td></tr>'), title));
    const bestState = (x) => { const c = stats.map((s) => ({ s: s.state, v: avgOf('rs', s.l.filter((p) => p.pos === x)) })).filter((q) => q.v != null).sort((a, b) => b.v - a.v)[0]; return c ? c.s + ' (' + num(c.v) + ')' : '&mdash;'; };
    const top = (k) => { const c = stats.filter((s) => s[k] != null).sort((a, b) => b[k] - a[k])[0]; return c ? c.state + ' (' + (Number.isInteger(c[k]) ? c[k] : num(c[k])) + ')' : '&mdash;'; };
    root.innerHTML =
      '<div class="coach-grid">' +
      rank('rs', stats, 'State Rankings By Avg Recruit Score') + rank('opg', stats, 'State Rankings By Avg OPG') + rank('dpg', stats, 'State Rankings By Avg DPG') + rank('ppg', stats, 'State Rankings By Avg PPG') +
      rank('elite', stats, 'States With The Most Platinum Players') +
      schRank('rs', 'College Rankings By Avg Recruit Score') + schRank('opg', 'College Rankings By Avg OPG') + schRank('dpg', 'College Rankings By Avg DPG') + schRank('ppg', 'College Rankings By Avg PPG') +
      card('Regional Position Leaders By Avg Recruit Score', miniTable(['Best State For', 'State (Avg Recruit Score)'], POS.filter((x) => x !== 'P').map((x) => tr([x, bestState(x)])).concat([tr(['P', bestState('P')])]), 'Regional position leaders')) +
      card('Talent Concentration', miniTable(['Measure', 'State (Value)'], [tr(['Most Players', top('n')]), tr(['Most Platinum Players', top('elite')]), tr(['Most Gold Players', top('high')]), tr(['Highest Avg Recruit Score', top('rs')]), tr(['Highest Avg OPG', top('opg')]), tr(['Highest Avg DPG', top('dpg')]), tr(['Highest Avg PPG', top('ppg')])], 'Talent concentration')) +
      '</div>' + theRead('Regional views show where talent concentrates in the fictional sample. College rankings use the average of each school\u2019s fictional commits. A state with few players can look strong or weak on a single athlete, so read the Players column beside each value before drawing a conclusion.');
  };


  // ---------- Athletic Department workspace (all numbers are fictional samples) ----------
  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const PROGRAMS = [
    { sport: 'Baseball', coach: 'Head Coach A. Reyes', target: 14, needs: ['Pitcher', 'Catcher', 'Middle Infield'], classes: '2027: 6 \u00b7 2028: 5 \u00b7 2029: 3', sch: [11.7, 9.5], travel: [42000, 28600], camp: 6400, visits: 9100 },
    { sport: 'Softball', coach: 'Head Coach L. Moreau', target: 12, needs: ['Middle Infield', 'Power Bat'], classes: '2027: 5 \u00b7 2028: 4 \u00b7 2029: 3', sch: [12, 10], travel: [30000, 21400], camp: 4800, visits: 6200 },
    { sport: 'Men\u2019s Basketball', coach: 'Head Coach R. Daniels', target: 5, needs: ['Guard Depth', 'Rim Protector'], classes: '2027: 2 \u00b7 2028: 2 \u00b7 2029: 1', sch: [13, 11], travel: [55000, 40300], camp: 7500, visits: 8800 },
    { sport: 'Women\u2019s Basketball', coach: 'Head Coach T. Okoro', target: 5, needs: ['Point Guard', 'Wing'], classes: '2027: 2 \u00b7 2028: 2 \u00b7 2029: 1', sch: [15, 12.5], travel: [48000, 33900], camp: 6900, visits: 8100 },
    { sport: 'Football', coach: 'Head Coach B. Whitfield', target: 22, needs: ['Offensive Line', 'Defensive Back', 'Quarterback'], classes: '2027: 9 \u00b7 2028: 8 \u00b7 2029: 5', sch: [85, 71], travel: [120000, 88700], camp: 15200, visits: 21400 },
    { sport: 'Men\u2019s Soccer', coach: 'Head Coach P. Silva', target: 9, needs: ['Center Back', 'Striker'], classes: '2027: 4 \u00b7 2028: 3 \u00b7 2029: 2', sch: [9.9, 8], travel: [28000, 19200], camp: 3900, visits: 4700 },
    { sport: 'Women\u2019s Soccer', coach: 'Head Coach J. Hartmann', target: 9, needs: ['Goalkeeper', 'Midfield'], classes: '2027: 4 \u00b7 2028: 3 \u00b7 2029: 2', sch: [14, 11.5], travel: [29000, 20100], camp: 4100, visits: 4900 },
    { sport: 'Women\u2019s Volleyball', coach: 'Head Coach C. Alvarez', target: 6, needs: ['Setter', 'Outside Hitter'], classes: '2027: 3 \u00b7 2028: 2 \u00b7 2029: 1', sch: [12, 10.5], travel: [26000, 18800], camp: 3500, visits: 4300 }
  ];
  const COMMITTED = [6, 5, 2, 3, 11, 4, 5, 3];
  PROGRAMS.forEach((p, i) => { p.committed = COMMITTED[i]; p.spend = p.travel[1] + p.camp + p.visits; });
  const deptBanner = (t) => '<aside class="read-note dept-note" aria-label="Preview of THE READ AI, generated from sample data"><strong class="read-label"><span class="tr">THE READ</span> AI Preview &mdash; Generated From Sample Data</strong> <span>' + t + '</span></aside>';
  const coachLink = '<div class="link-banner card"><div><h2>Also Coach? Open The Coach Workspace</h2><p>Athletic directors who coach \u2014 or want visibility into who coaches are recruiting \u2014 can use the coach workspace: rankings, player cards, recruiting board, team needs, and more (fictional sample data).</p></div><a class="button button-primary" href="coach-dashboard.html">Open Coach Workspace</a></div>';

  pages.master = (root) => {
    const state = { key: 'id', dir: 1 };
    const NUMS = [
      ['gpa', 'GPA', 0, 5, 0.01], ['ht', 'Height (inches)', 48, 90, 1], ['wt', 'Weight (lbs)', 80, 350, 1],
      ['avgEV', 'Avg EV', 40, 130, 0.1], ['maxEV', 'Max EV', 40, 130, 0.1], ['avgFBV', 'Avg FBV', 40, 110, 0.1], ['maxFBV', 'Max FBV', 40, 110, 0.1],
      ['tv', 'Throwing Velo', 40, 110, 0.1], ['t60', '60 Time (sec)', 5, 12, 0.01], ['pop', 'Pop Time (sec)', 1.5, 4, 0.01]
    ];
    const LINKS = [['pbr', 'PBR Link'], ['pg', 'PG Link'], ['ncsa', 'NCSA Link'], ['video', 'Video Link'], ['twitter', 'Twitter/X']];
    const dupKey = (p) => String(p.name).trim().toLowerCase() + '|' + p.grad;
    const dupCount = {};
    players.forEach((p) => { dupCount[dupKey(p)] = (dupCount[dupKey(p)] || 0) + 1; });
    const link = (p) => LINKS.filter((l) => p.links && p.links[l[0]]).map((l) => '<a href="' + esc(p.links[l[0]]) + '" target="_blank" rel="noopener noreferrer">' + l[1].replace(' Link', '') + '</a>').join(' ') || '&mdash;';
    const n2 = (k, d) => (p) => num(p[k], d);
    const COLS = [
      ['src', 'Source', (p) => (p.entered ? 'Coach-Entered (Demo)' : 'Sample'), (p) => (p.entered ? '<span class="pill amber">Coach-Entered (Demo)</span> <button type="button" class="md-del" data-del="' + esc(p.id) + '" aria-label="Remove ' + esc(p.name) + '">Remove</button>' : '<span class="pill gray">Sample</span>')],
      ['id', 'Player ID', (p) => p.id, (p) => esc(p.id)],
      ['name', 'Player Name', (p) => p.name, (p) => cardLink(p)],
      ['grad', 'Grad Year', (p) => p.grad, (p) => p.grad],
      ['level', 'Current Playing Level', (p) => p.level, (p) => esc(p.level)],
      ['bats', 'Bats', (p) => p.bats, (p) => p.bats || '&mdash;'],
      ['throws', 'Throws', (p) => p.throws, (p) => p.throws || '&mdash;'],
      ['pos', 'Primary Position', (p) => p.pos, (p) => p.pos],
      ['sec', 'Secondary Position', (p) => p.sec, (p) => p.sec || '&mdash;'],
      ['twoWay', 'Two Way', (p) => (p.twoWay ? 1 : 0), (p) => (p.twoWay ? 'Yes' : 'No')],
      ['hs', 'High School', (p) => p.hs, (p) => (p.hs ? esc(p.hs) : '&mdash;')],
      ['state', 'State', (p) => p.state, (p) => p.state || '&mdash;'],
      ['gpa', 'GPA', (p) => p.gpa, n2('gpa', 2)],
      ['ht', 'Height', (p) => p.ht, (p) => (p.ht == null ? '&mdash;' : ftin(p.ht))],
      ['wt', 'Weight', (p) => p.wt, (p) => (p.wt == null ? '&mdash;' : p.wt)],
      ['avgEV', 'Avg EV', (p) => p.avgEV, n2('avgEV')], ['maxEV', 'Max EV', (p) => p.maxEV, n2('maxEV')],
      ['avgFBV', 'Avg FBV', (p) => p.avgFBV, n2('avgFBV')], ['maxFBV', 'Max FBV', (p) => p.maxFBV, n2('maxFBV')],
      ['tv', 'Throwing Velo', (p) => p.tv, n2('tv')],
      ['t60', '60 Time', (p) => p.t60, n2('t60', 2)], ['pop', 'Pop Time', (p) => p.pop, n2('pop', 2)],
      ['opg', 'OPG', (p) => p.opg, n2('opg')], ['sopg', 'SOPG', (p) => p.sopg, n2('sopg')], ['dpg', 'DPG', (p) => p.dpg, n2('dpg')], ['sdpg', 'SDPG', (p) => p.sdpg, n2('sdpg')], ['ppg', 'PPG', (p) => p.ppg, n2('ppg')],
      ['ath', 'Athletic Score', (p) => p.ath, n2('ath')],
      ['rs', 'Recruit Score', (p) => p.rs, (p) => TRC.formatRecruitScore(p.rs)],
      ['tier', 'Tier', (p) => (p.rs == null ? null : TRC.PLAYER_TIER_CONFIG[p.tier].sortOrder), (p) => tierBadge(p)],
      ['conf', 'Confidence', (p) => p.conf, (p) => confBadge(p)],
      ['classRank', 'Class Rank', (p) => p.classRank, (p) => rk(p.classRank)],
      ['overall', 'Overall Rank', (p) => p.overall, (p) => rk(p.overall)],
      ['eval', 'Evaluation Date', (p) => p.eval, (p) => p.eval || '&mdash;'],
      ['method', 'Evaluation Method', (p) => p.method, (p) => esc(p.method || '')],
      ['notes', 'Player Notes', (p) => p.notes, (p) => esc(p.notes || '')],
      ['links', 'Links', (p) => '', link],
      ['dup', 'Possible Duplicate', (p) => dupCount[dupKey(p)], (p) => (dupCount[dupKey(p)] > 1 ? '<span class="pill red">Check</span>' : 'No')]
    ];
    const opt = (arr, blank) => (blank ? '<option value="">' + blank + '</option>' : '') + arr.map((x) => '<option>' + x + '</option>').join('');
    const msg = sessionStorage.getItem('theReadMdMsg') || '';
    sessionStorage.removeItem('theReadMdMsg');
    root.innerHTML =
      '<div class="kpi-row" id="md-kpis"></div>' +
      '<p class="coach-note md-note"><strong>Master Database:</strong> the one list every other workspace page reads from. Sample players are fictional. This is for college coaches adding prospects from their offline recruiting board. Prospects you add are your private, coach-entered, unverified board entries (not athlete-verified), saved only in this browser as a demo until a real backend exists, and not shared with anyone. It is not for high school coaches or private instructors creating athlete accounts; that is a separate athlete signup flow. Blank fields stay blank (never 0).</p>' +
      (msg ? '<p class="coach-note md-msg" role="status">' + esc(msg) + '</p>' : '') +
      '<details class="card md-add" id="md-add"' + (msg ? '' : '') + '><summary>Add Prospect</summary><form id="md-form" novalidate>' +
      '<div class="md-grid">' +
      '<label>Player Name *<input name="name" type="text" maxlength="80" required /></label>' +
      '<label>Grad Year *<select name="grad" required>' + opt([2026, 2027, 2028, 2029, 2030, 2031], 'Select') + '</select></label>' +
      '<label>Primary Position *<select name="pos" required>' + opt(POS, 'Select') + '</select></label>' +
      '<label>Current Playing Level<select name="level">' + opt(LEVELS) + '</select></label>' +
      '<label>Profile Photo URL (athlete-provided only)<input name="photo" type="url" placeholder="https://" /></label>' +
      '<label>Secondary Position<select name="sec">' + opt(POS, 'None') + '</select></label>' +
      '<label>Bats<select name="bats">' + opt(['R', 'L', 'S'], 'Unknown') + '</select></label>' +
      '<label>Throws<select name="throws">' + opt(['R', 'L'], 'Unknown') + '</select></label>' +
      '<label class="md-check"><input name="twoWay" type="checkbox" /> Two Way Player</label>' +
      '<label>High School<input name="hs" type="text" maxlength="80" /></label>' +
      '<label>State (2 letters)<input name="state" type="text" maxlength="2" pattern="[A-Za-z]{2}" /></label>' +
      NUMS.map((n) => '<label>' + n[1] + '<input name="' + n[0] + '" type="text" inputmode="decimal" /></label>').join('') +
      '<label>Evaluation Date<input name="eval" type="date" /></label>' +
      '<label>Evaluation Method<select name="method">' + opt(METHODS.concat(['Coach Entry (Unverified)']), 'Not Set') + '</select></label>' +
      LINKS.map((l) => '<label>' + l[1] + '<input name="' + l[0] + '" type="url" placeholder="https://" /></label>').join('') +
      '<label class="md-wide">Player Notes<textarea name="notes" rows="2" maxlength="300"></textarea></label></div>' +
      '<p class="coach-note"><strong>Calculated by THE READ (not entered by coaches):</strong> Frame Score and projection grades, OPG/SOPG/DPG/SDPG/PPG, Athletic Score, Recruit Score, Tier, Confidence, and ranks. Coaches enter only raw, verifiable data. Until the calculation service exists, these show as blank / Not Rated / Unknown for added players (never 0). The owner-defined grade tables and formulas are not published in this public demo.</p>' +
      '<ul class="md-errors" id="md-errors" role="alert"></ul>' +
      '<div class="md-actions"><button type="submit" class="button button-primary">Add Prospect</button> <button type="button" class="button button-secondary" id="md-clear">Remove All Added Prospects</button></div></form></details>' +
      '<form class="controls" id="md-filters" aria-label="Filter master database" onsubmit="return false">' +
      '<label>Search<input type="search" id="md-q" placeholder="Name, school, state, notes" /></label>' +
      '<label>Position<select id="md-pos">' + opt(POS, 'All') + '</select></label>' +
      '<label>Grad Year<select id="md-grad">' + opt([2026, 2027, 2028, 2029, 2030, 2031], 'All') + '</select></label>' +
      '<label>Current Playing Level<select id="md-level">' + opt(LEVELS, 'All') + '</select></label>' +
      '<label>Source<select id="md-src"><option value="">All</option><option value="s">Sample</option><option value="a">Coach-Entered (Demo)</option></select></label>' +
      '<button type="button" class="button button-secondary" id="md-reset">Reset</button></form>' +
      '<p class="coach-count" id="md-count" role="status"></p><div class="table-wrap md-wrap"><table id="md-table" class="rd-table md-table"></table></div>' +
      '<p class="coach-note">SAMPLE DATA / FICTIONAL EXAMPLE. Helper columns from the owner workbook are calculated, not stored.</p>' + theRead('This is the single list behind every other tab: ' + players.length + ' players, ' + players.filter((p) => p.entered).length + ' of them added by you. Added prospects show Not Rated and Unknown until the calculation service exists, so they sort last and are never scored 0. The Possible Duplicate column flags the same name and class appearing twice.');
    const tbl = $('#md-table', root);
    function kpis() {
      const k = $('#md-kpis', root);
      k.innerHTML = kpi('Total Players', players.length) + kpi('Sample Players', players.filter((p) => !p.entered).length) + kpi('Coach-Entered (Demo)', players.filter((p) => p.entered).length) + kpi('Possible Duplicates', players.filter((p) => dupCount[dupKey(p)] > 1).length) + kpi('Missing 60 Time (Position Players)', players.filter((p) => p.pos !== 'P' && p.t60 == null).length);
    }
    function draw() {
      const q = $('#md-q', root).value.trim().toLowerCase(), fp = $('#md-pos', root).value, fg = $('#md-grad', root).value, fs = $('#md-src', root).value, fl = $('#md-level', root).value;
      let list = players.filter((p) => (!fp || p.pos === fp) && (!fg || String(p.grad) === fg) && (!fl || p.level === fl) && (!fs || (fs === 'a') === !!p.entered) &&
        (!q || [p.name, p.id, p.hs, p.state, p.pos, p.sec, p.notes, p.method].join(' ').toLowerCase().indexOf(q) >= 0));
      const col = COLS.filter((c) => c[0] === state.key)[0];
      list = list.slice().sort((a, b) => {
        const x = col[2](a), y = col[2](b);
        if ((x == null || x === '') && (y == null || y === '')) return 0;
        if (x == null || x === '') return 1;
        if (y == null || y === '') return -1;
        return (typeof x === 'string' ? x.localeCompare(y) : x - y) * state.dir;
      });
      $('#md-count', root).textContent = 'Showing ' + list.length + ' of ' + players.length + ' players';
      tbl.innerHTML = '<caption class="visually-hidden">Master database of players (sample data, fictional)</caption><thead><tr>' + COLS.map((c) => '<th scope="col" aria-sort="' + (state.key === c[0] ? (state.dir === 1 ? 'ascending' : 'descending') : 'none') + '"><button type="button" data-k="' + c[0] + '">' + c[1] + (state.key === c[0] ? (state.dir === 1 ? ' \u25B2' : ' \u25BC') : '') + '</button></th>').join('') + '</tr></thead><tbody>' +
        (list.length ? list.map((p) => '<tr>' + COLS.map((c) => '<td>' + c[3](p) + '</td>').join('') + '</tr>').join('') : '<tr class="rd-empty"><td colspan="' + COLS.length + '">No players match these filters.</td></tr>') + '</tbody>';
    }
    kpis(); draw();
    root.addEventListener('input', (e) => { if (e.target.closest('#md-filters')) draw(); });
    root.addEventListener('change', (e) => { if (e.target.closest('#md-filters')) draw(); });
    root.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-k]');
      if (b) { const k = b.dataset.k; if (state.key === k) state.dir *= -1; else { state.key = k; state.dir = 1; } draw(); return; }
      if (e.target.closest('#md-reset')) { $('#md-filters', root).reset(); draw(); return; }
      const d = e.target.closest('[data-del]');
      if (d) { saveAdded(loadAdded().filter((a) => a.id !== d.dataset.del)); sessionStorage.setItem('theReadMdMsg', 'Player removed.'); location.reload(); return; }
      if (e.target.closest('#md-clear')) { if (window.confirm('Remove all players you added in this browser? Sample players stay.')) { saveAdded([]); sessionStorage.setItem('theReadMdMsg', 'All added players removed.'); location.reload(); } }
    });
    $('#md-form', root).addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target, v = (n) => f.elements[n].value.trim(), errs = [], rec = {};
      rec.name = v('name').replace(/\s+/g, ' ');
      if (!rec.name) errs.push('Player Name is required.');
      rec.grad = parseInt(v('grad'), 10);
      if (!rec.grad) errs.push('Grad Year is required.');
      rec.pos = v('pos');
      if (!rec.pos) errs.push('Primary Position is required.');
      rec.sec = v('sec'); rec.level = v('level') || 'High School'; rec.photo = v('photo');
      if (rec.photo && !/^https?:\/\/\S+$/i.test(rec.photo)) errs.push('Profile Photo URL must start with http:// or https://.');
      rec.bats = v('bats'); rec.throws = v('throws'); rec.twoWay = f.elements.twoWay.checked;
      rec.hs = v('hs'); rec.state = v('state').toUpperCase(); rec.eval = v('eval'); rec.method = v('method') || 'Coach Entry (Unverified)'; rec.notes = v('notes');
      if (rec.sec && rec.sec === rec.pos) errs.push('Secondary Position must differ from Primary Position.');
      if (rec.state && !/^[A-Z]{2}$/.test(rec.state)) errs.push('State must be two letters.');
      NUMS.forEach((n) => {
        const raw = v(n[0]);
        if (raw === '') { rec[n[0]] = null; return; }
        const val = Number(raw);
        if (!isFinite(val)) { errs.push(n[1] + ' must be a number.'); return; }
        if (n[0] === 'rs') { try { TRC.validateRecruitScore(val); } catch (x) { errs.push(x.message); return; } }
        if (n[0] === 'conf') { try { TRC.validateConfidencePercentage(val); } catch (x) { errs.push(x.message); return; } }
        if (val < n[2] || val > n[3]) { errs.push(n[1] + ' must be between ' + n[2] + ' and ' + n[3] + '.'); return; }
        rec[n[0]] = val;
      });
      rec.links = {};
      LINKS.forEach((l) => { const u = v(l[0]); if (!u) return; if (!/^https?:\/\/\S+$/i.test(u)) errs.push(l[1] + ' must start with http:// or https://.'); else rec.links[l[0]] = u; });
      const ul = $('#md-errors', root);
      ul.innerHTML = errs.map((m) => '<li>' + esc(m) + '</li>').join('');
      if (errs.length) return;
      const cur = loadAdded();
      const max = cur.concat(players.filter((p) => p.entered)).reduce((m, a) => Math.max(m, parseInt(String(a.id).replace(/\D/g, ''), 10) || 0), 0);
      rec.id = 'E' + String(max + 1).padStart(3, '0');
      cur.push(rec);
      if (!saveAdded(cur)) { ul.innerHTML = '<li>This browser blocked saving. The player was not added.</li>'; return; }
      sessionStorage.setItem('theReadMdMsg', rec.name + ' was added from your board as ' + rec.id + ' (demo, saved in this browser only).');
      location.reload();
    });
  };
  pages.grading = (root) => {
    const store = loadGrades(), W = loadWeights();
    const today = new Date().toISOString().slice(0, 10);
    const msg = sessionStorage.getItem('theReadGrMsg') || ''; sessionStorage.removeItem('theReadGrMsg');
    const role = sessionStorage.getItem('theReadGrRole') === 'staff' ? 'staff' : 'hc';
    const opts = (arr) => arr.map((x) => '<option value="' + esc(x[0]) + '">' + esc(x[1]) + '</option>').join('');
    const gradeOpts = '<option value="">Select grade</option>' + GRADES.slice().reverse().map((g) => '<option value="' + g + '">' + g + '</option>').join('');
    const cols = [['all', 'All Positions (Default)']].concat(GROUPS.map((g) => [g[0], g[1]]));
    const wCell = (c, k) => {
      const v = k === 'all' ? W.all[c.id] : (W.groups[k] && W.groups[k][c.id] != null ? W.groups[k][c.id] : '');
      return '<td data-label="' + esc(cols.filter((x) => x[0] === k)[0][1]) + '"><input type="number" min="0" max="100" step="1" class="gw-in" data-c="' + c.id + '" data-k="' + k + '" value="' + v + '" aria-label="' + esc(c.name) + ' weight for ' + esc(cols.filter((x) => x[0] === k)[0][1]) + '"' + (role === 'hc' ? '' : ' disabled') + (k === 'all' ? '' : ' placeholder="Default"') + ' /></td>';
    };
    const convRows = GRADES.slice().reverse().map((g) => '<tr><th scope="row">' + g + '</th><td>' + GRADE_TABLE[g] + '</td></tr>').join('');
    root.innerHTML =
      '<p class="coach-note md-note"><strong>Coach Grading:</strong> each staff member picks a simple letter grade (A+ to F) for a player. The Head Coach decides how much each coach\u2019s grade counts, and can set different weights for different position groups. Staff Score is the weighted average of the grades entered so far and stays blank until at least one grade exists (never 0). Grades and weights are coach-entered opinions saved only in this browser as a demo. Staff names are sample (fictional). Grades never change a player\u2019s Tier or Confidence.</p>' +
      (msg ? '<p class="coach-note md-msg" role="status">' + esc(msg) + '</p>' : '') +
      '<section class="card"><h2>Enter A Grade</h2><form id="gr-form" novalidate><div class="md-grid">' +
      '<label>Player *<select name="player">' + opts(players.map((p) => [p.id, p.name + ' \u2014 ' + p.pos + ', ' + p.grad])) + '</select></label>' +
      '<label>Staff Member *<select name="staff">' + opts(COACHES.map((c) => [c.id, c.name + ' (' + c.role + ')'])) + '</select></label>' +
      '<label>Grade *<select name="grade">' + gradeOpts + '</select></label>' +
      '<label>Date<input name="date" type="date" value="' + today + '" max="' + today + '" /></label>' +
      '<label class="md-wide">Evaluator Notes<textarea name="note" rows="2" maxlength="300"></textarea></label></div>' +
      '<ul class="md-errors" id="gr-errors" role="alert"></ul><div class="md-actions"><button type="submit" class="button button-primary">Save Grade</button></div></form></section>' +
      '<section class="card" id="gw-card"><h2>Grade Weights (Head Coach)</h2>' +
      '<form class="controls" onsubmit="return false"><label>Viewing As (Demo Role)<select id="gw-role"><option value="hc"' + (role === 'hc' ? ' selected' : '') + '>Head Coach (can edit weights)</option><option value="staff"' + (role === 'staff' ? ' selected' : '') + '>Other Staff (view only)</option></select></label></form>' +
      '<p class="coach-note">Only the Head Coach can change weights. This role switch is a demo; real permissions need a backend. Weights are relative numbers, not required to add to 100: for each player, only the coaches who HAVE graded are counted, and their weights are re-scaled to total 100%. A coach who has not graded is left out, never counted as an F. Leave a position-group box blank to use the Default column.</p>' +
      '<div class="table-wrap"><table class="rd-table" id="gw-table"><caption class="visually-hidden">Grade weights by staff member and position group (sample, fictional)</caption><thead><tr><th scope="col">Staff Member</th>' + cols.map((c) => '<th scope="col">' + esc(c[1]) + '</th>').join('') + '</tr></thead><tbody>' +
      COACHES.map((c) => '<tr><th scope="row">' + esc(c.name) + '<small class="rd-mobile-meta">' + esc(c.role) + '</small></th>' + cols.map((k) => wCell(c, k[0])).join('') + '</tr>').join('') + '</tbody></table></div>' +
      '<ul class="md-errors" id="gw-errors" role="alert"></ul><div class="md-actions"><button type="button" class="button button-primary" id="gw-save"' + (role === 'hc' ? '' : ' disabled') + '>Save Weights</button> <button type="button" class="button button-secondary" id="gw-reset"' + (role === 'hc' ? '' : ' disabled') + '>Reset To Defaults</button></div>' +
      '<p class="coach-note">Default sample weights: Head Coach 30, Associate Head Coach 25, Pitching Coach 25, Recruiting Coordinator 20; Pitchers override: Pitching Coach 45, Head Coach 25, Associate 15, Coordinator 15. These are sample starting points only.</p></section>' +
      '<section class="card"><h2>How Grades Convert</h2><div class="table-wrap"><table class="rd-table"><caption class="visually-hidden">Letter grade to number conversion</caption><thead><tr><th scope="col">Letter Grade</th><th scope="col">Counts As (0&ndash;100)</th></tr></thead><tbody>' + convRows + '</tbody></table></div>' +
      '<p class="coach-note">Staff Score is shown with the nearest letter grade. A blank grade is not saved.</p></section>' +
      '<section class="card coach-card wide how-calc"><h2>How This Is Calculated</h2><ul>' +
      '<li><strong>Staff Score</strong> = &Sigma;(grade number &times; weight) &divide; &Sigma;(weight), over only the coaches who graded that player. The weights used depend on the player\u2019s position group (Pitchers, Catchers, Infielders, Outfielders), falling back to the Default column. If every graded coach has weight 0, they count equally. Blank when nobody has graded.</li>' +
      '<li><strong>Adjusted Recruit Score</strong> = Recruit Score + fit/need adjustment (&minus;2.5 to +2.5, see Team Needs) + staff adjustment, kept between 0 and 100. Staff adjustment = (Staff Score &minus; ' + STAFF_BASELINE + ') &divide; ' + STAFF_DIVISOR + ', limited to &minus;' + STAFF_CAP + ' to +' + STAFF_CAP + ' points (' + STAFF_BASELINE + ' is a neutral, about B-, grade). With no staff grades the staff adjustment is 0 and the score is marked &ldquo;No staff grades yet&rdquo;. It updates on every grade added, changed or removed, and flows to Rankings, Recruiting Board, Coach Fit, Commitments and the Player Card pop-up.</li>' +
      '<li><strong>Never changes Tier or Confidence.</strong> Those come only from the Recruit Score and the data confidence.</li></ul></section>' +
      '<form class="controls" id="gr-filters" onsubmit="return false"><label>Search<input type="search" id="gr-q" placeholder="Player name" /></label><label>Show<select id="gr-show"><option value="">All players</option><option value="g">Players with grades</option></select></label></form>' +
      '<div class="table-wrap"><table id="gr-table" class="rd-table"></table></div>' +
      '<p class="coach-note">SAMPLE DATA / FICTIONAL EXAMPLE. No grades exist until a staff member enters them.</p>' +
      theRead('Grades are opinions entered by your staff, not calculated by THE READ. Each player\u2019s Staff Score is a weighted average using the Head Coach\u2019s weights, so a pitcher can lean on the pitching coach. The Adjusted Recruit Score nudges the Recruit Score by at most ' + STAFF_CAP + ' points for staff grades, so a few opinions can sharpen the ranking without replacing the data. A missing grade means no one has graded yet, not a low grade.');
    const tbl = $('#gr-table', root);
    function draw() {
      const q = $('#gr-q', root).value.trim().toLowerCase(), only = $('#gr-show', root).value === 'g';
      const list = players.filter((p) => (!q || p.name.toLowerCase().indexOf(q) >= 0) && (!only || store[p.id] && Object.keys(store[p.id]).length));
      tbl.innerHTML = '<caption class="visually-hidden">Staff grades by player (sample data, fictional)</caption><thead><tr><th scope="col">Player</th>' + COACHES.map((c) => '<th scope="col">' + esc(c.name) + '<small class="rd-mobile-meta">' + esc(c.role) + '</small></th>').join('') + '<th scope="col">Staff Score</th><th scope="col">Recruit Score</th><th scope="col">Adjusted Recruit Score</th></tr></thead><tbody>' +
        (list.length ? list.map((p) => {
          const g = store[p.id] || {}, calc = staffCalc(g, p.pos, W), shareOf = {};
          calc.rows.forEach((r) => { shareOf[r.id] = r.share; });
          const live = byId[p.id], sd = calc.score == null ? 0 : Math.max(-STAFF_CAP, Math.min(STAFF_CAP, (calc.score - STAFF_BASELINE) / STAFF_DIVISOR));
          const adj = live.rs == null ? null : Math.round(Math.max(0, Math.min(100, live.rs + Math.max(-2.5, Math.min(2.5, ((live.fit + live.need) / 2 - 50) / 20)) + sd)) * 10) / 10;
          return '<tr><th scope="row">' + cardLink(p) + '<small class="rd-mobile-meta">' + p.pos + '</small></th>' + COACHES.map((c) => {
            const e = g[c.id];
            return '<td data-label="' + esc(c.name) + '">' + (e ? '<strong>' + esc(e.grade || letter(Number(e.score))) + '</strong><small class="rd-mobile-meta">Counts ' + Math.round((shareOf[c.id] || 0) * 100) + '%</small>' + (e.date ? '<small class="rd-mobile-meta">' + esc(e.date) + '</small>' : '') + (e.note ? '<small class="rd-mobile-meta">' + esc(e.note) + '</small>' : '') + ' <button type="button" class="md-del" data-pl="' + esc(p.id) + '" data-co="' + c.id + '" aria-label="Remove grade by ' + esc(c.name) + ' for ' + esc(p.name) + '">Remove</button>' : '&mdash;') + '</td>';
          }).join('') + '<td data-label="Staff Score">' + (calc.score == null ? 'No staff grades yet' : '<strong>' + calc.score.toFixed(1) + '</strong> (' + letter(calc.score) + ')') + '</td><td data-label="Recruit Score">' + (live.rs == null ? 'Not Rated' : live.rs.toFixed(1)) + '</td><td data-label="Adjusted Recruit Score">' + (adj == null ? '&mdash;' : '<strong>' + adj.toFixed(1) + '</strong>') + '</td></tr>';
        }).join('') : '<tr class="rd-empty"><td colspan="' + (COACHES.length + 4) + '">No players match.</td></tr>') + '</tbody>';
    }
    draw();
    root.addEventListener('input', (e) => { if (e.target.closest('#gr-filters')) draw(); });
    root.addEventListener('change', (e) => {
      if (e.target.closest('#gr-filters')) draw();
      if (e.target.id === 'gw-role') { sessionStorage.setItem('theReadGrRole', e.target.value); location.reload(); }
    });
    root.addEventListener('click', (e) => {
      const d = e.target.closest('[data-pl]');
      if (d) {
        if (store[d.dataset.pl]) { delete store[d.dataset.pl][d.dataset.co]; if (!Object.keys(store[d.dataset.pl]).length) delete store[d.dataset.pl]; }
        saveGrades(store); sessionStorage.setItem('theReadGrMsg', 'Grade removed. Staff Score and Adjusted Recruit Score were recalculated.'); location.reload(); return;
      }
      if (e.target.id === 'gw-reset' && role === 'hc') {
        saveWeights(cloneW(DEFAULT_WEIGHTS)); sessionStorage.setItem('theReadGrMsg', 'Weights reset to the sample defaults.'); location.reload(); return;
      }
      if (e.target.id === 'gw-save') {
        if (role !== 'hc') { $('#gw-errors', root).innerHTML = '<li>Only the Head Coach can change weights.</li>'; return; }
        const errs = [], nw = { all: {}, groups: {} };
        $$('.gw-in', root).forEach((i) => {
          const raw = i.value.trim(), k = i.dataset.k, c = i.dataset.c;
          if (raw === '') { if (k === 'all') errs.push('Default weight for ' + c + ' cannot be blank.'); return; }
          const v = Number(raw);
          if (!isFinite(v) || v < 0) { errs.push('Weights must be numbers of 0 or more (' + (k === 'all' ? 'Default' : k) + ', coach ' + c + ').'); return; }
          if (k === 'all') nw.all[c] = v; else { nw.groups[k] = nw.groups[k] || {}; nw.groups[k][c] = v; }
        });
        if (!errs.length) {
          if (Object.keys(nw.all).reduce((a, c) => a + nw.all[c], 0) <= 0) errs.push('Default weights must add up to more than 0.');
          Object.keys(nw.groups).forEach((k) => {
            COACHES.forEach((c) => { if (nw.groups[k][c.id] == null) nw.groups[k][c.id] = nw.all[c.id]; });
            if (Object.keys(nw.groups[k]).reduce((a, c) => a + nw.groups[k][c], 0) <= 0) errs.push('Weights for ' + k + ' must add up to more than 0.');
          });
        }
        $('#gw-errors', root).innerHTML = errs.slice(0, 5).map((m) => '<li>' + esc(m) + '</li>').join('');
        if (errs.length) return;
        if (!saveWeights(nw)) { $('#gw-errors', root).innerHTML = '<li>This browser blocked saving. Weights were not saved.</li>'; return; }
        sessionStorage.setItem('theReadGrMsg', 'Weights saved (demo, this browser only). Staff Scores and Adjusted Recruit Scores were recalculated.'); location.reload();
      }
    });
    $('#gr-form', root).addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target, errs = [], grade = f.elements.grade.value;
      if (!GRADE_TABLE[grade]) errs.push('Choose a grade from A+ to F. A blank grade is not saved.');
      const date = f.elements.date.value;
      if (date && date > today) errs.push('Date cannot be in the future.');
      $('#gr-errors', root).innerHTML = errs.map((m) => '<li>' + esc(m) + '</li>').join('');
      if (errs.length) return;
      const pid = f.elements.player.value, cid = f.elements.staff.value;
      store[pid] = store[pid] || {};
      store[pid][cid] = { grade: grade, score: GRADE_TABLE[grade], note: f.elements.note.value.trim().slice(0, 300), date: date };
      if (!saveGrades(store)) { $('#gr-errors', root).innerHTML = '<li>This browser blocked saving. The grade was not saved.</li>'; return; }
      sessionStorage.setItem('theReadGrMsg', 'Grade saved for ' + byId[pid].name + ' (demo, this browser only). Staff Score and Adjusted Recruit Score were recalculated.');
      location.reload();
    });
  };
  pages.connect = (root) => {
    const DIR = [
      ['Coach Dana Whitlock (Fictional)', 'High School Coach', 'Fictional Ridge High School', 'TX', 'Infielders and catchers, Class of 2027'],
      ['Coach Marcus Bell (Fictional)', 'High School Coach', 'Fictional Lakeview Prep', 'FL', 'Pitchers, Class of 2028'],
      ['Alex Moreno (Fictional)', 'Private Instructor', 'Fictional Diamond Performance Lab', 'CA', 'Hitting and velocity development'],
      ['Priya Nair (Fictional)', 'Private Instructor', 'Fictional Catching Academy', 'GA', 'Catcher receiving and pop time'],
      ['Coach Ray Tolliver (Fictional)', 'JUCO Coach', 'Fictional Prairie JUCO', 'KS', 'Sophomores seeking 4-year offers'],
      ['Coach Elena Park (Fictional)', 'JUCO Coach', 'Fictional Coastal JUCO', 'CA', 'Pitchers and middle infielders'],
      ['Coach Sam Okafor (Fictional)', '4-Year Coach', 'Fictional Northern State', 'OH', 'Transfer portal needs: outfield, bullpen'],
      ['Coach Lena Brandt (Fictional)', '4-Year Coach', 'Fictional Mountain University', 'CO', 'Open to JUCO transfers'],
      ['Jordan Pike (Fictional)', 'Player', 'Fictional Ridge High School', 'TX', 'SS, Class of 2027, High School'],
      ['Casey Vega (Fictional)', 'Player', 'Fictional Prairie JUCO', 'KS', 'RHP, JUCO sophomore, entering the portal']
    ];
    const ROLES = ['High School Coach', 'Private Instructor', 'JUCO Coach', '4-Year Coach', 'Player'];
    const msg = sessionStorage.getItem('theReadConMsg') || ''; sessionStorage.removeItem('theReadConMsg');
    const portal = players.filter((p) => p.level !== 'High School');
    root.innerHTML =
      '<p class="coach-note md-note"><strong>Connect:</strong> a placeholder directory for reaching high school coaches, private instructors, JUCO coaches, 4-year coaches and players. Messaging is not live. Every person and school below is fictional sample data; no real people are listed and nothing is sent anywhere.</p>' +
      (msg ? '<p class="coach-note md-msg" role="status">' + esc(msg) + '</p>' : '') +
      '<form class="controls" id="cn-filters" onsubmit="return false"><label>Role<select id="cn-role"><option value="">All roles</option>' + ROLES.map((r) => '<option>' + r + '</option>').join('') + '</select></label><label>Search<input type="search" id="cn-q" placeholder="Name, school, state" /></label></form>' +
      '<p class="coach-count" id="cn-count" role="status"></p><div class="coach-grid" id="cn-list"></div>' +
      '<h2 class="coach-h2">Transfer Portal And JUCO</h2><p class="coach-note">Prospects on your board who are not high school players (Current Playing Level: JUCO or 4-Year College / Transfer Portal). Sample Data / Fictional Example.</p>' +
      card('JUCO And Transfer Prospects', miniTable(['Player', 'Pos', 'Class', 'Playing Level', 'Recruit Score', 'Tier', 'Confidence'], portal.map((p) => '<tr><td>' + cardLink(p) + '</td><td>' + p.pos + '</td><td>' + p.grad + '</td><td>' + esc(LEVEL_SHORT[p.level] || p.level) + '</td><td class="rd-num">' + TRC.formatRecruitScore(p.rs) + '</td><td>' + tierBadge(p) + '</td><td>' + confBadge(p) + '</td></tr>'), 'JUCO and transfer prospects'), 'wide') +
      theRead('Recruiting a JUCO or transfer player is different from recruiting a high school athlete: they are older, have college stats, and may have limited eligibility left. Use Playing Level to keep the two groups apart, and note that Tier and Confidence are calculated the same way for everyone. This directory is a mock-up; real messaging needs accounts and a backend.');
    function draw() {
      const role = $('#cn-role', root).value, q = $('#cn-q', root).value.trim().toLowerCase();
      const list = DIR.filter((d) => (!role || d[1] === role) && (!q || d.join(' ').toLowerCase().indexOf(q) >= 0));
      $('#cn-count', root).textContent = 'Showing ' + list.length + ' of ' + DIR.length + ' sample contacts';
      $('#cn-list', root).innerHTML = list.length ? list.map((d, i) => '<section class="card"><h3>' + esc(d[0]) + '</h3><p><span class="pill gray">' + esc(d[1]) + '</span></p><p>' + esc(d[2]) + ' &middot; ' + esc(d[3]) + '</p><p>' + esc(d[4]) + '</p><button type="button" class="button button-secondary" data-msg="' + i + '">Message (Not Live)</button><p class="coach-note">Sample Data / Fictional Example</p></section>').join('') : '<p class="coach-note">No contacts match these filters.</p>';
    }
    draw();
    root.addEventListener('input', (e) => { if (e.target.closest('#cn-filters')) draw(); });
    root.addEventListener('change', (e) => { if (e.target.closest('#cn-filters')) draw(); });
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-msg]'); if (!b) return;
      b.insertAdjacentHTML('afterend', '<p class="coach-note" role="status">Messaging is not live in this preview. Nothing was sent.</p>');
      b.remove();
    });
  };

  pages.department = (root) => {
    const tot = (f) => PROGRAMS.reduce((s, p) => s + f(p), 0);
    root.innerHTML =
      '<div class="kpi-row">' + kpi('Programs (Sample)', PROGRAMS.length) + kpi('Class Spots Targeted', tot((p) => p.target)) + kpi('Committed (Sample)', tot((p) => p.committed)) + kpi('Open Spots', tot((p) => p.target - p.committed)) + kpi('Sample Recruiting Spend', money(tot((p) => p.spend))) + '</div>' +
      '<div class="coach-grid">' +
      card('All Programs At A Glance', miniTable(['Program', 'Coach', 'Target Class', 'Committed', 'Open Spots', 'Top Needs', 'Sample Spend'], PROGRAMS.map((p) => '<tr><th scope="row">' + p.sport + '</th><td>' + esc(p.coach) + '</td><td>' + p.target + '</td><td>' + p.committed + '</td><td>' + (p.target - p.committed) + '</td><td>' + p.needs.join(', ') + '</td><td>' + money(p.spend) + '</td></tr>'), 'All programs at a glance') + '<p class="coach-note">Sample Data / Fictional Example. Every program, coach, and number here is made up.</p>', 'wide') +
      card('Who Is Recruiting Whom (Baseball Sample)', miniTable(['Player', 'Pos', 'Class', 'Tier', 'Recruiting Coach', 'Next Step'], players.filter((p) => !p.committed && p.board <= 2).sort((a, b) => a.board - b.board || (b.pri || 0) - (a.pri || 0)).slice(0, 10).map((p) => '<tr><td>' + cardLink(p) + '</td><td>' + p.pos + '</td><td>' + p.grad + '</td><td><span class="pill pill-t' + p.board + '">Priority ' + p.board + '</span></td><td>' + esc((COACHES.filter((c) => c.id === p.coach)[0] || { name: 'Unassigned' }).name) + '</td><td>' + (p.action || '&mdash;') + '</td></tr>'), 'Who is recruiting whom'), 'wide') +
      '</div>' + coachLink + deptBanner('Department overview (fictional): one view of every program. Each coach\u2019s private notes stay private. Open Spots is the target class size minus current commitments, so a program with several open spots and few listed needs is the one to check first. Spend and budget figures are invented samples.');
  };

  pages.programs = (root) => {
    root.innerHTML =
      '<div class="dept-programs">' + PROGRAMS.map((p) =>
        '<section class="card dept-card"><h2>' + p.sport + '</h2><p class="dept-coach">Coach Assigned: ' + esc(p.coach) + '</p>' +
        '<dl class="dept-dl"><div><dt>Target Class</dt><dd>' + p.target + '</dd></div><div><dt>Committed</dt><dd>' + p.committed + '</dd></div><div><dt>Open Spots</dt><dd>' + (p.target - p.committed) + '</dd></div></dl>' +
        '<p><strong>Needs:</strong> ' + p.needs.join(', ') + '</p><p><strong>Targets By Class:</strong> ' + p.classes + '</p>' +
        '<p class="coach-note">Sample Data / Fictional Example</p></section>').join('') +
      '</div>' + coachLink + deptBanner('Program needs (fictional): by position and class, with commitments and open spots for each program. Needs list the positions each coach has said matter most, and Targets By Class shows how many spots remain per graduating class, so you can see which classes are thin.');
  };

  pages.finances = (root) => {
    const tot = (f) => PROGRAMS.reduce((s, p) => s + f(p), 0);
    const sa = tot((p) => p.sch[0]), su = tot((p) => p.sch[1]), tb = tot((p) => p.travel[0]), ts = tot((p) => p.spend), tc = tot((p) => p.committed);
    root.innerHTML =
      '<div class="kpi-row">' + kpi('Scholarship Equivalencies Available (Sample)', sa.toFixed(1)) + kpi('Used (Sample)', su.toFixed(1)) + kpi('Recruiting Travel Budget (Sample)', money(tb)) + kpi('Sample Spend', money(ts)) + kpi('Cost Per Commitment (Sample)', money(ts / tc)) + '</div>' +
      '<div class="coach-grid">' +
      card('Budget Vs Spend By Program', miniTable(['Program', 'Scholarship Equiv. Available', 'Used', 'Travel Budget', 'Travel Spent', 'Camp Costs', 'Visit Costs', 'Total Spend', 'Cost Per Commitment'], PROGRAMS.map((p) => '<tr><th scope="row">' + p.sport + '</th><td>' + p.sch[0] + '</td><td>' + p.sch[1] + '</td><td>' + money(p.travel[0]) + '</td><td>' + money(p.travel[1]) + '</td><td>' + money(p.camp) + '</td><td>' + money(p.visits) + '</td><td>' + money(p.spend) + '</td><td>' + money(p.spend / p.committed) + '</td></tr>'), 'Budget versus spend by program') + '<p class="coach-note">Sample Data / Fictional Example. These are not real budgets, rules, or limits. Scholarship limits vary by sport and governing body; confirm with your compliance office.</p>', 'wide') +
      card('Try Your Own Numbers', '<form class="calc" id="fin-form" onsubmit="return false"><div class="form-grid">' +
        '<div class="field"><label for="f-av">Scholarship Equivalencies Available</label><input id="f-av" type="number" min="0" step="0.1" value="0"></div>' +
        '<div class="field"><label for="f-us">Scholarship Equivalencies Used</label><input id="f-us" type="number" min="0" step="0.1" value="0"></div>' +
        '<div class="field"><label for="f-tb">Recruiting Travel Budget ($)</label><input id="f-tb" type="number" min="0" step="100" value="0"></div>' +
        '<div class="field"><label for="f-sp">Recruiting Spend So Far ($)</label><input id="f-sp" type="number" min="0" step="100" value="0"></div>' +
        '<div class="field"><label for="f-cm">Commitments</label><input id="f-cm" type="number" min="0" step="1" value="0"></div></div>' +
        '<div id="f-out" class="callout" role="status" aria-live="polite"></div><p class="coach-note">Nothing is saved or sent. Enter your own figures; the empty template starts at zero.</p></form>') +
      '</div>' + deptBanner('Finances (fictional): scholarship equivalencies, recruiting travel, camp and visit costs, and cost per commitment, shown with sample numbers only. Cost Per Commitment is total spend divided by commitments, so it rises when spend grows faster than signings. Check scholarship limits with your compliance office.');
    const g = (id) => Math.max(0, parseFloat($('#' + id, root).value) || 0);
    const upd = () => {
      const av = g('f-av'), us = g('f-us'), tb = g('f-tb'), sp = g('f-sp'), cm = g('f-cm');
      $('#f-out', root).innerHTML = '<strong>Scholarship Equivalencies Remaining:</strong> ' + (av - us).toFixed(1) + '<br><strong>Travel Budget Remaining:</strong> ' + money(tb - sp) + '<br><strong>Cost Per Commitment:</strong> ' + (cm ? money(sp / cm) : '&mdash;');
    };
    root.querySelectorAll('#fin-form input').forEach((i) => i.addEventListener('input', upd)); upd();
  };

  pages.schedule = (root) => {
    const events = [
      ['2026-11-07', 'Baseball', 'Fictional Fall Showcase', 'Evaluate Priority 1 pitchers', 'Home'],
      ['2026-11-14', 'Softball', 'Fictional Fall Classic', 'Infield looks', 'Away'],
      ['2026-11-21', 'Baseball', 'Fictional Regional Tournament', 'Verify metrics on infield targets', 'Away'],
      ['2026-12-05', 'Baseball', 'Fictional Winter Camp', 'Pitching bullpens', 'Home'],
      ['2027-01-16', 'Men\u2019s Basketball', 'Fictional Winter Showcase', 'Guard evaluations', 'Away'],
      ['2027-02-13', 'All Programs', 'Campus Visit Day', 'Visits for Priority 1 targets', 'Home'],
      ['2027-03-06', 'Women\u2019s Volleyball', 'Fictional Spring Tournament', 'Setter evaluations', 'Away']
    ];
    root.innerHTML = '<div class="coach-grid">' +
      card('Recruiting Calendar', miniTable(['Date', 'Program', 'Event', 'Focus', 'Home/Away'], events.map((e) => '<tr><td>' + e[0] + '</td><th scope="row">' + e[1] + '</th><td>' + e[2] + '</td><td>' + e[3] + '</td><td>' + e[4] + '</td></tr>'), 'Recruiting calendar') + '<p class="coach-note">Sample Data / Fictional Example. Dates and events are made up.</p>', 'wide') +
      card('Contact And Dead Period Reminders', '<ul class="dept-list"><li>Contact, evaluation, quiet, and dead periods differ by sport and governing body.</li><li>Check your official calendar before scheduling any visit or contact.</li><li>Add your own dates to this calendar once real scheduling is built (roadmap).</li></ul><p class="coach-note">These are reminders, not rules. THE READ does not provide compliance advice.</p>') +
      '</div>' + coachLink + deptBanner('Schedule (fictional): one calendar across programs, with reminders to confirm contact and dead periods. Events are ordered by date so staff can see when several programs are on the road at once. Dates here are invented.');
  };
  window.TheReadCoach = { players: players, rankingRowHtml: rankingRowHtml };
  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('coach-app');
    const page = document.body.dataset.coachPage;
    if (root && pages[page]) {
      try { pages[page](root); } catch (e) { root.innerHTML = '<p class="coach-note">This preview could not load. Please refresh the page.</p>'; if (window.console) console.error(e); }
    }
  });
})();
