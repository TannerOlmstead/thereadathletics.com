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
ok('lineup canvas: batting rows, swaps, field slots incl. DH, free notes, clamping, no duplicates', () => {
  assert.strictEqual(L.CONFIG.battingSlots, 9);
  let lu = L.newLineup('x'), r = L.lineupDrop(lu, 'a', L.laneX(), L.laneRowY(0)); assert.strictEqual(r.row, 0); lu = r.lineup;
  r = L.lineupDrop(lu, 'b', L.laneX(), L.laneRowY(1)); lu = r.lineup; assert.deepStrictEqual(L.battingOrder(lu).slice(0, 2), ['a', 'b']);
  r = L.lineupDrop(lu, 'a', L.laneX(), L.laneRowY(1), 'a|bat'); assert.ok(r.swapped); assert.deepStrictEqual(L.battingOrder(r.lineup).slice(0, 2), ['b', 'a']);
  r = L.lineupDrop(lu, 'c', L.laneX(), L.laneRowY(0)); assert.ok(r.displaced && r.lineup.free.a, 'occupant parked as free note'); assert.strictEqual(r.lineup.order[0], 'c');
  assert.strictEqual(lu.order[0], 'a', 'input not mutated');
  r = L.lineupDrop(lu, 'a', L.laneX(), L.laneRowY(4)); assert.strictEqual(r.lineup.order.filter((x) => x === 'a').length, 1, 'a player holds one batting spot; no duplicate row');
  r = L.lineupDrop(lu, 'a', 5, -3, 'a|bat'); assert.strictEqual(r.lineup.order[0], null); assert.ok(r.lineup.free.a.x <= L.LB.x1 && r.lineup.free.a.y >= L.BOUNDS.y0, 'clamped inside canvas');
  r = L.lineupDrop(lu, 'z', L.laneX(), L.laneRowY(4), null, true); assert.ok(r.lineup.free.z && r.lineup.order[4] === null, 'noZones keeps tags free');
  const m = L.lineupReorder(lu, 'a', 1); assert.deepStrictEqual(L.battingOrder(m.lineup).slice(0, 2), ['b', 'a']);
  assert.ok(!L.lineupPids(L.lineupRemove(lu, 'a')).a, 'bare id removes every placement');
  // field slots incl. DH; one batting spot + one field slot is allowed, never two of the same kind
  const F = L.FIELD_ANCHORS; r = L.lineupDrop(lu, 'a', F.SS.x, F.SS.y, 'a|bat'); assert.strictEqual(r.lineup.field.SS, 'a'); assert.strictEqual(r.lineup.order.indexOf('a'), -1, 'moved out of order');
  r = L.lineupDrop(lu, 'q', F.DH.x, F.DH.y); assert.strictEqual(r.lineup.field.DH, 'q', 'DH slot always available'); lu = r.lineup;
  r = L.lineupDrop(lu, 'q', F.SS.x, F.SS.y); assert.ok(r.lineup.field.SS === 'q' && r.lineup.field.DH === undefined, 'one field slot per player'); 
  r = L.lineupDrop(lu, 'z2', F.DH.x, F.DH.y); assert.strictEqual(r.lineup.field.DH, 'z2'); assert.ok(r.lineup.free.q, 'occupant of a field slot is parked, not duplicated');
  r = L.lineupDrop(lu, 'a', F.SS.x, F.SS.y); assert.ok(r.lineup.field.SS === 'a' && r.lineup.order.indexOf('a') >= 0, 'player can bat AND hold a field slot (not a duplicate)');
  const t = L.lineupTags(r.lineup).filter((x) => x.pid === 'a'); assert.deepStrictEqual(t.map((x) => x.kind).sort(), ['bat', 'fld']);
  r = L.lineupDrop(r.lineup, 'a', 0.6, 0.55); assert.ok(r.noop, 'no free duplicate of a placed player');
});
ok('DH is a Lineup-page display slot only: not stored, not a depth group, not a CSV position', () => {
  assert.strictEqual(L.FIELD_SLOTS.length, 10); assert.ok(L.FIELD_SLOTS.indexOf('DH') >= 0 && L.SLOTS.indexOf('DH') < 0 && L.STORED_POSITIONS.indexOf('DH') < 0);
  assert.ok(!('DH' in L.CONFIG.depthSlots) && !('DH' in L.ANCHORS));
  const pv = L.importPreview('Name,Position,Grad Year,Jersey #\nA B,DH,2028,5\nC D,UT,2028,6', []); pv.rows.forEach((x) => { assert.strictEqual(x.status, 'review'); assert.strictEqual(x.suggestion, ''); });
  assert.ok(L.slotFit('DH', P('a', 'P')).ok, 'DH accepts any player');
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
  assert.ok(Object.keys(L.CONFIG.depthSlots).length === 9 && Object.keys(L.CONFIG.depthSlots).every((g) => L.CONFIG.depthSlots[g] === 5), 'five slots per position');
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
const csv = 'Name,Position,Grad Year,Jersey #\nAl One,SS,2028,10\nBo Two,CF,2029,11\nCy Three,DH,2027,12\nDi Four,UT,2027,13\n,P,2027,14\nEd Five,OF,abc,15\nAl One,SS,2028,16\nFy Six,C,2028,17\nGus Seven,P,2028,10\nHal Eight,P,2028,\nIan Nine,1B,2028,99\nJay Ten,2B,2028,44\n';
ok('CSV: valid rows ok; LF/CF/RF review with OF suggestion; DH/UT flagged without suggestion; errors; duplicates', () => {
  const pv = L.importPreview(csv, [P('E1', 'C', { name: 'Fy Six', grad: 2028, jersey: '44' })]), by = {}; pv.rows.forEach((r) => { by[r.line] = r; });
  assert.strictEqual(by[2].status, 'ok'); assert.strictEqual(by[3].status, 'review'); assert.strictEqual(by[3].suggestion, 'OF');
  assert.strictEqual(by[4].status, 'review'); assert.strictEqual(by[4].suggestion, ''); assert.strictEqual(by[5].status, 'review'); assert.strictEqual(by[5].suggestion, '');
  assert.strictEqual(by[6].status, 'error'); assert.strictEqual(by[7].status, 'error');
  assert.strictEqual(by[8].dupe, 'file'); assert.strictEqual(by[9].dupe, 'roster');
});
ok('CSV Jersey #: required column; missing, invalid and duplicate numbers need review; unique numbers enforced on commit', () => {
  assert.ok(L.importPreview('Name,Position,Grad Year\nA,P,2028', []).fileErrors.some((x) => /Jersey/.test(x)));
  const pv = L.importPreview(csv, [P('E1', 'C', { name: 'Fy Six', grad: 2028, jersey: '44' })]), by = {}; pv.rows.forEach((r) => { by[r.line] = r; });
  assert.strictEqual(by[10].jerseyDupe, 'file'); assert.strictEqual(by[10].status, 'review');
  assert.strictEqual(by[11].status, 'review'); assert.ok(/Jersey/.test(by[11].issues.join(' ')));
  assert.strictEqual(by[13].jerseyDupe, 'roster'); assert.strictEqual(by[12].status, 'ok');
  assert.strictEqual(L.jerseyNorm('#07'), '7'); assert.strictEqual(L.jerseyNorm('123'), ''); assert.strictEqual(L.jerseyNorm('x'), '');
  const r = L.commitImport(pv, { 10: { action: 'add', jersey: '10' }, 11: { action: 'add' }, 13: { action: 'add', jersey: '44' } }, true, [], ['44']);
  assert.ok(!r.added.some((p) => p.name === 'Gus Seven' || p.name === 'Hal Eight' || p.name === 'Jay Ten'), 'duplicate or missing jersey is never added');
  const r2 = L.commitImport(pv, { 10: { action: 'add', jersey: '55' }, 11: { action: 'add', jersey: '55' }, 13: { action: 'add', jersey: '56' } }, true, [], ['44']);
  const js = r2.added.map((p) => p.jersey); assert.strictEqual(new Set(js).size, js.length, 'jerseys unique'); assert.ok(js.indexOf('56') >= 0 && js.filter((x) => x === '55').length === 1);
});
ok('roster fixture: fictional, 28 players, unique jerseys, valid positions, no recruit data', () => {
  const R = require('./roster-fixture.js').players(); assert.ok(R.length >= 25 && R.length <= 30);
  assert.strictEqual(new Set(R.map((p) => p.jersey)).size, R.length); assert.strictEqual(new Set(R.map((p) => p.id)).size, R.length);
  R.forEach((p) => { assert.ok(L.STORED_POSITIONS.indexOf(p.pos) >= 0 && /^\d{1,2}$/.test(p.jersey) && p.grad >= 2026, p.name); assert.ok(!('committed' in p) && !('score' in p)); });
  assert.ok(/ictional/.test(read('roster-fixture.js')));
});
ok('stale recruit ids from old drafts are sanitized away', () => {
  const roster = require('./roster-fixture.js').players().map((p) => p.id);
  const lu = { active: 0, lineups: [{ id: 'a', label: 'L', free: { 'REC-9': { x: 0.5, y: 0.5 }, 'R-01': { x: 0.5, y: 0.5 } }, order: ['REC-3', 'R-02'] }] };
  const s = L.sanitizeLineups(JSON.parse(JSON.stringify(lu)), roster); assert.ok(!s.lineups[0].free['REC-9'] && s.lineups[0].order.indexOf('REC-3') < 0 && s.lineups[0].free['R-01'] && s.lineups[0].order.indexOf('R-02') >= 0);
  const dp = L.sanitizeDepth(null, roster), y = L.depthYears(dp)[0]; dp.boards[y].tags = [{ pid: 'REC-1', g: 'SS', x: 0, y: 0 }, { pid: 'R-14', g: 'SS', x: 0, y: 0 }];
  assert.deepStrictEqual(L.sanitizeDepth(JSON.parse(JSON.stringify(dp)), roster).boards[y].tags.map((t) => t.pid), ['R-14']);
});ok('CSV: missing columns, empty file, header only, row limit, quotes and BOM', () => {
  assert.ok(L.importPreview('Name,Grad Year,Jersey #\nA,2028,1', []).fileErrors.length);
  assert.ok(L.importPreview('', []).fileErrors.length); assert.ok(L.importPreview('Name,Position,Grad Year,Jersey #', []).fileErrors.length);
  assert.ok(L.importPreview('Name,Position,Grad Year,Jersey #\n' + new Array(202).join('A,P,2028,1\n'), []).fileErrors.length);
  const q = L.importPreview('\uFEFFName,Position,Grad Year,Jersey #\r\n"Doe, Jo",P,2028,3\r\n', []); assert.strictEqual(q.rows[0].name, 'Doe, Jo'); assert.strictEqual(q.rows[0].status, 'ok');
});
ok('commitImport requires review, never adds errors, never converts silently, never modifies existing', () => {
  const pv = L.importPreview(csv, [P('E1', 'C', { name: 'Fy Six', grad: 2028, jersey: '44' })]);
  assert.throws(() => L.commitImport(pv, {}, false, []));
  assert.throws(() => L.commitImport(pv, {}, undefined, []));
  let r = L.commitImport(pv, {}, true, ['IMP-001'], ['44']);
  assert.ok(r.added.some((p) => p.name === 'Al One') && r.added.find((p) => p.name === 'Al One').id === 'IMP-002');
  r = L.commitImport(pv, { 3: { action: 'add', pos: 'OF' }, 4: { action: 'add', pos: 'DH' }, 5: { action: 'add' }, 6: { action: 'add', pos: 'P' } }, true, [], ['44']);
  const names = r.added.map((p) => p.name + ':' + p.pos);
  assert.ok(names.indexOf('Bo Two:OF') >= 0); assert.ok(!names.some((x) => /Cy|Di|Ed/.test(x)), 'DH/UT/error rows never added');
  r.added.forEach((p) => assert.ok(L.STORED_POSITIONS.indexOf(p.pos) >= 0 && p.jersey));
});
ok('depth chart: duplicates allowed across positions only; blocked inside a position; copy vs move', () => {
  const ss = L.ANCHORS.SS, b2 = L.ANCHORS['2B'], b3 = L.ANCHORS['3B'];
  let b = L.depthDrop({ tags: [] }, 'p', ss.x, ss.y).board; let r = L.depthDrop(b, 'p', b2.x, b2.y); assert.ok(r.ok, 'same player at another position'); b = r.board;
  r = L.depthDrop(b, 'p', b3.x, b3.y); assert.ok(r.ok); b = r.board; assert.deepStrictEqual(L.alsoAt(b, b.tags[0]).sort(), ['2B', '3B']);
  r = L.depthDrop(b, 'p', ss.x, ss.y + 0.02); assert.ok(!r.ok && /Already listed at SS/.test(r.reason), 'blocked within the same position');
  r = L.depthDrop(b, 'p', b2.x, b2.y, L.key('p', 'SS')); assert.ok(!r.ok, 'moving into a group that already has the player is blocked');
  r = L.depthDrop(b, 'p', ss.x, ss.y, L.key('p', 'SS')); assert.ok(r.ok && L.groupTags(r.board, 'SS').length === 1, 'moving within a group is a move');
  r = L.depthRemove(b, L.key('p', '2B')); assert.ok(L.groupTags(r, 'SS').length === 1 && L.groupTags(r, '2B').length === 0, 'remove deletes one copy');
  let full = { tags: [] }; for (let i = 0; i < 5; i++) full = L.depthDrop(full, 'x' + i, ss.x, ss.y).board; assert.ok(!L.depthDrop(full, 'x9', ss.x, ss.y).ok); assert.strictEqual(L.depthLabel(4), 'Backup 4');
  const raw = L.sanitizeDepth(null, ['a', 'b']), y = L.depthYears(raw)[0];
  raw.boards[y].tags = [{ pid: 'a', g: 'SS', x: 0, y: 0 }, { pid: 'a', g: '2B', x: 0, y: 0 }, { pid: 'a', g: 'SS', x: 0, y: 0 }].concat([1, 2, 3, 4, 5, 6].map(() => ({ pid: 'b', g: 'C', x: 0, y: 0 })));
  const s = L.sanitizeDepth(JSON.parse(JSON.stringify(raw)), ['a', 'b']).boards[y].tags; assert.strictEqual(s.filter((t) => t.pid === 'a').length, 2, 'cross-position duplicates survive, in-position ones are dropped'); assert.strictEqual(s.filter((t) => t.pid === 'b').length, 1);
});
ok('old drafts migrate safely: old lineup shape (order and free only) and 3-slot depth data', () => {
  const old = { active: 0, lineups: [{ id: 'a', label: 'Old', opponent: 'X', date: '', free: { a: { x: 0.5, y: 0.5 } }, order: ['b', null, null, null, null, null, null, null, null] }] };
  const s = L.sanitizeLineups(JSON.parse(JSON.stringify(old)), ['a', 'b']).lineups[0]; assert.deepStrictEqual(s.field, {}); assert.strictEqual(s.order[0], 'b'); assert.ok(s.free.a && s.free.a.x >= L.LB.x0, 'free note moved clear of the roster panel');
  const bad = { active: 0, lineups: [{ id: 'a', label: 'L', field: { SS: 'a', DH: 'a', P: 'zz', QQ: 'a' }, free: {}, order: [] }] };
  const f = L.sanitizeLineups(bad, ['a']).lineups[0].field; assert.deepStrictEqual(f, { SS: 'a' }, 'one field slot per player; unknown ids and slots dropped');
  const d = L.sanitizeDepth(null, ['a']), y = L.depthYears(d)[0]; d.boards[y].tags = [0, 1, 2].map((i) => ({ pid: 'a' + i, g: 'SS', x: 0, y: 0 })); assert.strictEqual(L.sanitizeDepth(d, ['a0', 'a1', 'a2']).boards[y].tags.length, 3);
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
    assert.strictEqual(q('#ld-canvas select').length, 0); assert.ok(q('#ld-tray-list .ld-tag').length === 28, 'tray holds exactly the 28 fictional roster players'); assert.ok(/^#\d+/.test(q('#ld-tray-list .ld-tag')[0].textContent.trim()), 'jersey number shown first'); assert.ok(!/ecruit|prospect|Target/.test(Array.from(q('.ld-tag')).map((e) => e.textContent).join(' ')) && !q('[data-pool]').length, 'no recruits in pool'); assert.ok(Array.from(q('#ld-tray-list .ld-tag')).every((e) => /^R-\d+$/.test(e.dataset.pid)), 'roster ids only');
    const tray = q('#ld-tray-list .ld-tag')[0]; assert.ok(tray.getAttribute('tabindex') === '0');
    const pid = tray.dataset.pid; tray.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    let tag = w.document.querySelector('#ld-canvas .ld-tag[data-where="canvas"][data-pid="' + pid + '"]'); assert.ok(tag, 'Enter sends tray tag to canvas'); assert.ok(/set as batting order 1/.test(w.document.getElementById('ld-live').textContent) || /placed on the canvas/.test(w.document.getElementById('ld-live').textContent), 'aria-live');
    assert.ok(tag.querySelector('.pill'), 'stored position pill'); assert.ok(!/\b(LF|CF|RF)\b/.test(tag.querySelector('.pill').textContent));
    const before = tag.style.left + tag.style.top; tag.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true }));
    tag = w.document.querySelector('#ld-canvas .ld-tag[data-where="canvas"][data-pid="' + pid + '"]'); assert.ok(tag, 'tag still on canvas after arrow move');
    tag.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Delete', bubbles: true })); assert.ok(!w.document.querySelector('#ld-canvas .ld-tag[data-where="canvas"][data-pid="' + pid + '"]'), 'Delete returns tag to tray');
    const cv = w.document.getElementById('ld-canvas'); assert.ok(cv.querySelector('#ld-tray') && cv.querySelectorAll('#ld-tray-list .ld-tag').length === 28 && cv.querySelectorAll('.ld-lane-row').length === 9 && cv.querySelectorAll('.ld-fslot').length === 10 && cv.querySelector('.ld-fslot.dh'), 'roster, 9 batting rows and 10 field slots incl. DH are one canvas');
    assert.ok(!/\b(OPG|DPG|PPG|SOPG|SDPG|Grade|Score|Tier)\b/.test(Array.from(w.document.querySelectorAll('.ld-tag')).map((e) => e.textContent + ' ' + e.getAttribute('aria-label')).join(' ')), 'no grades on tags'); assert.ok(!cv.querySelector('select') && !w.document.querySelector('select.ld-sel'), 'no select placement');
    w.document.getElementById('lu-add').click(); assert.strictEqual(q('.ld-tab').length, 2);
    w.document.getElementById('lu-add').click(); w.document.getElementById('lu-add').click(); assert.strictEqual(q('.ld-tab').length, 4); assert.ok(w.document.getElementById('lu-add').disabled, 'cap at 4');
    const d2 = await open('/coach-depth-chart.html?demo=1'), w2 = d2.window, q2 = (s) => w2.document.querySelectorAll(s);
    assert.strictEqual(q2('.ld-tab[data-tab]').length, 4); assert.ok(q2('svg.ld-outline').length === 1 && q2('svg.ld-outline path, svg.ld-outline rect').length > 3, 'baseball field outline');
    assert.strictEqual(q2('#ld-canvas select, select.ld-sel').length, 0);
    ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'].forEach((s) => assert.ok(/\bopen\b/.test(Array.from(q2('.ld-glabel')).filter((e) => e.textContent.indexOf(s + ' ') === 0).map((e) => e.textContent).join(' ')), s));
    const t2 = q2('#ld-tray-list .ld-tag')[0]; t2.dispatchEvent(new w2.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); assert.ok(q2('#ld-canvas .ld-tag[data-where="canvas"]').length === 1 && q2('#ld-tray-list .ld-tag').length === 28, 'depth tray Enter copies the tag; roster stays full');
    w2.document.querySelector('[data-yrs="2"]').click(); assert.strictEqual(q2('.ld-tab[data-tab]').length, 2);  assert.ok(!w2.document.querySelector('[data-pool]') && !/Recruiting Targets/.test(w2.document.body.textContent), 'no recruiting targets pool');
    const md = await open('/coach-master-database.html?demo=1'); assert.ok(md.window.document.querySelector('.coach-subnav a[href="coach-lineup.html"]'), 'subnav on other coach pages');
    assert.ok(!/\b(LF|CF|RF)\b/.test(Array.from(md.window.document.querySelectorAll('select option')).map((o) => o.textContent).join(' ')), 'master database positions unchanged');
    const sp = await JSDOM.fromURL(base + '/coach-depth-chart.html?demo=1', { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: new VirtualConsole(), beforeParse: (win) => { win.sessionStorage.setItem('theReadActiveSport', 'Women\u2019s Soccer'); } }); await new Promise((r) => setTimeout(r, 1200));
    const sdoc = sp.window.document; assert.ok(sdoc.querySelector('svg.ld-outline') && /Requires Founder Decision/.test(sdoc.body.textContent), 'non-baseball shows outline and provisional notice'); assert.strictEqual(sdoc.querySelectorAll('.ld-glabel, .ld-ghost-slot').length, 0, 'no invented non-baseball positions');    n++; console.log('ok - pages render, keyboard placement, 4-lineup cap, year selector, nav, master database unchanged');
  } finally { srv.close(); }
  done();
})().catch((e) => { console.error(e); process.exit(1); });
function done() { console.log('\n' + n + ' lineup/depth checks passed'); process.exit(0); }
