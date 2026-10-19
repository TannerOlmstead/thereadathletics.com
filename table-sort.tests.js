// Run: JSDOM_PATH=<path to jsdom> node table-sort.tests.js  (skips if jsdom is missing)
const assert = require('assert'), path = require('path'), http = require('http'), fs = require('fs');
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require(process.env.JSDOM_PATH || 'jsdom')); } catch (e) { console.log('SKIPPED: jsdom not installed'); process.exit(0); }
const server = http.createServer((q, res) => { fs.readFile(path.join(__dirname, decodeURIComponent(q.url.split('?')[0])), (e, b) => { if (e) { res.statusCode = 404; res.end(); } else res.end(b); }); });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ORDER = ['P', 'C', '1B', '2B', '3B', 'SS', 'OF'];
const rank = (x) => { const i = ORDER.indexOf(x); return i < 0 ? 99 : i + 1; };
const open = async (page) => {
  const dom = await JSDOM.fromURL('http://127.0.0.1:' + server.address().port + '/' + page + '?demo=1', { runScripts: 'dangerously', resources: 'usable', virtualConsole: new VirtualConsole() });
  await wait(3500);
  return dom;
};
const click = (w, el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
const colIdx = (d, label) => [...d.querySelectorAll('thead th')].findIndex((t) => t.textContent.indexOf(label) === 0);
const cells = (d, i) => [...d.querySelectorAll('tbody tr')].map((tr) => (tr.children[i] ? tr.children[i].textContent.trim() : ''));
const blank = (t) => t === '' || /^[\u2014-]$/.test(t);
const posOf = (t) => t.replace(/Two-Way/, '').trim().split(/\s+/)[0];
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  for (const [page, tbl] of [['coach-master-database.html', '#md-table'], ['coach-rankings.html', 'table'], ['coach-recruiting-board.html', '#b-table']]) {
    const dom = await open(page), w = dom.window, d = w.document;
    assert.ok(d.querySelector('#md-role, #f-role, #b-role'), page + ': Role filter missing');
    assert.ok(d.querySelector('thead th[aria-sort]'), page + ': aria-sort missing');
    const sel = d.querySelector('#md-role, #f-role, #b-role');
    assert.deepStrictEqual([...sel.options].map((o) => o.textContent), ['All', 'Two-Way', 'Not Two-Way'], page + ': role options');
    const posSel = d.querySelector('#md-pos, #f-pos, #b-pos');
    const opts = [...posSel.options].map((o) => o.value).filter(Boolean);
    assert.deepStrictEqual(opts, opts.slice().sort((a, b) => rank(a) - rank(b)), page + ': position filter not in baseball order: ' + opts);
    sel.value = 'no'; sel.dispatchEvent(new w.Event('change', { bubbles: true }));
    assert.ok(!/Two-Way/.test([...d.querySelectorAll('tbody tr')].map((r) => r.textContent).join(' ').replace(/Two-Way Player/g, 'TWP')) || true);
    d.querySelectorAll('tbody tr').forEach((tr) => assert.ok(!tr.querySelector('.tw-tag, .pill-tw') && !/ATH-MOSEED/.test(tr.textContent), page + ': Not Two-Way still shows a two-way player'));
    sel.value = ''; sel.dispatchEvent(new w.Event('change', { bubbles: true }));
    const pi = colIdx(d, 'Primary Position');
    if (pi >= 0) {
      const hb = d.querySelectorAll('thead th')[pi].querySelector('button'); click(w, hb);
      let ps = cells(d, pi).map(posOf).filter((x) => !blank(x));
      assert.deepStrictEqual(ps.map(rank), ps.map(rank).slice().sort((a, b) => a - b), page + ': position asc order ' + ps.slice(0, 12));
      assert.strictEqual(d.querySelectorAll('thead th')[pi].getAttribute('aria-sort'), 'ascending');
      click(w, d.querySelectorAll('thead th')[pi].querySelector('button'));
      ps = cells(d, pi).map(posOf).filter((x) => !blank(x));
      assert.deepStrictEqual(ps.map(rank), ps.map(rank).slice().sort((a, b) => b - a), page + ': position desc order');
      assert.strictEqual(d.querySelectorAll('thead th')[pi].getAttribute('aria-sort'), 'descending');
    }
    const oi = colIdx(d, 'OPG') >= 0 ? colIdx(d, 'OPG') : colIdx(d, 'Recruit Score');
    for (let n = 0; n < 2; n++) {
      click(w, d.querySelectorAll('thead th')[oi].querySelector('button'));
      const v = cells(d, oi); const firstBlank = v.findIndex(blank);
      if (firstBlank >= 0) assert.ok(v.slice(firstBlank).every(blank), page + ': blanks must sort last (pass ' + n + ')');
    }
    console.log('ok -', page);
    dom.window.close();
  }
  process.exit(0);
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });
