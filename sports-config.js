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
  // Proposed metric NAMES only (placeholders, owner to confirm). No values, grade tables or thresholds exist yet.
  var METRICS = {
    baseball: ['Avg EV', 'Max EV', 'Avg FBV', 'Max FBV', 'Throwing Velo', '60 Time', 'Pop Time'],
    'mens-basketball': ['Height', 'Wingspan', 'Standing Reach', 'Max Vertical', 'Lane Agility', '3/4 Court Sprint', 'Points Per Game', 'Rebounds Per Game', 'Assists Per Game'],
    'womens-basketball': ['Height', 'Wingspan', 'Standing Reach', 'Max Vertical', 'Lane Agility', '3/4 Court Sprint', 'Points Per Game', 'Rebounds Per Game', 'Assists Per Game'],
    football: ['Height', 'Weight', '40-Yard Dash', 'Pro Shuttle', 'Vertical', 'Broad Jump', 'Bench Reps', 'Film Grade'],
    'mens-soccer': ['Height', 'Weight', '30-Meter Sprint', 'Yo-Yo Test', 'Vertical', 'Goals', 'Assists', 'Minutes Played'],
    'womens-soccer': ['Height', 'Weight', '30-Meter Sprint', 'Yo-Yo Test', 'Vertical', 'Goals', 'Assists', 'Minutes Played'],
    softball: ['Pitch Speed', 'Exit Velocity', 'Home-To-First Time', 'Pop Time', 'Throwing Velo', '60 Time'],
    'womens-volleyball': ['Height', 'Standing Reach', 'Approach Touch', 'Block Touch', 'Vertical', 'Kills Per Set', 'Serve Speed']
  };
  var byId = {}, byName = {};
  list.forEach(function (s) { s.metrics = METRICS[s.id] || []; byId[s.id] = s; byName[s.name] = s; });
  var esc = function (x) { return String(x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var chips = function (a) { return '<ul class="intro-list">' + a.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; };
  // One uniform "setup stub" for every sport so the owner can fill each in later. Same structure everywhere.
  function stub(s) {
    var done = !!s.scoring;
    return '<div class="sport-stub">' +
      '<div class="notice navy" role="note"><strong>' + (done ? 'Scoring Available.' : 'Scoring Not Yet Available.') + '</strong> ' + (done ? 'Baseball is the first sport with scoring tables.' : 'Recruit Score shows Not Rated and Confidence shows Unknown (never 0 or Bronze) until the tables exist. Coming Soon.') + ' Everything below marked Placeholder is a stub for the owner to fill in.</div>' +
      '<h3>Positions</h3>' + chips(s.positions) +
      '<h3>Master Database Columns And Athlete Profile Metric Inputs <span class="pill gray">Placeholder</span></h3>' + chips(s.metrics) +
      '<h3>Rankings And H2H Metric Rows <span class="pill gray">Placeholder</span></h3><p class="coach-note">Uses the same metric names above. Values stay Not Entered until athletes or verifiers add them. Not Entered is never treated as 0.</p>' +
      '<h3>Team Needs Positions</h3>' + chips(s.positions) +
      '<h3>Grade Tables <span class="pill gray">Placeholder</span></h3><p>Not Yet Available. Needs the owner grade tables (letter and value per metric) and the Recruit Score weights for ' + esc(s.name) + '.</p>' +
      '<h3>THE READ Blurb <span class="pill gray">Stub</span></h3><p class="coach-note">A <span class="tr">THE READ</span> summary for ' + esc(s.name) + ' athletes appears here once scoring exists. Until then: "Scoring Not Yet Available."</p>' +
      '<h3>TODO / Details Needed</h3><ul class="intro-list"><li>Confirm the position list</li><li>Confirm metric names, units and which are verifiable</li><li>Grade tables per metric (letter and value)</li><li>Recruit Score component weights</li><li>Confidence weights per metric</li><li>Team Needs depth rules</li><li>Level and class labels for this sport</li><li>THE READ blurb wording</li></ul></div>';
  }
  return { list: list, stub: stub, metrics: METRICS, byId: byId, byName: byName, names: list.map(function (s) { return s.name; }), get: function (k) { return byId[k] || byName[k] || null; } };
})();

(function () {
  // Home hero tiles are built from the list above so the two can never drift apart.
  var go = function () {
    var ul = document.querySelector('ul.sport-tiles'); if (!ul) return;
    var soon = ul.querySelector('.sport-tile-soon'), li = soon ? soon.parentNode : null;
    Array.prototype.slice.call(ul.children).forEach(function (x) { if (x !== li) ul.removeChild(x); });
    window.TheReadSports.list.forEach(function (s) {
      var n = document.createElement('li'), a = document.createElement('a'); a.className = 'sport-tile'; a.href = 'sport-' + s.id + '.html'; a.textContent = s.name; n.appendChild(a); ul.insertBefore(n, li);
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();

/* Schools athletes can mark as interested in. Edit here only. Only programs with a coach workspace on THE READ (onRead: true) receive in-app notifications. */
window.TheReadSchools = (function () {
  var list = [
    { name: 'Sample State University', onRead: true }, { name: 'Northern Plains University', onRead: false }, { name: 'Gulf Coast College', onRead: false },
    { name: 'Cascade Tech', onRead: false }, { name: 'Redwood State', onRead: false }, { name: 'Appalachian Valley', onRead: false },
    { name: 'Midwest Metro', onRead: false }, { name: 'Sunbelt University', onRead: false }
  ];
  return { list: list, names: list.map(function (s) { return s.name; }), ours: list[0].name, find: function (n) { return list.filter(function (s) { return s.name.toLowerCase() === String(n).trim().toLowerCase(); })[0] || null; } };
})();