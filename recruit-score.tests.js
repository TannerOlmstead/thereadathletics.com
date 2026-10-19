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
t('regression: two-way 1B (6-4, 215, 60=6.9, EV 94/102, throw 94) is graded on v0.5 benchmarks, not the sample pool', () => {
  const rec = { pos: '1B', twoWay: true, metrics: { ht: 76, wt: 215, t60: 6.9, tv: 94, avgEV: 94, maxEV: 102, avgFBV: 86, maxFBV: 90 } };
  // A weak pool must not change the grade: v0.2 thresholds are the only benchmark.
  const weak = []; for (let i = 0; i < 20; i++) weak.push({ pos: '1B', avgEV: 99, maxEV: 110, t60: 6.0, tv: 99 });
  [[], weak, bench].forEach((pool) => {
    const r = S.compute(rec, pool), L = (k) => global.window.TheReadBenchmarks.letterFor(r.gradeValue[k]);
    assert.strictEqual(L('opg'), 'B+'); assert.strictEqual(L('dpg'), 'A');
    assert.ok(Math.abs(r.gradeValue.opg - 8.925) < 1e-9 && Math.abs(r.gradeValue.dpg - 9.525) < 1e-9);
    const o = r.breakdown.opg.map((c) => c.letter + '@' + c.weight).join(',');
    assert.strictEqual(o, 'A-@0.45,A-@0.3,A@0.15,B-@0.1');
    assert.strictEqual(r.breakdown.dpg.map((c) => c.letter + '@' + c.weight).join(','), 'A+@0.45,A@0.45,B-@0.1');
    assert.strictEqual(r.grades.sopg, null);
  });
});

