/* Unit-integrity tests (Table Specs, criteria 1-118 that apply to this static/localStorage site). Run: node unit-integrity.tests.js
   The page-level audit needs jsdom (set JSDOM_PATH); it is skipped with a message when jsdom is unavailable. */
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path');
global.window = {};
const B = require('./benchmarks-config.js'); require('./recruit-score.js'); const S = global.window.TheReadScore;
const ok = (m) => console.log('ok - ' + m);

// 1-13: metric definitions, one quantity and one canonical unit each
const R = B.REGISTRY;
['SIXTY_TIME', 'POP_TIME'].forEach((k) => { assert.strictEqual(R[k].quantity, 'ElapsedTime'); assert.strictEqual(R[k].unit, 'seconds'); assert.strictEqual(R[k].direction, 'LowerIsBetter'); assert.strictEqual(R[k].display, 's'); });
['AVG_EV', 'MAX_EV', 'THROW_VELO', 'AVG_FBV', 'MAX_FBV'].forEach((k) => { assert.strictEqual(R[k].quantity, 'Velocity'); assert.strictEqual(R[k].unit, 'mph'); assert.strictEqual(R[k].direction, 'HigherIsBetter'); });
Object.keys(R).forEach((k) => ['key', 'label', 'quantity', 'unit', 'display', 'direction', 'decimals'].forEach((f) => assert.ok(R[k][f] != null, k + '.' + f)));
ok('registry: seconds/LowerIsBetter for 60 and Pop, mph/HigherIsBetter for velocities, all 7 fields defined');

// 23-24, 37-46: benchmark config validated against the registry; every version records quantity/unit/direction
Object.keys(B.TABLES).forEach((k) => { assert.strictEqual(B.TABLES[k].unit, R[k].unit); assert.strictEqual(B.TABLES[k].quantity, R[k].quantity); assert.strictEqual(B.TABLES[k].direction, R[k].direction); });
const bad = (patch) => { const t = JSON.parse(JSON.stringify(B.TABLES)); Object.assign(t.SIXTY_TIME, patch); return () => B.validateTables(t); };
assert.throws(bad({ unit: 'mph' }), /UnitMismatch/); assert.throws(bad({ quantity: 'Velocity' }), /UnitMismatch/);
assert.throws(bad({ direction: 'HigherIsBetter', lower: false }), /UnitMismatch/); assert.throws(bad({ lower: false }), /UnitMismatch/);
const t2 = JSON.parse(JSON.stringify(B.TABLES)); t2.AVG_EV.unit = 'seconds'; assert.throws(() => B.validateTables(t2), /UnitMismatch/);
Object.values(B.RETIRED).forEach((g) => { assert.ok(B.validateTables(g.tables)); Object.keys(g.tables).forEach((k) => { assert.strictEqual(g.tables[k].unit, R[k].unit); assert.ok(g.tables[k].direction); }); });
ok('benchmark config rejects a conflicting unit, quantity or direction; retired v0.2 keeps unit metadata');

// 26-27, 47-58: unit checks and lookup safety
assert.strictEqual(B.checkUnit('SIXTY_TIME', 's').status, 'OK'); assert.strictEqual(B.checkUnit('t60', 'sec').status, 'OK'); assert.strictEqual(B.checkUnit('tv', 'MPH').status, 'OK');
['mph', 'miles per hour'].forEach((u) => { assert.strictEqual(B.checkUnit('SIXTY_TIME', u).status, 'UnitMismatch'); assert.strictEqual(B.checkUnit('POP_TIME', u).status, 'UnitMismatch'); });
['seconds', 's'].forEach((u) => ['AVG_EV', 'MAX_EV', 'THROW_VELO', 'AVG_FBV', 'MAX_FBV'].forEach((k) => assert.strictEqual(B.checkUnit(k, u).status, 'UnitMismatch')));
assert.strictEqual(B.checkUnit('SIXTY_TIME', '').status, 'MissingUnit'); assert.strictEqual(B.checkUnit('SIXTY_TIME', null).status, 'MissingUnit');
const g6 = B.gradeMeasurement({ key: 'SIXTY_TIME', value: 6.9, unit: 'seconds' }, '1B'); assert.strictEqual(g6.status, 'Graded'); assert.strictEqual(g6.grade.letter, 'A');
[{ key: 'SIXTY_TIME', value: 6.9, unit: 'mph' }, { key: 'POP_TIME', value: 1.9, unit: 'mph' }, { key: 'AVG_EV', value: 94, unit: 'seconds' }, { key: 'THROW_VELO', value: 94, unit: 's' }, { key: 'SIXTY_TIME', value: 6.9 }].forEach((m) => {
  const r = B.gradeMeasurement(m, m.key === 'POP_TIME' ? 'C' : '1B');
  assert.ok(r.status === 'UnitMismatch' || r.status === 'MissingUnit', m.key + ' ' + r.status); assert.strictEqual(r.grade, null);
  ['F', 'Not Rated', 0].forEach((x) => assert.notStrictEqual(r.grade, x)); assert.notStrictEqual(r.status, 'NotRated');
});
ok('lookup: mph on 60/Pop, seconds on velocity, and missing units never grade (no F/Not Rated/zero, no default repair)');

