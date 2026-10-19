/* THE READ Athletics - athlete profile claim / duplicate-merge rules (front-end interface logic).
   This is NOT a backend. State lives only in the ledger object the page creates and is lost on reload.
   Authorization, identity verification, persistence, locking and immutable audit storage MUST be enforced server-side
   (see docs/CLAIM_MERGE_BACKEND_REQUIREMENTS.md). Rules enforced here so the interface can never suggest otherwise:
   - A claim never changes athlete data. Approval only links an account to a record, and only after human review.
   - Ambiguous or conflicting claims are "Review Required", never auto-approved.
   - A merge is never automatic. A reviewer picks the canonical record and decides every conflicting field.
   - Verified values are never overwritten by a merge.
   - Every request, decision and merge writes an append-only audit entry. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TheReadClaimMerge = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var STATUS = { PENDING: 'Pending', APPROVED: 'Approved', REJECTED: 'Rejected', REVIEW: 'Review Required' };
  var OPEN = [STATUS.PENDING, STATUS.REVIEW];
  var RELATIONSHIPS = ['Athlete', 'Parent or Legal Guardian', 'Authorized Representative'];
  var MAX_CARDS = 3;
  // Fields compared during a merge. handedness.* is per sport and only exists for sports whose handedness is approved.
  var MERGE_FIELDS = ['name', 'grad', 'sport', 'pos', 'sec', 'state', 'school', 'handedness.bats', 'handedness.throws'];

  function fail(m) { throw new Error(m); }
  function norm(s) { return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); }
  // First + last token only, so "Jordan A. Smith" and "Jordan Smith" compare equal.
  function nameKey(s) { var t = norm(s).split(' '); return t.length > 1 ? t[0] + ' ' + t[t.length - 1] : (t[0] || ''); }
  function blank(v) { return v === null || v === undefined || v === ''; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function getField(r, f) { var p = f.split('.'); return p.length === 2 ? (r[p[0]] ? r[p[0]][p[1]] : undefined) : r[f]; }
  function setField(r, f, v) { var p = f.split('.'); if (p.length === 2) { r[p[0]] = r[p[0]] || {}; r[p[0]][p[1]] = v; } else r[f] = v; }
  function isVerified(r, f) { return !!(r.verified && r.verified[f]); }
  function isReviewer(u) { return !!(u && u.id && u.role === 'admin'); }

  // The ONLY fields a search may reveal. Never contact data, birth date, scores, notes or private institution data.
  function recognitionCard(r) {
    return { id: r.id, name: r.name, grad: r.grad, sport: r.sport, positions: r.pos + (r.sec ? '/' + r.sec : ''), school: r.school || null, state: r.state || null };
  }

  function matchLevel(q, r) {
    if (r.status === 'Merged' || nameKey(q.name) !== nameKey(r.name)) return 'No Match';
    var n = 0;
    if (q.grad && Number(q.grad) === Number(r.grad)) n++;
    if (q.sport && q.sport === r.sport) n++;
    if (q.school && norm(q.school) === norm(r.school)) n++;
    if (q.state && norm(q.state) === norm(r.state)) n++;
    if (q.pos && q.pos === r.pos) n++;
    // A name alone, or a name plus one weak field, is never enough to show a profile.
    return n >= 3 ? 'Strong Possible Match' : n === 2 ? 'Possible Match' : n === 1 ? 'Weak Match' : 'No Match';
  }

  function findPossibleMatches(query, records) {
    var hits = records.filter(function (r) { var l = matchLevel(query, r); return l === 'Strong Possible Match' || l === 'Possible Match'; });
    if (!hits.length) return { status: 'no-match', cards: [] };
    if (hits.length > MAX_CARDS) return { status: 'narrow', cards: [] };
    return { status: 'matches', cards: hits.map(function (r) { var c = recognitionCard(r); c.level = matchLevel(query, r); return c; }) };
  }

  // Compare two records field by field. Nothing is applied; this only describes what a reviewer must decide.
  function planMerge(canonical, duplicate) {
    if (!canonical || !duplicate) fail('Two records are required.');
    if (canonical.id === duplicate.id) fail('A record cannot be merged into itself.');
    if (canonical.status === 'Merged' || duplicate.status === 'Merged') fail('A record that was already merged cannot be merged again.');
    var blocked = [];
    var la = canonical.linkedAccount || null, lb = duplicate.linkedAccount || null;
    if (la && lb && la !== lb) blocked.push('Both records are linked to different accounts. Resolve the account ownership first.');
    var fields = MERGE_FIELDS.map(function (f) {
      var a = getField(canonical, f), b = getField(duplicate, f), outcome;
      if (blank(a) && blank(b)) outcome = 'same';
      else if (!blank(a) && !blank(b) && String(a) === String(b)) outcome = 'same';
      else if (blank(b)) outcome = 'keep';
      else if (blank(a)) outcome = 'fill';
      else outcome = 'conflict';
      return { field: f, canonical: blank(a) ? null : a, duplicate: blank(b) ? null : b, canonicalVerified: isVerified(canonical, f), duplicateVerified: isVerified(duplicate, f), outcome: outcome };
    });
    // Moving an account link is always an explicit reviewer decision.
    var accountMove = !la && !!lb;
    return { status: STATUS.REVIEW, canonicalId: canonical.id, duplicateId: duplicate.id, fields: fields, accountMove: accountMove, blocked: blocked };
  }

  function createLedger(initialRecords, opts) {
    var options = opts || {};
    var now = options.now || function () { return new Date(); };
    var counter = 0;
    var nextId = function (p) { return options.idGen ? options.idGen(p) : p + '-' + (++counter); };
    var records = clone(initialRecords || []);
    var requests = [];
    var audit = [];

    function log(type, actor, entity, details) {
      var e = Object.freeze({ id: nextId('evt'), at: now().toISOString(), type: type, actor: actor || 'system', entity: entity || null, details: Object.freeze(clone(details || {})) });
      audit.push(e);
      return e;
    }
    function byId(id) { return records.filter(function (r) { return r.id === id; })[0] || null; }
    // A merged record keeps resolving to the record it was merged into, so old links never break.
    function resolve(id) { var r = byId(id), seen = {}; while (r && r.status === 'Merged' && r.mergedInto && !seen[r.id]) { seen[r.id] = 1; r = byId(r.mergedInto); } return r; }
    function reqById(id) { return requests.filter(function (r) { return r.id === id; })[0] || fail('Claim request not found.'); }

    function reasonsFor(claimant, record) {
      var why = [];
      if (record.linkedAccount && record.linkedAccount !== claimant.accountId) why.push('This profile is already linked to a different account.');
      if (nameKey(claimant.name) !== nameKey(record.name)) why.push('The claimant name does not match the profile name.');
      if (claimant.grad && !blank(record.grad) && Number(claimant.grad) !== Number(record.grad)) why.push('The claimant grad year does not match the profile.');
      if (claimant.relationship !== 'Athlete') why.push('A parent, guardian or representative claim needs verification of that relationship. Requires Founder Decision.');
      return why;
    }

    function submitClaim(input) {
      var c = input || {};
      if (!c.accountId) fail('A signed-in account is required.');
      if (RELATIONSHIPS.indexOf(c.relationship) < 0) fail('Select your relationship to the athlete.');
      var rec = resolve(c.recordId);
      if (!rec) fail('Athlete profile not found.');
      if (requests.some(function (r) { return r.accountId === c.accountId && r.recordId === rec.id && OPEN.concat(STATUS.APPROVED).indexOf(r.status) >= 0; })) fail('A claim request already exists for this profile.');
      var why = reasonsFor(c, rec);
      var req = { id: nextId('claim'), recordId: rec.id, accountId: c.accountId, name: c.name || '', grad: c.grad || null, relationship: c.relationship, status: why.length ? STATUS.REVIEW : STATUS.PENDING, reasons: why, submittedAt: now().toISOString(), decidedAt: null, decidedBy: null, decisionReason: null };
      // Two different accounts asking for one profile is a conflict a person must resolve.
      requests.forEach(function (o) {
        if (o.recordId === rec.id && o.accountId !== c.accountId && OPEN.indexOf(o.status) >= 0) {
          if (req.reasons.indexOf('Another account has an open claim for this profile.') < 0) req.reasons.push('Another account has an open claim for this profile.');
          req.status = STATUS.REVIEW;
          if (o.status !== STATUS.REVIEW) { o.status = STATUS.REVIEW; o.reasons.push('Another account has an open claim for this profile.'); log('claim_flagged', 'system', o.id, { reason: 'competing claim' }); }
        }
      });
      requests.push(req);
      log('claim_requested', c.accountId, req.id, { recordId: rec.id, status: req.status, reasons: req.reasons });
      return clone(req);
    }

    function decideClaim(id, d) {
      var x = d || {}, req = reqById(id);
      if (!isReviewer(x.reviewer)) fail('Only an administrator can decide a claim.');
      if (OPEN.indexOf(req.status) < 0) fail('This claim has already been decided.');
      if (x.decision !== 'approve' && x.decision !== 'reject') fail('Decision must be approve or reject.');
      if (!String(x.reason || '').trim()) fail('A reason is required.');
      var rec = resolve(req.recordId);
      if (x.decision === 'approve') {
        if (!rec || rec.status === 'Merged') fail('The profile is no longer available to claim.');
        if (rec.linkedAccount && rec.linkedAccount !== req.accountId) fail('The profile is already linked to a different account.');
        if (req.status === STATUS.REVIEW && !x.acknowledgeReview) fail('This claim needs review. Confirm you reviewed every listed reason.');
        rec.linkedAccount = req.accountId; // link only: no athlete data is changed or overwritten
      }
      req.status = x.decision === 'approve' ? STATUS.APPROVED : STATUS.REJECTED;
      req.decidedAt = now().toISOString(); req.decidedBy = x.reviewer.id; req.decisionReason = String(x.reason).trim();
      log('claim_' + x.decision, x.reviewer.id, req.id, { recordId: req.recordId, accountId: req.accountId, reason: req.decisionReason, reviewedReasons: req.reasons });
      return clone(req);
    }

    // decisions: { field: 'keep-canonical' | 'use-duplicate' } for every conflicting field (and 'accountLink' when moving a link).
    function approveMerge(canonicalId, duplicateId, d) {
      var x = d || {};
      if (!isReviewer(x.reviewer)) fail('Only an administrator can approve a merge.');
      if (!String(x.reason || '').trim()) fail('A reason is required.');
      var canon = byId(canonicalId), dup = byId(duplicateId);
      var plan = planMerge(canon, dup);
      if (plan.blocked.length) fail(plan.blocked[0]);
      var decisions = x.decisions || {}, before = { canonical: clone(canon), duplicate: clone(dup) }, applied = [];
      var next = clone(canon);
      next.verified = next.verified || {};
      plan.fields.forEach(function (f) {
        var choice = decisions[f.field];
        if (f.outcome === 'conflict') {
          if (choice !== 'keep-canonical' && choice !== 'use-duplicate') fail('Decide how to resolve "' + f.field + '".');
          if (choice === 'use-duplicate' && f.canonicalVerified) fail('"' + f.field + '" is verified on the canonical record and cannot be overwritten by a merge.');
          if (choice === 'use-duplicate') { setField(next, f.field, f.duplicate); if (f.duplicateVerified) next.verified[f.field] = dup.verified[f.field]; else delete next.verified[f.field]; }
          applied.push({ field: f.field, outcome: 'conflict', choice: choice, from: f.canonical, to: choice === 'use-duplicate' ? f.duplicate : f.canonical });
        } else if (f.outcome === 'fill') {
          setField(next, f.field, f.duplicate); if (f.duplicateVerified) next.verified[f.field] = dup.verified[f.field];
          applied.push({ field: f.field, outcome: 'fill', choice: 'fill-empty', from: null, to: f.duplicate });
        }
      });
      if (plan.accountMove) {
        if (decisions.accountLink !== 'move-to-canonical' && decisions.accountLink !== 'leave-unlinked') fail('Decide whether to move the account link to the canonical record.');
        if (decisions.accountLink === 'move-to-canonical') next.linkedAccount = dup.linkedAccount;
        applied.push({ field: 'accountLink', outcome: 'conflict', choice: decisions.accountLink });
      }
      // Replace the canonical record in place; archive the duplicate and redirect it. Nothing is deleted.
      records[records.indexOf(canon)] = next;
      dup.status = 'Merged'; dup.mergedInto = canon.id; dup.linkedAccount = plan.accountMove && decisions.accountLink === 'move-to-canonical' ? null : dup.linkedAccount;
      var entry = log('merge_approved', x.reviewer.id, canon.id, { canonicalId: canon.id, duplicateId: dup.id, reason: String(x.reason).trim(), decisions: applied, before: before, after: { canonical: clone(next), duplicate: clone(dup) } });
      return { canonical: clone(next), archived: clone(dup), audit: entry };
    }

    return {
      findMatches: function (q) { return findPossibleMatches(q || {}, records); },
      submitClaim: submitClaim, decideClaim: decideClaim,
      previewMerge: function (a, b) { return planMerge(byId(a), byId(b)); },
      approveMerge: approveMerge,
      getRecord: function (id) { var r = resolve(id); return r ? clone(r) : null; },
      records: function () { return clone(records); },
      requests: function () { return clone(requests); },
      audit: function () { return audit.slice(); }
    };
  }

  return { STATUS: STATUS, RELATIONSHIPS: RELATIONSHIPS, MERGE_FIELDS: MERGE_FIELDS, MAX_CARDS: MAX_CARDS, nameKey: nameKey, matchLevel: matchLevel, recognitionCard: recognitionCard, findPossibleMatches: findPossibleMatches, planMerge: planMerge, createLedger: createLedger };
});
