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
ok('lineup canvas: lane drop sets batting order, swaps, displaces; free drops are clamped', () => {
  let lu = L.newLineup('x'), r = L.lineupDrop(lu, 'a', L.laneX(), L.laneRowY(0)); assert.strictEqual(r.row, 0); lu = r.lineup;
  r = L.lineupDrop(lu, 'b', L.laneX(), L.laneRowY(1)); lu = r.lineup; assert.deepStrictEqual(L.battingOrder(lu).slice(0, 2), ['a', 'b']);
  r = L.lineupDrop(lu, 'a', L.laneX(), L.laneRowY(1)); assert.ok(r.swapped); assert.deepStrictEqual(L.battingOrder(r.lineup).slice(0, 2), ['b', 'a']);
  r = L.lineupDrop(lu, 'c', L.laneX(), L.laneRowY(0)); assert.ok(r.displaced && r.lineup.free.a, 'occupant moved to free space'); assert.strictEqual(r.lineup.order[0], 'c');
  assert.strictEqual(lu.order[0], 'a', 'input not mutated');
  r = L.lineupDrop(lu, 'a', 5, -3); assert.strictEqual(r.lineup.order[0], null); assert.ok(r.lineup.free.a.x <= L.BOUNDS.x1 && r.lineup.free.a.y >= L.BOUNDS.y0, 'clamped inside canvas');
  r = L.lineupDrop(lu, 'z', L.laneX(), L.laneRowY(4), true); assert.ok(r.lineup.free.z && r.lineup.order[4] === null, 'noLane keeps tags free');
  const m = L.lineupReorder(lu, 'a', 1); assert.deepStrictEqual(L.battingOrder(m.lineup).slice(0, 2), ['b', 'a']);
  assert.ok(!L.lineupPids(L.lineupRemove(lu, 'a')).a, 'tray return');
});
ok('depth canvas: snap within radius, stack order, once per group, caps, free tags, noSnap, remove, reorder', () => {
  let b = { tags: [] }; const a = L.ANCHORS.SS;
  let r = L.depthDrop(b, 'p1', a.x + 0.02, a.y); assert.ok(r.ok && r.group === 'SS' && r.index === 0); b = r.board;
  r = L.depthDrop(b, 'p2', a.x, a.y + 0.03); assert.strictEqual(r.index, 1); b = r.board;
  assert.deepStrictEqual(L.groupTags(b, 'SS').map((t) => t.pid), ['p1', 'p2']); assert.strictEqual(L.depthLabel(0), 'Starter');
  r = L.depthDrop(b, 'p1', a.x, a.y, L.key('p1', 'SS')); assert.strictEqual(L.groupTags(r.board, 'SS').length, 2, 'moving within a group never duplicates');
  r = L.depthDrop(b, 'p3', 0.5, 0.97); assert.strictEqual(r.group, null); assert.ok(r.board.tags.some((t) => t.pid === 'p3' && !t.g && t.y <= L.BOUNDS.y1), 'free tag clamped');
  r = L.depthDrop(b, 'p3', 0.5, 0.97, null, true); assert.strictEqual(r.group, null);
  const near = L.depthDrop({ tags: [] }, 'q', a.x + 0.02, a.y, null, true); assert.strictEqual(near.group, null, 'noSnap');
  let full = { tags: [] }; for (let i = 0; i < L.CONFIG.depthSlots.C; i++) full = L.depthDrop(full, 'c' + i, L.ANCHORS.C.x, L.ANCHORS.C.y).board;
  assert.ok(!L.depthDrop(full, 'extra', L.ANCHORS.C.x, L.ANCHORS.C.y).ok, 'per-group cap'); assert.strictEqual(L.openSpots(full, 'C'), 0);
  assert.strictEqual(L.totalOpen(b), Object.keys(L.CONFIG.depthSlots).reduce((s, g) => s + L.CONFIG.depthSlots[g], 0) - 2);
  const q = L.depthReorder(b, L.key('p1', 'SS'), 1); assert.deepStrictEqual(L.groupTags(q.board, 'SS').map((t) => t.pid), ['p2', 'p1']);
  assert.ok(!L.depthRemove(b, L.key('p1', 'SS')).tags.some((t) => t.pid === 'p1'));
  ['LF', 'CF', 'RF'].forEach((g) => assert.strictEqual(L.slotStored(g), 'OF'));
});
ok('sport outlines: every registered sport resolves, unknown/null fall back to plain white, registry extensible', () => {
  ['baseball', 'softball', 'soccer', 'basketball', 'football', 'volleyball'].forEach((s) => { const o = L.resolveOutline(s); assert.ok(!o.plain && /<(path|rect|circle|line|ellipse|polygon)/.test(o.svg) && o.id === s, s); });
  ["Men's Soccer", "Women's Soccer", "Women's Basketball", "Women's Volleyball", 'Football', 'Softball', 'Baseball'].forEach((s) => assert.ok(!L.resolveOutline(s).plain, s));
  assert.strictEqual(L.resolveOutline('Softball').id, 'softball'); assert.ok(!/mound/i.test(L.resolveOutline('Softball').svg), 'softball has no mound');
  ['Curling', '', null, undefined].forEach((s) => { const o = L.resolveOutline(s); assert.ok(o.plain && o.svg === ''); });
  L.registerOutline('lacrosse', 'Lacrosse field', '<rect x="1" y="1" width="9" height="9"/>', ['mens-lacrosse']); assert.ok(!L.resolveOutline('Lacrosse').plain && !L.resolveOutline("Men's Lacrosse").plain);
});
ok('lineups: 4-page cap, duplicate, delete keeps one, clear', () => {
  let st = L.newLineupState(); assert.strictEqual(st.lineups.length, 1);
  for (let i = 0; i < 3; i++) { const r = L.addLineup(st); assert.ok(r.ok); st = r.state; }
  assert.strictEqual(st.lineups.length, 4); assert.ok(!L.addLineup(st).ok); assert.ok(!L.duplicateLineup(st, 0).ok); assert.strictEqual(L.CONFIG.maxLineups, 4);
  assert.ok(!L.removeLineup(L.newLineupState(), 0).ok); assert.strictEqual(L.removeLineup(st, 1).state.lineups.length, 3);
  assert.strictEqual(L.duplicateLineup(L.newLineupState(), 0).state.lineups.length, 2);
  const filled = L.lineupDrop(st.lineups[0], 'a', L.laneX(), L.laneRowY(0)).lineup; assert.strictEqual(L.lineupPids(L.clearLineup(filled)).a, undefined);
  assert.strictEqual(L.newLineupState().lineups[0].order.length, 9);
});
ok('sanitize clamps coordinates, drops unknown ids, caps lineups and depth groups', () => {
  assert.strictEqual(L.sanitizeLineups('junk', []).lineups.length, 1);
  const raw = { active: 0, lineups: [1, 2, 3, 4, 5, 6].map((i) => ({ id: 'l' + i, label: 'L', free: { keep: { x: 9, y: -9 }, gone: { x: 0.5, y: 0.5 } }, order: ['keep', 'gone'] })) };
  const s = L.sanitizeLineups(JSON.parse(JSON.stringify(raw)), ['keep']); assert.strictEqual(s.lineups.length, 4);
  assert.ok(!s.lineups[0].free.gone && s.lineups[0].order.indexOf('gone') < 0); assert.ok(!(s.lineups[0].free.keep && s.lineups[0].order.indexOf('keep') >= 0), 'one place per player');
  const dp = L.sanitizeDepth(null, []); assert.strictEqual(dp.count, 4);
  const y = L.depthYears(dp)[0], bad = JSON.parse(JSON.stringify(dp)); bad.boards[y].tags = [{ pid: 'a', g: 'C', x: 0, y: 0 }, { pid: 'a', g: 'C', x: 0, y: 0 }, { pid: 'z', g: 'C' }, { pid: 'a', g: null, x: 5, y: 5 }, { pid: 'a', g: 'QQ', x: 0.5, y: 0.5 }];
  const sd = L.sanitizeDepth(bad, ['a']); const tags = sd.boards[y].tags; assert.strictEqual(tags.filter((t) => t.g === 'C').length, 1); assert.ok(tags.every((t) => t.x <= 1 && t.y <= 1 && t.pid === 'a'));
});
ok('depth chart: 2-4 year range, defaults and season start', () => {
  assert.strictEqual(L.clampYears(1), 2); assert.strictEqual(L.clampYears(9), 4); assert.strictEqual(L.clampYears(3), 3); assert.strictEqual(L.clampYears(undefined), 4);
  assert.strictEqual(L.firstSeason(new Date(2026, 2, 1)), 2026); assert.strictEqual(L.firstSeason(new Date(2026, 8, 1)), 2027);
  let d = L.newDepthState(new Date(2026, 8, 1)); assert.deepStrictEqual(L.depthYears(d), [2027, 2028, 2029, 2030]);
  d = L.setYears(d, 2); assert.deepStrictEqual(L.depthYears(d), [2027, 2028]);
  assert.strictEqual(L.depthYears(L.setYears(d, 3)).length, 3);
  assert.ok(L.yearNote({ grad: 2027 }, 2029) && !L.yearNote({ grad: 2030 }, 2029));
  assert.deepStrictEqual(d.boards[2027].tags, []);
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
    assert.strictEqual(q('.ld-tab').length, 1); assert.ok(q('#ld-canvas').length === 1 && q('.ld-lane-row').length === 9, 'white canvas with 9-row lane');
    assert.strictEqual(q('select.ld-sel, .ld-slot').length, 0, 'no select or slot placement controls');
    assert.strictEqual(q('#ld-canvas select').length, 0); assert.ok(q('#ld-tray-list .ld-tag').length > 20, 'tray tags come from sample players');
    const tray = q('#ld-tray-list .ld-tag')[0]; assert.ok(tray.getAttribute('tabindex') === '0');
    const pid = tray.dataset.pid; tray.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    let tag = w.document.querySelector('#ld-canvas .ld-tag[data-pid="' + pid + '"]'); assert.ok(tag, 'Enter sends tray tag to canvas'); assert.ok(/set as batting order 1/.test(w.document.getElementById('ld-live').textContent) || /placed on the canvas/.test(w.document.getElementById('ld-live').textContent), 'aria-live');
    assert.ok(tag.querySelector('.pill'), 'stored position pill'); assert.ok(!/\b(LF|CF|RF)\b/.test(tag.querySelector('.pill').textContent));
    const before = tag.style.left + tag.style.top; tag.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true }));
    tag = w.document.querySelector('#ld-canvas .ld-tag[data-pid="' + pid + '"]'); assert.ok(tag, 'tag still on canvas after arrow move');
    tag.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Delete', bubbles: true })); assert.ok(!w.document.querySelector('#ld-canvas .ld-tag[data-pid="' + pid + '"]'), 'Delete returns tag to tray');
    w.document.getElementById('lu-add').click(); assert.strictEqual(q('.ld-tab').length, 2);
    w.document.getElementById('lu-add').click(); w.document.getElementById('lu-add').click(); assert.strictEqual(q('.ld-tab').length, 4); assert.ok(w.document.getElementById('lu-add').disabled, 'cap at 4');
    const d2 = await open('/coach-depth-chart.html?demo=1'), w2 = d2.window, q2 = (s) => w2.document.querySelectorAll(s);
    assert.strictEqual(q2('.ld-tab[data-tab]').length, 4); assert.ok(q2('svg.ld-outline').length === 1 && q2('svg.ld-outline path, svg.ld-outline rect').length > 3, 'baseball field outline');
    assert.strictEqual(q2('#ld-canvas select, select.ld-sel').length, 0);
    ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'].forEach((s) => assert.ok(/\bopen\b/.test(Array.from(q2('.ld-glabel')).filter((e) => e.textContent.indexOf(s + ' ') === 0).map((e) => e.textContent).join(' ')), s));
    const t2 = q2('#ld-tray-list .ld-tag')[0]; t2.dispatchEvent(new w2.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); assert.ok(q2('#ld-canvas .ld-tag').length === 1, 'depth tray Enter places tag');
    w2.document.querySelector('[data-yrs="2"]').click(); assert.strictEqual(q2('.ld-tab[data-tab]').length, 2); assert.ok(w2.document.querySelector('[data-pool="targets"]'));
    const md = await open('/coach-master-database.html?demo=1'); assert.ok(md.window.document.querySelector('.coach-subnav a[href="coach-lineup.html"]'), 'subnav on other coach pages');
    assert.ok(!/\b(LF|CF|RF)\b/.test(Array.from(md.window.document.querySelectorAll('select option')).map((o) => o.textContent).join(' ')), 'master database positions unchanged');
    const sp = await JSDOM.fromURL(base + '/coach-depth-chart.html?demo=1', { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: new VirtualConsole(), beforeParse: (win) => { win.sessionStorage.setItem('theReadActiveSport', 'Women\u2019s Soccer'); } }); await new Promise((r) => setTimeout(r, 1200));
    const sdoc = sp.window.document; assert.ok(sdoc.querySelector('svg.ld-outline') && /Requires Founder Decision/.test(sdoc.body.textContent), 'non-baseball shows outline and provisional notice'); assert.strictEqual(sdoc.querySelectorAll('.ld-glabel, .ld-ghost-slot').length, 0, 'no invented non-baseball positions');    n++; console.log('ok - pages render, keyboard placement, 4-lineup cap, year selector, nav, master database unchanged');
  } finally { srv.close(); }
  done();
})().catch((e) => { console.error(e); process.exit(1); });
function done() { console.log('\n' + n + ' lineup/depth checks passed'); process.exit(0); }
