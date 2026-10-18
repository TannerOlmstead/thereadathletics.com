/* THE READ Athletics - Athletic Department workspace shell.
   - Builds the department tab bar (All Sports) and the two-row bar when a sport is picked (?dsport=<sport id>).
   - Renders department-level pages (Sports, Roster & Scholarships, Compliance, Staff & Permissions, Reports & Data, Billing, Settings).
   - Everything the department enters is saved in this browser only (localStorage). Nothing is sent anywhere. */
(function () {
  'use strict';
  var SP = window.TheReadSports;
  if (!SP) return;
  var KEY = 'theReadDeptData';
  var q = new URLSearchParams(location.search);
  var CTX = SP.get(q.get('dsport') || '');
  var body = document.body;
  var isDept = /ws-dept/.test(body.className) || !!body.dataset.deptPage;
  var isCoach = /ws-coach/.test(body.className);
  if (!isDept && !isCoach) return;

  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var load = function () { var d = null; try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; } d = d && typeof d === 'object' ? d : {}; d.subs = d.subs || {}; d.lim = d.lim || {}; d.staff = d.staff || []; d.t9 = d.t9 || {}; d.school = d.school || {}; d.dates = d.dates || []; d.perms = d.perms || {}; return d; };
  var save = function (d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* storage full or blocked */ } };
  var subscribed = function (d, s) { return d.subs[s.id] !== false; };
  var num = function (v) { var n = parseFloat(v); return isFinite(n) && n >= 0 ? n : null; };
  var csv = function (rows) { return rows.map(function (r) { return r.map(function (c) { var s = String(c == null ? '' : c); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(','); }).join('\r\n'); };
  var download = function (name, text) { var u = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); var a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 1000); };

  var DV = window.TheReadDivisions, DIVC = DV ? DV.current() : null, DIV = DIVC && DIVC.div;
  if (!DIV) return;
  var divName = function () { return DIV.name + (DIVC.sub ? ' (' + DIVC.sub + ')' : ''); };
  var dvSel = function () { return '<label>Division View <select id="ad-div">' + DV.list.map(function (x) { return '<option value="' + x.id + '"' + (x.id === DIV.id ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select></label>'; };
  var DEPT_TABS = [
    ['Overview', 'department-overview.html'], ['Sports', 'department-sports.html'], ['Finances', 'department-finances.html'],
    ['Roster & Scholarships', 'department-roster.html'], ['Compliance', 'department-compliance.html'], ['Staff & Permissions', 'department-staff.html'],
    ['Calendar', 'department-calendar.html'], ['Reports & Data', 'department-reports.html'], ['Connect', 'department-connect.html'], ['Billing', 'department-billing.html'], ['Settings', 'department-settings.html']
  ];
  if (DIV.tabs) DEPT_TABS.forEach(function (t) { if (DIV.tabs[t[0]]) t[0] = DIV.tabs[t[0]]; });
  var SCOPED_DEPT = ['department-overview.html', 'department-finances.html', 'department-roster.html', 'department-compliance.html', 'department-staff.html', 'department-calendar.html', 'department-reports.html'];
  var page = (location.pathname.split('/').pop() || '').toLowerCase();
  var withCtx = function (href) { return CTX ? href + (href.indexOf('?') < 0 ? '?' : '&') + 'dsport=' + encodeURIComponent(CTX.id) : href; };
  var tab = function (label, href, ctx) { return '<a href="' + (ctx ? withCtx(href) : href) + '"' + (href === page ? ' aria-current="page"' : '') + '>' + esc(label) + '</a>'; };

  /* ---------- navigation ---------- */
  var buildNav = function () {
    var d = load();
    var old = document.querySelector('.dept-subnav, .coach-subnav');
    if (!old) return;
    var coachLinks = [];
    if (CTX) {
      var src = document.querySelector('.coach-subnav');
      if (src) Array.prototype.forEach.call(src.querySelectorAll('a:not(.coach-subnav-home)'), function (a) { coachLinks.push([a.textContent.trim(), a.getAttribute('href').split('?')[0]]); });
      if (!coachLinks.length) coachLinks = [['Master Database', 'coach-master-database.html'], ['Dashboard', 'coach-dashboard.html'], ['Rankings', 'coach-rankings.html'], ['Player Card', 'coach-player-card.html'], ['H2H', 'coach-h2h.html'], ['Team Needs', 'coach-team-needs.html'], ['Coach Fit', 'coach-fit.html'], ['Coach Grading', 'coach-grading.html'], ['Recruiting Board', 'coach-recruiting-board.html'], ['Commitments', 'coach-commitments.html'], ['Analytics', 'coach-analytics.html'], ['Regional Insights', 'coach-regional-insights.html'], ['Connect', 'coach-connect.html'], ['Calendar', 'coach-calendar.html']];
      if (!coachLinks.some(function (c) { return c[1] === 'coach-interested.html'; })) coachLinks.push(['Interested', 'coach-interested.html']);
    }
    var html = '';
    if (CTX) {
      var opts = '<option value="">All Sports</option>' + SP.list.filter(function (s) { return subscribed(d, s); }).map(function (s) { return '<option value="' + s.id + '"' + (s.id === CTX.id ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('');
      html += '<div class="ad-crumbs"><nav aria-label="Breadcrumb"><a href="department-overview.html" data-noctx>Athletic Department</a> &rsaquo; <a href="department-sports.html" data-noctx>Sports</a> &rsaquo; <strong>' + esc(CTX.name) + '</strong></nav>' +
        '<span class="ad-tools"><a href="department-sports.html" data-noctx>&larr; Back To All Sports</a><label>Switch Sport <select id="ad-switch">' + opts + '</select></label>' + dvSel() + '<span class="pill" title="Change in Staff &amp; Permissions">Department Access: ' + (d.perms.edit ? 'Edit Enabled' : 'Read-Only') + '</span></span></div>';
      html += '<nav class="dept-subnav" aria-label="Athletic Department tabs"><span class="ws-label">Athletic Department</span>' + DEPT_TABS.filter(function (t) { return SCOPED_DEPT.indexOf(t[1]) >= 0; }).map(function (t) { return tab(t[0], t[1], true); }).join('') + '<a class="ws-out" href="department-overview.html" data-noctx>All Sports View</a></nav>';
      html += '<nav class="coach-subnav" aria-label="Program tabs for ' + esc(CTX.name) + '"><span class="ws-label">Program: ' + esc(CTX.name) + '</span>' + coachLinks.map(function (c) { return tab(c[0], c[1], true); }).join('') + '</nav>';
    } else if (isDept) {
      html += '<div class="ad-crumbs"><nav aria-label="Breadcrumb"><strong>Athletic Department</strong> &rsaquo; All Sports</nav><span class="ad-tools"><a href="department-sports.html" data-noctx>Pick A Sport To Open Its Full Workspace &rarr;</a>' + dvSel() + '<span class="pill">' + esc(divName()) + '</span></span></div>';
      html += '<nav class="dept-subnav" aria-label="Athletic Department workspace"><span class="ws-label">Athletic Department</span>' + DEPT_TABS.map(function (t) { return tab(t[0], t[1], false); }).join('') + '</nav>';
    } else return;
    var wrap = document.createElement('div'); wrap.className = 'ad-nav'; wrap.innerHTML = html;
    old.parentNode.replaceChild(wrap, old);
    var dsel = document.getElementById('ad-div');
    if (dsel) dsel.addEventListener('change', function () { DV.set(dsel.value, ''); location.reload(); });
    var sw = document.getElementById('ad-switch');
    if (sw) sw.addEventListener('change', function () {
      if (!sw.value) { location.href = 'department-overview.html'; return; }
      var keep = /^(coach-|department-)/.test(page) && page !== 'department-sports.html' && page !== 'department-billing.html' && page !== 'department-settings.html' ? page : 'coach-dashboard.html';
      location.href = keep + '?dsport=' + encodeURIComponent(sw.value);
    });
    // Keep the sport context on every in-workspace link, including links drawn by the page scripts.
    if (CTX) document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.hasAttribute('data-noctx')) return;
      var h = a.getAttribute('href') || '';
      if (/^(coach-|department-)[a-z0-9-]+\.html/i.test(h) && h.indexOf('dsport=') < 0) a.setAttribute('href', withCtx(h));
    }, true);
  };

  /* ---------- page helpers ---------- */
  var card = function (t, b, c) { return '<section class="card coach-card ' + (c || '') + '"><h2>' + t + '</h2>' + b + '</section>'; };
  var table = function (head, rows, cap) { return '<div class="table-wrap"><table><caption class="visually-hidden">' + esc(cap || '') + '</caption><thead><tr>' + head.map(function (h) { return '<th scope="col">' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; };
  var empty = function (t) { return '<p class="coach-note">' + t + '</p>'; };
  var CR = function () { return window.TheReadCoach || {}; };
  var allPlayers = function (name) { var c = CR(); return c.allPlayersFor ? c.allPlayersFor(name) : []; };
  var sportsShown = function (d) { var l = SP.list.filter(function (s) { return subscribed(d, s); }); return CTX ? l.filter(function (s) { return s.id === CTX.id; }) : l; };
  var coachOf = function (d, s) { var h = d.staff.filter(function (x) { return x.role === 'Head Coach' && x.sports.indexOf(s.id) >= 0; })[0]; return h ? h.name : 'Not Assigned'; };
  var tierOf = function (p) { return p.tier || 'Not Rated'; };

  var on = function (r, t, f) { var k = '_h' + t; if (r[k]) r.removeEventListener(t, r[k]); r[k] = f; r.addEventListener(t, f); };
  var P = {};

  P.sports = function (root, d) {
    var c = CR(), ours = c.ours, B = c.Board, I = c.Interest;
    var list = SP.list.filter(function (s) { return subscribed(d, s); });
    var off = SP.list.filter(function (s) { return !subscribed(d, s); });
    root.innerHTML = '<p class="coach-note">Pick a sport to open that program\u2019s full coach workspace (Master Database, Dashboard, Rankings, Player Card, H2H, Team Needs, Coach Fit, Recruiting Board, Coach Grading, Commitments, Analytics, Regional Insights, Connect, Calendar) together with the department tabs, scoped to that sport.</p>' +
      (list.length ? '<div class="ad-sport-grid">' + list.map(function (s) {
        var ps = allPlayers(s.name), onB = ps.filter(function (p) { return B && B.has(p.id) && !p.committed; }).length, cm = ps.filter(function (p) { return p.committed === ours; }).length;
        var ia = I && I.byProgram ? I.byProgram(s.name).length : 0;
        return '<article class="card ad-sport"><h3>' + esc(s.name) + '</h3><dl class="dept-dl"><div><dt>Prospects</dt><dd>' + ps.length + '</dd></div><div><dt>On Board</dt><dd>' + onB + '</dd></div><div><dt>Committed</dt><dd>' + cm + '</dd></div><div><dt>Interested</dt><dd>' + ia + '</dd></div></dl>' +
          '<p class="coach-note">Head Coach: ' + esc(coachOf(d, s)) + '<br>' + (s.scoring ? 'Scoring Available' : 'Scoring Not Yet Available') + '</p><a class="button" href="coach-dashboard.html?dsport=' + s.id + '" data-noctx>Open ' + esc(s.name) + ' Workspace</a></article>';
      }).join('') + '</div>' : empty('No sports are active. Add a sport in Billing.')) +
      (off.length ? '<p class="coach-note">Not Subscribed: ' + off.map(function (s) { return esc(s.name); }).join(', ') + '. <a href="department-billing.html">Manage In Billing</a>.</p>' : '');
  };

  var refLinks = function () { return '<p class="coach-note"><strong>Verify With Your Compliance Office / Official Governing Body.</strong> ' + DIV.links.map(function (l) { return '<a href="' + l[1] + '" target="_blank" rel="noopener">' + esc(l[0]) + '</a>'; }).join(' &middot; ') + '. THE READ does not supply rule numbers; every limit here is entered by you.</p>'; };
  P.roster = function (root, d) {
    var list = sportsShown(d), F = DIV.limitFields;
    var rows = list.map(function (s) {
      var l = d.lim[s.id] || {};
      var cells = F.map(function (f) { return '<td><input type="number" min="0" step="0.1" data-s="' + s.id + '" data-k="' + f[0] + '" value="' + (l[f[0]] == null ? '' : l[f[0]]) + '" aria-label="' + esc(s.name + ' ' + f[1]) + '"></td>'; }).join('');
      var rr = l.rl != null && l.rs != null ? (l.rl - l.rs) : '&mdash;';
      return '<tr><th scope="row">' + esc(s.name) + '</th>' + cells + '<td>' + rr + '</td></tr>';
    });
    var head = ['Sport'].concat(F.map(function (f) { return f[1]; }), ['Roster Spots Left']);
    var t = d.t9, tf = function (k, lab) { return '<div class="field"><label for="t9-' + k + '">' + lab + '</label><input id="t9-' + k + '" type="number" min="0" step="1" data-t9="' + k + '" value="' + (t[k] == null ? '' : t[k]) + '"></div>'; };
    var pct = t.mp != null && t.wp != null && t.mp + t.wp > 0 ? (100 * t.wp / (t.mp + t.wp)).toFixed(1) + '% Women' : '&mdash;';
    var hasT9 = DIV.sections.some(function (x) { return /Title IX/.test(x); });
    var C = CR(), B = C.Board, ps = allPlayers(CTX && CTX.name).filter(function (p) { return B && B.has(p.id) && !p.committed; });
    var el = d.elig || {};
    var eligTbl = ps.length ? table(['Prospect', 'Sport', DIV.eligLabel], ps.map(function (p) { return '<tr><th scope="row">' + esc(p.name) + '</th><td>' + esc(p.sport) + '</td><td><select data-elig="' + esc(p.id) + '" aria-label="' + esc(DIV.eligLabel + ' for ' + p.name) + '">' + DIV.eligValues.map(function (v) { return '<option' + ((el[p.id] || 'Not Provided') === v ? ' selected' : '') + '>' + v + '</option>'; }).join('') + '</select></td></tr>'; }), 'Prospect eligibility statuses') : empty('No prospects on the Recruiting Board yet.');
    root.innerHTML = '<div class="coach-grid">' +
      card(DIV.aid === 'none' ? 'Roster &amp; Admissions Support' : 'Roster &amp; Aid By Sport', '<p class="coach-note">' + esc(DIV.financeNote) + ' Blank means not entered; nothing is treated as zero.</p>' + refLinks() + table(head, rows, 'Roster and aid by sport'), 'wide') +
      card('Roster Fields Tracked (' + esc(DIV.short) + ')', '<ul class="dept-list">' + DIV.rosterFields.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>') +
      card(esc(DIV.eligLabel), '<p class="coach-note">Entered by staff or the athlete. Not checked against any official system and not verification.</p>' + eligTbl, 'wide') +
      (hasT9 ? card('Gender Equity / Title IX Snapshot', '<p class="coach-note">Informational only, from numbers you enter. Not a compliance determination.</p><div class="form-grid">' + tf('mp', 'Men\u2019s Participants') + tf('wp', 'Women\u2019s Participants') + (DIV.aid === 'none' ? '' : tf('ms', 'Men\u2019s Scholarship Dollars') + tf('ws', 'Women\u2019s Scholarship Dollars')) + '</div><p><strong>Participation Split:</strong> ' + pct + '</p>') : '') + '</div>';
    on(root, 'change', function (e) {
      var i = e.target, dd = load();
      if (i.dataset.s) { dd.lim[i.dataset.s] = dd.lim[i.dataset.s] || {}; dd.lim[i.dataset.s][i.dataset.k] = num(i.value); save(dd); P.roster(root, dd); }
      else if (i.dataset.t9) { dd.t9[i.dataset.t9] = num(i.value); save(dd); P.roster(root, dd); }
      else if (i.dataset.elig) { dd.elig = dd.elig || {}; dd.elig[i.dataset.elig] = i.value; save(dd); }
    });
  };

  P.compliance = function (root, d) {
    var dates = d.dates.filter(function (x) { return !CTX || !x.sport || x.sport === CTX.id; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var MS = window.TheReadMessaging, ths = MS && MS.listThreads ? MS.listThreads() : [];
    var rows = ths.map(function (t) { var last = t.messages[t.messages.length - 1] || {}; return '<tr><th scope="row">' + esc(t.name) + '</th><td>' + esc(t.role) + '</td><td>' + t.messages.length + '</td><td>' + esc((last.ts || '').replace('T', ' ')) + '</td><td>' + (t.role === 'Player' ? 'Athlete Contact: Check Minor And NCAA Contact Rules' : '&mdash;') + (t.blocked ? ' &middot; Blocked' : '') + (t.reported ? ' &middot; Reported' : '') + '</td></tr>'; });
    root.innerHTML = '<div class="coach-grid">' +
      card('Calendar &amp; Compliance Reminders (' + esc(DIV.short) + ')', '<p class="coach-note">' + esc(DIV.calNote) + '</p><ul class="dept-list">' + DIV.sections.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><p class="coach-note">Reminders only: THE READ does not supply or invent dates, limits or rules. Under-18 athletes: guardian visibility rules apply to coach messages.</p>' + refLinks()) +
      card('Your Compliance Dates', '<form id="cd-form" class="calc"><div class="form-grid"><div class="field"><label for="cd-d">Date</label><input id="cd-d" type="date" required></div><div class="field"><label for="cd-l">Label</label><input id="cd-l" required maxlength="80"></div><div class="field"><label for="cd-s">Sport</label><select id="cd-s"><option value="">All Sports</option>' + SP.list.map(function (s) { return '<option value="' + s.id + '">' + esc(s.name) + '</option>'; }).join('') + '</select></div></div><button class="button" type="submit">Add Date</button></form>' +
        (dates.length ? table(['Date', 'Sport', 'Label', ''], dates.map(function (x) { var s = SP.get(x.sport); return '<tr><td>' + esc(x.date) + '</td><td>' + esc(s ? s.name : 'All Sports') + '</td><td>' + esc(x.label) + '</td><td><button type="button" class="button button-secondary" data-cd-del="' + x.id + '">Remove</button></td></tr>'; }), 'Compliance dates') : empty('No dates entered yet.'))) +
      card('Messaging Oversight', (rows.length ? table(['Contact', 'Role', 'Messages', 'Last Message', 'Flags'], rows, 'Messaging oversight') : empty('No conversations yet.')) + '<p class="coach-note">Shows conversations saved in this browser. Real department-wide audit logging needs accounts and a server (roadmap).</p>', 'wide') + '</div>';
    root.querySelector('#cd-form').addEventListener('submit', function (e) { e.preventDefault(); var dd = load(); dd.dates.push({ id: 'd' + Date.now(), date: root.querySelector('#cd-d').value, label: root.querySelector('#cd-l').value.trim(), sport: root.querySelector('#cd-s').value }); save(dd); P.compliance(root, dd); });
    on(root, 'click', function (e) { var b = e.target.closest('[data-cd-del]'); if (b) { var dd = load(); dd.dates = dd.dates.filter(function (x) { return x.id !== b.dataset.cdDel; }); save(dd); P.compliance(root, dd); } });
  };

  var ROLES = ['Athletic Director', 'Head Coach', 'Assistant Coach', 'Compliance', 'Admin'];
  P.connect = function (root) { if (window.TheReadConnect) window.TheReadConnect.render(root, { layout: 'dept' }); else root.innerHTML = '<p class="coach-note">Connect could not load.</p>'; };

  P.staff = function (root, d) {
    var seat = SP.list.filter(function (s) { return subscribed(d, s); }).map(function (s) { var n = d.staff.filter(function (x) { return x.sports.indexOf(s.id) >= 0; }).length; return '<tr><th scope="row">' + esc(s.name) + '</th><td>' + n + ' Of 6</td><td>' + (n > 6 ? 'Over Limit' : 'OK') + '</td></tr>'; });
    root.innerHTML = '<div class="coach-grid">' +
      card('Staff Directory', (d.staff.length ? table(['Name', 'Email', 'Role', 'Sports', 'Status', ''], d.staff.map(function (x) { return '<tr><th scope="row">' + esc(x.name) + '</th><td>' + esc(x.email) + '</td><td>' + esc(x.role) + '</td><td>' + esc(x.sports.map(function (i) { return (SP.get(i) || {}).name; }).filter(Boolean).join(', ') || 'Department-Wide') + '</td><td>' + esc(x.status) + '</td><td><button type="button" class="button button-secondary" data-st-del="' + x.id + '">Remove</button></td></tr>'; }), 'Staff directory') : empty('No staff added yet.')), 'wide') +
      card('Invite Staff', '<form id="st-form" class="calc"><div class="form-grid"><div class="field"><label for="st-n">Name</label><input id="st-n" required maxlength="80"></div><div class="field"><label for="st-e">Email</label><input id="st-e" type="email" required></div><div class="field"><label for="st-r">Role</label><select id="st-r">' + ROLES.map(function (r) { return '<option>' + r + '</option>'; }).join('') + '</select></div></div><fieldset><legend>Sports (Leave Empty For Department-Wide)</legend>' + SP.list.map(function (s) { return '<label class="inline-check"><input type="checkbox" name="sp" value="' + s.id + '"> ' + esc(s.name) + '</label>'; }).join(' ') + '</fieldset><button class="button" type="submit">Add Staff</button><p class="coach-note">Saved in this browser only. No invitation email is sent. Real invites and sign-in need accounts (roadmap).</p></form>') +
      card('Seat Usage Per Sport', table(['Sport', 'Users', 'Status'], seat, 'Seat usage') + '<p class="coach-note">Pricing includes up to 6 users per active sport.</p>') +
      card('Roles &amp; Permissions', '<ul class="dept-list"><li><strong>Athletic Director / Admin:</strong> all sports, billing, staff.</li><li><strong>Head Coach / Assistant Coach:</strong> their assigned sports.</li><li><strong>Compliance:</strong> read access plus Compliance tab.</li></ul><label class="inline-check"><input type="checkbox" id="st-edit"' + (d.perms.edit ? ' checked' : '') + '> Allow Department Edit Access In Program Workspaces</label><p class="coach-note">This choice is recorded and shown in the program view. It is not enforced until real accounts exist (roadmap).</p>') + '</div>';
    root.querySelector('#st-form').addEventListener('submit', function (e) { e.preventDefault(); var dd = load(); dd.staff.push({ id: 's' + Date.now(), name: root.querySelector('#st-n').value.trim(), email: root.querySelector('#st-e').value.trim(), role: root.querySelector('#st-r').value, sports: Array.prototype.map.call(root.querySelectorAll('input[name=sp]:checked'), function (c) { return c.value; }), status: 'Saved (No Invite Sent)' }); save(dd); P.staff(root, dd); });
    on(root, 'click', function (e) { var b = e.target.closest('[data-st-del]'); if (b) { var dd = load(); dd.staff = dd.staff.filter(function (x) { return x.id !== b.dataset.stDel; }); save(dd); P.staff(root, dd); } });
    root.querySelector('#st-edit').addEventListener('change', function (e) { var dd = load(); dd.perms.edit = e.target.checked; save(dd); });
  };

  P.reports = function (root, d) {
    var c = CR(), B = c.Board, I = c.Interest, ours = c.ours;
    var ps = allPlayers(CTX && CTX.name);
    var onB = ps.filter(function (p) { return B && B.has(p.id) && !p.committed; });
    var cm = ps.filter(function (p) { return p.committed === ours; });
    var portal = ps.filter(function (p) { return p.level && p.level !== 'High School'; });
    var intr = I && I.rows ? I.rows().filter(function (r) { return !CTX || r.p.sport === CTX.name; }) : [];
    root.innerHTML = '<div class="coach-grid">' +
      card('Reports &amp; Exports', '<p class="coach-note">CSV files download to your computer. Use Print for a paper or PDF copy of this page.</p><div class="btn-row"><button type="button" class="button" data-rx="board">Recruiting Board (CSV)</button> <button type="button" class="button" data-rx="commit">Commitments (CSV)</button> <button type="button" class="button" data-rx="budget">Roster &amp; Budget (CSV)</button> <button type="button" class="button" data-rx="db">Master Database (CSV)</button> <button type="button" class="button button-secondary" onclick="window.print()">Print This Page</button></div>') +
      card('Offline Recruiting Board Import', '<p class="coach-note">Upload a CSV with a Player ID or Name column. Players already in the Master Database are added to the Recruiting Board. Unknown names are reported, not created.</p><input type="file" id="rx-file" accept=".csv,text/csv" aria-label="Recruiting board CSV file"><div id="rx-out" role="status" aria-live="polite" class="callout"></div>') +
      card('Interested Athletes Rollup', intr.length ? table(['Athlete', 'Sport', 'Pos', 'Recruit Score', 'Tier'], intr.map(function (r) { return '<tr><th scope="row">' + esc(r.p.name) + '</th><td>' + esc(r.p.sport) + '</td><td>' + esc(r.p.pos) + '</td><td>' + (r.p.rs == null ? 'Not Rated' : r.p.rs) + '</td><td>' + esc(tierOf(r.p)) + '</td></tr>'; }), 'Interested athletes') : empty('No athletes have marked interest yet.'), 'wide') +
      card('Transfer Portal / JUCO Watch', portal.length ? table(['Athlete', 'Sport', 'Pos', 'Level', 'Current College', 'Portal Status', 'Recruit Score', 'Tier'], portal.map(function (p) { return '<tr><th scope="row">' + esc(p.name) + '</th><td>' + esc(p.sport) + '</td><td>' + esc(p.pos) + '</td><td>' + esc(p.level) + '</td><td>' + esc(p.xfer ? p.xfer.college : 'Not Provided') + '</td><td>' + esc(p.xfer ? p.xfer.portal : 'Not Provided') + '</td><td>' + (p.rs == null ? 'Not Rated' : p.rs) + '</td><td>' + esc(tierOf(p)) + '</td></tr>'; }), 'Transfer and JUCO watch') : empty('No JUCO or transfer-portal prospects in the Master Database.'), 'wide') + '</div>';
    var row = function (p) { return [p.id, p.name, p.sport, p.pos, p.grad, p.level, p.rs == null ? '' : p.rs, tierOf(p), p.conf == null ? '' : p.conf, p.entered ? 'Coach/Athlete-Entered' : 'Master Database']; };
    var H = ['Player ID', 'Name', 'Sport', 'Position', 'Grad Year', 'Level', 'Recruit Score', 'Tier', 'Confidence', 'Source'];
    on(root, 'click', function (e) {
      var b = e.target.closest('[data-rx]'); if (!b) return;
      var k = b.dataset.rx, tag = CTX ? '-' + CTX.id : '';
      if (k === 'board') download('recruiting-board' + tag + '.csv', csv([H].concat(onB.map(row))));
      else if (k === 'commit') download('commitments' + tag + '.csv', csv([H].concat(cm.map(row))));
      else if (k === 'db') download('master-database' + tag + '.csv', csv([H].concat(ps.map(row))));
      else { var dd = load(); download('roster-budget' + tag + '.csv', csv([['Sport', 'Roster Size', 'Roster Limit', 'Equivalencies Available', 'Equivalencies Used']].concat(sportsShown(dd).map(function (s) { var l = dd.lim[s.id] || {}; return [s.name, l.rs, l.rl, l.sa, l.su]; })))); }
    });
    root.querySelector('#rx-file').addEventListener('change', function (e) {
      var f = e.target.files[0], out = root.querySelector('#rx-out'); if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        var lines = String(r.result).split(/\r?\n/).filter(Boolean), head = (lines.shift() || '').split(',').map(function (h) { return h.replace(/"/g, '').trim().toLowerCase(); });
        var ii = head.indexOf('player id'), ni = head.indexOf('name');
        if (ii < 0 && ni < 0) { out.textContent = 'No Player ID or Name column found.'; return; }
        var pool = allPlayers(CTX && CTX.name), added = 0, already = 0, missing = [];
        lines.forEach(function (ln) {
          var cells = ln.split(',').map(function (x) { return x.replace(/^"|"$/g, '').trim(); }), key = (ii >= 0 ? cells[ii] : cells[ni]) || '';
          var p = pool.filter(function (x) { return ii >= 0 ? x.id === key : x.name.toLowerCase() === key.toLowerCase(); })[0];
          if (!p) { if (key) missing.push(key); } else if (B.add(p.id)) added++; else already++;
        });
        out.textContent = 'Added ' + added + ' to the Recruiting Board. Already on board or committed: ' + already + '. Not found: ' + (missing.length ? missing.join(', ') : 'none') + '.';
      };
      r.readAsText(f);
    });
  };

  P.billing = function (root, d) {
    var nOn = SP.list.filter(function (s) { return subscribed(d, s); }).length;
    root.innerHTML = '<div class="coach-grid">' + card('Active Sports', '<p><strong>' + nOn + '</strong> Of ' + SP.list.length + ' Launch Sports Active. Pricing is per active sport. See <a href="pricing.html">Pricing</a>.</p>' + table(['Sport', 'Active'], SP.list.map(function (s) { return '<tr><th scope="row">' + esc(s.name) + '</th><td><label class="inline-check"><input type="checkbox" data-sub="' + s.id + '"' + (subscribed(d, s) ? ' checked' : '') + '> Active</label></td></tr>'; }), 'Active sports'), 'wide') +
      card('Founding Status', '<label class="inline-check"><input type="checkbox" id="bl-f"' + (d.perms.founding ? ' checked' : '') + '> Founding Institution (As Defined In The Pricing Plan)</label>') +
      card('Payments', '<p class="coach-note">No payments are processed on this site. Subscription changes here only decide which sports appear in your workspace. Real billing is on the roadmap.</p>') + '</div>';
    on(root, 'change', function (e) { var dd = load(); if (e.target.dataset.sub) { dd.subs[e.target.dataset.sub] = e.target.checked; save(dd); P.billing(root, dd); } else if (e.target.id === 'bl-f') { dd.perms.founding = e.target.checked; save(dd); } });
  };

  P.settings = function (root, d) {
    var s = d.school;
    root.innerHTML = '<form id="se-form" class="card coach-card calc"><h2>School Information</h2><div class="form-grid"><div class="field"><label for="se-dv">Division / Association</label><select id="se-dv">' + DV.list.map(function (x) { return '<option value="' + x.id + '"' + (x.id === DIV.id ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select></div><div class="field"><label for="se-sb">Subdivision / Level</label><select id="se-sb"><option value="">Not Applicable</option>' + DIV.subs.map(function (x) { return '<option' + (x === DIVC.sub ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select></div><div class="field"><label for="se-n">School Name</label><input id="se-n" maxlength="100" value="' + esc(s.name) + '"></div><div class="field"><label for="se-m">Mascot</label><input id="se-m" maxlength="60" value="' + esc(s.mascot) + '"></div><div class="field"><label for="se-c">Brand Color</label><input id="se-c" type="color" value="' + esc(s.color || '#E41E3F') + '"></div><div class="field"><label for="se-l">Logo (Optional, Under 300 KB)</label><input id="se-l" type="file" accept="image/*"></div></div>' + (s.logo ? '<p><img src="' + esc(s.logo) + '" alt="School logo preview" style="max-height:80px"></p>' : '') + '<button class="button" type="submit">Save Settings</button><div id="se-out" role="status" aria-live="polite" class="callout"></div><p class="coach-note">Saved in this browser only.</p></form>';
    root.querySelector('#se-dv').addEventListener('change', function (e) { var x = DV.get(e.target.value), sb = root.querySelector('#se-sb'); sb.innerHTML = '<option value="">Not Applicable</option>' + x.subs.map(function (y) { return '<option>' + esc(y) + '</option>'; }).join(''); });
    root.querySelector('#se-form').addEventListener('submit', function (e) {
      e.preventDefault(); var dd = load(), f = root.querySelector('#se-l').files[0], out = root.querySelector('#se-out');
      var fin = function (logo) { DV.set(root.querySelector('#se-dv').value, root.querySelector('#se-sb').value); dd.school = { name: root.querySelector('#se-n').value.trim(), mascot: root.querySelector('#se-m').value.trim(), color: root.querySelector('#se-c').value, logo: logo }; save(dd); out.textContent = 'Settings saved.'; if (root.querySelector('#se-dv').value !== DIV.id) location.reload(); };
      if (f) { if (f.size > 300000) { out.textContent = 'Logo is too large. Choose an image under 300 KB.'; return; } var r = new FileReader(); r.onload = function () { fin(String(r.result)); P.settings(root, load()); }; r.readAsDataURL(f); } else fin(dd.school.logo || '');
    });
  };

  /* ---------- Finances: every number labeled, with inputs vs calculated, formulas and line items ---------- */
  var fm = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
  var NE = '<span class="fin-ne">Not Entered</span>';
  var tag = function (k) { return k === 'in' ? '<span class="fin-tag fin-in">Input</span>' : '<span class="fin-tag fin-calc">Calculated</span>'; };
  var how = function (formula, inputs, note) { return '<details class="fin-how"><summary>How This Is Calculated</summary><p><strong>Formula:</strong> ' + formula + '</p><p><strong>Inputs Used:</strong> ' + inputs + '</p>' + (note ? '<p>' + note + '</p>' : '') + '</details>'; };
  var finances = function (root, d) {
    var sample = '', ex = root._finEx = root._finEx || (root.querySelector('.table-wrap') || {}).outerHTML || '';
    if (ex && DIV.aid !== 'none') sample = '<details class="card coach-card fin-example"><summary><h2>Example Budget Vs Spend (Not Your Data)</h2></summary><p class="coach-note">Made-up example figures showing the layout only. They are not your numbers, not real budgets, and not rule limits. Your own figures are above.</p>' + ex + '</details>';
    var F = d.fin = d.fin || {}, list = sportsShown(d), aid = DIV.aid !== 'none';
    var g = function (id, k) { var v = (F[id] || {})[k]; return v == null ? null : v; };
    var sums = function (id) {
      var items = [['Travel', g(id, 'rt')], ['Camps', g(id, 'rc')], ['Visits', g(id, 'rv')]], got = items.filter(function (x) { return x[1] != null; });
      return { got: got, missing: items.filter(function (x) { return x[1] == null; }).map(function (x) { return x[0]; }), total: got.length ? got.reduce(function (a, x) { return a + x[1]; }, 0) : null };
    };
    var money = function (v) { return v == null ? NE : fm(v); };
    var inp = function (id, k, lab, step) { var v = g(id, k); return '<td><input type="number" min="0" step="' + step + '" data-fs="' + id + '" data-fk="' + k + '" value="' + (v == null ? '' : v) + '" aria-label="' + esc(lab) + '"></td>'; };
    var inCols = [['rb', 'Annual Recruiting Budget ($ Per Sport)', 100], ['rt', 'Recruiting Travel Spent To Date ($)', 100], ['rc', 'Camp Costs Spent To Date ($)', 100], ['rv', 'Visit Costs Spent To Date ($)', 100], ['ro', 'Program Operating Budget ($ Per Year)', 100]];
    if (aid) inCols.push(['ab', 'Athletic Aid Budget ($ Per Year)', 100], ['ac', '$ Committed (Scholarship Offers)', 100]);
    inCols.push(['cm', 'Commitments (Count)', 1]);
    var inRows = list.map(function (s) { return '<tr><th scope="row">' + esc(s.name) + '</th>' + inCols.map(function (c) { return inp(s.id, c[0], s.name + ' ' + c[1], c[2]); }).join('') + '<td><input type="text" maxlength="80" data-fs="' + s.id + '" data-fk="src" value="' + esc(g(s.id, 'src') || '') + '" aria-label="' + esc(s.name + ' Source Of Numbers') + '"></td><td>' + (g(s.id, 'upd') ? esc(g(s.id, 'upd')) : NE) + '</td></tr>'; });
    var T = { rb: 0, spent: 0, ro: 0, ab: 0, ac: 0, cm: 0, rem: 0 }, inc = { rb: [], spent: [], ro: [], ab: [], ac: [], cm: [], rem: [] };
    var calcRows = list.map(function (s) {
      var id = s.id, sp = sums(id), rb = g(id, 'rb'), ro = g(id, 'ro'), ab = g(id, 'ab'), ac = g(id, 'ac'), cm = g(id, 'cm');
      var rem = rb != null && sp.total != null ? rb - sp.total : null, cpc = sp.total != null && cm ? sp.total / cm : null;
      var arem = aid && ab != null && ac != null ? ab - ac : null;
      if (rb != null) { T.rb += rb; inc.rb.push(s.name); } if (sp.total != null) { T.spent += sp.total; inc.spent.push(s.name); } if (ro != null) { T.ro += ro; inc.ro.push(s.name); }
      if (ab != null) { T.ab += ab; inc.ab.push(s.name); } if (ac != null) { T.ac += ac; inc.ac.push(s.name); } if (cm != null) { T.cm += cm; inc.cm.push(s.name); } if (rem != null) { T.rem += rem; inc.rem.push(s.name); }
      var items = sp.got.length ? sp.got.map(function (x) { return x[0] + ' ' + fm(x[1]); }).join(' + ') + ' = ' + fm(sp.total) + (sp.missing.length ? ' <small>(' + sp.missing.join(', ') + ' not entered)</small>' : '') : NE;
      return '<tr><th scope="row">' + esc(s.name) + '</th><td>' + money(rb) + '</td><td>' + items + '</td><td>' + money(rem) + '</td><td>' + money(ro) + '</td>' + (aid ? '<td>' + money(ab) + '</td><td>' + money(ac) + '</td><td>' + money(arem) + '</td>' : '') + '<td>' + (cm == null ? NE : cm) + '</td><td>' + (cpc == null ? NE : fm(cpc)) + '</td></tr>';
    });
    var uniq = function (a) { return a.length ? a.length + ' of ' + list.length + ' sports' : 'No sports entered'; };
    var tt = function (k, f) { return inc[k].length ? f(T[k]) : NE; };
    var totCpc = inc.spent.length && T.cm > 0 ? fm(T.spent / T.cm) : NE;
    var totRow = '<tr class="fin-total"><th scope="row">Department Total</th><td>' + tt('rb', fm) + '</td><td>' + tt('spent', fm) + '</td><td>' + tt('rem', fm) + '</td><td>' + tt('ro', fm) + '</td>' + (aid ? '<td>' + tt('ab', fm) + '</td><td>' + tt('ac', fm) + '</td><td>' + (inc.ab.length && inc.ac.length ? fm(T.ab - T.ac) : NE) + '</td>' : '') + '<td>' + tt('cm', String) + '</td><td>' + totCpc + '</td></tr>';
    var head = ['Sport', 'Annual Recruiting Budget ($)', 'Recruiting Spent To Date ($) = Line Items', '$ Remaining (Recruiting)', 'Program Operating Budget ($)'].concat(aid ? ['Athletic Aid Budget ($)', '$ Committed (Scholarship Offers)', '$ Aid Remaining'] : [], ['Commitments (Count)', 'Cost Per Commitment ($)']);
    var sub = d.fin._dept || {}, subN = SP.list.filter(function (s) { return subscribed(d, s); }).length;
    var kpis = '<div class="kpi-row">' + [['Annual Recruiting Budget (All Sports, $)', tt('rb', fm), 'in'], ['$ Spent To Date (Travel + Camps + Visits)', tt('spent', fm), 'calc'], ['$ Remaining (Budget - Spent)', tt('rem', fm), 'calc'], ['Cost Per Commitment ($ Spent / Commitments)', totCpc, 'calc']].map(function (k) { return '<div class="kpi"><span>' + k[0] + '</span><strong>' + k[1] + '</strong></div>'; }).join('') + '</div><p class="coach-note">Totals include only sports with numbers entered (budget: ' + uniq(inc.rb) + '; spent: ' + uniq(inc.spent) + '). Blank entries are shown as Not Entered and are never counted as $0. All amounts are in US dollars for the current budget year, rounded to the nearest whole dollar.</p>';
    var legend = card('How To Read This Page', '<ul class="dept-list"><li>' + tag('in') + ' Numbers you type in. Each row keeps a source and the date you last changed it.</li><li>' + tag('calc') + ' Numbers the page works out from your inputs. Open &ldquo;How This Is Calculated&rdquo; under any of them.</li><li><strong>Four different pots of money are kept apart:</strong> (1) Athletic Aid / Scholarships, (2) Recruiting Expense Budget, (3) Program Operating Budget, and (4) THE READ Subscription. They are never added together.</li><li>' + NE + ' means blank. It is left out of totals and never treated as $0.</li><li>THE READ does not supply NCAA, NAIA or NJCAA limits. Every limit is a number you enter; check with your compliance office.</li></ul>');
    var subCard = card('THE READ Subscription Cost (Separate From Your Budgets)', '<div class="form-grid"><div class="field"><label for="fin-sub">Annual THE READ Subscription ($ Per Year)</label><input id="fin-sub" type="number" min="0" step="100" data-fd="sub" value="' + (sub.sub == null ? '' : sub.sub) + '"></div><div class="field"><label for="fin-subsrc">Source (Invoice / Quote)</label><input id="fin-subsrc" type="text" maxlength="80" data-fd="src" value="' + esc(sub.src || '') + '"></div></div><p><strong>Active Sports:</strong> ' + subN + ' of ' + SP.list.length + ' &middot; <strong>Annual Subscription:</strong> ' + (sub.sub == null ? NE : fm(sub.sub)) + ' ' + tag('in') + '</p><p class="coach-note">Pricing is per active sport. See <a href="pricing.html">Pricing</a> and <a href="department-billing.html">Billing &amp; Subscription</a>. Not part of the recruiting budget or program operating budget above.</p>');
    var how1 = '<h3>How The Calculated Numbers Work</h3>' +
      how('$ Spent To Date = Travel + Camps + Visits', 'Recruiting Travel Spent, Camp Costs Spent and Visit Costs Spent for that sport.', 'Line items are shown in the row. If one is blank, the total uses only the ones you entered and says which were not entered.') +
      how('$ Remaining (Recruiting) = Annual Recruiting Budget - $ Spent To Date', 'Annual Recruiting Budget and the $ Spent To Date line items.', 'Shown only when both a budget and at least one spend item are entered. Scholarship aid is not part of this.') +
      (aid ? how('$ Aid Remaining = Athletic Aid Budget - $ Committed (Scholarship Offers)', 'Athletic Aid Budget and $ Committed (Scholarship Offers).', 'Aid is tracked separately from recruiting expenses. It is not deducted from the recruiting budget.') : '') +
      how('Cost Per Commitment = $ Spent To Date / Commitments', 'Recruiting spend (Travel + Camps + Visits) and the number of commitments.', 'Not shown when Commitments is blank or 0. It does not include scholarship aid or operating costs.') +
      how('Department Total = sum of the sports that have a number entered', 'The sport rows above.', 'Department Cost Per Commitment = total spent / total commitments, using the same sports.');
    var out = '<div class="coach-grid">' + card('Finance Model Notes', '<p class="coach-note">' + esc(DIV.financeNote) + '</p>' + refLinks(), 'wide') + legend + card('Department-Wide Rollup (All Sports Shown)', kpis, 'wide') +
      card('Your Inputs By Sport ' + tag('in'), '<p class="coach-note">Type your own figures. Leave blank if unknown. Saved in this browser only.</p>' + table(['Sport'].concat(inCols.map(function (c) { return c[1]; }), ['Source Of Numbers', 'Last Updated']), inRows, 'Finance inputs by sport'), 'wide') +
      card('Per-Sport Results ' + tag('calc'), table(head, calcRows.concat([totRow]), 'Finance results by sport and department total') + how1, 'wide') + subCard + card('Finance Glossary', '<dl class="dept-dl fin-gloss"><div><dt>Athletic Aid / Scholarship Equivalency</dt><dd>Aid given to athletes. A count of equivalencies lives in Roster &amp; Scholarships; dollars live here. Rules vary by division.</dd></div><div><dt>Recruiting Expense Budget</dt><dd>Money for travel, camps and visits to find athletes. Excludes aid.</dd></div><div><dt>Program Operating Budget</dt><dd>Day-to-day cost of running a team (equipment, travel to games). Excludes recruiting and aid.</dd></div><div><dt>$ Committed (Scholarship Offers)</dt><dd>Aid dollars promised in offers, even if not yet paid.</dd></div><div><dt>$ Spent To Date</dt><dd>Money already spent this budget year.</dd></div><div><dt>$ Remaining</dt><dd>Budget minus spent (and minus committed, for aid).</dd></div><div><dt>Cost Per Commitment</dt><dd>Recruiting dollars spent for each athlete who committed.</dd></div><div><dt>Not Entered</dt><dd>You have not typed a number. It is skipped, not $0.</dd></div></dl>') + '</div>' + sample;
    root.innerHTML = out;
    on(root, 'change', function (e) {
      var i = e.target, dd = load(); dd.fin = dd.fin || {}; var today = new Date().toISOString().slice(0, 10);
      if (i.dataset.fs) { var r = dd.fin[i.dataset.fs] = dd.fin[i.dataset.fs] || {}; r[i.dataset.fk] = i.dataset.fk === 'src' ? i.value.trim() : num(i.value); r.upd = today; save(dd); finances(root, dd); }
      else if (i.dataset.fd) { var s2 = dd.fin._dept = dd.fin._dept || {}; s2[i.dataset.fd] = i.dataset.fd === 'src' ? i.value.trim() : num(i.value); save(dd); finances(root, dd); }
    });
  };
  var divExtras = function (root) {
    if (!root) return;
    var d = load(), list = sportsShown(d), tot = function (k) { var n = 0, any = false; list.forEach(function (s) { var v = (d.lim[s.id] || {})[k]; if (v != null) { n += v; any = true; } }); return any ? n : null; };
    var C = CR(), B = C.Board, ps = allPlayers(CTX && CTX.name), el = d.elig || {};
    var onB = ps.filter(function (p) { return B && B.has(p.id) && !p.committed; });
    var pct = function (a, b) { return a != null && b ? Math.round(1000 * a / b) / 10 + '%' : 'Not Entered'; };
    var admitted = onB.filter(function (p) { return el[p.id] === 'Admitted' || el[p.id] === 'Enrolled'; }).length, enrolled = onB.filter(function (p) { return el[p.id] === 'Enrolled'; }).length;
    var ne = function (v) { return v == null ? 'Not Entered' : v; };
    var K = { aidPct: function () { return pct(tot('su'), tot('sa')); }, aidUsed: function () { return ne(tot('su')); }, rosterLeft: function () { var l = tot('rl'), r = tot('rs'); return l != null && r != null ? l - r : 'Not Entered'; }, visits: function () { return ne(tot('ovu')); }, board: function () { return onB.length; }, admitted: function () { return admitted; }, yield: function () { return admitted ? Math.round(1000 * enrolled / admitted) / 10 + '%' : 'Not Entered'; }, placed: function () { return ne(tot('tp')); }, ready: function () { return ne(tot('gr')); } };
    if (body.dataset.coachPage === 'department') {
      var kp = '<section class="card coach-card"><h2>' + esc(DIV.short) + ' Key Numbers</h2><div class="kpi-row">' + DIV.kpis.map(function (k) { return '<div class="kpi"><span>' + esc(k[0]) + '</span><strong>' + K[k[1]]() + '</strong></div>'; }).join('') + '</div><p class="coach-note">From numbers you enter in Roster &amp; Scholarships and prospect statuses. Division: ' + esc(divName()) + (DIVC.chosen ? '' : ' (default until you choose one in Settings)') + '.</p></section>';
      var g = root.querySelector('.coach-grid'); if (g) g.insertAdjacentHTML('afterbegin', kp); else root.insertAdjacentHTML('afterbegin', kp);
    }
    if (body.dataset.coachPage === 'finances') finances(root, d);    var banner = root.querySelector('.dept-note'); if (banner) banner.insertAdjacentHTML('beforeend', '<p class="coach-note">Reminder: ' + esc(DIV.reminder) + '</p>');
  };

  /* ---------- init ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    buildNav();
    var root = document.getElementById('coach-app'), k = body.dataset.deptPage;
    if (root && k && P[k]) { try { P[k](root, load()); } catch (e) { root.innerHTML = '<p class="coach-note">This page could not load. Please refresh.</p>'; if (window.console) console.error(e); } }
    divExtras(root);
    if (!CTX) return;
    var scopeNote = document.createElement('p'); scopeNote.className = 'coach-note ad-scope'; scopeNote.textContent = 'Showing ' + CTX.name + ' only.';
    if (root) root.insertBefore(scopeNote, root.firstChild);
    if (isDept) {
      // Program tables on department pages list one row per sport; keep only the chosen one.
      var names = SP.names;
      Array.prototype.forEach.call(document.querySelectorAll('#coach-app tbody tr'), function (tr) { var h = tr.querySelector('th[scope=row]'); if (h && names.indexOf(h.textContent.trim()) >= 0 && h.textContent.trim() !== CTX.name) tr.hidden = true; });
      Array.prototype.forEach.call(document.querySelectorAll('#coach-app .dept-card'), function (c) { var h = c.querySelector('h2'); if (h && names.indexOf(h.textContent.trim()) >= 0 && h.textContent.trim() !== CTX.name) c.hidden = true; });
    }
  });
})();
