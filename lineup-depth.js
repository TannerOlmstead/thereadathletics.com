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

  function emptyArr(n) { var a = []; for (var i = 0; i < n; i++) a.push(null); return a; }
  function makeBoard(groups, exclusive) { var g = {}; Object.keys(groups).forEach(function (k) { g[k] = emptyArr(groups[k]); }); return { groups: g, exclusive: !!exclusive }; }
  function cloneBoard(b) { var g = {}; Object.keys(b.groups).forEach(function (k) { g[k] = b.groups[k].slice(); }); return { groups: g, exclusive: b.exclusive }; }
  function find(b, pid, inGroup) {
    var ks = inGroup ? [inGroup] : Object.keys(b.groups);
    for (var i = 0; i < ks.length; i++) { var ix = b.groups[ks[i]].indexOf(pid); if (ix >= 0) return { group: ks[i], idx: ix }; }
    return null;
  }

  /* Move a player tag onto a slot. `from` = {group, idx} when dragged from a slot; null/undefined when it comes from a pool.
     Occupied target: swap with the source slot; from a pool the occupant simply returns to the pool. Never mutates the input. */
  function place(board, pid, group, idx, from) {
    var b = cloneBoard(board);
    if (!b.groups[group] || idx < 0 || idx >= b.groups[group].length) return { ok: false, reason: 'No such slot.', board: board };
    if (!from) from = b.exclusive ? find(b, pid) : find(b, pid, group);
    if (from && (!b.groups[from.group] || b.groups[from.group][from.idx] !== pid)) return { ok: false, reason: 'Source slot no longer holds that player.', board: board };
    if (from && from.group === group && from.idx === idx) return { ok: true, board: board, noop: true };
    var occ = b.groups[group][idx], displaced = null;
    if (!b.exclusive) {
      var dup = find(b, pid, group);
      if (dup && !(from && from.group === group && from.idx === dup.idx)) return { ok: false, reason: 'That player is already listed in this position group.', board: board };
      if (from && occ && from.group !== group && find(b, occ, from.group)) return { ok: false, reason: 'The displaced player is already listed in the source position group.', board: board };
    }
    b.groups[group][idx] = pid;
    if (from) b.groups[from.group][from.idx] = occ || null;
    else displaced = occ || null;
    return { ok: true, board: b, displaced: displaced, swapped: !!(from && occ) };
  }
  function removeAt(board, group, idx) { var b = cloneBoard(board); if (b.groups[group] && b.groups[group][idx] != null) b.groups[group][idx] = null; return b; }
  function placed(board) { var s = {}; Object.keys(board.groups).forEach(function (k) { board.groups[k].forEach(function (id) { if (id) s[id] = 1; }); }); return s; }

  // ---------- Lineups (up to maxLineups pages, each with its own matchup label) ----------
  function newLineup(n, label) {
    var field = {}; SLOTS.forEach(function (s) { field[s] = 1; });
    return { id: 'L' + n, label: label || 'Lineup ' + n, opponent: '', date: '', bat: makeBoard({ BAT: CONFIG.battingSlots }, true), field: makeBoard(field, true) };
  }
  function newLineupState() { return { lineups: [newLineup(1)], active: 0 }; }
  function addLineup(st) {
    if (st.lineups.length >= CONFIG.maxLineups) return { ok: false, reason: 'Up to ' + CONFIG.maxLineups + ' lineups are allowed.', state: st };
    var used = st.lineups.map(function (l) { return l.id; }), n = 1; while (used.indexOf('L' + n) >= 0) n++;
    var lu = newLineup(n);
    return { ok: true, state: { lineups: st.lineups.concat([lu]), active: st.lineups.length } };
  }
  function duplicateLineup(st, i) {
    if (st.lineups.length >= CONFIG.maxLineups) return { ok: false, reason: 'Up to ' + CONFIG.maxLineups + ' lineups are allowed.', state: st };
    var used = st.lineups.map(function (l) { return l.id; }), n = 1; while (used.indexOf('L' + n) >= 0) n++;
    var s = st.lineups[i], c = { id: 'L' + n, label: s.label + ' (Copy)', opponent: s.opponent, date: s.date, bat: cloneBoard(s.bat), field: cloneBoard(s.field) };
    return { ok: true, state: { lineups: st.lineups.concat([c]), active: st.lineups.length } };
  }
  function removeLineup(st, i) {
    if (st.lineups.length <= 1) return { ok: false, reason: 'At least one lineup page is kept.', state: st };
    var l = st.lineups.filter(function (_, k) { return k !== i; });
    return { ok: true, state: { lineups: l, active: Math.min(st.active, l.length - 1) } };
  }
  function clearLineup(lu) { var c = newLineup(Number(String(lu.id).slice(1)) || 1, lu.label); c.id = lu.id; c.opponent = lu.opponent; c.date = lu.date; return c; }

  // ---------- Depth chart (one page per recruiting year; 2 to 4 years) ----------
  function clampYears(n) { n = n == null || n === '' ? NaN : Math.round(Number(n)); if (!isFinite(n)) n = CONFIG.defaultYears; return Math.max(CONFIG.minYears, Math.min(CONFIG.maxYears, n)); }
  // First planning season: the next season still to be played (July onward counts as next calendar year).
  function firstSeason(now) { now = now || new Date(); return now.getFullYear() + (now.getMonth() >= 6 ? 1 : 0); }
  function newDepthBoard() { return makeBoard(CONFIG.depthSlots, false); }
  function newDepthState(now, years) {
    var f = firstSeason(now), st = { first: f, count: clampYears(years), active: 0, boards: {} };
    for (var i = 0; i < CONFIG.maxYears; i++) st.boards[f + i] = newDepthBoard();
    return st;
  }
  function depthYears(st) { var a = []; for (var i = 0; i < st.count; i++) a.push(st.first + i); return a; }
  function setYears(st, n) { var c = clampYears(n); return { first: st.first, count: c, active: Math.min(st.active, c - 1), boards: st.boards }; }
  // Availability hint for a season: graduated players are flagged, never blocked (class-year labeling is a founder decision).
  function yearNote(p, year) { return p && p.grad && p.grad < year ? 'Class of ' + p.grad + ' (graduated before ' + year + ')' : ''; }

  // ---------- Saving / loading drafts: sanitize anything read back ----------
  function cleanBoard(raw, tpl, ids) {
    var b = tpl, seen = {};
    if (raw && raw.groups) Object.keys(tpl.groups).forEach(function (k) {
      var arr = raw.groups[k]; if (!Array.isArray(arr)) return;
      for (var i = 0; i < tpl.groups[k].length; i++) {
        var id = arr[i];
        if (typeof id === 'string' && ids[id] && !(tpl.exclusive ? seen[id] : seen[k + '|' + id]) && b.groups[k].indexOf(id) < 0) { b.groups[k][i] = id; seen[tpl.exclusive ? id : k + '|' + id] = 1; }
      }
    });
    return b;
  }
  function str(v, n) { return typeof v === 'string' ? v.slice(0, n) : ''; }
  function sanitizeLineups(raw, validIds) {
    var ids = {}; validIds.forEach(function (i) { ids[i] = 1; });
    if (!raw || !Array.isArray(raw.lineups) || !raw.lineups.length) return newLineupState();
    var out = [], used = {};
    raw.lineups.slice(0, CONFIG.maxLineups).forEach(function (l, k) {
      var id = /^L\d+$/.test(l && l.id) && !used[l.id] ? l.id : 'L' + (k + 1); if (used[id]) return; used[id] = 1;
      var t = newLineup(Number(id.slice(1)) || k + 1);
      t.id = id; t.label = str(l && l.label, 40) || t.label; t.opponent = str(l && l.opponent, 60); t.date = str(l && l.date, 30);
      t.bat = cleanBoard(l && l.bat, t.bat, ids); t.field = cleanBoard(l && l.field, t.field, ids); out.push(t);
    });
    if (!out.length) return newLineupState();
    return { lineups: out, active: Math.max(0, Math.min(out.length - 1, Number(raw.active) || 0)) };
  }
  function sanitizeDepth(raw, validIds, now) {
    var ids = {}; validIds.forEach(function (i) { ids[i] = 1; });
    var st = newDepthState(now, raw && raw.count);
    if (raw && raw.first === st.first && raw.boards) Object.keys(st.boards).forEach(function (y) { st.boards[y] = cleanBoard(raw.boards[y], st.boards[y], ids); });
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

  var api = { STORED_POSITIONS: STORED_POSITIONS, OF_SLOTS: OF_SLOTS, SLOTS: SLOTS, CONFIG: CONFIG, slotStored: slotStored, slotFit: slotFit,
    makeBoard: makeBoard, place: place, removeAt: removeAt, placed: placed, find: find,
    newLineupState: newLineupState, addLineup: addLineup, duplicateLineup: duplicateLineup, removeLineup: removeLineup, clearLineup: clearLineup,
    clampYears: clampYears, firstSeason: firstSeason, newDepthState: newDepthState, depthYears: depthYears, setYears: setYears, yearNote: yearNote,
    sanitizeLineups: sanitizeLineups, sanitizeDepth: sanitizeDepth, parseCsv: parseCsv, importPreview: importPreview, commitImport: commitImport };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.TheReadLineup = api;
})(typeof window !== 'undefined' ? window : this);
