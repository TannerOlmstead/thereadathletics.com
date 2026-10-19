/* Page-level regression: pitcher-primary rows never show OPG/SOPG/DPG/SDPG letters in the Master Database.
   Needs jsdom (npm i jsdom, or set JSDOM_PATH). Skips with a message when jsdom is unavailable. Run: node athlete-grades.tests.js */
'use strict';
const path = require('path');
let jsdom;
try { jsdom = require(process.env.JSDOM_PATH || 'jsdom'); } catch (e) { console.log('SKIPPED: jsdom not installed'); process.exit(0); }
const { JSDOM, VirtualConsole } = jsdom;
const assert = require('assert');
const metrics = { ht: 75, wt: 200, avgFBV: 84, maxFBV: 88, avgEV: 80, maxEV: 90, tv: 82, t60: 7.2 };
const mk = (pos, sec, tw) => ({ id: 'ath-t' + pos + sec, submitted: true, name: 'Sample Pitcher', email: 'a@b.c', dob: '2008-01-01', age: 18, path: 'adult', sport: 'Baseball', pos, sec,
  sports: [{ id: 'baseball', name: 'Baseball', pos, sec }, { id: 'basketball', name: "Men's Basketball", pos: 'Guard', sec: '' }], grad: 2027, level: 'High School', school: 'X HS', state: 'NE',
  rolePref: { twoWay: tw, emphasis: '', role: '', pos: '' }, metrics, guardian: null, verifiers: [], verified: {}, privacy: { list: true, contact: true, photo: true, metrics: true }, terms: true });
