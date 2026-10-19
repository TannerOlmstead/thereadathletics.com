/* Claim / duplicate review rules, per-sport handedness and regression guards.
   Run: JSDOM_PATH=... node claim-merge.tests.js  (page and config checks are skipped with a message when jsdom is unavailable). */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert');
const CM = require('./claim-merge.js');
const S = CM.STATUS;
const ADMIN = { id: 'admin-1', role: 'admin' };
const rec = (o) => Object.assign({ id: 'R1', name: 'Jordan Smith', grad: 2027, sport: 'Baseball', pos: 'SS', sec: '', state: 'TX', school: 'Example High', verified: {}, handedness: {}, linkedAccount: null, status: 'Active', email: 'private@example.com', dob: '2009-01-01' }, o);
const ledger = (rs) => CM.createLedger(rs || [rec()], { now: () => new Date('2026-01-01T00:00:00Z') });
const throwsMsg = (fn, re, label) => assert.throws(fn, re, label);
let n = 0; const ok = (m) => { n++; console.log('ok -', m); };

/* ---- Search / recognition cards ---- */
{
  const l = ledger([rec(), rec({ id: 'R2', name: 'Other Person' })]);
  const r = l.findMatches({ name: 'jordan a. smith', grad: '2027', sport: 'Baseball', state: 'tx' });
  assert.strictEqual(r.status, 'matches'); assert.strictEqual(r.cards.length, 1);
  assert.deepStrictEqual(Object.keys(r.cards[0]).sort(), ['grad', 'id', 'level', 'name', 'positions', 'school', 'sport', 'state']);
  assert.ok(!JSON.stringify(r).includes('private@example.com') && !JSON.stringify(r).includes('2009'), 'no contact data or birth date in results');
  assert.strictEqual(l.findMatches({ name: 'Jordan Smith' }).status, 'no-match'); // a name alone never shows a profile
  assert.strictEqual(l.findMatches({ name: 'Jordan Smith', grad: 2027 }).status, 'no-match');
  const many = ledger([1, 2, 3, 4].map((i) => rec({ id: 'M' + i })));
  assert.strictEqual(many.findMatches({ name: 'Jordan Smith', grad: 2027, sport: 'Baseball' }).status, 'narrow');
  ok('search shows limited recognition cards only, never on a name alone, and narrows above 3 results');
}

