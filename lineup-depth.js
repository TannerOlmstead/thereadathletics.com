/* Lineup and Depth Chart LOGIC (baseball preview). Pure functions, no DOM, no storage, no network.
   Everything here is a configurable preview default, not approved policy (see docs/LINEUP_DEPTH_CHART_BACKEND_REQUIREMENTS.md).
   Stored/validated positions stay P, C, 1B, 2B, 3B, SS, OF everywhere. LF, CF and RF exist ONLY as display slots on the
   Lineup and Depth Chart pages (user-approved scoped exception); they map to a stored OF position and are never stored as a position. */
(function (root) {
  'use strict';
  var STORED_POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'OF'];
  var OF_SLOTS = ['LF', 'CF', 'RF'];
  var SLOTS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
  var CONFIG = {
    maxLineups: 4,
    battingSlots: 9,
    minYears: 2, maxYears: 4, defaultYears: 4,
    depthSlots: { P: 5, C: 3, '1B': 3, '2B': 3, '3B': 3, SS: 3, LF: 3, CF: 3, RF: 3 },
    depthLabels: ['Starter', 'Backup 1', 'Backup 2', 'Backup 3', 'Backup 4']
  };

  function slotStored(slot) { return OF_SLOTS.indexOf(slot) >= 0 ? 'OF' : slot; }
  // Non-blocking hint only: coaches may place anyone anywhere; the stored position never changes.
  function slotFit(slot, p) {
    if (!p) return { ok: true };
    var need = slotStored(slot), have = [p.pos, p.sec];
    if (need === 'P' && p.twoWay) return { ok: true };
    return have.indexOf(need) >= 0 ? { ok: true } : { ok: false, note: 'Stored position ' + (p.pos || 'not set') + ' (slot ' + slot + ')' };
  }

  function clamp(v, lo, hi) { v = Number(v); if (!isFinite(v)) v = (lo + hi) / 2; return Math.max(lo, Math.min(hi, v)); }
  // Canvas coordinates are fractions (0..1) of the canvas width/height and refer to the CENTER of a tag.
  var BOUNDS = { x0: 0.07, x1: 0.93, y0: 0.04, y1: 0.96 };
  function cx(v) { return clamp(v, BOUNDS.x0, BOUNDS.x1); }
  function cy(v) { return clamp(v, BOUNDS.y0, BOUNDS.y1); }
  function round(v) { return Math.round(v * 1000) / 1000; }

  // ---------- Lineup canvas: numbered batting-order lane (9 rows, left) plus a free area ----------
  // Rule: batting order = the tags in the lane, top row = 1. Tags anywhere else on the canvas are free notes (not in the order).
  var LANE = { x0: 0.01, x1: 0.22, y0: 0.04, y1: 0.96 };
  function laneRowY(i) { var h = (LANE.y1 - LANE.y0) / CONFIG.battingSlots; return round(LANE.y0 + h * (i + 0.5)); }
  function laneX() { return round((LANE.x0 + LANE.x1) / 2); }
  function laneIndexAt(x, y) {
    if (x < LANE.x0 || x > LANE.x1 || y < LANE.y0 || y > LANE.y1) return -1;
    return Math.min(CONFIG.battingSlots - 1, Math.floor((y - LANE.y0) / ((LANE.y1 - LANE.y0) / CONFIG.battingSlots)));
  }
  function emptyOrder() { var a = []; for (var i = 0; i < CONFIG.battingSlots; i++) a.push(null); return a; }
  function newLineup(n, label) { return { id: 'L' + n, label: label || 'Lineup ' + n, opponent: '', date: '', free: {}, order: emptyOrder() }; }
  function cloneLineup(l) { var f = {}; Object.keys(l.free).forEach(function (k) { f[k] = { x: l.free[k].x, y: l.free[k].y }; }); return { id: l.id, label: l.label, opponent: l.opponent, date: l.date, free: f, order: l.order.slice() }; }
  function lineupPids(l) { var s = {}; l.order.forEach(function (p) { if (p) s[p] = 1; }); Object.keys(l.free).forEach(function (p) { s[p] = 1; }); return s; }
  function lineupPos(l, pid) { var i = l.order.indexOf(pid); if (i >= 0) return { x: laneX(), y: laneRowY(i), lane: i }; return l.free[pid] ? { x: l.free[pid].x, y: l.free[pid].y, lane: -1 } : null; }
  // Drop (or move) a player at canvas fractions x,y. In the lane: takes that batting-order row (swap if the source was also in the lane,
  // otherwise the displaced player moves to the free area beside the lane). Elsewhere: free placement, clamped inside the canvas.
  function lineupDrop(lu, pid, x, y, noLane) {
    var l = cloneLineup(lu), src = l.order.indexOf(pid), row = noLane ? -1 : laneIndexAt(x, y);
    if (row >= 0) {
      var occ = l.order[row];
      if (src === row) return { lineup: lu, noop: true };
      delete l.free[pid];
      if (src >= 0) { l.order[src] = occ || null; } else if (occ) { l.free[occ] = { x: round(cx(LANE.x1 + 0.1)), y: round(cy(laneRowY(row))) }; }
      l.order[row] = pid;
      return { lineup: l, row: row, swapped: !!(occ && src >= 0), displaced: occ && src < 0 ? occ : null };
    }
    if (src >= 0) l.order[src] = null;
    l.free[pid] = { x: round(cx(x)), y: round(cy(y)) };
    return { lineup: l, row: -1 };
  }
  function lineupRemove(lu, pid) { var l = cloneLineup(lu); var i = l.order.indexOf(pid); if (i >= 0) l.order[i] = null; delete l.free[pid]; return l; }
  function lineupReorder(lu, pid, delta) {
    var i = lu.order.indexOf(pid), j = i + delta; if (i < 0 || j < 0 || j >= lu.order.length) return { lineup: lu, noop: true };
    var l = cloneLineup(lu), t = l.order[j]; l.order[j] = pid; l.order[i] = t; return { lineup: l, row: j };
  }
  function battingOrder(lu) { return lu.order.slice(); }
  function newLineupState() { return { lineups: [newLineup(1)], active: 0 }; }
  function nextId(st) { var used = st.lineups.map(function (l) { return l.id; }), n = 1; while (used.indexOf('L' + n) >= 0) n++; return n; }
  function addLineup(st) {
    if (st.lineups.length >= CONFIG.maxLineups) return { ok: false, reason: 'Up to ' + CONFIG.maxLineups + ' lineups are allowed.', state: st };
    return { ok: true, state: { lineups: st.lineups.concat([newLineup(nextId(st))]), active: st.lineups.length } };
  }
  function duplicateLineup(st, i) {
    if (st.lineups.length >= CONFIG.maxLineups) return { ok: false, reason: 'Up to ' + CONFIG.maxLineups + ' lineups are allowed.', state: st };
    var c = cloneLineup(st.lineups[i]); c.id = 'L' + nextId(st); c.label = st.lineups[i].label + ' (Copy)';
    return { ok: true, state: { lineups: st.lineups.concat([c]), active: st.lineups.length } };
  }
  function removeLineup(st, i) {
    if (st.lineups.length <= 1) return { ok: false, reason: 'At least one lineup page is kept.', state: st };
    var l = st.lineups.filter(function (_, k) { return k !== i; });
    return { ok: true, state: { lineups: l, active: Math.max(0, Math.min(l.length - 1, st.active > i ? st.active - 1 : st.active)) } };
  }
  function clearLineup(l) { var c = newLineup(Number(String(l.id).slice(1)) || 1, l.label); c.id = l.id; c.opponent = l.opponent; c.date = l.date; return c; }

  // ---------- Depth chart canvas: baseball field with position areas ----------
  // Snapped tags stack under the position anchor, top = Starter, then Backup 1... ; free tags keep their own coordinates.
  var ANCHORS = { P: { x: 0.5, y: 0.52 }, C: { x: 0.5, y: 0.80 }, '1B': { x: 0.76, y: 0.62 }, '2B': { x: 0.70, y: 0.44 }, '3B': { x: 0.24, y: 0.62 }, SS: { x: 0.30, y: 0.44 }, LF: { x: 0.16, y: 0.20 }, CF: { x: 0.5, y: 0.08 }, RF: { x: 0.84, y: 0.20 } };
  var STACK_STEP = 0.045, SNAP_RADIUS = 0.15;
  function key(pid, g) { return pid + '|' + (g || 'free'); }
  function newDepthBoard() { return { tags: [] }; }
  function cloneDepth(b) { return { tags: b.tags.map(function (t) { return { pid: t.pid, g: t.g, x: t.x, y: t.y }; }) }; }
  function groupTags(b, g) { return b.tags.filter(function (t) { return t.g === g; }); }
  function depthOrder(b, g) { return groupTags(b, g).map(function (t) { return t.pid; }); }
  function depthLabel(i) { return CONFIG.depthLabels[i] || 'Depth ' + (i + 1); }
  function depthPos(b, t) { if (!t.g) return { x: t.x, y: t.y }; var i = groupTags(b, t.g).indexOf(t), a = ANCHORS[t.g]; return { x: a.x, y: round(cy(a.y + i * STACK_STEP)) }; }
  function nearestGroup(x, y, b) {
    var best = null, bd = SNAP_RADIUS;
    SLOTS.forEach(function (g) { var n = Math.max(1, b ? groupTags(b, g).length : 1), a = ANCHORS[g], d = Math.sqrt(Math.pow(x - a.x, 2) + Math.pow(y - (a.y + STACK_STEP * (n - 1) / 2), 2)); if (d <= bd) { bd = d; best = g; } });
    return best;
  }
  function openSpots(b, g) { return Math.max(0, CONFIG.depthSlots[g] - groupTags(b, g).length); }
  function totalOpen(b) { return SLOTS.reduce(function (s, g) { return s + openSpots(b, g); }, 0); }
  // Drop a player tag at x,y. fromKey = key of the tag being moved (omit when it comes from the tray).
  // Near a position area it snaps to that position (a player is listed once per position); elsewhere it is a free tag (once per board).
  function depthDrop(board, pid, x, y, fromKey, noSnap) {
    var b = cloneDepth(board);
    if (fromKey) b.tags = b.tags.filter(function (t) { return key(t.pid, t.g) !== fromKey; });
    var g = noSnap ? null : nearestGroup(x, y, b);
    b.tags = b.tags.filter(function (t) { return !(t.pid === pid && t.g === g && (fromKey ? true : g === null)) || false; });
    if (g) {
      if (groupTags(b, g).some(function (t) { return t.pid === pid; })) return { ok: false, reason: 'Already listed at ' + g + '.', board: board };
      if (openSpots(b, g) <= 0) return { ok: false, reason: g + ' depth is full (' + CONFIG.depthSlots[g] + ').', board: board };
      var list = groupTags(b, g), at = 0;
      for (var i = 0; i < list.length; i++) { if (ANCHORS[g].y + i * STACK_STEP < y) at = i + 1; }
      var before = list.slice(0, at), idx = at === 0 ? b.tags.indexOf(list[0]) : b.tags.indexOf(before[before.length - 1]) + 1;
      if (!list.length) idx = b.tags.length;
      b.tags.splice(idx, 0, { pid: pid, g: g, x: 0, y: 0 });
      return { ok: true, board: b, group: g, index: at };
    }
    b.tags = b.tags.filter(function (t) { return !(t.pid === pid && !t.g); });
    b.tags.push({ pid: pid, g: null, x: round(cx(x)), y: round(cy(y)) });
    return { ok: true, board: b, group: null };
  }
  function depthRemove(board, k) { var b = cloneDepth(board); b.tags = b.tags.filter(function (t) { return key(t.pid, t.g) !== k; }); return b; }
  function depthReorder(board, k, delta) {
    var b = cloneDepth(board), t = b.tags.filter(function (x) { return key(x.pid, x.g) === k; })[0];
    if (!t || !t.g) return { board: board, noop: true };
    var list = groupTags(b, t.g), i = list.indexOf(t), j = i + delta; if (j < 0 || j >= list.length) return { board: board, noop: true };
    var a = b.tags.indexOf(list[i]), c = b.tags.indexOf(list[j]), tmp = b.tags[a]; b.tags[a] = b.tags[c]; b.tags[c] = tmp;
    return { board: b, index: j };
  }
  function clampYears(n) { n = n == null || n === '' ? NaN : Math.round(Number(n)); if (!isFinite(n)) n = CONFIG.defaultYears; return Math.max(CONFIG.minYears, Math.min(CONFIG.maxYears, n)); }
  function firstSeason(now) { now = now || new Date(); return now.getFullYear() + (now.getMonth() >= 6 ? 1 : 0); }
  function newDepthState(now, years) {
    var f = firstSeason(now), st = { first: f, count: clampYears(years), active: 0, boards: {} };
    for (var i = 0; i < CONFIG.maxYears; i++) st.boards[f + i] = newDepthBoard();
    return st;
  }
  function depthYears(st) { var a = []; for (var i = 0; i < st.count; i++) a.push(st.first + i); return a; }
  function setYears(st, n) { var c = clampYears(n); return { first: st.first, count: c, active: Math.min(st.active, c - 1), boards: st.boards }; }
  // Availability hint for a season: graduated players are flagged, never blocked (class-year labeling is a founder decision).
  function yearNote(p, year) { return p && p.grad && p.grad < year ? 'Class of ' + p.grad + ' (graduated before ' + year + ')' : ''; }
  // Default drop spot for keyboard "send to canvas": the player's own position area when it is unambiguous, else the free area.
  function defaultSpot(p, kind, lu) {
    if (kind === 'lineup') { var i = lu.order.indexOf(null); return i >= 0 ? { x: laneX(), y: laneRowY(i) } : { x: 0.5, y: 0.5 }; }
    var g = p && p.pos === 'OF' ? 'CF' : p && SLOTS.indexOf(p.pos) >= 0 ? p.pos : null;
    return g ? { x: ANCHORS[g].x, y: ANCHORS[g].y } : { x: 0.5, y: 0.36 };
  }

  // ---------- Saving / loading drafts: sanitize anything read back ----------
  function num(v) { return typeof v === 'number' && isFinite(v); }
  function sanitizeLineups(raw, validIds) {
    var ok = {}; (validIds || []).forEach(function (i) { ok[i] = 1; });
    var st = { lineups: [], active: 0 };
    if (raw && Array.isArray(raw.lineups)) raw.lineups.slice(0, CONFIG.maxLineups).forEach(function (r, n) {
      if (!r || typeof r !== 'object') return;
      var l = newLineup(n + 1); l.id = 'L' + (n + 1);
      l.label = typeof r.label === 'string' && r.label.trim() ? r.label.slice(0, 40) : l.label;
      l.opponent = typeof r.opponent === 'string' ? r.opponent.slice(0, 60) : ''; l.date = typeof r.date === 'string' ? r.date.slice(0, 30) : '';
      var seen = {};
      if (Array.isArray(r.order)) r.order.slice(0, CONFIG.battingSlots).forEach(function (p, i) { if (typeof p === 'string' && ok[p] && !seen[p]) { seen[p] = 1; l.order[i] = p; } });
      if (r.free && typeof r.free === 'object') Object.keys(r.free).forEach(function (p) { var f = r.free[p]; if (ok[p] && !seen[p] && f && num(f.x) && num(f.y)) { seen[p] = 1; l.free[p] = { x: round(cx(f.x)), y: round(cy(f.y)) }; } });
      st.lineups.push(l);
    });
    if (!st.lineups.length) return newLineupState();
    st.active = Math.max(0, Math.min(st.lineups.length - 1, Number(raw.active) || 0));
    return st;
  }
  function sanitizeDepth(raw, validIds, now) {
    var ok = {}; (validIds || []).forEach(function (i) { ok[i] = 1; });
    var st = newDepthState(now, raw && raw.count);
    if (raw && raw.first === st.first && raw.boards && typeof raw.boards === 'object') Object.keys(st.boards).forEach(function (y) {
      var r = raw.boards[y], seen = {}, cnt = {};
      if (!r || !Array.isArray(r.tags)) return;
      r.tags.slice(0, 200).forEach(function (t) {
        if (!t || typeof t.pid !== 'string' || !ok[t.pid]) return;
        var g = t.g == null ? null : t.g; if (g !== null && SLOTS.indexOf(g) < 0) return;
        var k = key(t.pid, g); if (seen[k]) return;
        if (g) { cnt[g] = (cnt[g] || 0) + 1; if (cnt[g] > CONFIG.depthSlots[g]) return; seen[k] = 1; st.boards[y].tags.push({ pid: t.pid, g: g, x: 0, y: 0 }); }
        else if (num(t.x) && num(t.y)) { seen[k] = 1; st.boards[y].tags.push({ pid: t.pid, g: null, x: round(cx(t.x)), y: round(cy(t.y)) }); }
      });
    });
    st.active = Math.max(0, Math.min(st.count - 1, Number(raw && raw.active) || 0));
    return st;
  }

  // ---------- CSV roster import (client-side preview; never uploaded) ----------
  function parseCsv(text) {
    text = String(text == null ? '' : text).replace(/^\uFEFF/, '');
    var rows = [], row = [], cur = '', q = false, i, c;
    for (i = 0; i < text.length; i++) {
      c = text.charAt(i);
      if (q) { if (c === '"') { if (text.charAt(i + 1) === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true;
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text.charAt(i + 1) === '\n') i++; row.push(cur); cur = ''; rows.push(row); row = []; }
      else cur += c;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return String(x).trim() !== ''; }); });
  }
  var HDR = { name: ['name', 'player', 'player name'], pos: ['position', 'pos', 'primary position'], grad: ['grad year', 'grad', 'class', 'graduation year'], sec: ['secondary position', 'secondary', 'sec'], twoWay: ['two-way', 'two way', 'twoway'] };
  function norm(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }
  function posCheck(raw, label) {
    var v = String(raw || '').trim().toUpperCase();
    if (!v) return { value: '' };
    if (STORED_POSITIONS.indexOf(v) >= 0) return { value: v };
    if (OF_SLOTS.indexOf(v) >= 0) return { value: '', review: label + ' "' + v + '" is not a stored position. Suggested mapping: OF (confirm to accept).', suggestion: 'OF' };
    return { value: '', review: label + ' "' + String(raw).trim() + '" is not a valid position (allowed: ' + STORED_POSITIONS.join(', ') + '). Choose a valid position or skip.' };
  }
  function importPreview(text, existing) {
    var out = { fileErrors: [], rows: [] }, data = parseCsv(text);
    if (!data.length) { out.fileErrors.push('The file is empty.'); return out; }
    var heads = data[0].map(norm), idx = {};
    Object.keys(HDR).forEach(function (k) { idx[k] = -1; HDR[k].forEach(function (a) { if (idx[k] < 0) idx[k] = heads.indexOf(a); }); });
    ['name', 'pos', 'grad'].forEach(function (k) { if (idx[k] < 0) out.fileErrors.push('Missing required column: ' + { name: 'Name', pos: 'Position', grad: 'Grad Year' }[k] + '.'); });
    if (out.fileErrors.length) return out;
    if (data.length === 1) { out.fileErrors.push('The file has a header row but no players.'); return out; }
    if (data.length > 201) { out.fileErrors.push('Preview limit: 200 players per file.'); return out; }
    var have = {}; (existing || []).forEach(function (p) { have[norm(p.name) + '|' + p.grad] = 1; });
    var seen = {};
    data.slice(1).forEach(function (r, n) {
      var g = function (k) { return idx[k] >= 0 ? String(r[idx[k]] == null ? '' : r[idx[k]]).trim() : ''; };
      var row = { line: n + 2, name: g('name'), pos: '', sec: '', grad: Number(g('grad')), twoWay: /^(y|yes|true|1)$/i.test(g('twoWay')), status: 'ok', issues: [], suggestion: '', rawPos: g('pos') };
      var bad = [];
      if (!row.name) bad.push('Name is missing.');
      if (!/^\d{4}$/.test(g('grad')) || row.grad < 2000 || row.grad > 2045) bad.push('Grad Year must be a four-digit year (2000-2045).');
      var pc = posCheck(g('pos'), 'Position'), sc = posCheck(g('sec'), 'Secondary position');
      if (!g('pos')) bad.push('Position is missing.');
      row.pos = pc.value; row.sec = sc.value;
      if (bad.length) { row.status = 'error'; row.issues = bad; out.rows.push(row); return; }
      if (pc.review) { row.status = 'review'; row.issues.push(pc.review); row.suggestion = pc.suggestion || ''; }
      if (sc.review) { row.status = 'review'; row.issues.push(sc.review); row.secSuggestion = sc.suggestion || ''; }
      if (row.pos && row.sec && row.pos === row.sec) { row.status = 'review'; row.issues.push('Secondary position matches the primary position.'); }
      var key = norm(row.name) + '|' + row.grad;
      if (seen[key]) { row.status = 'review'; row.dupe = 'file'; row.issues.push('Duplicate of line ' + seen[key] + ' in this file. Skipped unless you choose to add it.'); } else seen[key] = row.line;
      if (have[key]) { row.status = 'review'; row.dupe = 'roster'; row.issues.push('Possible match with an existing player (same name and grad year). Existing data is never overwritten.'); }
      out.rows.push(row);
    });
    return out;
  }
  /* decisions[line] = { action: 'add'|'skip', pos?, sec? }. Rows needing review are added only with an explicit decision AND a valid stored position.
     `reviewed` must be true. Error rows are never added. Existing players are never modified. */
  function commitImport(preview, decisions, reviewed, existingIds) {
    if (reviewed !== true) throw new Error('Review the rows before adding them.');
    decisions = decisions || {};
    var added = [], skipped = [], n = 0, ids = {}; (existingIds || []).forEach(function (i) { ids[i] = 1; });
    preview.rows.forEach(function (r) {
      var d = decisions[r.line], add = false, pos = r.pos, sec = r.sec;
      if (r.status === 'ok') add = !d || d.action !== 'skip';
      else if (r.status === 'review') { add = !!d && d.action === 'add'; if (d && d.pos != null) pos = String(d.pos).toUpperCase(); if (d && d.sec != null) sec = String(d.sec).toUpperCase(); }
      if (add && STORED_POSITIONS.indexOf(pos) < 0) add = false;
      if (add && sec && STORED_POSITIONS.indexOf(sec) < 0) add = false;
      if (!add) { skipped.push(r.line); return; }
      do { n++; } while (ids['IMP-' + String(n).padStart(3, '0')]);
      var id = 'IMP-' + String(n).padStart(3, '0'); ids[id] = 1;
      added.push({ id: id, name: r.name, pos: pos, sec: sec === pos ? '' : sec, grad: r.grad, twoWay: !!r.twoWay, sport: 'Baseball', imported: true });
    });
    return { added: added, skipped: skipped };
  }

  /* Court/field outlines for the Depth Chart canvas: lightweight inline SVG in a 1000x800 viewBox. Add a sport by adding an entry
     (or registerOutline); the renderer needs no changes. Unknown sports resolve to a plain white canvas. Outlines carry no positions or slots. */
  var S = 'fill="none" stroke="#9aa7b8" stroke-width="3"';
  var OUTLINES = {
    baseball: { label: 'Baseball field', svg: '<path d="M500 740 L860 380 A 480 480 0 0 0 140 380 Z" ' + S + '/><path d="M500 700 L700 520 L500 340 L300 520 Z" ' + S + '/><path d="M80 420 A 500 500 0 0 1 920 420" ' + S + '/><circle cx="500" cy="520" r="14" ' + S + '/><path d="M500 700 L80 280 M500 700 L920 280" ' + S + '/><path d="M485 715 h30 v-10 l-15 -10 l-15 10 z" ' + S + '/>' },
    softball: { label: 'Softball field', svg: '<path d="M500 740 L800 440 A 420 420 0 0 0 200 440 Z" ' + S + '/><path d="M500 700 L660 540 L500 380 L340 540 Z" ' + S + '/><path d="M120 440 A 440 440 0 0 1 880 440" ' + S + '/><circle cx="500" cy="560" r="40" ' + S + '/><path d="M500 700 L120 320 M500 700 L880 320" ' + S + '/>' },
    soccer: { label: 'Soccer pitch', svg: '<rect x="60" y="40" width="880" height="720" ' + S + '/><path d="M60 400 H940" ' + S + '/><circle cx="500" cy="400" r="90" ' + S + '/><rect x="290" y="40" width="420" height="150" ' + S + '/><rect x="290" y="610" width="420" height="150" ' + S + '/><rect x="400" y="40" width="200" height="60" ' + S + '/><rect x="400" y="700" width="200" height="60" ' + S + '/>' },
    basketball: { label: 'Basketball court', svg: '<rect x="60" y="40" width="880" height="720" ' + S + '/><path d="M60 400 H940" ' + S + '/><circle cx="500" cy="400" r="80" ' + S + '/><rect x="380" y="40" width="240" height="250" ' + S + '/><rect x="380" y="510" width="240" height="250" ' + S + '/><path d="M130 40 V150 A 370 370 0 0 0 870 150 V40" ' + S + '/><path d="M130 760 V650 A 370 370 0 0 1 870 650 V760" ' + S + '/>' },
    football: { label: 'Football field', svg: '<rect x="60" y="40" width="880" height="720" ' + S + '/><path d="M60 130 H940 M60 670 H940 M60 400 H940 M60 220 H940 M60 310 H940 M60 490 H940 M60 580 H940" ' + S + '/>' },
    volleyball: { label: 'Volleyball court', svg: '<rect x="120" y="40" width="760" height="720" ' + S + '/><path d="M120 400 H880 M120 250 H880 M120 550 H880" ' + S + '/>' }
  };
  var SPORT_OUTLINE = { baseball: 'baseball', softball: 'softball', soccer: 'soccer', 'mens-soccer': 'soccer', 'womens-soccer': 'soccer', basketball: 'basketball', 'mens-basketball': 'basketball', 'womens-basketball': 'basketball', football: 'football', volleyball: 'volleyball', 'womens-volleyball': 'volleyball' };
  function sportKey(name) { return String(name == null ? '' : name).toLowerCase().replace(/[\u2018\u2019']/g, '').replace(/\s+/g, '-'); }
  // Returns { id, label, svg, plain }. Unknown or missing sports: plain white canvas with no outline.
  function resolveOutline(sport) {
    var id = SPORT_OUTLINE[sportKey(sport)] || OUTLINES[sportKey(sport)] && sportKey(sport), o = id && OUTLINES[id];
    return o ? { id: id, label: o.label, svg: o.svg, plain: false } : { id: null, label: 'Plain canvas', svg: '', plain: true };
  }
  function registerOutline(id, label, svg, aliases) { OUTLINES[id] = { label: label, svg: svg }; SPORT_OUTLINE[id] = id; (aliases || []).forEach(function (a) { SPORT_OUTLINE[sportKey(a)] = id; }); }
  var api = { LANE: LANE, ANCHORS: ANCHORS, BOUNDS: BOUNDS, OUTLINES: OUTLINES, resolveOutline: resolveOutline, registerOutline: registerOutline, sportKey: sportKey,
    clamp: clamp, laneIndexAt: laneIndexAt, laneRowY: laneRowY, laneX: laneX, lineupDrop: lineupDrop, lineupRemove: lineupRemove, lineupReorder: lineupReorder, lineupPos: lineupPos, lineupPids: lineupPids, battingOrder: battingOrder,
    key: key, depthDrop: depthDrop, depthRemove: depthRemove, depthReorder: depthReorder, depthOrder: depthOrder, depthLabel: depthLabel, depthPos: depthPos, groupTags: groupTags, openSpots: openSpots, totalOpen: totalOpen, nearestGroup: nearestGroup, defaultSpot: defaultSpot, STORED_POSITIONS: STORED_POSITIONS, OF_SLOTS: OF_SLOTS, SLOTS: SLOTS, CONFIG: CONFIG, slotStored: slotStored, slotFit: slotFit,
        newLineup: newLineup, newLineupState: newLineupState, addLineup: addLineup, duplicateLineup: duplicateLineup, removeLineup: removeLineup, clearLineup: clearLineup,
    clampYears: clampYears, firstSeason: firstSeason, newDepthState: newDepthState, depthYears: depthYears, setYears: setYears, yearNote: yearNote,
    sanitizeLineups: sanitizeLineups, sanitizeDepth: sanitizeDepth, parseCsv: parseCsv, importPreview: importPreview, commitImport: commitImport };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.TheReadLineup = api;
})(typeof window !== 'undefined' ? window : this);
