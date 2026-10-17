/* THE READ Athletics - athlete signup + guardian verification DEMO.
   Static site, no backend: everything is saved in this browser's localStorage. No email/SMS is sent, no identity is verified,
   and the password is never stored or sent. See ROADMAP.md for the real requirements. */
(function () {
  'use strict';
  var KEY = 'theReadDemoAthletes', CUR = 'theReadDemoAthleteCurrent', DEMO_CODE = '000000', DAY = 86400000;
  var POS = ['P', 'C', '1B', '2B', '3B', 'SS', 'OF'];
  var LEVELS = ['High School', 'JUCO', '4-Year College / Transfer Portal', 'Other'];
  var PREF_POS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH/UT'];
  var VERIFIERS = [['hs', 'High School Coach'], ['pi', 'Private Instructor'], ['vdp', 'Verified Data Provider']];
  var METRICS = [['ht', 'Height (in)', 40, 96], ['wt', 'Weight (lb)', 60, 400], ['t60', '60-Yard Time (sec)', 5, 12], ['tv', 'Throwing Velocity (mph)', 30, 110], ['avgEV', 'Avg Exit Velocity (mph)', 40, 120], ['maxEV', 'Max Exit Velocity (mph)', 40, 130], ['avgFBV', 'Avg Fastball Velocity (mph)', 30, 105], ['maxFBV', 'Max Fastball Velocity (mph)', 30, 110]];
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var load = function () { try { var a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } };
  var save = function (a) { try { localStorage.setItem(KEY, JSON.stringify(a)); return true; } catch (e) { return false; } };
  var current = function () { var id = localStorage.getItem(CUR); return load().filter(function (a) { return a.id === id; })[0] || null; };
  var upsert = function (rec) { var a = load(), i = a.map(function (x) { return x.id; }).indexOf(rec.id); if (i < 0) a.push(rec); else a[i] = rec; save(a); try { localStorage.setItem(CUR, rec.id); } catch (e) { /* ignore */ } };
  var todayIso = function () { return new Date().toISOString().slice(0, 10); };
  var ageOf = function (dob) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob || '')) return null;
    var b = new Date(dob + 'T00:00:00'), n = new Date();
    if (isNaN(b.getTime()) || b > n) return null;
    var a = n.getFullYear() - b.getFullYear();
    if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
    return a;
  };
  var pathOf = function (age) { return age == null ? null : age >= 18 ? 'adult' : age >= 13 ? 'minor' : 'under13'; };
  // Pending codes expire 7 days after they were issued (demo rule).
  var gStatus = function (r) {
    var g = r && r.guardian; if (!g) return null;
    if (g.status === 'Pending' && Date.now() - g.sent > 7 * DAY) return 'Expired';
    return g.status;
  };
  // Minors are only listed to coaches after the guardian verifies; adults after choosing to be listed.
  var listed = function (r) {
    if (!r || !r.submitted || !r.privacy || !r.privacy.list) return false;
    return r.path === 'adult' ? true : gStatus(r) === 'Verified';
  };
  var shares = function (r, k) {
    var mine = !!(r.privacy && r.privacy[k]);
    if (r.path === 'adult') return mine;
    return mine && gStatus(r) === 'Verified' && !!(r.guardian.share && r.guardian.share[k]);
  };
  var anyVerified = function (r) { var v = r.verified || {}; return Object.keys(v).length > 0; };

  window.TheReadAthlete = { load: load, current: current, upsert: upsert, gStatus: gStatus, listed: listed, shares: shares, anyVerified: anyVerified, ageOf: ageOf, POS: POS, METRICS: METRICS };

  var getPath = function (o, p) { return p.split('.').reduce(function (a, k) { return a == null ? '' : a[k]; }, o); };
  var setPath = function (o, p, v) { var ks = p.split('.'), c = o; ks.slice(0, -1).forEach(function (k) { if (typeof c[k] !== 'object' || c[k] == null) c[k] = {}; c = c[k]; }); c[ks[ks.length - 1]] = v; };
  var badge = function (s) { return '<span class="st-badge st-' + String(s).toLowerCase().replace(/[^a-z]/g, '') + '">' + esc(s) + '</span>'; };

  // ---------------------------------------------------------------- signup wizard + status panel
  var wiz = document.getElementById('athlete-wizard');
  if (wiz) {
    var d = { v: {}, m: {}, privacy: { list: true } };
    var step = 0;
    var STEPS = [['account', 'Account Basics'], ['agegate', 'Age Check'], ['profile', 'Athlete Profile'], ['guardian', 'Parent / Guardian'], ['verifier', 'Verify Metrics'], ['privacy', 'Privacy & Terms'], ['review', 'Review & Submit']];
    var visible = function () { return STEPS.filter(function (s) { return s[0] !== 'guardian' || d.path !== 'adult'; }); };
    var fld = function (id, label, o) {
      o = o || {}; var val = getPath(d, id), t = o.type || 'text', h = o.hint ? '<p class="hint" id="h-' + id + '">' + o.hint + '</p>' : '';
      var ctl;
      if (t === 'select') ctl = '<select id="f-' + id + '" data-k="' + id + '"' + (o.req ? ' required' : '') + '><option value="">' + (o.blank || 'Select one') + '</option>' + o.opts.map(function (x) { return '<option' + (String(val) === String(x) ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>';
      else ctl = '<input id="f-' + id + '" data-k="' + id + '" type="' + t + '"' + (o.req ? ' required' : '') + (o.ac ? ' autocomplete="' + o.ac + '"' : '') + (o.attrs || '') + (t === 'password' ? '' : ' value="' + esc(val) + '"') + ' />';
      return '<div class="field' + (o.full ? ' full' : '') + '"><label for="f-' + id + '">' + label + (o.req ? ' <span class="req" aria-hidden="true">*</span>' : '') + '</label>' + ctl + h + '</div>';
    };
    var chk = function (id, html, req) { return '<div class="field full"><label class="check"><input type="checkbox" id="f-' + id + '" data-k="' + id + '"' + (getPath(d, id) ? ' checked' : '') + (req ? ' required' : '') + ' /> ' + html + (req ? ' <span class="req" aria-hidden="true">*</span>' : '') + '</label></div>'; };
    var gradYears = []; for (var y = new Date().getFullYear() - 1; y <= new Date().getFullYear() + 9; y++) gradYears.push(y);
    var SP = window.TheReadSports;
    var sel = function (id) { return !!(d.sp && d.sp[id] && d.sp[id].on); };
    var selected = function () { return SP.list.filter(function (x) { return sel(x.id); }); };
    var sportsBlock = function () {
      var h = '<fieldset class="full sports-pick"><legend>Sports You Play <span class="req" aria-hidden="true">*</span></legend><p class="hint">Pick every sport you play. All sports count equally. Then choose positions for each one.</p><div class="check-grid">' +
        SP.list.map(function (x) { return '<label class="check"><input type="checkbox" id="f-sp.' + x.id + '.on" data-k="sp.' + x.id + '.on"' + (sel(x.id) ? ' checked' : '') + ' /> ' + esc(x.name) + '</label>'; }).join('') + '</div></fieldset>';
      var cur = selected();
      cur.forEach(function (x) {
        h += '<fieldset class="full"><legend>' + esc(x.name) + ' Positions</legend><div class="form-grid">' +
          fld('sp.' + x.id + '.pos', 'Primary Position', { req: 1, type: 'select', opts: x.positions }) +
          fld('sp.' + x.id + '.sec', 'Secondary Position', { type: 'select', opts: x.positions, blank: 'None' }) + '</div>' +
          (x.scoring ? '' : '<p class="hint">Scoring Not Yet Available for ' + esc(x.name) + '. Recruit Score shows Not Rated and Confidence Unknown until its tables exist (Coming Soon).</p>') + '</fieldset>';
      });
      return h;
    };
    var prim = function () { return selected()[0]; };
    var views = {
      account: function () {
        return '<h2>Account Basics</h2><div class="form-grid">' + fld('name', 'Athlete Full Name', { req: 1, ac: 'name' }) + fld('email', 'Email', { req: 1, type: 'email', ac: 'email' }) +
          fld('dob', 'Date Of Birth', { req: 1, type: 'date', attrs: ' max="' + todayIso() + '"', hint: 'Used only to work out your age. Your age decides the next steps.' }) + '<div class="field"></div>' +
          fld('pw', 'Password', { req: 1, type: 'password', ac: 'new-password', hint: 'At least 10 characters with an uppercase letter, a lowercase letter and a number.' }) + fld('pw2', 'Confirm Password', { req: 1, type: 'password', ac: 'new-password' }) + '</div>' +
          '<p class="coach-note">Demo: your password is checked against these rules and then thrown away. It is never saved or sent.</p>';
      },
      agegate: function () {
        var age = ageOf(d.dob), p = d.path, h = '<h2>Age Check</h2>';
        h += '<p class="age-line">Age computed from your date of birth: <strong>' + (age == null ? 'Unknown' : age) + '</strong></p>';
        if (p === 'adult') h += '<div class="notice navy" role="note"><strong>Adult path (18+).</strong> You can create and manage your own account. No parent/guardian step is needed.</div>';
        else if (p === 'minor') h += '<div class="notice navy" role="note"><strong>Minor path (13&ndash;17).</strong> A parent or guardian must verify your account. Until they do, you cannot be contacted or listed to coaches.</div>';
        else h += '<div class="notice red" role="alert"><strong>Under 13: you cannot create an account on your own.</strong> A parent or guardian must create the account and give consent for you. (Roadmap: this needs a COPPA-style legal review with counsel before launch. This demo does not claim legal compliance.)</div>' + chk('gcreate', 'I am the parent/guardian of this athlete and I am creating this account on their behalf.', 1);
        return h;
      },
      profile: function () {
        var lvl = d.level && d.level !== 'High School', rp = d.rp || {};
        var roleBlock = '';
        if (sel('baseball')) {
          roleBlock = '<fieldset class="full"><legend>College Role Preference <span class="pill gray">Athlete Preference, Not A Rating</span></legend><p class="hint">Tells coaches what you want. It never changes your Recruit Score, Tier or Confidence.</p><div class="form-grid">' +
            fld('rp.twoWay', 'Do you want to be a two-way player in college?', { req: 1, type: 'select', opts: ['Yes', 'No', 'Open To Either', 'Not Sure'] }) +
            (rp.twoWay === 'Yes' ? fld('rp.emphasis', 'Role Emphasis (Optional)', { type: 'select', opts: ['Pitcher + Position Player, equal', 'Pitcher first', 'Position Player first'], blank: 'Not Provided' }) + fld('rp.pos', 'Position-Player Position (Optional)', { type: 'select', opts: PREF_POS, blank: 'Not Provided' }) : '') +
            (rp.twoWay === 'No' ? fld('rp.role', 'Preferred College Role', { req: 1, type: 'select', opts: ['Pitcher', 'Position Player', 'Open To Either'] }) + (rp.role === 'Position Player' ? fld('rp.pos', 'Preferred Position', { req: 1, type: 'select', opts: PREF_POS }) : '') : '') + '</div></fieldset>';
        }
        return '<h2>Athlete Profile</h2>' + sportsBlock() + '<div class="form-grid">' +
          fld('grad', 'Graduation Year', { req: 1, type: 'select', opts: gradYears }) + fld('level', 'Current Playing Level', { req: 1, type: 'select', opts: LEVELS }) +
          fld('school', 'School / Club', { req: 1 }) + fld('state', 'State', { req: 1, ac: 'address-level1' }) +
          (lvl ? fld('elig', 'Years Of Eligibility Left', { type: 'select', opts: [1, 2, 3, 4, 5], blank: 'Not Provided', hint: 'Enter only what you know. It is never guessed.' }) : '<div class="field"><p class="hint">Years of eligibility applies to JUCO and college players. High school players show N/A.</p></div>') + '</div>' +
          roleBlock + '<fieldset class="full"><legend>Profile Photo (Optional)</legend><p class="hint">Upload your own photo only. It is shrunk and kept in this browser (demo).</p><input type="file" id="f-photo" accept="image/*" aria-label="Profile photo" />' +
          '<div id="photo-prev">' + (d.photo ? '<img alt="Your profile photo preview" src="' + esc(d.photo) + '" class="photo-prev" />' : '') + '</div></fieldset>' +
          (!sel('baseball') ? '<p class="hint">Scoring Not Yet Available for your selected sport(s). Measurables and verification are collected for Baseball first; your profile will show Not Rated and Confidence Unknown, never 0.</p>' : '<fieldset class="full"><legend>Measurables <span class="pill">Self-Reported / Unverified Until Verified</span></legend><p class="hint">Optional. Leave blank if unknown. Blank is never treated as 0.</p><div class="form-grid">' +
          METRICS.map(function (m) { return fld('m.' + m[0], m[1], { type: 'number', attrs: ' step="any" min="' + m[2] + '" max="' + m[3] + '"' }); }).join('') + '</div></fieldset>');
      },
      guardian: function () {
        return '<h2>Parent / Guardian Verification</h2><div class="notice navy" role="note"><strong>Demo &ndash; no email is sent.</strong> After you submit, your guardian would get a link and code. In this demo, open the guardian page and use code <strong>' + DEMO_CODE + '</strong>.</div><div class="form-grid">' +
          fld('g.name', 'Guardian Full Name', { req: 1 }) + fld('g.rel', 'Relationship', { req: 1, type: 'select', opts: ['Parent', 'Legal Guardian', 'Other'] }) + fld('g.email', 'Guardian Email', { req: 1, type: 'email' }) + fld('g.phone', 'Guardian Phone', { req: 1, type: 'tel' }) + '</div>' +
          '<ul class="intro-list"><li>The guardian confirms identity and consent, and chooses what programs can see.</li><li>Guardians are shown coach messages to under-18 athletes.</li><li>The guardian can revoke access at any time.</li></ul>' +
          chk('g.aware', 'The guardian knows about this request.', 1);
      },
      verifier: function () {
        return '<h2>Verify Your Metrics</h2><p>Optional. Choose who can confirm your metrics. Until they do, every metric stays <strong>Unverified</strong>.</p><div class="ver-list">' +
          VERIFIERS.map(function (v) { return '<fieldset class="ver-row"><legend>' + v[1] + '</legend>' + chk('v.' + v[0] + '.on', 'Send a verification request') + '<div class="form-grid">' + fld('v.' + v[0] + '.name', 'Name / Organization') + fld('v.' + v[0] + '.email', 'Email', { type: 'email' }) + '</div></fieldset>'; }).join('') + '</div>' +
          '<p class="coach-note">Demo: no request is actually sent. You can simulate a verifier&rsquo;s confirmation on your status page afterward.</p>';
      },
      privacy: function () {
        var minor = d.path !== 'adult';
        return '<h2>Privacy &amp; Visibility</h2>' + (minor ? '<div class="notice navy" role="note">For athletes under 18, your guardian&rsquo;s choices also apply. Only what both of you allow is shared.</div>' : '') +
          '<div class="form-grid">' + chk('privacy.list', 'List my profile to college coaches' + (minor ? ' (only after my guardian verifies)' : '')) + chk('privacy.contact', 'Share my contact info') + chk('privacy.photo', 'Share my photo') + chk('privacy.metrics', 'Share my measurables') + '</div>' +
          chk('terms', 'I accept the <a href="terms.html">Terms</a> and <a href="privacy.html">Privacy Policy</a>.', 1);
      },
      review: function () {
        var rows = [['Name', d.name], ['Email', d.email], ['Age Path', d.path === 'adult' ? 'Adult (18+)' : d.path === 'minor' ? 'Minor (13-17), guardian required' : 'Under 13, guardian-created'], ['Sports / Positions', selected().map(function (x) { return x.name + ' / ' + d.sp[x.id].pos + (d.sp[x.id].sec ? ' / ' + d.sp[x.id].sec : ''); }).join('; ')],
          ['College Role Preference', !sel('baseball') ? 'Not applicable' : rolePrefTxt(d.rp)],
          ['Level / Class', d.level + ' ' + d.grad], ['School / State', d.school + ', ' + d.state], ['Eligibility Left', d.level === 'High School' ? 'N/A' : d.elig || 'Not Provided'],
          ['Metrics', METRICS.filter(function (m) { return d.m[m[0]] !== '' && d.m[m[0]] != null; }).map(function (m) { return m[1] + ': ' + d.m[m[0]]; }).join('; ') || 'None entered (Unverified)'],
          ['Guardian', d.path === 'adult' ? 'Not needed' : d.g.name + ' (' + d.g.rel + ')'],
          ['Verification Requests', VERIFIERS.filter(function (v) { return d.v[v[0]] && d.v[v[0]].on; }).map(function (v) { return v[1]; }).join(', ') || 'None'],
          ['Sharing', ['list', 'contact', 'photo', 'metrics'].filter(function (k) { return d.privacy[k]; }).join(', ') || 'Nothing']];
        return '<h2>Review &amp; Submit</h2><dl class="review-list">' + rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('') + '</dl><p class="coach-note">Demo: submitting saves this in your browser only. Nothing is emailed.</p>';
      }
    };
    var rolePrefTxt = function (r) { r = r || {}; return !r.twoWay ? 'Not Provided' : r.twoWay === 'Yes' ? 'Two-Way' + (r.emphasis ? ' (' + r.emphasis + ')' : '') : r.twoWay === 'No' ? (r.role || 'Not Provided') + (r.role === 'Position Player' && r.pos ? ' (' + r.pos + ')' : '') : r.twoWay; };
    var errs = [];
    var bad = function (id, msg) { errs.push([id, msg]); };
    var checks = {
      account: function () {
        if (!d.name || d.name.trim().length < 2) bad('name', 'Enter the athlete\u2019s full name.');
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email || '')) bad('email', 'Enter a valid email address.');
        if (ageOf(d.dob) == null || ageOf(d.dob) > 100) bad('dob', 'Enter a valid date of birth that is not in the future.');
        var p = d.pw || '';
        if (p.length < 10 || !/[A-Z]/.test(p) || !/[a-z]/.test(p) || !/\d/.test(p)) bad('pw', 'Use 10+ characters with an uppercase letter, a lowercase letter and a number.');
        else if (p !== d.pw2) bad('pw2', 'Passwords do not match.');
      },
      agegate: function () { if (d.path === 'under13' && !d.gcreate) bad('gcreate', 'A parent/guardian must create this account. Confirm to continue.'); },
      profile: function () {
        var cs = selected();
        if (!cs.length) bad('sp.' + SP.list[0].id + '.on', 'Choose at least one sport.');
        cs.forEach(function (x) { if (!d.sp[x.id].pos) bad('sp.' + x.id + '.pos', 'Choose a primary ' + x.name + ' position.'); else if (d.sp[x.id].sec && d.sp[x.id].sec === d.sp[x.id].pos) bad('sp.' + x.id + '.sec', 'Secondary position must differ from primary.'); });
        if (!d.grad) bad('grad', 'Choose a graduation year.');
        if (sel('baseball')) {
          var rp = d.rp || {};
          if (!rp.twoWay) bad('rp.twoWay', 'Tell us if you want to be a two-way player in college.');
          else if (rp.twoWay === 'No') { if (!rp.role) bad('rp.role', 'Choose the college role you prefer.'); else if (rp.role === 'Position Player' && !rp.pos) bad('rp.pos', 'Choose the position you prefer.'); }
        }
        if (!d.level) bad('level', 'Choose a playing level.'); if (!d.school || !d.school.trim()) bad('school', 'Enter a school or club.'); if (!d.state || !d.state.trim()) bad('state', 'Enter a state.');
        METRICS.forEach(function (m) { var v = d.m[m[0]]; if (v !== '' && v != null && (isNaN(Number(v)) || Number(v) < m[2] || Number(v) > m[3])) bad('m.' + m[0], m[1] + ' must be between ' + m[2] + ' and ' + m[3] + ', or blank.'); });
      },
      guardian: function () {
        var g = d.g || {};
        if (!g.name || !g.name.trim()) bad('g.name', 'Enter the guardian\u2019s name.'); if (!g.rel) bad('g.rel', 'Choose a relationship.');
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(g.email || '')) bad('g.email', 'Enter a valid guardian email.');
        if (String(g.phone || '').replace(/\D/g, '').length < 10) bad('g.phone', 'Enter a phone number with at least 10 digits.');
        if (!g.aware) bad('g.aware', 'Confirm the guardian knows about this request.');
      },
      verifier: function () { VERIFIERS.forEach(function (v) { var x = d.v[v[0]]; if (x && x.on && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x.email || '')) bad('v.' + v[0] + '.email', 'Enter the verifier\u2019s email to send a request.'); }); },
      privacy: function () { if (!d.terms) bad('terms', 'Accept the Terms and Privacy Policy to continue.'); }
    };
    var collect = function () {
      wiz.querySelectorAll('[data-k]').forEach(function (el) { setPath(d, el.getAttribute('data-k'), el.type === 'checkbox' ? el.checked : el.value); });
      var age = ageOf(d.dob); d.path = pathOf(age); d.age = age;
      if (d.path === 'adult') { d.gcreate = false; }
    };
    var showErrs = function () {
      wiz.querySelectorAll('.field-error').forEach(function (e) { e.remove(); }); wiz.querySelectorAll('[aria-invalid]').forEach(function (e) { e.removeAttribute('aria-invalid'); });
      errs.forEach(function (e) {
        var el = document.getElementById('f-' + e[0]); if (!el) return;
        el.setAttribute('aria-invalid', 'true'); var p = document.createElement('p'); p.className = 'field-error'; p.id = 'err-' + e[0]; p.textContent = e[1];
        el.setAttribute('aria-describedby', p.id); (el.closest('.field') || el.parentNode).appendChild(p);
      });
      if (errs.length) { var f = document.getElementById('f-' + errs[0][0]); if (f) f.focus(); }
    };
    var render = function () {
      var vs = visible(), key = STEPS[step][0], idx = vs.map(function (s) { return s[0]; }).indexOf(key);
      var prog = '<ol class="wiz-progress" aria-label="Progress">' + vs.map(function (s, i) { return '<li' + (i === idx ? ' aria-current="step" class="on"' : i < idx ? ' class="done"' : '') + '><span>' + (i + 1) + '</span> ' + s[1] + '</li>'; }).join('') + '</ol>';
      var last = idx === vs.length - 1, blocked = key === 'agegate' && d.path === 'under13' && false;
      wiz.innerHTML = prog + '<form class="form-card" id="wiz-form" novalidate><p class="hint">Step ' + (idx + 1) + ' of ' + vs.length + '. Fields marked <span class="req">*</span> are required. <strong>Demo only.</strong></p>' + views[key]() +
        '<div class="form-actions">' + (idx > 0 ? '<button class="button button-secondary" type="button" id="wiz-back">Back</button> ' : '') + '<button class="button button-primary" type="submit"' + (blocked ? ' disabled' : '') + '>' + (last ? 'Submit (Demo)' : 'Next') + '</button></div><div class="form-status" role="status" aria-live="polite"></div></form>';
      var form = document.getElementById('wiz-form'), photo = document.getElementById('f-photo');
      form.addEventListener('submit', function (e) {
        e.preventDefault(); collect(); errs = [];
        if (checks[key]) checks[key]();
        showErrs(); if (errs.length) return;
        if (last) return submit();
        var nx = vs[idx + 1][0]; step = STEPS.map(function (s) { return s[0]; }).indexOf(nx); render(); window.scrollTo(0, wiz.offsetTop - 20);
      });
      var back = document.getElementById('wiz-back');
      if (back) back.addEventListener('click', function () { collect(); var pv = vs[idx - 1][0]; step = STEPS.map(function (s) { return s[0]; }).indexOf(pv); render(); });
      if (key === 'profile') {
        ['level', 'rp.twoWay', 'rp.role'].concat(SP.list.map(function (x) { return 'sp.' + x.id + '.on'; })).forEach(function (k) { var e = form.querySelector('[data-k="' + k + '"]'); if (e) e.addEventListener('change', function () { collect(); render(); }); });
        photo.addEventListener('change', function () {
          var f = photo.files[0]; if (!f) return;
          if (!/^image\//.test(f.type)) { alert('Please choose an image file.'); return; }
          var rd = new FileReader();
          rd.onload = function () {
            var im = new Image();
            im.onload = function () { var s = Math.min(1, 160 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); d.photo = c.toDataURL('image/jpeg', 0.7); document.getElementById('photo-prev').innerHTML = '<img alt="Your profile photo preview" src="' + d.photo + '" class="photo-prev" />'; };
            im.src = rd.result;
          };
          rd.readAsDataURL(f);
        });
      }
    };
    var submit = function () {
      var g = d.path === 'adult' ? null : { name: d.g.name, rel: d.g.rel, email: d.g.email, phone: d.g.phone, status: 'Pending', sent: Date.now(), share: { contact: false, photo: false, metrics: false }, msgVisible: true, dataConsent: false, log: [{ t: new Date().toISOString(), a: 'Verification code issued (demo, nothing sent)' }] };
      var rec = {
        id: 'ath-' + Date.now().toString(36), created: new Date().toISOString(), submitted: true, name: d.name.trim(), email: d.email, dob: d.dob, age: d.age, path: d.path,
        sport: prim().name, pos: d.sp[prim().id].pos, sec: d.sp[prim().id].sec || '', sports: selected().map(function (x) { return { id: x.id, name: x.name, pos: d.sp[x.id].pos, sec: d.sp[x.id].sec || '' }; }), grad: Number(d.grad), level: d.level, school: d.school.trim(), state: d.state.trim(), elig: d.level === 'High School' || !d.elig ? null : Number(d.elig), photo: d.photo || '',
        rolePref: sel('baseball') && d.rp && d.rp.twoWay ? { twoWay: d.rp.twoWay, emphasis: d.rp.twoWay === 'Yes' ? d.rp.emphasis || '' : '', role: d.rp.twoWay === 'No' ? d.rp.role || '' : '', pos: (d.rp.twoWay === 'Yes' || (d.rp.twoWay === 'No' && d.rp.role === 'Position Player')) ? d.rp.pos || '' : '' } : null,
        metrics: {}, guardian: g, verifiers: [], verified: {}, privacy: { list: !!d.privacy.list, contact: !!d.privacy.contact, photo: !!d.privacy.photo, metrics: !!d.privacy.metrics }, terms: true
      };
      METRICS.forEach(function (m) { var v = d.m[m[0]]; if (v !== '' && v != null) rec.metrics[m[0]] = Number(v); });
      VERIFIERS.forEach(function (v) { var x = d.v[v[0]]; if (x && x.on) rec.verifiers.push({ type: v[1], name: x.name || '', email: x.email, status: 'Requested', date: todayIso() }); });
      upsert(rec); renderStatus(rec, true);
    };

    // status panel / "athlete dashboard"
    var renderStatus = function (r, fresh) {
      var gs = gStatus(r), lst = listed(r);
      var h = '<div class="form-card status-card"><h2>' + (fresh ? 'Submitted (Demo)' : 'Your Athlete Status') + '</h2>' + (fresh ? '<div class="notice navy" role="status"><strong>Demo &ndash; nothing was sent.</strong> Your profile is saved in this browser only. No email or text message went out, and no identity was verified.</div>' : '') +
        '<dl class="review-list"><dt>Athlete</dt><dd>' + esc(r.name) + ' &middot; ' + esc(r.path === 'adult' ? 'Adult (18+)' : r.path === 'minor' ? 'Minor (13-17)' : 'Under 13, guardian-created') + '</dd>' +
        '<dt>Guardian Verification</dt><dd>' + (gs ? badge(gs) + (gs === 'Pending' ? ' Waiting for ' + esc(r.guardian.name) + '. Demo code: ' + DEMO_CODE : gs === 'Declined' ? ' The guardian declined or revoked access.' : gs === 'Expired' ? ' The code expired. Use the guardian page to resend (demo).' : ' Verified.') : 'Not needed (adult)') + '</dd>' +
        '<dt>Listed To Coaches</dt><dd>' + (lst ? 'Yes &ndash; in the Master Database as <strong>Athlete-Created</strong>' + (r.path !== 'adult' ? ' and <strong>Guardian-Verified</strong>' : '') + '. Recruit Score and Tier show Not Rated until enough data exists.' : 'No' + (r.path !== 'adult' && gs !== 'Verified' ? ' &ndash; minors cannot be contacted or listed until a guardian verifies.' : r.privacy.list ? '.' : ' &ndash; you chose not to be listed.')) + '</dd></dl>' +
        '<p><a class="button button-primary" href="athlete-profile.html">Open My Athlete Profile</a> ' + (r.guardian ? '<a class="button button-secondary" href="guardian-verify.html">Open Guardian Page (Demo)</a>' : '') + '</p>' +
        '<h3>Metric Verification</h3>' + (Object.keys(r.metrics).length ? '<div class="table-wrap"><table><thead><tr><th scope="col">Metric</th><th scope="col">Value</th><th scope="col">Status</th></tr></thead><tbody>' + METRICS.filter(function (m) { return r.metrics[m[0]] != null; }).map(function (m) { var v = (r.verified || {})[m[0]]; return '<tr><th scope="row">' + m[1] + '</th><td>' + r.metrics[m[0]] + '</td><td>' + (v ? 'Verified by ' + esc(v.by) + ' (' + esc(v.role) + ', ' + esc(v.date) + ', demo)' : 'Unverified (Self-Reported)') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p>No metrics entered.</p>') +
        (r.verifiers.length ? '<ul class="intro-list">' + r.verifiers.map(function (v, i) { return '<li><strong>' + esc(v.type) + '</strong> ' + esc(v.name) + ': ' + badge(v.status) + (v.status === 'Requested' ? ' <button type="button" class="button button-secondary sim-ver" data-i="' + i + '">Demo: Simulate Verifier Confirmation</button>' : '') + '</li>'; }).join('') + '</ul>' : '<p class="hint">No verifier requested. All metrics stay Unverified.</p>') +
        '<p><button type="button" class="button button-secondary" id="st-new">Start A New Signup</button> <button type="button" class="button button-secondary" id="st-clear">Delete Demo Data</button></p></div>';
      wiz.innerHTML = h;
      wiz.querySelectorAll('.sim-ver').forEach(function (b) { b.addEventListener('click', function () {
        var v = r.verifiers[Number(b.getAttribute('data-i'))]; v.status = 'Confirmed (Demo)';
        Object.keys(r.metrics).forEach(function (k) { r.verified[k] = { by: v.name || v.type, role: v.type, date: todayIso() }; });
        upsert(r); renderStatus(r, false);
      }); });
      document.getElementById('st-new').addEventListener('click', function () { d = { v: {}, m: {}, privacy: { list: true } }; step = 0; render(); });
      document.getElementById('st-clear').addEventListener('click', function () { var a = load().filter(function (x) { return x.id !== r.id; }); save(a); localStorage.removeItem(CUR); d = { v: {}, m: {}, privacy: { list: true } }; step = 0; render(); });
      wiz.querySelector('h2').setAttribute('tabindex', '-1'); wiz.querySelector('h2').focus();
    };
    var cur = current();
    if (cur) renderStatus(cur, false); else render();
  }

  // ---------------------------------------------------------------- guardian demo page
  var gv = document.getElementById('guardian-app');
  if (gv) {
    var shareDefs = [['contact', 'Athlete contact info'], ['photo', 'Athlete photo'], ['metrics', 'Athlete measurables']];
    var draw = function () {
      var r = current();
      if (!r || !r.guardian) { gv.innerHTML = '<div class="notice red" role="status"><strong>No guardian request found in this browser.</strong> Create an athlete account under 18 on the <a href="player-signup.html">athlete signup page</a> first. (This is a demo; requests live only in this browser.)</div>'; return; }
      var g = r.guardian, s = gStatus(r);
      var h = '<div class="notice navy" role="note"><strong>Demo &ndash; no email was sent.</strong> This page shows what a guardian would see after following a verification link. Use code <strong>' + DEMO_CODE + '</strong>. No real identity check happens.</div>' +
        '<div class="form-card"><h2>Guardian Request For ' + esc(r.name) + '</h2><p>Hello ' + esc(g.name) + ' (' + esc(g.rel) + '). ' + esc(r.name) + ' (age ' + esc(r.age) + ') asked to join <span class="tr">THE READ</span> Athletics. Status: ' + badge(s) + '</p>';
      if (s === 'Pending' && !g.codeOk) {
        h += '<form id="g-code" novalidate><div class="field"><label for="gcode">Verification Code <span class="req" aria-hidden="true">*</span></label><input id="gcode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" /></div><div class="form-actions"><button class="button button-primary" type="submit">Verify Code</button></div></form><p class="coach-note">Demo: <button class="button button-secondary" type="button" id="g-exp">Simulate Expired Code</button></p>';
      } else if (s === 'Expired') {
        h += '<p>This code expired after 7 days (demo rule).</p><button class="button button-primary" type="button" id="g-resend">Send A New Code (Demo)</button>';
      } else {
        var verified = s === 'Verified', stage = g.codeOk || verified;
        h += '<form id="g-consent" novalidate><fieldset><legend>What Programs Can See</legend>' + shareDefs.map(function (x) { return '<label class="check"><input type="checkbox" data-s="' + x[0] + '"' + (g.share[x[0]] ? ' checked' : '') + ' /> ' + x[1] + '</label>'; }).join('') + '</fieldset>' +
          '<fieldset><legend>Messaging Rules</legend><label class="check"><input type="checkbox" checked disabled /> Guardian is shown all coach messages to this athlete (required for under 18)</label></fieldset>' +
          '<label class="check"><input type="checkbox" id="g-data"' + (g.dataConsent ? ' checked' : '') + ' /> I consent to my athlete\u2019s data being shared as chosen above. I confirm I am this athlete\u2019s parent or legal guardian.</label><p class="field-error" id="g-err" hidden></p>' +
          '<div class="form-actions"><button class="button button-primary" type="submit" data-act="ok">' + (verified ? 'Save Choices' : 'Approve') + '</button> ' + (verified ? '' : '<button class="button button-secondary" type="submit" data-act="no">Decline</button>') + '</div></form>' +
          (verified ? '<p><button class="button button-secondary" type="button" id="g-revoke">Revoke Access</button></p>' : s === 'Declined' ? '<p>Declined or revoked. The athlete is not listed and cannot be contacted. <button class="button button-secondary" type="button" id="g-resend">Reopen Request (Demo)</button></p>' : '');
      }
      h += '</div>';
      if (g.log && g.log.length) h += '<h3>Consent Log (Demo)</h3><ul class="intro-list">' + g.log.slice().reverse().map(function (x) { return '<li>' + esc(x.t.replace('T', ' ').slice(0, 16)) + ' &ndash; ' + esc(x.a) + '</li>'; }).join('') + '</ul>';
      gv.innerHTML = h;
      var log = function (a) { g.log.push({ t: new Date().toISOString(), a: a }); upsert(r); draw(); };
      var el;
      if ((el = document.getElementById('g-code'))) el.addEventListener('submit', function (e) { e.preventDefault(); var v = document.getElementById('gcode').value.trim(); var f = document.getElementById('gcode'); gv.querySelectorAll('.field-error').forEach(function (x) { x.remove(); });
        if (v !== DEMO_CODE) { f.setAttribute('aria-invalid', 'true'); var p = document.createElement('p'); p.className = 'field-error'; p.textContent = 'That code is not right. In this demo use ' + DEMO_CODE + '.'; f.parentNode.appendChild(p); f.focus(); return; }
        g.codeOk = true; upsert(r); draw(); });
      if ((el = document.getElementById('g-exp'))) el.addEventListener('click', function () { g.sent = Date.now() - 8 * DAY; log('Code expired (demo simulation)'); });
      if ((el = document.getElementById('g-resend'))) el.addEventListener('click', function () { g.status = 'Pending'; g.codeOk = false; g.sent = Date.now(); log('New code issued (demo, nothing sent)'); });
      if ((el = document.getElementById('g-revoke'))) el.addEventListener('click', function () { g.status = 'Declined'; g.share = { contact: false, photo: false, metrics: false }; g.dataConsent = false; log('Guardian revoked access; athlete unlisted'); });
      if ((el = document.getElementById('g-consent'))) el.addEventListener('submit', function (e) {
        e.preventDefault(); var act = (e.submitter && e.submitter.getAttribute('data-act')) || 'ok';
        gv.querySelectorAll('[data-s]').forEach(function (c) { g.share[c.getAttribute('data-s')] = c.checked; });
        if (act === 'no') { g.status = 'Declined'; g.dataConsent = false; return log('Guardian declined'); }
        if (!document.getElementById('g-data').checked) { var er = document.getElementById('g-err'); er.hidden = false; er.textContent = 'Confirm consent to approve.'; document.getElementById('g-data').focus(); return; }
        g.dataConsent = true; var was = g.status; g.status = 'Verified'; log(was === 'Verified' ? 'Guardian updated sharing choices' : 'Guardian verified and consented (demo, identity not actually checked)');
      });
    };
    draw();
  }
})();
