/* THE READ Athletics - shared Recruit Score / Player Tier / Confidence rules.
   One module = one source of truth for thresholds, labels, colors, validation,
   sorting, filtering and accessible badge markup. Works in the browser
   (window.TheReadClassification) and in Node (module.exports). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TheReadClassification = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PLAYER_TIER_CONFIG = {
    'Platinum': { label: 'Platinum', minimumScore: 95, backgroundColor: '#A9C4E4', bgGradient: 'linear-gradient(135deg,#E3EEFA,#A9C4E4 45%,#8FB0D8 70%,#D4E4F6)', textColor: '#0B1F3A', borderColor: '#5F86B5', sortOrder: 4, rangeLabel: '95.0-100.0' },
    'Gold': { label: 'Gold', minimumScore: 85, backgroundColor: '#D4A017', textColor: '#241A00', borderColor: '#AA7D00', sortOrder: 3, rangeLabel: '85.0-94.9' },
    'Silver': { label: 'Silver', minimumScore: 70, backgroundColor: '#A7ADB4', textColor: '#1A1A1A', borderColor: '#7E858D', sortOrder: 2, rangeLabel: '70.0-84.9' },
    'Bronze': { label: 'Bronze', minimumScore: 0, backgroundColor: '#A8632A', textColor: '#FFFFFF', borderColor: '#7E451C', sortOrder: 1, rangeLabel: '0.0-69.9' },
    'Not Rated': { label: 'Not Rated', minimumScore: null, backgroundColor: '#E5E7EB', textColor: '#4B5563', borderColor: '#C7CBD1', sortOrder: 0, rangeLabel: 'Recruit Score unavailable' }
  };

  var CONFIDENCE_LEVEL_CONFIG = {
    'High': { label: 'High', minimumPercentage: 90, backgroundColor: '#DCFCE7', textColor: '#166534', borderColor: '#22C55E', indicatorColor: '#16A34A', sortOrder: 3, rangeLabel: '90.0%-100.0%' },
    'Medium': { label: 'Medium', minimumPercentage: 60, backgroundColor: '#FEF3C7', textColor: '#92400E', borderColor: '#D97706', indicatorColor: '#D97706', sortOrder: 2, rangeLabel: '60.0%-89.9%' },
    'Low': { label: 'Low', minimumPercentage: 0, backgroundColor: '#FEE2E2', textColor: '#991B1B', borderColor: '#DC2626', indicatorColor: '#DC2626', sortOrder: 1, rangeLabel: '0.0%-59.9%' },
    'Unknown': { label: 'Unknown', minimumPercentage: null, backgroundColor: '#E5E7EB', textColor: '#4B5563', borderColor: '#C7CBD1', indicatorColor: '#9CA3AF', sortOrder: 0, rangeLabel: 'Confidence unavailable' }
  };

  var TIER_NAMES = ['Platinum', 'Gold', 'Silver', 'Bronze', 'Not Rated'];
  var CONFIDENCE_NAMES = ['High', 'Medium', 'Low', 'Unknown'];

  var TEXT = {
    recruitScoreTooltip: 'Recruit Score measures objective athlete value on a 0.0 to 100.0 scale.',
    tierTooltip: 'Player Tier reflects objective athlete value. It is derived only from Recruit Score.',
    confidenceTooltip: 'Confidence measures how much verified data supports this evaluation. It does not measure talent. Missing metrics reduce Confidence, not Recruit Score.',
    lowConfidenceTooltip: 'Additional verified metrics are needed to strengthen this evaluation. Low Confidence does not mean the athlete has low talent.',
    cardTier: 'Player Tier reflects objective athlete value.',
    cardConfidence: 'Confidence reflects the amount of verified data supporting the evaluation.',
    empty: 'No athletes match these filters.'
  };

  function isMissing(v) { return v === null || v === undefined || (typeof v === 'number' && !isFinite(v)); }

  function getPlayerTier(recruitScore) {
    if (isMissing(recruitScore)) return 'Not Rated';
    if (recruitScore < 0 || recruitScore > 100) throw new RangeError('Recruit Score must be between 0.0 and 100.0.');
    if (recruitScore >= PLAYER_TIER_CONFIG.Platinum.minimumScore) return 'Platinum';
    if (recruitScore >= PLAYER_TIER_CONFIG.Gold.minimumScore) return 'Gold';
    if (recruitScore >= PLAYER_TIER_CONFIG.Silver.minimumScore) return 'Silver';
    return 'Bronze';
  }

  function getConfidenceLevel(confidencePercentage) {
    if (isMissing(confidencePercentage)) return 'Unknown';
    if (confidencePercentage < 0 || confidencePercentage > 100) throw new RangeError('Confidence Percentage must be between 0.0% and 100.0%.');
    if (confidencePercentage >= CONFIDENCE_LEVEL_CONFIG.High.minimumPercentage) return 'High';
    if (confidencePercentage >= CONFIDENCE_LEVEL_CONFIG.Medium.minimumPercentage) return 'Medium';
    return 'Low';
  }

  function validateRecruitScore(value) {
    if (value === null || value === undefined || value === '') return null;
    var score = Number(value);
    if (!isFinite(score)) throw new TypeError('Recruit Score must be a valid number.');
    if (score < 0 || score > 100) throw new RangeError('Recruit Score must be between 0.0 and 100.0.');
    return score;
  }

  function validateConfidencePercentage(value) {
    if (value === null || value === undefined || value === '') return null;
    var pct = Number(value);
    if (!isFinite(pct)) throw new TypeError('Confidence Percentage must be a valid number.');
    if (pct < 0 || pct > 100) throw new RangeError('Confidence Percentage must be between 0.0% and 100.0%.');
    return pct;
  }

  var DASH = '\u2014';
  function formatRecruitScore(v) { return isMissing(v) ? DASH : Number(v).toFixed(1); }
  // Confidence is shown FLOORED to one decimal (89.96 -> 89.9) so the display never rounds up across a level threshold. Recruit Score keeps normal rounding.
  function floorConfidence(v) { var n = Number(v); return (Math.floor(n * 10 + 1e-9) / 10).toFixed(1); }
  function formatConfidencePercentage(v) { return isMissing(v) ? DASH : floorConfidence(v) + '%'; }

  function tierAccessibleLabel(score) {
    var t = getPlayerTier(score);
    return 'Player Tier: ' + t + '. ' + (t === 'Not Rated' ? 'Recruit Score is unavailable.' : 'Recruit Score ' + formatRecruitScore(score) + '.');
  }

  function confidenceAccessibleLabel(pct) {
    var l = getConfidenceLevel(pct);
    if (l === 'Unknown') return 'Confidence Level: Unknown. Confidence Percentage is unavailable.';
    var base = 'Confidence Level: ' + l + '. Confidence Percentage ' + floorConfidence(pct) + ' percent. ';
    if (l === 'Low') return base + 'Additional verified metrics are needed. Low Confidence does not mean low talent.';
    return base + 'Confidence measures data completeness, not talent.';
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function badgeAttrs(label, tooltip, o) {
    var attrs = ' role="img" aria-label="' + esc(label) + '"';
    if (o.showTooltip !== false) attrs += ' title="' + esc(tooltip) + '"';
    return attrs;
  }

  // Tier badge: visible label + approved colors + accessible name. Never color-only.
  function renderTierBadge(recruitScore, options) {
    var o = options || {};
    var t = getPlayerTier(recruitScore), c = PLAYER_TIER_CONFIG[t];
    var style = 'background-color:' + c.backgroundColor + (c.bgGradient ? ';background-image:' + c.bgGradient : '') + ';color:' + c.textColor + ';border-color:' + c.borderColor;
    var tip = t === 'Not Rated' ? 'Recruit Score has not been calculated. Not Rated is not the same as Bronze.' : TEXT.tierTooltip;
    var focus = o.focusable ? ' tabindex="0"' : '';
    return '<span class="rd-badge rd-tier rd-' + (o.size || 'medium') + '" data-tier="' + esc(t) + '" style="' + style + '"' + focus + badgeAttrs(tierAccessibleLabel(recruitScore), tip, o) + '>' + esc(c.label) + '</span>';
  }

  // Confidence badge: indicator dot only alongside the visible label.
  function renderConfidenceBadge(confidencePercentage, options) {
    var o = options || {};
    var l = getConfidenceLevel(confidencePercentage), c = CONFIDENCE_LEVEL_CONFIG[l];
    var style = 'background-color:' + c.backgroundColor + (c.bgGradient ? ';background-image:' + c.bgGradient : '') + ';color:' + c.textColor + ';border-color:' + c.borderColor;
    var showPct = o.showPercentage !== false && l !== 'Unknown';
    var tip = l === 'Low' ? TEXT.lowConfidenceTooltip : TEXT.confidenceTooltip;
    var focus = o.focusable ? ' tabindex="0"' : '';
    return '<span class="rd-badge rd-conf rd-' + (o.size || 'medium') + '" data-confidence="' + esc(l) + '" style="' + style + '"' + focus + badgeAttrs(confidenceAccessibleLabel(confidencePercentage), tip, o) + '>' +
      '<span class="rd-dot" style="background-color:' + c.indicatorColor + '" aria-hidden="true"></span>' +
      '<span class="rd-conf-text">' + esc(c.label) + (showPct ? ' <span class="rd-sep" aria-hidden="true">&middot;</span> <span class="rd-pct">' + formatConfidencePercentage(confidencePercentage) + '</span>' : '') + '</span></span>';
  }

  // ---------- Sorting (semantic) ----------
  function scoreOf(a, acc) { return acc && acc.score ? acc.score(a) : a.recruitScore; }
  function confOf(a, acc) { return acc && acc.conf ? acc.conf(a) : a.confidencePercentage; }
  function nameOf(a, acc) { return String((acc && acc.name ? acc.name(a) : a.name) || ''); }
  function byName(a, b, acc) { return nameOf(a, acc).localeCompare(nameOf(b, acc)); }

  // dir: 'desc' (default) or 'asc'. Missing values are always last.
  function sortAthletes(list, key, dir, acc) {
    var d = dir === 'asc' ? 1 : -1;
    var rows = list.slice();
    var missing = function (a) {
      if (key === 'tier' || key === 'recruitScore') return isMissing(scoreOf(a, acc));
      return isMissing(confOf(a, acc));
    };
    var valid = rows.filter(function (a) { return !missing(a); });
    var rest = rows.filter(missing);
    valid.sort(function (a, b) {
      var sa = scoreOf(a, acc), sb = scoreOf(b, acc), x;
      if (key === 'tier') {
        x = PLAYER_TIER_CONFIG[getPlayerTier(sa)].sortOrder - PLAYER_TIER_CONFIG[getPlayerTier(sb)].sortOrder;
        if (x) return x * d;
        x = sa - sb; if (x) return x * d;
        return byName(a, b, acc);
      }
      if (key === 'confidence') {
        x = confOf(a, acc) - confOf(b, acc); if (x) return x * d;
        x = !isMissing(sb) && !isMissing(sa) ? sb - sa : (isMissing(sa) ? 1 : -1); if (x) return x;
        return byName(a, b, acc);
      }
      x = sa - sb; if (x) return x * d;
      return byName(a, b, acc);
    });
    rest.sort(function (a, b) {
      if (key === 'confidence') { var x = (isMissing(scoreOf(b, acc)) ? -1 : scoreOf(b, acc)) - (isMissing(scoreOf(a, acc)) ? -1 : scoreOf(a, acc)); if (x) return x; }
      return byName(a, b, acc);
    });
    return valid.concat(rest);
  }

  // ---------- Filtering: OR inside a group, AND across groups and search ----------
  function filterAthletes(list, f, acc) {
    f = f || {};
    var tiers = f.tiers || [], confs = f.confidences || [];
    var q = String(f.search || '').trim().toLowerCase();
    var fields = (acc && acc.searchFields) || function (a) { return [a.name, a.pos, a.sec, a.grad, a.state]; };
    return list.filter(function (a) {
      if (q && !fields(a).filter(function (v) { return v != null && v !== ''; }).some(function (v) { return String(v).toLowerCase().indexOf(q) !== -1; })) return false;
      if (tiers.length && tiers.indexOf(getPlayerTier(scoreOf(a, acc))) === -1) return false;
      if (confs.length && confs.indexOf(getConfidenceLevel(confOf(a, acc))) === -1) return false;
      return !(f.extra && !f.extra(a));
    });
  }

  return {
    PLAYER_TIER_CONFIG: PLAYER_TIER_CONFIG,
    CONFIDENCE_LEVEL_CONFIG: CONFIDENCE_LEVEL_CONFIG,
    TIER_NAMES: TIER_NAMES,
    CONFIDENCE_NAMES: CONFIDENCE_NAMES,
    TEXT: TEXT,
    getPlayerTier: getPlayerTier,
    getConfidenceLevel: getConfidenceLevel,
    validateRecruitScore: validateRecruitScore,
    validateConfidencePercentage: validateConfidencePercentage,
    formatRecruitScore: formatRecruitScore,
    formatConfidencePercentage: formatConfidencePercentage,
    floorConfidence: floorConfidence,
    tierAccessibleLabel: tierAccessibleLabel,
    confidenceAccessibleLabel: confidenceAccessibleLabel,
    renderTierBadge: renderTierBadge,
    renderConfidenceBadge: renderConfidenceBadge,
    sortAthletes: sortAthletes,
    filterAthletes: filterAthletes
  };
}));
