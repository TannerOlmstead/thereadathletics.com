/* Regression tests for pitcher-primary grades. Run: node recruit-score.tests.js */
'use strict';
global.window = {};
require('./recruit-score.js');
const S = global.window.TheReadScore;
const assert = require('assert');
const bench = [];
['SS', '2B', 'OF', '3B', 'C', '1B'].forEach((pos) => { for (let i = 0; i < 12; i++) bench.push({ pos, avgEV: 80 + i, maxEV: 88 + i, t60: 7.4 - i * 0.05, tv: 75 + i }); });
const metrics = { ht: 75, wt: 200, avgFBV: 84, maxFBV: 88, avgEV: 70, maxEV: 78, tv: 80, t60: 7.6 };
let n = 0;
const t = (name, fn) => { fn(); n++; console.log('ok -', name); };

t('pitcher-only with a secondary position still gets no hitter grades', () => {
  const r = S.compute({ pos: 'P', sec: '2B', metrics }, bench);
  assert.strictEqual(r.grades.opg, null);
  assert.strictEqual(r.grades.sopg, null);
});
t('position player with secondary P gets no SOPG/SDPG', () => {
  const r = S.compute({ pos: 'SS', sec: 'P', metrics }, bench);
  assert.ok(r.grades.opg != null);
  assert.strictEqual(r.grades.sopg, null); assert.strictEqual(r.grades.sdpg, null);
});
t('missing data is never a grade (null, not 0/D/F)', () => {
  const r = S.compute({ pos: 'SS', sec: '2B', metrics: {} }, bench);
  ['opg', 'sopg'].forEach((k) => assert.strictEqual(r.grades[k], null, k));
});
t('regular position player still gets OPG and SOPG', () => {
  const r = S.compute({ pos: 'SS', sec: '2B', metrics }, bench);
  assert.ok(r.grades.opg != null && r.grades.sopg != null);
});
t('two-way non-pitcher primary: OPG/DPG/PPG yes, SOPG/SDPG Not Applicable', () => {
  const r = S.compute({ pos: '1B', sec: 'SS', twoWay: true, metrics }, bench);
  assert.ok(r.grades.opg != null && r.grades.dpg != null && r.grades.ppg != null);
  ['sopg', 'sdpg'].forEach((k) => { assert.strictEqual(r.grades[k], null); assert.ok(/^Not Applicable/.test(r.gradeWhy[k])); });
});
t('two-way via rolePref Yes behaves as two-way', () => {
  const r = S.compute({ pos: '1B', sec: 'SS', rolePref: { twoWay: 'Yes' }, metrics }, bench);
  assert.strictEqual(r.grades.sopg, null);
  assert.ok(r.grades.ppg != null);
});
t('two-way, pitcher primary, non-P secondary: OPG/DPG from the secondary, PPG, no SOPG/SDPG', () => {
  const r = S.compute({ pos: 'P', sec: '1B', twoWay: true, metrics }, bench);
  assert.ok(r.grades.opg != null && r.grades.dpg != null && r.grades.ppg != null);
  assert.strictEqual(r.hitPos, '1B');
  ['sopg', 'sdpg'].forEach((k) => assert.strictEqual(r.grades[k], null));
});
t('two-way, pitcher primary, no non-P position: OPG/DPG Not Rated, PPG present', () => {
  const r = S.compute({ pos: 'P', sec: '', twoWay: true, metrics }, bench);
  ['opg', 'dpg'].forEach((k) => { assert.strictEqual(r.grades[k], null); assert.ok(/^Not Rated/.test(r.gradeWhy[k])); });
  assert.ok(r.grades.ppg != null);
});
t('two-way, 1B primary, pitching selected as secondary: OPG/DPG/PPG', () => {
  const r = S.compute({ pos: '1B', sec: 'P', twoWay: true, metrics }, bench);
  assert.ok(r.grades.opg != null && r.grades.dpg != null && r.grades.ppg != null);
});
t('two-way, 1B primary, pitching not selected anywhere: OPG/DPG/PPG', () => {
  const r = S.compute({ pos: '1B', sec: '', rolePref: { twoWay: 'Yes' }, metrics }, bench);
  assert.ok(r.grades.opg != null && r.grades.dpg != null && r.grades.ppg != null);
});
t('regression: two-way 1B (6-4, 215, 60=6.9, EV 94/102, throw 94) is graded on v0.2 position benchmarks, not the sample pool', () => {
  const rec = { pos: '1B', twoWay: true, metrics: { ht: 76, wt: 215, t60: 6.9, tv: 94, avgEV: 94, maxEV: 102, avgFBV: 86, maxFBV: 90 } };
  // A weak pool must not change the grade: v0.2 thresholds are the only benchmark.
  const weak = []; for (let i = 0; i < 20; i++) weak.push({ pos: '1B', avgEV: 99, maxEV: 110, t60: 6.0, tv: 99 });
  [[], weak, bench].forEach((pool) => {
    const r = S.compute(rec, pool), L = (k) => global.window.TheReadBenchmarks.letterFor(r.gradeValue[k]);
    assert.strictEqual(L('opg'), 'A'); assert.strictEqual(L('dpg'), 'A');
    assert.ok(Math.abs(r.gradeValue.opg - 9.75) < 1e-9 && Math.abs(r.gradeValue.dpg - 9.75) < 1e-9);
    const o = r.breakdown.opg.map((c) => c.letter + '@' + c.weight).join(',');
    assert.strictEqual(o, 'A+@0.45,A+@0.3,A+@0.15,B-@0.1');
    assert.strictEqual(r.breakdown.dpg.map((c) => c.letter + '@' + c.weight).join(','), 'A+@0.45,A+@0.45,B-@0.1');
    assert.strictEqual(r.grades.sopg, null);
  });
});

