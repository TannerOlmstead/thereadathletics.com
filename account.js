/* THE READ Athletics - demo sign-in session, route guard, header account menu, and the account pages.
   Static site, no backend: this is a localStorage DEMO session only. No real authentication happens, no email is sent,
   and passwords are checked for the rules shown and then thrown away (never saved). Real auth needs a backend: see ROADMAP.md. */
(function () {
  'use strict';
  var SKEY = 'theReadSession', VKEY = 'theReadVerifiers', NKEY = 'theReadNotifPrefs', AKEY = 'theReadDemoAthletes', CUR = 'theReadDemoAthleteCurrent', DEMO_CODE = '000000';
  var ROLES = [
    ['athlete', 'Athlete', 'athlete-profile.html'], ['vdp', 'Verified Data Provider (Verifier)', 'verifier-dashboard.html'],
    ['coach', 'College Coach', 'coach-dashboard.html'], ['ad', 'Athletic Department', 'department-overview.html']
  ];
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var rd = function (k, def) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? def : v; } catch (e) { return def; } };
  var wr = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  var roleOf = function (id) { return ROLES.filter(function (r) { return r[0] === id; })[0] || null; };
  var session = function () { var s = rd(SKEY, null); if (s && (s.role === 'hs' || s.role === 'pi')) s.role = 'vdp'; return s && s.role && roleOf(s.role) ? s : null; };
  var bypass = function () { try { return sessionStorage.getItem('theReadDemoBypass') === '1'; } catch (e) { return false; } };
  var setBypass = function () { try { sessionStorage.setItem('theReadDemoBypass', '1'); } catch (e) { /* ignore */ } };
  var signOut = function () { try { localStorage.removeItem(SKEY); sessionStorage.removeItem('theReadDemoBypass'); } catch (e) { /* ignore */ } };
  var homeOf = function (s) { var r = s && roleOf(s.role); return r ? r[2] : 'sign-in.html'; };
  var emailOk = function (v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v || ''); };
  var pwOk = function (p) { return (p || '').length >= 10 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p); };
  var PW_RULE = 'At least 10 characters with an uppercase letter, a lowercase letter and a number.';
  var safeNext = function (n) { return /^[a-z0-9-]+\.html(#[a-z0-9-]*)?$/i.test(n || '') ? n : ''; };
  var qp = function (k) { var m = new RegExp('[?&]' + k + '=([^&#]*)').exec(location.search); return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : ''; };
  var go = function (u) { if (window.__noNav) window.__navTo = u; else location.href = u; };
  window.TheReadAccount = { session: session, roles: ROLES, roleOf: roleOf, signOut: signOut, homeOf: homeOf, bypass: bypass, emailOk: emailOk, pwOk: pwOk, DEMO_CODE: DEMO_CODE };

  // ------------------------------------------------------------ route guard (demo)
  if (/[?&]demo=1\b/.test(location.search)) setBypass();
  var cfg = window.SITE_CONFIG || {}, b = document.body, cp = b ? b.getAttribute('data-coach-page') : '', need = b ? b.getAttribute('data-guard') || (cp === 'athprofile' || cp === 'athcal' ? 'athlete' : cp || b.getAttribute('data-dept-page') ? 'staff' : '') : '';
  if (need && cfg.REQUIRE_SIGN_IN !== false && !bypass()) {
    var s0 = session(), okRoles = { athlete: ['athlete'], verifier: ['vdp'], staff: ['coach', 'ad'], any: null }[need];
    if (!s0 || (okRoles && okRoles.indexOf(s0.role) < 0)) {
      document.documentElement.style.visibility = 'hidden';
      location.replace('sign-in.html?next=' + encodeURIComponent(location.pathname.split('/').pop() || '') + (s0 ? '&wrong=' + need : ''));
      return;
    }
  }

  // ------------------------------------------------------------ header account menu
  document.addEventListener('DOMContentLoaded', function () {
    var s = session(), act = document.querySelector('.nav-actions');
    if (s && act) {
      var ini = (s.name || '?').split(/\s+/).map(function (x) { return x.charAt(0); }).join('').slice(0, 2).toUpperCase();
      act.innerHTML = '<details class="acct-menu"><summary aria-label="Account menu for ' + esc(s.name) + '"><span class="acct-ava" aria-hidden="true">' + esc(ini) + '</span><span class="acct-name">' + esc(s.name) + '</span></summary><div class="acct-pop"><p><strong>' + esc(s.name) + '</strong><br>' + esc(roleOf(s.role)[1]) + (s.org ? ' &middot; ' + esc(s.org) : '') + '</p><a href="' + homeOf(s) + '">My Workspace</a><a href="connect.html">Connect</a><a href="account-settings.html">Account Settings</a><button type="button" data-signout>Sign Out</button></div></details>';
      var nar = document.querySelectorAll('.narrow-only');
      if (nar.length) {
        nar[0].outerHTML = '<a class="narrow-only" href="' + homeOf(s) + '">My Workspace</a><a class="narrow-only" href="account-settings.html">Account Settings</a>';
        var n2 = document.querySelector('.narrow-only[href="index.html#paths"]');
        if (n2) n2.outerHTML = '<a class="narrow-only" href="#" data-signout>Sign Out</a>';
      }
      Array.prototype.forEach.call(document.querySelectorAll('[data-signout]'), function (el) { el.addEventListener('click', function (e) { e.preventDefault(); signOut(); go('index.html'); }); });
    }
    pages();
    nextStep();
  });

  // ------------------------------------------------------------ "Next Step" prompt on each role home (workflow standard)
  var nextStep = function () {
    var b = document.body, cp = b && b.getAttribute('data-coach-page'), dp = b && b.getAttribute('data-dept-page'), A = window.TheReadAthlete, anchor = document.querySelector('.prof-tabs, .coach-subnav, .dept-subnav');
    var has = function (k) { try { var v = localStorage.getItem(k); return !!v && v !== '[]' && v !== '{}' && v !== 'null'; } catch (e) { return false; } };
    var steps = null, title = '';
    if (cp === 'athprofile' && A) {
      var r = A.current && A.current();
      if (!r) return;
      var ints = ((A.interests && A.interests()) || []).filter(function (i) { return i.aid === r.id; });
      steps = [['Add Your Metrics', Object.keys(r.metrics || {}).length > 0, 'athlete-profile.html#metrics'], ['Request Verification', (r.verifiers || []).length > 0, 'athlete-profile.html#metrics'], ['Add Schools To Interests', ints.length > 0, 'athlete-profile.html#interests']];
      title = 'Your Next Step';
    } else if (cp === 'dashboard') {
      steps = [['Add A Prospect', has('theReadDemoMasterDb') || has('theReadDemoAthletes'), 'coach-master-database.html'], ['Put Them On The Board', has('theReadDemoBoard'), 'coach-recruiting-board.html'], ['Grade Them', has('theReadDemoCoachGrades'), 'coach-grading.html'], ['Schedule A Visit', has('theReadDemoCalendar'), 'coach-calendar.html']];
      title = 'Recruiting Flow';
    } else if ((cp === 'department' || dp === 'sports') && !/[?&]dsport=/.test(location.search)) {
      steps = [['Pick A Sport', false, 'department-sports.html'], ['Review Its Overview', false, 'department-overview.html']];
      title = 'Department Flow';
    }
    if (!steps || !anchor || document.querySelector('.next-step')) return;
    var nx = steps.filter(function (x) { return !x[1]; })[0];
    var d = document.createElement('div'); d.className = 'next-step'; d.setAttribute('role', 'region'); d.setAttribute('aria-label', title);
    d.innerHTML = '<strong>' + title + ':</strong> ' + (nx ? '<a href="' + nx[2] + '">' + esc(nx[0]) + '</a>' : 'All set. Keep your data current.') + ' <small>(' + steps.map(function (x) { return (x[1] ? '&#10003; ' : '&#9675; ') + esc(x[0]); }).join(' &rarr; ') + ')</small>';
    anchor.parentNode.insertBefore(d, anchor.nextSibling);
  };

  // ------------------------------------------------------------ account pages
  var field = function (id, label, o) {
    o = o || {};
    var ctl = o.opts ? '<select id="' + id + '"' + (o.req ? ' required' : '') + '><option value="">Select one</option>' + o.opts.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (o.val === x[0] ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join('') + '</select>' :
      '<input id="' + id + '" type="' + (o.type || 'text') + '"' + (o.req ? ' required' : '') + (o.ac ? ' autocomplete="' + o.ac + '"' : '') + (o.type === 'password' ? '' : ' value="' + esc(o.val || '') + '"') + ' />';
    return '<div class="field' + (o.hide ? '" hidden data-opt="1' : '') + '"><label for="' + id + '">' + label + (o.req ? ' <span class="req" aria-hidden="true">*</span>' : '') + '</label>' + ctl + (o.hint ? '<p class="hint">' + o.hint + '</p>' : '') + '</div>';
  };
  var errBox = '<p class="field-error" id="acct-err" role="alert" hidden></p>';
  var showErr = function (root, msg, id) {
    var e = root.querySelector('#acct-err'); e.hidden = !msg; e.innerHTML = msg || '';
    Array.prototype.forEach.call(root.querySelectorAll('[aria-invalid]'), function (x) { x.removeAttribute('aria-invalid'); });
    if (msg && id) { var f = root.querySelector('#' + id); if (f) { f.setAttribute('aria-invalid', 'true'); f.focus(); } } else if (msg) e.focus();
  };
  var athletes = function () { return rd(AKEY, []); };
  var verifiers = function () { return rd(VKEY, []); };

  var roleParam = function () { var r = qp('role'); r = r === 'verifier' ? 'vdp' : r; return roleOf(r) ? r : ''; };
  var signInPage = function (root) {
    var s = session(), wrong = qp('wrong'), next = safeNext(qp('next'));
    var notice = wrong ? '<div class="notice red" role="alert"><strong>This area needs a different role.</strong> ' + (s ? 'You are signed in as ' + esc(roleOf(s.role)[1]) + '. ' : '') + 'Sign in with the matching role to continue.</div>' : next ? '<div class="notice navy" role="note">Sign in to open that page.</div>' : '';
    root.innerHTML = notice + '<form class="form-card" id="si-form" novalidate><h2>Sign In</h2><div class="notice navy" role="note"><strong>Demo sign-in &ndash; no real authentication.</strong> This site has no server yet. Your password is not checked, saved or sent. Signing in only sets a demo session in this browser so each role lands in the right workspace. Real accounts need a backend (see ROADMAP).</div><div class="form-grid">' +
      field('si-role', 'I Am Signing In As', { req: 1, opts: ROLES.map(function (r) { return [r[0], r[1]]; }), val: roleParam() || (s ? s.role : '') }) + field('si-email', 'Email', { req: 1, type: 'email', ac: 'email', val: s ? s.email : '' }) +
      field('si-pw', 'Password', { req: 1, type: 'password', ac: 'current-password', hint: 'Demo: any password works and it is discarded.' }) +
      field('si-name', 'Your Name', { hide: 1, ac: 'name', val: s ? s.name : '' }) + field('si-org', 'School Or Organization', { hide: 1, ac: 'organization', val: s ? s.org : '' }) +
      field('si-staff', 'Staff Role', { hide: 1, opts: [['Head Coach', 'Head Coach'], ['Assistant Coach', 'Assistant Coach']] }) + '</div>' + errBox +
      '<div class="form-actions"><button class="button button-primary" type="submit">Sign In</button> <a class="button button-secondary" href="forgot-password.html">Forgot Password</a></div>' +
      '<p class="hint">New here? <a href="player-signup.html">Athlete Signup</a> &middot; <a href="verifier-signup.html">Verifier Signup</a> &middot; <a href="individual-signup.html">Coach Signup</a> &middot; <a href="institution-signup.html">Athletic Department Signup</a></p></form>' +
      '<section class="form-card"><h2>Owner Preview Mode</h2><p>The owner can open every workspace without an account. This is a preview switch for this browser tab only and is not a login.</p><button type="button" class="button button-secondary" id="si-demo">Continue In Preview Mode</button></section>';
    var role = root.querySelector('#si-role'), sync = function () {
      var v = role.value, show = { 'si-name': v === 'coach' || v === 'ad', 'si-org': v === 'coach' || v === 'ad', 'si-staff': v === 'coach' };
      Object.keys(show).forEach(function (k) { root.querySelector('#' + k).closest('.field').hidden = !show[k]; });
    };
    role.addEventListener('change', sync); sync();
    root.querySelector('#si-demo').addEventListener('click', function () { setBypass(); go(next || (s ? homeOf(s) : 'coach-dashboard.html')); });
    root.querySelector('#si-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (id) { return root.querySelector('#' + id).value.trim(); }, r = v('si-role'), em = v('si-email').toLowerCase(), rec = { role: r, email: em, name: '', org: '' };
      if (!r) return showErr(root, 'Choose the role you are signing in as.', 'si-role');
      if (!emailOk(em)) return showErr(root, 'Enter a valid email address.', 'si-email');
      if (!root.querySelector('#si-pw').value) return showErr(root, 'Enter a password (demo: any value).', 'si-pw');
      if (r === 'athlete') {
        var a = athletes().filter(function (x) { return String(x.email || '').toLowerCase() === em; })[0];
        if (!a) return showErr(root, 'No athlete profile uses that email in this browser. <a href="player-signup.html">Create an athlete profile</a> first.', 'si-email');
        rec.name = a.name; rec.aid = a.id; try { localStorage.setItem(CUR, a.id); } catch (x) { /* ignore */ }
      } else if (r === 'vdp') {
        var vr = verifiers().filter(function (x) { return String(x.email || '').toLowerCase() === em; })[0];
        if (!vr) return showErr(root, 'No Verified Data Provider signup uses that email in this browser. <a href="verifier-signup.html">Create a verifier profile</a> first.', 'si-email');
        rec.name = vr.name; rec.org = vr.org; rec.vid = vr.id;
      } else {
        rec.name = v('si-name'); rec.org = v('si-org');
        if (rec.name.length < 2) return showErr(root, 'Enter your name.', 'si-name');
        if (!rec.org) return showErr(root, 'Enter your school or organization.', 'si-org');
        if (r === 'coach') { rec.staffRole = v('si-staff'); if (!rec.staffRole) return showErr(root, 'Choose your staff role.', 'si-staff'); }
        if (r === 'ad') {
          var dd = rd('theReadDeptData', {}); dd.school = dd.school || {};
          if (!dd.school.name) { dd.school.name = rec.org; wr('theReadDeptData', dd); }
        }
      }
      rec.ts = new Date().toISOString(); wr(SKEY, rec);
      var okNext = next && { athlete: /^athlete-/, vdp: /^verifier-/, coach: /^(coach|department)-/, ad: /^(coach|department)-/ }[r];
      go(okNext && okNext.test(next) ? next : homeOf(rec));
    });
  };

  var forgotPage = function (root) {
    root.innerHTML = '<form class="form-card" id="fp-form" novalidate><h2>Forgot Your Password?</h2><div class="notice navy" role="note"><strong>Demo &ndash; no email is sent.</strong> A real site would email a reset link. Here, the next page asks for the demo code <strong>' + DEMO_CODE + '</strong>.</div>' +
      '<div class="form-grid">' + field('fp-email', 'Email', { req: 1, type: 'email', ac: 'email' }) + '</div>' + errBox + '<div class="form-actions"><button class="button button-primary" type="submit">Continue</button> <a class="button button-secondary" href="sign-in.html">Back To Sign In</a></div></form>';
    root.querySelector('#fp-form').addEventListener('submit', function (e) {
      e.preventDefault(); var em = root.querySelector('#fp-email').value.trim();
      if (!emailOk(em)) return showErr(root, 'Enter a valid email address.', 'fp-email');
      root.innerHTML = '<div class="form-card"><h2>Check Your Email (Demo)</h2><p>If an account used <strong>' + esc(em) + '</strong>, a real site would send a reset link and say the same thing whether or not the account exists. <strong>Nothing was sent here.</strong></p><p><a class="button button-primary" href="reset-password.html?email=' + encodeURIComponent(em) + '">Open The Demo Reset Page</a></p></div>';
    });
  };

  var pwForm = function (root, o) {
    return field(o.p + '-new', 'New Password', { req: 1, type: 'password', ac: 'new-password', hint: PW_RULE }) + field(o.p + '-new2', 'Confirm New Password', { req: 1, type: 'password', ac: 'new-password' });
  };
  var pwCheck = function (root, p) {
    var a = root.querySelector('#' + p + '-new').value, c = root.querySelector('#' + p + '-new2').value;
    if (!pwOk(a)) { showErr(root, PW_RULE, p + '-new'); return false; }
    if (a !== c) { showErr(root, 'Passwords do not match.', p + '-new2'); return false; }
    return true;
  };
  var resetPage = function (root) {
    var em = qp('email');
    root.innerHTML = '<form class="form-card" id="rp-form" novalidate><h2>Reset Your Password</h2><div class="notice navy" role="note"><strong>Demo &ndash; nothing is changed.</strong> Use the demo code <strong>' + DEMO_CODE + '</strong>. No password is saved because no real accounts exist yet.</div>' + (em ? '<p>Resetting for <strong>' + esc(em) + '</strong>.</p>' : '') +
      '<div class="form-grid">' + field('rp-code', 'Reset Code', { req: 1, hint: 'Demo code: ' + DEMO_CODE }) + '<div class="field"></div>' + pwForm(root, { p: 'rp' }) + '</div>' + errBox + '<div class="form-actions"><button class="button button-primary" type="submit">Reset Password</button></div></form>';
    root.querySelector('#rp-form').addEventListener('submit', function (e) {
      e.preventDefault();
      if (root.querySelector('#rp-code').value.trim() !== DEMO_CODE) return showErr(root, 'That code is not right. In this demo use ' + DEMO_CODE + '.', 'rp-code');
      if (!pwCheck(root, 'rp')) return;
      root.innerHTML = '<div class="form-card"><h2>Password Rules Passed (Demo)</h2><p>Your new password met the rules and was then discarded. <strong>Nothing was saved or changed</strong> and no email was sent. Real password resets need a backend (see ROADMAP).</p><p><a class="button button-primary" href="sign-in.html">Go To Sign In</a></p></div>';
    });
  };

  var NOTIFS = [['msg', 'New Messages (Connect)'], ['ver', 'Verification Requests And Results'], ['int', 'Athlete Interest And Interested-Athlete Alerts'], ['cal', 'Calendar Reminders'], ['sys', 'Product Updates']];
  var settingsPage = function (root) {
    var s = session();
    if (!s) { root.innerHTML = '<div class="form-card"><h2>You Are Not Signed In</h2><p>You are in owner preview mode. <a href="sign-in.html">Sign in</a> to manage an account.</p></div>'; return; }
    var np = rd(NKEY, {}), me = np[s.email] || { msg: true, ver: true, int: true, cal: true, sys: false, freq: 'Daily' };
    var draw = function (msg) {
      s = session();
      root.innerHTML = (msg ? '<div class="notice navy" role="status"><strong>' + esc(msg) + '</strong></div>' : '') +
        '<section class="form-card"><h2>Profile</h2><form id="as-prof" novalidate><dl class="review-list"><dt>Role</dt><dd>' + esc(roleOf(s.role)[1]) + (s.staffRole ? ' (' + esc(s.staffRole) + ')' : '') + '</dd></dl><div class="form-grid">' + field('as-name', 'Name', { req: 1, val: s.name, ac: 'name' }) + (s.role === 'coach' || s.role === 'ad' || s.org ? field('as-org', 'School Or Organization', { val: s.org, ac: 'organization' }) : '') + '</div>' +
        '<p class="hint">Athlete profile details are edited on the <a href="athlete-profile.html">Athlete Profile</a>; verifier details on the verifier Profile tab.</p>' + errBox + '<button class="button button-primary" type="submit">Save Profile</button></form></section>' +
        '<section class="form-card"><h2>Email</h2><form id="as-mail" novalidate><div class="form-grid">' + field('as-email', 'Email', { req: 1, type: 'email', val: s.email, ac: 'email' }) + '</div><p class="hint">Demo: no confirmation email is sent. A real site would confirm the new address first.</p><p class="field-error" id="as-mail-err" role="alert" hidden></p><button class="button button-primary" type="submit">Update Email</button></form></section>' +
        '<section class="form-card"><h2>Change Password</h2><form id="as-pw" novalidate><div class="notice navy" role="note">Demo: your password is checked against the rules, then discarded. It is never saved or sent.</div><div class="form-grid">' + field('as-cur', 'Current Password', { req: 1, type: 'password', ac: 'current-password' }) + '<div class="field"></div>' + pwForm(root, { p: 'as' }) + '</div><p class="field-error" id="as-pw-err" role="alert" hidden></p><button class="button button-primary" type="submit">Check And Change Password</button></form></section>' +
        '<section class="form-card"><h2>Notification Preferences</h2><form id="as-np"><div class="notice navy" role="note">Preferences are saved in this browser only. <strong>No emails, texts or push notifications are sent</strong> in this demo.</div><fieldset><legend>Tell Me About</legend>' + NOTIFS.map(function (n) { return '<label class="check"><input type="checkbox" data-n="' + n[0] + '"' + (me[n[0]] ? ' checked' : '') + ' /> ' + n[1] + '</label>'; }).join('') + '</fieldset><div class="form-grid">' + field('as-freq', 'Digest Frequency', { opts: ['Immediate', 'Daily', 'Weekly', 'Off'].map(function (x) { return [x, x]; }), val: me.freq }) + '</div><button class="button button-primary" type="submit">Save Preferences</button></form></section>' +
        '<section class="form-card"><h2>Sign Out</h2><p>Signing out ends this demo session. Data you entered (athlete profile, board, etc.) stays in this browser until you delete it.</p><button class="button button-secondary" type="button" id="as-out">Sign Out</button></section>';
      var save = function (patch, m) { var n = Object.assign({}, session(), patch); wr(SKEY, n); draw(m); };
      root.querySelector('#as-prof').addEventListener('submit', function (e) { e.preventDefault(); var n = root.querySelector('#as-name').value.trim(), o = root.querySelector('#as-org'); if (n.length < 2) return showErr(root, 'Enter your name.', 'as-name'); save({ name: n, org: o ? o.value.trim() : s.org }, 'Profile saved.'); });
      root.querySelector('#as-mail').addEventListener('submit', function (e) { e.preventDefault(); var v = root.querySelector('#as-email').value.trim().toLowerCase(), er = root.querySelector('#as-mail-err'); if (!emailOk(v)) { er.hidden = false; er.textContent = 'Enter a valid email address.'; root.querySelector('#as-email').focus(); return; } save({ email: v }, 'Email updated for this demo session (no confirmation email was sent).'); });
      root.querySelector('#as-pw').addEventListener('submit', function (e) {
        e.preventDefault(); var er = root.querySelector('#as-pw-err'); er.hidden = true;
        var fail = function (m, id) { er.hidden = false; er.textContent = m; root.querySelector('#' + id).focus(); };
        if (!root.querySelector('#as-cur').value) return fail('Enter your current password.', 'as-cur');
        if (!pwOk(root.querySelector('#as-new').value)) return fail(PW_RULE, 'as-new');
        if (root.querySelector('#as-new').value !== root.querySelector('#as-new2').value) return fail('Passwords do not match.', 'as-new2');
        draw('Password rules passed. Demo: nothing was saved or changed.');
      });
      root.querySelector('#as-np').addEventListener('submit', function (e) { e.preventDefault(); var o = { freq: root.querySelector('#as-freq').value || 'Daily' }; Array.prototype.forEach.call(root.querySelectorAll('[data-n]'), function (c) { o[c.getAttribute('data-n')] = c.checked; }); np[s.email] = o; me = o; wr(NKEY, np); draw('Notification preferences saved in this browser.'); });
      root.querySelector('#as-out').addEventListener('click', function () { signOut(); go('index.html'); });
    };
    draw('');
  };

  var pages = function () {
    var m = { 'signin-app': signInPage, 'forgot-app': forgotPage, 'reset-app': resetPage, 'settings-app': settingsPage };
    Object.keys(m).forEach(function (id) { var r = document.getElementById(id); if (r) m[id](r); });
  };
})();