t('missing Frame is re-weighted, never F/zero; missing core inputs are Not Rated', () => {
  const r = S.compute({ pos: '1B', metrics: { t60: 6.9, tv: 94, avgEV: 94, maxEV: 102 } }, []);
  assert.ok(Math.abs(r.gradeValue.opg - 8.175 / 0.9) < 1e-9 && Math.abs(r.gradeValue.dpg - 8.775 / 0.9) < 1e-9);
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
  assert.ok(sp.scored && sp.credit === 1 && /Verified/.test(sp.status), '60 time scored from v0.5 benchmark when pool is thin');
  assert.ok(r.inputs.every((i) => i.simulated), 'simulated flag on every verified input');
  console.log('ok - verified demo seed, frame A+, 60 time scored from v0.5 benchmark');
}

{
  const BMc = global.window.TheReadBenchmarks, T = BMc.TABLES;
  assert.ok(/v0\.5/.test(BMc.GROUP) && BMc.RETIRED['THE READ Baseball Position Benchmarks v0.2'].status === 'Retired', 'v0.5 group live, v0.2 preserved as Retired');
  // MAX_EV is stored independently: v0.4 tables are not AVG_EV + constant in every cell, and gradeMetric never derives one from the other.
  assert.strictEqual(T.MAX_EV.rows[0][1], 106); assert.strictEqual(T.AVG_EV.rows[0][1], 98);
  const before = JSON.stringify(T.MAX_EV.rows); T.AVG_EV.rows[0][1] = 200; assert.strictEqual(BMc.gradeMetric('MAX_EV', '1B', 106).letter, 'A+', 'MAX_EV independent of AVG_EV'); T.AVG_EV.rows[0][1] = 98; assert.strictEqual(JSON.stringify(T.MAX_EV.rows), before);
  const expect = { AVG_EV: { C: [94, 91, 89, 88, 87, 86, 85, 84, 83, 80], '1B': [98, 95, 93, 92, 91, 90, 89, 88, 87, 84], '2B': [95, 92, 90, 89, 88, 87, 86, 85, 84, 81], '3B': [98, 95, 93, 92, 91, 90, 89, 88, 87, 84], SS: [96, 93, 91, 90, 89, 88, 87, 86, 85, 82], OF: [98, 95, 93, 92, 91, 90, 89, 88, 87, 84] } };
  // Boundary tests for every table and position: exact threshold = that grade, immediately worse = next grade, immediately worse than D = F.
  Object.keys(T).forEach((key) => {
    const t = T[key], step = t.lower ? 0.001 : 0.001, poss = t.positions || BMc.POSITIONS;
    poss.forEach((pos, c) => {
      const p = pos === 'P' ? null : pos;
      BMc.GRADES.forEach((g, i) => {
        const th = t.rows[i][c], gm = BMc.gradeMetric(key, p, th);
        assert.strictEqual(gm.letter, g, key + ' ' + pos + ' exact ' + g);
        const worse = t.lower ? th + step : th - step, next = BMc.GRADES[i + 1] || 'F';
        const wl = BMc.gradeMetric(key, p, worse).letter;
        const dup = i > 0 && t.rows[i - 1][c] === th;
        if (!dup) assert.strictEqual(wl, next, key + ' ' + pos + ' just worse than ' + g + ' = ' + wl);
      });
      [null, undefined, '', 'abc', NaN].forEach((bad) => assert.strictEqual(BMc.gradeMetric(key, p, bad), null, key + ' invalid is Not Rated'));
      assert.strictEqual(BMc.gradeMetric(key, p, -1), null, key + ' negative is Not Rated, never F');
    });
  });
  Object.keys(expect.AVG_EV).forEach((pos) => expect.AVG_EV[pos].forEach((v, i) => assert.strictEqual(T.AVG_EV.rows[i][BMc.POSITIONS.indexOf(pos)], v, 'AVG_EV ' + pos + ' row ' + i)));
  // Section 35 sixty-yard list.
  [['C', 6.85, 'A+', 6.851, 'A', 7.05, 'A', 7.051, 'A-', 8.0, 'D', 8.001, 'F'], ['1B', 6.85, 'A+', 6.851, 'A', 7.05, 'A', 7.051, 'A-', 8.0, 'D', 8.001, 'F'], ['2B', 6.5, 'A+', 6.501, 'A', 6.7, 'A', 6.701, 'A-', 7.7, 'D', 7.701, 'F'], ['3B', 6.65, 'A+', 6.651, 'A', 6.85, 'A', 6.851, 'A-', 7.85, 'D', 7.851, 'F'], ['SS', 6.5, 'A+', 6.501, 'A', 6.7, 'A', 6.701, 'A-', 7.7, 'D', 7.701, 'F'], ['OF', 6.45, 'A+', 6.451, 'A', 6.65, 'A', 6.651, 'A-', 7.65, 'D', 7.651, 'F']].forEach((r) => { for (let k = 1; k < r.length; k += 2) assert.strictEqual(BMc.gradeMetric('SIXTY_TIME', r[0], r[k]).letter, r[k + 1], '60 ' + r[0] + ' ' + r[k]); });
  // Full precision: SS 7.701 displays as 7.70 but grades F.
  assert.strictEqual((7.701).toFixed(2), '7.70'); assert.strictEqual(BMc.gradeMetric('SIXTY_TIME', 'SS', 7.701).letter, 'F');
  assert.strictEqual(BMc.gradeMetric('AVG_EV', '1B', 92.96).letter, 'B+', 'rounds to 93.0 for display but grades B+');
  // Pop time, FBV, pitcher exclusion, unsupported positions, LF/CF/RF do not exist.
  assert.strictEqual(BMc.gradeMetric('POP_TIME', 'C', 1.82).letter, 'A+'); assert.strictEqual(BMc.gradeMetric('POP_TIME', 'C', 2.351).letter, 'F'); assert.strictEqual(BMc.gradeMetric('POP_TIME', '1B', 1.9), null);
  assert.strictEqual(BMc.gradeMetric('AVG_EV', 'P', 99), null, 'pitchers do not use position-player tables'); assert.strictEqual(BMc.gradeMetric('THROW_VELO', 'P', 90), null);
  assert.strictEqual(BMc.gradeMetric('AVG_FBV', 'P', 94.9).letter, 'A'); assert.strictEqual(BMc.gradeMetric('AVG_FBV', 'P', 95).letter, 'A+'); assert.strictEqual(BMc.gradeMetric('MAX_FBV', 'P', 97.9).letter, 'A'); assert.strictEqual(BMc.gradeMetric('MAX_FBV', 'P', 77.9).letter, 'F');
  ['DH', 'UT', 'LF', 'CF', 'RF'].forEach((p) => assert.strictEqual(BMc.gradeMetric('AVG_EV', p, 95), null, p + ' has no table'));
  // Comparison helper: seed 1B existing (v0.2) vs proposed (v0.5).
  const cmp = BMc.compare('1B', { AVG_EV: 94, MAX_EV: 102, SIXTY_TIME: 6.9, THROW_VELO: 94 }).map((c) => c.metric + ':' + c.existing + '>' + c.proposed).join(' ');
  assert.strictEqual(cmp, 'AVG_EV:A+>A- MAX_EV:A+>A- SIXTY_TIME:A+>A THROW_VELO:A+>A+');
  assert.ok(/Progressive Tier Spacing/.test(BMc.PROVISIONAL_TEXT) && BMc.PROVISIONAL_LABEL === 'Provisional Benchmark');
  console.log('ok - v0.5 tables: boundaries for all tables/positions, MAX_EV independent, v0.2 retired; ' + cmp);
}

{
  const seed = { pos: '1B', twoWay: true, rolePref: { twoWay: 'Yes' }, metrics: { ht: 76, wt: 250, t60: 6.9, tv: 94, avgEV: 94, maxEV: 102, avgFBV: 90, maxFBV: 93 } };
  const huge = []; for (let i = 0; i < 50; i++) huge.push({ pos: '1B', avgEV: 110, maxEV: 125, t60: 6.0, tv: 99 });
  const a = S.compute(seed, []), b = S.compute(seed, huge);
  assert.strictEqual(a.rs, b.rs, 'Recruit Score must not depend on the Master Database pool');
  assert.ok(Math.abs(a.rs - 91.75) < 1e-9, 'seed two-way 1B on v0.5 tables is 91.75 (Gold), got ' + a.rs);
  assert.deepStrictEqual(a.comps.map((c) => c.letter), ['A-', 'A-', 'A', 'A+']);
  assert.deepStrictEqual(a.comps.map((c) => c.pts), [90, 90, 95, 100], 'grade value x 10');
  assert.ok(/v0\.4/.test(a.comps[0].detail) && /Provisional/.test(a.comps[0].detail), 'benchmark source in detail');
  const TRCs = { renderTierBadge: () => 'tier', renderConfidenceBadge: () => 'conf', formatConfidencePercentage: () => '100%', renderGrade: () => 'g' };
  const ph = S.panel(a, TRCs); assert.ok(/Benchmark Grade/.test(ph) && !/percentile|same-position players/i.test(ph + S.ASSUMPTIONS.join(' ')), 'panel shows benchmark grade; no pool-percentile text');
  const blank = S.compute({ pos: '', metrics: { avgEV: 94, maxEV: 102, t60: 6.9 } }, []); assert.strictEqual(blank.rs, null, 'no position: Benchmark Missing, not zero');
  const w = S.compute({ pos: 'SS', metrics: { avgEV: 88, maxEV: 96, t60: 7.0, ht: 72, wt: 185 } }, []); assert.ok(w.rs != null, 'SS scored');
  console.log('ok - Recruit Score uses v0.5 benchmarks (seed ' + a.rs.toFixed(1) + ' Gold), pool-independent, blank position Benchmark Missing');
}

const fsx = require('fs'), BAD = /\b(LF|CF|RF|DH|UT|DH\/UT|DP\/FLEX)\b/;
['sports-config.js', 'sport-guide.html'].forEach((f) => assert.ok(!BAD.test(fsx.readFileSync(__dirname + '/' + f, 'utf8')), f + ' still mentions LF/CF/RF/DH/UT'));
console.log('ok - no LF/CF/RF/DH/UT in source position lists');

{ const { JSDOM } = require(process.env.JSDOM_PATH || 'jsdom'); const d = new JSDOM('<body></body>', { runScripts: 'outside-only', url: 'http://localhost/' }); d.window.eval(fsx.readFileSync(__dirname + '/athlete-signup.js', 'utf8')); const mp = d.window.TheReadAthlete.migratePositions; assert.strictEqual(mp({ pos: 'LF' }).pos, 'OF'); assert.strictEqual(mp({ pos: 'RF' }).pos, 'OF'); assert.strictEqual(mp({ pos: 'DH', sec: 'SS' }).pos, 'SS'); assert.ok(!mp({ pos: 'UT' }).pos, 'UT with no listed position becomes blank'); assert.deepStrictEqual(d.window.TheReadAthlete.PREF_POS || ['C','1B','2B','3B','SS','OF'], ['C','1B','2B','3B','SS','OF']); console.log('ok - stored LF/CF/RF migrate to OF; DH/UT to a listed secondary or blank'); }