t('missing Frame is re-weighted, never F/zero; missing core inputs are Not Rated', () => {
  const r = S.compute({ pos: '1B', metrics: { t60: 6.9, tv: 94, avgEV: 94, maxEV: 102 } }, []);
  assert.ok(Math.abs(r.gradeValue.opg - 10) < 1e-9 && Math.abs(r.gradeValue.dpg - 10) < 1e-9);
  const n = S.compute({ pos: '1B', metrics: { ht: 76, wt: 215 } }, []);
  assert.strictEqual(n.grades.opg, null); assert.strictEqual(n.grades.dpg, null);
});
console.log(n + ' tests passed');

const fs = require('fs');
const su = fs.readFileSync(__dirname + '/athlete-signup.js', 'utf8'), co = fs.readFileSync(__dirname + '/coach.js', 'utf8');
assert.ok(/twoWay === 'Yes'[\s\S]{0,200}filter\(function \(p\) \{ return p !== 'P'/.test(su), 'signup hides P for two-way');
assert.ok(/pos === 'P'\) bad\('sp\.' \+ x\.id \+ '\.pos', 'Two-way players need a non-pitcher/.test(su), 'signup rejects P primary for two-way');
assert.ok(/sec === 'P'\) bad\(/.test(su), 'signup rejects P secondary for two-way');
assert.ok(/rec\.twoWay && rec\.sport === 'Baseball'[\s\S]{0,120}rec\.pos === 'P'/.test(co), 'coach entry rejects P primary for two-way');
console.log('ok - two-way entry validation present');

{
  const ks = ['ht', 'wt', 't60', 'tv', 'avgEV', 'maxEV', 'avgFBV', 'maxFBV'], vv = {}; ks.forEach((k) => { vv[k] = { by: 'Demo Verifier (simulated)', method: 'Simulated demo verification' }; });
  const r = S.compute({ pos: '1B', twoWay: true, rolePref: { twoWay: 'Yes' }, metrics: { ht: 76, wt: 250, t60: 6.9, tv: 94, avgEV: 94, maxEV: 102, avgFBV: 86, maxFBV: 90 }, verified: vv }, []);
  assert.strictEqual(S.frame('1B', 76, 250).grade, 'A+', 'frame recomputes from 250 lb');
  const sp = r.inputs.filter((i) => i.key === 't60')[0];
  assert.ok(sp.scored && sp.credit === 1 && /Verified/.test(sp.status), '60 time scored from v0.2 benchmark when pool is thin');
  assert.ok(r.inputs.every((i) => i.simulated), 'simulated flag on every verified input');
  console.log('ok - verified demo seed, frame A+, 60 time falls back to v0.2 benchmark');
}