/* ---- Claim workflow ---- */
{
  const l = ledger();
  const c = l.submitClaim({ recordId: 'R1', accountId: 'a1', relationship: 'Athlete', name: 'Jordan Smith', grad: 2027 });
  assert.strictEqual(c.status, S.PENDING);
  assert.strictEqual(l.getRecord('R1').linkedAccount, null, 'a request alone links nothing');
  throwsMsg(() => l.submitClaim({ recordId: 'R1', accountId: 'a1', relationship: 'Athlete', name: 'Jordan Smith' }), /already exists/);
  throwsMsg(() => l.submitClaim({ recordId: 'R1', relationship: 'Athlete', name: 'x' }), /signed-in/);
  throwsMsg(() => l.submitClaim({ recordId: 'R1', accountId: 'a9', relationship: 'Coach' }), /relationship/);
  throwsMsg(() => l.submitClaim({ recordId: 'nope', accountId: 'a9', relationship: 'Athlete' }), /not found/);
  throwsMsg(() => l.decideClaim(c.id, { reviewer: { id: 'u', role: 'athlete' }, decision: 'approve', reason: 'x' }), /administrator/);
  throwsMsg(() => l.decideClaim(c.id, { reviewer: ADMIN, decision: 'approve', reason: ' ' }), /reason is required/);
  throwsMsg(() => l.decideClaim(c.id, { reviewer: ADMIN, decision: 'maybe', reason: 'x' }), /approve or reject/);
  const before = JSON.stringify(Object.assign(l.getRecord('R1'), { linkedAccount: null }));
  const d = l.decideClaim(c.id, { reviewer: ADMIN, decision: 'approve', reason: 'Verified by school' });
  assert.strictEqual(d.status, S.APPROVED); assert.strictEqual(l.getRecord('R1').linkedAccount, 'a1');
  assert.strictEqual(JSON.stringify(Object.assign(l.getRecord('R1'), { linkedAccount: null })), before, 'approval changes no athlete data');
  throwsMsg(() => l.decideClaim(c.id, { reviewer: ADMIN, decision: 'reject', reason: 'x' }), /already been decided/);
  ok('claim: pending -> approved by an administrator with a reason; links only; no data changed; cannot be decided twice');
}
{
  const l = ledger();
  assert.strictEqual(l.submitClaim({ recordId: 'R1', accountId: 'a1', relationship: 'Athlete', name: 'Someone Else', grad: 2027 }).status, S.REVIEW, 'name mismatch');
  const l2 = ledger(); assert.strictEqual(l2.submitClaim({ recordId: 'R1', accountId: 'a1', relationship: 'Athlete', name: 'Jordan Smith', grad: 2030 }).status, S.REVIEW, 'grad mismatch');
  const l3 = ledger(); assert.strictEqual(l3.submitClaim({ recordId: 'R1', accountId: 'a1', relationship: 'Parent or Legal Guardian', name: 'Jordan Smith', grad: 2027 }).status, S.REVIEW, 'guardian claim');
  const l4 = ledger([rec({ linkedAccount: 'other' })]); assert.strictEqual(l4.submitClaim({ recordId: 'R1', accountId: 'a1', relationship: 'Athlete', name: 'Jordan Smith', grad: 2027 }).status, S.REVIEW, 'already linked');
  const l5 = ledger(); const a = l5.submitClaim({ recordId: 'R1', accountId: 'a1', relationship: 'Athlete', name: 'Jordan Smith', grad: 2027 }); const b = l5.submitClaim({ recordId: 'R1', accountId: 'a2', relationship: 'Athlete', name: 'Jordan Smith', grad: 2027 });
  assert.strictEqual(b.status, S.REVIEW); assert.ok(l5.requests().every((r) => r.status === S.REVIEW), 'competing claims both need review');
  throwsMsg(() => l5.decideClaim(a.id, { reviewer: ADMIN, decision: 'approve', reason: 'ok' }), /needs review/);
  assert.strictEqual(l5.decideClaim(a.id, { reviewer: ADMIN, decision: 'approve', reason: 'ok', acknowledgeReview: true }).status, S.APPROVED);
  throwsMsg(() => l5.decideClaim(b.id, { reviewer: ADMIN, decision: 'approve', reason: 'ok', acknowledgeReview: true }), /already linked/);
  assert.strictEqual(l5.decideClaim(b.id, { reviewer: ADMIN, decision: 'reject', reason: 'Duplicate claim' }).status, S.REJECTED);
  ok('claim: ambiguous or conflicting claims are Review Required and need explicit acknowledgement; a linked profile cannot be taken');
}

