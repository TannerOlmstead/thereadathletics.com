/* Lineup and Depth Chart preview tests. Run: JSDOM_PATH=... node lineup-depth.tests.js (page checks skip when jsdom is missing). */
const assert = require('assert'), fs = require('fs'), path = require('path'), http = require('http');
const L = require('./lineup-depth.js');
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('ok - ' + name); };
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const P = (id, pos, o) => Object.assign({ id, name: id, pos, sec: '', grad: 2028, twoWay: false }, o || {});

ok('stored positions stay P,C,1B,2B,3B,SS,OF; LF/CF/RF are display slots only', () => {
  assert.deepStrictEqual(L.STORED_POSITIONS, ['P', 'C', '1B', '2B', '3B', 'SS', 'OF']);
  assert.deepStrictEqual(L.OF_SLOTS, ['LF', 'CF', 'RF']);
  ['LF', 'CF', 'RF'].forEach((s) => { assert.strictEqual(L.slotStored(s), 'OF'); assert.ok(L.SLOTS.indexOf(s) >= 0); });
  ['DH', 'UT'].forEach((s) => assert.ok(L.SLOTS.indexOf(s) < 0 && L.STORED_POSITIONS.indexOf(s) < 0));
  assert.ok(L.slotFit('CF', P('a', 'OF')).ok && L.slotFit('LF', P('a', 'OF')).ok && L.slotFit('RF', P('a', 'OF')).ok);
  assert.ok(!L.slotFit('CF', P('a', 'SS')).ok);
  assert.ok(L.slotFit('P', P('a', '1B', { twoWay: true })).ok);
});
ok('place, swap and displace', () => {
  let b = L.makeBoard({ A: 2, B: 1 }, true);
  let r = L.place(b, 'x', 'A', 0); assert.ok(r.ok); b = r.board; assert.strictEqual(b.groups.A[0], 'x');
  r = L.place(b, 'y', 'A', 1); b = r.board;
  r = L.place(b, 'x', 'A', 1, { group: 'A', idx: 0 }); assert.ok(r.swapped); assert.deepStrictEqual(r.board.groups.A, ['y', 'x']);
  r = L.place(b, 'z', 'A', 0); assert.strictEqual(r.board.groups.A[0], 'z'); assert.ok(!L.placed(r.board).x || L.placed(r.board).x);
  assert.strictEqual(b.groups.A[0], 'x', 'input board is not mutated');
  assert.ok(!L.place(b, 'x', 'Q', 0).ok);
  assert.strictEqual(L.removeAt(b, 'A', 0).groups.A[0], null);
});
ok('exclusive boards keep a player in one slot; depth boards allow one slot per group (a re-place moves)', () => {
  let b = L.makeBoard({ A: 1, B: 1 }, true), r = L.place(b, 'x', 'A', 0); r = L.place(r.board, 'x', 'B', 0);
  assert.strictEqual(r.board.groups.A[0], null); assert.strictEqual(r.board.groups.B[0], 'x');
  let d = L.makeBoard({ A: 2, B: 1 }, false); d = L.place(d, 'x', 'A', 0).board; d = L.place(d, 'x', 'B', 0).board;
  assert.strictEqual(d.groups.A[0], 'x'); assert.strictEqual(d.groups.B[0], 'x');
  const mv = L.place(d, 'x', 'A', 1); assert.ok(mv.ok && mv.board.groups.A[0] === null && mv.board.groups.A[1] === 'x', 'same-group placement moves, never duplicates');
  assert.strictEqual(Object.keys(L.placed(mv.board)).length, 1);
});
ok('lineups: 4-page cap, duplicate, delete keeps one, clear', () => {
  let st = L.newLineupState(); assert.strictEqual(st.lineups.length, 1);
  for (let i = 0; i < 3; i++) { const r = L.addLineup(st); assert.ok(r.ok); st = r.state; }
  assert.strictEqual(st.lineups.length, 4);
  assert.ok(!L.addLineup(st).ok); assert.ok(!L.duplicateLineup(st, 0).ok);
  assert.strictEqual(L.CONFIG.maxLineups, 4);
  const one = L.newLineupState(); assert.ok(!L.removeLineup(one, 0).ok);
  const d = L.removeLineup(st, 1); assert.ok(d.ok); assert.strictEqual(d.state.lineups.length, 3);
  const dd = L.duplicateLineup(L.newLineupState(), 0); assert.ok(dd.ok); assert.strictEqual(dd.state.lineups.length, 2);
  const cl = L.clearLineup(L.newLineup ? st.lineups[0] : st.lineups[0]); assert.strictEqual(Object.keys(L.placed(cl.bat)).length, 0);
  assert.strictEqual(L.newLineupState().lineups[0].bat.groups.BAT.length, 9);
});
ok('depth chart: 2-4 year range, defaults and season start', () => {
  assert.strictEqual(L.clampYears(1), 2); assert.strictEqual(L.clampYears(9), 4); assert.strictEqual(L.clampYears(3), 3); assert.strictEqual(L.clampYears(undefined), 4);
  assert.strictEqual(L.firstSeason(new Date(2026, 2, 1)), 2026); assert.strictEqual(L.firstSeason(new Date(2026, 8, 1)), 2027);
  let d = L.newDepthState(new Date(2026, 8, 1)); assert.deepStrictEqual(L.depthYears(d), [2027, 2028, 2029, 2030]);
  d = L.setYears(d, 2); assert.deepStrictEqual(L.depthYears(d), [2027, 2028]);
  assert.strictEqual(L.depthYears(L.setYears(d, 3)).length, 3);
  assert.ok(L.yearNote({ grad: 2027 }, 2029) && !L.yearNote({ grad: 2030 }, 2029));
  assert.strictEqual(d.boards[2027].groups.P.length, L.CONFIG.depthSlots.P);
});
ok('sanitize drops unknown ids and garbage', () => {
  assert.strictEqual(L.sanitizeLineups('junk', []).lineups.length, 1);
  const st = L.newLineupState(); st.lineups[0].bat.groups.BAT[0] = 'gone'; st.lineups[0].bat.groups.BAT[1] = 'keep';
  const s = L.sanitizeLineups(JSON.parse(JSON.stringify(st)), ['keep']); assert.strictEqual(s.lineups[0].bat.groups.BAT[0], null); assert.strictEqual(s.lineups[0].bat.groups.BAT[1], 'keep');
  assert.strictEqual(L.sanitizeDepth(null, []).count, 4);
});
const csv = 'Name,Position,Grad Year\nAl One,SS,2028\nBo Two,CF,2029\nCy Three,DH,2027\nDi Four,UT,2027\n,P,2027\nEd Five,OF,abc\nAl One,SS,2028\nFy Six,C,2028\n';
ok('CSV: valid rows ok; LF/CF/RF review with OF suggestion; DH/UT flagged without suggestion; errors; duplicates', () => {
  const pv = L.importPreview(csv, [P('E1', 'C', { name: 'Fy Six', grad: 2028 })]), by = {}; pv.rows.forEach((r) => { by[r.line] = r; });
  assert.strictEqual(by[2].status, 'ok'); assert.strictEqual(by[3].status, 'review'); assert.strictEqual(by[3].suggestion, 'OF');
  assert.strictEqual(by[4].status, 'review'); assert.strictEqual(by[4].suggestion, ''); assert.strictEqual(by[5].status, 'review'); assert.strictEqual(by[5].suggestion, '');
  assert.strictEqual(by[6].status, 'error'); assert.strictEqual(by[7].status, 'error');
  assert.strictEqual(by[8].dupe, 'file'); assert.strictEqual(by[9].dupe, 'roster');
});
ok('CSV: missing columns, empty file, header only, row limit, quotes and BOM', () => {
  assert.ok(L.importPreview('Name,Grad Year\nA,2028', []).fileErrors.length);
  assert.ok(L.importPreview('', []).fileErrors.length); assert.ok(L.importPreview('Name,Position,Grad Year', []).fileErrors.length);
  assert.ok(L.importPreview('Name,Position,Grad Year\n' + new Array(202).join('A,P,2028\n'), []).fileErrors.length);
  const q = L.importPreview('\uFEFFName,Position,Grad Year\r\n"Doe, Jo",P,2028\r\n', []); assert.strictEqual(q.rows[0].name, 'Doe, Jo'); assert.strictEqual(q.rows[0].status, 'ok');
});
ok('commitImport requires review, never adds errors, never converts silently, never modifies existing', () => {
  const pv = L.importPreview(csv, [P('E1', 'C', { name: 'Fy Six', grad: 2028 })]);
  assert.throws(() => L.commitImport(pv, {}, false, []));
  assert.throws(() => L.commitImport(pv, {}, undefined, []));
  let r = L.commitImport(pv, {}, true, ['IMP-001']);
  assert.deepStrictEqual(r.added.map((p) => p.name), ['Al One']); assert.strictEqual(r.added[0].id, 'IMP-002');
  r = L.commitImport(pv, { 3: { action: 'add', pos: 'OF' }, 4: { action: 'add', pos: 'DH' }, 5: { action: 'add' }, 6: { action: 'add', pos: 'P' } }, true, []);
  const names = r.added.map((p) => p.name + ':' + p.pos);
  assert.ok(names.indexOf('Bo Two:OF') >= 0); assert.ok(!names.some((x) => /Cy|Di|Ed/.test(x)), 'DH/UT/error rows never added');
  r.added.forEach((p) => assert.ok(L.STORED_POSITIONS.indexOf(p.pos) >= 0));
});
ok('lineup-depth.js has no storage, network or global side effects', () => {
  const s = read('lineup-depth.js'); assert.ok(!/localStorage|sessionStorage|XMLHttpRequest|fetch\(|WebSocket|sendBeacon/.test(s));
});
ok('LF/CF/RF exception is scoped: absent from config, validation and other pages', () => {
  const cfg = read('sports-config.js'); assert.ok(!/\b(LF|CF|RF)\b/.test(cfg), 'sports-config.js has no LF/CF/RF');
  const as = read('athlete-signup.js'); assert.ok(!/PREF_POS\s*=\s*\[[^\]]*\b(LF|CF|RF)\b/.test(as));
  fs.readdirSync(__dirname).filter((f) => /\.(js|html)$/.test(f) && !/lineup|depth|tests?\.|softball/.test(f) && !/^coach\.js$/.test(f)).forEach((f) => {
    assert.ok(!/TheReadLineup/.test(read(f)), f + ' must not use the lineup module');
  });
  assert.ok(!/TheReadLineup\b(?!UI)/.test(read('coach.js')) && /POSNUM = \{ P: 1, C: 2, '1B': 3, '2B': 4, '3B': 5, SS: 6, OF: 7 \}/.test(read('coach.js')), 'coach.js position order and validation stay OF-only');
  const bm = read('benchmarks-config.js'); assert.ok(!/TheReadLineup/.test(bm));
  assert.ok(!/\b(LF|CF|RF)\b/.test(read('coach-master-database.html')));
});
ok('exception and docs stay out of the handoff and bridge files; no pricing or A++', () => {
  const dir = __dirname; ['COPILOT_HANDOFF.md'].forEach((f) => { if (fs.existsSync(path.join(dir, f))) assert.ok(!/Lineup|Depth Chart/i.test(read(f)), f); });
  ['lineup-depth.js', 'lineup-depth-ui.js', 'coach-lineup.html', 'coach-depth-chart.html'].forEach((f) => { const s = read(f); assert.ok(!/A\+\+|founding rate|\$\d+\s*\/\s*(mo|month|yr)/i.test(s), f); });
  assert.ok(fs.existsSync(path.join(dir, 'docs', 'LINEUP_DEPTH_CHART_BACKEND_REQUIREMENTS.md')));
  assert.ok(/User-approved scoped exception/i.test(read('docs/LINEUP_DEPTH_CHART_BACKEND_REQUIREMENTS.md')));
  assert.ok(/User-approved scoped exception/i.test(read('README.md')));
});

/* ---- Page checks (jsdom over http; server in this process is fine: no sync XHR on these pages) ---- */
(async () => {
  let jsdom; try { jsdom = require(process.env.JSDOM_PATH || 'jsdom'); } catch (e) { console.log('SKIPPED page-level lineup checks: jsdom not installed'); return done(); }
  const { JSDOM, VirtualConsole } = jsdom;
  const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };
  const srv = http.createServer((q, s) => { const f = path.join(__dirname, decodeURIComponent(q.url.split('?')[0]).replace(/^\//, '')); fs.readFile(f, (e, d) => { if (e) { s.statusCode = 404; return s.end(); } s.setHeader('Content-Type', types[path.extname(f)] || 'text/plain'); s.end(d); }); });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + srv.address().port;
  const open = (u) => JSDOM.fromURL(base + u, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: new VirtualConsole() }).then((d) => new Promise((r) => setTimeout(() => r(d), 1200)));
  try {
    const d = await open('/coach-lineup.html?demo=1'), w = d.window, q = (s) => w.document.querySelectorAll(s);
    assert.ok(q('.coach-subnav a[href="coach-lineup.html"][aria-current="page"]').length && q('.coach-subnav a[href="coach-depth-chart.html"]').length, 'nav links');
    assert.strictEqual(q('.ld-tab').length, 1); assert.strictEqual(q('.ld-slot[data-kind="bat"]').length, 9); assert.strictEqual(q('.ld-slot[data-kind="field"]').length, 9);
    ['LF', 'CF', 'RF'].forEach((s) => assert.ok(q('.ld-slot[data-kind="field"][data-g="' + s + '"]').length === 1, s));
    assert.ok(q('.ld-sel option').length > 20, 'roster options come from sample players');
    const sel = q('select.ld-sel[data-kind="field"][data-g="CF"]')[0], opt = Array.from(sel.options).find((o) => o.value && /\(OF,/.test(o.textContent));
    assert.ok(opt, 'an OF sample player exists'); sel.value = opt.value; sel.dispatchEvent(new w.Event('change', { bubbles: true }));
    const tag = w.document.querySelector('.ld-slot[data-g="CF"] .ld-tag'); assert.ok(tag, 'placed via keyboard select'); assert.strictEqual(tag.querySelector('.pill').textContent, 'OF'); assert.ok(!/\bCF\b/.test(tag.textContent), 'tag keeps stored position OF');
    assert.ok(/placed in CF/.test(w.document.getElementById('ld-live').textContent), 'aria-live announcement');
    w.document.getElementById('lu-add').click(); assert.strictEqual(q('.ld-tab').length, 2);
    w.document.getElementById('lu-add').click(); w.document.getElementById('lu-add').click(); assert.strictEqual(q('.ld-tab').length, 4); assert.ok(w.document.getElementById('lu-add').disabled, 'cap at 4');
    const d2 = await open('/coach-depth-chart.html?demo=1'), w2 = d2.window;
    assert.strictEqual(w2.document.querySelectorAll('.ld-tab').length, 4); w2.document.getElementById('dp-years').value = '2'; w2.document.getElementById('dp-years').dispatchEvent(new w2.Event('change', { bubbles: true }));
    assert.strictEqual(w2.document.querySelectorAll('.ld-tab').length, 2);
    assert.ok(w2.document.querySelector('.ld-open'), 'open spots shown'); assert.ok(w2.document.querySelector('[data-pool]'));
    ['LF', 'CF', 'RF'].forEach((s) => assert.ok(w2.document.querySelector('.ld-slot[data-g="' + s + '"]'), s));
    const md = await open('/coach-master-database.html?demo=1'); assert.ok(md.window.document.querySelector('.coach-subnav a[href="coach-lineup.html"]'), 'subnav on other coach pages');
    assert.ok(!/\b(LF|CF|RF)\b/.test(Array.from(md.window.document.querySelectorAll('select option')).map((o) => o.textContent).join(' ')), 'master database positions unchanged');
    n++; console.log('ok - pages render, keyboard placement, 4-lineup cap, year selector, nav, master database unchanged');
  } finally { srv.close(); }
  done();
})().catch((e) => { console.error(e); process.exit(1); });
function done() { console.log('\n' + n + ' lineup/depth checks passed'); process.exit(0); }
