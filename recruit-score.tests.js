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

t('pitcher-primary two-way: no OPG/DPG/SOPG/SDPG, PPG present', () => {
  const r = S.compute({ pos: 'P', sec: 'SS', twoWay: true, metrics }, bench);
  ['opg', 'dpg', 'sopg', 'sdpg'].forEach((k) => { assert.strictEqual(r.grades[k], null, k); assert.ok(/^Not Applicable/.test(r.gradeWhy[k]), k); });
  assert.ok(r.grades.ppg != null);
});
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
console.log(n + ' tests passed');