/* ---- Merge ---- */
const pair = () => ledger([
  rec({ id: 'A', name: 'Jordan Smith', sec: '2B', verified: { name: true }, handedness: { bats: 'R', throws: 'R' } }),
  rec({ id: 'B', name: 'Jordan A. Smith', sec: '3B', pos: 'SS', school: '', verified: { school: true }, handedness: { bats: 'L' } })
]);
{
  const l = pair(), plan = l.previewMerge('A', 'B'), by = (f) => plan.fields.find((x) => x.field === f);
  assert.strictEqual(plan.status, S.REVIEW);
  assert.strictEqual(by('name').outcome, 'conflict'); assert.strictEqual(by('sec').outcome, 'conflict'); assert.strictEqual(by('pos').outcome, 'same');
  assert.strictEqual(by('school').outcome, 'keep'); assert.strictEqual(by('handedness.bats').outcome, 'conflict'); assert.strictEqual(by('handedness.throws').outcome, 'keep');
  assert.strictEqual(l.records().find((r) => r.id === 'B').status, 'Active', 'previewing changes nothing');
  throwsMsg(() => l.approveMerge('A', 'B', { reviewer: { id: 'x', role: 'coach' }, reason: 'r', decisions: {} }), /administrator/);
  throwsMsg(() => l.approveMerge('A', 'B', { reviewer: ADMIN, reason: '', decisions: {} }), /reason is required/);
  throwsMsg(() => l.approveMerge('A', 'B', { reviewer: ADMIN, reason: 'r', decisions: {} }), /Decide how to resolve/);
  throwsMsg(() => l.approveMerge('A', 'B', { reviewer: ADMIN, reason: 'r', decisions: { name: 'use-duplicate', sec: 'keep-canonical', 'handedness.bats': 'keep-canonical' } }), /verified on the canonical record/);
  throwsMsg(() => l.approveMerge('A', 'A', { reviewer: ADMIN, reason: 'r', decisions: {} }), /itself/);
  assert.strictEqual(l.audit().length, 0, 'failed merges write no audit entry and change nothing');
  assert.ok(l.records().every((r) => r.status === 'Active'));
  const res = l.approveMerge('A', 'B', { reviewer: ADMIN, reason: 'Same athlete', decisions: { name: 'keep-canonical', sec: 'use-duplicate', 'handedness.bats': 'keep-canonical' } });
  assert.strictEqual(res.canonical.name, 'Jordan Smith'); assert.strictEqual(res.canonical.sec, '3B'); assert.strictEqual(res.canonical.handedness.bats, 'R');
  assert.strictEqual(res.canonical.school, 'Example High', 'verified/filled values are not blanked'); assert.strictEqual(res.canonical.verified.name, true);
  assert.strictEqual(res.archived.status, 'Merged'); assert.strictEqual(res.archived.mergedInto, 'A');
  assert.strictEqual(l.getRecord('B').id, 'A', 'old id redirects to canonical');
  assert.strictEqual(l.records().length, 2, 'nothing is deleted');
  const e = l.audit()[0];
  assert.strictEqual(e.type, 'merge_approved'); assert.strictEqual(e.actor, 'admin-1'); assert.strictEqual(e.details.before.duplicate.name, 'Jordan A. Smith');
  assert.strictEqual(e.details.after.duplicate.status, 'Merged'); assert.ok(e.details.decisions.some((d) => d.field === 'sec' && d.choice === 'use-duplicate'));
  throwsMsg(() => { e.type = 'x'; }, TypeError); throwsMsg(() => { e.details.reason = 'x'; }, TypeError);
  throwsMsg(() => l.previewMerge('A', 'B'), /already merged/);
  ok('merge: reviewer decides every conflict, verified values are never overwritten, nothing deleted, redirect and immutable audit with snapshots');
}
{
  const l = ledger([rec({ id: 'A', linkedAccount: 'x' }), rec({ id: 'B', linkedAccount: 'y' })]);
  assert.ok(l.previewMerge('A', 'B').blocked.length); throwsMsg(() => l.approveMerge('A', 'B', { reviewer: ADMIN, reason: 'r', decisions: {} }), /different accounts/);
  const m = ledger([rec({ id: 'A' }), rec({ id: 'B', linkedAccount: 'y' })]); assert.strictEqual(m.previewMerge('A', 'B').accountMove, true);
  throwsMsg(() => m.approveMerge('A', 'B', { reviewer: ADMIN, reason: 'r', decisions: {} }), /account link/);
  assert.strictEqual(m.approveMerge('A', 'B', { reviewer: ADMIN, reason: 'r', decisions: { accountLink: 'leave-unlinked' } }).canonical.linkedAccount, null);
  ok('merge: records linked to different accounts are blocked; moving an account link is an explicit decision');
}
{
  const l = ledger([rec({ id: 'A', pos: '' }), rec({ id: 'B', pos: 'OF', verified: { pos: true } })]);
  const r = l.approveMerge('A', 'B', { reviewer: ADMIN, reason: 'r', decisions: {} });
  assert.strictEqual(r.canonical.pos, 'OF'); assert.strictEqual(r.canonical.verified.pos, true);
  const z = ledger([rec({ id: 'A', grad: null }), rec({ id: 'B', grad: null })]).previewMerge('A', 'B').fields.find((f) => f.field === 'grad');
  assert.strictEqual(z.outcome, 'same'); assert.strictEqual(z.canonical, null, 'missing data stays null, never 0');
  ok('merge: empty canonical fields are filled from the duplicate (with its verification); missing data stays missing');
}

