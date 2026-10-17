/* THE READ Athletics - coach workspace preview (fictional sample data only) */
(function () {
  'use strict';

  const POS = ['P', 'C', '1B', '2B', '3B', 'SS', 'OF'];
  const GRADES = ['F', 'D', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+'];


  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = (v, d) => (v == null ? '&mdash;' : Number(v).toFixed(d == null ? 1 : d));
  const ftin = (h) => Math.floor(h / 12) + '\u2032' + (h % 12) + '\u2033';
  const avg = (a) => { a = a.filter((v) => v != null); return a.length ? a.reduce((s, v) => s + v, 0) / a.length : null; };
  const TRC = window.TheReadClassification;
  const confLabel = (c) => TRC.getConfidenceLevel(c);
  const tierBadge = (p, o) => TRC.renderTierBadge(p.rs, o);
  const confBadge = (p, o) => TRC.renderConfidenceBadge(p.conf, o);
  const rk = (v) => (v == null ? '&mdash;' : '#' + v);
  const letter = (s) => (s >= 95 ? 'A+' : s >= 92 ? 'A' : s >= 89 ? 'A-' : s >= 86 ? 'B+' : s >= 83 ? 'B' : s >= 80 ? 'B-' : s >= 77 ? 'C+' : s >= 74 ? 'C' : s >= 70 ? 'C-' : s >= 60 ? 'D' : 'F');
  const $ = (s, r) => (r || document).querySelector(s);

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
    p.hc = letter(p.rs + (r() - 0.5) * 12);
    p.pc = letter(p.rs + (r() - 0.5) * 12);
    p.ac = letter(p.rs + (r() - 0.5) * 12);
    p.staff = Math.round(p.rs + (r() - 0.5) * 10);
    p.fit = Math.round(58 + 36 * r());
    p.need = Math.round(55 + 40 * r());
    p.adj = Math.round((p.rs + (p.fit - 75) / 10) * 10) / 10;
    p.pri = Math.round((p.adj + p.need + p.fit) / 3 + (r() - 0.5) * 6);
    p.eval = '2026-' + String(1 + (i % 9)).padStart(2, '0') + '-' + String(8 + ((i * 5) % 20)).padStart(2, '0');
    p.notes = ['Quick bat, clean actions.', 'Projectable frame; needs more live looks.', 'Strong arm, still filling out.', 'Plus runner with steady defense.', 'Impact bat; verify swing data.', 'Competes well; consistent reports.'][i % 6];
    p.coach = COACHES[i % 4].id;
    p.action = ACTIONS[i % 5];
    players.push(p);
  }
  // Sample edge cases so every Tier / Confidence combination (and the 94.96 / 89.96 rounding cases) appears.
  // Values are fictional; Tier and Confidence Level are always derived from these stored numbers.
  [[94.96, 89.96], [95, 90], [97.4, 72.5], [96.1, 54], [91.3, 93], [85, 60], [87.6, 41.5], [84.99, 95], [78.2, 70], [70, 59.99], [69.99, 91], [66.4, 64], [58.7, 47], [null, null], [null, null], [88, null]]
    .forEach((v, k) => { const p = players[k]; p.rs = v[0]; p.conf = v[1]; if (v[0] == null) p.adj = null; });
  // Master Database: coach-entered demo players live in this browser's localStorage and join the sample players here,
  // so every page (rankings, player card, H2H, dashboard...) reads the same list. Real storage needs a backend.
  const STORE_KEY = 'theReadDemoMasterDb';
  const loadAdded = () => { try { const a = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
  const saveAdded = (a) => { try { localStorage.setItem(STORE_KEY, JSON.stringify(a)); return true; } catch (e) { return false; } };
  loadAdded().forEach((a) => {
    if (!a || !a.id || !a.name || POS.indexOf(a.pos) < 0) return;
    const p = Object.assign({ sec: '', twoWay: false, state: '', method: 'Coach Entry (Unverified)', notes: '', eval: '', links: {}, ht: null, wt: null, gpa: null,
      staff: null, fit: null, need: null, adj: null, pri: null, hc: null, pc: null, ac: null, committed: '', coach: '', action: '' }, a, { entered: true });
    ['opg', 'sopg', 'dpg', 'sdpg', 'ppg', 'ath', 'rs', 'conf'].forEach((k) => { p[k] = null; });
    players.push(p);
  });
  players.forEach((p) => { p.tier = TRC.getPlayerTier(p.rs); p.confLevel = TRC.getConfidenceLevel(p.conf); p.recruitScore = p.rs; p.confidencePercentage = p.conf; });
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
  const theRead = (text) => '<aside class="read-note" aria-label="Sample summary"><strong class="tr">THE READ</strong> <span>' + text + '</span></aside>';

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
      theRead('Sample summary built from this page\u2019s fictional data: ' + db.total + ' sample players, led by ' + esc(top.name) + ' (' + top.pos + ', Class of ' + top.grad + '). The dashboard is informational \u2014 it summarizes the shared database and is not a recruiting CRM.');
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
    ['ppg', 'PPG', (p) => num(p.ppg), 'c-grade rd-num']
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
      checks('tier', 'Tier', TRC.TIER_NAMES) + checks('conf', 'Confidence', TRC.CONFIDENCE_NAMES) +
      '<button type="button" class="button button-secondary" id="r-reset">Reset</button>' +
      '</form><p class="coach-count" id="r-count" role="status"></p><div class="table-wrap"><table id="r-table" class="rd-table"></table></div>' +
      '<div class="rd-legend"><h2>How To Read Recruit Score, Tier, And Confidence</h2><ul>' +
      '<li><strong>Recruit Score:</strong> ' + TRC.TEXT.recruitScoreTooltip + '</li>' +
      '<li><strong>Tier:</strong> ' + TRC.TEXT.tierTooltip + ' Platinum 95.0&ndash;100.0, Gold 85.0&ndash;94.9, Silver 70.0&ndash;84.9, Bronze 0.0&ndash;69.9, Not Rated when no Recruit Score exists. Tier uses the full stored score before rounding, so a stored 94.96 displays as 95.0 and is Gold.</li>' +
      '<li><strong>Confidence:</strong> ' + TRC.TEXT.confidenceTooltip + ' High 90.0%&ndash;100.0%, Medium 60.0%&ndash;89.9%, Low 0.0%&ndash;59.9%, Unknown when it cannot be calculated. A stored 89.96% displays as 90.0% and is Medium. ' + TRC.TEXT.lowConfidenceTooltip + '</li></ul></div>';
    const tbl = $('#r-table', root);
    const picked = (name) => Array.from(root.querySelectorAll('input[name="' + name + '"]:checked')).map((i) => i.value);
    function draw() {
      const fp = $('#f-pos', root).value, fc = $('#f-class', root).value;
      let list = TRC.filterAthletes(players, {
        search: $('#f-q', root).value, tiers: picked('tier'), confidences: picked('conf'),
        extra: (p) => (!fp || p.pos === fp) && (!fc || String(p.grad) === fc)
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

  pages.player = (root) => {
    const qid = new URLSearchParams(location.search).get('id');
    root.innerHTML = '<form class="controls" onsubmit="return false"><label>Player<select id="pc-sel"></select></label></form><div id="pc-out"></div>';
    const sel = $('#pc-sel', root);
    playerOptions(sel, byId[qid] ? qid : players[0].id);
    const field = (l, v) => '<div class="kv"><span>' + l + '</span><strong>' + v + '</strong></div>';
    const bench = (k, p, low, d) => {
      const a = avgOf(k, players);
      if (p[k] == null || a == null) return '&mdash;';
      const diff = p[k] - a;
      const good = low ? diff < 0 : diff > 0;
      return '<span class="' + (Math.abs(diff) < 0.05 ? '' : good ? 'adv-good' : 'adv-bad') + '">' + (diff > 0 ? '+' : '') + diff.toFixed(d == null ? 1 : d) + ' vs avg ' + a.toFixed(d == null ? 1 : d) + '</span>';
    };
    function draw() {
      const p = byId[sel.value];
      const stand = p.overall == null ? 'Not ranked (Not Rated)' : p.overall <= 5 ? 'Top 5 overall' : p.overall <= 15 ? 'Top 15 overall' : 'Rank ' + p.overall + ' of ' + players.filter((x) => x.rs != null).length;
      $('#pc-out', root).innerHTML =
        '<div class="coach-grid">' +
        card(esc(p.name), field('Grad Year', p.grad) + field('Primary Position', p.pos) + field('Secondary Position', p.sec || '&mdash;') + field('Bats/Throws', p.bats + '/' + p.throws) + field('Height', ftin(p.ht)) + field('Weight', p.wt + ' lb') + field('GPA', p.gpa.toFixed(2)) + field('State', p.state), 'kvs') +
        card('Rankings', field('Overall Rank', rk(p.overall)) + field('Class Rank', rk(p.classRank)) + field('Athletic Score', num(p.ath)), 'kvs') +
        card('Recruit Score, Player Tier, And Confidence', field('Recruit Score', '<span class="rd-num" title="' + esc(TRC.TEXT.recruitScoreTooltip) + '">' + TRC.formatRecruitScore(p.rs) + '</span>') + field('Player Tier', tierBadge(p, { focusable: true, size: 'large' })) + field('Confidence', confBadge(p, { focusable: true, size: 'large' })) +
          '<p class="coach-note">' + TRC.TEXT.cardTier + ' ' + TRC.TEXT.cardConfidence + ' Missing data lowers Confidence, not Recruit Score.</p>', 'kvs rd-triple') +
        card('Grades', field('OPG', num(p.opg)) + field('SOPG', num(p.sopg)) + field('DPG', num(p.dpg)) + field('SDPG', num(p.sdpg)) + field('PPG', num(p.ppg)), 'kvs') +
        card('Team Evaluation', field('HC Grade', p.hc) + field('PC Grade', p.pc) + field('AC Grade', p.ac) + field('Staff Score', p.staff) + field('Coach Fit Score', p.fit) + field('Team Need Score', p.need) + field('Adjusted Recruit Score', num(p.adj)) + field('Priority Score', p.pri), 'kvs') +
        card('Measurables', field('Avg EV', num(p.avgEV) + ' mph') + field('Max EV', num(p.maxEV) + ' mph') + field('Avg FBV', num(p.avgFBV) + ' mph') + field('Max FBV', num(p.maxFBV) + ' mph') + field('Throwing Velo', num(p.tv) + ' mph') + field('60 Time', num(p.t60, 2) + ' s') + field('Pop Time', num(p.pop, 2) + ' s'), 'kvs') +
        card('Database Benchmarks', field('Avg EV vs Avg', bench('avgEV', p)) + field('Max EV vs Avg', bench('maxEV', p)) + field('Avg FBV vs Avg', bench('avgFBV', p)) + field('60 Time vs Avg', bench('t60', p, true, 2)) + field('Overall Standing', stand), 'kvs') +
        card('External Profile Links', field('PBR', 'Not linked in demo') + field('PG', 'Not linked in demo') + field('NCSA', 'Not linked in demo') + field('Fieldlevel', 'Not linked in demo') + field('Video', 'Not linked in demo'), 'kvs') +
        '</div>' +
        theRead('Sample summary for ' + esc(p.name) + ' (fictional): ' + (p.rs == null ? 'Not Rated ' + p.pos + '. Recruit Score has not been calculated, so no Player Tier is assigned (this is not the same as Bronze).' : p.tier + ' ' + p.pos + ' with a Recruit Score of ' + TRC.formatRecruitScore(p.rs) + '.') + ' Confidence: ' + (p.conf == null ? 'Unknown (not calculated).' : confLabel(p.conf) + ' at ' + TRC.formatConfidencePercentage(p.conf) + ' of expected verified data.') + ' Evaluation method: ' + p.method + '. ' + esc(p.notes));
    }
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
      const teamLine = team.a === team.b ? 'Team Edge is even (' + team.a + '\u2013' + team.b + ').' : 'Team Edge goes to ' + esc(team.a > team.b ? pa.name : pb.name) + ' (' + Math.max(team.a, team.b) + '\u2013' + Math.min(team.a, team.b) + (team.t ? ', ' + team.t + ' tied' : '') + '), with Priority Score ' + (pa.pri === pb.pri ? 'tied' : 'favoring ' + esc(pa.pri > pb.pri ? pa.name : pb.name)) + '.';
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
    const needs = { P: 1, C: 2, SS: 3, OF: 4, '2B': 5, '3B': 6, '1B': 7 };
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
      card('Recruiting Philosophy', '<fieldset class="philo"><legend>Coaches rank 1\u20135 (sample choice)</legend>' + ['Prefer Pitching', 'Prefer Position Players', 'Balanced Approach', 'Best Player Available', 'Need-Based Recruiting'].map((x, i) => '<label><input type="radio" name="philo" ' + (i === 2 ? 'checked' : '') + ' /> ' + x + '</label>').join('') + '</fieldset><p class="coach-note">Team Needs are private to each program and are not stored in the shared Master Database.</p>') +
      '</div>' + theRead('Sample program (fictional): ' + OUR + '. These private team settings feed Coach Fit and Team Need Score for this program only.');
  };

  pages.fit = (root) => {
    const pr = [['Pitching Priority', 1], ['Defense Priority', 3], ['Athleticism Priority', 4], ['Speed Priority', 6], ['Power Priority', 5], ['Immediate Impact', 2], ['Long-Term Projection', 7]];
    const posPr = { P: 1, C: 2, SS: 3, OF: 4, '2B': 5, '3B': 6, '1B': 7 };
    const top = players.filter((p) => !p.committed).sort((a, b) => (b.fit || 0) - (a.fit || 0)).slice(0, 10);
    root.innerHTML =
      '<div class="coach-grid">' +
      card('Priority Rankings', miniTable(['Priority', 'Rank (1\u20137)'], pr.map((x) => tr(x)), 'Priority rankings')) +
      card('Positional Priorities', miniTable(['Position', 'Priority'], POS.map((x) => tr([x, posPr[x]])), 'Positional priorities')) +
      card('Fit Factors', '<ul class="plain-list"><li>Recruit Score</li><li>Athletic Score</li><li>Team Need Score</li><li>Primary Position Fit</li><li>Secondary Position Fit</li><li>Confidence Score</li><li>Staff Score</li><li>Adjusted Recruit Score</li><li>Priority Score</li></ul><p class="coach-note">Fit factor weights are set per program and are not published.</p>') +
      '</div>' +
      card('Top Coach Fit', miniTable(['Fit Rank', 'Player', 'Pos', 'Class', 'Coach Fit Score', 'Recruit Score', 'Priority Score'], top.map((p, i) => '<tr><th scope="row">#' + (i + 1) + ' Fit</th><td>' + cardLink(p) + '</td><td>' + p.pos + '</td><td>' + p.grad + '</td><td>' + p.fit + '</td><td>' + num(p.rs) + '</td><td>' + p.pri + '</td></tr>'), 'Top coach fit')) +
      theRead('Coach Fit measures program fit, not talent. Recruit Score stays the same for every program; Coach Fit changes with each program\u2019s priorities.');
  };

  pages.board = (root) => {
    const board = players.filter((p) => !p.committed);
    const ours = players.filter((p) => p.committed === OUR);
    const t = (n) => board.filter((p) => p.board === n);
    const tierName = { 1: 'Priority 1', 2: 'Priority 2', 3: 'Priority 3' };
    root.innerHTML =
      '<div class="kpi-row">' + kpi('Priority 1 Targets', t(1).length) + kpi('Priority 2 Targets', t(2).length) + kpi('Priority 3 Targets', t(3).length) + kpi('Committed Players', ours.length) + kpi('Open Spots', 14 - ours.length) + '</div>' +
      '<form class="controls" onsubmit="return false"><label>Priority Tier<select id="b-tier"><option value="">All</option><option value="1">Priority 1</option><option value="2">Priority 2</option><option value="3">Priority 3</option></select></label>' +
      '<label>Position<select id="b-pos"><option value="">All</option>' + POS.map((x) => '<option>' + x + '</option>').join('') + '</select></label></form>' +
      '<div class="table-wrap"><table id="b-table"></table></div>' +
      '<div class="coach-grid">' + card('Board Snapshot', miniTable(['Snapshot', 'Player', 'Value'], [
        '<tr><th scope="row">Highest Priority Score</th><td>' + cardLink(best('pri', board)) + '</td><td>' + best('pri', board).pri + '</td></tr>',
        '<tr><th scope="row">Highest Recruit Score</th><td>' + cardLink(best('rs', board)) + '</td><td>' + num(best('rs', board).rs) + '</td></tr>',
        '<tr><th scope="row">Highest Adjusted Recruit Score</th><td>' + cardLink(best('adj', board)) + '</td><td>' + num(best('adj', board).adj) + '</td></tr>',
        '<tr><th scope="row">Average Priority Score</th><td>&mdash;</td><td>' + num(avgOf('pri', board)) + '</td></tr>'], 'Board snapshot')) + '</div>' +
      theRead('Your private board (fictional): evaluation first, then priority. Players committed elsewhere are removed from the board automatically.');
    function draw() {
      const ft = $('#b-tier', root).value, fp = $('#b-pos', root).value;
      const list = board.filter((p) => (!ft || String(p.board) === ft) && (!fp || p.pos === fp)).sort((a, b) => a.board - b.board || (b.pri || 0) - (a.pri || 0));
      $('#b-table', root).innerHTML = '<caption class="visually-hidden">Recruiting board (fictional data)</caption><thead><tr>' + ['Priority Tier', 'Player Name', 'Primary Position', 'Secondary Position', 'Class', 'State', 'Athletic Score', 'Recruit Score', 'Tier', 'Confidence', 'Adjusted Recruit Score', 'Priority Score', 'Evaluation Method', 'Player Notes'].map((h) => '<th scope="col">' + h + '</th>').join('') + '</tr></thead><tbody>' +
        list.map((p) => '<tr><td><span class="pill pill-t' + p.board + '">' + tierName[p.board] + '</span></td><td>' + cardLink(p) + '</td><td>' + p.pos + '</td><td>' + (p.sec || '&mdash;') + '</td><td>' + p.grad + '</td><td>' + p.state + '</td><td>' + num(p.ath) + '</td><td class="rd-num">' + TRC.formatRecruitScore(p.rs) + '</td><td>' + tierBadge(p) + '</td><td>' + confBadge(p) + '</td><td>' + rk(p.adj) + '</td><td>' + p.pri + '</td><td>' + p.method + '</td><td>' + esc(p.notes) + '</td></tr>').join('') + '</tbody>';
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
      '<div class="table-wrap"><table><caption class="visually-hidden">Commitments (fictional data)</caption><thead><tr>' + ['Player Name', 'Primary Position', 'Secondary Position', 'Class', 'State', 'Athletic Score', 'Recruit Score', 'Tier', 'Confidence', 'Adjusted Recruit Score', 'Committed School', 'Commitment Date', 'Evaluation Method', 'Player Notes'].map((h) => '<th scope="col">' + h + '</th>').join('') + '</tr></thead><tbody>' +
      list.map((p) => '<tr><td>' + cardLink(p) + '</td><td>' + p.pos + '</td><td>' + (p.sec || '&mdash;') + '</td><td>' + p.grad + '</td><td>' + p.state + '</td><td>' + num(p.ath) + '</td><td class="rd-num">' + TRC.formatRecruitScore(p.rs) + '</td><td>' + tierBadge(p) + '</td><td>' + confBadge(p) + '</td><td>' + rk(p.adj) + '</td><td>' + esc(p.committed) + '</td><td>' + p.commitDate + '</td><td>' + p.method + '</td><td>' + esc(p.notes) + '</td></tr>').join('') + '</tbody></table></div>' +
      '<div class="coach-grid">' +
      card('Commitments By Position', miniTable(['Position', 'Commitments'], posRows, 'Commitments by position')) +
      card('Commitment Quality', miniTable(['Measure', 'Player', 'Value'], [
        '<tr><th scope="row">Avg Confidence Score</th><td>&mdash;</td><td>' + num(avgOf('conf', list)) + '%</td></tr>',
        leader('Highest Confidence Score Commit', 'conf', list, false, 0),
        '<tr><th scope="row">Avg Priority Score</th><td>&mdash;</td><td>' + num(avgOf('pri', list)) + '</td></tr>',
        leader('Highest Priority Score Commit', 'pri', list, false, 0),
        leader('Highest Adjusted Recruit Score Commitment', 'adj', list)], 'Commitment quality')) +
      card('College Rankings', miniTable(['Rank', 'School', 'Commits', 'Avg Recruit Score'], schoolRows(schools), 'College rankings') + '<p class="coach-note">Sample schools only. Rankings reflect the average Recruit Score of each school\u2019s fictional commits.</p>') +
      '</div>' + theRead('Commitments are tracked in the shared database; your program\u2019s notes stay private. All schools and players shown are fictional.');
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
      '<h2 class="coach-h2">Position Leaders</h2><div class="coach-grid">' + leaders + '</div>' +
      theRead('Analytics summarize the fictional sample database. Benchmarks are position-specific so speed and power are compared with players at the same position.');
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
      '</div>' + theRead('Regional views show where talent concentrates in the fictional sample. College rankings use the average of each school\u2019s fictional commits.');
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
  const deptBanner = (t) => '<aside class="read-note dept-note" aria-label="Sample summary"><strong class="tr">THE READ</strong> <span>' + t + '</span></aside>';
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
      '<label>Source<select id="md-src"><option value="">All</option><option value="s">Sample</option><option value="a">Coach-Entered (Demo)</option></select></label>' +
      '<button type="button" class="button button-secondary" id="md-reset">Reset</button></form>' +
      '<p class="coach-count" id="md-count" role="status"></p><div class="table-wrap md-wrap"><table id="md-table" class="rd-table md-table"></table></div>' +
      '<p class="coach-note">SAMPLE DATA / FICTIONAL EXAMPLE. Helper columns from the owner workbook are calculated, not stored.</p>';
    const tbl = $('#md-table', root);
    function kpis() {
      const k = $('#md-kpis', root);
      k.innerHTML = kpi('Total Players', players.length) + kpi('Sample Players', players.filter((p) => !p.entered).length) + kpi('Coach-Entered (Demo)', players.filter((p) => p.entered).length) + kpi('Possible Duplicates', players.filter((p) => dupCount[dupKey(p)] > 1).length) + kpi('Missing 60 Time (Position Players)', players.filter((p) => p.pos !== 'P' && p.t60 == null).length);
    }
    function draw() {
      const q = $('#md-q', root).value.trim().toLowerCase(), fp = $('#md-pos', root).value, fg = $('#md-grad', root).value, fs = $('#md-src', root).value;
      let list = players.filter((p) => (!fp || p.pos === fp) && (!fg || String(p.grad) === fg) && (!fs || (fs === 'a') === !!p.entered) &&
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
      rec.sec = v('sec'); rec.bats = v('bats'); rec.throws = v('throws'); rec.twoWay = f.elements.twoWay.checked;
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
  pages.department = (root) => {
    const tot = (f) => PROGRAMS.reduce((s, p) => s + f(p), 0);
    root.innerHTML =
      '<div class="kpi-row">' + kpi('Programs (Sample)', PROGRAMS.length) + kpi('Class Spots Targeted', tot((p) => p.target)) + kpi('Committed (Sample)', tot((p) => p.committed)) + kpi('Open Spots', tot((p) => p.target - p.committed)) + kpi('Sample Recruiting Spend', money(tot((p) => p.spend))) + '</div>' +
      '<div class="coach-grid">' +
      card('All Programs At A Glance', miniTable(['Program', 'Coach', 'Target Class', 'Committed', 'Open Spots', 'Top Needs', 'Sample Spend'], PROGRAMS.map((p) => '<tr><th scope="row">' + p.sport + '</th><td>' + esc(p.coach) + '</td><td>' + p.target + '</td><td>' + p.committed + '</td><td>' + (p.target - p.committed) + '</td><td>' + p.needs.join(', ') + '</td><td>' + money(p.spend) + '</td></tr>'), 'All programs at a glance') + '<p class="coach-note">Sample Data / Fictional Example. Every program, coach, and number here is made up.</p>', 'wide') +
      card('Who Is Recruiting Whom (Baseball Sample)', miniTable(['Player', 'Pos', 'Class', 'Tier', 'Recruiting Coach', 'Next Step'], players.filter((p) => !p.committed && p.board <= 2).sort((a, b) => a.board - b.board || (b.pri || 0) - (a.pri || 0)).slice(0, 10).map((p) => '<tr><td>' + cardLink(p) + '</td><td>' + p.pos + '</td><td>' + p.grad + '</td><td><span class="pill pill-t' + p.board + '">Priority ' + p.board + '</span></td><td>' + esc((COACHES.filter((c) => c.id === p.coach)[0] || { name: 'Unassigned' }).name) + '</td><td>' + (p.action || '&mdash;') + '</td></tr>'), 'Who is recruiting whom'), 'wide') +
      '</div>' + coachLink + deptBanner('Department overview (fictional): one view of every program. Each coach\u2019s private notes stay private.');
  };

  pages.programs = (root) => {
    root.innerHTML =
      '<div class="dept-programs">' + PROGRAMS.map((p) =>
        '<section class="card dept-card"><h2>' + p.sport + '</h2><p class="dept-coach">Coach Assigned: ' + esc(p.coach) + '</p>' +
        '<dl class="dept-dl"><div><dt>Target Class</dt><dd>' + p.target + '</dd></div><div><dt>Committed</dt><dd>' + p.committed + '</dd></div><div><dt>Open Spots</dt><dd>' + (p.target - p.committed) + '</dd></div></dl>' +
        '<p><strong>Needs:</strong> ' + p.needs.join(', ') + '</p><p><strong>Targets By Class:</strong> ' + p.classes + '</p>' +
        '<p class="coach-note">Sample Data / Fictional Example</p></section>').join('') +
      '</div>' + coachLink + deptBanner('Program needs (fictional): by position and class, with commitments and open spots for each program.');
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
      '</div>' + deptBanner('Finances (fictional): scholarship equivalencies, recruiting travel, camp and visit costs, and cost per commitment, shown with sample numbers only.');
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
      '</div>' + coachLink + deptBanner('Schedule (fictional): one calendar across programs, with reminders to confirm contact and dead periods.');
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
