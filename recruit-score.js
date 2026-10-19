/* THE READ Recruit Score calculator for athlete-created baseball entries. Pure functions, no invented data.
   Sources: workbook Build Notes (weights), Architecture (velocity policy, confidence tiers), Grade Tables (Frame Score).
   Design choices the workbook leaves open are listed in ASSUMPTIONS and shown on the athlete profile. */
(function () {
  'use strict';
  /* Grade Tables copied from The READ Formulas For Website Reference.xlsx (Grade Tables sheet). Rows: [grade, minH, maxH, minW, maxW]. */
  var FRAME_TABLES = {"Pitcher":[["F",0,71,0,999],["D",72,73,150,180],["C-",72,74,170,195],["C",73,75,180,210],["C+",74,76,190,220],["B-",74,77,200,230],["B",75,78,210,240],["B+",75,79,220,250],["A-",76,80,225,260],["A",76,81,235,270],["A+",77,83,245,280]],"Catcher":[["F",0,69,0,999],["D",70,71,170,190],["C-",70,72,180,200],["C",71,73,190,210],["C+",71,74,195,215],["B-",72,75,200,220],["B",72,76,205,225],["B+",72,76,210,230],["A-",73,76,215,235],["A",73,76,220,240],["A+",74,76,225,245]],"1B":[["F",0,71,0,999],["D",72,73,180,205],["C-",72,74,190,215],["C",73,75,200,225],["C+",73,76,210,235],["B-",74,77,215,240],["B",74,78,220,245],["B+",74,78,225,250],["A-",75,78,230,255],["A",75,79,235,260],["A+",74,80,240,265]],"2B":[["F",0,67,0,999],["D",68,69,150,170],["C-",69,70,160,175],["C",69,71,170,185],["C+",70,72,175,190],["B-",70,73,180,195],["B",71,74,185,200],["B+",71,74,190,205],["A-",72,74,195,210],["A",72,74,200,215],["A+",71,74,205,220]],"3B":[["F",0,70,0,999],["D",71,72,170,190],["C-",71,73,180,200],["C",72,74,190,210],["C+",72,75,200,220],["B-",73,76,205,225],["B",73,77,210,230],["B+",73,77,215,235],["A-",74,77,220,240],["A",74,78,225,245],["A+",73,78,230,250]],"SS":[["F",0,68,0,999],["D",69,70,155,170],["C-",69,71,165,180],["C",70,72,175,190],["C+",70,73,180,195],["B-",71,74,185,200],["B",71,74,190,205],["B+",71,75,195,210],["A-",72,75,200,215],["A",72,75,205,220],["A+",71,75,210,225]],"OF":[["F",0,70,0,999],["D",71,72,165,185],["C-",71,73,175,195],["C",72,74,185,205],["C+",72,75,190,210],["B-",73,76,195,220],["B",73,77,205,225],["B+",73,78,210,230],["A-",74,78,215,235],["A",74,79,220,240],["A+",74,80,225,245]]};
  var FRAME_SCORE = {"F":1,"D":3,"C-":5,"C":6,"C+":7,"B-":7.5,"B":8,"B+":8.5,"A-":9,"A":9.5,"A+":10};
  /* Max FBV grade table supplied by the owner (not in the workbook). Rows: [min mph, letter, grade value], highest first. A band is >= its min and < the next band's min, tested on the unrounded mph. */
  var MAX_FBV_BANDS = [[95,'A+',10],[92,'A',9.5],[89,'A-',9],[86,'B+',8.5],[83,'B',8],[80,'B-',7.5],[77,'C+',7],[74,'C',6],[71,'C-',5],[68,'D',3],[0,'F',1]];
  /* Avg FBV grade table supplied by the owner. Same band rule as Max FBV. */
  var AVG_FBV_BANDS = [[92,'A+',10],[89,'A',9.5],[86,'A-',9],[83,'B+',8.5],[80,'B',8],[77,'B-',7.5],[74,'C+',7],[71,'C',6],[68,'C-',5],[65,'D',3],[0,'F',1]];
  var MIN_BENCH = 5;
  var SELF_CREDIT = 0.25;
  var ASSUMPTIONS = [
    'Weights come from the workbook: position players use Avg EV 45%, Max EV 30%, Position-Adjusted Speed 15%, Frame Score 10%. Pitchers use Avg FBV 40%, Max FBV 30%, Frame Score 30%. Speed does not apply to pitchers.',
    'The workbook does not say how a raw number becomes a 0-100 component score. Here each metric is scored as its percentile among players at the same position in the Master Database (the workbook says benchmarks come from the Master Database and speed is compared with players at the same position). At least ' + MIN_BENCH + ' benchmark players are required, otherwise that component is left out and never set to zero. For exit velocity only, if fewer than ' + MIN_BENCH + ' same-position players exist, all non-pitcher players are used and the panel says so. Speed always uses the same position.',
    'Frame Score (1-10) comes from the position Grade Table: the highest grade whose height and weight ranges both match, else F. It is multiplied by 10 to sit on the 0-100 scale. Positions without a Grade Table (DH/UT) have no Frame Score.',
    'Velocity policy from the workbook: if only Avg exists it is used for Avg and Max; if only Max exists it is used for both.',
    'Missing components are left out and the remaining weights are re-scaled to 100% (workbook rule: reweight when data is missing). At least one exit velocity (hitters) or one fastball velocity (pitchers) is required, otherwise the result is Not Rated.',
    'Role parity: Confidence counts only the metrics REQUIRED for the player role (REQUIRED config above). Pitcher Only (PO): pitching set. Hitter: hitting/speed/frame set. Two-Way: both sets, each counted fully and averaged. The weights in every set sum to 100, so no role is easier or harder to reach 100%. An input that cannot be scored (for example too few benchmark players) earns no Confidence, so Confidence is never 100% while Recruit Score components are missing.',
    'Projection grades (provisional, final workbook weights are an open question): OPG = Avg EV 45 / Max EV 30 percentiles re-scaled; SOPG = the same against secondary-position benchmarks; DPG = Frame Score 50 / Throwing Velocity percentile 50; SDPG = same at the secondary position; PPG = Avg FBV 40 / Max FBV 30 / Frame 30 (owner tables); Athletic Score = 60 Time percentile 40 / Throwing Velocity percentile 30 / Frame Score 30. All on 0-100, shown as letters via the Universal Grade Conversion table. Missing parts are left out, never zeroed; no inputs means Not Rated.',
    'Confidence % = weighted share of Recruit Score inputs that are verified. Each input is weighted by its share of the score: hitters Avg EV 45, Max EV 30, 60 Time 15, Height 5, Weight 5 (Frame Score 10 split between height and weight); pitchers Avg FBV 40, Max FBV 30, Height 15, Weight 15. Each input must be verified individually. A verified input earns its full weight, a self-reported input earns 25% of its weight (documented choice, easy to change: SELF_CREDIT), a missing input earns 0. Confidence never changes the Recruit Score or Tier.',
    'Pitching Potential Grade: Avg FBV (40%) and Max FBV (30%) are graded with the owner-supplied tables (Avg: A+ at 92.0 mph and up down to F below 65.0; Max: A+ at 95.0 and up down to F below 68.0), using the unrounded mph; grade value times 10 is the component score. Frame Score is 30%. A missing component is left out and the others re-scaled, never zeroed.',
    'GPA and every other non-baseball input are never used.'
  ];
  var round1 = function (n) { return Math.round(n * 10) / 10; };
  var num = function (v) { return v == null || v === '' || isNaN(Number(v)) ? null : Number(v); };

  var getMaxFBVGrade = function (maxFBV) {
    var v = maxFBV == null || maxFBV === '' ? NaN : Number(maxFBV);
    if (!isFinite(v)) return { letterGrade: null, gradeValue: null, status: 'Missing' };
    if (v < 0) throw new RangeError('Max FBV cannot be negative.');
    for (var i = 0; i < MAX_FBV_BANDS.length; i++) if (v >= MAX_FBV_BANDS[i][0]) return { letterGrade: MAX_FBV_BANDS[i][1], gradeValue: MAX_FBV_BANDS[i][2], status: 'Graded' };
  };
  var getAvgFBVGrade = function (avgFBV) {
    var v = avgFBV == null || avgFBV === '' ? NaN : Number(avgFBV);
    if (!isFinite(v)) return { letterGrade: null, gradeValue: null, status: 'Missing' };
    if (v < 0) throw new RangeError('Avg FBV cannot be negative.');
    for (var i = 0; i < AVG_FBV_BANDS.length; i++) if (v >= AVG_FBV_BANDS[i][0]) return { letterGrade: AVG_FBV_BANDS[i][1], gradeValue: AVG_FBV_BANDS[i][2], status: 'Graded' };
  };
  var avgFbvGrade = function (mph) {
    try { var g = getAvgFBVGrade(mph); } catch (e) { return { error: e.message }; }
    return g.letterGrade ? { grade: g.letterGrade, score: g.gradeValue, pts: g.gradeValue * 10 } : { none: true, why: 'Avg FBV not entered' };
  };
  var maxFbvGrade = function (mph) {
    try { var g = getMaxFBVGrade(mph); } catch (e) { return { error: e.message }; }
    return g.letterGrade ? { grade: g.letterGrade, score: g.gradeValue, pts: g.gradeValue * 10 } : { none: true, why: 'Max FBV not entered' };
  };

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

  /* Required Confidence metrics per role (one shared config). Each set's weights sum to 100, so Pitcher-Only, Hitter and Two-Way players
     have the same rigor: Confidence = verified share of the metrics REQUIRED for that role. Two-Way counts both sets fully (average of the two). */
  var REQUIRED = {
    hit: [['avgEV', 'Avg Exit Velocity', 45], ['maxEV', 'Max Exit Velocity', 30], ['t60', '60-Yard Time', 15], ['ht', 'Height', 5], ['wt', 'Weight', 5]],
    pit: [['avgFBV', 'Avg Fastball Velocity', 40], ['maxFBV', 'Max Fastball Velocity', 30], ['ht', 'Height', 15], ['wt', 'Weight', 15]]
  };
  var ROLE_SETS = { Hitter: ['hit'], PO: ['pit'], TwoWay: ['hit', 'pit'] };
  var ROLE_LABEL = { Hitter: 'Hitter', PO: 'Pitcher Only (PO)', TwoWay: 'Two-Way' };
  var roleOf = function (rec) {
    var tw = rec.twoWay === true || !!(rec.rolePref && rec.rolePref.twoWay === 'Yes');
    return tw ? 'TwoWay' : rec.pos === 'P' ? 'PO' : 'Hitter';
  };
  var reweight = function (parts) {
    var used = parts.filter(function (x) { return x.pts != null; }), w = used.reduce(function (a, x) { return a + x.w; }, 0);
    return used.length ? used.reduce(function (a, x) { return a + x.pts * x.w / w; }, 0) : null;
  };

  var compute = function (rec, bench) {
    var pos = rec.pos, m = rec.metrics || {}, ver = rec.verified || {}, role = roleOf(rec), isP = pos === 'P';
    var out = { pos: pos, isP: isP, role: role, roleLabel: ROLE_LABEL[role], assumptions: ASSUMPTIONS, comps: [], inputs: [], rs: null, conf: null, needed: [], grades: {}, gradeWhy: {} };
    var b = bench || [];
    var get = function (k) { return num(m[k]); };
    var avgEV = get('avgEV'), maxEV = get('maxEV'), avgFB = get('avgFBV'), maxFB = get('maxFBV');
    if (avgEV == null && maxEV != null) avgEV = maxEV; if (maxEV == null && get('avgEV') != null) maxEV = get('avgEV');
    if (avgFB == null && maxFB != null) avgFB = maxFB; if (maxFB == null && get('avgFBV') != null) maxFB = get('avgFBV');
    var add = function (list, label, weight, r, detail) { list.push({ label: label, weight: weight, pts: r.pts == null ? null : r.pts, detail: r.pts == null ? r.why : detail + (r.n ? (r.wide ? ' (fewer than ' + MIN_BENCH + ' same-position players, so all ' + r.n + ' non-pitcher players were used)' : ' (' + r.n + ' players)') : '') }); };
    var side = function (kind) {
      var comps = [], fp;
      if (kind === 'pit') {
        var ag = avgFbvGrade(avgFB); add(comps, 'Avg Fastball Velocity', 40, ag.grade ? ag : { why: ag.error || ag.why }, ag.grade ? avgFB + ' mph = grade ' + ag.grade + ', grade value ' + ag.score + ' of 10 (Avg FBV table)' : '');
        var mg = maxFbvGrade(maxFB); add(comps, 'Max Fastball Velocity', 30, mg.grade ? mg : { why: mg.error || mg.why }, mg.grade ? maxFB + ' mph = grade ' + mg.grade + ', grade value ' + mg.score + ' of 10 (Max FBV table)' : '');
        fp = frame('P', m.ht, m.wt); add(comps, 'Frame Score', 30, fp, fp.grade ? 'Grade ' + fp.grade + ', Frame Score ' + fp.score + ' of 10' : fp.why);
      } else {
        add(comps, 'Avg Exit Velocity', 45, avgEV == null ? { why: 'Not entered' } : pct(b, pos, 'avgEV', avgEV, false, true), avgEV + ' mph vs ' + pos + ' benchmarks');
        add(comps, 'Max Exit Velocity', 30, maxEV == null ? { why: 'Not entered' } : pct(b, pos, 'maxEV', maxEV, false, true), maxEV + ' mph vs ' + pos + ' benchmarks');
        var t = get('t60'); add(comps, 'Position-Adjusted Speed (60 Time)', 15, t == null ? { why: 'Not entered' } : pct(b, pos, 't60', t, true), t + ' sec vs ' + pos + ' benchmarks (lower is better)');
        fp = frame(pos, m.ht, m.wt); add(comps, 'Frame Score', 10, fp, fp.grade ? 'Grade ' + fp.grade + ', Frame Score ' + fp.score + ' of 10' : fp.why);
      }
      var idx = kind === 'pit' ? { avgFBV: 0, maxFBV: 1, ht: 2, wt: 2 } : { avgEV: 0, maxEV: 1, t60: 2, ht: 3, wt: 3 };
      var credit = 0, inputs = [];
      REQUIRED[kind].forEach(function (e) {
        var has = get(e[0]) != null, v = !!ver[e[0]], scored = has && comps[idx[e[0]]].pts != null, cr = !has ? 0 : !scored ? 0 : v ? 1 : SELF_CREDIT, w = e[2];
        inputs.push({ key: e[0], label: e[1] + (role === 'TwoWay' ? (kind === 'pit' ? ' (Pitching Set)' : ' (Hitting Set)') : ''), value: get(e[0]), status: !has ? 'Missing' : v ? 'Verified' : 'Self-Reported', scored: scored, weight: w, credit: cr, earned: round1(w * cr), gain: round1(w * (1 - cr)), blocked: has && !scored });
        credit += w * cr;
      });
      return { comps: comps, inputs: inputs, credit: credit };
    };
    var sides = ROLE_SETS[role].map(side), primary = sides[role === 'TwoWay' ? (isP ? 1 : 0) : 0];
    if (role === 'TwoWay' && isP) primary = sides[1];
    var primaryKind = ROLE_SETS[role][role === 'TwoWay' ? (isP ? 1 : 0) : 0];
    out.comps = primary.comps;
    sides.forEach(function (sd) { out.inputs = out.inputs.concat(sd.inputs); });
    out.inputs.forEach(function (i) { if (i.status === 'Missing' && out.needed.indexOf(i.label) < 0) out.needed.push(i.label); });
    out.conf = out.inputs.some(function (i) { return i.value != null; }) ? sides.reduce(function (a, sd) { return a + sd.credit; }, 0) / sides.length : null;
    var core = out.comps.slice(0, 2).some(function (c) { return c.pts != null; });
    var used = out.comps.filter(function (c) { return c.pts != null; }), wsum = used.reduce(function (a, c) { return a + c.weight; }, 0);
    out.comps.forEach(function (c) { c.used = c.pts != null; c.scaled = c.used ? c.weight / wsum * 100 : null; c.contrib = c.used ? c.pts * c.weight / wsum : null; });
    if (core) { out.rs = used.reduce(function (a, c) { return a + c.contrib; }, 0); out.rsShown = round1(out.rs); }
    else out.reason = primaryKind === 'pit' ? 'Needs Avg or Max Fastball Velocity.' : 'Needs Avg or Max Exit Velocity, and enough ' + pos + ' benchmark players.';

    /* Projection grades and Athletic Score on the 0-100 scale (provisional formulas, see ASSUMPTIONS; the workbook has not set final weights). */
    var hasHit = ROLE_SETS[role].indexOf('hit') >= 0, hasPit = ROLE_SETS[role].indexOf('pit') >= 0;
    var P = function (key, v, lower, at) { return v == null ? { pts: null } : pct(b, at, key, v, lower, true); };
    var grade = function (key, parts, why) { var v = reweight(parts); out.grades[key] = v; if (v == null) out.gradeWhy[key] = why; };
    var fr = function (at) { var f = frame(at, m.ht, m.wt); return { pts: f.pts == null ? null : f.pts, w: 1 }; };
    var tvv = get('tv');
    var offense = function (at) { var a = P('avgEV', avgEV, false, at), x = P('maxEV', maxEV, false, at); return [{ pts: a.pts, w: 45 }, { pts: x.pts, w: 30 }]; };
    var defense = function (at) { var f = fr(at), t = P('tv', tvv, false, at); return [{ pts: f.pts, w: 50 }, { pts: t.pts, w: 50 }]; };
    var needOff = 'Needs Avg or Max Exit Velocity and enough benchmark players', needDef = 'Needs Height and Weight (Grade Table) or Throwing Velocity';
    // Pitcher-primary players get PPG only; position-player grades are Not Applicable (never a computed or placeholder letter).
    var secOk = !!rec.sec && rec.sec !== 'P' && !isP;
    if (isP) { ['opg', 'sopg', 'dpg', 'sdpg'].forEach(function (k) { out.grades[k] = null; out.gradeWhy[k] = 'Not Applicable (pitcher-primary player)'; }); }
    else {
      if (hasHit) grade('opg', offense(pos), needOff);
      if (hasHit) grade('dpg', defense(pos), needDef);
      if (secOk) { grade('sopg', offense(rec.sec), needOff); grade('sdpg', defense(rec.sec), needDef); }
    }
    if (hasPit) {
      var ag2 = avgFbvGrade(avgFB), mg2 = maxFbvGrade(maxFB), f2 = frame('P', m.ht, m.wt);
      grade('ppg', [{ pts: ag2.grade ? ag2.pts : null, w: 40 }, { pts: mg2.grade ? mg2.pts : null, w: 30 }, { pts: f2.pts == null ? null : f2.pts, w: 30 }], 'Needs Avg or Max Fastball Velocity');
    }
    var t60v = get('t60'), tPct = t60v == null || isP ? { pts: null } : pct(b, pos, 't60', t60v, true), tvP = P('tv', tvv, false, pos);
    var hasAthInput = tPct.pts != null || tvP.pts != null;
    var athV = hasAthInput ? reweight([{ pts: tPct.pts, w: 40 }, { pts: tvP.pts, w: 30 }, { pts: fr(pos).pts, w: 30 }]) : null;
    out.grades.ath = athV; if (athV == null) out.gradeWhy.ath = 'Needs 60 Time (with enough same-position benchmark players) or Throwing Velocity';
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
    h += r.conf == null ? '<p><strong>Confidence: Unknown.</strong> No metrics entered.</p>' : '<p><strong>Confidence = ' + TRC.formatConfidencePercentage(r.conf) + '</strong> ' + TRC.renderConfidenceBadge(r.conf) + ' (weighted by each input share of the score; verified = full weight, self-reported = 25% of its weight, missing = 0).</p>';
    h += '<h3>Projection Grades And Athletic Score</h3><ul>' + ['opg', 'sopg', 'dpg', 'sdpg', 'ppg', 'ath'].filter(function (k) { return k in r.grades; }).map(function (k) { var v = r.grades[k], nm = { opg: 'OPG', sopg: 'SOPG', dpg: 'DPG', sdpg: 'SDPG', ppg: 'PPG', ath: 'Athletic Score' }[k]; return '<li><strong>' + nm + '</strong>: ' + (v == null ? (/^Not Applicable/.test(r.gradeWhy[k] || '') ? esc(r.gradeWhy[k]) : 'Not Rated (' + esc(r.gradeWhy[k]) + ')') : k === 'ath' ? round1(v).toFixed(1) : TRC.renderGrade(v)) + '</li>'; }).join('') + '</ul><p class="muted">Role: ' + esc(r.roleLabel) + '. Confidence counts only the metrics required for this role.</p>';
    var up = r.inputs.filter(function (i) { return i.gain > 0; }).sort(function (a, b) { return b.gain - a.gain; });
    h += '<h3>What Would Raise My Confidence</h3>' + (up.length ? '<ul>' + up.map(function (i) { return '<li><strong>' + esc(i.label) + '</strong>: ' + (i.status === 'Missing' ? 'enter it' : i.blocked ? 'entered, but it cannot be scored yet (enough same-position benchmark players or a matching Grade Table is needed)' : 'have a verifier confirm it') + ' (up to +' + i.gain + ' points)</li>'; }).join('') + '</ul>' : '<p>Every input is verified.</p>');
    h += '<details><summary>Assumptions And Open Questions</summary><ul>' + r.assumptions.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul></details>';
    return h;
  };

  window.TheReadScore = { compute: compute, panel: panel, frame: frame, maxFbvGrade: maxFbvGrade, getMaxFBVGrade: getMaxFBVGrade, getAvgFBVGrade: getAvgFBVGrade, MAX_FBV_BANDS: MAX_FBV_BANDS, ASSUMPTIONS: ASSUMPTIONS, MIN_BENCH: MIN_BENCH, REQUIRED: REQUIRED, ROLE_SETS: ROLE_SETS, roleOf: roleOf };
})();
