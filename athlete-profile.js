/* Athlete Profile (athlete role). Reads only what the athlete entered in signup (localStorage). No invented data. */
(function () {
  'use strict';
  var root = document.getElementById('coach-app');
  if (!root || document.body.dataset.coachPage !== 'athprofile') return;
  var A = window.TheReadAthlete, CL = window.TheReadClassification, SP = window.TheReadSports;
  var XKEY = 'theReadDemoAthleteExtras';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var loadX = function () { try { var o = JSON.parse(localStorage.getItem(XKEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } };
  var saveX = function (o) { try { localStorage.setItem(XKEY, JSON.stringify(o)); } catch (e) { /* ignore */ } };
  var rec = A && (A.current() || A.load().filter(function (r) { return r.submitted; }).slice(-1)[0] || null);
  if (!rec) {
    root.innerHTML = '<div class="form-card"><h2>Complete Your Athlete Signup First</h2><p>Your profile is built from what you enter during signup. No profile exists in this browser yet.</p><p><a class="button button-primary" href="player-signup.html">Start Athlete Signup</a></p></div>';
    return;
  }
  var X = function () { return loadX()[rec.id] || {}; };
  var setX = function (patch) { var all = loadX(); all[rec.id] = Object.assign({}, all[rec.id] || {}, patch); saveX(all); };
  var sports = (rec.sports && rec.sports.length ? rec.sports : [{ name: rec.sport, pos: rec.pos, sec: rec.sec }]);
  var cur = 0, tab = 'overview';
  var prov = function (v) { return v == null || v === '' ? '<span class="muted">Not Provided</span>' : esc(v); };
  var tag = function (req) { return '<span class="req-tag ' + (req ? 'req' : 'opt') + '">' + (req ? 'Required' : 'Optional') + '</span>'; };
  var badge = function (s) { return '<span class="st-badge st-' + String(s).toLowerCase().replace(/[^a-z]/g, '') + '">' + esc(s) + '</span>'; };
  var sec = function (title, req, purpose, body) { return '<section class="form-card prof-sec"><h2>' + title + ' ' + tag(req) + '</h2><p class="prof-purpose">' + purpose + '</p>' + body + '</section>'; };
  var isHS = function () { return rec.level === 'High School'; };

  var completeness = function () {
    var x = X(), m = Object.keys(rec.metrics || {}).length;
    var items = [
      ['Name', !!rec.name, 1], ['Email', !!rec.email, 1], ['Date Of Birth', !!rec.dob, 1], ['Graduation Class', !!rec.grad, 1], ['Current Playing Level', !!rec.level, 1],
      ['School / Club', !!rec.school, 1], ['State', !!rec.state, 1], ['Sports And Positions', sports.every(function (s) { return s.name && s.pos; }), 1], ['Terms Accepted', !!rec.terms, 1],
      ['Profile Photo', !!rec.photo, 0], ['At Least One Metric', m > 0, 0], ['Verification Requested', (rec.verifiers || []).length > 0, 0],
      ['Academics (GPA / Tests / Major)', !!(x.gpa || x.sat || x.act || x.major), 0], ['Video Link', (x.videos || []).length > 0, 0], ['Achievements', (x.awards || []).length > 0, 0]
    ];
    if (!isHS()) items.push(['Years Of Eligibility Left', rec.elig != null, 1]);
    if (rec.path !== 'adult') items.push(['Guardian Verified', A.gStatus(rec) === 'Verified', 1]);
    var done = items.filter(function (i) { return i[1]; }).length;
    return { pct: Math.round(done / items.length * 100), items: items };
  };

  var header = function () {
    var sp = sports[cur] || sports[0], init = (rec.name || '?').trim().charAt(0).toUpperCase();
    return '<div class="prof-head">' + (rec.photo ? '<img class="prof-photo" alt="Profile photo of ' + esc(rec.name) + '" src="' + esc(rec.photo) + '" />' : '<div class="prof-photo prof-initial" aria-hidden="true">' + esc(init) + '</div>') +
      '<div><h2 class="prof-name">' + esc(rec.name) + '</h2><p>' + esc(rec.level) + ' &middot; Class Of ' + esc(rec.grad) + ' &middot; ' + prov(rec.school) + ', ' + prov(rec.state) + '</p>' +
      '<p>' + (isHS() ? 'Eligibility: N/A (High School)' : 'Years Of Eligibility Left: ' + (rec.elig == null ? 'Not Provided' : esc(rec.elig))) + '</p>' +
      '<div class="sport-switch" role="group" aria-label="Sport">' + sports.map(function (s, i) { return '<button type="button" class="chip' + (i === cur ? ' on' : '') + '" data-sport="' + i + '" aria-pressed="' + (i === cur) + '">' + esc(s.name) + '</button>'; }).join('') + '</div>' +
      '<p><strong>' + esc(sp.name) + ':</strong> Position ' + prov(sp.pos) + ' &middot; Secondary Position ' + prov(sp.sec) + '</p>' +
      (sp.name === 'Baseball' ? '<p>College Role Preference: ' + rolePref() + ' <span class="muted">(Athlete Preference, Not A Rating)</span></p>' : '') + '</div></div>';
  };
  var rolePref = function () {
    var r = rec.rolePref; if (!r || !r.twoWay) return '<span class="muted">Not Provided</span>';
    return 'Two-Way: ' + esc(r.twoWay) + (r.role ? ' &middot; ' + esc(r.role) : '') + (r.emphasis ? ' &middot; ' + esc(r.emphasis) : '') + (r.pos ? ' &middot; ' + esc(r.pos) : '');
  };

  var overview = function () {
    var c = completeness();
    return sec('Header &amp; Profile Completeness', 1, 'Who you are at a glance, and how complete your profile is. Completeness counts real fields only and never affects your Recruit Score or Tier.',
      header() + '<div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + c.pct + '" aria-label="Profile completeness"><span style="width:' + c.pct + '%"></span></div><p><strong>' + c.pct + '% Complete</strong></p>' +
      '<ul class="check-list">' + c.items.map(function (i) { return '<li class="' + (i[1] ? 'done' : 'todo') + '">' + (i[1] ? '&#10003; ' : '&#9675; ') + esc(i[0]) + ' ' + tag(i[2]) + '</li>'; }).join('') + '</ul>');
  };

  var scoreFor = function () {
    var T = window.TheReadCoach, bench = T ? T.players.filter(function (q) { return !q.entered && (q.sport || 'Baseball') === 'Baseball'; }) : [];
    var sp = sports[cur] || sports[0];
    return window.TheReadScore.compute({ pos: sp.pos, metrics: rec.metrics || {}, verified: rec.verified || {} }, bench);
  };
  var scores = function () {
    var sp = sports[cur] || sports[0], cfg = SP && SP.byName ? SP.byName[sp.name] : null, scored = !cfg || cfg.scoring !== false;
    var sw = '<div class="sport-switch" role="group" aria-label="Sport">' + sports.map(function (s, i) { return '<button type="button" class="chip' + (i === cur ? ' on' : '') + '" data-sport="' + i + '" aria-pressed="' + (i === cur) + '">' + esc(s.name) + '</button>'; }).join('') + '</div>';
    if (!scored) return sec('Recruit Score, Player Tier &amp; Confidence', 1, 'Shown per sport. A missing score is Not Rated and unknown confidence is Unknown, never zero.', sw +
      '<p class="notice navy" role="status"><strong>Scoring Not Yet Available</strong> for ' + esc(sp.name) + '. Recruit Score shows Not Rated and Confidence shows Unknown. Coming Soon.</p>');
    var r = scoreFor();
    return sec('Recruit Score, Player Tier &amp; Confidence', 1, 'Calculated automatically from your metrics each time this page opens. Not Rated or Unknown is never zero.', sw +
      '<dl class="review-list"><dt>Recruit Score</dt><dd>' + CL.formatRecruitScore(r.rs == null ? null : r.rsShown) + '</dd><dt>Player Tier</dt><dd>' + CL.renderTierBadge(r.rs) + '</dd><dt>Confidence</dt><dd>' + CL.renderConfidenceBadge(r.conf) + '</dd></dl>' +
      '<p>Self-reported metrics lower Confidence but never change the Recruit Score. Add or edit metrics under Metrics and this updates.</p>' +
      '<section aria-labelledby="calc-h" class="calc-panel"><h3 id="calc-h">How Your Recruit Score Was Calculated</h3>' + window.TheReadScore.panel(r, CL) + '</section>');
  };
  var metrics = function () {
    var rows = A.METRICS.filter(function (m) { return rec.metrics[m[0]] != null; }).map(function (m) {
      var st = A.metricStatus(rec, m[0]);
      return '<tr><th scope="row">' + esc(m[1]) + '</th><td>' + esc(rec.metrics[m[0]]) + '</td><td>' + badge(st.status) + '</td><td>' + (st.status === 'Verified' || st.status === 'Declined' ? esc(st.by + ' (' + st.role + ')') + ' &middot; ' + esc(st.date) + (st.method ? ' &middot; ' + esc(st.method) : '') : st.status === 'Pending' ? 'Awaiting ' + esc(st.role) : 'Self-Reported') + '</td></tr>';
    }).join('');
    var reqs = (rec.verifiers || []).map(function (v) { return '<li>' + esc(v.type) + (v.name ? ' &ndash; ' + esc(v.name) : '') + ' (' + esc(v.email) + ') &middot; ' + esc(v.status) + ' &middot; ' + esc(v.date) + (v.keys ? ' &middot; Metrics: ' + esc(v.keys.map(function (k) { return (A.METRICS.filter(function (m) { return m[0] === k; })[0] || [k, k])[1]; }).join(', ')) : '') + '</li>'; }).join('');
    return sec('Metrics &amp; Verification', 1, 'Your measurables and who has confirmed them. Metrics stay Unverified until a verifier confirms. No email is sent from this site.',
      (rows ? '<div class="table-wrap"><table><thead><tr><th scope="col">Metric</th><th scope="col">Value</th><th scope="col">Status</th><th scope="col">Verifier / Date / Method</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<p>No metrics entered yet.</p>') +
      '<h3>Edit Metrics (Self-Reported)</h3><form id="mf" class="form-grid">' + A.METRICS.map(function (m) { return '<label>' + esc(m[1]) + '<input name="' + m[0] + '" type="number" step="any" min="' + m[2] + '" max="' + m[3] + '" value="' + esc(rec.metrics[m[0]] == null ? '' : rec.metrics[m[0]]) + '" /></label>'; }).join('') + '<div><button class="button button-primary" type="submit">Save Metrics</button> <span id="mf-ok" role="status"></span></div></form><p class="muted">Changing a verified number removes its verification. Your Recruit Score, Tier and Confidence recalculate automatically (see Scores).</p>' +
      '<h3>Verification Requests</h3>' + (reqs ? '<ul>' + reqs + '</ul>' : '<p>None yet.</p>') +
      '<form id="vf" class="form-grid"><label>Verifier Type<select name="t"><option>High School Coach</option><option>Private Instructor</option><option>Verified Data Provider</option></select></label><label>Name / Organization<input name="n" /></label><label>Verifier Email<input name="e" type="email" required /></label><fieldset class="md-wide"><legend>Metrics To Verify (Each Is Confirmed Separately)</legend>' + A.METRICS.filter(function (m) { return rec.metrics[m[0]] != null; }).map(function (m) { return '<label class="check"><input type="checkbox" name="k" value="' + m[0] + '" checked /> ' + esc(m[1]) + '</label>'; }).join('') + '</fieldset><div><button class="button button-primary" type="submit">Request Verification</button></div></form><p class="muted">The verifier confirms or declines each metric one at a time; there is no verify-all. Open <a href="verifier-verify.html">the verifier page</a> to see what they see. This records your request in this browser only. Nothing is emailed.</p>');
  };

  var guardian = function () {
    if (rec.path === 'adult') return sec('Guardian Verification', 0, 'Only needed for athletes under 18.', '<p>Not needed. You are an adult (18+).</p>');
    var g = rec.guardian, gs = A.gStatus(rec);
    return sec('Guardian Verification', 1, 'Minors cannot be contacted or listed to coaches until a parent or guardian verifies.',
      '<dl class="review-list"><dt>Guardian</dt><dd>' + esc(g.name) + ' (' + esc(g.rel) + ')</dd><dt>Status</dt><dd>' + badge(gs) + '</dd><dt>Messages Visible To Guardian</dt><dd>' + (g.msgVisible ? 'Yes' : 'No') + '</dd></dl>' +
      '<p><button id="g-resend" class="button button-secondary" type="button">Resend Verification (Simulated)</button> <a class="button button-secondary" href="guardian-verify.html">Open Guardian Page</a></p><p class="muted">Resend only resets the code in this browser. No email or text goes out and identity is not verified.</p>');
  };

  var privacy = function () {
    var p = rec.privacy || {}, x = X(), minor = rec.path !== 'adult';
    var cb = function (k, l) { return '<label class="check"><input type="checkbox" data-pv="' + k + '"' + (p[k] ? ' checked' : '') + ' /> ' + l + '</label>'; };
    return sec('Visibility &amp; Privacy', 1, 'You choose what coaches can see and who can message you.',
      cb('list', 'List me to coaches in the Master Database') + cb('contact', 'Show my contact info') + cb('photo', 'Show my photo') + cb('metrics', 'Show my metrics') +
      '<label>Who Can Message Me<select id="msgwho"><option value="verified"' + (x.msgWho === 'verified' || !x.msgWho ? ' selected' : '') + '>Coaches At Verified Programs</option><option value="coaches"' + (x.msgWho === 'coaches' ? ' selected' : '') + '>Any Coach</option><option value="none"' + (x.msgWho === 'none' ? ' selected' : '') + '>No One</option></select></label>' +
      (minor ? '<p class="muted">Because you are under 18, a verified guardian must also allow each item, and messages follow the guardian visibility rule.</p>' : '') + '<p id="pv-ok" class="muted" role="status"></p>');
  };

  var messages = function () {
    var th = []; try { th = (JSON.parse(localStorage.getItem('theReadDemoMessages') || '[]') || []).filter(function (t) { return String(t.cid).indexOf('pl:' + rec.id) === 0; }); } catch (e) { th = []; }
    return sec('Messages (Connect)', 0, 'Messages coaches send you through Connect. Messaging here is a local sandbox, not encrypted and not delivered anywhere.',
      th.length ? '<ul>' + th.map(function (t) { var l = t.messages[t.messages.length - 1]; return '<li><strong>' + esc(l.ts.replace('T', ' ')) + '</strong> &ndash; ' + esc(l.body) + '</li>'; }).join('') + '</ul>' : '<p>No messages yet.</p>') + '<p><a href="connect.html">Open Connect</a></p>';
  };

  var calendar = function () {
    var C = window.TheReadCoach && window.TheReadCoach.Cal, ev = C ? C.visible('athlete').filter(function (e) { return e.role === 'athlete' || String(e.pid || '').indexOf(rec.id) === 0; }) : [];
    ev.sort(function (a, b) { return (a.date + (a.start || '')) < (b.date + (b.start || '')) ? -1 : 1; });
    return sec('Calendar', 0, 'Visits, camps, showcases and deadlines you or a coach created for you.',
      (ev.length ? '<ul>' + ev.map(function (e) { return '<li><strong>' + esc(e.date) + (e.start ? ' ' + esc(e.start) : '') + '</strong> &ndash; ' + esc(e.title) + ' (' + esc(e.type) + ')</li>'; }).join('') + '</ul>' : '<p>No events yet.</p>') + '<p><a class="button button-secondary" href="athlete-calendar.html">Open Calendar</a></p>');
  };

  var interest = function () {
    var T = window.TheReadCoach, out = [], SC = window.TheReadSchools, mine = A.interests().filter(function (i) { return i.aid === rec.id; });
    if (T) T.players.filter(function (p) { return String(p.id).indexOf(rec.id) === 0; }).forEach(function (p) { T.Act.entries(p.id).forEach(function (e) { out.push(e); }); });
    var minorWait = rec.path !== 'adult' && A.gStatus(rec) !== 'Verified';
    var sports = rec.sports && rec.sports.length ? rec.sports : [{ name: rec.sport }];
    var list = mine.length ? '<ul class="int-list">' + mine.map(function (i) {
      var st = !i.onRead ? 'Not On THE READ Yet &ndash; no program was notified' : i.seen ? 'Seen By ' + esc(i.seen.by) + ' on ' + esc(i.seen.ts.slice(0, 10)) : minorWait ? 'Saved. The program can see this after your guardian verifies you' : 'Notification Saved In The Program&rsquo;s Workspace &ndash; Not Seen Yet';
      return '<li><strong>' + esc(i.school) + '</strong> &middot; ' + esc(i.sport) + ' &middot; ' + esc(i.ts.slice(0, 10)) + '<br />' + st + (i.note ? '<br /><span class="muted">' + esc(i.note) + '</span>' : '') + ' <button type="button" class="link-btn" data-delint="' + esc(i.id) + '">Remove</button></li>';
    }).join('') + '</ul>' : '<p>No programs added yet.</p>';
    var form = '<form id="intf" class="form-grid"><label>School Or Program<input name="school" list="school-list" required autocomplete="off" /></label><datalist id="school-list">' + SC.names.map(function (n) { return '<option value="' + esc(n) + '"></option>'; }).join('') + '</datalist>' +
      '<label>Sport<select name="sport">' + sports.map(function (s) { return '<option>' + esc(s.name) + '</option>'; }).join('') + '</select></label><label class="md-wide">Why Are You Interested? (Optional)<input name="note" maxlength="300" /></label><div><button class="button button-primary" type="submit">Add Interest</button> <span id="int-ok" role="status"></span></div></form>' +
      '<p class="muted">Pick a school from the list or type any school. Schools that are not on THE READ yet are saved in your list only and are not notified. For programs on THE READ, the notification is saved in this browser for the program&rsquo;s workspace; no email or push message is sent.</p>';
    return sec('Programs I&rsquo;m Interested In', 0, 'Add schools you want to hear from, per sport. Programs on THE READ see you under Interested Athletes.', form + '<h3>My List</h3>' + list) +
      sec('Coach Activity On My Profile', 0, 'Only real activity recorded by coaches in this app. Nothing is estimated.', out.length ? '<ul>' + out.map(function (e) { return '<li>' + esc(e.ts.replace('T', ' ')) + ' &ndash; ' + esc(e.by) + ': ' + esc(e.act.replace(/_/g, ' ')) + '</li>'; }).join('') + '</ul>' : '<p>No program activity yet.</p>');
  };

  var academics = function () {
    var x = X();
    return sec('Academics', 0, 'Optional. Helps coaches see the whole student. GPA and test scores never affect Recruit Score or Tier.',
      '<form id="acf" class="form-grid"><label>GPA<input name="gpa" inputmode="decimal" value="' + esc(x.gpa || '') + '" /></label><label>SAT<input name="sat" inputmode="numeric" value="' + esc(x.sat || '') + '" /></label><label>ACT<input name="act" inputmode="numeric" value="' + esc(x.act || '') + '" /></label><label>Intended Major<input name="major" value="' + esc(x.major || '') + '" /></label><div><button class="button button-primary" type="submit">Save Academics</button> <span id="ac-ok" role="status"></span></div></form>');
  };

  var media = function () {
    var x = X(), v = x.videos || [], a = x.awards || [];
    return sec('Video, Media &amp; Achievements', 0, 'Optional links to game or training video and a list of awards. Added by you only.',
      '<h3>Video Links</h3>' + (v.length ? '<ul>' + v.map(function (l, i) { return '<li><a href="' + esc(l.url) + '" rel="noopener noreferrer" target="_blank">' + esc(l.label || l.url) + '</a> <button type="button" class="link-btn" data-delv="' + i + '">Remove</button></li>'; }).join('') + '</ul>' : '<p>None added.</p>') +
      '<form id="vidf" class="form-grid"><label>Label<input name="l" /></label><label>Link (https)<input name="u" type="url" required placeholder="https://" /></label><div><button class="button button-secondary" type="submit">Add Video Link</button></div></form>' +
      '<h3>Achievements</h3>' + (a.length ? '<ul>' + a.map(function (l, i) { return '<li>' + esc(l) + ' <button type="button" class="link-btn" data-dela="' + i + '">Remove</button></li>'; }).join('') + '</ul>' : '<p>None added.</p>') +
      '<form id="awf" class="form-grid"><label>Award / Achievement<input name="a" required /></label><div><button class="button button-secondary" type="submit">Add Achievement</button></div></form>');
  };

  var account = function () {
    var verified = A.anyVerified(rec);
    return sec('Contact, Edit Profile &amp; Account', 1, 'Your contact info, quick edits, and plan status.',
      '<h3>Contact Info</h3><dl class="review-list"><dt>Email</dt><dd>' + prov(rec.email) + '</dd><dt>Visible To Coaches</dt><dd>' + (A.shares(rec, 'contact') ? 'Yes' : 'No') + '</dd></dl>' +
      '<h3>Edit Profile</h3><form id="edf" class="form-grid"><label>School / Club<input name="school" value="' + esc(rec.school) + '" /></label><label>State<input name="state" value="' + esc(rec.state) + '" maxlength="2" /></label><label>Graduation Class<input name="grad" type="number" min="2000" max="2100" value="' + esc(rec.grad) + '" /></label>' + (isHS() ? '' : '<label>Years Of Eligibility Left<input name="elig" type="number" min="0" max="6" value="' + esc(rec.elig == null ? '' : rec.elig) + '" /></label>') + '<div><button class="button button-primary" type="submit">Save Changes</button> <span id="ed-ok" role="status"></span></div></form>' +
      '<h3>Account</h3><dl class="review-list"><dt>Plan</dt><dd>Athlete Basic</dd><dt>Verification</dt><dd>' + (verified ? badge('Verified') : badge('Unverified')) + '</dd></dl>');
  };

  var TABS = [['overview', 'Overview', overview], ['scores', 'Scores', scores], ['metrics', 'Metrics', metrics], ['guardian', 'Guardian', guardian], ['privacy', 'Privacy', privacy], ['messages', 'Messages', messages], ['calendar', 'Calendar', calendar], ['interest', 'Interest', interest], ['academics', 'Academics', academics], ['media', 'Media', media], ['account', 'Account', account]];

  var render = function () {
    root.innerHTML = '<nav class="coach-subnav prof-tabs" aria-label="Athlete profile sections"><span class="ws-label">Athlete Profile</span>' + TABS.map(function (t) { return '<a href="#' + t[0] + '"' + (t[0] === tab ? ' aria-current="page"' : '') + ' data-tab="' + t[0] + '">' + t[1] + '</a>'; }).join('') + '</nav>' +
      '<div class="prof-body">' + TABS.filter(function (t) { return t[0] === tab; })[0][2]() + '</div>';
    wire();
  };
  var upd = function () { A.upsert(rec); };
  var wire = function () {
    var $ = function (s) { return root.querySelector(s); };
    Array.prototype.forEach.call(root.querySelectorAll('[data-tab]'), function (a) { a.addEventListener('click', function (e) { e.preventDefault(); tab = a.dataset.tab; try { history.replaceState(null, '', '#' + tab); } catch (x) { /* ignore */ } render(); }); });
    Array.prototype.forEach.call(root.querySelectorAll('[data-sport]'), function (b) { b.addEventListener('click', function () { cur = Number(b.dataset.sport); render(); }); });
    var f;
    if ((f = $('#intf'))) f.addEventListener('submit', function (e) { e.preventDefault(); var d = new FormData(e.target), nm = String(d.get('school')).trim(), sc = window.TheReadSchools.find(nm); if (!nm) return; var it = A.addInterest(rec.id, sc ? sc.name : nm, d.get('sport'), d.get('note'), !!(sc && sc.onRead)); render(); $('#int-ok').textContent = it ? 'Added.' : 'Already on your list for that sport.'; });
    Array.prototype.forEach.call(root.querySelectorAll('[data-delint]'), function (b) { b.addEventListener('click', function () { A.removeInterest(b.dataset.delint); render(); }); });
    if ((f = $('#vf'))) f.addEventListener('submit', function (e) { e.preventDefault(); var d = new FormData(e.target); rec.verifiers = rec.verifiers || []; var ks = d.getAll('k'); if (!ks.length) return; rec.verifiers.push({ type: d.get('t'), name: d.get('n'), email: d.get('e'), status: 'Requested', keys: ks, date: new Date().toISOString().slice(0, 10) }); upd(); render(); });
    if ((f = $('#g-resend'))) f.addEventListener('click', function () { rec.guardian.status = 'Pending'; rec.guardian.sent = Date.now(); rec.guardian.log = rec.guardian.log || []; rec.guardian.log.push({ t: new Date().toISOString(), a: 'Verification code re-issued (simulated, nothing sent)' }); upd(); render(); });
    Array.prototype.forEach.call(root.querySelectorAll('[data-pv]'), function (c) { c.addEventListener('change', function () { rec.privacy[c.dataset.pv] = c.checked; upd(); $('#pv-ok').textContent = 'Saved.'; }); });
    if ((f = $('#msgwho'))) f.addEventListener('change', function () { setX({ msgWho: root.querySelector('#msgwho').value }); $('#pv-ok').textContent = 'Saved.'; });
    if ((f = $('#mf'))) f.addEventListener('submit', function (e) { e.preventDefault(); var d = new FormData(e.target); A.METRICS.forEach(function (m) { var raw = String(d.get(m[0])).trim(), v = raw === '' ? null : Number(raw); if (v != null && (isNaN(v) || v < m[2] || v > m[3])) return; if (v == null) { delete rec.metrics[m[0]]; } else { if (rec.metrics[m[0]] !== v && rec.verified && rec.verified[m[0]]) delete rec.verified[m[0]]; if (rec.vdecl) delete rec.vdecl[m[0]]; rec.metrics[m[0]] = v; } }); upd(); render(); $('#mf-ok').textContent = 'Saved. Scores recalculated.'; });
    if ((f = $('#acf'))) f.addEventListener('submit', function (e) { e.preventDefault(); var d = new FormData(e.target); setX({ gpa: String(d.get('gpa')).trim(), sat: String(d.get('sat')).trim(), act: String(d.get('act')).trim(), major: String(d.get('major')).trim() }); $('#ac-ok').textContent = 'Saved.'; });
    if ((f = $('#vidf'))) f.addEventListener('submit', function (e) { e.preventDefault(); var d = new FormData(e.target), u = String(d.get('u')).trim(); if (!/^https:\/\//i.test(u)) { alert('Links must start with https://'); return; } var v = (X().videos || []).concat([{ label: String(d.get('l')).trim(), url: u }]); setX({ videos: v }); render(); });
    if ((f = $('#awf'))) f.addEventListener('submit', function (e) { e.preventDefault(); var d = new FormData(e.target); setX({ awards: (X().awards || []).concat([String(d.get('a')).trim()]) }); render(); });
    Array.prototype.forEach.call(root.querySelectorAll('[data-delv]'), function (b) { b.addEventListener('click', function () { var v = X().videos || []; v.splice(Number(b.dataset.delv), 1); setX({ videos: v }); render(); }); });
    Array.prototype.forEach.call(root.querySelectorAll('[data-dela]'), function (b) { b.addEventListener('click', function () { var v = X().awards || []; v.splice(Number(b.dataset.dela), 1); setX({ awards: v }); render(); }); });
    if ((f = $('#edf'))) f.addEventListener('submit', function (e) { e.preventDefault(); var d = new FormData(e.target), g = Number(d.get('grad')); if (!g) { $('#ed-ok').textContent = 'Enter a graduation year.'; return; } rec.school = String(d.get('school')).trim(); rec.state = String(d.get('state')).trim().toUpperCase(); rec.grad = g; if (d.has('elig')) { var el = String(d.get('elig')).trim(); rec.elig = el === '' ? null : Number(el); } upd(); render(); $('#ed-ok').textContent = 'Saved.'; });
  };
  var h = location.hash.replace('#', ''); if (TABS.some(function (t) { return t[0] === h; })) tab = h;
  render();
})();
