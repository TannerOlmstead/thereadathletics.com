/* Checks for the PROVISIONAL softball preview (softball-preview.html / softball-preview.js). Fixture data only. */
const assert = require('assert'), path = require('path'), http = require('http'), fs = require('fs');
const SP = require('./softball-preview.js');
let n = 0; const ok = (m) => console.log('ok - ' + m + (++n ? '' : ''));
const G = 'A+ A A- B+ B B- C+ C C-'.split(' ');
const top = (p) => ['opg', 'sopg', 'dpg', 'sdpg', 'ppg'].map((k) => p[k]).filter(Boolean).sort((a, b) => G.indexOf(a) - G.indexOf(b))[0];
const band = (g) => g.charAt(0);

assert.strictEqual(SP.PLAYERS.length, 7); ok('exactly seven fixture players');
assert.deepStrictEqual(SP.PLAYERS.map((p) => p.name), ['Ava Morgan', 'Harper Collins', 'Madison Lewis', 'Mia Reynolds', 'Sophia Turner', 'Lily Anderson', 'Brooke Davis']);
const bands = SP.PLAYERS.map((p) => band(top(p)));
assert.strictEqual(bands.filter((b) => b === 'A').length, 3); assert.strictEqual(bands.filter((b) => b === 'B').length, 2); assert.strictEqual(bands.filter((b) => b === 'C').length, 2);
ok('three A-range, two B-range, two C-range players (highest supplied grade)');
const keys = SP.COLUMNS.map((c) => c[0]);
assert.ok(keys.indexOf('avgFbv') > 0 && keys.indexOf('maxFbv') > 0 && keys.indexOf('pv') < 0 && !SP.COLUMNS.some((c) => /\bPV\b/.test(c[1])));
assert.ok(!keys.some((k) => /internal/i.test(k)) && !SP.PLAYERS.some((p) => Object.keys(p).some((k) => /internal/i.test(k))));
ok('Avg FBV / Max FBV used (no PV); no Internal Type field');
assert.ok(SP.PLAYERS.every((p) => !/UTL/.test(p.pos)) && SP.PLAYERS[3].pos === 'P/2B' && SP.PLAYERS[2].pos === 'SS/CF');
assert.deepStrictEqual(SP.PLAYERS[3].badges, ['Two-Way', 'Utility']); assert.deepStrictEqual(SP.PLAYERS[2].badges, ['Utility']);
assert.ok(SP.PLAYERS.every((p) => p.badges.every((b) => b === 'Utility' || b === 'Two-Way')) && SP.PLAYERS[3].style === 'Slapper');
ok('UTL never a secondary position; Utility/Two-Way are badges; Slapper is a style');
assert.ok(SP.PLAYERS[0].pos === 'P' && SP.PLAYERS[0].ppg === 'A' && SP.PLAYERS[0].opg === null && SP.PLAYERS[0].maxEv === null);
ok('missing values are null in fixture (rendered as "-", never F/zero)');

(async () => {
  let JSDOM, VirtualConsole;
  try { ({ JSDOM, VirtualConsole } = require(process.env.JSDOM_PATH || 'jsdom')); } catch (e) { console.log('SKIPPED page checks: jsdom not installed'); return; }
  const server = http.createServer((q, res) => { fs.readFile(path.join(__dirname, decodeURIComponent(q.url.split('?')[0])), (e, b) => { if (e) { res.statusCode = 404; res.end(); } else res.end(b); }); });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try {
    const dom = await JSDOM.fromURL('http://127.0.0.1:' + server.address().port + '/softball-preview.html', { runScripts: 'dangerously', resources: 'usable', virtualConsole: new VirtualConsole() });
    await new Promise((r) => setTimeout(r, 1500));
    const d = dom.window.document, txt = d.body.textContent;
    const rows = [...d.querySelectorAll('#softball-preview tbody tr')];
    assert.strictEqual(rows.length, 7);
    assert.deepStrictEqual([...d.querySelectorAll('#softball-preview thead th')].map((t) => t.textContent.replace(/\s*\((mph|sec)\)/, '')), ['Player', 'Position', 'Badges', 'Style', 'Height', 'Max EV', 'Bat Speed', 'Home-to-First', 'Throwing Velo', 'Pop Time', 'Avg FBV', 'Max FBV', 'OPG', 'SOPG', 'DPG', 'SDPG', 'PPG']);
    ok('page renders seven rows and the seventeen required columns');
    assert.ok(/Provisional/.test(txt) && /Softball Preview/.test(txt) && /fictional/i.test(txt) && /under review/.test(txt) && /noindex/.test(d.querySelector('meta[name=robots]').content));
    assert.ok(!/Internal Type/i.test(txt) && !/UTL/.test(txt) && !/\bPV\b/.test(txt));
    ok('page is marked provisional/fictional; no Internal Type, UTL or PV text');
    const cells = (r) => [...r.children].map((c) => c.textContent);
    const ava = cells(rows[0]), mia = cells(rows[3]);
    assert.strictEqual(ava[4], '5\'11"'); assert.deepStrictEqual(ava.slice(5, 10), ['-', '-', '-', '-', '-']); assert.strictEqual(ava[16], 'A'); assert.strictEqual(ava[12], '-');
    assert.strictEqual(mia[1], 'P/2B'); assert.strictEqual(mia[2], 'Two-Way Utility'); assert.strictEqual(mia[3], 'Slapper'); assert.strictEqual(mia[13], 'B+'); assert.strictEqual(mia[15], 'B');
    assert.ok(rows[3].querySelectorAll('.sp-badge').length === 2 && rows[2].querySelectorAll('.sp-badge').length === 1);
    ok('badge, dash and grade rendering match the supplied fixture');
    d.querySelector('.sp-sort[data-sk="maxEv"]').click();
    let col = [...d.querySelectorAll('#softball-preview tbody tr')].map((r) => r.children[5].textContent);
    assert.deepStrictEqual(col, ['59', '63', '69', '70', '81', '82', '-']); assert.strictEqual(d.querySelector('th[aria-sort="ascending"]').textContent, 'Max EV (mph)');
    d.querySelector('.sp-sort[data-sk="opg"]').click(); d.querySelector('.sp-sort[data-sk="opg"]').click();
    col = [...d.querySelectorAll('#softball-preview tbody tr')].map((r) => r.children[12].textContent);
    assert.strictEqual(col[col.length - 1], '-'); assert.strictEqual(col[0], 'A');
    ok('sortable headers work and keep missing values last');
    const sg = (await JSDOM.fromURL('http://127.0.0.1:' + server.address().port + '/sport-softball.html', { runScripts: 'dangerously', resources: 'usable', virtualConsole: new VirtualConsole() })).window.document;
    assert.ok(sg.querySelector('a[href="softball-preview.html"]'));
    ok('sport-softball.html links to the preview');
  } finally { server.close(); }
  console.log('# ' + n + ' passed');
  process.exit(0);
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
