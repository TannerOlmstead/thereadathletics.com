/* Verifier-side page: confirm or decline each metric separately. Saves to this browser only; nothing is sent. */
(function () {
  'use strict';
  var root = document.getElementById('verifier-app'), A = window.TheReadAthlete;
  if (!root || !A) return;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var sel = '', msg = '';
  var requests = function () {
    var out = [];
    A.load().filter(function (r) { return r.submitted; }).forEach(function (r) {
      (r.verifiers || []).forEach(function (q, i) { out.push({ rid: r.id, i: i, rec: r, q: q }); });
    });
    return out;
  };
  var label = function (k) { return (A.METRICS.filter(function (m) { return m[0] === k; })[0] || [k, k])[1]; };
  var draw = function () {
    var reqs = requests();
    if (!reqs.length) { root.innerHTML = '<section class="form-card"><h2>No Verification Requests</h2><p>When an athlete requests verification from their profile (Metrics tab), it appears here. Nothing is listed until then.</p></section>'; return; }
    if (!sel || !reqs.filter(function (r) { return r.rid + ':' + r.i === sel; })[0]) sel = reqs[0].rid + ':' + reqs[0].i;
    var cur = reqs.filter(function (r) { return r.rid + ':' + r.i === sel; })[0], r = cur.rec, q = cur.q;
    var keys = (q.keys && q.keys.length ? q.keys : A.METRICS.map(function (m) { return m[0]; })).filter(function (k) { return r.metrics && r.metrics[k] != null; });
    var conf = window.TheReadScore ? window.TheReadScore.compute({ pos: r.pos, metrics: r.metrics || {}, verified: r.verified || {} }, []).conf : null;
    var rows = keys.map(function (k) {
      var st = A.metricStatus(r, k), done = st.status === 'Verified' || st.status === 'Declined';
      return '<tr><th scope="row">' + esc(label(k)) + '</th><td>' + esc(r.metrics[k]) + '</td><td><span class="st-badge st-' + st.status.toLowerCase() + '">' + st.status + '</span></td>' +
        '<td><label class="visually-hidden" for="mt-' + k + '">Method for ' + esc(label(k)) + '</label><input id="mt-' + k + '" data-method="' + k + '" placeholder="e.g. radar gun, combine, measured in person" value="' + esc(st.method) + '" /></td>' +
        '<td><button type="button" class="button button-primary" data-ok="' + k + '">' + (done ? 'Re-Confirm' : 'Confirm') + '</button> <button type="button" class="button button-secondary" data-no="' + k + '">Decline</button></td></tr>';
    }).join('');
    root.innerHTML = '<section class="form-card"><h2>Verification Request</h2><p><strong>Demo:</strong> you are acting as the verifier named by the athlete. Nothing is emailed and no identity is checked.</p>' +
      '<label>Request<select id="vr-sel">' + reqs.map(function (x) { return '<option value="' + x.rid + ':' + x.i + '"' + (x.rid + ':' + x.i === sel ? ' selected' : '') + '>' + esc(x.rec.name) + ' &ndash; ' + esc(x.q.type) + (x.q.name ? ' (' + esc(x.q.name) + ')' : '') + '</option>'; }).join('') + '</select></label>' +
      '<p>Athlete: <strong>' + esc(r.name) + '</strong> &middot; ' + esc(r.pos || '') + ' &middot; Class of ' + esc(r.grad) + '. Verifier: ' + esc(q.type) + (q.name ? ', ' + esc(q.name) : '') + '.</p>' +
      (msg ? '<p role="status"><strong>' + esc(msg) + '</strong></p>' : '') +
      '<div class="table-wrap"><table><thead><tr><th scope="col">Metric</th><th scope="col">Athlete Value</th><th scope="col">Status</th><th scope="col">Method / Source</th><th scope="col">Decision</th></tr></thead><tbody>' + (rows || '<tr><td colspan="5">No metrics were entered for this request.</td></tr>') + '</tbody></table></div>' +
      '<p>Athlete Confidence now: <strong>' + (conf == null ? 'Unknown' : window.TheReadClassification.formatConfidencePercentage(conf)) + '</strong> (weighted share of verified Recruit Score inputs; unrelated to talent).</p></section>';
    root.querySelector('#vr-sel').addEventListener('change', function (e) { sel = e.target.value; msg = ''; draw(); });
    Array.prototype.forEach.call(root.querySelectorAll('[data-ok],[data-no]'), function (b) {
      b.addEventListener('click', function () {
        var k = b.dataset.ok || b.dataset.no, ok = !!b.dataset.ok, m = root.querySelector('[data-method="' + k + '"]').value.trim();
        if (ok && !m) { msg = 'Enter the method or source before confirming ' + label(k) + '.'; draw(); return; }
        A.verifyMetric(r, k, ok, { by: q.name || q.type, role: q.type }, m);
        var keep = localStorage.getItem('theReadDemoAthleteCurrent'); A.upsert(r); if (keep) localStorage.setItem('theReadDemoAthleteCurrent', keep); msg = label(k) + (ok ? ' confirmed.' : ' declined.'); draw();
      });
    });
  };
  draw();
})();