/* ---- Regression guards: positions, units, pricing, benchmark config stay as they are ---- */
{
  const mine = ['claim-merge.js', 'claim-review.js', 'claim-review.html', 'docs/CLAIM_MERGE_BACKEND_REQUIREMENTS.md'].map((f) => [f, fs.readFileSync(path.join(__dirname, f), 'utf8')]);
  mine.forEach(([f, t]) => {
    assert.ok(!/\b(LF|CF|RF|DH|UT)\b/.test(t), f + ' has no LF/CF/RF/DH/UT position');
    assert.ok(!/\$\s?\d|founding rate|A\+\+/i.test(t), f + ' has no pricing, founding rate or A++');
    assert.ok(!/AVG_EV|MAX_EV|SIXTY_TIME|THROW_VELO|POP_TIME|benchmark/i.test(t.replace('benchmarks-config', '')), f + ' defines no benchmark values');
    assert.ok(!/eval\(|innerHTML|localStorage|fetch\(|XMLHttpRequest/.test(t), f + ' has no eval, innerHTML, storage or network calls');
  });
  ok('regression: new files add no positions, pricing, benchmark values, storage or network code');
}

/* ---- Browser-facing checks (jsdom over http) ---- */
(async () => {
  let jsdom; try { jsdom = require(process.env.JSDOM_PATH || 'jsdom'); } catch (e) { console.log('SKIPPED page-level claim/handedness checks: jsdom not installed'); return finish(); }
  const J = (x) => JSON.parse(JSON.stringify(x));
  const { JSDOM, VirtualConsole } = jsdom, http = require('http');
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
  const server = http.createServer((q, res) => { const f = path.join(__dirname, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { res.statusCode = 404; res.end(); } else { res.setHeader('Content-Type', types[path.extname(f)] || 'text/plain'); res.end(b); } }); });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const open = (u, wait) => JSDOM.fromURL(base + u, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: new VirtualConsole() }).then((d) => new Promise((r) => setTimeout(() => r(d), wait || 900)));
  try {
    // Handedness config
    const h = await open('/claim-review.html'), T = h.window.TheReadSports;
    assert.deepStrictEqual(J(T.handednessOptions('baseball', 'bats')), ['R', 'L', 'S']); assert.deepStrictEqual(J(T.handednessOptions('baseball', 'throws')), ['R', 'L']);
    assert.deepStrictEqual(J(T.validateHandedness('baseball', { bats: 'S', throws: 'L' })), []);
    assert.strictEqual(T.validateHandedness('baseball', { throws: 'S' }).length, 1, 'Throws cannot be S');
    assert.strictEqual(T.validateHandedness('baseball', { bats: 'X' }).length, 1);
    assert.deepStrictEqual(J(T.validateHandedness('baseball', {})), [], 'blank is allowed and never defaulted');
    assert.strictEqual(T.formatHandedness('baseball', { bats: 'R', throws: 'L' }), 'R/L'); assert.strictEqual(T.formatHandedness('baseball', { bats: 'S' }), 'S/Not Listed'); assert.strictEqual(T.formatHandedness('baseball', {}), 'Not Listed/Not Listed');
    T.list.filter((s) => s.id !== 'baseball').forEach((s) => {
      assert.strictEqual(s.handedness.status, 'Requires Founder Decision', s.id); assert.deepStrictEqual(J(s.handedness.fields), [], s.id + ' invents no choices');
      assert.deepStrictEqual(J(T.handednessOptions(s.id, 'bats')), []); assert.strictEqual(T.formatHandedness(s.id, { bats: 'R' }), null);
      assert.deepStrictEqual(J(T.validateHandedness(s.id, {})), []); assert.strictEqual(T.validateHandedness(s.id, { bats: 'R' }).length, 1, s.id + ' rejects unapproved handedness');
    });
    assert.deepStrictEqual(J(T.validateHandedness('curling', {})), ['Sport is not supported.']);
    assert.deepStrictEqual(J(T.get('baseball').positions), ['P', 'C', '1B', '2B', '3B', 'SS', 'OF']); assert.strictEqual(T.list.length, 8);
    ok('handedness config: baseball Bats/Throws unchanged; every other sport is an unapproved stub with no invented choices; positions unchanged');
    // Existing coach add form still offers the same baseball options (now read from the config)
    const co = await open('/coach-master-database.html?demo=1', 1500), doc = co.window.document;
    const sel = (nm) => [...doc.querySelectorAll('select[name="' + nm + '"] option')].map((o) => o.value);
    assert.deepStrictEqual(sel('bats'), ['', 'R', 'L', 'S']); assert.deepStrictEqual(sel('throws'), ['', 'R', 'L']);
    ok('coach add-player form: Bats R/L/S and Throws R/L unchanged');
    // Preview page behavior
    const w = h.window, d = w.document, ev = (t) => new w.Event(t, { bubbles: true, cancelable: true });
    const fill = (nm, v) => { d.querySelector('#find-form [name="' + nm + '"]').value = v; };
    fill('name', 'Jordan Smith'); fill('grad', '2027'); fill('sport', 'Baseball'); fill('state', 'TX'); d.getElementById('find-form').dispatchEvent(ev('submit'));
    const cards = d.querySelectorAll('#find-cards .card'); assert.strictEqual(cards.length, 2, 'two fictional Jordan Smith profiles');
    assert.ok(!/@|dob|private/i.test(d.getElementById('find-cards').textContent), 'cards show no private data');
    cards[0].querySelector('button').click();
    assert.ok(/not been changed/.test(d.getElementById('find-msg').textContent));
    let claim = d.querySelector('#claims .card'); assert.ok(claim.querySelector('.pill').textContent === 'Pending' || claim.querySelector('.pill').textContent === 'Review Required');
    const stat = claim.querySelector('.pill').textContent;
    const btn = (c, t) => [...c.querySelectorAll('button')].find((b) => b.textContent === t);
    btn(claim, 'Approve').click(); assert.ok(/reason is required/i.test(claim.querySelector('[role="alert"]').textContent), 'approve without a reason is refused');
    claim.querySelector('input[type="text"]').value = 'Verified'; if (stat === 'Review Required') claim.querySelector('input[type="checkbox"]').checked = true; btn(claim, 'Approve').click();
    assert.strictEqual(d.querySelector('#claims .card .pill').textContent, 'Approved');
    assert.ok(d.querySelectorAll('#audit li').length >= 2, 'audit log lists the request and the decision');
    fill('name', 'Taylor Brooks'); fill('grad', '2026'); fill('state', 'TX'); fill('school', 'Sample Prep'); d.getElementById('find-form').dispatchEvent(ev('submit'));
    d.querySelector('#find-cards button').click();
    assert.strictEqual(d.querySelectorAll('#claims .card')[1].querySelector('.pill').textContent, 'Review Required', 'claiming a linked profile needs review');
    ok('preview page: search cards, claim request, reason required, approval, review-required label, audit log');
    d.getElementById('merge-compare').click();
    const msg = d.getElementById('merge-msg'), plan = d.getElementById('merge-plan');
    assert.ok(plan.querySelector('table'), 'compare table renders'); assert.ok(plan.querySelectorAll('select').length >= 3);
    btn(plan, 'Approve Merge').click(); assert.ok(/reason is required/i.test(msg.textContent), 'merge needs a reason');
    plan.querySelector('input[type="text"]').value = 'Same athlete'; btn(plan, 'Approve Merge').click(); assert.ok(/Decide how to resolve/.test(msg.textContent), 'merge needs every conflict decided: ' + msg.textContent);
    assert.strictEqual(d.querySelectorAll('#audit li').length >= 2, true);
    [...plan.querySelectorAll('select')].forEach((s) => { s.value = 'keep-canonical'; });
    plan.querySelector('input[type="text"]').value = 'Same athlete'; btn(plan, 'Approve Merge').click();
    assert.ok(/Merge approved/.test(msg.textContent), msg.textContent);
    assert.ok([...d.querySelectorAll('#audit li')].some((li) => /merge_approved/.test(li.textContent)));
    ok('preview page: compare, undecided conflicts refused, merge approved with reason and audited');
    h.window.close(); co.window.close();
  } finally { server.close(); }
  finish();
})().catch((e) => { console.error(e); process.exit(1); });
function finish() { console.log('\nAll ' + n + ' claim/merge/handedness checks passed.'); }
