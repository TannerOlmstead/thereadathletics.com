/* Preview interface for claim-merge.js. Fictional records, in memory only, nothing saved or sent. */
(function () {
  'use strict';
  var CM = window.TheReadClaimMerge;
  var REVIEWER = { id: 'preview-admin', role: 'admin' };
  var SAMPLE = [
    { id: 'S-1', name: 'Jordan Smith', grad: 2027, sport: 'Baseball', pos: 'SS', sec: '2B', state: 'TX', school: 'Example High', verified: { name: true, pos: true }, handedness: { bats: 'R', throws: 'R' }, linkedAccount: null, status: 'Active' },
    { id: 'S-2', name: 'Jordan A. Smith', grad: 2027, sport: 'Baseball', pos: 'SS', sec: '3B', state: 'TX', school: 'Example High', verified: {}, handedness: { bats: 'L', throws: 'R' }, linkedAccount: null, status: 'Active' },
    { id: 'S-3', name: 'Taylor Brooks', grad: 2026, sport: 'Baseball', pos: 'OF', sec: '', state: 'TX', school: 'Sample Prep', verified: {}, handedness: {}, linkedAccount: 'acct-existing', status: 'Active' }
  ];
  var ledger = CM.createLedger(SAMPLE);
  var $ = function (id) { return document.getElementById(id); };
  function el(tag, props, kids) {
    var n = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) { if (k === 'text') n.textContent = props[k]; else if (k === 'class') n.className = props[k]; else n.setAttribute(k, props[k]); });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function pill(status) { return el('span', { 'class': 'pill ' + ({ Pending: 'navy', Approved: 'green', Rejected: 'gray', 'Review Required': 'amber' }[status] || 'gray'), text: status }); }
  function option(v, t) { return el('option', { value: v, text: t == null ? v : t }); }

  var rel = $('relationship'); CM.RELATIONSHIPS.forEach(function (r) { rel.appendChild(option(r)); });
  var sportSel = $('sport'); sportSel.appendChild(option('', 'Select a sport'));
  (window.TheReadSports ? window.TheReadSports.names : ['Baseball']).forEach(function (n) { sportSel.appendChild(option(n)); });
  var canon = $('merge-canon'), dup = $('merge-dup');
  SAMPLE.forEach(function (r) { canon.appendChild(option(r.id, r.name + ' (' + r.id + ')')); dup.appendChild(option(r.id, r.name + ' (' + r.id + ')')); });
  dup.value = 'S-2';

  function renderAudit() {
    var ol = $('audit'); clear(ol);
    ledger.audit().forEach(function (e) { ol.appendChild(el('li', { text: e.at + ' | ' + e.type + ' | ' + e.actor + ' | ' + (e.entity || '') })); });
  }

  function renderClaims() {
    var box = $('claims'), list = ledger.requests(); clear(box);
    $('claims-empty').hidden = list.length > 0;
    list.forEach(function (r) {
      var card = el('div', { 'class': 'card' });
      card.appendChild(pill(r.status));
      card.appendChild(el('h3', { text: r.name + ' requests ' + r.recordId + ' (' + r.accountId + ', ' + r.relationship + ')' }));
      if (r.reasons.length) card.appendChild(el('ul', {}, r.reasons.map(function (x) { return el('li', { text: x }); })));
      if (r.status === CM.STATUS.PENDING || r.status === CM.STATUS.REVIEW) {
        var reason = el('input', { type: 'text', 'aria-label': 'Decision reason', placeholder: 'Reason (required)' });
        var ack = el('input', { type: 'checkbox' });
        var msg = el('p', { role: 'alert' });
        var decide = function (d) {
          try { ledger.decideClaim(r.id, { reviewer: REVIEWER, decision: d, reason: reason.value, acknowledgeReview: ack.checked }); renderAll(); }
          catch (e) { msg.textContent = e.message; }
        };
        card.appendChild(reason);
        if (r.status === CM.STATUS.REVIEW) card.appendChild(el('label', {}, [ack, el('span', { text: ' I reviewed every reason listed above' })]));
        var ok = el('button', { 'class': 'button button-primary', type: 'button', text: 'Approve' }); ok.addEventListener('click', function () { decide('approve'); });
        var no = el('button', { 'class': 'button button-secondary', type: 'button', text: 'Reject' }); no.addEventListener('click', function () { decide('reject'); });
        card.appendChild(ok); card.appendChild(no); card.appendChild(msg);
      } else if (r.decisionReason) card.appendChild(el('p', { text: 'Decision by ' + r.decidedBy + ': ' + r.decisionReason }));
      box.appendChild(card);
    });
  }

  $('find-form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var f = ev.target.elements, cards = $('find-cards'); clear(cards);
    var q = { name: f.name.value, grad: f.grad.value, sport: f.sport.value, school: f.school.value, state: f.state.value };
    var res = ledger.findMatches(q), msg = $('find-msg');
    if (res.status === 'no-match') { msg.textContent = 'We could not find a matching profile. Review your information or create a new profile.'; return; }
    if (res.status === 'narrow') { msg.textContent = 'We found several possible profiles. Add your school, team or state to narrow the results.'; return; }
    msg.textContent = 'We found a possible athlete profile. Requesting a claim does not give you access or change the profile.';
    res.cards.forEach(function (c) {
      var card = el('div', { 'class': 'card' }, [el('h3', { text: c.name }), el('p', { text: 'Class of ' + c.grad + ' | ' + c.sport + ' | ' + c.positions + ' | ' + (c.school || 'School Not Listed') + ' | ' + (c.state || 'State Not Listed') })]);
      var b = el('button', { 'class': 'button button-primary', type: 'button', text: 'Request To Claim' });
      b.addEventListener('click', function () {
        try { ledger.submitClaim({ recordId: c.id, accountId: f.account.value, relationship: f.relationship.value, name: f.name.value, grad: f.grad.value }); msg.textContent = 'Claim request submitted. The profile has not been changed.'; renderAll(); }
        catch (e) { msg.textContent = e.message; }
      });
      card.appendChild(b); cards.appendChild(card);
    });
  });

  $('merge-compare').addEventListener('click', function () {
    var box = $('merge-plan'), msg = $('merge-msg'); clear(box); msg.textContent = '';
    var plan;
    try { plan = ledger.previewMerge(canon.value, dup.value); } catch (e) { msg.textContent = e.message; return; }
    if (plan.blocked.length) { msg.textContent = plan.blocked.join(' '); return; }
    box.appendChild(pill(plan.status));
    var rows = [], selects = {}, accountSel = null;
    var LABEL = { same: 'Same', keep: 'Keeps canonical value', fill: 'Fills an empty value', conflict: 'Conflict: choose one' };
    plan.fields.forEach(function (f) {
      var cell = el('td', { text: LABEL[f.outcome] + (f.canonicalVerified ? ' (canonical verified: cannot be overwritten)' : '') });
      if (f.outcome === 'conflict') {
        var s = el('select', { 'aria-label': 'Resolve ' + f.field }, [option('', 'Choose'), option('keep-canonical', 'Keep canonical'), option('use-duplicate', 'Use duplicate')]);
        selects[f.field] = s; cell = el('td', {}, [s]);
      }
      rows.push(el('tr', {}, [el('td', { text: f.field }), el('td', { text: f.canonical == null ? 'Not Listed' : String(f.canonical) }), el('td', { text: f.duplicate == null ? 'Not Listed' : String(f.duplicate) }), cell]));
    });
    box.appendChild(el('div', { 'class': 'table-wrap' }, [el('table', {}, [el('thead', {}, [el('tr', {}, ['Field', 'Canonical', 'Duplicate', 'Outcome'].map(function (h) { return el('th', { text: h }); }))]), el('tbody', {}, rows)])]));
    if (plan.accountMove) {
      accountSel = el('select', { 'aria-label': 'Account link' }, [option('', 'Choose'), option('move-to-canonical', 'Move account link to canonical'), option('leave-unlinked', 'Leave canonical unlinked')]);
      box.appendChild(el('label', {}, [el('span', { text: 'The duplicate is linked to an account. ' }), accountSel]));
    }
    var reason = el('input', { type: 'text', 'aria-label': 'Merge reason', placeholder: 'Reason (required)' });
    var go = el('button', { 'class': 'button button-primary', type: 'button', text: 'Approve Merge' });
    go.addEventListener('click', function () {
      var decisions = {}; Object.keys(selects).forEach(function (k) { decisions[k] = selects[k].value; }); if (accountSel) decisions.accountLink = accountSel.value;
      try { ledger.approveMerge(canon.value, dup.value, { reviewer: REVIEWER, reason: reason.value, decisions: decisions }); clear(box); msg.textContent = 'Merge approved and recorded in the audit log. ' + dup.value + ' now redirects to ' + canon.value + '.'; renderAll(); }
      catch (e) { msg.textContent = e.message; }
    });
    box.appendChild(reason); box.appendChild(go);
  });

  function renderAll() { renderClaims(); renderAudit(); }
  renderAll();
})();
