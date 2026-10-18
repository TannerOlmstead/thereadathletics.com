/* Verifier signup + workspace (HS coach, private instructor, verified data provider). localStorage demo only:
   no email is sent, no identity or credential is checked, and approval of verifiers is a roadmap/admin step.
   Each metric is confirmed or declined individually; there is no verify-all. */
(function () {
  'use strict';
  var A = window.TheReadAthlete, ACC = window.TheReadAccount;
  if (!A || !ACC) return;
  var VKEY = 'theReadVerifiers', SKEY = 'theReadSession', CUR = 'theReadDemoAthleteCurrent';
  var TYPES = [['hs', 'High School Coach'], ['pi', 'Private Instructor / Trainer'], ['sh', 'Showcase / Event Organizer'], ['vdp', 'Other']];
  var METHODS = ['Radar Gun', 'Stopwatch / Timing Gates', 'Pop-Time Timer', 'Exit-Velocity Device', 'Measured In Person (Height / Weight)', 'Combine Or Showcase Testing', 'Game Or Practice Charting', 'Other'];
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var typeName = function (id) { return (TYPES.filter(function (t) { return t[0] === id; })[0] || [id, id])[1]; };
  var loadV = function () { try { var a = JSON.parse(localStorage.getItem(VKEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
  var saveV = function (a) { try { localStorage.setItem(VKEY, JSON.stringify(a)); } catch (e) { /* ignore */ } };
  var putV = function (v) { var a = loadV(), i = a.map(function (x) { return x.id; }).indexOf(v.id); if (i < 0) a.push(v); else a[i] = v; saveV(a); };
  var putA = function (r) { var keep = localStorage.getItem(CUR); A.upsert(r); if (keep) localStorage.setItem(CUR, keep); };
  var pwRule = 'At least 10 characters with an uppercase letter, a lowercase letter and a number.';
  var fld = function (id, label, o) {
    o = o || {};
    var c = o.opts ? '<select id="' + id + '"' + (o.req ? ' required' : '') + '><option value="">Select one</option>' + o.opts.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (o.val === x[0] ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join('') + '</select>' :
      o.area ? '<textarea id="' + id + '" rows="3"' + (o.req ? ' required' : '') + '>' + esc(o.val || '') + '</textarea>' :
        '<input id="' + id + '" type="' + (o.type || 'text') + '"' + (o.req ? ' required' : '') + (o.attrs || '') + (o.type === 'password' ? '' : ' value="' + esc(o.val || '') + '"') + ' />';
    return '<div class="field' + (o.full ? ' full' : '') + '"><label for="' + id + '">' + label + (o.req ? ' <span class="req" aria-hidden="true">*</span>' : '') + '</label>' + c + (o.hint ? '<p class="hint">' + o.hint + '</p>' : '') + '</div>';
  };
  var showErr = function (root, msg, id) {
    var e = root.querySelector('.v-err'); if (!e) return; e.hidden = !msg; e.innerHTML = msg || '';
    if (msg && id) { var f = root.querySelector('#' + id); if (f) { f.setAttribute('aria-invalid', 'true'); f.focus(); } }
  };
  var methodsBox = function (sel) { return '<fieldset class="full"><legend>How You Verify <span class="req" aria-hidden="true">*</span></legend><div class="check-grid">' + METHODS.map(function (m, i) { return '<label class="check"><input type="checkbox" data-m="' + esc(m) + '"' + (sel.indexOf(m) >= 0 ? ' checked' : '') + ' /> ' + m + '</label>'; }).join('') + '</div></fieldset>'; };
  var pickM = function (root) { return Array.prototype.filter.call(root.querySelectorAll('[data-m]'), function (c) { return c.checked; }).map(function (c) { return c.getAttribute('data-m'); }); };

  // ------------------------------------------------------------ signup
  var su = document.getElementById('vsignup-app');
  if (su) {
    su.innerHTML = '<form class="form-card" id="vs-form" novalidate><h2>Verifier Details</h2>' +
      '<div class="notice navy" role="note"><strong>Demo &ndash; nothing is sent or checked.</strong> Your details are saved only in this browser. On the real site, <strong>approval of verifiers is an admin step</strong> (credential and identity review) that is on the roadmap. Verified Data Providers are <strong>free</strong> (see <a href="pricing.html">Pricing</a>).</div><div class="form-grid">' +
      fld('vs-type', 'Provider Type', { req: 1, opts: TYPES }) + fld('vs-name', 'Full Name', { req: 1 }) + fld('vs-email', 'Email', { req: 1, type: 'email' }) + fld('vs-phone', 'Phone (Optional)', { type: 'tel' }) +
      fld('vs-org', 'Organization (School, Club, Facility Or Company)', { req: 1 }) + fld('vs-title', 'Your Role / Title', { req: 1 }) +
      methodsBox([]) + fld('vs-how', 'How You Verify (Describe Your Process)', { req: 1, area: 1, full: 1, hint: 'Say what equipment you use and whether you measure the athlete yourself. Athletes and coaches will see this.' }) +
      fld('vs-link', 'Website Or Credential Link (Optional)', { type: 'url', full: 1 }) +
      fld('vs-pw', 'Password', { req: 1, type: 'password', hint: pwRule }) + fld('vs-pw2', 'Confirm Password', { req: 1, type: 'password' }) +
      '<div class="field full"><label class="check"><input type="checkbox" id="vs-ok" required /> I only confirm metrics I measured or directly observed, and I will decline anything I cannot stand behind. <span class="req" aria-hidden="true">*</span></label></div></div>' +
      '<p class="hint">Demo: your password is checked against these rules and then thrown away. It is never saved or sent.</p><p class="field-error v-err" role="alert" hidden></p>' +
      '<div class="form-actions"><button class="button button-primary" type="submit">Create Verifier Profile</button></div></form>';
    su.querySelector('#vs-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (id) { return su.querySelector('#' + id).value.trim(); }, em = v('vs-email').toLowerCase(), pw = su.querySelector('#vs-pw').value, ms = pickM(su);
      if (!v('vs-type')) return showErr(su, 'Choose a verifier type.', 'vs-type');
      if (v('vs-name').length < 2) return showErr(su, 'Enter your full name.', 'vs-name');
      if (!ACC.emailOk(em)) return showErr(su, 'Enter a valid email address.', 'vs-email');
      if (!v('vs-org')) return showErr(su, 'Enter your organization.', 'vs-org');
      if (!v('vs-title')) return showErr(su, 'Enter your role or title.', 'vs-title');
      if (!ms.length) return showErr(su, 'Choose at least one way you verify.');
      if (!v('vs-how')) return showErr(su, 'Describe how you verify.', 'vs-how');
      if (!ACC.pwOk(pw)) return showErr(su, pwRule, 'vs-pw');
      if (pw !== su.querySelector('#vs-pw2').value) return showErr(su, 'Passwords do not match.', 'vs-pw2');
      if (!su.querySelector('#vs-ok').checked) return showErr(su, 'Confirm the verification statement to continue.', 'vs-ok');
      if (loadV().filter(function (x) { return x.email === em; })[0]) return showErr(su, 'A Verified Data Provider profile already uses that email in this browser. <a href="sign-in.html">Sign in</a> instead.', 'vs-email');
      var rec = { id: 'ver-' + Date.now().toString(36), type: v('vs-type'), name: v('vs-name'), email: em, phone: v('vs-phone'), org: v('vs-org'), title: v('vs-title'), methods: ms, how: v('vs-how'), link: v('vs-link'), status: 'Pending Approval', created: new Date().toISOString(), events: [] };
      putV(rec);
      try { localStorage.setItem(SKEY, JSON.stringify({ role: 'vdp', ptype: rec.type, name: rec.name, email: rec.email, org: rec.org, vid: rec.id, ts: new Date().toISOString() })); } catch (x) { /* ignore */ }
      su.innerHTML = '<div class="form-card"><h2>Verifier Profile Created (Demo)</h2><div class="notice navy" role="status"><strong>Status: Pending Approval.</strong> Nothing was sent. On the real site an admin would review your credentials before athletes see you as an approved verifier. In this demo you can use the workspace right away.</div><p><a class="button button-primary" href="verifier-dashboard.html">Open Verifier Workspace</a></p></div>';
    });
  }

  // ------------------------------------------------------------ workspace
  var root = document.getElementById('vdash-app');
  if (!root) return;
  var tab = 'queue', sel = '', msg = '', showAll = false;
  var TABS = [['queue', 'Awaiting Verification'], ['inbox', 'Requests'], ['athletes', 'My Athletes'], ['history', 'Verification History'], ['calendar', 'Calendar'], ['profile', 'Profile And Credentials']];
  var me = function () { var s = ACC.session(); return s && s.vid ? loadV().filter(function (x) { return x.id === s.vid; })[0] || null : null; };
  var label = function (k) { return (A.METRICS.filter(function (m) { return m[0] === k; })[0] || [k, k])[1]; };
  var badge = function (s) { return '<span class="st-badge st-' + String(s).toLowerCase().replace(/[^a-z]/g, '') + '">' + esc(s) + '</span>'; };
  var allReqs = function (v) {
    var out = [];
    A.load().filter(function (r) { return r.submitted; }).forEach(function (r) {
      (r.verifiers || []).forEach(function (q, i) {
        var addressed = String(q.email || '').toLowerCase() === v.email.toLowerCase() && q.type === typeName(v.type), typeMatch = q.type === typeName(v.type);
        if (addressed || (showAll && typeMatch)) out.push({ rid: r.id, i: i, rec: r, q: q, addressed: addressed });
      });
    });
    return out;
  };
  var keysOf = function (x) { return (x.q.keys && x.q.keys.length ? x.q.keys : A.METRICS.map(function (m) { return m[0]; })).filter(function (k) { return x.rec.metrics && x.rec.metrics[k] != null; }); };
  var conf = function (r) { try { var c = window.TheReadScore && window.TheReadScore.compute({ pos: r.pos, metrics: r.metrics || {}, verified: r.verified || {} }, []).conf; return c == null ? 'Unknown' : c.toFixed(1) + '%'; } catch (e) { return 'Unknown'; } };
  var find = function (rid, i) { var r = A.load().filter(function (x) { return x.id === rid; })[0]; return r ? { rec: r, q: r.verifiers[i], rid: rid, i: i } : null; };
  var who = function (v) { return { by: v.name + (v.org ? ', ' + v.org : ''), role: typeName(v.type), vid: v.id }; };
  var finishIfDone = function (x) { var r = x.rec; if (keysOf(x).every(function (k) { var s = A.metricStatus(r, k).status; return s === 'Verified' || s === 'Declined'; })) { x.q.status = 'Completed'; x.q.done = new Date().toISOString().slice(0, 10); } };

  var queue = function (v) {
    var rs = allReqs(v).filter(function (x) { return x.q.status === 'Accepted'; });
    var cur = rs.filter(function (x) { return x.rid + ':' + x.i === sel; })[0];
    if (!cur) {
      return '<h2>Athletes Awaiting Verification</h2><p class="coach-note">Accepted requests with metrics you have not yet confirmed or declined. Each metric is its own decision.</p>' + (msg ? '<p role="status"><strong>' + esc(msg) + '</strong></p>' : '') +
        (rs.length ? '<div class="table-wrap"><table><thead><tr><th scope="col">Athlete</th><th scope="col">Class</th><th scope="col">Position</th><th scope="col">Metrics Decided</th><th scope="col">Athlete Confidence</th><th scope="col">Action</th></tr></thead><tbody>' + rs.map(function (x) {
          var ks = keysOf(x), dec = ks.filter(function (k) { var s = A.metricStatus(x.rec, k).status; return s === 'Verified' || s === 'Declined'; }).length;
          return '<tr><th scope="row">' + esc(x.rec.name) + '</th><td>' + esc(x.rec.grad) + '</td><td>' + esc(x.rec.pos || '') + '</td><td>' + dec + ' of ' + ks.length + '</td><td>' + conf(x.rec) + '</td><td><button type="button" class="button button-primary" data-rev="' + x.rid + ':' + x.i + '">Review Metrics</button></td></tr>';
        }).join('') + '</tbody></table></div>' : '<p>Nothing is waiting. Athletes appear here after you accept their request on the <strong>Requests</strong> tab.</p>');
    }
    var r = cur.rec, q = cur.q, rows = keysOf(cur).map(function (k) {
      var st = A.metricStatus(r, k), done = st.status === 'Verified' || st.status === 'Declined';
      return '<tr><th scope="row">' + esc(label(k)) + '</th><td>' + esc(r.metrics[k]) + '</td><td>' + badge(st.status) + (st.date ? '<br><small>' + esc(st.by) + ', ' + esc(st.date) + '</small>' : '') + '</td>' +
        '<td><label class="visually-hidden" for="mt-' + k + '">Method for ' + esc(label(k)) + '</label><input id="mt-' + k + '" data-method="' + k + '" placeholder="e.g. radar gun, measured in person" value="' + esc(st.method) + '" /></td>' +
        '<td><button type="button" class="button button-primary" data-ok="' + k + '">' + (done ? 'Re-Confirm' : 'Confirm') + '</button> <button type="button" class="button button-secondary" data-no="' + k + '">Decline</button></td></tr>';
    }).join('');
    return '<p><button type="button" class="button button-secondary" id="v-back">&larr; Back To Queue</button></p><h2>Review ' + esc(r.name) + '</h2><p>' + esc(r.pos || '') + ' &middot; Class of ' + esc(r.grad) + ' &middot; ' + esc(r.school || '') + '. Athlete Confidence now: <strong>' + conf(r) + '</strong> (weighted share of verified Recruit Score inputs; unrelated to talent).</p>' +
      (msg ? '<p role="status"><strong>' + esc(msg) + '</strong></p>' : '') + '<div class="notice navy" role="note">Confirm only what you measured or directly saw. There is no verify-all: every row needs its own method and decision.</div>' +
      '<div class="table-wrap"><table><thead><tr><th scope="col">Metric</th><th scope="col">Athlete Value</th><th scope="col">Status</th><th scope="col">Method / Source</th><th scope="col">Decision</th></tr></thead><tbody>' + (rows || '<tr><td colspan="5">No metrics were entered for this request.</td></tr>') + '</tbody></table></div>';
  };
  var inbox = function (v) {
    var rs = allReqs(v).filter(function (x) { return x.q.status === 'Requested'; });
    return '<h2>Verification Requests</h2><p class="coach-note">New requests from athletes. Accept to move the athlete to your queue, or decline if you cannot verify them.</p>' + (msg ? '<p role="status"><strong>' + esc(msg) + '</strong></p>' : '') +
      (rs.length ? '<div class="table-wrap"><table><thead><tr><th scope="col">Athlete</th><th scope="col">Requested</th><th scope="col">Metrics Asked</th><th scope="col">Action</th></tr></thead><tbody>' + rs.map(function (x) {
        return '<tr><th scope="row">' + esc(x.rec.name) + (x.addressed ? '' : '<br><small>Not addressed to your email (demo view)</small>') + '</th><td>' + esc(x.q.date || '') + '</td><td>' + keysOf(x).map(label).map(esc).join(', ') + '</td><td><button type="button" class="button button-primary" data-acc="' + x.rid + ':' + x.i + '">Accept</button> <button type="button" class="button button-secondary" data-dec="' + x.rid + ':' + x.i + '">Decline Request</button></td></tr>';
      }).join('') + '</tbody></table></div>' : '<p>No new requests. When an athlete asks you to verify from their profile (Metrics tab) using your email, it appears here.</p>') +
      '<label class="check"><input type="checkbox" id="v-all"' + (showAll ? ' checked' : '') + ' /> Demo: also show requests to my verifier type that were sent to a different email</label>';
  };
  var athletes = function (v) {
    var seen = {}, rows = [];
    allReqs(v).filter(function (x) { return x.q.status === 'Accepted' || x.q.status === 'Completed'; }).forEach(function (x) {
      if (seen[x.rid]) return; seen[x.rid] = 1;
      var mineN = Object.keys(x.rec.verified || {}).filter(function (k) { return x.rec.verified[k].vid === v.id; }).length;
      rows.push('<tr><th scope="row">' + esc(x.rec.name) + '</th><td>' + esc(x.rec.grad) + '</td><td>' + esc((x.rec.sports || []).map(function (s) { return s.name + ' ' + s.pos; }).join(', ') || x.rec.pos) + '</td><td>' + mineN + '</td><td>' + conf(x.rec) + '</td><td>' + badge(x.q.status) + '</td></tr>');
    });
    return '<h2>My Athletes</h2><p class="coach-note">Athletes whose requests you accepted. Confidence is the athlete&rsquo;s overall weighted share of verified inputs, not only your part.</p>' +
      (rows.length ? '<div class="table-wrap"><table><thead><tr><th scope="col">Athlete</th><th scope="col">Class</th><th scope="col">Sport / Position</th><th scope="col">Metrics You Verified</th><th scope="col">Confidence</th><th scope="col">Request</th></tr></thead><tbody>' + rows.join('') + '</tbody></table></div>' : '<p>No athletes yet. Accept a request first.</p>');
  };
  var history = function (v) {
    var rows = [];
    A.load().forEach(function (r) { (r.vlog || []).forEach(function (e) { if (e.vid === v.id) rows.push({ r: r, e: e }); }); });
    rows.sort(function (a, b) { return a.e.ts < b.e.ts ? 1 : -1; });
    return '<h2>Verification History</h2><p class="coach-note">Audit log of every decision you made: who, what, when, and the method or source you recorded. Entries are never edited; a change adds a new row.</p>' +
      (rows.length ? '<div class="table-wrap"><table><thead><tr><th scope="col">When</th><th scope="col">Athlete</th><th scope="col">Metric</th><th scope="col">Value</th><th scope="col">Decision</th><th scope="col">Method / Source</th><th scope="col">By</th></tr></thead><tbody>' + rows.map(function (x) {
        return '<tr><td>' + esc(x.e.ts.replace('T', ' ').slice(0, 16)) + '</td><th scope="row">' + esc(x.r.name) + '</th><td>' + esc(label(x.e.k)) + '</td><td>' + esc(x.e.value == null ? '' : x.e.value) + '</td><td>' + badge(x.e.ok ? 'Verified' : 'Declined') + '</td><td>' + esc(x.e.method || 'Not Recorded') + '</td><td>' + esc(x.e.by) + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '<p>No decisions yet.</p>');
  };
  var calendar = function (v) {
    var ev = (v.events || []).slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var rq = allReqs(v).filter(function (x) { return x.q.date; });
    return '<h2>Calendar</h2><p class="coach-note">Your own verification sessions and reminders (saved in this browser). Request dates are listed below for reference.</p>' +
      '<form id="v-ev" class="form-card" novalidate><div class="form-grid">' + fld('ev-date', 'Date', { req: 1, type: 'date' }) + fld('ev-title', 'Event', { req: 1 }) + fld('ev-ath', 'Athlete (Optional)', {}) + fld('ev-note', 'Note (Optional)', {}) + '</div><p class="field-error v-err" role="alert" hidden></p><button class="button button-primary" type="submit">Add Event</button></form>' +
      '<h3>Your Events</h3>' + (ev.length ? '<ul class="intro-list">' + ev.map(function (e) { return '<li><strong>' + esc(e.date) + '</strong> &ndash; ' + esc(e.title) + (e.ath ? ' (' + esc(e.ath) + ')' : '') + (e.note ? '. ' + esc(e.note) : '') + ' <button type="button" class="button button-secondary" data-delev="' + e.id + '">Remove</button></li>'; }).join('') + '</ul>' : '<p>No events yet.</p>') +
      '<h3>Request Dates</h3>' + (rq.length ? '<ul class="intro-list">' + rq.map(function (x) { return '<li><strong>' + esc(x.q.date) + '</strong> &ndash; Request from ' + esc(x.rec.name) + ' ' + badge(x.q.status) + '</li>'; }).join('') + '</ul>' : '<p>None.</p>');
  };
  var profile = function (v) {
    return '<h2>Profile And Credentials</h2><div class="notice navy" role="note"><strong>Approval status: ' + esc(v.status) + '.</strong> Approval of verifiers is an admin step that is on the roadmap; nothing here is checked. ' + 'Verified Data Providers are free (see <a href="pricing.html">Pricing</a>).' + '</div>' + (msg ? '<p role="status"><strong>' + esc(msg) + '</strong></p>' : '') +
      '<form id="v-prof" class="form-card" novalidate><dl class="review-list"><dt>Provider Type</dt><dd>' + esc(typeName(v.type)) + '</dd><dt>Email</dt><dd>' + esc(v.email) + '</dd></dl><div class="form-grid">' + fld('pf-name', 'Full Name', { req: 1, val: v.name }) + fld('pf-phone', 'Phone (Optional)', { val: v.phone, type: 'tel' }) + fld('pf-org', 'Organization', { req: 1, val: v.org }) + fld('pf-title', 'Role / Title', { req: 1, val: v.title }) + methodsBox(v.methods || []) +
      fld('pf-how', 'How You Verify', { req: 1, area: 1, full: 1, val: v.how }) + fld('pf-link', 'Website Or Credential Link (Optional)', { type: 'url', full: 1, val: v.link }) + '</div><p class="field-error v-err" role="alert" hidden></p><button class="button button-primary" type="submit">Save Profile</button></form>';
  };
  var VIEWS = { queue: queue, inbox: inbox, athletes: athletes, history: history, calendar: calendar, profile: profile };

  var draw = function () {
    var v = me();
    if (!v) {
      root.innerHTML = '<div class="form-card"><h2>Verified Data Provider Workspace</h2><p>You are not signed in as a verifier in this browser. <a href="sign-in.html">Sign in</a> as a Verified Data Provider, or <a href="verifier-signup.html">create a Verified Data Provider profile</a>.</p></div>';
      return;
    }
    var pend = allReqs(v).filter(function (x) { return x.q.status === 'Requested'; }).length;
    root.innerHTML = '<nav class="coach-subnav prof-tabs" aria-label="Verifier workspace sections"><span class="ws-label">Verifier Workspace</span>' + TABS.map(function (t) { return '<a href="#' + t[0] + '"' + (t[0] === tab ? ' aria-current="page"' : '') + ' data-tab="' + t[0] + '">' + t[1] + (t[0] === 'inbox' && pend ? ' (' + pend + ')' : '') + '</a>'; }).join('') + '</nav>' +
      '<p class="coach-note signed-in" role="status"><strong>Signed in as:</strong> ' + esc(v.name) + ' (' + esc(typeName(v.type)) + ', ' + esc(v.org) + '). Status: ' + esc(v.status) + '.</p><div class="prof-body">' + VIEWS[tab](v) + '</div>';
    msg = '';
    Array.prototype.forEach.call(root.querySelectorAll('[data-tab]'), function (a) { a.addEventListener('click', function (e) { e.preventDefault(); tab = a.dataset.tab; sel = ''; try { history.replaceState(null, '', '#' + tab); } catch (x) { /* ignore */ } draw(); }); });
    var on = function (s, fn) { Array.prototype.forEach.call(root.querySelectorAll(s), fn); };
    on('[data-rev]', function (b) { b.addEventListener('click', function () { sel = b.dataset.rev; draw(); }); });
    var back = root.querySelector('#v-back'); if (back) back.addEventListener('click', function () { sel = ''; draw(); });
    on('[data-ok],[data-no]', function (b) {
      b.addEventListener('click', function () {
        var k = b.dataset.ok || b.dataset.no, ok = !!b.dataset.ok, p = sel.split(':'), x = find(p[0], Number(p[1])), m = root.querySelector('[data-method="' + k + '"]').value.trim();
        if (!x) return;
        if (ok && !m) { msg = 'Enter the method or source before confirming ' + label(k) + '.'; draw(); return; }
        A.verifyMetric(x.rec, k, ok, who(v), m); finishIfDone(x); putA(x.rec); msg = label(k) + (ok ? ' confirmed.' : ' declined.'); draw();
      });
    });
    on('[data-acc],[data-dec]', function (b) {
      b.addEventListener('click', function () {
        var acc = !!b.dataset.acc, p = (b.dataset.acc || b.dataset.dec).split(':'), x = find(p[0], Number(p[1])); if (!x) return;
        x.q.status = acc ? 'Accepted' : 'Closed'; x.q.vid = v.id; x.q.reason = acc ? '' : 'Declined by verifier'; x.q.decided = new Date().toISOString().slice(0, 10);
        putA(x.rec); msg = acc ? 'Accepted. ' + x.rec.name + ' is now in your queue.' : 'Request declined. The athlete will see it as Closed.'; if (acc) { tab = 'queue'; } draw();
      });
    });
    var all = root.querySelector('#v-all'); if (all) all.addEventListener('change', function () { showAll = all.checked; draw(); });
    var ev = root.querySelector('#v-ev');
    if (ev) ev.addEventListener('submit', function (e) {
      e.preventDefault(); var g = function (id) { return root.querySelector('#' + id).value.trim(); };
      if (!g('ev-date')) return showErr(root, 'Choose a date.', 'ev-date'); if (!g('ev-title')) return showErr(root, 'Enter an event name.', 'ev-title');
      v.events = v.events || []; v.events.push({ id: 'e' + Date.now().toString(36), date: g('ev-date'), title: g('ev-title'), ath: g('ev-ath'), note: g('ev-note') }); putV(v); draw();
    });
    on('[data-delev]', function (b) { b.addEventListener('click', function () { v.events = (v.events || []).filter(function (e) { return e.id !== b.dataset.delev; }); putV(v); draw(); }); });
    var pf = root.querySelector('#v-prof');
    if (pf) pf.addEventListener('submit', function (e) {
      e.preventDefault(); var g = function (id) { return root.querySelector('#' + id).value.trim(); }, ms = pickM(root);
      if (g('pf-name').length < 2) return showErr(root, 'Enter your name.', 'pf-name'); if (!g('pf-org')) return showErr(root, 'Enter your organization.', 'pf-org'); if (!g('pf-title')) return showErr(root, 'Enter your role.', 'pf-title');
      if (!ms.length) return showErr(root, 'Choose at least one way you verify.'); if (!g('pf-how')) return showErr(root, 'Describe how you verify.', 'pf-how');
      v.name = g('pf-name'); v.phone = g('pf-phone'); v.org = g('pf-org'); v.title = g('pf-title'); v.methods = ms; v.how = g('pf-how'); v.link = g('pf-link'); putV(v);
      var s = ACC.session(); if (s) { s.name = v.name; s.org = v.org; try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch (x) { /* ignore */ } }
      msg = 'Profile saved.'; draw();
    });
  };
  var h = location.hash.replace('#', ''); if (VIEWS[h]) tab = h;
  draw();
})();
