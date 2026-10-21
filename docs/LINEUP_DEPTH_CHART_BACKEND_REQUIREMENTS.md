# Lineup and Depth Chart: Backend Requirements

`coach-lineup.html` and `coach-depth-chart.html` (logic in `lineup-depth.js`, interface in `lineup-depth-ui.js`) are a **front-end preview, baseball only**. The site has no backend, so none of the following is enforced today.

## What the preview does
- Both pages are a big white free-form canvas with draggable player name tags. Tags are moved with pointer events (mouse, touch, pen). There are no drop-down menus for placing players.
- Lineup: up to 4 lineups named "Lineup 1" to "Lineup 4" in one compact tab bar; the Add, Duplicate, Clear and Delete buttons sit right after the last tab (so a new tab appears where Add was and the buttons slide right). Each lineup is a blank white board with magnetic name tags and the roster rack (always full) on the left edge. There is no batting-order lane, no field slots, no DH slot, no snapping and no matchup section. A tag stays exactly where dropped (clamped inside the board); a player is on a board once; dropping a tag back on the rack removes it. Batting order is communicated only by how the coach arranges the tags.
- Depth Chart: 2 to 4 season tabs (default 4, first season = next season; July onward counts as next year). Each tab draws a sport outline behind the tags (baseball diamond). A tag dropped within 15% of the canvas of a position area (P, C, 1B, 2B, 3B, SS, LF, CF, RF) joins that position and stacks in order: S = Starter, then B1, B2 (5 slots for every position: Starter, Backup 1 to 4; there is no DH group; the same player may be listed at several positions, once per position, and a tag then shows an "also at" marker). Dragging from the roster copies (the roster stays full); dragging a placed tag moves it; Delete or dragging it off the field removes that copy. Tags dropped elsewhere stay where placed. Empty depth slots are shown. The tray holds the CURRENT COLLEGE ROSTER only: no recruits, prospects, Recruiting Board, Interested lists or Recruit Score data are used. Seasons plan the current roster forward; players whose class has graduated by that season are flagged, not blocked.
- Players come from a clearly labeled fictional roster fixture (roster-fixture.js, 28 baseball players, unique jersey numbers, positions P/C/1B/2B/3B/SS/OF, class year). Tags show jersey number, short name, stored position and class. No grades are shown on tags anywhere.
- Keyboard: tags are focusable. In the roster, Enter or Space places the tag (Lineup: next open batting row, Shift+Enter: a field slot; Depth: the position area). On the canvas, arrow keys move a free tag (Shift = larger step), Up and Down reorder a tag in the batting-order lane or a depth stack, Delete, Backspace, Enter or Space removes that placement (the player stays on the roster). Changes are announced in an `aria-live` region.
- Persistence format: drafts only in this browser (`localStorage` keys `theReadDemoLineups`, `theReadDemoDepthChart`, `theReadDemoLineupRoster`; other sports append `_<sport>`), labeled as a demo, with a reset button. Coordinates are stored as fractions (0 to 1) of the canvas for the tag center, clamped to the canvas bounds, and sanitized on load (unknown players dropped, duplicates removed, caps enforced). Lineup migration: old drafts with batting-order rows or field slots load with those players placed on the board at their old on-screen spot (batting-order players in a column, field players at their old field positions); matchup text and custom names are dropped; nothing crashes on old or corrupt data. Old 3-slot depth data loads unchanged. Nothing is sent anywhere.

