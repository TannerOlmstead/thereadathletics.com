/* Lineup and Depth Chart PAGES (baseball preview). Mounted by coach.js (pages.lineup / pages.depth) with fictional preview data.
   Drag and drop plus a keyboard alternative (a select on every slot). Drafts live only in this browser (localStorage, demo);
   nothing is uploaded or sent. Logic lives in lineup-depth.js. LF/CF/RF are display slots only (user-approved scoped exception). */
(function (root) {
  'use strict';
  var L = root.TheReadLineup;
  var K_LU = 'theReadDemoLineups', K_DP = 'theReadDemoDepthChart', K_RO = 'theReadDemoLineupRoster';
  function rd(k) { try { return JSON.parse(root.localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function wr(k, v) { try { root.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  function mount(host, page, ctx) {
    var esc = ctx.esc, doc = root.document;
    if (ctx.sport !== 'Baseball') { host.innerHTML = '<div class="notice navy" role="note"><strong>Baseball only.</strong> The Lineup and Depth Chart previews are available for Baseball. Switch the active sport to Baseball to use them.</div>'; return; }
    var imported = (rd(K_RO) || []).filter(function (p) { return p && /^IMP-\d+$/.test(p.id) && L.STORED_POSITIONS.indexOf(p.pos) >= 0; });
    var roster = function () { return ctx.players.concat(imported); };
    var byId = function () { var m = {}; roster().forEach(function (p) { m[p.id] = p; }); return m; };
    var ids = function () { return roster().map(function (p) { return p.id; }); };
    var lu = L.sanitizeLineups(rd(K_LU), ids());
    var dp = L.sanitizeDepth(rd(K_DP), ids());
    var ui = { q: '', pool: 'roster', status: '', saveFail: false };
    var saved = function () { ui.saveFail = !(wr(K_LU, lu) && wr(K_DP, dp)); };

    function tag(p, from, extra) {
      var d = from ? ' data-fg="' + esc(from.group) + '" data-fi="' + from.idx + '"' : '';
      return '<div class="ld-tag" draggable="true" data-pid="' + esc(p.id) + '"' + d + ' role="group" aria-label="' + esc(p.name) + ', ' + esc(p.pos) + (p.twoWay ? ', two-way' : '') + ', class of ' + esc(p.grad) + '">' +
        '<strong class="ld-name">' + esc(p.name) + '</strong> <span class="pill gray">' + esc(p.pos) + '</span>' + (p.twoWay ? ' <span class="pill navy">Two-Way</span>' : '') + (p.imported ? ' <span class="pill amber">Imported</span>' : '') +
        '<span class="ld-meta">Class of ' + esc(p.grad) + ' &middot; ' + ctx.gradeSummary(p) + '</span>' + (extra || '') + '</div>';
    }
    function options(sel, list) {
      return '<option value="">Open spot</option>' + list.slice().sort(function (a, b) { return a.name < b.name ? -1 : 1; }).map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === sel ? ' selected' : '') + '>' + esc(p.name) + ' (' + esc(p.pos) + ', ' + esc(p.grad) + ')</option>'; }).join('');
    }
    function slot(label, aria, group, idx, pid, list, kind, note) {
      var p = pid ? byId()[pid] : null, fit = p && kind === 'field' ? L.slotFit(group, p) : { ok: true };
      return '<div class="ld-slot' + (p ? '' : ' open') + '" data-g="' + esc(group) + '" data-i="' + idx + '" data-kind="' + kind + '"><span class="ld-slot-label">' + esc(label) + '</span>' +
        '<div class="ld-slot-body">' + (p ? tag(p, { group: group, idx: idx }) + (fit.ok ? '' : ' <span class="pill amber" title="Hint only. The stored position is not changed.">' + esc(fit.note) + '</span>') + (note || '') : '<span class="pill amber ld-open">Open spot</span>') + '</div>' +
        '<label class="visually-hidden" for="sel-' + kind + group + idx + '">' + esc(aria) + '</label><select id="sel-' + kind + group + idx + '" class="ld-sel" data-g="' + esc(group) + '" data-i="' + idx + '" data-kind="' + kind + '">' + options(pid, list) + '</select>' +
        (p ? '<button type="button" class="ld-x" data-rm="1" data-g="' + esc(group) + '" data-i="' + idx + '" data-kind="' + kind + '" aria-label="Remove ' + esc(p.name) + ' from ' + esc(aria) + '">Remove</button>' : '') + '</div>';
    }
    function poolHtml(list, title, hint) {
      var q = ui.q.toLowerCase(), shown = list.filter(function (p) { return !q || (p.name + ' ' + p.pos).toLowerCase().indexOf(q) >= 0; });
      return '<section class="ld-pool card coach-card" data-pool="1" aria-label="' + esc(title) + '"><h3>' + esc(title) + ' (' + shown.length + ')</h3><p class="coach-note">' + hint + '</p>' +
        '<label>Search<input type="search" id="ld-q" value="' + esc(ui.q) + '" placeholder="Name or position" /></label><div class="ld-pool-list">' + (shown.length ? shown.map(function (p) { return tag(p); }).join('') : '<p class="coach-note">No players to show.</p>') + '</div></section>';
    }
    function importHtml() {
      return '<details class="card coach-card ld-import"><summary><strong>Import Roster From CSV (Preview)</strong></summary>' +
        '<p class="coach-note">The file is read in this browser only and is never uploaded. Required columns: Name, Position, Grad Year. Optional: Secondary Position, Two-Way. Positions must be P, C, 1B, 2B, 3B, SS or OF. Rows with any other position (including LF, CF, RF, DH or UT) are flagged for your review; nothing is converted silently. Excel files are not supported in this preview: save as CSV.</p>' +
        '<label>CSV file<input type="file" id="ld-file" accept=".csv,text/csv" /></label> <label>Or paste CSV text<textarea id="ld-text" rows="4" placeholder="Name,Position,Grad Year"></textarea></label>' +
        '<div class="btn-row"><button type="button" class="button button-secondary" id="ld-prev">Preview Rows</button></div><div id="ld-prevout" aria-live="polite"></div></details>';
    }
    function liveHtml() { return '<p class="visually-hidden" id="ld-live" role="status" aria-live="polite">' + esc(ui.status) + '</p>'; }
    function banner() {
      return '<div class="notice navy" role="note"><strong>Preview only.</strong> Players are fictional sample data. Drafts are kept only in this browser (demo) and are never sent anywhere' + (ui.saveFail ? '; this browser blocked saving, so changes last until you leave the page' : '') + '. <button type="button" class="button button-secondary" id="ld-reset">Reset All Drafts</button></div>' + liveHtml();
    }

    function drawLineup() {
      var cur = lu.lineups[lu.active], B = byId(), all = roster();
      var inBat = L.placed(cur.bat), inField = L.placed(cur.field);
      var bench = all.filter(function (p) { return !inBat[p.id] && !inField[p.id]; });
      var tabs = lu.lineups.map(function (l, i) { return '<button type="button" role="tab" class="ld-tab' + (i === lu.active ? ' on' : '') + '" aria-selected="' + (i === lu.active) + '" data-tab="' + i + '">' + esc(l.label) + '</button>'; }).join('');
      var batSlots = cur.bat.groups.BAT.map(function (pid, i) { return slot('Bat ' + (i + 1), 'Batting order ' + (i + 1), 'BAT', i, pid, all, 'bat'); }).join('');
      var fieldSlots = L.SLOTS.map(function (s) { return slot(s, 'Defensive position ' + s, s, 0, cur.field.groups[s][0], all, 'field'); }).join('');
      host.innerHTML = banner() +
        '<div class="ld-tabs" role="tablist" aria-label="Lineup pages (up to ' + L.CONFIG.maxLineups + ')">' + tabs + '</div>' +
        '<div class="btn-row"><button type="button" class="button button-secondary" id="lu-add"' + (lu.lineups.length >= L.CONFIG.maxLineups ? ' disabled' : '') + '>Add Lineup (' + lu.lineups.length + ' of ' + L.CONFIG.maxLineups + ')</button> ' +
        '<button type="button" class="button button-secondary" id="lu-dup"' + (lu.lineups.length >= L.CONFIG.maxLineups ? ' disabled' : '') + '>Duplicate This Lineup</button> <button type="button" class="button button-secondary" id="lu-clr">Clear This Lineup</button> <button type="button" class="button button-secondary" id="lu-del"' + (lu.lineups.length <= 1 ? ' disabled' : '') + '>Delete This Lineup</button></div>' +
        '<section class="card coach-card"><h2>Matchup</h2><div class="ld-fields"><label>Lineup Name<input id="lu-label" maxlength="40" value="' + esc(cur.label) + '" /></label><label>Opponent<input id="lu-opp" maxlength="60" value="' + esc(cur.opponent) + '" placeholder="Opponent or free text" /></label><label>Date<input id="lu-date" maxlength="30" value="' + esc(cur.date) + '" placeholder="Date or free text" /></label></div></section>' +
        '<p class="coach-note">Drag a player tag onto a slot, or use the select on any slot. Dropping on an occupied slot swaps the two players. Slot labels LF, CF and RF are display slots for outfielders; every player keeps their stored position (OF).</p>' +
        '<div class="ld-cols"><section class="card coach-card"><h2>Batting Order</h2>' + batSlots + '</section><section class="card coach-card"><h2>Defensive Positions</h2>' + fieldSlots + '</section>' +
        poolHtml(bench, 'Bench / Available', 'Players not in this lineup. Drop a tag here to remove it from a slot.') + '</div>' + importHtml();
    }

    function poolList(year) {
      var all = roster(), inYear = L.placed(dp.boards[year]);
      if (ui.pool === 'targets') { var t = ctx.targets(); return all.filter(function (p) { return t[p.id]; }); }
      return all.filter(function (p) { return !inYear[p.id] || true; });
    }
    function drawDepth() {
      var yrs = L.depthYears(dp), year = yrs[dp.active], b = dp.boards[year], B = byId(), all = roster();
      var open = 0, tabs = yrs.map(function (y, i) { return '<button type="button" role="tab" class="ld-tab' + (i === dp.active ? ' on' : '') + '" aria-selected="' + (i === dp.active) + '" data-tab="' + i + '">' + y + ' Season</button>'; }).join('');
      var groups = L.SLOTS.map(function (g) {
        var rows = b.groups[g].map(function (pid, i) {
          if (!pid) open++;
          var p = pid ? B[pid] : null, gn = p ? L.yearNote(p, year) : '';
          var tg = ctx.targets()[pid];
          return slot(L.CONFIG.depthLabels[i] || 'Depth ' + (i + 1), g + ' ' + (L.CONFIG.depthLabels[i] || 'depth ' + (i + 1)) + ' for ' + year, g, i, pid, all, 'depth',
            (tg ? ' <span class="pill red">Recruiting Target</span>' : '') + (gn ? ' <span class="pill amber">' + esc(gn) + '</span>' : ''));
        }).join('');
        return '<section class="card coach-card ld-group"><h3>' + g + (g === 'LF' || g === 'CF' || g === 'RF' ? ' <small>(outfield slot)</small>' : '') + '</h3>' + rows + '</section>';
      }).join('');
      var cnt = '<label>Years To Plan<select id="dp-years">' + [2, 3, 4].map(function (n) { return '<option' + (n === dp.count ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></label>';
      var list = poolList(year);
      host.innerHTML = banner() + '<div class="ld-fields">' + cnt + '<label>Player Pool<select id="dp-pool"><option value="roster"' + (ui.pool === 'roster' ? ' selected' : '') + '>Roster (sample and imported)</option><option value="targets"' + (ui.pool === 'targets' ? ' selected' : '') + '>Recruiting Targets (Board)</option></select></label></div>' +
        '<div class="ld-tabs" role="tablist" aria-label="Recruiting years">' + tabs + '</div><p class="kpi-row"><span class="pill amber">Open spots in ' + year + ': ' + open + '</span></p>' +
        '<p class="coach-note">Drag tags into slots (a player may be listed at more than one position, but only once per position). Graduated players are flagged, not blocked. LF, CF and RF are display slots for outfielders; stored positions stay OF.</p>' +
        '<div class="ld-cols ld-depth"><div class="ld-groups">' + groups + '</div>' + poolHtml(list, ui.pool === 'targets' ? 'Recruiting Targets' : 'Roster Pool', ui.pool === 'targets' ? 'Prospects on your Recruiting Board.' : 'Fictional sample players plus any rows you imported.') + '</div>' + importHtml();
    }

    var draw = page === 'lineup' ? drawLineup : drawDepth;
    function curBoards(kind) {
      if (page === 'lineup') { var c = lu.lineups[lu.active]; return kind === 'bat' ? { get: function () { return c.bat; }, set: function (v) { c.bat = v; } } : { get: function () { return c.field; }, set: function (v) { c.field = v; } }; }
      var y = L.depthYears(dp)[dp.active]; return { get: function () { return dp.boards[y]; }, set: function (v) { dp.boards[y] = v; } };
    }
    function act(kind, pid, g, i, from) {
      var bd = curBoards(kind), r = L.place(bd.get(), pid, g, i, from), nm = byId()[pid] ? byId()[pid].name : 'Player';
      if (!r.ok) ui.status = r.reason; else if (!r.noop) { bd.set(r.board); ui.status = nm + (r.swapped ? ' swapped into ' : ' placed in ') + g + (kind === 'bat' ? ' ' + (i + 1) : ''); }
      saved(); draw();
    }
    function remove(kind, g, i) { var bd = curBoards(kind); bd.set(L.removeAt(bd.get(), g, i)); ui.status = 'Removed from ' + g; saved(); draw(); }

    // Drag and drop
    var drag = null;
    host.addEventListener('dragstart', function (e) { var t = e.target.closest && e.target.closest('.ld-tag'); if (!t) return; drag = { pid: t.dataset.pid, fg: t.dataset.fg || null, fi: t.dataset.fi == null ? null : Number(t.dataset.fi) }; if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', drag.pid); } catch (x) { /* ignore */ } } });
    host.addEventListener('dragover', function (e) { if (drag && e.target.closest && (e.target.closest('.ld-slot') || e.target.closest('[data-pool]'))) e.preventDefault(); });
    host.addEventListener('drop', function (e) {
      if (!drag) return; var s = e.target.closest && e.target.closest('.ld-slot'), pool = e.target.closest && e.target.closest('[data-pool]'), d = drag; drag = null;
      if (s) { e.preventDefault(); var kind = s.dataset.kind; if (d.fg && d.fg !== s.dataset.g && page === 'lineup' && false) return; act(kind, d.pid, s.dataset.g, Number(s.dataset.i), d.fg ? { group: d.fg, idx: d.fi } : null); }
      else if (pool && d.fg) { e.preventDefault(); var k = page === 'lineup' ? (d.fg === 'BAT' ? 'bat' : 'field') : 'depth'; remove(k, d.fg, d.fi); }
    });
    host.addEventListener('dragend', function () { drag = null; });

    host.addEventListener('change', function (e) {
      var t = e.target;
      if (t.classList && t.classList.contains('ld-sel')) { var g = t.dataset.g, i = Number(t.dataset.i), k = t.dataset.kind; if (!t.value) remove(k, g, i); else act(k, t.value, g, i, null); return; }
      if (t.id === 'dp-years') { dp = L.setYears(dp, t.value); saved(); draw(); }
      if (t.id === 'dp-pool') { ui.pool = t.value; draw(); }
    });
    host.addEventListener('input', function (e) {
      var t = e.target, c = lu.lineups[lu.active];
      if (t.id === 'ld-q') { ui.q = t.value; var pos = t.selectionStart; draw(); var n = doc.getElementById('ld-q'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) { /* ignore */ } } return; }
      if (t.id === 'lu-label') c.label = t.value.slice(0, 40) || 'Lineup'; if (t.id === 'lu-opp') c.opponent = t.value; if (t.id === 'lu-date') c.date = t.value; saved();
    });
    host.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('button') : null; if (!t) return;
      if (t.dataset.rm) { remove(t.dataset.kind, t.dataset.g, Number(t.dataset.i)); return; }
      if (t.dataset.tab != null) { if (page === 'lineup') lu.active = Number(t.dataset.tab); else dp.active = Number(t.dataset.tab); saved(); draw(); return; }
      var r;
      if (t.id === 'lu-add') { r = L.addLineup(lu); ui.status = r.ok ? 'Lineup added.' : r.reason; lu = r.state; saved(); draw(); }
      else if (t.id === 'lu-dup') { r = L.duplicateLineup(lu, lu.active); ui.status = r.ok ? 'Lineup duplicated.' : r.reason; lu = r.state; saved(); draw(); }
      else if (t.id === 'lu-del') { if (root.confirm && !root.confirm('Delete this lineup page?')) return; r = L.removeLineup(lu, lu.active); ui.status = r.ok ? 'Lineup deleted.' : r.reason; lu = r.state; saved(); draw(); }
      else if (t.id === 'lu-clr') { lu.lineups[lu.active] = L.clearLineup(lu.lineups[lu.active]); ui.status = 'Lineup cleared.'; saved(); draw(); }
      else if (t.id === 'ld-reset') { if (root.confirm && !root.confirm('Reset all lineup and depth chart drafts and imported roster rows in this browser?')) return; [K_LU, K_DP, K_RO].forEach(function (k) { try { root.localStorage.removeItem(k); } catch (x) { /* ignore */ } }); imported = []; lu = L.newLineupState(); dp = L.newDepthState(); ui.status = 'Drafts reset.'; draw(); }
      else if (t.id === 'ld-prev') preview();
      else if (t.id === 'ld-commit') commit();
    });

    // CSV import (preview -> review -> explicit add)
    var pv = null;
    function readText(cb) {
      var f = doc.getElementById('ld-file'), txt = doc.getElementById('ld-text');
      if (f && f.files && f.files[0]) { var fr = new root.FileReader(); fr.onload = function () { cb(String(fr.result)); }; fr.readAsText(f.files[0]); } else cb(txt ? txt.value : '');
    }
    function preview() {
      readText(function (text) {
        pv = L.importPreview(text, roster());
        var out = doc.getElementById('ld-prevout');
        if (pv.fileErrors.length) { out.innerHTML = '<p class="md-errors" role="alert">' + pv.fileErrors.map(esc).join(' ') + '</p>'; return; }
        var posOpt = function (sel) { return '<option value="">Choose position</option>' + L.STORED_POSITIONS.map(function (p) { return '<option' + (p === sel ? ' selected' : '') + '>' + p + '</option>'; }).join(''); };
        out.innerHTML = '<div class="table-wrap"><table><caption class="visually-hidden">Import preview</caption><thead><tr><th scope="col">Line</th><th scope="col">Name</th><th scope="col">Position</th><th scope="col">Grad Year</th><th scope="col">Status</th><th scope="col">Decision</th></tr></thead><tbody>' +
          pv.rows.map(function (r) {
            var dec = r.status === 'ok' ? 'Will be added' : r.status === 'error' ? 'Cannot be added' : '<label class="visually-hidden" for="d-' + r.line + '">Decision for line ' + r.line + '</label><select id="d-' + r.line + '" data-dec="' + r.line + '"><option value="skip">Skip (default)</option><option value="add">Add with position</option></select> <select aria-label="Position for line ' + r.line + '" data-decpos="' + r.line + '">' + posOpt(r.suggestion) + '</select>';
            return '<tr data-row="' + r.line + '"><td>' + r.line + '</td><td>' + esc(r.name) + '</td><td>' + esc(r.rawPos) + '</td><td>' + esc(isFinite(r.grad) ? r.grad : '') + '</td><td><span class="pill ' + (r.status === 'ok' ? 'green' : r.status === 'error' ? 'red' : 'amber') + '">' + (r.status === 'ok' ? 'OK' : r.status === 'error' ? 'Error' : 'Needs Review') + '</span>' + r.issues.map(function (x) { return '<br /><small>' + esc(x) + '</small>'; }).join('') + '</td><td>' + dec + '</td></tr>';
          }).join('') + '</tbody></table></div><label><input type="checkbox" id="ld-rev" /> I reviewed these rows</label> <button type="button" class="button button-primary" id="ld-commit">Add Reviewed Rows To Roster</button>';
      });
    }
    function commit() {
      var out = doc.getElementById('ld-prevout'), rev = doc.getElementById('ld-rev');
      if (!pv || !rev || !rev.checked) { ui.status = 'Tick "I reviewed these rows" first.'; var n = doc.getElementById('ld-live'); if (n) n.textContent = ui.status; return; }
      var dec = {};
      pv.rows.forEach(function (r) { var d = doc.querySelector('[data-dec="' + r.line + '"]'); if (d) { var ps = doc.querySelector('[data-decpos="' + r.line + '"]'); dec[r.line] = { action: d.value, pos: ps && ps.value ? ps.value : null }; } });
      var res = L.commitImport(pv, dec, true, ids());
      imported = imported.concat(res.added); wr(K_RO, imported); pv = null;
      ui.status = res.added.length + ' player' + (res.added.length === 1 ? '' : 's') + ' added to this session roster; ' + res.skipped.length + ' row' + (res.skipped.length === 1 ? '' : 's') + ' skipped.';
      draw();
    }
    draw();
  }
  root.TheReadLineupUI = { mount: mount };
})(typeof window !== 'undefined' ? window : this);