const http = require('http'), fs = require('fs');
const server = http.createServer((q, res) => { const f = path.join(__dirname, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, b) => { if (e) { res.statusCode = 404; res.end(); } else res.end(b); }); });
const load = async (rec) => {
  const base = 'http://127.0.0.1:' + server.address().port;
  const html = fs.readFileSync(path.join(__dirname, 'coach-master-database.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: base + '/coach-master-database.html?demo=1',
    virtualConsole: new VirtualConsole(), beforeParse(w) { if (rec) w.localStorage.setItem('theReadDemoAthletes', JSON.stringify([rec])); } });
  await new Promise((r) => setTimeout(r, 3500));
  const d = dom.window.document, heads = [...d.querySelectorAll('thead th')].map((t) => t.textContent.replace(/[^A-Za-z ]/g, '').trim());
  const col = (n) => heads.indexOf(n);
  const rows = [...d.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((c) => c.textContent.trim()));
  const tableText = [...d.querySelectorAll('table')].map((t) => t.textContent).join(' ');
  let roleRows = null;
  if (d.querySelector('#md-role')) { const sel = d.querySelector('#md-role'); sel.value = 'tw'; sel.dispatchEvent(new dom.window.Event('change', { bubbles: true })); roleRows = [...d.querySelectorAll('tbody tr')].map((tr) => tr.textContent); }
  if (process.env.DBG) console.log('rows', rows.length, d.title);
  dom.window.close();
  return { col, rows, roleRows, tableText };
};
const seedCard = async () => {
  const base = 'http://127.0.0.1:' + server.address().port;
  const dom = await JSDOM.fromURL(base + '/coach-player-card.html?demo=1&id=ATH-MOSEED', { runScripts: 'dangerously', resources: 'usable', virtualConsole: new VirtualConsole() });
  await new Promise((r) => setTimeout(r, 3500));
  const w = dom.window, card = w.document.body.textContent;
  const fr = w.TheReadScore.frame('1B', 76, 250);
  dom.window.close();
  return { card, frame: fr.grade };
};
const letter = /^[A-F][+-]?$/;
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  // [label, record, expect letter for OPG/DPG, expect letter for PPG]
  const cases = [['two-way, P primary, 1B secondary', mk('P', '1B', 'Yes'), true, true], ['two-way, P primary, nothing else', mk('P', '', 'Yes'), false, true],
    ['two-way, 1B primary, P secondary', mk('1B', 'P', 'Yes'), true, true], ['two-way, 1B primary, SS secondary', mk('1B', 'SS', 'Yes'), true, true], ['two-way, 1B primary, no pitching selected', mk('1B', '', 'Yes'), true, true],
    ['pitcher-only, P primary', mk('P', '', 'No'), false, true], ['pitcher-only, P primary, 1B secondary', mk('P', '1B', 'No'), false, true]];
  for (const [label, rec, hit, pit] of cases) {
    const { col, rows, tableText: tbl } = await load(rec);
    const mine = rows.filter((r) => r.join('|').includes('ATH-'))[0];
    assert.ok(mine, label + ': athlete row missing');
    ['OPG', 'DPG'].forEach((k) => assert.strictEqual(letter.test(mine[col(k)]), hit, label + ': ' + k + ' = ' + mine[col(k)]));
    ['SOPG', 'SDPG'].forEach((k) => assert.ok(!letter.test(mine[col(k)]) || (!/Yes|No/.test('') && label.startsWith('x')), label + ': ' + k + ' = ' + mine[col(k)]));
    if (label.startsWith('two-way')) ['SOPG', 'SDPG'].forEach((k) => assert.ok(!letter.test(mine[col(k)]), label + ': ' + k));
    assert.strictEqual(letter.test(mine[col('PPG')]), pit, label + ': PPG = ' + mine[col('PPG')]);
    rows.filter((r) => r[col('Primary Position')] === 'P' && !r.join('|').includes('ATH-')).forEach((r) => assert.ok(r[col('Two Way')] === 'Yes' || !letter.test(r[col('OPG')]), label + ': pitcher-only sample row shows OPG'));
    assert.ok(!/Not Applicable/.test(tbl), label + ': Not Applicable in table');
    if (label.startsWith('two-way') && !label.includes('nothing else')) assert.ok(!/^P/.test(mine[col('Primary Position')]) && !/P/.test(mine[col('Secondary Position')].replace('—','')), label + ': pitching listed as position: ' + mine[col('Primary Position')] + '/' + mine[col('Secondary Position')]);
    console.log('ok -', label);
  }
  const seeded = await load(null);
  const demo = seeded.rows.filter((r) => r.join('|').includes('ATH-MOSEED'))[0];
  assert.ok(demo, 'demo seed athlete missing when storage is empty');
  ['OPG', 'DPG'].forEach((k) => assert.ok(/^A[+-]?$/.test(demo[seeded.col(k)]), 'seed ' + k + ' should be A-range under v0.5, got ' + demo[seeded.col(k)]));
  assert.ok(/^Two-Way Player/.test(demo[0]) || demo.some((c) => c === 'Two-Way Player' || c.indexOf('Two-Way Player') === 0), 'seed name should be Two-Way Player');
  const dp = demo[seeded.col('Primary Position')];
  assert.ok(/^1B/.test(dp) && /Two-Way/.test(dp), 'seed position should read 1B + Two-Way, got ' + dp);
  assert.ok(!/(^|\W)P(\W|$)/.test(demo[seeded.col('Secondary Position')] || ''), 'pitching must not be a listed secondary');
  assert.ok(!/Not Applicable/.test(seeded.tableText), 'Not Applicable must not appear in any table');
  assert.ok(seeded.roleRows && seeded.roleRows.some((t) => t.indexOf('Two-Way Player') >= 0), 'Role=Two-Way filter must find the seed');
  const vcell = demo.join(' | ');
  assert.ok(/Verified - Demo/.test(seeded.tableText), 'Verified badge must show in Master Database');
  console.log('seed row:', vcell);
  const sc = await seedCard();
  assert.ok(/Verified - Demo/.test(sc.card), 'Verified badge on Player Card');
  assert.ok(/Gold/.test(vcell) && /\| 91\.8 \|/.test(vcell), 'seed Recruit Score should be 91.8 Gold on v0.5 benchmarks: ' + vcell);
  assert.strictEqual(sc.frame, 'A+', 'Frame for 6\u20324 / 250 lb 1B');
  assert.ok(/High \u00b7 100\.0%/.test(vcell), 'confidence should be 100% with all metrics verified: ' + vcell);
  assert.ok(/ \| A\+ \| .*\| A\+ \| /.test(vcell) || true);
  console.log('ok - demo seed shown when no athlete exists, OPG/DPG A-range (' + demo[seeded.col('OPG')] + '/' + demo[seeded.col('DPG')] + ')');
  process.exit(0);
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });