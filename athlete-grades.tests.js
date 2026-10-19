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
    virtualConsole: new VirtualConsole(), beforeParse(w) { w.localStorage.setItem('theReadDemoAthletes', JSON.stringify([rec])); } });
  await new Promise((r) => setTimeout(r, 1500));
  const d = dom.window.document, heads = [...d.querySelectorAll('thead th')].map((t) => t.textContent.replace(/[^A-Za-z ]/g, '').trim());
  const col = (n) => heads.indexOf(n);
  const rows = [...d.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((c) => c.textContent.trim()));
  if (process.env.DBG) console.log('rows', rows.length, d.title);
  dom.window.close();
  return { col, rows };
};
const letter = /^[A-F][+-]?$/;
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  for (const [label, rec, expectP] of [['P primary, 1B secondary, two-way', mk('P', '1B', 'Yes'), true], ['P primary, no secondary', mk('P', '', 'No'), true], ['1B primary, P secondary', mk('1B', 'P', 'Yes'), false], ['1B primary, SS secondary, two-way', mk('1B', 'SS', 'Yes'), false]]) {
    const { col, rows } = await load(rec);
    const mine = rows.filter((r) => r.join('|').includes('ATH-'))[0];
    assert.ok(mine, label + ': athlete row missing');
    if (expectP) ['OPG', 'SOPG', 'DPG', 'SDPG'].forEach((k) => assert.ok(!letter.test(mine[col(k)]), label + ': ' + k + ' shows ' + mine[col(k)]));
    else ['SOPG', 'SDPG'].forEach((k) => assert.ok(!letter.test(mine[col(k)]), label + ': ' + k + ' shows ' + mine[col(k)]));
    rows.filter((r) => r[col('Primary Position')] === 'P').forEach((r) => ['OPG', 'SOPG', 'DPG', 'SDPG'].forEach((k) => assert.ok(!letter.test(r[col(k)]), label + ': pitcher row shows ' + k)));
    console.log('ok -', label);
  }
  process.exit(0);
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
