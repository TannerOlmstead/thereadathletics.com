/* Lineup and Depth Chart PAGES: a big white canvas with draggable player name tags (pointer events: mouse, touch, pen).
   Coaches drag tags freely on the canvas and between the tray and the canvas. No select menus place players; keyboard: focus a tag,
   arrow keys move it (Shift = bigger step), Enter/Space sends a tray tag to the canvas, Delete/Backspace/Enter/Space returns a canvas tag to the tray.
   Drafts live only in this browser (localStorage, demo); nothing is uploaded or sent. Logic: lineup-depth.js. LF/CF/RF are display slots on the Depth Chart only (scoped exception). The Lineup page is a blank whiteboard with a roster rack: no slots, no snapping. No grades appear on tags. */
(function (root) {
  'use strict';
  var L = root.TheReadLineup;
  function rd(k) { try { return JSON.parse(root.localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function wr(k, v) { try { root.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  var pct = function (v) { return (Math.round(v * 10000) / 100) + '%'; };

  function mount(host, page, ctx) {
    var doc = root.document, esc = ctx.esc, sport = ctx.sport || 'Baseball', bb = sport === 'Baseball', sk = bb ? '' : '_' + L.sportKey(sport);
    var K_LU = 'theReadDemoLineups' + sk, K_DP = 'theReadDemoDepthChart' + sk, K_RO = 'theReadDemoLineupRoster';
    var imported = bb ? (rd(K_RO) || []).filter(function (p) { return p && /^IMP-\d+$/.test(p.id) && L.STORED_POSITIONS.indexOf(p.pos) >= 0 && L.jerseyNorm(p.jersey); }) : [];
    var roster = function () { return L.sortRoster(ctx.players.concat(imported)); };
    var byId = function () { var m = {}; roster().forEach(function (p) { m[p.id] = p; }); return m; };
    var ids = function () { return roster().map(function (p) { return p.id; }); };
    var lu = L.sanitizeLineups(rd(K_LU), ids()), dp = L.sanitizeDepth(rd(K_DP), ids(), undefined, roster());
    var ui = { q: '', status: '', saveFail: false, focus: '' };
    var outline = L.resolveOutline(sport), isLineup = page === 'lineup';
    var saved = function () { ui.saveFail = !(wr(K_LU, lu) && wr(K_DP, dp)); };
    var curLU = function () { return lu.lineups[lu.active]; };
    var curYear = function () { return L.depthYears(dp)[dp.active]; };

    function shortName(n) { var parts = String(n).trim().split(/\s+/); return parts.length > 1 ? parts[0].charAt(0) + '. ' + parts.slice(1).join(' ') : n; }
    function tagHtml(p, o) {
      o = o || {};
      var pos = o.pos ? ' style="left:' + pct(o.pos.x) + ';top:' + pct(o.pos.y) + '"' : '';
      var hint = o.where === 'tray' ? 'Press Enter to place on the canvas.' : 'Arrow keys move, Shift for larger steps, Delete returns to the tray.';
      return '<div class="ld-tag ' + (o.where === 'tray' ? 'in-tray' : 'on-canvas') + (o.placed ? ' placed' : '') + '" tabindex="0" role="button" data-pid="' + esc(p.id) + '" data-key="' + esc(o.key || p.id) + '" data-where="' + o.where + '"' + pos +
        ' aria-label="' + 'jersey ' + esc(p.jersey) + ', ' + esc(p.name) + ', ' + esc(p.pos) + (p.twoWay ? ', two-way' : '') + ', class of ' + esc(p.grad) + (o.label ? ', ' + esc(o.label) : '') + '. ' + hint + '">' +
        (o.badge ? '<span class="ld-num" title="' + esc(o.label || '') + '">' + esc(o.badge) + '</span>' : '') +
        '<span class="ld-jersey">#' + esc(p.jersey) + '</span> <strong class="ld-name">' + esc(shortName(p.name)) + '</strong>' + (o.hidePos ? '' : ' <span class="pill gray">' + esc(p.pos) + '</span>') + (p.twoWay ? ' <span class="pill navy">Two-Way</span>' : '') + (p.imported ? ' <span class="pill amber">Imported</span>' : '') + (o.extra || '') +
        '<span class="ld-meta">Class of ' + esc(p.grad) + '</span></div>';
    }
    function trayHtml(list, title, hint, inCanvas) {
      var q = ui.q.toLowerCase(), shown = list.filter(function (x) { return !q || (x.p.name + ' ' + x.p.pos + ' #' + x.p.jersey).toLowerCase().indexOf(q) >= 0; });
      return '<section class="ld-tray ' + (inCanvas ? 'ld-roster-panel' : 'card coach-card') + '" id="ld-tray" aria-label="' + esc(title) + '"' + (inCanvas ? ' style="width:' + pct(L.ROSTER_W) + '"' : '') + '><h3>' + esc(title) + ' (<span id="ld-count">' + shown.length + '</span>)</h3><p class="coach-note">' + hint + '</p>' +
        '<label>Search<input type="search" id="ld-q" value="' + esc(ui.q) + '" placeholder="Name, number or position" /></label><div class="ld-tray-list" id="ld-tray-list">' + trayItems(shown) + '</div></section>';
    }
    function trayItems(shown) { return shown.length ? shown.map(function (x) { return tagHtml(x.p, { where: 'tray', placed: x.placed, extra: x.placed ? ' <span class="pill green">In lineup</span>' : '' }); }).join('') : '<p class="coach-note">No players to show.</p>'; }
    function trayList() {
      var all = roster();
      if (isLineup) { var on = L.lineupPids(curLU()); return all.map(function (p) { return { p: p, placed: !!on[p.id] }; }); }
      return all.map(function (p) { return { p: p, placed: false }; });
    }

    function banner() {
      return '<div class="notice navy" role="note"><strong>Preview only.</strong> Players are fictional sample data. Drafts are kept only in this browser (demo) and are never sent anywhere' + (ui.saveFail ? '; this browser blocked saving, so changes last until you leave the page' : '') + '. <button type="button" class="button button-secondary" id="ld-reset">Reset All Drafts</button></div>' +
        (bb ? '' : '<div class="notice amber" role="note"><strong>Provisional.</strong> ' + esc(sport) + ' positions, slots, lineup rules and depth sizes are not decided yet (Requires Founder Decision). Tags can be placed anywhere on the canvas.</div>') +
        '<p class="visually-hidden" id="ld-live" role="status" aria-live="polite">' + esc(ui.status) + '</p>';
    }
    function importHtml() {
      if (!bb) return '';
      return '<details class="card coach-card ld-import"><summary><strong>Import Roster From CSV (Preview)</strong></summary>' +
        '<p class="coach-note">The file is read in this browser only and is never uploaded. Required columns: Name, Position, Grad Year, Jersey #. Optional: Secondary Position, Two-Way. Positions must be P, C, 1B, 2B, 3B, SS or OF. Jersey numbers (0-99) must be unique; missing or duplicate numbers are flagged and need a number entered. Rows with any other position (including LF, CF, RF, DH or UT) are flagged for your review; nothing is converted silently. Excel files are not supported in this preview: save as CSV.</p>' +
        '<label>CSV file<input type="file" id="ld-file" accept=".csv,text/csv" /></label> <label>Or paste CSV text<textarea id="ld-text" rows="4" placeholder="Name,Position,Grad Year"></textarea></label>' +
        '<div class="btn-row"><button type="button" class="button button-secondary" id="ld-prev">Preview Rows</button></div><div id="ld-prevout" aria-live="polite"></div></details>';
    }

    function lineupCanvas() {
      var c = curLU(), B = byId(), out = trayHtml(trayList(), 'Roster', 'Drag a tag onto the board. The roster stays full.', true);
      L.lineupTags(c).forEach(function (t) { var p = B[t.pid]; if (p) out += tagHtml(p, { where: 'canvas', key: t.key, pos: { x: t.x, y: t.y }, label: 'on the board' }); });
      return '<div class="ld-canvas ld-lineup ld-slide" id="ld-canvas" role="group" aria-label="Lineup whiteboard with the roster rack">' + out + '</div>';
    }
    // Pitching panel to the right of the field: 5 rotation slots and 20 bullpen slots (empty slots drawn as dashed placeholders).
    function pitchPanel(b) {
      var P = L.PANEL, h = pct(P.x1 - P.x0), o = '<div class="ld-panel" aria-hidden="true" style="left:' + pct(P.x0) + ';top:' + pct(P.spBox.y0) + ';width:' + h + ';height:' + pct(P.rpBox.y1 - P.spBox.y0) + '"></div>';
      [['SP', 'Starting Rotation (' + L.CONFIG.depthSlots.SP + ')', P.spBox.y0], ['RP', 'Bullpen (' + L.CONFIG.depthSlots.RP + ')', P.rpBox.y0]].forEach(function (g) {
        var n = L.groupTags(b, g[0]).length;
        o += '<div class="ld-panel-title" aria-hidden="true" style="left:' + pct(P.x0 + 0.01) + ';top:' + pct(g[2] + 0.005) + '">' + g[1] + ' <small>' + (L.CONFIG.depthSlots[g[0]] - n) + ' open</small></div>';
        for (var i = n; i < L.CONFIG.depthSlots[g[0]]; i++) { var s = L.groupSlotPos(g[0], i); o += '<div class="ld-pslot" aria-hidden="true" style="left:' + pct(s.x) + ';top:' + pct(s.y) + '">' + g[0] + (i + 1) + '</div>'; }
      });
      return o;
    }
    function depthCanvas() {
      var year = curYear(), b = dp.boards[year], B = byId(), out = '';
      out += '<svg class="ld-outline" viewBox="0 0 1000 800" preserveAspectRatio="none" aria-hidden="true" focusable="false">' + outline.svg + '</svg>';
      if (outline.plain) out += '<div class="ld-plain-note" aria-hidden="true">No outline for this sport yet</div>';
      if (bb) out += pitchPanel(b);
      if (bb) L.SLOTS.forEach(function (g) {
        var a = L.ANCHORS[g]; if (!a) return;
        var open = L.openSpots(b, g), n = L.groupTags(b, g).length, lp = L.labelPos(g);
        out += '<div class="ld-glabel" aria-hidden="true" style="left:' + pct(lp.x) + ';top:' + pct(lp.y) + '">' + g + ' <small>' + open + ' open</small></div>';
        for (var i = n; i < L.CONFIG.depthSlots[g]; i++) { var s = L.groupSlotPos(g, i); out += '<div class="ld-pslot" aria-hidden="true" style="left:' + pct(s.x) + ';top:' + pct(s.y) + '">' + (i === 0 ? 'Starter' : 'B' + i) + '</div>'; }
      });
      b.tags.forEach(function (t) {
        var p = B[t.pid]; if (!p) return; var pos = L.depthPos(b, t), k = L.key(t.pid, t.g), extra = '', badge = '', label = 'free on canvas';
        if (t.g) { var i = t.s || 0; var pg = L.PITCH_SLOTS.indexOf(t.g) >= 0; badge = pg ? t.g + (i + 1) : i === 0 ? 'S' : 'B' + i; label = t.g + ' ' + L.depthLabel(i, t.g); var fit = L.slotFit(t.g, p); if (!fit.ok && !pg) extra += ' <span class="ld-mark warn" title="Off-position hint only. The stored position is not changed.">!</span>'; }
        var al = t.g ? L.alsoAt(b, t) : []; if (al.length) extra += ' <span class="ld-mark" title="Also at ' + esc(al.join(', ')) + '. Duplicates are allowed on the depth chart only.">+' + al.length + '</span>';
        var gn = L.yearNote(p, year); if (gn) extra += ' <span class="ld-mark warn" title="' + esc(gn) + '">Grad</span>';
        
        out += tagHtml(p, { where: 'canvas', key: k, pos: pos, badge: badge, label: label, extra: extra, hidePos: !!(t.g && L.PITCH_SLOTS.indexOf(t.g) >= 0) });
      });
      return '<div class="ld-canvas ld-depthc' + (outline.plain ? ' plain' : '') + '" id="ld-canvas" role="group" aria-label="Depth chart canvas, ' + esc(outline.label) + '">' + out + '</div>';
    }

    function seg(label, id, vals, cur) {
      return '<div class="ld-seg" role="group" aria-label="' + esc(label) + '">' + vals.map(function (v) { return '<button type="button" class="ld-tab' + (String(v[0]) === String(cur) ? ' on' : '') + '" aria-pressed="' + (String(v[0]) === String(cur)) + '" data-' + id + '="' + v[0] + '">' + esc(v[1]) + '</button>'; }).join('') + '</div>';
    }
    function draw() {
      var html = banner();
      if (isLineup) {
        var capped = lu.lineups.length >= L.CONFIG.maxLineups;
        html += '<div class="ld-bar" role="group" aria-label="Lineups (up to ' + L.CONFIG.maxLineups + ')">' + lu.lineups.map(function (l, i) { return '<button type="button" class="ld-mini ld-tab' + (i === lu.active ? ' on' : '') + '" aria-pressed="' + (i === lu.active) + '" data-tab="' + i + '">' + esc(l.label) + '</button>'; }).join('') +
          (capped ? '' : '<button type="button" class="ld-mini" id="lu-add" title="Add lineup" aria-label="Add lineup">+ Add</button>') +
          '<button type="button" class="ld-mini" id="lu-dup" title="Duplicate this lineup" aria-label="Duplicate this lineup"' + (capped ? ' disabled' : '') + '>Duplicate</button>' +
          '<button type="button" class="ld-mini" id="lu-clr" title="Clear this lineup" aria-label="Clear this lineup">Clear</button>' +
          '<button type="button" class="ld-mini" id="lu-del" title="Delete this lineup" aria-label="Delete this lineup"' + (lu.lineups.length <= 1 ? ' disabled' : '') + '>Delete</button></div>' +
          '<p class="coach-note">' + (bb ? 'A blank whiteboard with magnetic name tags: drag any tag from the roster rack (left) anywhere on the white board; it stays where you drop it. Drag it back onto the rack to take it off. Each player can be on a lineup board once. Tags show the stored position (OF), never LF, CF, RF or DH.' : 'Drag player tags anywhere on the board. Lineup rules for ' + esc(sport) + ' are not decided yet.') + '</p>' +
          '<div class="ld-layout one">' + lineupCanvas() + '</div>' + importHtml();
      } else {
        var yrs = L.depthYears(dp), b = dp.boards[yrs[dp.active]];
        html += '<div class="ld-fields">' + seg('Years to plan', 'yrs', [[2, '2 Years'], [3, '3 Years'], [4, '4 Years']], dp.count) + '</div>' +
          '<div class="ld-tabs" role="group" aria-label="Seasons">' + yrs.map(function (y, i) { return '<button type="button" class="ld-tab' + (i === dp.active ? ' on' : '') + '" aria-pressed="' + (i === dp.active) + '" data-tab="' + i + '">' + y + ' Season</button>'; }).join('') + '</div>' +
          (bb ? '<p class="kpi-row"><span class="pill amber">Empty depth slots in ' + yrs[dp.active] + ': ' + L.totalOpen(b) + '</span></p>' : '') +
          '<p class="coach-note">' + (bb ? 'Drag tags from the roster onto the field (the roster keeps every player, so a drop adds a copy). Tags dropped near a position stack there in depth order: S = Starter, then B1, B2 and so on (five slots per position; the same player can be listed at several positions, once per position). Pitchers live in the panel to the right of the field: a Starting Rotation of five slots (SP1 to SP5) and a Bullpen of twenty (RP1 to RP20). Tags dropped elsewhere stay where you put them. LF, CF and RF are display areas only; stored positions stay OF. Players whose class has graduated by that season are flagged, not blocked.' : 'Drag tags anywhere on the ' + esc(outline.label.toLowerCase()) + '. Positions and depth slots for ' + esc(sport) + ' are not decided yet.') + '</p>' +
          '<div class="ld-layout">' + depthCanvas() + trayHtml(trayList(), 'Current Roster', 'Fictional current roster (sample data) plus any rows you imported. No recruits or prospects are used.') + '</div>' + importHtml();
      }
      host.innerHTML = html;
      if (ui.focus) { var f = host.querySelector('[data-key="' + ui.focus.replace(/"/g, '') + '"]'); if (f) f.focus(); ui.focus = ''; }
    }

    function nameOf(pid) { var p = byId()[pid]; return p ? p.name : 'Player'; }
    function drop(pid, x, y, fromKey) {
      if (isLineup) {
        var r = L.lineupDrop(curLU(), pid, x, y);
        lu.lineups[lu.active] = r.lineup;
        ui.focus = pid; ui.status = nameOf(pid) + ' placed on the board';
      } else {
        var y0 = curYear(), d = L.depthDrop(dp.boards[y0], pid, x, y, fromKey, !bb);
        if (!d.ok) { ui.status = d.reason; draw(); return; }
        dp.boards[y0] = d.board; ui.focus = L.key(pid, d.group);
        ui.status = nameOf(pid) + (d.group ? ' listed at ' + d.group + ' as ' + L.depthLabel(d.index, d.group) : ' placed on the canvas');
      }
      saved(); draw();
    }
    function toTray(pid, k) {
      if (isLineup) lu.lineups[lu.active] = L.lineupRemove(curLU(), k); else dp.boards[curYear()] = L.depthRemove(dp.boards[curYear()], k);
      ui.status = nameOf(pid) + (isLineup ? ' taken off the board (still on the roster)' : ' removed from this depth chart (still on the roster)'); ui.focus = ''; saved(); draw();
      var t = host.querySelector('.ld-tray-list [data-pid="' + pid + '"]'); if (t) t.focus();
    }
    function posOf(pid, k) {
      if (isLineup) { var lt = L.lineupTags(curLU()).filter(function (x) { return x.key === k; })[0]; return lt ? { x: lt.x, y: lt.y } : null; }
      var b = dp.boards[curYear()], t = b.tags.filter(function (x) { return L.key(x.pid, x.g) === k; })[0]; if (!t) return null; var p = L.depthPos(b, t); p.g = t.g; return p;
    }

    var drag = null;
    host.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return; var t = e.target.closest && e.target.closest('.ld-tag'); if (!t) return;
      drag = { el: t, pid: t.dataset.pid, key: t.dataset.key, where: t.dataset.where, sx: e.clientX, sy: e.clientY, ghost: null };
      if (e.cancelable) e.preventDefault();
      clearSel();
    });
    function clearSel() { try { var s = root.getSelection && root.getSelection(); if (s && s.removeAllRanges) s.removeAllRanges(); } catch (x) { /* ignore */ } }
    // Stop the browser's text/element selection highlight and native drag image while dragging tags (the search box stays selectable).
    host.addEventListener('mousedown', function (e) { var t = e.target.closest && e.target.closest('.ld-tag'); if (t) { e.preventDefault(); clearSel(); try { t.focus({ preventScroll: true }); } catch (x) { /* ignore */ } } });
    host.addEventListener('selectstart', function (e) { var el = e.target && (e.target.nodeType === 1 ? e.target : e.target.parentElement); if (drag || (el && el.closest && el.closest('.ld-tag, .ld-canvas, .ld-roster-panel .ld-tray-list') && !(el.closest('input, textarea')))) e.preventDefault(); });
    host.addEventListener('dragstart', function (e) { e.preventDefault(); });
    doc.addEventListener('pointermove', function (e) {
      if (!drag) return;
      if (!drag.ghost && Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 5) { var g = drag.el.cloneNode(true); g.classList.add('ld-floating'); g.removeAttribute('tabindex'); g.style.left = ''; g.style.top = ''; doc.body.appendChild(g); drag.ghost = g; drag.el.classList.add('dragging'); }
      if (drag.ghost) { drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px'; e.preventDefault(); }
    });
    function endDrag(e, cancel) {
      if (!drag) return; var d = drag; drag = null; d.el.classList.remove('dragging');
      if (!d.ghost) return; d.ghost.parentNode.removeChild(d.ghost); if (cancel) return;
      var cv = doc.getElementById('ld-canvas'); if (!cv) return; var r = cv.getBoundingClientRect();
      var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (inside && isLineup && d.where === 'canvas' && (e.clientX - r.left) / r.width < L.ROSTER_W) toTray(d.pid, d.key);
      else if (inside && isLineup && (e.clientX - r.left) / r.width < L.ROSTER_W) return;
      else if (inside) drop(d.pid, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, d.where === 'canvas' ? d.key : null);
      else if (d.where === 'canvas') toTray(d.pid, d.key);
    }
    doc.addEventListener('pointerup', function (e) { endDrag(e, false); });
    doc.addEventListener('pointercancel', function (e) { endDrag(e, true); });

    host.addEventListener('keydown', function (e) {
      var t = e.target.closest && e.target.closest('.ld-tag'); if (!t) return;
      var pid = t.dataset.pid, k = t.dataset.key, k2 = e.key;
      if (t.dataset.where === 'tray') { if (k2 === 'Enter' || k2 === ' ') { e.preventDefault(); var s = L.defaultSpot(byId()[pid], isLineup ? 'lineup' : 'depth', isLineup ? curLU() : null, e.shiftKey); drop(pid, s.x, s.y, null); } return; }
      if (k2 === 'Delete' || k2 === 'Backspace' || k2 === 'Enter' || k2 === ' ') { e.preventDefault(); toTray(pid, k); return; }
      var dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k2]; if (!dir) return;
      e.preventDefault(); var pos = posOf(pid, k); if (!pos) return;
      var snapped = isLineup ? false : !!pos.g;
      if (snapped && dir[1]) {
        { var q = L.depthReorder(dp.boards[curYear()], k, dir[1]); if (!q.noop) { dp.boards[curYear()] = q.board; ui.focus = k; ui.status = nameOf(pid) + ' moved to ' + L.depthLabel(q.index, pos.g) + ' at ' + pos.g; saved(); draw(); } }
        return;
      }
      var st = snapped ? 0.12 : (e.shiftKey ? 0.08 : 0.02);
      drop(pid, pos.x + dir[0] * st, pos.y + dir[1] * st, k);
    });

    host.addEventListener('input', function (e) {
      var t = e.target;
      if (t.id === 'ld-q') { ui.q = t.value; var items = trayList().filter(function (x) { var q = ui.q.toLowerCase(); return !q || (x.p.name + ' ' + x.p.pos + ' #' + x.p.jersey).toLowerCase().indexOf(q) >= 0; }); doc.getElementById('ld-tray-list').innerHTML = trayItems(items); doc.getElementById('ld-count').textContent = items.length; return; }
    });
    host.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('button') : null; if (!t) return;
      if (t.dataset.tab != null) { if (isLineup) lu.active = Number(t.dataset.tab); else dp.active = Number(t.dataset.tab); saved(); draw(); return; }
      if (t.dataset.yrs) { dp = L.setYears(dp, t.dataset.yrs); saved(); draw(); return; }
      var r;
      if (t.id === 'lu-add') { r = L.addLineup(lu); ui.status = r.ok ? 'Lineup added.' : r.reason; lu = r.state; saved(); draw(); }
      else if (t.id === 'lu-dup') { r = L.duplicateLineup(lu, lu.active); ui.status = r.ok ? 'Lineup duplicated.' : r.reason; lu = r.state; saved(); draw(); }
      else if (t.id === 'lu-del') { if (root.confirm && !root.confirm('Delete this lineup page?')) return; r = L.removeLineup(lu, lu.active); ui.status = r.ok ? 'Lineup deleted.' : r.reason; lu = r.state; saved(); draw(); }
      else if (t.id === 'lu-clr') { lu.lineups[lu.active] = L.clearLineup(curLU()); ui.status = 'Lineup cleared.'; saved(); draw(); }
      else if (t.id === 'ld-reset') { if (root.confirm && !root.confirm('Reset all lineup and depth chart drafts and imported roster rows in this browser?')) return; [K_LU, K_DP, K_RO].forEach(function (k) { try { root.localStorage.removeItem(k); } catch (x) { /* ignore */ } }); imported = []; lu = L.newLineupState(); dp = L.sanitizeDepth(null, ids(), undefined, roster()); ui.status = 'Drafts reset.'; draw(); }
      else if (t.id === 'ld-prev') preview();
      else if (t.id === 'ld-commit') commit();
    });

    // CSV import (preview -> review -> explicit add). The position choices here are import review, not player placement.
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
        out.innerHTML = '<div class="table-wrap"><table><caption class="visually-hidden">Import preview</caption><thead><tr><th scope="col">Line</th><th scope="col">Name</th><th scope="col">Position</th><th scope="col">Grad Year</th><th scope="col">Jersey #</th><th scope="col">Status</th><th scope="col">Decision</th></tr></thead><tbody>' +
          pv.rows.map(function (r) {
            var dec = r.status === 'ok' ? 'Will be added' : r.status === 'error' ? 'Cannot be added' : '<label class="visually-hidden" for="d-' + r.line + '">Decision for line ' + r.line + '</label><select id="d-' + r.line + '" data-dec="' + r.line + '"><option value="skip">Skip (default)</option><option value="add">Add with position</option></select> <select aria-label="Position for line ' + r.line + '" data-decpos="' + r.line + '">' + posOpt(r.suggestion) + '</select> <input type="text" inputmode="numeric" size="3" maxlength="2" aria-label="Jersey number for line ' + r.line + '" data-decjersey="' + r.line + '" value="' + esc(r.jersey || '') + '" />';
            return '<tr data-row="' + r.line + '"><td>' + r.line + '</td><td>' + esc(r.name) + '</td><td>' + esc(r.rawPos) + '</td><td>' + esc(isFinite(r.grad) ? r.grad : '') + '</td><td>' + esc(r.rawJersey) + '</td><td><span class="pill ' + (r.status === 'ok' ? 'green' : r.status === 'error' ? 'red' : 'amber') + '">' + (r.status === 'ok' ? 'OK' : r.status === 'error' ? 'Error' : 'Needs Review') + '</span>' + r.issues.map(function (x) { return '<br /><small>' + esc(x) + '</small>'; }).join('') + '</td><td>' + dec + '</td></tr>';
          }).join('') + '</tbody></table></div><label><input type="checkbox" id="ld-rev" /> I reviewed these rows</label> <button type="button" class="button button-primary" id="ld-commit">Add Reviewed Rows To Roster</button>';
      });
    }
    function commit() {
      var rev = doc.getElementById('ld-rev');
      if (!pv || !rev || !rev.checked) { ui.status = 'Tick "I reviewed these rows" first.'; var n = doc.getElementById('ld-live'); if (n) n.textContent = ui.status; return; }
      var dec = {};
      pv.rows.forEach(function (r) { var d = doc.querySelector('[data-dec="' + r.line + '"]'); if (d) { var ps = doc.querySelector('[data-decpos="' + r.line + '"]'); var js = doc.querySelector('[data-decjersey="' + r.line + '"]'); dec[r.line] = { action: d.value, pos: ps && ps.value ? ps.value : null, jersey: js ? js.value : null }; } });
      var res = L.commitImport(pv, dec, true, ids(), roster().map(function (p) { return p.jersey; }));
      imported = imported.concat(res.added); wr(K_RO, imported); pv = null;
      ui.status = res.added.length + ' player' + (res.added.length === 1 ? '' : 's') + ' added to this session roster; ' + res.skipped.length + ' row' + (res.skipped.length === 1 ? '' : 's') + ' skipped.';
      draw();
    }
    draw();
  }
  root.TheReadLineupUI = { mount: mount };
})(typeof window !== 'undefined' ? window : this);