// 51-61: Recruit Score excludes UnitMismatch values (never F/0, never converted); correcting the unit restores the grade
const rec = (units) => ({ pos: '1B', metrics: { ht: 76, wt: 250, t60: 6.9, tv: 94, avgEV: 94, maxEV: 102 }, verified: {}, units });
const good = S.compute(rec(undefined), []), mis = S.compute(rec({ t60: 'mph' }), []), fixed = S.compute(rec({ t60: 'seconds' }), []);
assert.strictEqual(good.comps[2].letter, 'A'); assert.strictEqual(mis.comps[2].pts, null, 'mph 60 time excluded');
assert.ok(/UnitMismatch/.test(mis.comps[2].detail) && mis.comps[2].letter == null, 'explained, not F');
assert.strictEqual(mis.unitMismatches.length, 1); assert.ok(mis.inputs.some((i) => i.key === 't60' && i.status === 'UnitMismatch' && i.credit === 0), 'confidence credit 0 for the unit-mismatched input');
assert.ok(mis.conf < good.conf, 'completeness reduced'); assert.ok(mis.grades.opg !== 0 && !(mis.grades.opg === 1)); assert.strictEqual(mis.grades.dpg == null || mis.grades.dpg > 1, true);
assert.strictEqual(fixed.comps[2].letter, 'A'); assert.strictEqual(fixed.rs, good.rs); const tvBad = S.compute(rec({ tv: 'seconds' }), []); assert.strictEqual(tvBad.unitMismatches.length, 1); assert.ok(tvBad.gradeValue.dpg !== good.gradeValue.dpg, 'DPG recomputed without the mismatched throw velocity');
assert.ok(/Unit error \(UnitMismatch\)/.test(S.panel(mis, new Proxy({}, { get: () => () => '' }))), 'panel shows the unit error');
ok('compute: UnitMismatch excluded, confidence reduced, correcting the unit restores the same score');

