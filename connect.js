/* Shared Connect module (demo, localStorage). One store, keyed by participant ids, so the same conversation shows for both sides.
   Used by connect.html (every role), coach-connect.html and department-connect.html. Not encrypted, not delivered anywhere. */
(function () {
  'use strict';
  var CFG = window.CONNECT_CONFIG || { ROLES: {}, MATRIX: {}, WHY: {} };
  var KEY = 'theReadConnect', ASKEY = 'theReadConnectAs', SKEY = 'theReadSession', XKEY = 'theReadDemoAthleteExtras', VKEY = 'theReadVerifiers';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var jget = function (k, d) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } };
  var now = function () { return new Date().toISOString().slice(0, 16); };
  var slug = function (s) { return String(s || 'x').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'x'; };
  var A = function () { return window.TheReadAthlete || { load: function () { return []; }, interests: function () { return []; }, gStatus: function () { return null; } }; };

  var SAMPLE = [
    ['dir:c1', 'Coach Dana Whitlock (Fictional)', 'hs', 'Fictional Ridge High School', 'TX'], ['dir:c2', 'Coach Marcus Bell (Fictional)', 'hs', 'Fictional Lakeview Prep', 'FL'],
    ['dir:c3', 'Alex Moreno (Fictional)', 'pi', 'Fictional Diamond Performance Lab', 'CA'], ['dir:c4', 'Priya Nair (Fictional)', 'pi', 'Fictional Catching Academy', 'GA'],
    ['dir:c5', 'Coach Ray Tolliver (Fictional)', 'coach', 'Fictional Prairie JUCO', 'KS'], ['dir:c6', 'Coach Elena Park (Fictional)', 'coach', 'Fictional Coastal JUCO', 'CA'],
    ['dir:c7', 'Coach Sam Okafor (Fictional)', 'coach', 'Fictional Northern State', 'OH'], ['dir:c8', 'Coach Lena Brandt (Fictional)', 'coach', 'Fictional Mountain University', 'CO'],
    ['dir:c9', 'Jordan Pike (Fictional)', 'athlete', 'Fictional Ridge High School', 'TX'], ['dir:c10', 'Casey Vega (Fictional)', 'athlete', 'Fictional Prairie JUCO', 'KS'],
    ['co:sample', 'Sample Program Coach (Fictional)', 'coach', 'Sample State University', ''], ['ad:sample', 'Sample Athletic Director (Fictional)', 'ad', 'Sample State University', '']
  ].map(function (r) { return { id: r[0], name: r[1], role: r[2], org: r[3], state: r[4], sports: [], sample: true }; });

  var store = function () { var s = jget(KEY, null); if (!s || !Array.isArray(s.threads)) s = { threads: [], intros: [], notifs: [], seeded: false }; if (!s.seeded && !s.threads.length) { seed(s); s.seeded = true; save(s); } return s; };
  var save = function (s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* demo only */ } };
  var tkey = function (a, b) { return [a, b].sort().join('|'); };
  function seed(s) {
    var m = 'co:sample', mk = function (o, msgs, un) { var u = {}; u[m] = un; s.threads.push({ id: 't-' + slug(o), key: tkey(m, o), p: [m, o], messages: msgs, unread: u, blocked: {}, reported: {}, sport: '' }); };
    mk('dir:c5', [{ from: m, ts: '2026-09-02T10:15', body: 'Coach Tolliver, we are looking at a few JUCO sophomores for next fall. Who should we talk to on your roster?' }, { from: 'dir:c5', ts: '2026-09-02T17:40', body: 'Happy to help. I will send two names this week. (Sample message)' }], 1);
    mk('dir:c7', [{ from: 'dir:c7', ts: '2026-08-28T14:05', body: 'We are also tracking the portal for outfielders. Want to compare notes? (Sample message)' }], 0);
    mk('dir:c3', [{ from: 'dir:c3', ts: '2026-09-10T09:00', body: 'I verified exit velocity for two of my hitters at last month\u2019s session. Happy to share the dates. (Sample message)' }], 1);
    mk('dir:c9', [{ from: m, ts: '2026-09-12T11:20', body: 'Jordan, thanks for the questionnaire. Could you send your most recent game schedule?' }, { from: 'dir:c9', ts: '2026-09-12T18:02', body: 'Sure, I will send it tonight. (Sample message)' }], 0);
  }

  /* ---------- people directory ---------- */
  function session() { return jget(SKEY, null); }
  function people() {
    var out = SAMPLE.slice(), recs = A().load().filter(function (r) { return r.submitted; }), x = jget(XKEY, {});
    recs.forEach(function (r) {
      var minor = r.path !== 'adult';
      out.push({ id: 'ath:' + r.id, name: r.name, role: 'athlete', org: r.school || '', state: r.state || '', sports: (r.sports || []).map(function (s) { return s.name; }), rid: r.id, minor: minor, rec: r, sample: false });
      if (r.guardian && r.guardian.name) out.push({ id: 'gd:' + r.id, name: r.guardian.name + ' (Guardian of ' + r.name + ')', role: 'guardian', org: '', state: r.state || '', sports: [], rid: r.id, sample: false });
    });
    jget(VKEY, []).forEach(function (v) { out.push({ id: 'ver:' + v.id, name: v.name, role: v.type, org: v.org || '', state: '', sports: [], vid: v.id, email: v.email, sample: false }); });
    var s = session();
    if (s && (s.role === 'coach' || s.role === 'ad')) out.push({ id: (s.role === 'ad' ? 'ad:' : 'co:') + slug(s.email || s.name), name: s.name, role: s.role, org: s.org || '', state: '', sports: [], sample: false });
    var coach = window.TheReadCoach;
    if (coach && coach.players) coach.players.filter(function (p) { return !p.entered && !p._aid; }).forEach(function (p) { out.push({ id: 'pl:' + p.id, name: p.name, role: 'athlete', org: '', state: p.state || '', sports: [p.sport || 'Baseball'], sample: true, minor: false }); });
    var seen = {}; return out.filter(function (p) { if (seen[p.id]) return false; seen[p.id] = 1; return true; });
  }
  var person = function (id) { return people().filter(function (p) { return p.id === id; })[0] || null; };
  function meId() {
    var as = null; try { as = sessionStorage.getItem(ASKEY); } catch (e) { as = null; }
    if (as && person(as)) return as;
    var s = session();
    if (s) {
      if (s.role === 'athlete' && s.aid) return 'ath:' + s.aid;
      if (s.role === 'guardian' && s.aid) return 'gd:' + s.aid;
      if ((s.role === 'hs' || s.role === 'pi' || s.role === 'vdp') && s.vid) return 'ver:' + s.vid;
      if (s.role === 'coach') return 'co:' + slug(s.email || s.name);
      if (s.role === 'ad') return 'ad:' + slug(s.email || s.name);
    }
    return 'co:sample';
  }
  var me = function () { return person(meId()) || SAMPLE[10]; };

  /* ---------- permissions ---------- */
  var extras = function (p) { return jget(XKEY, {})[p.rid] || {}; };
  var interested = function (athlete, prog) {
    var org = String(prog.org || '').toLowerCase(); if (!org) return false;
    return A().interests().some(function (i) { return i.aid === athlete.rid && String(i.school).toLowerCase() === org; });
  };
  function verifierLinked(ath, ver) {
    var r = ath.rec; if (!r) return false;
    return (r.verifiers || []).some(function (q) { var v = jget(VKEY, []).filter(function (x) { return x.id === ver.vid; })[0]; return v && String(q.email || '').toLowerCase() === String(v.email).toLowerCase(); });
  }
  // Returns { mode: 'direct' | 'intro' | 'deny', why, note }
  function perm(from, to) {
    if (!from || !to || from.id === to.id) return { mode: 'deny', why: 'Choose someone else.' };
    var rule = (CFG.MATRIX[from.role] || {})[to.role] || 'deny', ath = from.role === 'athlete' ? from : to.role === 'athlete' ? to : null, ok = false, note = '';
    if (rule === 'direct') ok = true;
    else if (rule === 'own') ok = !!(from.rid && from.rid === to.rid);
    else if (rule === 'mine') { var ver = from.role === 'athlete' ? to : from; ok = !!(ath && ath.rec && verifierLinked(ath, ver)); }
    else if (rule === 'verifier') ok = !!(from.rec && verifierLinked(from, to));
    else if (rule === 'interest') ok = !!(from.rec && interested(from, to));
    else if (rule === 'visible') {
      if (to.sample && !to.rec) ok = true;
      else if (to.rec) {
        var w = extras(to).msgWho || 'verified', minorOk = !to.minor || A().gStatus(to.rec) === 'Verified';
        ok = w !== 'none' && minorOk && !!(to.rec.privacy && to.rec.privacy.contact !== false && to.rec.privacy.list);
      }
    }
    if (from.role === 'coach' && to.role === 'athlete') note = CFG.NCAA_NOTE;
    if (rule === 'deny') return { mode: 'deny', why: CFG.WHY.deny };
    if (ok) return { mode: 'direct', why: CFG.WHY[rule] || '', note: note };
    var why = rule === 'visible' && to.minor ? 'This athlete is a minor. Direct contact needs a verified guardian and the athlete\u2019s message settings. You can request an introduction; a guardian approves it.' : (CFG.WHY[rule] || CFG.WHY.intro);
    return { mode: 'intro', why: why, note: note };
  }

  /* ---------- threads ---------- */
  function guardianFor(p) { return p && p.role === 'athlete' && p.minor && p.rid ? 'gd:' + p.rid : null; }
  function canSee(meP, th) {
    if (th.p.indexOf(meP.id) >= 0) return 'member';
    if (meP.role === 'ad') return 'oversight';
    if (meP.role === 'guardian') {
      var ps = th.p.map(person).filter(Boolean);
      var a = ps.filter(function (p) { return p.role === 'athlete' && p.rid === meP.rid && p.minor; })[0];
      if (a && !(a.rec && a.rec.guardian && a.rec.guardian.msgVisible === false)) return 'guardian';
    }
    return null;
  }
  function visibleThreads(meP) { return store().threads.map(function (t) { var v = canSee(meP, t); return v ? { t: t, view: v } : null; }).filter(Boolean); }
  var unread = function (id) { return store().threads.reduce(function (n, t) { return n + ((t.unread && t.unread[id]) ? 1 : 0); }, 0) + store().intros.filter(function (i) { return i.status === 'Pending' && (i.to === id || i.approver === id); }).length; };
  function notify(s, to, text) { s.notifs.push({ id: 'n-' + Date.now().toString(36) + s.notifs.length, to: to, text: text, ts: now(), read: false }); }
  function openThread(s, a, b, sport) {
    var k = tkey(a, b), t = s.threads.filter(function (x) { return x.key === k; })[0];
    if (!t) { t = { id: 't-' + slug(k) + '-' + Date.now().toString(36), key: k, p: [a, b], messages: [], unread: {}, blocked: {}, reported: {}, sport: sport || '' }; s.threads.push(t); }
    return t;
  }
  function addMsg(s, t, from, body) {
    var other = t.p.filter(function (x) { return x !== from; })[0], fp = person(from), op = person(other);
    t.messages.push({ from: from, ts: now(), body: String(body).slice(0, 1000) });
    t.unread[other] = 1; notify(s, other, 'New message from ' + (fp ? fp.name : 'someone') + ' (demo in-app notice, no email or push sent).');
    var g = guardianFor(op); if (g) notify(s, g, 'New message for your athlete from ' + (fp ? fp.name : 'someone') + '. You can read it in Connect.');
  }
  function sendTo(from, to, body, sport) {
    var f = person(from), t = person(to), p = perm(f, t), s = store();
    if (p.mode !== 'direct') return { ok: false, why: p.why };
    var th = openThread(s, from, to, sport); if (th.blocked[to] || th.blocked[from]) return { ok: false, why: 'This conversation is blocked.' };
    addMsg(s, th, from, body); save(s); return { ok: true, id: th.id };
  }
  function reply(id, from, body) {
    var s = store(), th = s.threads.filter(function (x) { return x.id === id; })[0];
    if (!th || th.p.indexOf(from) < 0) return { ok: false, why: 'You are not part of this conversation.' };
    if (Object.keys(th.blocked).length) return { ok: false, why: 'This conversation is blocked.' };
    addMsg(s, th, from, body); save(s); return { ok: true, id: id };
  }
  function requestIntro(from, to, note, sport) {
    var s = store(), tp = person(to);
    if (s.intros.some(function (i) { return i.from === from && i.to === to && i.status === 'Pending'; })) return { ok: false, why: 'An introduction request is already waiting.' };
    var g = guardianFor(tp), i = { id: 'i-' + Date.now().toString(36), from: from, to: to, approver: g || to, note: String(note || '').slice(0, 500), sport: sport || '', status: 'Pending', ts: now() };
    s.intros.push(i); notify(s, i.approver, 'Introduction request from ' + (person(from) || { name: 'someone' }).name + ' (demo in-app notice).'); save(s); return { ok: true };
  }
  function respondIntro(id, accept) {
    var s = store(), i = s.intros.filter(function (x) { return x.id === id; })[0]; if (!i || i.status !== 'Pending') return;
    i.status = accept ? 'Approved' : 'Declined';
    if (accept) { var th = openThread(s, i.from, i.to, i.sport); if (i.note) addMsg(s, th, i.from, i.note); else th.unread[i.to] = 1; }
    notify(s, i.from, 'Your introduction request was ' + i.status.toLowerCase() + '.'); save(s);
  }
  function setBlock(id, by, v) { var s = store(), t = s.threads.filter(function (x) { return x.id === id; })[0]; if (t) { if (v) t.blocked[by] = true; else delete t.blocked[by]; save(s); } }
  function report(id, by) { var s = store(), t = s.threads.filter(function (x) { return x.id === id; })[0]; if (t) { t.reported[by] = true; save(s); } }
  function markRead(id, by) { var s = store(), t = s.threads.filter(function (x) { return x.id === id; })[0]; if (t && t.unread[by]) { t.unread[by] = 0; save(s); } }

  /* ---------- UI ---------- */
  var roleName = function (r) { return CFG.ROLES[r] || r; };
  var home = function (role) { var h = window.TheReadAccount && window.TheReadAccount.homeOf ? window.TheReadAccount.homeOf({ role: role }) : 'index.html'; return h; };

  function render(root, opt) {
    opt = opt || {};
    var M = me(), sel = new URLSearchParams(location.search).get('thread') || '', flash = '';
    var toParam = new URLSearchParams(location.search).get('to') || '';
    if (toParam.indexOf('pl:') === 0) { var rid = toParam.slice(3), hit = people().filter(function (p) { return p.rid === rid || p.id === 'ath:' + rid || p.id === toParam; })[0]; toParam = hit ? hit.id : toParam; }
    var sportsAll = (window.TheReadSports && window.TheReadSports.list || []).map(function (x) { return x.name; });
    function shell() {
      var as = people().filter(function (p) { return p.id !== meId(); }).map(function (p) { return '<option value="' + esc(p.id) + '">' + esc(p.name) + ' \u2014 ' + esc(roleName(p.role)) + '</option>'; }).join('');
      root.innerHTML =
        '<div class="msg-banner" role="note"><strong>Demo &ndash; messages are not sent.</strong> ' + esc(CFG.HONEST_NOTE) + '</div>' +
        '<p class="coach-note" role="status" id="cn-flash">' + esc(flash) + '</p>' +
        '<p class="coach-note"><strong>Signed in as:</strong> ' + esc(M.name) + ' (' + esc(roleName(M.role)) + '). ' + (opt.layout === 'plain' ? '<a href="' + esc(home(M.role)) + '">Back To My Workspace</a>' : '') + '</p>' +
        '<details class="card"><summary>Demo: View Connect As Someone Else</summary><p class="coach-note">Switch identity to see the same conversation from the other side. Demo only.</p><label>View as <select id="cn-as"><option value="">' + esc(M.name) + ' (current)</option>' + as + '</select></label> <button type="button" class="button button-secondary" id="cn-as-go">Switch</button> <button type="button" class="button button-secondary" id="cn-as-reset">Back To Signed-In Identity</button></details>' +
        '<div id="cn-notifs"></div><div id="cn-intros"></div>' +
        '<form class="controls" id="cn-filters" onsubmit="return false"><label>Role<select id="cn-role"><option value="">All roles</option>' + Object.keys(CFG.ROLES).map(function (r) { return '<option value="' + r + '">' + esc(roleName(r)) + '</option>'; }).join('') + '</select></label>' +
        (M.role === 'ad' || sportsAll.length ? '<label>Sport<select id="cn-sport"><option value="">All sports</option>' + sportsAll.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('') + '</select></label>' : '') +
        '<label>Search<input type="search" id="cn-q" placeholder="Name, school, message text" /></label><label>Show<select id="cn-show"><option value="">All</option><option value="u">Unread only</option></select></label></form>' +
        '<div class="msg-layout"><section class="card msg-list-card" aria-label="Conversations"><h2>' + (M.role === 'ad' ? 'Conversations (Oversight Included)' : 'Inbox') + ' <span class="pill" id="cn-unread"></span></h2><p class="coach-count" id="cn-count" role="status"></p><ul class="msg-threads" id="cn-threads"></ul></section><section class="card msg-conv" aria-label="Conversation" id="cn-conv"></section></div>' +
        '<section class="card"><h2>New Message</h2><form id="cn-new" novalidate><div class="md-grid"><label>Find Someone<input type="search" id="cn-find" placeholder="Type to narrow the list" /></label><label>To *<select name="to" id="cn-to"></select></label><label class="md-wide">Message *<textarea name="body" rows="3" maxlength="1000"></textarea></label></div><p class="coach-note" id="cn-rule" role="status"></p><ul class="md-errors" id="cn-errors" role="alert"></ul><button type="submit" class="button button-primary" id="cn-send">Save Message</button> <button type="button" class="button button-secondary" id="cn-introbtn" hidden>Request Introduction</button></form></section>' +
        '<section class="card"><h2>Who Can Message Whom</h2><p class="coach-note">One shared rulebook for every role. If direct contact is not allowed, use Request Introduction.</p>' + matrixHtml() + '</section>';
      fillTo(''); drawNotifs(); drawIntros(); redraw(); ruleNote();
    }
    function matrixHtml() {
      var rs = Object.keys(CFG.ROLES), label = { direct: 'Direct', deny: 'No', intro: 'Intro Request', own: 'Direct (own athlete)', mine: 'Direct (verifier link)', verifier: 'Direct (requested verifier)', interest: 'Direct (in Interests)', visible: 'Direct (athlete allows; minors need guardian)' };
      return '<div class="table-wrap"><table class="data-table"><caption class="sr-only">Messaging permissions by role</caption><thead><tr><th scope="col">From \\ To</th>' + rs.map(function (r) { return '<th scope="col">' + esc(roleName(r)) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        rs.map(function (f) { return '<tr><th scope="row">' + esc(roleName(f)) + '</th>' + rs.map(function (t) { return '<td>' + esc(label[CFG.MATRIX[f][t]] || '') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div><p class="coach-note">Guardians read a minor\u2019s conversations (read-only) unless the athlete\u2019s guardian setting hides them. The Athletic Department can read all conversations for oversight (read-only). Anyone can block or report a conversation.</p>';
    }
    function fillTo(q) {
      var sel = root.querySelector('#cn-to'), keep = sel.value || toParam; q = String(q || '').toLowerCase();
      var list = people().filter(function (p) { return p.id !== M.id && (!q || (p.name + ' ' + p.org + ' ' + roleName(p.role)).toLowerCase().indexOf(q) >= 0); });
      var groups = {}; list.forEach(function (p) { (groups[p.role] = groups[p.role] || []).push(p); });
      sel.innerHTML = '<option value="">Choose a person</option>' + Object.keys(groups).map(function (r) { return '<optgroup label="' + esc(roleName(r)) + '">' + groups[r].map(function (p) { var pm = perm(M, p); return '<option value="' + esc(p.id) + '"' + (pm.mode === 'deny' ? ' disabled' : '') + '>' + esc(p.name) + (pm.mode === 'intro' ? ' (introduction needed)' : pm.mode === 'deny' ? ' (not available)' : '') + '</option>'; }).join('') + '</optgroup>'; }).join('');
      if (keep && sel.querySelector('[value="' + keep.replace(/"/g, '') + '"]')) sel.value = keep;
    }
    function ruleNote() {
      var to = root.querySelector('#cn-to').value, p = to ? person(to) : null, pm = p ? perm(M, p) : null, send = root.querySelector('#cn-send'), ib = root.querySelector('#cn-introbtn');
      root.querySelector('#cn-rule').innerHTML = pm ? esc(pm.why) + (pm.note ? ' <em>' + esc(pm.note) + '</em>' : '') : '';
      send.hidden = !!(pm && pm.mode !== 'direct'); ib.hidden = !(pm && pm.mode === 'intro');
    }
    function drawNotifs() {
      var n = store().notifs.filter(function (x) { return x.to === M.id && !x.read; });
      root.querySelector('#cn-notifs').innerHTML = n.length ? '<section class="card" aria-label="Notifications"><h2>Notifications <span class="pill">' + n.length + '</span></h2><ul>' + n.slice(-6).reverse().map(function (x) { return '<li>' + esc(x.ts.replace('T', ' ')) + ' \u2013 ' + esc(x.text) + '</li>'; }).join('') + '</ul><button type="button" class="button button-secondary" id="cn-nread">Mark Notifications Read</button></section>' : '';
    }
    function drawIntros() {
      var s = store(), inbox = s.intros.filter(function (i) { return i.status === 'Pending' && (i.approver === M.id); }), mine = s.intros.filter(function (i) { return i.from === M.id; });
      root.querySelector('#cn-intros').innerHTML = (inbox.length || mine.length) ? '<section class="card" aria-label="Introduction requests"><h2>Introduction Requests</h2>' +
        (inbox.length ? '<h3>Waiting For You</h3><ul>' + inbox.map(function (i) { var f = person(i.from) || { name: 'Unknown' }, t = person(i.to) || { name: 'Unknown' }; return '<li><strong>' + esc(f.name) + '</strong> would like to talk' + (i.approver !== i.to ? ' with ' + esc(t.name) + ' (a guardian approves for minors)' : ' with you') + (i.note ? ': \u201c' + esc(i.note) + '\u201d' : '') + ' <button type="button" class="button button-primary" data-intro="' + i.id + '" data-yes="1">Approve</button> <button type="button" class="button button-secondary" data-intro="' + i.id + '">Decline</button></li>'; }).join('') + '</ul>' : '') +
        (mine.length ? '<h3>You Sent</h3><ul>' + mine.map(function (i) { return '<li>' + esc((person(i.to) || { name: 'Unknown' }).name) + ' \u2013 ' + esc(i.status) + '</li>'; }).join('') + '</ul>' : '') + '</section>' : '';
    }
    function drawList() {
      var role = root.querySelector('#cn-role').value, sp = (root.querySelector('#cn-sport') || { value: '' }).value, q = root.querySelector('#cn-q').value.trim().toLowerCase(), uo = root.querySelector('#cn-show').value === 'u';
      var all = visibleThreads(M), list = all.filter(function (x) {
        var o = x.t.p.filter(function (i) { return i !== M.id; }).map(person).filter(Boolean), names = o.map(function (p) { return p.name + ' ' + p.org; }).join(' ');
        var spOk = !sp || x.t.p.map(person).some(function (p) { return p && (p.sports || []).indexOf(sp) >= 0; }) || x.t.sport === sp;
        return (!role || x.t.p.some(function (i) { var p = person(i); return p && p.role === role && i !== M.id; })) && spOk && (!uo || x.t.unread[M.id]) && (!q || (names + ' ' + x.t.messages.map(function (m) { return m.body; }).join(' ')).toLowerCase().indexOf(q) >= 0);
      }).sort(function (a, b) { var la = a.t.messages.length ? a.t.messages[a.t.messages.length - 1].ts : '', lb = b.t.messages.length ? b.t.messages[b.t.messages.length - 1].ts : ''; return la < lb ? 1 : -1; });
      root.querySelector('#cn-unread').textContent = unread(M.id) + ' unread';
      root.querySelector('#cn-count').textContent = 'Showing ' + list.length + ' of ' + all.length + ' conversations';
      root.querySelector('#cn-threads').innerHTML = list.length ? list.map(function (x) {
        var t = x.t, last = t.messages[t.messages.length - 1], nm = t.p.map(person).filter(Boolean).filter(function (p) { return x.view !== 'member' || p.id !== M.id; }).map(function (p) { return p.name; }).join(' & ');
        return '<li><button type="button" class="msg-thread' + (t.id === sel ? ' is-sel' : '') + (t.unread[M.id] ? ' is-unread' : '') + '" data-th="' + esc(t.id) + '"><strong>' + esc(nm) + '</strong>' + (t.unread[M.id] ? ' <span class="pill pill-new">New</span>' : '') + (x.view !== 'member' ? ' <span class="pill">' + (x.view === 'guardian' ? 'Guardian View' : 'Oversight') + '</span>' : '') + '<span class="msg-snip">' + esc(last ? last.body.slice(0, 70) : 'No messages yet') + '</span></button></li>';
      }).join('') : '<li class="coach-note">No conversations match these filters.</li>';
    }
    function drawConv() {
      var box = root.querySelector('#cn-conv'), v = sel ? visibleThreads(M).filter(function (x) { return x.t.id === sel; })[0] : null;
      if (!v) { box.innerHTML = '<h2>Conversation</h2><p class="coach-note">Select a conversation, or start a new message below.</p>'; return; }
      var t = v.t, nm = function (id) { var p = person(id); return p ? p.name : 'Unknown'; }, mem = v.view === 'member', blocked = Object.keys(t.blocked).length;
      box.innerHTML = '<div class="msg-head"><div><h2>' + esc(t.p.map(nm).join(' & ')) + '</h2><p class="coach-note">' + (mem ? '' : (v.view === 'guardian' ? 'Read-only guardian view of your athlete\u2019s conversation.' : 'Read-only Athletic Department oversight view. Logged as an audit view in this demo only.')) + '</p></div>' +
        (mem ? '<div><button type="button" class="button button-secondary" data-block="' + esc(t.id) + '">' + (t.blocked[M.id] ? 'Unblock' : 'Block') + '</button> <button type="button" class="button button-secondary" data-report="' + esc(t.id) + '">' + (t.reported[M.id] ? 'Reported' : 'Report') + '</button></div>' : '') + '</div>' +
        '<ol class="msg-log" aria-label="Messages">' + t.messages.map(function (m) { return '<li class="msg ' + (m.from === M.id ? 'mine' : 'theirs') + '"><span class="msg-by">' + esc(nm(m.from)) + ' \u00b7 ' + esc(m.ts.replace('T', ' ')) + '</span><p>' + esc(m.body) + '</p></li>'; }).join('') + '</ol>' +
        (!mem ? '' : blocked ? '<p class="coach-note">This conversation is blocked. Unblock to reply.</p>' : '<form id="cn-reply" novalidate><label>Reply<textarea name="body" rows="2" maxlength="1000"></textarea></label><ul class="md-errors" id="cn-rerr" role="alert"></ul><button type="submit" class="button button-primary">Save Reply</button></form>');
    }
    function redraw() { drawList(); drawConv(); badges(); }
    shell();
    root.addEventListener('input', function (e) { if (e.target.id === 'cn-find') { fillTo(e.target.value); ruleNote(); } else if (e.target.closest('#cn-filters')) drawList(); });
    root.addEventListener('change', function (e) { if (e.target.id === 'cn-to') { toParam = e.target.value; ruleNote(); } else if (e.target.closest('#cn-filters')) drawList(); });
    root.addEventListener('click', function (e) {
      var t = e.target.closest('[data-th]');
      if (t) { sel = t.dataset.th; markRead(sel, M.id); redraw(); return; }
      var b = e.target.closest('[data-block]'); if (b) { var th = store().threads.filter(function (x) { return x.id === b.dataset.block; })[0]; setBlock(th.id, M.id, !th.blocked[M.id]); redraw(); return; }
      var r = e.target.closest('[data-report]'); if (r) { report(r.dataset.report, M.id); redraw(); return; }
      var ii = e.target.closest('[data-intro]'); if (ii) { respondIntro(ii.dataset.intro, !!ii.dataset.yes); drawIntros(); redraw(); return; }
      if (e.target.id === 'cn-nread') { var s = store(); s.notifs.forEach(function (n) { if (n.to === M.id) n.read = true; }); save(s); drawNotifs(); badges(); return; }
      if (e.target.id === 'cn-as-go') { var v = root.querySelector('#cn-as').value; if (v) { try { sessionStorage.setItem(ASKEY, v); } catch (x) { /* ignore */ } location.reload(); } return; }
      if (e.target.id === 'cn-as-reset') { try { sessionStorage.removeItem(ASKEY); } catch (x) { /* ignore */ } location.reload(); return; }
      if (e.target.id === 'cn-introbtn') {
        var to = root.querySelector('#cn-to').value, note = root.querySelector('#cn-new [name=body]').value.trim(), res = requestIntro(M.id, to, note, '');
        flash = res.ok ? 'Introduction request saved in this demo. The person is shown a notice in Connect (nothing is emailed).' : res.why; shell();
      }
    });
    root.addEventListener('submit', function (e) {
      e.preventDefault();
      if (e.target.id === 'cn-reply') { var body = e.target.elements.body.value.trim(); if (!body) { root.querySelector('#cn-rerr').innerHTML = '<li>Type a message first.</li>'; return; } var rr = reply(sel, M.id, body); if (!rr.ok) { root.querySelector('#cn-rerr').innerHTML = '<li>' + esc(rr.why) + '</li>'; return; } redraw(); return; }
      if (e.target.id === 'cn-new') {
        var to = e.target.elements.to.value, text = e.target.elements.body.value.trim(), errs = [];
        if (!to) errs.push('Choose a person.'); if (!text) errs.push('Type a message first.');
        root.querySelector('#cn-errors').innerHTML = errs.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join(''); if (errs.length) return;
        var res = sendTo(M.id, to, text, '');
        if (!res.ok) { root.querySelector('#cn-errors').innerHTML = '<li>' + esc(res.why) + '</li>'; return; }
        sel = res.id; flash = 'Message saved in the demo inbox. It was not sent anywhere.'; shell();
      }
    });
  }

  /* ---------- nav badges and tabs ---------- */
  function badges() {
    var n = unread(meId());
    Array.prototype.forEach.call(document.querySelectorAll('a[href^="connect.html"],a[href^="coach-connect.html"],a[href^="department-connect.html"]'), function (a) {
      var b = a.querySelector('.cn-badge'); if (b) b.remove();
      if (n > 0) { var s = document.createElement('span'); s.className = 'cn-badge'; s.textContent = n; s.setAttribute('aria-label', n + ' unread'); a.appendChild(s); }
    });
  }
  function connectHref() { var s = session(), b = document.body; if (b && b.dataset.deptPage) return 'department-connect.html'; if (b && b.dataset.coachPage) return /^(athprofile|athcal)$/.test(b.dataset.coachPage) ? 'connect.html' : 'coach-connect.html'; return s && s.role === 'coach' ? 'coach-connect.html' : s && s.role === 'ad' ? 'department-connect.html' : 'connect.html'; }
  function injectTab() {
    var bar = document.querySelector('.prof-tabs');
    if (bar && !bar.querySelector('a[href^="connect.html"]')) { var a = document.createElement('a'); a.href = 'connect.html'; a.textContent = 'Connect'; bar.appendChild(a); }
    var g = document.getElementById('guardian-connect-link');
    if (!g && /guardian-verify/.test(location.pathname)) { var m = document.getElementById('main'); if (m) { var p = document.createElement('p'); p.id = 'guardian-connect-link'; p.className = 'coach-note'; p.innerHTML = '<a class="button button-secondary" href="connect.html">Open Connect</a> Read your athlete\u2019s conversations (read-only) and message coaches.'; m.insertBefore(p, m.firstChild); } }
  }
  document.addEventListener('DOMContentLoaded', function () { setTimeout(function () { injectTab(); badges(); }, 50); setTimeout(badges, 400); });

  window.TheReadConnect = {
    mode: 'demo-localStorage', encrypted: false, config: CFG, me: me, meId: meId, people: people, person: person, perm: perm,
    send: sendTo, reply: reply, requestIntro: requestIntro, respondIntro: respondIntro, block: setBlock, report: report, markRead: markRead,
    threadsFor: visibleThreads, unread: unread, intros: function () { return store().intros; }, notifs: function () { return store().notifs; },
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }, render: render, badges: badges, href: connectHref
  };
})();
