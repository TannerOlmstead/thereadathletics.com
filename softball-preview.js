/* PROVISIONAL Softball Preview. Visual and functional preview only; nothing here is final or approved.
   All players, measurements and grades are fictional fixture data displayed as supplied. No softball benchmark
   tables, weights or composite formulas exist here. Intended future structure (not implemented):
   raw measurement -> benchmark table -> metric grade -> position-specific linear weights -> OPG/SOPG/DPG/SDPG/PPG.
   Positions are shown exactly as supplied (including LF and SS/CF); the baseball position rules and validation are not changed. */
(function (root) {
  'use strict';
  var STATUS = 'Provisional - Softball Preview - fictional sample data - model under review';
  var COLUMNS = [
    ['name', 'Player'], ['pos', 'Position'], ['badges', 'Badges'], ['style', 'Style'], ['height', 'Height'],
    ['maxEv', 'Max EV (mph)'], ['batSpeed', 'Bat Speed (mph)'],
    ['h2f', 'Home-to-First (sec)'],
    ['throwVelo', 'Throwing Velo (mph)'],
    ['pop', 'Pop Time (sec)'],
    ['avgFbv', 'Avg FBV (mph)'], ['maxFbv', 'Max FBV (mph)'],
    ['opg', 'OPG'], ['sopg', 'SOPG'], ['dpg', 'DPG'], ['sdpg', 'SDPG'], ['ppg', 'PPG']
  ];
  var GRADE_KEYS = ['opg', 'sopg', 'dpg', 'sdpg', 'ppg'];
  var GRADE_ORDER = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];
  var N = null;
  function P(name, pos, badges, style, height, maxEv, batSpeed, h2f, throwVelo, pop, avgFbv, maxFbv, opg, sopg, dpg, sdpg, ppg) {
    return { name: name, pos: pos, badges: badges, style: style, height: height, maxEv: maxEv, batSpeed: batSpeed, h2f: h2f, throwVelo: throwVelo, pop: pop, avgFbv: avgFbv, maxFbv: maxFbv, opg: opg, sopg: sopg, dpg: dpg, sdpg: sdpg, ppg: ppg };
  }
  var PLAYERS = [
    P('Ava Morgan', 'P', [], 'Standard', '5\'11"', N, N, N, N, N, 66, 70, N, N, N, N, 'A'),
    P('Harper Collins', 'C', [], 'Power', '5\'9"', 81, 72, 2.78, 74, 1.74, N, N, 'A-', N, 'A', N, N),
    P('Madison Lewis', 'SS/CF', ['Utility'], 'Standard', '5\'7"', 82, 73, 2.58, 76, N, N, N, 'A', 'A', 'A-', 'A', N),
    P('Mia Reynolds', 'P/2B', ['Two-Way', 'Utility'], 'Slapper', '5\'6"', 70, 65, 2.52, 66, N, 60, 64, N, 'B+', N, 'B', 'B'),
    P('Sophia Turner', '2B', [], 'Standard', '5\'4"', 69, 61, 2.96, 63, N, N, N, 'B-', N, 'B-', N, N),
    P('Lily Anderson', 'LF', [], 'Standard', '5\'8"', 63, 55, 3.18, 57, N, N, N, 'C+', N, 'C+', N, N),
    P('Brooke Davis', '1B', [], 'Power', '5\'10"', 59, 52, 3.31, 54, N, N, N, 'C-', N, 'C-', N, N)
  ];

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function has(v) { return v !== null && v !== undefined && v !== ''; }
  function cell(v) { return has(v) ? String(v) : '-'; }
  function num(v, d) { return has(v) ? Number(v).toFixed(d) : '-'; }
  function gradeBand(g) { var c = g.charAt(0); return c === 'A' ? 'green' : c === 'B' ? 'navy' : 'amber'; }
  function gradeHtml(g) { return has(g) ? '<span class="grade-letter" title="Fixture grade (provisional)">' + esc(g) + '</span>' : '-'; }
  function badgeHtml(list) {
    if (!list.length) return '-';
    return list.map(function (b) { return '<span class="pill ' + (b === 'Two-Way' ? 'red' : 'navy') + ' sp-badge" data-badge="' + esc(b) + '">' + esc(b) + '</span>'; }).join(' ');
  }
  function heightInches(h) { var m = /^(\d+)'(\d+)"?$/.exec(h || ''); return m ? Number(m[1]) * 12 + Number(m[2]) : null; }
  function sortValue(p, k) {
    if (k === 'height') return heightInches(p.height);
    if (GRADE_KEYS.indexOf(k) >= 0) return has(p[k]) ? -GRADE_ORDER.indexOf(p[k]) : null;
    if (k === 'badges') return p.badges.length ? p.badges.join(', ') : null;
    return has(p[k]) ? p[k] : null;
  }
  function sorted(list, key, dir) {
    if (!key) return list.slice();
    return list.slice().sort(function (a, b) {
      var x = sortValue(a, key), y = sortValue(b, key);
      if (x === null && y === null) return 0;
      if (x === null) return 1;
      if (y === null) return -1;
      return (x < y ? -1 : x > y ? 1 : 0) * dir;
    });
  }
  function rowHtml(p) {
    return '<tr><th scope="row">' + esc(p.name) + '</th><td>' + esc(p.pos) + '</td><td>' + badgeHtml(p.badges) + '</td><td>' + esc(p.style) + '</td><td>' + esc(cell(p.height)) +
      '</td><td>' + num(p.maxEv, 0) + '</td><td>' + num(p.batSpeed, 0) + '</td><td>' + num(p.h2f, 2) + '</td><td>' + num(p.throwVelo, 0) + '</td><td>' + num(p.pop, 2) +
      '</td><td>' + num(p.avgFbv, 0) + '</td><td>' + num(p.maxFbv, 0) + '</td>' + GRADE_KEYS.map(function (k) { return '<td>' + gradeHtml(p[k]) + '</td>'; }).join('') + '</tr>';
  }
  function tableHtml(key, dir) {
    var head = COLUMNS.map(function (c) {
      var on = key === c[0];
      return '<th scope="col" aria-sort="' + (on ? (dir === 1 ? 'ascending' : 'descending') : 'none') + '"><button type="button" class="sp-sort" data-sk="' + c[0] + '">' + esc(c[1]) + '</button></th>';
    }).join('');
    return '<div class="table-wrap"><table class="data-table sp-table"><caption class="visually-hidden">Softball preview master database (provisional, fictional sample data)</caption><thead><tr>' + head + '</tr></thead><tbody>' +
      sorted(PLAYERS, key, dir).map(rowHtml).join('') + '</tbody></table></div>';
  }

  var api = { STATUS: STATUS, COLUMNS: COLUMNS, PLAYERS: PLAYERS, GRADE_KEYS: GRADE_KEYS, tableHtml: tableHtml };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.TheReadSoftballPreview = api;

  var host = root.document && root.document.getElementById('softball-preview');
  if (!host) return;
  var st = { key: null, dir: 1 };
  function draw() { host.innerHTML = tableHtml(st.key, st.dir); }
  host.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.sp-sort') : null;
    if (!b) return;
    var k = b.getAttribute('data-sk');
    if (st.key === k) st.dir *= -1; else { st.key = k; st.dir = 1; }
    draw();
    var again = host.querySelector('.sp-sort[data-sk="' + k + '"]'); if (again) again.focus();
  });
  draw();
})(typeof window !== 'undefined' ? window : this);