// 14-17, 28-33, 62-78: display and accessible labels come from the registry
assert.strictEqual(B.fmt('SIXTY_TIME', 6.9), '6.90 s'); assert.strictEqual(B.fmt('POP_TIME', 1.9), '1.90 s'); assert.strictEqual(B.fmt('AVG_EV', 94), '94.0 mph'); assert.strictEqual(B.fmt('SIXTY_TIME', null), '\u2014');
assert.ok(/seconds/.test(B.ariaOf('SIXTY_TIME', 6.9)) && !/mph|miles/.test(B.ariaOf('SIXTY_TIME', 6.9))); assert.ok(/seconds/.test(B.ariaOf('POP_TIME', 1.9)));
assert.ok(/miles per hour/.test(B.ariaOf('AVG_EV', 94)) && /miles per hour/.test(B.ariaOf('THROW_VELO', 94)));
const files = fs.readdirSync(__dirname).filter((f) => /\.(js|html|md)$/.test(f) && !/tests?\.(js|html)$/.test(f));
const timeMph = /(60[- ]?(yd|yard)|pop|t60|sixty)[^\n]{0,60}\bmph\b|\bmph\b[^\n]{0,30}(60[- ]?(yd|yard)|pop time)/i;
const ALLOWED_LINES = [{ file: 'COPILOT_HANDOFF.md', line: '2. Report every occurrence of `SIXTY_TIME` or `POP_TIME` associated with `mph`.' }];
const scanTimeMph = (f, text) => text.split(/\r?\n/).forEach((l, i) => { if (timeMph.test(l) && !/UnitMismatch|never mph|not mph|mph\) \(|PLAUSIBLE|Spacing|ElapsedTime/i.test(l) && !/^\s*\/[/*]/.test(l) && !ALLOWED_LINES.some((x) => x.file === f && x.line === l.trim())) throw new assert.AssertionError({ message: f + ':' + (i + 1) + ' pairs a time metric with mph: ' + l.trim().slice(0, 140) }); });
files.forEach((f) => scanTimeMph(f, fs.readFileSync(path.join(__dirname, f), 'utf8')));
const exact = ALLOWED_LINES[0].line;
scanTimeMph('COPILOT_HANDOFF.md', exact);
[['other.md', exact], ['COPILOT_HANDOFF.md', exact.replace('Report', 'Show')], ['COPILOT_HANDOFF.md', exact + ' x'], ['x.js', '60-Yard Time 6.9 mph'], ['COPILOT_HANDOFF.md', '60-Yard Time 6.9 mph'], ['x.md', 'POP_TIME 1.9 mph']].forEach(([f, l]) => assert.throws(() => scanTimeMph(f, l), /pairs a time metric with mph/, f + ': ' + l));
ok('scan allow-list: only the exact COPILOT_HANDOFF.md instruction is exempt; altered/other-file/real pairings still fail');
const sig = fs.readFileSync(path.join(__dirname, 'athlete-signup.js'), 'utf8');
assert.ok(/UL\('SIXTY_TIME', '60-Yard Time'\)/.test(sig) && !/60-Yard Time \((sec|mph)\)/.test(sig), 'signup 60-yard label comes from the registry');
assert.ok(!/<option[^>]*>[^<]*mph/i.test(sig.slice(sig.indexOf("'t60'"), sig.indexOf("'t60'") + 400)), 'no user-selectable mph option for 60-Yard');
ok('display/aria labels: registry-driven; no source line pairs 60-Yard or Pop Time with mph');

// 34-36, 26: client/storage validation of explicit units
(async () => {
  let jsdom; try { jsdom = require(process.env.JSDOM_PATH || 'jsdom'); } catch (e) { console.log('SKIPPED page-level unit audit: jsdom not installed'); return; }
  const { JSDOM, VirtualConsole } = jsdom, http = require('http');
  const server = http.createServer((q, res) => { fs.readFile(path.join(__dirname, decodeURIComponent(q.url.split('?')[0])), (e, b) => { if (e) { res.statusCode = 404; res.end(); } else res.end(b); }); });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const dom = await JSDOM.fromURL(base + '/coach-master-database.html?demo=1', { runScripts: 'dangerously', resources: 'usable', virtualConsole: new VirtualConsole() });
  await new Promise((r) => setTimeout(r, 3500));
  const w = dom.window, A = w.TheReadAthlete;
  assert.ok(A.unitErrors({ units: { t60: 'mph' } }).length === 1 && /UnitMismatch/.test(A.unitErrors({ units: { t60: 'mph' } })[0]));
  assert.strictEqual(A.unitErrors({ units: { t60: 'seconds', tv: 'mph' } }).length, 0);
  const before = A.load().length;
  assert.strictEqual(A.upsert({ id: 'ath-unit-bad', metrics: { t60: 6.9 }, units: { t60: 'mph' } }), false, 'storage layer rejects the bad unit');
  assert.strictEqual(A.load().length, before, 'bad-unit record not saved');
  assert.ok(A.unitErrors({ units: { pop: 'mph' } }).length === 1);
  ok('client + storage validation reject 60/Pop in mph and velocity in seconds; nothing saved');

  // 104-115: audit of stored/sample data
  const players = w.TheReadCoach.players, seedRec = A.load().concat(JSON.parse(w.localStorage.getItem('theReadDemoAthletes') || '[]'));
  const a1 = B.auditRecords(players), a2 = B.auditRecords(seedRec);
  const names = ['valid', 'incorrectlyLabeled', 'missingUnit', 'ambiguous'];
  console.log('AUDIT sample database (' + a1.records + ' players, ' + a1.measurements + ' measurements): ' + names.map((n) => n + '=' + a1[n]).join(', ') + ', invalidatedGrades=' + a1.invalidatedGrades + ', corrected=' + a1.corrected + ', requiresReview=' + a1.requiresReview);
  console.log('AUDIT stored/demo athlete records (' + a2.records + ' records, ' + a2.measurements + ' measurements): ' + names.map((n) => n + '=' + a2[n]).join(', '));
  assert.strictEqual(a1.incorrectlyLabeled, 0); assert.strictEqual(a1.ambiguous, 0, JSON.stringify(a1.details.slice(0, 3))); assert.strictEqual(a2.incorrectlyLabeled, 0); assert.strictEqual(a2.ambiguous, 0);
  assert.strictEqual(a1.valid, a1.measurements); assert.strictEqual(a1.corrected, 0);
  ok('stored-data audit: no mislabeled or ambiguous measurements; nothing converted or corrected');

  // 62-69, 71: rendered pages show seconds for 60/Pop and never pair them with mph
  const card = await JSDOM.fromURL(base + '/coach-player-card.html?demo=1&id=ATH-MOSEED', { runScripts: 'dangerously', resources: 'usable', virtualConsole: new VirtualConsole() });
  await new Promise((r) => setTimeout(r, 3500));
  const txt = card.window.document.body.textContent.replace(/\s+/g, ' ');
  assert.ok(/60 Time\s*6\.90 s/.test(txt), 'player card shows 60 time in s'); assert.ok(!/60 Time[^A-Za-z]{0,12}mph/i.test(txt) && !/Pop Time[^A-Za-z]{0,12}mph/i.test(txt));
  assert.ok(/94\.0 mph|94 mph/.test(txt), 'velocities in mph');
  [card, dom].forEach((d) => d.window.close()); server.close();
  ok('player card: 60 Time in s, velocities in mph');
})().catch((e) => { console.error(e); process.exit(1); });
