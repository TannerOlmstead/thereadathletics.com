/* Home sign-in entry points. Run: JSDOM_PATH=... node home-signin.tests.js */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const { JSDOM } = require(process.env.JSDOM_PATH || 'jsdom');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = http.createServer((q, r) => { const f = path.join(__dirname, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html')); fs.readFile(f, (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.setHeader('content-type', types[path.extname(f)] || 'text/plain'); r.end(d); }); });
const open = (url) => JSDOM.fromURL(url, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true }).then((d) => new Promise((ok) => setTimeout(() => ok(d), 700)));
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const home = await open(base + 'index.html'), doc = home.window.document;
  const cards = [...doc.querySelectorAll('.signin-card')];
  assert.strictEqual(cards.length, 4);
  const want = [['Athlete Sign In', 'athlete', 'player-signup.html', 'Athlete'], ['College Coach Sign In', 'coach', 'individual-signup.html', 'College Coach'], ['Verifier Sign In', 'verifier', 'verifier-signup.html', 'Verified Data Provider (Verifier)'], ['Athletic Department Sign In', 'ad', 'institution-signup.html', 'Athletic Department']];
  for (const [i, [title, role, signup, label]] of want.entries()) {
    const c = cards[i];
    assert.strictEqual(c.querySelector('h2').textContent.trim().toLowerCase(), title.toLowerCase());
    assert.ok(c.querySelector('p').textContent.trim().length > 10, title + ' has a description');
    const links = [...c.querySelectorAll('a')], main = links[0].getAttribute('href'), alt = links[1].getAttribute('href');
    assert.strictEqual(main, 'sign-in.html?role=' + role); assert.strictEqual(alt, signup);
    assert.ok(links.every((a) => a.getAttribute('aria-label')), title + ' links have accessible labels');
    for (const h of [main, alt]) { const rs = await fetch(base + h); assert.strictEqual(rs.status, 200, h); }
    const si = await open(base + main), sel = si.window.document.querySelector('#si-role');
    assert.ok(sel, 'role select on ' + main);
    assert.strictEqual(sel.options[sel.selectedIndex].textContent.trim(), label, main + ' preselects ' + label);
    console.log('ok -', title, '->', main, '| new account ->', signup);
    si.window.close();
  }
  assert.ok(!doc.querySelector('.hero-headline, .cta-row, .hero-points'), 'hero clutter removed');
  assert.ok(doc.querySelector('.nav-actions a[href="index.html#paths"]') && doc.getElementById('paths'), 'Get Started anchor still resolves');
  assert.ok(!/founding/i.test(doc.body.textContent), 'no founding rates published');
  console.log('ok - hero simplified, anchor works, no founding rates');
  process.exit(0);
})().catch((e) => { console.error('FAIL', e.message); process.exit(1); });