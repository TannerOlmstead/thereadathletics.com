/* THE READ Athletics - the ONE list of launch sports. Edit here only.
   Matches the sport tiles on the home page hero (index.html). "More coming soon" is a teaser, not a sport.
   scoring: true  -> Recruit Score / Tier / Confidence tables exist (baseball first).
   scoring: false -> shows "Scoring Not Yet Available": Recruit Score Not Rated, Confidence Unknown (never 0 or Bronze). */
window.TheReadSports = (function () {
  'use strict';
  var BASE = ['P', 'C', '1B', '2B', '3B', 'SS', 'OF'];
  var list = [
    { id: 'baseball', name: 'Baseball', positions: BASE, scoring: true, anchor: 'baseball' },
    { id: 'mens-basketball', name: 'Men\u2019s Basketball', positions: ['PG', 'SG', 'SF', 'PF', 'C'], scoring: false, anchor: 'basketball' },
    { id: 'womens-basketball', name: 'Women\u2019s Basketball', positions: ['PG', 'SG', 'SF', 'PF', 'C'], scoring: false, anchor: 'basketball' },
    { id: 'football', name: 'Football', positions: ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K/P', 'ATH'], scoring: false, anchor: 'football' },
    { id: 'mens-soccer', name: 'Men\u2019s Soccer', positions: ['GK', 'DEF', 'MID', 'FWD'], scoring: false, anchor: 'soccer' },
    { id: 'womens-soccer', name: 'Women\u2019s Soccer', positions: ['GK', 'DEF', 'MID', 'FWD'], scoring: false, anchor: 'soccer' },
    { id: 'softball', name: 'Softball', positions: BASE, scoring: false, anchor: 'softball' },
    { id: 'womens-volleyball', name: 'Women\u2019s Volleyball', positions: ['S', 'OH', 'MB', 'OPP', 'L/DS'], scoring: false, anchor: 'volleyball' }
  ];
  var byId = {}, byName = {};
  list.forEach(function (s) { byId[s.id] = s; byName[s.name] = s; });
  return { list: list, byId: byId, byName: byName, names: list.map(function (s) { return s.name; }), get: function (k) { return byId[k] || byName[k] || null; } };
})();

(function () {
  // Home hero tiles are built from the list above so the two can never drift apart.
  var go = function () {
    var ul = document.querySelector('ul.sport-tiles'); if (!ul) return;
    var soon = ul.querySelector('.sport-tile-soon'), li = soon ? soon.parentNode : null;
    Array.prototype.slice.call(ul.children).forEach(function (x) { if (x !== li) ul.removeChild(x); });
    window.TheReadSports.list.forEach(function (s) {
      var n = document.createElement('li'), a = document.createElement('a'); a.className = 'sport-tile'; a.href = 'sport-guide.html#' + s.anchor; a.textContent = s.name; n.appendChild(a); ul.insertBefore(n, li);
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
