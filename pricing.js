/* Institution price selector. Reads the visible pricing tables so the tables are the single source of truth. */
(function () {
  var sel = document.getElementById('ps-sports');
  if (!sel) return;
  var billing = document.getElementById('ps-billing');
  var out = document.getElementById('ps-out');
  var MAX = 20;

  function readTable(id) {
    var t = { rows: {}, extra: null };
    document.querySelectorAll('#' + id + ' tbody tr').forEach(function (tr) {
      var m = Number(tr.querySelector('[data-m]').getAttribute('data-m'));
      var a = Number(tr.querySelector('[data-a]').getAttribute('data-a'));
      if (tr.hasAttribute('data-extra')) t.extra = { m: m, a: a };
      else t.rows[tr.getAttribute('data-sports')] = { m: m, a: a };
    });
    return t;
  }
  var tables = { standard: readTable('tbl-standard') };
  var fmt = function (n) { return '$' + n.toLocaleString('en-US'); };

  for (var i = 1; i <= MAX; i++) {
    var o = document.createElement('option');
    o.value = i;
    o.textContent = i + (i === 1 ? ' Sport' : ' Sports');
    sel.appendChild(o);
  }

  function update() {
    var n = Number(sel.value), key = billing.value, t = tables.standard;
    var price;
    if (n <= 8) price = t.rows[n][key];
    else price = t.rows[8][key] + (n - 8) * t.extra[key];
    var per = key === 'm' ? '/month' : '/year';
    var note = key === 'a' ? ' Annual billing equals 10 monthly payments.' : '';
    var extra = n > 8 ? ' Includes ' + (n - 8) + ' additional sport' + (n - 8 > 1 ? 's' : '') + ' beyond 8.' : '';
    out.innerHTML = '<strong>' + fmt(price) + per + '</strong> for ' + n + (n === 1 ? ' sport' : ' sports') + ', up to 6 users per sport.' + extra + note +
      ' Payments are not live; billing is handled after approval. <a href="institution-signup.html">Request institution access</a>.';
  }
  [sel, billing].forEach(function (el) { el.addEventListener('change', update); });
  update();
})();
