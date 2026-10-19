/* THE READ Baseball Position Benchmarks v0.2 (Provisional). Single shared config for OPG/DPG thresholds and weights.
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
  var VERSION = 'THE READ Baseball Position Benchmarks v0.2';
  var STATUS = 'Provisional';
  // v0.2 (Provisional): every MAX_EV cell = the matching AVG_EV cell + 6 mph. THROW_VELO and SIXTY_TIME are separate tables.
  var TABLES = {
    AVG_EV: { label: 'Average Exit Velocity', unit: 'mph', lower: false, rows: [[90, 94, 91, 94, 92, 94], [88, 92, 89, 92, 90, 92], [86, 90, 87, 90, 88, 90], [84, 88, 85, 88, 86, 88], [82, 86, 83, 86, 84, 86], [80, 84, 81, 84, 82, 84], [78, 82, 79, 82, 80, 82], [76, 80, 77, 80, 78, 80], [74, 78, 75, 78, 76, 78], [70, 74, 71, 74, 72, 74]] },
    MAX_EV: { label: 'Maximum Exit Velocity', unit: 'mph', lower: false, rows: [[96, 100, 97, 100, 98, 100], [94, 98, 95, 98, 96, 98], [92, 96, 93, 96, 94, 96], [90, 94, 91, 94, 92, 94], [88, 92, 89, 92, 90, 92], [86, 90, 87, 90, 88, 90], [84, 88, 85, 88, 86, 88], [82, 86, 83, 86, 84, 86], [80, 84, 81, 84, 82, 84], [76, 80, 77, 80, 78, 80]] },
    SIXTY_TIME: { label: '60-Yard Time', unit: 'seconds', lower: true, rows: [[6.90, 6.90, 6.60, 6.75, 6.60, 6.55], [7.05, 7.05, 6.75, 6.90, 6.75, 6.70], [7.20, 7.20, 6.90, 7.05, 6.90, 6.85], [7.35, 7.35, 7.05, 7.20, 7.05, 7.00], [7.50, 7.50, 7.20, 7.35, 7.20, 7.15], [7.65, 7.65, 7.35, 7.50, 7.35, 7.30], [7.80, 7.80, 7.50, 7.65, 7.50, 7.45], [7.95, 7.95, 7.65, 7.80, 7.65, 7.60], [8.10, 8.10, 7.80, 7.95, 7.80, 7.75], [8.40, 8.40, 8.10, 8.25, 8.10, 8.05]] },
    THROW_VELO: { label: 'Throwing Velocity', unit: 'mph', lower: false, rows: [[85, 86, 88, 90, 91, 93], [83, 84, 86, 88, 89, 91], [81, 82, 84, 86, 87, 89], [79, 80, 82, 84, 85, 87], [77, 78, 80, 82, 83, 85], [75, 76, 78, 80, 81, 83], [73, 74, 76, 78, 79, 81], [71, 72, 74, 76, 77, 79], [69, 70, 72, 74, 75, 77], [65, 66, 68, 70, 71, 73]] }
  };
  // Weights per spec Part 1. Frame Score is provisional (workbook Grade Table). Each set totals 1.0.
  var FORMULAS = {
    OPG: { version: 'Working v0.1', parts: [['AVG_EV', 'Average Exit Velocity', 0.45], ['MAX_EV', 'Maximum Exit Velocity', 0.30], ['SIXTY_TIME', 'Position-Adjusted 60-Yard', 0.15], ['FRAME', 'Frame Score (provisional)', 0.10]] },
    DPG: { version: 'Working v0.1', parts: [['THROW_VELO', 'Throwing Velocity', 0.45], ['SIXTY_TIME', 'Position-Adjusted 60-Yard', 0.45], ['FRAME', 'Frame Score (provisional)', 0.10]] }
  };
  var threshold = function (key, pos, i) { var c = POSITIONS.indexOf(pos); return c < 0 ? null : TABLES[key].rows[i][c]; };
  // Returns { letter, value, threshold } for a raw measurement, or null when the value or position is missing (never F/zero).
  var gradeMetric = function (key, pos, raw) {
    var v = raw == null || raw === '' ? NaN : Number(raw), t = TABLES[key];
    if (!t || !isFinite(v) || POSITIONS.indexOf(pos) < 0) return null;
    for (var i = 0; i < GRADES.length; i++) {
      var th = threshold(key, pos, i);
      if (t.lower ? v <= th : v >= th) return { letter: GRADES[i], value: GRADE_VALUES[GRADES[i]], threshold: th };
    }
    return { letter: 'F', value: GRADE_VALUES.F, threshold: threshold(key, pos, GRADES.length - 1) };
  };
  var letterFor = function (value) {
    if (value == null || !isFinite(value)) return null;
    var v = Number(Number(value).toPrecision(12));
    for (var i = 0; i < LETTER_FLOORS.length; i++) if (v >= LETTER_FLOORS[i][0]) return LETTER_FLOORS[i][1];
    return 'F';
  };
  return { VERSION: VERSION, STATUS: STATUS, GRADES: GRADES, GRADE_VALUES: GRADE_VALUES, DISPLAY_SCORE: DISPLAY_SCORE, POSITIONS: POSITIONS, TABLES: TABLES, FORMULAS: FORMULAS, gradeMetric: gradeMetric, letterFor: letterFor };
});
