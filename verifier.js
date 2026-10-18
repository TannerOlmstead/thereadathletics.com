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

  // ------------------------------------------------------------ shared entry tools (validators, CSV, templates)
  var XM = [['pop', 'Pop Time', 1.5, 3.5], ['ifv', 'Infield Velo', 40, 110], ['ofv', 'Outfield Velo', 40, 110]];
  var ALLM = A.METRICS.concat(XM);
  var mdef = function (k) { return ALLM.filter(function (m) { return m[0] === k; })[0] || [k, k, null, null]; };
  var label = function (k) { return mdef(k)[1]; };
  var TPL = { baseball: ['ht', 'wt', 't60', 'avgEV', 'maxEV', 'avgFBV', 'maxFBV', 'pop', 'ifv', 'ofv'] };
  var tplFor = function (sport) { return TPL[sport] || ['ht', 'wt']; };
  var DEVICES = ['Trackman', 'Rapsodo', 'Stopwatch', 'Radar Gun', 'Pop-Time Timer', 'Measured In Person', 'Other'];
  // Blank stays blank (never 0); anything else must be a number inside the shared range.
  var validate = function (k, raw) {
    var s = String(raw == null ? '' : raw).trim();
    if (s === '') return { ok: true, value: null, blank: true };
    var d = mdef(k);
    if (!/^-?\d+(\.\d+)?$/.test(s)) return { ok: false, err: d[1] + ' must be a number.' };
    var n = Number(s);
    if (d[2] != null && (n < d[2] || n > d[3])) return { ok: false, err: d[1] + ' must be between ' + d[2] + ' and ' + d[3] + '.' };
    return { ok: true, value: n };
  };
  var parseCSV = function (text) {
    var rows = [], row = [], cur = '', q = false, i, c;
    text = String(text || '').replace(/\r\n?/g, '\n');
    for (i = 0; i < text.length; i++) {
      c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true;
      else if (c === ',' || c === '\t') { row.push(cur); cur = ''; }
      else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else cur += c;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return String(x).trim() !== ''; }); });
  };
  var csvCell = function (x) { x = String(x == null ? '' : x); return /[",\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; };
  var toCSV = function (rows) { return rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n') + '\r\n'; };
  var template = function (sport) { return toCSV([['athlete_email', 'athlete_name'].concat(tplFor(sport))]); };
  var shareCode = function (r) { return 'READ-' + String(r.id || '').replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase(); };
  window.TheReadVerifierTools = { validate: validate, parseCSV: parseCSV, toCSV: toCSV, template: template, shareCode: shareCode, templateKeys: tplFor, metrics: ALLM };

  // ------------------------------------------------------------ workspace
  var root = document.getElementById('vdash-app');
  if (!root) return;
  var DKEY = 'theReadVerifierDefaults', GKEY = 'theReadVerifierDraft';
  var tab = 'queue', sel = '', msg = '', showAll = false, undo = [], lastAddMsg = '';
  var TABS = [['queue', 'Verification Queue'], ['bulk', 'Bulk Entry'], ['athletes', 'My Athletes'], ['history', 'History & Profile']];
  var me = function () { var s = ACC.session(); return s && s.vid ? loadV().filter(function (x) { return x.id === s.vid; })[0] || null : null; };
  var today = function () { return new Date().toISOString().slice(0, 10); };
  var jget = function (k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } };
  var jset = function (k, o) { try { localStorage.setItem(k, JSON.stringify(o)); } catch (e) { /* ignore */ } };
  var dflt = function (v) { var d = (jget(DKEY))[v.id] || {}; d.filters = d.filters || {}; return d; };
  var setDflt = function (v, patch) { var all = jget(DKEY), d = all[v.id] || {}; Object.keys(patch).forEach(function (k) { d[k] = patch[k]; }); all[v.id] = d; jset(DKEY, all); };
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
  var keysOf = function (x) { return (x.q.keys && x.q.keys.length ? x.q.keys : ALLM.map(function (m) { return m[0]; })).filter(function (k) { return x.rec.metrics && x.rec.metrics[k] != null; }); };
  var decided = function (r, k) { var s = A.metricStatus(r, k).status; return s === 'Verified' || s === 'Declined'; };
  var conf = function (r) { try { var c = window.TheReadScore && window.TheReadScore.compute({ pos: r.pos, metrics: r.metrics || {}, verified: r.verified || {} }, []).conf; return c == null ? 'Unknown' : window.TheReadClassification.formatConfidencePercentage(c); } catch (e) { return 'Unknown'; } };
  var find = function (rid, i) { var r = A.load().filter(function (x) { return x.id === rid; })[0]; return r ? { rec: r, q: r.verifiers[i], rid: rid, i: i } : null; };
  var who = function (v) { return { by: v.name + (v.org ? ', ' + v.org : ''), role: typeName(v.type), vid: v.id }; };
  var finishIfDone = function (x) { if (keysOf(x).every(function (k) { return decided(x.rec, k); })) { x.q.status = 'Completed'; x.q.done = today(); } };
  var snap = function (recs) { undo.push(recs.map(function (r) { return JSON.stringify(r); })); if (undo.length > 30) undo.shift(); };
  var roster = function (v) { var seen = {}, out = []; allReqs(v).filter(function (x) { return x.q.status === 'Accepted' || x.q.status === 'Completed'; }).forEach(function (x) { if (!seen[x.rid]) { seen[x.rid] = 1; out.push(x); } }); return out; };
  var stats = function (v) {
    var rs = allReqs(v), req = rs.filter(function (x) { return x.q.status === 'Requested'; }).length, awaiting = 0, t = today(), ver = 0;
    rs.filter(function (x) { return x.q.status === 'Accepted'; }).forEach(function (x) { keysOf(x).forEach(function (k) { if (!decided(x.rec, k)) awaiting++; }); });
    A.load().forEach(function (r) { (r.vlog || []).forEach(function (e) { if (e.vid === v.id && e.ok && String(e.ts).slice(0, 10) === t) ver++; }); });
    return { req: req, awaiting: awaiting, ver: ver };
  };
  var applyMetric = function (x, v, k, mode, obs, method) {
    var old = x.rec.metrics[k];
    if (mode === 'edit') x.rec.metrics[k] = obs;
    A.verifyMetric(x.rec, k, mode !== 'no', who(v), method);
    var e = x.rec.vlog[x.rec.vlog.length - 1]; if (mode === 'edit') { e.reported = old; e.edited = true; }
    finishIfDone(x); putA(x.rec);
  };

  var requestsBlock = function (v) {
    var rs = allReqs(v).filter(function (x) { return x.q.status === 'Requested'; });
    return '<section class="v-req" aria-label="New requests"><h3>New Requests (' + rs.length + ')</h3>' + (rs.length ? '<ul class="v-reqlist">' + rs.map(function (x) {
      return '<li><span><strong>' + esc(x.rec.name) + '</strong> &middot; ' + keysOf(x).map(label).map(esc).join(', ') + (x.addressed ? '' : ' <small>(sent to a different email; demo view)</small>') + '</span><span><button type="button" class="button button-primary" data-acc="' + x.rid + ':' + x.i + '">Accept</button> <button type="button" class="button button-secondary" data-dec="' + x.rid + ':' + x.i + '">Decline</button></span></li>';
    }).join('') + '</ul>' : '<p class="muted">No new requests. Athletes ask from their profile; or use Add Athlete on the My Athletes tab.</p>') +
      '<label class="check"><input type="checkbox" id="v-all"' + (showAll ? ' checked' : '') + ' /> Demo: also show requests to my provider type sent to a different email</label></section>';
  };
  var expanded = function (v, x) {
    var d = dflt(v), r = x.rec;
    return '<div class="v-exp-in"><div class="field"><label for="q-method">Method / Source For This Athlete</label><input id="q-method" list="v-devices" value="' + esc(d.method || '') + '" placeholder="e.g. Rapsodo, radar gun, measured in person" /></div>' +
      '<p class="hint">Select a row then press <kbd>Y</kbd> confirm, <kbd>E</kbd> confirm with edit (type the observed value first), <kbd>N</kbd> decline. Each metric is its own decision; there is no verify-all.</p>' +
      '<div class="table-wrap"><table class="v-mtable"><thead><tr><th scope="col">Metric</th><th scope="col">Athlete Reported</th><th scope="col">Observed (If Different)</th><th scope="col">Status</th><th scope="col">Decision</th></tr></thead><tbody>' + (keysOf(x).map(function (k) {
        var st = A.metricStatus(r, k), done = decided(r, k);
        return '<tr class="v-mrow" tabindex="0" data-k="' + k + '"><th scope="row">' + esc(label(k)) + '</th><td>' + esc(r.metrics[k]) + '</td><td>' + (done ? '' : '<input class="v-obs" inputmode="decimal" data-obs="' + k + '" aria-label="Observed ' + esc(label(k)) + '" placeholder="Same" />') + '</td><td>' + badge(st.status) + (st.date ? '<br><small>' + esc(st.by) + ', ' + esc(st.date) + '</small>' : '') + '</td><td class="v-acts">' +
          (done ? '<button type="button" class="button button-secondary" data-act="ok" data-k="' + k + '">Re-Confirm</button>' : '<button type="button" class="button button-primary" data-act="ok" data-k="' + k + '">Confirm (Y)</button> <button type="button" class="button button-secondary" data-act="edit" data-k="' + k + '">Confirm With Edit (E)</button> <button type="button" class="button button-secondary" data-act="no" data-k="' + k + '">Decline (N)</button>') + '</td></tr>';
      }).join('') || '<tr><td colspan="5">No metrics were entered for this request.</td></tr>') + '</tbody></table></div></div>';
  };
  var nextMsg = function (v, rs) {
    var st = stats(v);
    if (st.req) return 'Accept the ' + st.req + ' new request' + (st.req === 1 ? '' : 's') + ' below.';
    if (rs.length) return 'Open an athlete below and confirm each metric (press Y, E or N).';
    return roster(v).length ? 'Everyone is verified. Use Bulk Entry for your next session.' : 'Add an athlete with their share code on My Athletes, or wait for a request.';
  };
  var queue = function (v) {
    var rs = allReqs(v).filter(function (x) { return x.q.status === 'Accepted'; });
    return '<h2>Verification Queue</h2><p class="next-step"><strong>Next Step:</strong> ' + (nextMsg(v, rs)) + '</p>' + requestsBlock(v) + '<h3>Athletes Awaiting Verification (' + rs.length + ')</h3>' +
      (rs.length ? '<div class="table-wrap"><table class="v-queue"><thead><tr><th scope="col">Athlete</th><th scope="col">Class</th><th scope="col">Position</th><th scope="col">Decided</th><th scope="col">Confidence</th><th scope="col"><span class="visually-hidden">Open</span></th></tr></thead><tbody>' + rs.map(function (x) {
        var ks = keysOf(x), dec = ks.filter(function (k) { return decided(x.rec, k); }).length, key = x.rid + ':' + x.i, open = sel === key;
        return '<tr><th scope="row">' + esc(x.rec.name) + '</th><td>' + esc(x.rec.grad) + '</td><td>' + esc(x.rec.pos || '') + '</td><td>' + dec + ' of ' + ks.length + '</td><td>' + conf(x.rec) + '</td><td><button type="button" class="button ' + (open ? 'button-secondary' : 'button-primary') + '" data-rev="' + key + '" aria-expanded="' + open + '">' + (open ? 'Close' : 'Review') + '</button></td></tr>' + (open ? '<tr class="v-exp"><td colspan="6">' + expanded(v, x) + '</td></tr>' : '');
      }).join('') + '</tbody></table></div>' : '<div class="empty-state"><p><strong>Nothing is waiting.</strong> Accept a request above, or add an athlete from <a href="#athletes" data-tab="athletes">My Athletes</a> with their share code. Entering a whole team at once? Use <a href="#bulk" data-tab="bulk">Bulk Entry</a>.</p></div>') +
      '<datalist id="v-devices">' + DEVICES.map(function (d) { return '<option value="' + esc(d) + '"></option>'; }).join('') + '</datalist>';
  };

  var sportOpts = function () { return (window.TheReadSports ? window.TheReadSports.list : [{ id: 'baseball', name: 'Baseball' }]); };
  var draftOf = function (v) { return (jget(GKEY))[v.id] || {}; };
  var bulk = function (v) {
    var d = dflt(v), sp = d.sport || 'baseball', ks = tplFor(sp), rs = roster(v), dr = draftOf(v), sd = d.session || {};
    return '<h2>Bulk Entry</h2><p class="coach-note">One row per athlete, one column per metric. Fill Session Details once; they are recorded as the method and source for every value. Blank cells are skipped (never saved as 0). Tab or Enter moves between cells; you can paste straight from Excel or Sheets. Your entries autosave in this browser.</p>' +
      '<form class="form-card v-session" id="v-session" novalidate><h3>Session Details</h3><div class="form-grid">' +
      '<div class="field"><label for="s-event">Event Name</label><input id="s-event" value="' + esc(sd.event || d.event || '') + '" placeholder="e.g. Spring Showcase" /></div>' +
      '<div class="field"><label for="s-date">Date</label><input id="s-date" type="date" value="' + esc(sd.date || today()) + '" /></div>' +
      '<div class="field"><label for="s-method">Device / Method</label><select id="s-method">' + DEVICES.map(function (m) { return '<option' + ((sd.method || d.method) === m ? ' selected' : '') + '>' + esc(m) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="s-loc">Location</label><input id="s-loc" value="' + esc(sd.loc || '') + '" /></div>' +
      '<div class="field"><label for="s-sport">Sport Template</label><select id="s-sport">' + sportOpts().map(function (s) { return '<option value="' + s.id + '"' + (s.id === sp ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('') + '</select></div></div></form>' +
      (sp !== 'baseball' ? '<p class="coach-note">This sport&rsquo;s metric template is a stub (Height and Weight only). Full metric sets are Not Yet Available.</p>' : '') +
      (rs.length ? '<div class="table-wrap"><table class="v-grid" id="v-grid"><thead><tr><th scope="col">Athlete</th>' + ks.map(function (k) { return '<th scope="col">' + esc(label(k)) + '</th>'; }).join('') + '</tr></thead><tbody>' + rs.map(function (x, ri) {
        return '<tr><th scope="row">' + esc(x.rec.name) + '<br><small>' + esc(x.rec.grad) + '</small></th>' + ks.map(function (k, ci) {
          var rep = x.rec.metrics && x.rec.metrics[k], val = (dr[x.rid] || {})[k];
          return '<td><input class="v-cell" inputmode="decimal" data-r="' + ri + '" data-c="' + ci + '" data-rid="' + x.rid + '" data-k="' + k + '" aria-label="' + esc(x.rec.name + ' ' + label(k)) + '" placeholder="' + (rep != null ? esc(rep) : '') + '" value="' + esc(val == null ? '' : val) + '" /></td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div><p class="hint">Grey placeholder = what the athlete reported. Whatever you type is your observed value.</p>' +
        '<div class="form-actions"><button type="button" class="button button-primary" id="b-commit">Verify Entered Values</button> <button type="button" class="button button-secondary" id="b-clear">Clear Grid</button> <button type="button" class="button button-secondary" id="b-tpl">Download CSV Template</button> <button type="button" class="button button-secondary" id="b-exp">Export Roster CSV</button></div>' +
        '<div class="field"><label for="b-csv">Import CSV (Paste Or Choose A File)</label><textarea id="b-csv" rows="3" placeholder="athlete_email,athlete_name,' + ks.join(',') + '"></textarea></div><div class="form-actions"><input type="file" id="b-file" accept=".csv,text/csv" aria-label="Choose CSV file" /> <button type="button" class="button button-secondary" id="b-imp">Load Into Grid</button></div>' +
        '<div id="b-out" role="status" aria-live="polite"></div>' : '<div class="empty-state"><p><strong>No athletes in your roster yet.</strong> Add athletes on <a href="#athletes" data-tab="athletes">My Athletes</a> (share code or search) or accept a request in the queue. Rows appear here automatically.</p></div>');
  };

  var athletes = function (v) {
    var d = dflt(v), f = d.filters, rs = roster(v).filter(function (x) {
      var q = (f.q || '').toLowerCase();
      return (!q || String(x.rec.name).toLowerCase().indexOf(q) >= 0) && (!f.grad || String(x.rec.grad) === f.grad) && (!f.st || x.q.status === f.st);
    }), grads = {}; roster(v).forEach(function (x) { grads[x.rec.grad] = 1; });
    var pendingAdds = [];
    A.load().forEach(function (r) { (r.verifiers || []).forEach(function (q) { if (q.vid === v.id && q.status === 'Awaiting Athlete Approval') pendingAdds.push(r); }); });
    var pre = (location.search.match(/[?&]add=([^&]+)/) || [])[1] || '';
    return '<h2>My Athletes</h2>' +
      '<form class="form-card" id="v-add" novalidate><h3>Add Athlete</h3><p class="hint">Enter the athlete&rsquo;s share code (from their profile or link) or search by name. The athlete must approve before you see any metrics, so you never retype a profile.</p><div class="form-grid"><div class="field"><label for="ad-q">Share Code Or Name</label><input id="ad-q" value="' + esc(decodeURIComponent(pre)) + '" placeholder="READ-AB12CD or athlete name" /></div></div><p class="field-error v-err" role="alert" hidden></p>' + (lastAddMsg ? '<p role="status"><strong>' + esc(lastAddMsg) + '</strong></p>' : '') + '<button class="button button-primary" type="submit">Send Approval Request</button></form>' +
      (pendingAdds.length ? '<p class="coach-note">Waiting for athlete approval: ' + pendingAdds.map(function (r) { return esc(r.name); }).join(', ') + '.</p>' : '') +
      '<div class="v-filters"><label>Search<input id="f-q" value="' + esc(f.q || '') + '" /></label><label>Class<select id="f-grad"><option value="">All</option>' + Object.keys(grads).sort().map(function (g) { return '<option' + (f.grad === g ? ' selected' : '') + '>' + esc(g) + '</option>'; }).join('') + '</select></label><label>Request<select id="f-st"><option value="">All</option><option' + (f.st === 'Accepted' ? ' selected' : '') + '>Accepted</option><option' + (f.st === 'Completed' ? ' selected' : '') + '>Completed</option></select></label></div>' +
      (rs.length ? '<div class="table-wrap"><table><thead><tr><th scope="col">Athlete</th><th scope="col">Class</th><th scope="col">Sport / Position</th><th scope="col">Metrics You Verified</th><th scope="col">Confidence</th><th scope="col">Request</th><th scope="col"><span class="visually-hidden">Action</span></th></tr></thead><tbody>' + rs.map(function (x) {
        var n = Object.keys(x.rec.verified || {}).filter(function (k) { return x.rec.verified[k].vid === v.id; }).length;
        return '<tr><th scope="row">' + esc(x.rec.name) + '</th><td>' + esc(x.rec.grad) + '</td><td>' + esc((x.rec.sports || []).map(function (s) { return s.name + ' ' + s.pos; }).join(', ') || x.rec.pos) + '</td><td>' + n + '</td><td>' + conf(x.rec) + '</td><td>' + badge(x.q.status) + '</td><td><button type="button" class="button button-secondary" data-goq="' + x.rid + ':' + x.i + '">Open In Queue</button></td></tr>';
      }).join('') + '</tbody></table></div>' : '<div class="empty-state"><p><strong>' + (roster(v).length ? 'No athletes match these filters.' : 'No athletes yet.') + '</strong> Use Add Athlete above or accept a request in the queue.</p></div>');
  };

  var historyTab = function (v) {
    var rows = [];
    A.load().forEach(function (r) { (r.vlog || []).forEach(function (e) { if (e.vid === v.id) rows.push({ r: r, e: e }); }); });
    rows.sort(function (a, b) { return a.e.ts < b.e.ts ? 1 : -1; });
    return '<h2>History &amp; Profile</h2><details class="expand"' + (location.hash === '#history-open' ? ' open' : '') + '><summary>Verification History (' + rows.length + ')</summary><p class="coach-note">Audit log of every decision: who, what, when, and the method or source. Entries are never edited; a change adds a new row.</p>' +
      (rows.length ? '<div class="table-wrap"><table><thead><tr><th scope="col">When</th><th scope="col">Athlete</th><th scope="col">Metric</th><th scope="col">Value</th><th scope="col">Decision</th><th scope="col">Method / Source</th><th scope="col">By</th></tr></thead><tbody>' + rows.map(function (x) {
        return '<tr><td>' + esc(x.e.ts.replace('T', ' ').slice(0, 16)) + '</td><th scope="row">' + esc(x.r.name) + '</th><td>' + esc(label(x.e.k)) + '</td><td>' + esc(x.e.value == null ? '' : x.e.value) + (x.e.edited ? ' <small>(edited from ' + esc(x.e.reported) + ')</small>' : '') + '</td><td>' + badge(x.e.ok ? 'Verified' : 'Declined') + '</td><td>' + esc(x.e.method || 'Not Recorded') + '</td><td>' + esc(x.e.by) + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '<p>No decisions yet.</p>') + '</details>' + profile(v);
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
    return '<h3>Profile And Credentials</h3><div class="notice navy" role="note"><strong>Approval status: ' + esc(v.status) + '.</strong> Approval of verifiers is an admin step that is on the roadmap; nothing here is checked. Verified Data Providers are free (see <a href="pricing.html">Pricing</a>).</div>' +
      '<form id="v-prof" class="form-card" novalidate><dl class="review-list"><dt>Provider Type</dt><dd>' + esc(typeName(v.type)) + '</dd><dt>Email</dt><dd>' + esc(v.email) + '</dd></dl><div class="form-grid">' + fld('pf-name', 'Full Name', { req: 1, val: v.name }) + fld('pf-phone', 'Phone (Optional)', { val: v.phone, type: 'tel' }) + fld('pf-org', 'Organization', { req: 1, val: v.org }) + fld('pf-title', 'Role / Title', { req: 1, val: v.title }) + methodsBox(v.methods || []) +
      fld('pf-how', 'How You Verify', { req: 1, area: 1, full: 1, val: v.how }) + fld('pf-link', 'Website Or Credential Link (Optional)', { type: 'url', full: 1, val: v.link }) + '</div><p class="field-error v-err" role="alert" hidden></p><button class="button button-primary" type="submit">Save Profile</button></form>';
  };
  var VIEWS = { queue: queue, bulk: bulk, athletes: athletes, history: historyTab, calendar: calendar };

  var draw = function () {
    var v = me();
    if (!v) {
      root.innerHTML = '<div class="form-card"><h2>Verified Data Provider Workspace</h2><p>You are not signed in as a verifier in this browser. <a href="sign-in.html">Sign in</a> as a Verified Data Provider, or <a href="verifier-signup.html">create a Verified Data Provider profile</a>.</p></div>';
      return;
    }
    var st = stats(v);
    root.innerHTML = '<nav class="coach-subnav prof-tabs v-tabs" aria-label="Verifier workspace sections"><span class="ws-label">Verifier Workspace</span>' + TABS.map(function (t) { return '<a href="#' + t[0] + '"' + (t[0] === tab ? ' aria-current="page"' : '') + ' data-tab="' + t[0] + '">' + t[1] + (t[0] === 'queue' && st.req ? ' <span class="cn-badge" aria-label="' + st.req + ' new requests">' + st.req + '</span>' : '') + '</a>'; }).join('') +
      '<span class="v-util"><a href="connect.html">Connect</a><a href="#calendar" data-tab="calendar"' + (tab === 'calendar' ? ' aria-current="page"' : '') + '>Calendar</a></span></nav>' +
      '<div class="v-sticky" role="region" aria-label="Summary"><span><strong>' + st.awaiting + '</strong> Metrics Pending</span><span><strong>' + st.req + '</strong> New Requests</span><span><strong>' + st.ver + '</strong> Verified Today</span><span class="v-msg" role="status" aria-live="polite">' + esc(msg) + '</span><button type="button" class="button button-secondary" id="v-undo"' + (undo.length ? '' : ' disabled') + '>Undo Last</button></div>' +
      '<p class="coach-note signed-in" role="status"><strong>Signed in as:</strong> ' + esc(v.name) + ' (' + esc(typeName(v.type)) + ', ' + esc(v.org) + '). Status: ' + esc(v.status) + '.</p><div class="prof-body">' + VIEWS[tab](v) + '</div>';
    msg = '';
    var on = function (s, fn) { Array.prototype.forEach.call(root.querySelectorAll(s), fn); };
    var go = function (t, s) { tab = t; sel = s || ''; try { history.replaceState(null, '', '#' + t); } catch (x) { /* ignore */ } draw(); };
    on('[data-tab]', function (a) { a.addEventListener('click', function (e) { e.preventDefault(); go(a.dataset.tab); }); });
    on('[data-goq]', function (b) { b.addEventListener('click', function () { go('queue', b.dataset.goq); }); });
    on('[data-rev]', function (b) { b.addEventListener('click', function () { sel = sel === b.dataset.rev ? '' : b.dataset.rev; draw(); }); });
    var ub = root.querySelector('#v-undo');
    if (ub) ub.addEventListener('click', function () { var s = undo.pop(); if (!s) return; s.forEach(function (j) { putA(JSON.parse(j)); }); msg = 'Last action undone.'; draw(); });

    var act = function (k, mode) {
      var p = sel.split(':'), x = find(p[0], Number(p[1])); if (!x) return;
      var m = root.querySelector('#q-method').value.trim(), oi = root.querySelector('[data-obs="' + k + '"]'), obs = null;
      if (mode !== 'no' && !m) { msg = 'Enter the method or source first.'; draw(); return; }
      if (mode === 'edit') {
        var res = validate(k, oi ? oi.value : '');
        if (res.blank || !res.ok) { msg = res.err || 'Type the observed ' + label(k) + ' first.'; draw(); return; }
        if (res.value === Number(x.rec.metrics[k])) { msg = 'Observed matches the reported value; use Confirm.'; draw(); return; }
        obs = res.value;
      }
      snap([x.rec]); if (m) setDflt(v, { method: m });
      applyMetric(x, v, k, mode, obs, m); msg = label(k) + (mode === 'no' ? ' declined.' : mode === 'edit' ? ' confirmed with edit.' : ' confirmed.'); draw();
    };
    on('[data-act]', function (b) { b.addEventListener('click', function () { act(b.dataset.k, b.dataset.act); }); });
    on('.v-mrow', function (r) {
      r.addEventListener('keydown', function (e) {
        if (e.target !== r || e.ctrlKey || e.metaKey || e.altKey) return;
        var c = String(e.key).toLowerCase(), m = { y: 'ok', e: 'edit', n: 'no' }[c];
        if (m) { e.preventDefault(); act(r.dataset.k, m); }
      });
    });
    on('[data-acc],[data-dec]', function (b) {
      b.addEventListener('click', function () {
        var acc = !!b.dataset.acc, p = (b.dataset.acc || b.dataset.dec).split(':'), x = find(p[0], Number(p[1])); if (!x) return;
        snap([x.rec]);
        x.q.status = acc ? 'Accepted' : 'Closed'; x.q.vid = v.id; x.q.reason = acc ? '' : 'Declined by verifier'; x.q.decided = today();
        putA(x.rec); msg = acc ? 'Accepted. ' + x.rec.name + ' is now in your queue.' : 'Request declined. The athlete will see it as Closed.'; if (acc) sel = x.rid + ':' + x.i; draw();
      });
    });
    var all = root.querySelector('#v-all'); if (all) all.addEventListener('change', function () { showAll = all.checked; draw(); });

    // Bulk entry
    var grid = root.querySelector('#v-grid'), ss = root.querySelector('#v-session');
    var saveDraft = function () {
      var dr = {}; on('.v-cell', function (c) { if (c.value.trim() !== '') { (dr[c.dataset.rid] = dr[c.dataset.rid] || {})[c.dataset.k] = c.value.trim(); } });
      var all2 = jget(GKEY); all2[v.id] = dr; jset(GKEY, all2);
    };
    var saveSession = function () {
      var g = function (id) { return root.querySelector('#' + id).value; };
      setDflt(v, { session: { event: g('s-event'), date: g('s-date'), method: g('s-method'), loc: g('s-loc') }, event: g('s-event'), method: g('s-method') });
    };
    if (ss) {
      ss.addEventListener('submit', function (e) { e.preventDefault(); });
      ss.addEventListener('input', saveSession);
      root.querySelector('#s-sport').addEventListener('change', function (e) { setDflt(v, { sport: e.target.value }); draw(); });
    }
    if (grid) {
      grid.addEventListener('input', saveDraft);
      grid.addEventListener('keydown', function (e) {
        var t = e.target; if (!t.classList.contains('v-cell') || e.key !== 'Enter') return; e.preventDefault();
        var n = grid.querySelector('.v-cell[data-r="' + (Number(t.dataset.r) + (e.shiftKey ? -1 : 1)) + '"][data-c="' + t.dataset.c + '"]'); if (n) n.focus();
      });
      grid.addEventListener('paste', function (e) {
        var t = e.target; if (!t.classList.contains('v-cell')) return;
        var txt = (e.clipboardData || window.clipboardData).getData('text'); if (!/[\t\n]/.test(txt.replace(/\n$/, ''))) return;
        e.preventDefault();
        parseCSV(txt).forEach(function (row, ri) { row.forEach(function (val, ci) { var c = grid.querySelector('.v-cell[data-r="' + (Number(t.dataset.r) + ri) + '"][data-c="' + (Number(t.dataset.c) + ci) + '"]'); if (c) c.value = String(val).trim(); }); });
        saveDraft();
      });
      var out = root.querySelector('#b-out');
      root.querySelector('#b-clear').addEventListener('click', function () { var a2 = jget(GKEY); delete a2[v.id]; jset(GKEY, a2); draw(); });
      root.querySelector('#b-commit').addEventListener('click', function () {
        saveSession(); var sd = dflt(v).session || {}, method = [sd.method || 'Not Recorded', sd.event ? sd.event : '', sd.loc ? sd.loc : '', sd.date || today()].filter(Boolean).join(' | ');
        var rs = roster(v), byRid = {}; rs.forEach(function (x) { byRid[x.rid] = x; });
        var errs = [], cells = [], changed = {}; on('.v-cell', function (c) { c.removeAttribute('aria-invalid'); var res = validate(c.dataset.k, c.value); if (res.blank) return; if (!res.ok) { c.setAttribute('aria-invalid', 'true'); errs.push((byRid[c.dataset.rid] ? byRid[c.dataset.rid].rec.name : '') + ': ' + res.err); } else cells.push({ c: c, res: res }); });
        if (!cells.length && !errs.length) { out.innerHTML = '<p class="field-error">Nothing entered. Type at least one value.</p>'; return; }
        snap(Object.keys(byRid).map(function (k) { return byRid[k].rec; }));
        var n = 0, left = jget(GKEY), dr = {};
        cells.forEach(function (o) {
          var x = byRid[o.c.dataset.rid], k = o.c.dataset.k; if (!x) return;
          var rep = x.rec.metrics ? x.rec.metrics[k] : null; x.rec.metrics = x.rec.metrics || {};
          var edit = rep != null && Number(rep) !== o.res.value, old = rep; x.rec.metrics[k] = o.res.value;
          A.verifyMetric(x.rec, k, true, who(v), method); var e = x.rec.vlog[x.rec.vlog.length - 1]; e.value = o.res.value; if (edit) { e.edited = true; e.reported = old; }
          changed[x.rid] = x; n++;
        });
        Object.keys(changed).forEach(function (id) { putA(changed[id].rec); });
        on('.v-cell', function (c) { if (c.value.trim() !== '' && c.getAttribute('aria-invalid')) { (dr[c.dataset.rid] = dr[c.dataset.rid] || {})[c.dataset.k] = c.value.trim(); } });
        left[v.id] = dr; jset(GKEY, left); setDflt(v, { method: sd.method });
        msg = n + ' value' + (n === 1 ? '' : 's') + ' verified' + (errs.length ? '; ' + errs.length + ' need fixing' : '') + '.';
        if (errs.length) { draw(); root.querySelector('#b-out').innerHTML = '<p class="field-error" role="alert">' + errs.map(esc).join('<br>') + '</p>'; } else draw();
      });
      var dl = function (name, text) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); };
      var spt = dflt(v).sport || 'baseball';
      root.querySelector('#b-tpl').addEventListener('click', function () { dl('the-read-verification-template-' + spt + '.csv', template(spt)); });
      root.querySelector('#b-exp').addEventListener('click', function () {
        var ks = tplFor(spt); dl('the-read-roster.csv', toCSV([['athlete_email', 'athlete_name'].concat(ks)].concat(roster(v).map(function (x) { return [x.rec.email || '', x.rec.name].concat(ks.map(function (k) { return x.rec.metrics && x.rec.metrics[k] != null ? x.rec.metrics[k] : ''; })); }))));
      });
      var load = function (text) {
        var rows = parseCSV(text), ks = tplFor(spt), errs = [], ok = 0; if (rows.length < 2) { out.innerHTML = '<p class="field-error" role="alert">The CSV needs a header row and at least one data row.</p>'; return; }
        var head = rows[0].map(function (h) { return h.trim().toLowerCase(); }), ie = head.indexOf('athlete_email'), inm = head.indexOf('athlete_name'), rs = roster(v);
        rows.slice(1).forEach(function (r, n) {
          var em = ie >= 0 ? String(r[ie] || '').trim().toLowerCase() : '', nm = inm >= 0 ? String(r[inm] || '').trim().toLowerCase() : '';
          var x = rs.filter(function (y) { return (em && String(y.rec.email || '').toLowerCase() === em) || (!em && nm && String(y.rec.name).toLowerCase() === nm); })[0];
          if (!x) { errs.push('Row ' + (n + 2) + ': athlete not in your roster (' + esc(em || nm || 'blank') + ').'); return; }
          ks.forEach(function (k) { var ci = head.indexOf(k.toLowerCase()); if (ci < 0) return; var res = validate(k, r[ci]); if (res.blank) return; var cell = grid.querySelector('.v-cell[data-rid="' + x.rid + '"][data-k="' + k + '"]'); if (!res.ok) { errs.push('Row ' + (n + 2) + ': ' + res.err); if (cell) { cell.value = String(r[ci]).trim(); cell.setAttribute('aria-invalid', 'true'); } return; } if (cell) { cell.value = res.value; ok++; } });
        });
        saveDraft(); out.innerHTML = '<p role="status"><strong>' + ok + ' value' + (ok === 1 ? '' : 's') + ' loaded into the grid.</strong> Review, then press Verify Entered Values.</p>' + (errs.length ? '<p class="field-error" role="alert">' + errs.join('<br>') + '</p>' : '');
      };
      root.querySelector('#b-imp').addEventListener('click', function () { load(root.querySelector('#b-csv').value); });
      root.querySelector('#b-file').addEventListener('change', function (e) { var f = e.target.files[0]; if (!f) return; var fr = new FileReader(); fr.onload = function () { root.querySelector('#b-csv').value = String(fr.result); load(String(fr.result)); }; fr.readAsText(f); });
    }

    // My Athletes
    var ad = root.querySelector('#v-add');
    if (ad) ad.addEventListener('submit', function (e) {
      e.preventDefault(); var q = root.querySelector('#ad-q').value.trim(); if (!q) return showErr(root, 'Enter a share code or an athlete name.', 'ad-q');
      var recs = A.load().filter(function (r) { return r.submitted; }), up = q.toUpperCase(), hit = recs.filter(function (r) { return shareCode(r) === up; });
      if (!hit.length) hit = recs.filter(function (r) { return String(r.name).toLowerCase().indexOf(q.toLowerCase()) >= 0; });
      if (!hit.length) return showErr(root, 'No athlete found. Check the code, or ask the athlete to send their share code from their profile.', 'ad-q');
      if (hit.length > 1) return showErr(root, hit.length + ' athletes match. Use the exact share code.', 'ad-q');
      var r = hit[0], dup = (r.verifiers || []).filter(function (z) { return z.vid === v.id || String(z.email || '').toLowerCase() === v.email.toLowerCase(); })[0];
      if (dup) { lastAddMsg = r.name + ' already has a request with you (' + dup.status + ').'; draw(); return; }
      snap([r]); r.verifiers = r.verifiers || []; r.verifiers.push({ type: typeName(v.type), name: v.name + (v.org ? ', ' + v.org : ''), email: v.email, status: 'Awaiting Athlete Approval', keys: null, date: today(), vid: v.id, byVerifier: true });
      putA(r); lastAddMsg = 'Request sent to ' + r.name + '. They approve it from their profile (demo, nothing is emailed).'; draw();
    });
    var fq = root.querySelector('#f-q'); if (fq) { fq.addEventListener('change', function () { var f = dflt(v).filters; f.q = fq.value.trim(); setDflt(v, { filters: f }); draw(); }); }
    ['grad', 'st'].forEach(function (k) { var el = root.querySelector('#f-' + k); if (el) el.addEventListener('change', function () { var f = dflt(v).filters; f[k] = el.value; setDflt(v, { filters: f }); draw(); }); });

    // Calendar + profile
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
  var h = location.hash.replace('#', ''); if (h === 'inbox') h = 'queue'; if (h === 'profile' || h === 'history-open') h = 'history'; if (VIEWS[h]) tab = h; else if (/[?&]add=/.test(location.search)) tab = 'athletes';
  draw();
})();