## Per-sport canvas outline registry
- `TheReadLineup.OUTLINES` holds lightweight inline SVG outlines: baseball (diamond), softball (smaller diamond, no pitcher's mound), soccer (pitch), basketball (court), football (field) and volleyball (court). Football and volleyball are extra entries.
- Add a sport with `TheReadLineup.registerOutline(id, label, svg, aliases)`; the renderer needs no change. Unknown sports fall back to a plain white canvas.
- The pages choose the outline from the active coach sport. For any sport other than baseball, the page shows the outline plus a provisional notice, no position areas, no lane and no depth slot counts. Positions, slots, lineup rules and depth sizes for those sports are Requires Founder Decision.
- Interpretation: "softball, a soccer field" in the request was read as a typo for a softball field.
## User-approved scoped exception: LF, CF and RF
LF, CF and RF are selectable **display slots on the Depth Chart only** (the Lineup page is now a free-form board with no slots, so LF, CF, RF and DH no longer appear there). A player keeps the stored position OF; the tag shows OF and the slot shows LF, CF or RF. Everywhere else (Master Database, signup and validation, scoring, `benchmarks-config.js`, stored data, other imports, sort order, sport pages) positions remain P, C, 1B, 2B, 3B, SS, OF. DH and UT are never accepted as stored positions or import values (DH and UT are not accepted anywhere). This is deliberately not recorded in `COPILOT_HANDOFF.md` or the bridge files.

## CSV roster import (client side only)
- Read locally in the browser (file picker or pasted text). Never uploaded.
- Required columns: Name, Position, Grad Year, Jersey # (0-99, unique within the roster). A missing, invalid or duplicate jersey number is flagged for review and the row is added only when you enter a unique number. Optional: Secondary Position, Two-Way. Limit 200 rows.
- Row status: OK, Needs Review, Error. LF, CF and RF are flagged for review with a suggested mapping to OF and are never converted silently. DH, UT and any other value are flagged with no suggestion. Duplicates (within the file, or the same name and grad year as an existing player) need review.
- Nothing is added until the coach ticks "I reviewed these rows" and chooses to add. Existing players are never modified or overwritten.
- XLSX is not supported (no dependency or remote script). It is a future backend requirement; save as CSV.

## Server requirements (future)
- **Persistence**: authenticated, per-program storage of lineups and depth charts with versioning and an audit trail; server-side validation of positions (P, C, 1B, 2B, 3B, SS, OF).
- **Roster import**: server-side CSV and XLSX parsing with virus and size limits, row-level validation, duplicate detection against the program roster, and a reviewed commit step with an audit record.
- **Integrations ("tying in")**: roster-system connectors (OAuth or API keys held server-side). Not simulated in the preview.
- **Sharing and permissions**: who can view or edit (head coach, staff, athletic department), share links with expiry, and no athlete private data in shared views (minors especially).

## Requires Founder Decision
- Roster turnover and eligibility rules (graduation, transfers, redshirts) for the season tabs; the preview only shows class year and flags graduated players.
- Grades on tags (the user asked for none).
- Whether recruits return to these pages later (removed for now).
- How a batting order is communicated on the Lineup board now that the lane is gone (preview: free arrangement only; optional batting numbers, a DH marker or a printable order could be added later).
- Depth Chart starting point (preview): a season with no saved draft is pre-populated with each roster player at their stored primary position (roster-rack order, 5 per group; extra players stay in the rack; OF players are spread across LF, CF, RF in turn, a Requires Founder Decision). Once the coach edits a season it is saved and never re-seeded; Reset All Drafts restores the seed. Production needs the saved-versus-seeded distinction stored per season.
- Depth slots per position (preview: 5 each) and the duplicate policy (preview: allowed across positions on the depth chart only, never on the lineup).
- Who can edit and share lineups and depth charts.
- Class-year labeling and how recruits are timed against graduation (preview: the first season is next season, graduated players are flagged not blocked).
- Batting-order lane rule versus free tags, snap radius and stack order.
- Positions, slots and lineup rules for non-baseball sports.
- Saved-draft retention, XLSX support and roster-system integrations.

- Depth Chart pitching (preview): pitchers are NOT a field group. A Pitching panel sits to the right of the field with a Starting Rotation (SP1-SP5, 5 slots) and a Bullpen (RP1-RP20, 20 slots, two columns); the other eight groups keep 5 slots. A season with no saved draft is pre-seeded by stored primary position in roster order (first 5 pitchers to SP, next up to 20 to RP, others 5 per group, extras stay in the rack; OF players are spread across LF/CF/RF in turn: Requires Founder Decision). Saved boards are never re-seeded; Reset restores the seed. Old single P-group drafts migrate: first 5 to SP, rest to RP. A pitcher may be in both SP and RP only by deliberate copy (once per group). Drags do not select page text.
