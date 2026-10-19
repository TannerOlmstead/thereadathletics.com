/* THE READ Progressive Raw-Measurable Benchmarks v0.5 (Provisional; v0.2 retired and preserved below). Single shared config for OPG/DPG thresholds and weights.
   No other file may hard-code these numbers. Rows are A+ .. D; columns are C, 1B, 2B, 3B, SS, OF. Below the D row is F. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TheReadBenchmarks = api;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  var GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D'];
  var GRADE_VALUES = { 'A+': 10, A: 9.5, 'A-': 9, 'B+': 8.5, B: 8, 'B-': 7.5, 'C+': 7, C: 6, 'C-': 5, D: 3, F: 1 };
  // Floors for turning a weighted 1-10 grade value back into a letter.
  var LETTER_FLOORS = [[10, 'A+'], [9.5, 'A'], [9, 'A-'], [8.5, 'B+'], [8, 'B'], [7.5, 'B-'], [7, 'C+'], [6, 'C'], [5, 'C-'], [3, 'D']];
  // Position on the site's 0-100 grade-display scale, so letters render the same everywhere (see classification.js).
  var DISPLAY_SCORE = { 'A+': 98, A: 95, 'A-': 92, 'B+': 88, B: 85, 'B-': 82, 'C+': 78, C: 75, 'C-': 72, D: 65, F: 50 };
  var POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'OF'];
  var GROUP = 'THE READ Progressive Raw-Measurable Benchmarks v0.5';
  var VERSION = GROUP;
  var STATUS = 'Provisional';
  var PROVISIONAL_LABEL = 'Provisional Benchmark';
  var PROVISIONAL_TEXT = 'This benchmark uses Progressive Tier Spacing and has not been approved as final production scoring logic.';
  // Every table is stored independently (MAX_EV is NOT derived from AVG_EV). Rows A+ .. D; columns C, 1B, 2B, 3B, SS, OF. Below the D row is F.
  // Position-free tables (FBV) use a single column. POP_TIME is catcher only.
  var TABLES = {
    AVG_EV: { label: 'Average Exit Velocity', quantity: 'Velocity', unit: 'mph', direction: 'HigherIsBetter', lower: false, decimals: 1, version: 'THE READ Average EV Benchmarks v0.4', rows: [[94, 98, 95, 98, 96, 98], [91, 95, 92, 95, 93, 95], [89, 93, 90, 93, 91, 93], [88, 92, 89, 92, 90, 92], [87, 91, 88, 91, 89, 91], [86, 90, 87, 90, 88, 90], [85, 89, 86, 89, 87, 89], [84, 88, 85, 88, 86, 88], [83, 87, 84, 87, 85, 87], [80, 84, 81, 84, 82, 84]] },
    MAX_EV: { label: 'Maximum Exit Velocity', quantity: 'Velocity', unit: 'mph', direction: 'HigherIsBetter', lower: false, decimals: 1, version: 'THE READ Maximum EV Benchmarks v0.4', rows: [[102, 106, 103, 106, 104, 106], [99, 103, 100, 103, 101, 103], [97, 101, 98, 101, 99, 101], [96, 100, 97, 100, 98, 100], [95, 99, 96, 99, 97, 99], [94, 98, 95, 98, 96, 98], [93, 97, 94, 97, 95, 97], [92, 96, 93, 96, 94, 96], [91, 95, 92, 95, 93, 95], [88, 92, 89, 92, 90, 92]] },
    SIXTY_TIME: { label: '60-Yard Time', quantity: 'ElapsedTime', unit: 'seconds', direction: 'LowerIsBetter', lower: true, decimals: 2, version: 'THE READ Position-Adjusted 60-Yard Benchmarks v0.5', rows: [[6.85, 6.85, 6.50, 6.65, 6.50, 6.45], [7.05, 7.05, 6.70, 6.85, 6.70, 6.65], [7.20, 7.20, 6.85, 7.00, 6.85, 6.80], [7.35, 7.35, 7.00, 7.15, 7.00, 6.95], [7.50, 7.50, 7.15, 7.30, 7.15, 7.10], [7.60, 7.60, 7.25, 7.40, 7.25, 7.20], [7.70, 7.70, 7.35, 7.50, 7.35, 7.30], [7.80, 7.80, 7.45, 7.60, 7.45, 7.40], [7.90, 7.90, 7.55, 7.70, 7.55, 7.50], [8.00, 8.00, 7.70, 7.85, 7.70, 7.65]] },
    THROW_VELO: { label: 'Throwing Velocity', quantity: 'Velocity', unit: 'mph', direction: 'HigherIsBetter', lower: false, decimals: 1, version: 'THE READ Position-Player Throwing Velocity Benchmarks v0.4', rows: [[85, 86, 88, 90, 91, 93], [82, 83, 85, 87, 88, 90], [80, 81, 83, 85, 86, 88], [78, 79, 81, 83, 84, 86], [76, 77, 79, 81, 82, 84], [74, 75, 77, 79, 80, 82], [72, 73, 75, 77, 78, 80], [70, 71, 73, 75, 76, 78], [68, 69, 71, 73, 74, 76], [65, 66, 68, 70, 71, 73]] },
    POP_TIME: { label: 'Catcher Pop Time', quantity: 'ElapsedTime', unit: 'seconds', direction: 'LowerIsBetter', lower: true, decimals: 2, version: 'THE READ Catcher Pop Time Benchmarks v0.4', positions: ['C'], rows: [[1.82], [1.90], [1.95], [2.00], [2.05], [2.10], [2.15], [2.20], [2.25], [2.35]] },
    AVG_FBV: { label: 'Average Fastball Velocity', quantity: 'Velocity', unit: 'mph', direction: 'HigherIsBetter', lower: false, decimals: 1, version: 'THE READ Average FBV Benchmarks v0.4', positions: ['P'], rows: [[95], [92], [90], [88], [86], [84], [82], [80], [78], [75]] },
    MAX_FBV: { label: 'Maximum Fastball Velocity', quantity: 'Velocity', unit: 'mph', direction: 'HigherIsBetter', lower: false, decimals: 1, version: 'THE READ Maximum FBV Benchmarks v0.4', positions: ['P'], rows: [[98], [95], [93], [91], [89], [87], [85], [83], [81], [78]] }
  };
  // Retired, preserved history: v0.2 position benchmarks (MAX_EV was AVG_EV + 6). Not used for grading; kept for before/after comparison.
  var RETIRED = {
    'THE READ Baseball Position Benchmarks v0.2': { status: 'Retired', tables: {
      AVG_EV: { quantity: 'Velocity', unit: 'mph', direction: 'HigherIsBetter', lower: false, rows: [[90, 94, 91, 94, 92, 94], [88, 92, 89, 92, 90, 92], [86, 90, 87, 90, 88, 90], [84, 88, 85, 88, 86, 88], [82, 86, 83, 86, 84, 86], [80, 84, 81, 84, 82, 84], [78, 82, 79, 82, 80, 82], [76, 80, 77, 80, 78, 80], [74, 78, 75, 78, 76, 78], [70, 74, 71, 74, 72, 74]] },
      MAX_EV: { quantity: 'Velocity', unit: 'mph', direction: 'HigherIsBetter', lower: false, rows: [[96, 100, 97, 100, 98, 100], [94, 98, 95, 98, 96, 98], [92, 96, 93, 96, 94, 96], [90, 94, 91, 94, 92, 94], [88, 92, 89, 92, 90, 92], [86, 90, 87, 90, 88, 90], [84, 88, 85, 88, 86, 88], [82, 86, 83, 86, 84, 86], [80, 84, 81, 84, 82, 84], [76, 80, 77, 80, 78, 80]] },
      SIXTY_TIME: { quantity: 'ElapsedTime', unit: 'seconds', direction: 'LowerIsBetter', lower: true, rows: [[6.90, 6.90, 6.60, 6.75, 6.60, 6.55], [7.05, 7.05, 6.75, 6.90, 6.75, 6.70], [7.20, 7.20, 6.90, 7.05, 6.90, 6.85], [7.35, 7.35, 7.05, 7.20, 7.05, 7.00], [7.50, 7.50, 7.20, 7.35, 7.20, 7.15], [7.65, 7.65, 7.35, 7.50, 7.35, 7.30], [7.80, 7.80, 7.50, 7.65, 7.50, 7.45], [7.95, 7.95, 7.65, 7.80, 7.65, 7.60], [8.10, 8.10, 7.80, 7.95, 7.80, 7.75], [8.40, 8.40, 8.10, 8.25, 8.10, 8.05]] },
      THROW_VELO: { quantity: 'Velocity', unit: 'mph', direction: 'HigherIsBetter', lower: false, rows: [[85, 86, 88, 90, 91, 93], [83, 84, 86, 88, 89, 91], [81, 82, 84, 86, 87, 89], [79, 80, 82, 84, 85, 87], [77, 78, 80, 82, 83, 85], [75, 76, 78, 80, 81, 83], [73, 74, 76, 78, 79, 81], [71, 72, 74, 76, 77, 79], [69, 70, 72, 74, 75, 77], [65, 66, 68, 70, 71, 73]] },
      AVG_FBV: { quantity: 'Velocity', unit: 'mph', direction: 'HigherIsBetter', lower: false, rows: [[92], [89], [86], [83], [80], [77], [74], [71], [68], [65]] },
      MAX_FBV: { quantity: 'Velocity', unit: 'mph', direction: 'HigherIsBetter', lower: false, rows: [[95], [92], [89], [86], [83], [80], [77], [74], [71], [68]] }
    } }
  };  // Weights per spec Part 1. Frame Score is provisional (workbook Grade Table). Each set totals 1.0.
  var FORMULAS = {
    OPG: { version: 'Working v0.1', parts: [['AVG_EV', 'Average Exit Velocity', 0.45], ['MAX_EV', 'Maximum Exit Velocity', 0.30], ['SIXTY_TIME', 'Position-Adjusted 60-Yard', 0.15], ['FRAME', 'Frame Score (provisional)', 0.10]] },
    DPG: { version: 'Working v0.1', parts: [['THROW_VELO', 'Throwing Velocity', 0.45], ['SIXTY_TIME', 'Position-Adjusted 60-Yard', 0.45], ['FRAME', 'Frame Score (provisional)', 0.10]] }
  };
  // Authoritative Metric Registry: the only place a metric's quantity, canonical unit, display unit, direction and precision are defined.
  // 60-Yard and Pop Time are ElapsedTime in seconds (LowerIsBetter, never mph); exit/throw/fastball are Velocity in mph (HigherIsBetter).
  var REGISTRY = {
    SIXTY_TIME: { key: 'SIXTY_TIME', field: 't60', label: '60-Yard Time', quantity: 'ElapsedTime', unit: 'seconds', display: 's', aria: 'seconds', direction: 'LowerIsBetter', decimals: 2 },
    POP_TIME: { key: 'POP_TIME', field: 'pop', label: 'Catcher Pop Time', quantity: 'ElapsedTime', unit: 'seconds', display: 's', aria: 'seconds', direction: 'LowerIsBetter', decimals: 2 },
    AVG_EV: { key: 'AVG_EV', field: 'avgEV', label: 'Average Exit Velocity', quantity: 'Velocity', unit: 'mph', display: 'mph', aria: 'miles per hour', direction: 'HigherIsBetter', decimals: 1 },
    MAX_EV: { key: 'MAX_EV', field: 'maxEV', label: 'Maximum Exit Velocity', quantity: 'Velocity', unit: 'mph', display: 'mph', aria: 'miles per hour', direction: 'HigherIsBetter', decimals: 1 },
    THROW_VELO: { key: 'THROW_VELO', field: 'tv', label: 'Throwing Velocity', quantity: 'Velocity', unit: 'mph', display: 'mph', aria: 'miles per hour', direction: 'HigherIsBetter', decimals: 1 },
    AVG_FBV: { key: 'AVG_FBV', field: 'avgFBV', label: 'Average Fastball Velocity', quantity: 'Velocity', unit: 'mph', display: 'mph', aria: 'miles per hour', direction: 'HigherIsBetter', decimals: 1 },
    MAX_FBV: { key: 'MAX_FBV', field: 'maxFBV', label: 'Maximum Fastball Velocity', quantity: 'Velocity', unit: 'mph', display: 'mph', aria: 'miles per hour', direction: 'HigherIsBetter', decimals: 1 }
  };
  var FIELD_KEY = {}; Object.keys(REGISTRY).forEach(function (k) { FIELD_KEY[REGISTRY[k].field] = k; });
  // Unit spellings accepted for input; each maps to ONE quantity. Nothing is ever converted between them.
  var UNIT_ALIASES = { s: 'seconds', sec: 'seconds', secs: 'seconds', second: 'seconds', seconds: 'seconds', mph: 'mph', 'miles per hour': 'mph', 'mi/h': 'mph' };
  var UNIT_QUANTITY = { seconds: 'ElapsedTime', mph: 'Velocity' };
  var normUnit = function (u) { return u == null || String(u).trim() === '' ? null : (UNIT_ALIASES[String(u).trim().toLowerCase()] || String(u).trim().toLowerCase()); };
  // checkUnit(key, unit): status OK | MissingUnit | UnitMismatch | UnknownMetric. An explicitly wrong unit is never repaired by the default.
  var checkUnit = function (key, unit) {
    var r = REGISTRY[key] || REGISTRY[FIELD_KEY[key]];
    if (!r) return { status: 'UnknownMetric', message: 'Unknown metric ' + key };
    var u = normUnit(unit);
    if (u == null) return { status: 'MissingUnit', key: r.key, required: r.unit, message: r.label + ' needs a unit (' + r.display + ').' };
    if (u !== r.unit || UNIT_QUANTITY[u] !== r.quantity) return { status: 'UnitMismatch', key: r.key, received: String(unit), required: r.unit, message: 'UnitMismatch: ' + r.label + ' is ' + r.quantity + ' in ' + r.display + ', received "' + unit + '".' };
    return { status: 'OK', key: r.key, required: r.unit };
  };
  var unitOf = function (key) { var r = REGISTRY[key] || REGISTRY[FIELD_KEY[key]]; return r ? r.display : ''; };
  var fmt = function (key, v) { var r = REGISTRY[key] || REGISTRY[FIELD_KEY[key]]; if (!r || v == null || v === '' || !isFinite(Number(v))) return '\u2014'; return Number(v).toFixed(r.decimals) + ' ' + r.display; };
  var ariaOf = function (key, v) { var r = REGISTRY[key] || REGISTRY[FIELD_KEY[key]]; return r ? r.label + (v == null ? '' : ' ' + v) + ' ' + r.aria : ''; };
  // Benchmark configuration validation: every table (and every retired version) must agree with the registry on quantity, unit and direction.
  var validateTables = function (tables) {
    Object.keys(tables).forEach(function (k) {
      var r = REGISTRY[k], t = tables[k];
      if (!r) throw new Error('UnitMismatch: benchmark ' + k + ' has no Metric Registry entry.');
      if (t.quantity !== r.quantity) throw new Error('UnitMismatch: benchmark ' + k + ' quantity ' + t.quantity + ' conflicts with registry ' + r.quantity + '.');
      if (t.unit !== r.unit) throw new Error('UnitMismatch: benchmark ' + k + ' unit ' + t.unit + ' conflicts with registry ' + r.unit + '.');
      if (t.direction !== r.direction || t.lower !== (r.direction === 'LowerIsBetter')) throw new Error('UnitMismatch: benchmark ' + k + ' direction conflicts with registry ' + r.direction + '.');
    });
    return true;
  };
  var posList = function (t) { return t.positions || POSITIONS; };
  var colOf = function (t, pos) { return posList(t).indexOf(pos); };
  var threshold = function (key, pos, i, tables) { var t = (tables || TABLES)[key], c = colOf(t, pos); return c < 0 ? null : t.rows[i][c]; };
  // One shared lookup. Returns { letter, value, threshold, version, status } for a valid raw measurement (full stored precision),
  // or null when the value is missing/invalid/negative or the position has no table (Not Rated; never F/zero). Pass tables=RETIRED[...].tables for comparison.
  var gradeMetric = function (key, pos, raw, tables) {
    var v = raw == null || raw === '' || typeof raw === 'boolean' ? NaN : Number(raw), t = (tables || TABLES)[key], meta = TABLES[key];
    if (!t || !isFinite(v) || v < 0) return null;
    if (REGISTRY[key].direction !== (t.lower ? 'LowerIsBetter' : 'HigherIsBetter')) throw new Error('UnitMismatch: ' + key + ' benchmark direction conflicts with the Metric Registry.');
    var p = meta.positions && meta.positions.length === 1 && meta.positions[0] === 'P' && !pos ? 'P' : pos;
    if (colOf(meta, p) < 0) return null;
    for (var i = 0; i < GRADES.length; i++) {
      var th = threshold(key, p, i, tables);
      if (t.lower ? v <= th : v >= th) return { letter: GRADES[i], value: GRADE_VALUES[GRADES[i]], threshold: th, version: tables ? 'v0.2 (Retired)' : meta.version, status: tables ? 'Retired' : STATUS };
    }
    return { letter: 'F', value: GRADE_VALUES.F, threshold: threshold(key, p, GRADES.length - 1, tables), version: tables ? 'v0.2 (Retired)' : meta.version, status: tables ? 'Retired' : STATUS };
  };
  // gradeMeasurement({ key, value, unit }, pos): the safe entry point for values that carry a unit. A missing or wrong unit yields
  // { status: 'MissingUnit' | 'UnitMismatch' } with grade null: never F, Not Rated or zero, and the value is excluded from every derived grade.
  var gradeMeasurement = function (m, pos) {
    var c = checkUnit(m && m.key, m && m.unit);
    if (c.status !== 'OK') return { status: c.status, grade: null, message: c.message };
    var g = gradeMetric(c.key, pos, m.value);
    return g ? { status: 'Graded', grade: g } : { status: 'NotRated', grade: null };
  };
  // Stored-data audit. Counts per measurement: valid (value plausible for the canonical unit; stored records carry no unit field, so the
  // schema-implied canonical unit is used), incorrectlyLabeled (explicit conflicting unit), missingUnit (no explicit unit stored; schema-implied,
  // reported separately and never silently converted), ambiguous (no explicit unit and the value is implausible for the canonical unit, e.g. a 60 time of 24).
  var PLAUSIBLE = { SIXTY_TIME: [4, 12], POP_TIME: [1.5, 4], AVG_EV: [30, 130], MAX_EV: [30, 140], THROW_VELO: [30, 120], AVG_FBV: [30, 110], MAX_FBV: [30, 115] };
  var auditRecords = function (records) {
    var out = { records: 0, measurements: 0, valid: 0, incorrectlyLabeled: 0, missingUnit: 0, ambiguous: 0, invalidatedGrades: 0, corrected: 0, requiresReview: 0, details: [] };
    (records || []).forEach(function (rec) {
      var m = rec.metrics || rec, u = rec.units || {}; out.records++;
      Object.keys(FIELD_KEY).forEach(function (f) {
        var v = m[f]; if (v == null || v === '' || !isFinite(Number(v))) return;
        var key = FIELD_KEY[f], explicit = u[f] != null && String(u[f]).trim() !== '', range = PLAUSIBLE[key], n = Number(v), plausible = n >= range[0] && n <= range[1];
        out.measurements++;
        if (explicit) {
          var c = checkUnit(key, u[f]);
          if (c.status === 'OK' && plausible) out.valid++;
          else { out.incorrectlyLabeled++; out.invalidatedGrades++; out.requiresReview++; out.details.push({ id: rec.id || rec.name || '', metric: key, value: n, unit: u[f] }); }
        } else {
          out.missingUnit++;
          if (plausible) out.valid++;
          else { out.ambiguous++; out.invalidatedGrades++; out.requiresReview++; out.details.push({ id: rec.id || rec.name || '', metric: key, value: n, unit: null }); }
        }
      });
    });
    return out;
  };
  // Before/after comparison (comparison mode only; never writes official scores). inputs = { AVG_EV: n, ... }.
  var compare = function (pos, inputs) {
    var old = RETIRED['THE READ Baseball Position Benchmarks v0.2'].tables;
    return Object.keys(inputs).map(function (k) {
      var a = gradeMetric(k, pos, inputs[k], old), b = gradeMetric(k, pos, inputs[k]);
      return { metric: k, raw: inputs[k], existing: a && a.letter, proposed: b && b.letter, changed: !!(a && b && a.letter !== b.letter) };
    });
  };  var letterFor = function (value) {
    if (value == null || !isFinite(value)) return null;
    var v = Number(Number(value).toPrecision(12));
    for (var i = 0; i < LETTER_FLOORS.length; i++) if (v >= LETTER_FLOORS[i][0]) return LETTER_FLOORS[i][1];
    return 'F';
  };
  validateTables(TABLES); Object.keys(RETIRED).forEach(function (g) { validateTables(RETIRED[g].tables); });
  return { auditRecords: auditRecords, REGISTRY: REGISTRY, FIELD_KEY: FIELD_KEY, checkUnit: checkUnit, unitOf: unitOf, fmt: fmt, ariaOf: ariaOf, validateTables: validateTables, gradeMeasurement: gradeMeasurement, VERSION: VERSION, GROUP: GROUP, STATUS: STATUS, PROVISIONAL_LABEL: PROVISIONAL_LABEL, PROVISIONAL_TEXT: PROVISIONAL_TEXT, RETIRED: RETIRED, compare: compare, GRADES: GRADES, GRADE_VALUES: GRADE_VALUES, DISPLAY_SCORE: DISPLAY_SCORE, POSITIONS: POSITIONS, TABLES: TABLES, FORMULAS: FORMULAS, gradeMetric: gradeMetric, letterFor: letterFor };
});
