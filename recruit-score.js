/* THE READ Recruit Score calculator for athlete-created baseball entries. Pure functions, no invented data.
   Sources: workbook Build Notes (weights), Architecture (velocity policy, confidence tiers), Grade Tables (Frame Score).
   Design choices the workbook leaves open are listed in ASSUMPTIONS and shown on the athlete profile. */
(function () {
  'use strict';
  /* Grade Tables copied from The READ Formulas For Website Reference.xlsx (Grade Tables sheet). Rows: [grade, minH, maxH, minW, maxW]. */
  var FRAME_TABLES = {"Pitcher":[["F",0,71,0,999],["D",72,73,150,180],["C-",72,74,170,195],["C",73,75,180,210],["C+",74,76,190,220],["B-",74,77,200,230],["B",75,78,210,240],["B+",75,79,220,250],["A-",76,80,225,260],["A",76,81,235,270],["A+",77,83,245,280]],"Catcher":[["F",0,69,0,999],["D",70,71,170,190],["C-",70,72,180,200],["C",71,73,190,210],["C+",71,74,195,215],["B-",72,75,200,220],["B",72,76,205,225],["B+",72,76,210,230],["A-",73,76,215,235],["A",73,76,220,240],["A+",74,76,225,245]],"1B":[["F",0,71,0,999],["D",72,73,180,205],["C-",72,74,190,215],["C",73,75,200,225],["C+",73,76,210,235],["B-",74,77,215,240],["B",74,78,220,245],["B+",74,78,225,250],["A-",75,78,230,255],["A",75,79,235,260],["A+",74,80,240,265]],"2B":[["F",0,67,0,999],["D",68,69,150,170],["C-",69,70,160,175],["C",69,71,170,185],["C+",70,72,175,190],["B-",70,73,180,195],["B",71,74,185,200],["B+",71,74,190,205],["A-",72,74,195,210],["A",72,74,200,215],["A+",71,74,205,220]],"3B":[["F",0,70,0,999],["D",71,72,170,190],["C-",71,73,180,200],["C",72,74,190,210],["C+",72,75,200,220],["B-",73,76,205,225],["B",73,77,210,230],["B+",73,77,215,235],["A-",74,77,220,240],["A",74,78,225,245],["A+",73,78,230,250]],"SS":[["F",0,68,0,999],["D",69,70,155,170],["C-",69,71,165,180],["C",70,72,175,190],["C+",70,73,180,195],["B-",71,74,185,200],["B",71,74,190,205],["B+",71,75,195,210],["A-",72,75,200,215],["A",72,75,205,220],["A+",71,75,210,225]],"OF":[["F",0,70,0,999],["D",71,72,165,185],["C-",71,73,175,195],["C",72,74,185,205],["C+",72,75,190,210],["B-",73,76,195,220],["B",73,77,205,225],["B+",73,78,210,230],["A-",74,78,215,235],["A",74,79,220,240],["A+",74,80,225,245]]};
  var FRAME_SCORE = {"F":1,"D":3,"C-":5,"C":6,"C+":7,"B-":7.5,"B":8,"B+":8.5,"A-":9,"A":9.5,"A+":10};
  var MIN_BENCH = 5;
  var ASSUMPTIONS = [
    'Weights come from the workbook: position players use Avg EV 45%, Max EV 30%, Position-Adjusted Speed 15%, Frame Score 10%. Pitchers use Avg FBV 40%, Max FBV 30%, Frame Score 30%. Speed does not apply to pitchers.',
    'The workbook does not say how a raw number becomes a 0-100 component score. Here each metric is scored as its percentile among players at the same position in the Master Database (the workbook says benchmarks come from the Master Database and speed is compared with players at the same position). At least ' + MIN_BENCH + ' benchmark players are required, otherwise that component is left out and never set to zero. For exit velocity only, if fewer than ' + MIN_BENCH + ' same-position players exist, all non-pitcher players are used and the panel says so. Speed always uses the same position.',
    'Frame Score (1-10) comes from the position Grade Table: the highest grade whose height and weight ranges both match, else F. It is multiplied by 10 to sit on the 0-100 scale. Positions without a Grade Table (DH/UT) have no Frame Score.',
    'Velocity policy from the workbook: if only Avg exists it is used for Avg and Max; if only Max exists it is used for both.',
    'Missing components are left out and the remaining weights are re-scaled to 100% (workbook rule: reweight when data is missing). At least one exit velocity (hitters) or one fastball velocity (pitchers) is required, otherwise the result is Not Rated.',
    'The workbook leaves "how many metrics are expected" open. Confidence % = metric credit / expected metrics. Hitters expect Avg EV, Max EV, 60 Time, Height, Weight. Pitchers expect Avg FBV, Max FBV, Height, Weight. A verified metric counts 1, a self-reported metric counts 0.5. Confidence never changes the Recruit Score.',
    'GPA and every other non-baseball input are never used.'
  ];
  var round1 = function (n) { return Math.round(n * 10) / 10; };
  var num = function (v) { return v == null || v === '' || isNaN(Number(v)) ? null : Number(v); };

  var frame = function (pos, ht, wt) {
    var tab = FRAME_TABLES[pos === 'P' ? 'Pitcher' : pos === 'C' ? 'Catcher' : pos], h = num(ht), w = num(wt);
    if (!tab) return { why: 'No Grade Table for position ' + pos };
    if (h == null || w == null) return { why: 'Height and weight are both needed' };
    for (var i = tab.length - 1; i >= 1; i--) {
      var r = tab[i];
      if (h >= r[1] && h <= r[2] && w >= r[3] && w <= r[4]) return { grade: r[0], score: FRAME_SCORE[r[0]], pts: FRAME_SCORE[r[0]] * 10 };
    }
    return { grade: 'F', score: FRAME_SCORE.F, pts: FRAME_SCORE.F * 10 };
  };

  // bench: array of {pos, avgEV, maxEV, t60, avgFBV, maxFBV}; higher better except t60.
  var pct = function (bench, pos, key,   v, lower, allPos) {
      var vals = bench.filter(function (b) { return b.pos === pos && num(b[key]) != null; }).map(function (b) { return Number(b[key]); }), same = vals.length, wide = false;
      if (vals.length < MIN_BENCH && allPos) { vals = bench.filter(function (b) { return b.pos !== 'P' && num(b[key]) != null; }).map(function (b) { return Number(b[key]); }); wide = true; }
      if (vals.length < MIN_BENCH) return { why: 'Only ' + same + ' ' + pos + ' benchmark players have this metric (need ' + MIN_BENCH + ')' };
    var below = 0, eq = 0;
    vals.forEach(function (x) { if (x === v) eq++; else if (lower ? x > v : x < v) below++; });
    return { pts: (below + eq / 2) / vals.length * 100, n: vals.length, wide: wide };
  };

  var compute = function (rec, bench) {
    var pos = rec.pos, m = rec.metrics || {}, ver = rec.verified || {}, isP = pos === 'P';
    var out = { pos: pos, isP: isP, assumptions: ASSUMPTIONS, comps: [], inputs: [], rs: null, conf: null, needed: [] };
    var get = function (k) { return num(m[k]); };
    var avgEV = get('avgEV'), maxEV = get('maxEV'), avgFB = get('avgFBV'), maxFB = get('maxFBV');
    if (!isP) { if (avgEV == null && maxEV != null) avgEV = maxEV; if (maxEV == null && get('avgEV') != null) maxEV = get('avgEV'); }
    else { if (avgFB == null && maxFB != null) avgFB = maxFB; if (maxFB == null && get('avgFBV') != null) maxFB = get('avgFBV'); }
    var expected = isP ? [['avgFBV', 'Avg Fastball Velocity'], ['maxFBV', 'Max Fastball Velocity'], ['ht', 'Height'], ['wt', 'Weight']] : [['avgEV', 'Avg Exit Velocity'], ['maxEV', 'Max Exit Velocity'], ['t60', '60-Yard Time'], ['ht', 'Height'], ['wt', 'Weight']];
    var credit = 0;
    expected.forEach(function (e) {
      var has = get(e[0]) != null, v = !!ver[e[0]];
      out.inputs.push({ key: e[0], label: e[1], value: get(e[0]), status: !has ? 'Missing' : v ? 'Verified' : 'Self-Reported' });
      if (has) credit += v ? 1 : 0.5; else out.needed.push(e[1]);
    });
    out.conf = credit > 0 ? round1(credit / expected.length * 100) : null;
    var add = function (label, weight, r, detail) { out.comps.push({ label: label, weight: weight, pts: r.pts == null ? null : r.pts, detail: r.pts == null ? r.why : detail + (r.n ? (r.wide ? ' (fewer than ' + MIN_BENCH + ' same-position players, so all ' + r.n + ' non-pitcher players were used)' : ' (' + r.n + ' players)') : '') }); };
    var b = bench || [];
    if (isP) {
      add('Avg Fastball Velocity', 40, avgFB == null ? { why: 'Not entered' } : pct(b, pos, 'avgFBV', avgFB), avgFB + ' mph vs ' + pos + ' benchmarks');
      add('Max Fastball Velocity', 30, maxFB == null ? { why: 'Not entered' } : pct(b, pos, 'maxFBV', maxFB), maxFB + ' mph vs ' + pos + ' benchmarks');
      var fp = frame(pos, m.ht, m.wt); add('Frame Score', 30, fp, fp.grade ? 'Grade ' + fp.grade + ', Frame Score ' + fp.score + ' of 10' : fp.why);
    } else {
      add('Avg Exit Velocity', 45, avgEV == null ? { why: 'Not entered' } : pct(b, pos, 'avgEV', avgEV, false, true), avgEV + ' mph vs ' + pos + ' benchmarks');
      add('Max Exit Velocity', 30, maxEV == null ? { why: 'Not entered' } : pct(b, pos, 'maxEV', maxEV, false, true), maxEV + ' mph vs ' + pos + ' benchmarks');
      var t = get('t60'); add('Position-Adjusted Speed (60 Time)', 15, t == null ? { why: 'Not entered' } : pct(b, pos, 't60', t, true), t + ' sec vs ' + pos + ' benchmarks (lower is better)');
      var fh = frame(pos, m.ht, m.wt); add('Frame Score', 10, fh, fh.grade ? 'Grade ' + fh.grade + ', Frame Score ' + fh.score + ' of 10' : fh.why);
    }
    var core = out.comps.slice(0, isP ? 2 : 2).some(function (c) { return c.pts != null; });
    var used = out.comps.filter(function (c) { return c.pts != null; }), wsum = used.reduce(function (a, c) { return a + c.weight; }, 0);
    out.comps.forEach(function (c) { c.used = c.pts != null; c.scaled = c.used ? c.weight / wsum * 100 : null; c.contrib = c.used ? c.pts * c.weight / wsum : null; });
    if (core) {
      out.rs = used.reduce(function (a, c) { return a + c.contrib; }, 0);
      out.rsShown = round1(out.rs);
    } else {
      out.needed = out.needed.filter(function (n) { return true; });
      out.reason = isP ? 'Needs Avg or Max Fastball Velocity, and enough ' + pos + ' benchmark players.' : 'Needs Avg or Max Exit Velocity, and enough ' + pos + ' benchmark players.';
    }
    return out;
  };

  // Step-by-step panel HTML.
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var panel = function (r, TRC) {
    var h = '<h3>Inputs Used</h3><div class="table-wrap"><table><thead><tr><th scope="col">Metric</th><th scope="col">Value</th><th scope="col">Status</th></tr></thead><tbody>' +
      r.inputs.map(function (i) { return '<tr><th scope="row">' + esc(i.label) + '</th><td>' + (i.value == null ? 'Not Provided' : esc(i.value)) + '</td><td>' + esc(i.status) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    h += '<h3>Component Scores And Weights</h3><div class="table-wrap"><table><thead><tr><th scope="col">Component</th><th scope="col">Workbook Weight</th><th scope="col">Component Score (0-100)</th><th scope="col">Weight Used</th><th scope="col">Points</th></tr></thead><tbody>' +
      r.comps.map(function (c) { return '<tr><th scope="row">' + esc(c.label) + '<br /><span class="muted">' + esc(c.detail) + '</span></th><td>' + c.weight + '%</td><td>' + (c.used ? round1(c.pts) : 'Not Available') + '</td><td>' + (c.used ? round1(c.scaled) + '%' : '&ndash;') + '</td><td>' + (c.used ? round1(c.contrib) : '&ndash;') + '</td></tr>'; }).join('') + '</tbody></table></div>';
    if (r.rs == null) {
      h += '<p><strong>Result: Not Rated.</strong> ' + esc(r.reason) + ' Nothing is estimated or set to zero.</p>';
    } else {
      h += '<p><strong>Recruit Score = sum of points = ' + r.rsShown.toFixed(1) + '</strong> (unrounded ' + r.rs.toFixed(4) + '). Tier is chosen from the unrounded value: ' + TRC.renderTierBadge(r.rs) + '</p>';
    }
    h += r.conf == null ? '<p><strong>Confidence: Unknown.</strong> No metrics entered.</p>' : '<p><strong>Confidence = ' + r.conf.toFixed(1) + '%</strong> ' + TRC.renderConfidenceBadge(r.conf) + ' (metric credit divided by expected metrics; verified = 1, self-reported = 0.5).</p>';
    if (r.needed.length) h += '<p><strong>Metrics Still Needed To Raise Confidence:</strong> ' + r.needed.map(esc).join(', ') + '.</p>';
    h += '<details><summary>Assumptions And Open Questions</summary><ul>' + r.assumptions.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul></details>';
    return h;
  };

  window.TheReadScore = { compute: compute, panel: panel, frame: frame, ASSUMPTIONS: ASSUMPTIONS, MIN_BENCH: MIN_BENCH };
})();
