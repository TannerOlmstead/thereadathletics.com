/* THE READ Athletics - coach workspace preview (fictional sample data only) */
(function () {
  'use strict';

  const POS = ['P', 'C', '1B', '2B', '3B', 'SS', 'OF'];
  const GRADES = ['F', 'D', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+'];


  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = (v, d) => (v == null ? '&mdash;' : Number(v).toFixed(d == null ? 1 : d));
  const ftin = (h) => Math.floor(h / 12) + '\u2032' + (h % 12) + '\u2033';
  const avg = (a) => { a = a.filter((v) => v != null); return a.length ? a.reduce((s, v) => s + v, 0) / a.length : null; };
  const confLabel = (c) => (c >= 90 ? 'High' : c >= 60 ? 'Medium' : 'Low');
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
    p.t60 = isP ? null : Math.round((7.7 - 1.1 * q + r() * 0.25) * 100) / 100;
    p.pop = pos === 'C' ? Math.round((2.15 - 0.3 * q + r() * 0.05) * 100) / 100 : null;
    p.opg = isP ? null : Math.round((p.rs + (r() - 0.5) * 12) * 10) / 10;
    p.dpg = isP ? null : Math.round((p.rs + (r() - 0.5) * 12) * 10) / 10;
    p.sopg = p.sec ? Math.round((p.opg - 4 - r() * 6) * 10) / 10 : null;
    p.sdpg = p.sec ? Math.round((p.dpg - 4 - r() * 6) * 10) / 10 : null;
    p.ppg = (isP || p.twoWay) ? Math.round((p.rs + (r() - 0.5) * 6) * 10) / 10 : null;
    p.ath = Math.round((54 + 30 * q + r() * 12) * 10) / 10;
    let miss = 0;
    if (i % 9 === 4 && p.avgEV != null) { p.avgEV = null; miss++; }
    if (i % 11 === 6 && p.t60 != null) { p.t60 = null; miss++; }
    if (i % 7 === 3 && p.avgFBV != null) { p.avgFBV = null; miss++; }
    if (i % 8 === 2) { if (p.maxEV != null) { p.maxEV = null; miss++; } }
    p.conf = Math.max(48, Math.min(100, Math.round(55 + 45 * r() - miss * 11)));
    p.tier = p.rs >= 88 ? 'Elite' : p.rs >= 80 ? 'High-End' : 'Target';
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
  players.sort((a, b) => b.rs - a.rs);
  players.forEach((p, i) => { p.overall = i + 1; });
  [2027, 2028, 2029, 2030].forEach((g) => players.filter((p) => p.grad === g).forEach((p, i) => { p.classRank = i + 1; }));
  const bySc = players.slice().sort((a, b) => b.pri - a.pri);
  let tcount = { 1: 0, 2: 0, 3: 0 };
  bySc.forEach((p) => {
    if (p.grad === 2027 && (p.overall % 2 === 0 || p.overall % 5 === 0)) {
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
    const elite = players.filter((p) => p.tier === 'Elite').length;
    const high = players.filter((p) => p.tier === 'High-End').length;
    const target = players.filter((p) => p.tier === 'Target').length;
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
      card('Database Health', miniTable(['Measure', 'Players'], [tr(['Elite Players', elite]), tr(['High-End Players', high]), tr(['Target Players', target])], 'Database health')) +
      card('Top Recruits', miniTable(['Category', 'Player', 'Value'], [
        '<tr><th scope="row">#1 Overall</th><td>' + cardLink(top) + '</td><td>' + num(top.rs) + '</td></tr>',
        leader('Highest Recruit Score', 'rs'), leader('Highest OPG', 'opg'), leader('Highest DPG', 'dpg'), leader('Highest PPG', 'ppg'), leader('Highest Athletic Score', 'ath')], 'Top recruits')) +
      card('Position Breakdown', miniTable(['Position', 'Players'], posCounts, 'Position breakdown')) +
      card('Class Breakdown', miniTable(['Class', 'Players'], classCounts, 'Class breakdown')) +
      card('Database Leaders', miniTable(['Leader', 'Player', 'Value'], [
        leader('Highest Recruit Score', 'rs'), leader('Highest Confidence Score', 'conf', null, false, 0), leader('Highest Avg EV', 'avgEV'), leader('Highest Max EV', 'maxEV'),
        leader('Highest Avg FBV', 'avgFBV'), leader('Highest Max FBV', 'maxFBV'), leader('Fastest 60 Time', 't60', null, true, 2),
        '<tr><th scope="row">Top Ranked Player</th><td>' + cardLink(top) + '</td><td>#1</td></tr>'], 'Database leaders')) +
      card('Confidence Snapshot', miniTable(['Level', 'Players'], [tr(['High Confidence (90%\u2013100%)', conf('High')]), tr(['Medium Confidence (60%\u201389.99%)', conf('Medium')]), tr(['Low Confidence (&lt;60%)', conf('Low')])], 'Confidence snapshot')) +
      card('Database Coverage', miniTable(['Missing Data', 'Players'], [tr(['Players Missing Avg EV', miss('avgEV')]), tr(['Players Missing Max EV', miss('maxEV')]), tr(['Players Missing Avg FBV', miss('avgFBV')]), tr(['Players Missing Max FBV', miss('maxFBV')]), tr(['Players Missing 60 Time', miss('t60')])], 'Database coverage')) +
      card('Database Updates', miniTable(['Update', 'Value'], [tr(['Newest Player Added', cardLink(newest)]), tr(['Most Recent Evaluation', latest]), tr(['Last Database Update', latest])], 'Database updates')) +
      card('Recruiting Snapshot', miniTable(['Snapshot', 'Player', 'Value'], [leader('Highest Avg EV', 'avgEV'), leader('Highest Max EV', 'maxEV'), leader('Highest Avg FBV', 'avgFBV'), leader('Highest Max FBV', 'maxFBV'), leader('Fastest 60 Time', 't60', null, true, 2)], 'Recruiting snapshot')) +
      '</div>' +
      theRead('Sample summary built from this page\u2019s fictional data: ' + db.total + ' sample players, led by ' + esc(top.name) + ' (' + top.pos + ', Class of ' + top.grad + '). The dashboard is informational \u2014 it summarizes the shared database and is not a recruiting CRM.');
  };

  pages.rankings = (root) => {
    const COLSR = [
      ['overall', 'Overall Rank', (p) => p.overall], ['classRank', 'Class Rank', (p) => p.classRank], ['name', 'Player Name', (p) => cardLink(p)],
      ['pos', 'Primary Position', (p) => p.pos], ['sec', 'Secondary Position', (p) => p.sec || '&mdash;'], ['opg', 'OPG', (p) => num(p.opg)],
      ['dpg', 'DPG', (p) => num(p.dpg)], ['ppg', 'PPG', (p) => num(p.ppg)], ['rs', 'Recruit Score', (p) => num(p.rs)], ['tier', 'Tier', (p) => p.tier],
      ['conf', 'Confidence Score', (p) => confLabel(p.conf) + ' (' + p.conf + '%)']
    ];
    const state = { key: 'overall', dir: 1 };
    root.innerHTML =
      '<form class="controls" aria-label="Filter rankings" onsubmit="return false">' +
      '<label>Search<input type="search" id="f-q" placeholder="Player name" /></label>' +
      '<label>Position<select id="f-pos"><option value="">All</option>' + POS.map((x) => '<option>' + x + '</option>').join('') + '</select></label>' +
      '<label>Class<select id="f-class"><option value="">All</option>' + [2027, 2028, 2029, 2030].map((g) => '<option>' + g + '</option>').join('') + '</select></label>' +
      '<label>Tier<select id="f-tier"><option value="">All</option><option>Elite</option><option>High-End</option><option>Target</option></select></label>' +
      '<label>Confidence<select id="f-conf"><option value="">All</option><option>High</option><option>Medium</option><option>Low</option></select></label>' +
      '</form><p class="coach-count" id="r-count" role="status"></p><div class="table-wrap"><table id="r-table"></table></div>';
    const tbl = $('#r-table', root);
    function draw() {
      const q = $('#f-q', root).value.trim().toLowerCase();
      const fp = $('#f-pos', root).value, fc = $('#f-class', root).value, ft = $('#f-tier', root).value, fq = $('#f-conf', root).value;
      let list = players.filter((p) => (!q || p.name.toLowerCase().includes(q)) && (!fp || p.pos === fp) && (!fc || String(p.grad) === fc) && (!ft || p.tier === ft) && (!fq || confLabel(p.conf) === fq));
      const k = state.key === 'conf' ? 'conf' : state.key;
      list.sort((a, b) => {
        const x = a[k], y = b[k];
        if (x == null && y == null) return 0;
        if (x == null) return 1;
        if (y == null) return -1;
        if (typeof x === 'string') return x.localeCompare(y) * state.dir;
        return (x - y) * state.dir;
      });
      $('#r-count', root).textContent = 'Showing ' + list.length + ' of ' + players.length + ' sample players';
      tbl.innerHTML = '<caption class="visually-hidden">Player rankings (fictional data)</caption><thead><tr>' + COLSR.map((c) => '<th scope="col" aria-sort="' + (state.key === c[0] ? (state.dir === 1 ? 'ascending' : 'descending') : 'none') + '"><button type="button" data-k="' + c[0] + '">' + c[1] + (state.key === c[0] ? (state.dir === 1 ? ' \u25B2' : ' \u25BC') : '') + '</button></th>').join('') + '</tr></thead><tbody>' +
        list.map((p) => '<tr>' + COLSR.map((c) => '<td>' + c[2](p) + '</td>').join('') + '</tr>').join('') + '</tbody>';
      if (!list.length) tbl.querySelector('tbody').innerHTML = '<tr><td colspan="' + COLSR.length + '">No players match these filters.</td></tr>';
    }
    root.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-k]');
      if (!b) return;
      const k = b.dataset.k;
      if (state.key === k) state.dir *= -1; else { state.key = k; state.dir = (k === 'name' || k === 'pos' || k === 'sec' || k === 'tier' || k === 'overall' || k === 'classRank') ? 1 : -1; }
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
      const stand = p.overall <= 5 ? 'Top 5 overall' : p.overall <= 15 ? 'Top 15 overall' : 'Rank ' + p.overall + ' of ' + players.length;
      $('#pc-out', root).innerHTML =
        '<div class="coach-grid">' +
        card(esc(p.name), field('Grad Year', p.grad) + field('Primary Position', p.pos) + field('Secondary Position', p.sec || '&mdash;') + field('Bats/Throws', p.bats + '/' + p.throws) + field('Height', ftin(p.ht)) + field('Weight', p.wt + ' lb') + field('GPA', p.gpa.toFixed(2)) + field('State', p.state), 'kvs') +
        card('Rankings', field('Overall Rank', '#' + p.overall) + field('Class Rank', '#' + p.classRank) + field('Athletic Score', num(p.ath)) + field('Recruit Score', num(p.rs)) + field('Confidence %', p.conf + '%') + field('Confidence Score', confLabel(p.conf)) + field('Tier', p.tier), 'kvs') +
        card('Grades', field('OPG', num(p.opg)) + field('SOPG', num(p.sopg)) + field('DPG', num(p.dpg)) + field('SDPG', num(p.sdpg)) + field('PPG', num(p.ppg)), 'kvs') +
        card('Team Evaluation', field('HC Grade', p.hc) + field('PC Grade', p.pc) + field('AC Grade', p.ac) + field('Staff Score', p.staff) + field('Coach Fit Score', p.fit) + field('Team Need Score', p.need) + field('Adjusted Recruit Score', num(p.adj)) + field('Priority Score', p.pri), 'kvs') +
        card('Measurables', field('Avg EV', num(p.avgEV) + ' mph') + field('Max EV', num(p.maxEV) + ' mph') + field('Avg FBV', num(p.avgFBV) + ' mph') + field('Max FBV', num(p.maxFBV) + ' mph') + field('Throwing Velo', num(p.tv) + ' mph') + field('60 Time', num(p.t60, 2) + ' s') + field('Pop Time', num(p.pop, 2) + ' s'), 'kvs') +
        card('Database Benchmarks', field('Avg EV vs Avg', bench('avgEV', p)) + field('Max EV vs Avg', bench('maxEV', p)) + field('Avg FBV vs Avg', bench('avgFBV', p)) + field('60 Time vs Avg', bench('t60', p, true, 2)) + field('Overall Standing', stand), 'kvs') +
        card('External Profile Links', field('PBR', 'Not linked in demo') + field('PG', 'Not linked in demo') + field('NCSA', 'Not linked in demo') + field('Fieldlevel', 'Not linked in demo') + field('Video', 'Not linked in demo'), 'kvs') +
        '</div>' +
        theRead('Sample summary for ' + esc(p.name) + ' (fictional): ' + p.tier + ' tier ' + p.pos + ' with a Recruit Score of ' + num(p.rs) + ' and ' + p.conf + '% confidence (' + confLabel(p.conf) + '). Evaluation method: ' + p.method + '. ' + esc(p.notes));
    }
    sel.addEventListener('change', () => { history.replaceState(null, '', '?id=' + sel.value); draw(); });
    draw();
  };

  pages.h2h = (root) => {
    root.innerHTML = '<form class="controls" onsubmit="return false"><label>Player A<select id="h-a"></select></label><label>Player B<select id="h-b"></select></label></form><div id="h-out"></div>';
    const a = $('#h-a', root), b = $('#h-b', root);
    playerOptions(a, players[0].id);
    playerOptions(b, players[1].id);
    const ROWS = {
      'Player': [['Player Name', 'name'], ['Primary Position', 'pos'], ['Secondary Position', 'sec'], ['Grad Year', 'grad', null, (v) => String(v)], ['Height', 'ht', null, (v) => ftin(v)], ['Weight', 'wt', null, (v) => v + ' lb'], ['GPA', 'gpa', null, (v) => v.toFixed(2)]],
      'Rankings': [['Overall Rank', 'overall', 'low', (v) => '#' + v], ['Class Rank', 'classRank', 'low', (v) => '#' + v], ['Athletic Score', 'ath', 'high'], ['Recruit Score', 'rs', 'high'], ['Confidence %', 'conf', 'high', (v) => v + '%'], ['Confidence Score', 'conf', null, (v) => confLabel(v)], ['Tier', 'tier']],
      'Grades': [['OPG', 'opg', 'high'], ['SOPG', 'sopg', 'high'], ['DPG', 'dpg', 'high'], ['SDPG', 'sdpg', 'high'], ['PPG', 'ppg', 'high']],
      'Measurables': [['Avg EV', 'avgEV', 'high'], ['Max EV', 'maxEV', 'high'], ['Avg FBV', 'avgFBV', 'high'], ['Max FBV', 'maxFBV', 'high'], ['Throwing Velo', 'tv', 'high'], ['60 Time', 't60', 'low', (v) => v.toFixed(2)], ['Pop Time', 'pop', 'low', (v) => v.toFixed(2)]],
      'Team Evaluation': [['HC Grade', 'hc', 'grade'], ['PC Grade', 'pc', 'grade'], ['AC Grade', 'ac', 'grade'], ['Staff Score', 'staff', 'high'], ['Coach Fit Score', 'fit', 'high'], ['Team Need Score', 'need', 'high'], ['Adjusted Recruit Score', 'adj', 'high'], ['Priority Score', 'pri', 'high']]
    };
    const show = (def, p) => { const v = p[def[1]]; if (v == null || v === '') return '&mdash;'; return def[3] ? def[3](v) : (typeof v === 'number' ? num(v) : esc(v)); };
    function edge(def, pa, pb) {
      const x = pa[def[1]], y = pb[def[1]];
      if (!def[2] || x == null || y == null) return '<span class="adv-even">&mdash;</span>';
      let cmp;
      if (def[2] === 'grade') cmp = GRADES.indexOf(x) - GRADES.indexOf(y);
      else cmp = def[2] === 'low' ? y - x : x - y;
      if (Math.abs(cmp) < 1e-9) return '<span class="adv-even">Even</span>';
      return cmp > 0 ? '<span class="adv-a">\u25C0 A</span>' : '<span class="adv-b">B \u25B6</span>';
    }
    function draw() {
      const pa = byId[a.value], pb = byId[b.value];
      let html = '<div class="h2h-head"><div class="h2h-p">Player A<strong>' + esc(pa.name) + '</strong></div><div class="h2h-mid">H2H</div><div class="h2h-p">Player B<strong>' + esc(pb.name) + '</strong></div></div>';
      Object.keys(ROWS).forEach((sec) => {
        html += '<div class="table-wrap"><table class="h2h-table"><caption>' + sec + '</caption><thead><tr><th scope="col">Player A</th><th scope="col">Measure</th><th scope="col">Advantage</th><th scope="col">Player B</th></tr></thead><tbody>' +
          ROWS[sec].map((d) => '<tr><td>' + show(d, pa) + '</td><th scope="row">' + d[0] + '</th><td class="adv-cell">' + edge(d, pa, pb) + '</td><td>' + show(d, pb) + '</td></tr>').join('') + '</tbody></table></div>';
      });
      const ba = (k, low) => { const x = pa[k], y = pb[k]; if (x == null || y == null) return 'n/a'; const d = x - y; return (d > 0 ? '+' : '') + d.toFixed(low ? 2 : 1); };
      html += theRead('Sample comparison (fictional): Recruit Score difference A\u2212B is ' + ba('rs') + '; Priority Score difference is ' + (pa.pri - pb.pri > 0 ? '+' : '') + (pa.pri - pb.pri) + '. Team Edge uses the team-specific rows above.');
      $('#h-out', root).innerHTML = html;
    }
    root.addEventListener('change', draw);
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
    const top = players.filter((p) => !p.committed).sort((a, b) => b.fit - a.fit).slice(0, 10);
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
      const list = board.filter((p) => (!ft || String(p.board) === ft) && (!fp || p.pos === fp)).sort((a, b) => a.board - b.board || b.pri - a.pri);
      $('#b-table', root).innerHTML = '<caption class="visually-hidden">Recruiting board (fictional data)</caption><thead><tr>' + ['Priority Tier', 'Player Name', 'Primary Position', 'Secondary Position', 'Class', 'State', 'Athletic Score', 'Recruit Score', 'Adjusted Recruit Score', 'Priority Score', 'Confidence Score', 'Evaluation Method', 'Player Notes'].map((h) => '<th scope="col">' + h + '</th>').join('') + '</tr></thead><tbody>' +
        list.map((p) => '<tr><td><span class="pill pill-t' + p.board + '">' + tierName[p.board] + '</span></td><td>' + cardLink(p) + '</td><td>' + p.pos + '</td><td>' + (p.sec || '&mdash;') + '</td><td>' + p.grad + '</td><td>' + p.state + '</td><td>' + num(p.ath) + '</td><td>' + num(p.rs) + '</td><td>' + num(p.adj) + '</td><td>' + p.pri + '</td><td>' + confLabel(p.conf) + '</td><td>' + p.method + '</td><td>' + esc(p.notes) + '</td></tr>').join('') + '</tbody>';
    }
    root.addEventListener('change', draw);
    draw();
  };

  function schoolStats() {
    const m = groupBy(players.filter((p) => p.committed), 'committed');
    return Object.keys(m).map((s) => ({ school: s, n: m[s].length, rs: avgOf('rs', m[s]), opg: avgOf('opg', m[s]), dpg: avgOf('dpg', m[s]), ppg: avgOf('ppg', m[s]), elite: m[s].filter((p) => p.tier === 'Elite').length })).sort((a, b) => b.rs - a.rs);
  }
  const schoolRows = (list) => list.map((s, i) => '<tr><th scope="row">#' + (i + 1) + ' School</th><td>' + esc(s.school) + '</td><td>' + s.n + '</td><td>' + num(s.rs) + '</td></tr>');

  pages.commitments = (root) => {
    const list = players.filter((p) => p.committed).sort((a, b) => b.rs - a.rs);
    const schools = schoolStats();
    const posRows = POS.map((x) => tr([x, list.filter((p) => p.pos === x).length]));
    root.innerHTML =
      '<div class="kpi-row">' + kpi('Total Commitments', list.length) + kpi('Avg Recruit Score', num(avgOf('rs', list))) + kpi('Avg Adjusted Recruit Score', num(avgOf('adj', list))) + kpi('Highest Recruit Score', num(best('rs', list).rs)) + '</div>' +
      '<div class="table-wrap"><table><caption class="visually-hidden">Commitments (fictional data)</caption><thead><tr>' + ['Player Name', 'Primary Position', 'Secondary Position', 'Class', 'State', 'Athletic Score', 'Recruit Score', 'Adjusted Recruit Score', 'Confidence Score', 'Committed School', 'Commitment Date', 'Evaluation Method', 'Player Notes'].map((h) => '<th scope="col">' + h + '</th>').join('') + '</tr></thead><tbody>' +
      list.map((p) => '<tr><td>' + cardLink(p) + '</td><td>' + p.pos + '</td><td>' + (p.sec || '&mdash;') + '</td><td>' + p.grad + '</td><td>' + p.state + '</td><td>' + num(p.ath) + '</td><td>' + num(p.rs) + '</td><td>' + num(p.adj) + '</td><td>' + confLabel(p.conf) + '</td><td>' + esc(p.committed) + '</td><td>' + p.commitDate + '</td><td>' + p.method + '</td><td>' + esc(p.notes) + '</td></tr>').join('') + '</tbody></table></div>' +
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
      '<div class="kpi-row">' + kpi('Total Players', db.total) + kpi('Avg Recruit Score', num(db.avgRS)) + kpi('Avg Confidence %', num(db.avgConf) + '%') + kpi('Elite Players', players.filter((p) => p.tier === 'Elite').length) + kpi('High-End Players', players.filter((p) => p.tier === 'High-End').length) + kpi('Target Players', players.filter((p) => p.tier === 'Target').length) + '</div>' +
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
    const stats = Object.keys(gs).map((s) => { const l = gs[s]; return { state: s, n: l.length, elite: l.filter((p) => p.tier === 'Elite').length, high: l.filter((p) => p.tier === 'High-End').length, rs: avgOf('rs', l), opg: avgOf('opg', l), dpg: avgOf('dpg', l), ppg: avgOf('ppg', l), l: l }; });
    const rank = (k, list, title) => card(title, miniTable(['Rank', 'State', 'Value', 'Players'], list.filter((s) => s[k] != null).sort((a, b) => b[k] - a[k]).map((s, i) => '<tr><th scope="row">#' + (i + 1) + ' State</th><td>' + s.state + '</td><td>' + (Number.isInteger(s[k]) ? s[k] : num(s[k])) + '</td><td>' + s.n + '</td></tr>'), title));
    const sch = schoolStats();
    const schRank = (k, title) => card(title, miniTable(['Rank', 'School', 'Value'], sch.filter((s) => s[k] != null).slice().sort((a, b) => b[k] - a[k]).map((s, i) => '<tr><th scope="row">#' + (i + 1) + ' School</th><td>' + esc(s.school) + '</td><td>' + num(s[k]) + '</td></tr>'), title));
    const bestState = (x) => { const c = stats.map((s) => ({ s: s.state, v: avgOf('rs', s.l.filter((p) => p.pos === x)) })).filter((q) => q.v != null).sort((a, b) => b.v - a.v)[0]; return c ? c.s + ' (' + num(c.v) + ')' : '&mdash;'; };
    const top = (k) => { const c = stats.filter((s) => s[k] != null).sort((a, b) => b[k] - a[k])[0]; return c ? c.state + ' (' + (Number.isInteger(c[k]) ? c[k] : num(c[k])) + ')' : '&mdash;'; };
    root.innerHTML =
      '<div class="coach-grid">' +
      rank('rs', stats, 'State Rankings By Avg Recruit Score') + rank('opg', stats, 'State Rankings By Avg OPG') + rank('dpg', stats, 'State Rankings By Avg DPG') + rank('ppg', stats, 'State Rankings By Avg PPG') +
      rank('elite', stats, 'States With The Most Elite Players') +
      schRank('rs', 'College Rankings By Avg Recruit Score') + schRank('opg', 'College Rankings By Avg OPG') + schRank('dpg', 'College Rankings By Avg DPG') + schRank('ppg', 'College Rankings By Avg PPG') +
      card('Regional Position Leaders By Avg Recruit Score', miniTable(['Best State For', 'State (Avg Recruit Score)'], POS.filter((x) => x !== 'P').map((x) => tr([x, bestState(x)])).concat([tr(['P', bestState('P')])]), 'Regional position leaders')) +
      card('Talent Concentration', miniTable(['Measure', 'State (Value)'], [tr(['Most Players', top('n')]), tr(['Most Elite Players', top('elite')]), tr(['Most High-End Players', top('high')]), tr(['Highest Avg Recruit Score', top('rs')]), tr(['Highest Avg OPG', top('opg')]), tr(['Highest Avg DPG', top('dpg')]), tr(['Highest Avg PPG', top('ppg')])], 'Talent concentration')) +
      '</div>' + theRead('Regional views show where talent concentrates in the fictional sample. College rankings use the average of each school\u2019s fictional commits.');
  };


  pages.department = (root) => {
    const board = players.filter((p) => !p.committed);
    const rows = COACHES.map((c) => {
      const mine = board.filter((p) => p.coach === c.id);
      const topP = mine.slice().sort((a, b) => b.pri - a.pri)[0];
      return '<tr><th scope="row">' + esc(c.name) + '</th><td>' + c.role + '</td><td>Baseball</td><td>' + mine.filter((p) => p.board === 1).length + '</td><td>' + mine.filter((p) => p.board === 2).length + '</td><td>' + mine.filter((p) => p.board === 3).length + '</td><td>' + (topP ? cardLink(topP) : '&mdash;') + '</td></tr>';
    });
    const targets = board.filter((p) => p.board <= 2).sort((a, b) => a.board - b.board || b.pri - a.pri).slice(0, 16);
    const events = [
      ['2026-11-07', 'Fictional Fall Showcase', 'A', 'Evaluate Priority 1 pitchers', 'Home'],
      ['2026-11-21', 'Fictional Regional Tournament', 'B', 'Verify metrics on infield targets', 'Away'],
      ['2026-12-05', 'Fictional Winter Camp', 'C', 'Pitching bullpens', 'Home'],
      ['2027-01-16', 'Fictional Indoor Showcase', 'D', 'Check Priority 2 follow-ups', 'Away'],
      ['2027-02-13', 'Campus Visit Day', 'A', 'Official visits for Priority 1 targets', 'Home'],
      ['2027-03-06', 'Fictional Spring Classic', 'B', 'Live looks at outfield targets', 'Away']
    ];
    const needsRows = [
      ['Baseball', 14, players.filter((p) => p.committed === OUR).length, 'Pitcher, Catcher, Defense'],
      ['Softball (Sample)', 12, 5, 'Middle Infield, Power'],
      ['Men\u2019s Basketball (Sample)', 5, 2, 'Guard Depth']
    ];
    root.innerHTML =
      '<div class="link-banner card"><div><h2>Also Coach? Open The Coach Workspace</h2><p>Athletic directors who coach \u2014 or want visibility into recruiting \u2014 can use the same fictional coach workspace: rankings, player cards, recruiting board, team needs, and more.</p></div><a class="button button-primary" href="coach-dashboard.html">Open Coach Workspace</a></div>' +
      '<div class="coach-grid">' +
      card('Coaches And Their Recruiting', miniTable(['Coach', 'Role', 'Sport', 'Priority 1', 'Priority 2', 'Priority 3', 'Top Target'], rows, 'Coaches and recruiting'), 'wide') +
      card('Who Is Recruiting Whom', miniTable(['Player', 'Pos', 'Class', 'Tier', 'Recruiting Coach', 'Next Step'], targets.map((p) => '<tr><td>' + cardLink(p) + '</td><td>' + p.pos + '</td><td>' + p.grad + '</td><td><span class="pill pill-t' + p.board + '">Priority ' + p.board + '</span></td><td>' + esc(COACHES.filter((c) => c.id === p.coach)[0].name) + '</td><td>' + p.action + '</td></tr>'), 'Who is recruiting whom'), 'wide') +
      card('Recruiting Schedule', miniTable(['Date', 'Event', 'Coach', 'Focus', 'Home/Away'], events.map((e) => '<tr><td>' + e[0] + '</td><td>' + e[1] + '</td><td>' + esc(COACHES.filter((c) => c.id === e[2])[0].name) + '</td><td>' + e[3] + '</td><td>' + e[4] + '</td></tr>'), 'Recruiting schedule') + '<p class="coach-note">Sample dates only. Always confirm contact and dead periods against the official NCAA/NAIA calendar.</p>', 'wide') +
      card('Program Needs By Sport', miniTable(['Sport', 'Target Class Size', 'Committed', 'Open Spots', 'Top Needs'], needsRows.map((n) => '<tr><th scope="row">' + n[0] + '</th><td>' + n[1] + '</td><td>' + n[2] + '</td><td>' + (n[1] - n[2]) + '</td><td>' + n[3] + '</td></tr>'), 'Program needs by sport'), 'wide') +
      '</div>' + theRead('Department view (fictional): the athletic department sees which coaches are recruiting whom, the recruiting schedule, and program needs. Each coach\u2019s private notes stay private.');
  };

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('coach-app');
    const page = document.body.dataset.coachPage;
    if (root && pages[page]) {
      try { pages[page](root); } catch (e) { root.innerHTML = '<p class="coach-note">This preview could not load. Please refresh the page.</p>'; if (window.console) console.error(e); }
    }
  });
})();
