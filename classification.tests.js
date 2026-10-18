/* Tests for classification.js. Runs in a browser (tests.html); also exports runClassificationTests(C) for Node */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.runClassificationTests = factory;
}(typeof self !== 'undefined' ? self : this, function (C, extra) {
  'use strict';
  var results = [];
  function test(name, fn) {
    try { fn(); results.push({ name: name, ok: true }); }
    catch (e) { results.push({ name: name, ok: false, error: e && e.message ? e.message : String(e) }); }
  }
  function eq(a, b, m) { if (a !== b) throw new Error((m || 'Expected') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }
  function yes(v, m) { if (!v) throw new Error(m || 'Expected truthy'); }
  function throwsType(fn, T, msg) {
    try { fn(); } catch (e) { yes(e instanceof T, 'Expected ' + T.name + ', got ' + e.name); if (msg) eq(e.message, msg); return; }
    throw new Error('Expected ' + T.name);
  }

  // ----- getPlayerTier -----
  test('Tier: 100.0 is Platinum', function () { eq(C.getPlayerTier(100), 'Platinum'); });
  test('Tier: 95.0 is Platinum', function () { eq(C.getPlayerTier(95), 'Platinum'); });
  test('Tier: 94.999 is Gold', function () { eq(C.getPlayerTier(94.999), 'Gold'); });
  test('Tier: 94.96 is Gold before display rounding (displays 95.0)', function () { eq(C.getPlayerTier(94.96), 'Gold'); eq((94.96).toFixed(1), '95.0'); eq(C.formatRecruitScore(94.96), '95.0'); });
  test('Tier: 85.0 is Gold', function () { eq(C.getPlayerTier(85), 'Gold'); });
  test('Tier: 84.999 is Silver', function () { eq(C.getPlayerTier(84.999), 'Silver'); });
  test('Tier: 70.0 is Silver', function () { eq(C.getPlayerTier(70), 'Silver'); });
  test('Tier: 69.999 is Bronze', function () { eq(C.getPlayerTier(69.999), 'Bronze'); });
  test('Tier: 0.0 is Bronze', function () { eq(C.getPlayerTier(0), 'Bronze'); });
  test('Tier: null is Not Rated (never Bronze)', function () { eq(C.getPlayerTier(null), 'Not Rated'); });
  test('Tier: undefined is Not Rated', function () { eq(C.getPlayerTier(undefined), 'Not Rated'); });
  test('Tier: over 100 is rejected', function () { throwsType(function () { C.getPlayerTier(100.001); }, RangeError, 'Recruit Score must be between 0.0 and 100.0.'); });
  test('Tier: below 0 is rejected', function () { throwsType(function () { C.getPlayerTier(-0.001); }, RangeError); });

  // ----- getConfidenceLevel -----
  test('Confidence: 100.0 is High', function () { eq(C.getConfidenceLevel(100), 'High'); });
  test('Confidence: 90.0 is High', function () { eq(C.getConfidenceLevel(90), 'High'); });
  test('Confidence: 89.999 is Medium', function () { eq(C.getConfidenceLevel(89.999), 'Medium'); });
  test('Confidence: 89.96 is Medium and displays floored as 89.9%', function () { eq(C.getConfidenceLevel(89.96), 'Medium'); eq((89.96).toFixed(1), '90.0'); eq(C.formatConfidencePercentage(89.96), '89.9%'); });
  test('Confidence: 60.0 is Medium', function () { eq(C.getConfidenceLevel(60), 'Medium'); });
  test('Confidence: 59.999 is Low', function () { eq(C.getConfidenceLevel(59.999), 'Low'); });
  test('Confidence: 0.0 is Low', function () { eq(C.getConfidenceLevel(0), 'Low'); });
  test('Confidence: null is Unknown (never Low)', function () { eq(C.getConfidenceLevel(null), 'Unknown'); });
  test('Confidence: undefined is Unknown', function () { eq(C.getConfidenceLevel(undefined), 'Unknown'); });
  test('Confidence: over 100 is rejected', function () { throwsType(function () { C.getConfidenceLevel(100.001); }, RangeError, 'Confidence Percentage must be between 0.0% and 100.0%.'); });
  test('Confidence: below 0 is rejected', function () { throwsType(function () { C.getConfidenceLevel(-0.001); }, RangeError); });

  // ----- validation -----
  test('Validate Recruit Score: missing stays null (not 0)', function () { eq(C.validateRecruitScore(null), null); eq(C.validateRecruitScore(undefined), null); eq(C.validateRecruitScore(''), null); });
  test('Validate Recruit Score: text rejected with TypeError', function () { throwsType(function () { C.validateRecruitScore('abc'); }, TypeError, 'Recruit Score must be a valid number.'); });
  test('Validate Recruit Score: out of range rejected, never clamped', function () { throwsType(function () { C.validateRecruitScore(101); }, RangeError, 'Recruit Score must be between 0.0 and 100.0.'); throwsType(function () { C.validateRecruitScore(-1); }, RangeError); eq(C.validateRecruitScore('88.2'), 88.2); eq(C.validateRecruitScore(0), 0); });
  test('Validate Confidence: missing stays null (not 0)', function () { eq(C.validateConfidencePercentage(null), null); eq(C.validateConfidencePercentage(''), null); });
  test('Validate Confidence: text rejected with TypeError', function () { throwsType(function () { C.validateConfidencePercentage('x'); }, TypeError, 'Confidence Percentage must be a valid number.'); });
  test('Validate Confidence: out of range rejected, never clamped', function () { throwsType(function () { C.validateConfidencePercentage(100.5); }, RangeError, 'Confidence Percentage must be between 0.0% and 100.0%.'); throwsType(function () { C.validateConfidencePercentage(-5); }, RangeError); });

  // ----- formatting -----
  test('Format Recruit Score to one decimal', function () { eq(C.formatRecruitScore(96.42), '96.4'); eq(C.formatRecruitScore(85), '85.0'); eq(C.formatRecruitScore(70), '70.0'); eq(C.formatRecruitScore(0), '0.0'); eq(C.formatRecruitScore(null), '\u2014'); });

  // ----- colors (exact approved values) -----
  var T = C.PLAYER_TIER_CONFIG, F = C.CONFIDENCE_LEVEL_CONFIG;
  function colors(c, bg, tx, bd) { eq(c.backgroundColor, bg); eq(c.textColor, tx); eq(c.borderColor, bd); }
  test('Platinum colors', function () { colors(T.Platinum, '#A9C4E4', '#0B1F3A', '#5F86B5'); yes(/^linear-gradient\(135deg,#E3EEFA/.test(T.Platinum.bgGradient), 'gradient'); yes(T.Platinum.backgroundColor !== T.Silver.backgroundColor, 'distinct from silver'); });
  test('Gold colors', function () { colors(T.Gold, '#D4A017', '#241A00', '#AA7D00'); });
  test('Silver colors', function () { colors(T.Silver, '#A7ADB4', '#1A1A1A', '#7E858D'); });
  test('Bronze colors (dark text on metallic gradient)', function () { colors(T.Bronze, '#A8632A', '#2B1200', '#7E451C'); });
  var lum = function (h) { var c = [1, 3, 5].map(function (i) { var v = parseInt(h.substr(i, 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  var ratio = function (a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  test('Platinum, Gold, Silver and Bronze all use a metallic gradient', function () { ['Platinum', 'Gold', 'Silver', 'Bronze'].forEach(function (n) { yes(/^linear-gradient\(/.test(T[n].bgGradient || ''), n + ' has a gradient'); }); });
  test('Metallic tier text has at least 4.5:1 contrast on every gradient stop', function () { ['Platinum', 'Gold', 'Silver', 'Bronze'].forEach(function (n) { (T[n].bgGradient.match(/#[0-9A-Fa-f]{6}/g) || []).forEach(function (stop) { yes(ratio(T[n].textColor, stop) >= 4.5, n + ' ' + stop + ' ' + ratio(T[n].textColor, stop).toFixed(2)); }); }); });
  test('Platinum (blue tinted) and Silver (neutral gray) stay distinct', function () { var blue = function (h) { return parseInt(h.substr(5, 2), 16) - parseInt(h.substr(1, 2), 16); }; yes(blue(T.Platinum.backgroundColor) >= 40, 'Platinum is blue tinted'); yes(Math.abs(blue(T.Silver.backgroundColor)) <= 16, 'Silver is neutral'); });
  test('Not Rated is neutral gray', function () { colors(T['Not Rated'], '#E5E7EB', '#4B5563', '#C7CBD1'); });
  test('High confidence is approved green', function () { colors(F.High, '#DCFCE7', '#166534', '#22C55E'); eq(F.High.indicatorColor, '#16A34A'); });
  test('Medium confidence is approved amber', function () { colors(F.Medium, '#FEF3C7', '#92400E', '#D97706'); eq(F.Medium.indicatorColor, '#D97706'); });
  test('Low confidence is approved red', function () { colors(F.Low, '#FEE2E2', '#991B1B', '#DC2626'); eq(F.Low.indicatorColor, '#DC2626'); });
  test('Unknown confidence is neutral gray', function () { colors(F.Unknown, '#E5E7EB', '#4B5563', '#C7CBD1'); eq(F.Unknown.indicatorColor, '#9CA3AF'); });
  test('Tier sort orders are 4/3/2/1/0', function () { eq(T.Platinum.sortOrder, 4); eq(T.Gold.sortOrder, 3); eq(T.Silver.sortOrder, 2); eq(T.Bronze.sortOrder, 1); eq(T['Not Rated'].sortOrder, 0); });
  test('Tier and Confidence palettes are separate (no green/amber/red in Tier)', function () {
    var tierColors = Object.keys(T).map(function (k) { return T[k].backgroundColor; });
    ['#DCFCE7', '#FEF3C7', '#FEE2E2'].forEach(function (c) { yes(tierColors.indexOf(c) === -1, 'Tier uses confidence color ' + c); });
  });

  // ----- badges -----
  test('Tier badge: visible label, colors, accessible name', function () {
    var h = C.renderTierBadge(96.4);
    yes(h.indexOf('>Platinum</span>') > -1, 'visible label'); yes(h.indexOf('background-color:#A9C4E4') > -1); yes(h.indexOf('background-image:linear-gradient') > -1); yes(h.indexOf('color:#0B1F3A') > -1); yes(h.indexOf('border-color:#5F86B5') > -1);
    yes(h.indexOf('aria-label="Player Tier: Platinum. Recruit Score 96.4."') > -1, 'aria-label');
  });
  test('Tier badge: every tier shows its visible label', function () {
    [[97, 'Platinum'], [88.2, 'Gold'], [72, 'Silver'], [50, 'Bronze'], [null, 'Not Rated']].forEach(function (p) { yes(C.renderTierBadge(p[0]).indexOf('>' + p[1] + '</span>') > -1, p[1]); });
  });
  test('Tier badge: missing Recruit Score displays Not Rated with accessible text', function () {
    var h = C.renderTierBadge(null); yes(h.indexOf('>Not Rated</span>') > -1); yes(h.indexOf('Player Tier: Not Rated. Recruit Score is unavailable.') > -1); yes(h.indexOf('Bronze') === -1 || h.indexOf('not the same as Bronze') > -1);
  });
  test('Confidence badge: labels, percentages and accessible descriptions', function () {
    var h = C.renderConfidenceBadge(92);
    yes(h.indexOf('High') > -1 && h.indexOf('92.0%') > -1); yes(h.indexOf('background-color:#DCFCE7') > -1); yes(h.indexOf('background-color:#16A34A') > -1);
    yes(h.indexOf('Confidence Level: High. Confidence Percentage 92.0 percent. Confidence measures data completeness, not talent.') > -1);
    yes(C.renderConfidenceBadge(78).indexOf('Confidence Level: Medium. Confidence Percentage 78.0 percent. Confidence measures data completeness, not talent.') > -1);
    yes(C.renderConfidenceBadge(42).indexOf('Confidence Level: Low. Confidence Percentage 42.0 percent. Additional verified metrics are needed. Low Confidence does not mean low talent.') > -1);
  });
  test('Confidence badge: missing displays Unknown, not Low', function () {
    var h = C.renderConfidenceBadge(null); yes(h.indexOf('Unknown') > -1); yes(h.indexOf('Confidence Level: Unknown. Confidence Percentage is unavailable.') > -1); yes(h.indexOf('>Low') === -1 && h.indexOf('Low<') === -1);
  });
  test('Tooltip language separates Confidence from talent', function () {
    yes(C.TEXT.confidenceTooltip.indexOf('does not measure talent') > -1); yes(C.TEXT.lowConfidenceTooltip.indexOf('does not mean the athlete has low talent') > -1);
    yes(C.renderConfidenceBadge(42).indexOf('title="Additional verified metrics are needed to strengthen this evaluation.') > -1);
    yes(C.TEXT.recruitScoreTooltip === 'Recruit Score measures objective athlete value on a 0.0 to 100.0 scale.');
  });
  test('Tier is never changed by Confidence or team fields', function () {
    var a = { recruitScore: 88, confidencePercentage: 10, staff: 100, fit: 100, need: 100, adj: 100, pri: 100, gpa: 4 };
    var b = { recruitScore: 88, confidencePercentage: 99, staff: 1, fit: 1, need: 1, adj: 1, pri: 1, gpa: 1 };
    eq(C.getPlayerTier(a.recruitScore), C.getPlayerTier(b.recruitScore)); eq(C.getConfidenceLevel(55), C.getConfidenceLevel(55));
  });

  // ----- sorting & filtering -----
  var data = [
    { name: 'Cole', pos: 'SS', grad: 2028, state: 'TX', recruitScore: 96.1, confidencePercentage: 54 },
    { name: 'Adam', pos: 'OF', grad: 2027, state: 'FL', recruitScore: 90.2, confidencePercentage: 93 },
    { name: 'Ben', pos: 'C', grad: 2027, state: 'GA', recruitScore: 90.2, confidencePercentage: 70 },
    { name: 'Dale', pos: 'P', grad: 2029, state: 'TX', recruitScore: 72, confidencePercentage: null },
    { name: 'Eli', pos: '2B', grad: 2028, state: 'CA', recruitScore: 60, confidencePercentage: 91 },
    { name: 'Finn', pos: '1B', grad: 2030, state: 'OH', recruitScore: null, confidencePercentage: null },
    { name: 'Gus', pos: '3B', grad: 2030, state: 'OH', recruitScore: null, confidencePercentage: null }
  ];
  function names(l) { return l.map(function (a) { return a.name; }).join(','); }
  test('Sort Tier descending is semantic with Not Rated last', function () { eq(names(C.sortAthletes(data, 'tier', 'desc')), 'Cole,Adam,Ben,Dale,Eli,Finn,Gus'); });
  test('Sort Tier ascending is semantic with Not Rated still last', function () { eq(names(C.sortAthletes(data, 'tier', 'asc')), 'Eli,Dale,Adam,Ben,Cole,Finn,Gus'); });
  test('Sort Confidence uses actual percentage, Unknown last in both directions', function () {
    eq(names(C.sortAthletes(data, 'confidence', 'desc')), 'Adam,Eli,Ben,Cole,Dale,Finn,Gus');
    eq(names(C.sortAthletes(data, 'confidence', 'asc')), 'Cole,Ben,Eli,Adam,Dale,Finn,Gus');
  });
  test('Sort Recruit Score: missing last in both directions, name breaks ties', function () {
    eq(names(C.sortAthletes(data, 'recruitScore', 'desc')), 'Cole,Adam,Ben,Dale,Eli,Finn,Gus');
    eq(names(C.sortAthletes(data, 'recruitScore', 'asc')), 'Eli,Dale,Adam,Ben,Cole,Finn,Gus');
  });
  test('Filter: multi-select Tier uses OR', function () { eq(names(C.filterAthletes(data, { tiers: ['Platinum', 'Gold'] })), 'Cole,Adam,Ben'); });
  test('Filter: multi-select Confidence uses OR (Unknown included)', function () { eq(names(C.filterAthletes(data, { confidences: ['High', 'Unknown'] })), 'Adam,Dale,Eli,Finn,Gus'); });
  test('Filter: groups combine with AND', function () { eq(names(C.filterAthletes(data, { tiers: ['Platinum', 'Gold'], confidences: ['High'] })), 'Adam'); });
  test('Filter: search ANDs with filters (name, position, class, state)', function () {
    eq(names(C.filterAthletes(data, { search: 'tx', tiers: ['Platinum', 'Silver'] })), 'Cole,Dale');
    eq(names(C.filterAthletes(data, { search: '2027' })), 'Adam,Ben'); eq(names(C.filterAthletes(data, { search: 'ss' })), 'Cole');
  });
  test('Filter: Not Rated and Unknown can be selected explicitly', function () { eq(names(C.filterAthletes(data, { tiers: ['Not Rated'], confidences: ['Unknown'] })), 'Finn,Gus'); });
  test('Filter: no match returns an empty list', function () { eq(C.filterAthletes(data, { search: 'zzz' }).length, 0); eq(C.TEXT.empty, 'No athletes match these filters.'); });
  test('Sorting and filtering do not change the source data', function () { var before = names(data); C.sortAthletes(data, 'tier', 'asc'); C.filterAthletes(data, { tiers: ['Gold'] }); eq(names(data), before); });

  // ----- extra (browser-only) tests supplied by the page -----
  if (extra) extra(test, eq, yes);

  var failed = results.filter(function (r) { return !r.ok; });
  return { results: results, passed: results.length - failed.length, failed: failed.length };
}));
