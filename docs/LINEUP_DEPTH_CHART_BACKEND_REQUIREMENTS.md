# Lineup and Depth Chart: Backend Requirements

`coach-lineup.html` and `coach-depth-chart.html` (logic in `lineup-depth.js`, interface in `lineup-depth-ui.js`) are a **front-end preview, baseball only**. The site has no backend, so none of the following is enforced today.

## What the preview does
- Both pages are a big white free-form canvas with draggable player name tags. Tags are moved with pointer events (mouse, touch, pen). There are no drop-down menus for placing players.
- Lineup: up to 4 lineup pages, each with a name, opponent and date (free text). Tags dropped in the numbered **Batting Order lane** (left side, rows 1 to 9, row 1 at the top) set the batting order; a tag dropped on an occupied row swaps (from the lane) or displaces the occupant to free space. Tags dropped anywhere else are free notes. No DH.
- Depth Chart: 2 to 4 season tabs (default 4, first season = next season; July onward counts as next year). Each tab draws a sport outline behind the tags (baseball diamond). A tag dropped within 15% of the canvas of a position area (P, C, 1B, 2B, 3B, SS, LF, CF, RF) joins that position and stacks in order: S = Starter, then B1, B2 (5 slots for P, 3 elsewhere; a player is listed once per position). Tags dropped elsewhere stay where placed. Empty depth slots are shown. The tray holds the CURRENT COLLEGE ROSTER only: no recruits, prospects, Recruiting Board, Interested lists or Recruit Score data are used. Seasons plan the current roster forward; players whose class has graduated by that season are flagged, not blocked.
- Players come from a clearly labeled fictional roster fixture (roster-fixture.js, 28 baseball players, unique jersey numbers, positions P/C/1B/2B/3B/SS/OF, class year). Tags show jersey number, short name, stored position and class. Grades are omitted from tags (decision below).
- Keyboard: tags are focusable. In the tray, Enter or Space places the tag on the canvas. On the canvas, arrow keys move a free tag (Shift = larger step), Up and Down reorder a tag in the batting-order lane or a depth stack, Delete, Backspace, Enter or Space returns it to the tray. Changes are announced in an `aria-live` region.
- Persistence format: drafts only in this browser (`localStorage` keys `theReadDemoLineups`, `theReadDemoDepthChart`, `theReadDemoLineupRoster`; other sports append `_<sport>`), labeled as a demo, with a reset button. Coordinates are stored as fractions (0 to 1) of the canvas for the tag center, clamped to the canvas bounds, and sanitized on load (unknown players dropped, duplicates removed, caps enforced). Nothing is sent anywhere.

## Per-sport canvas outline registry
- `TheReadLineup.OUTLINES` holds lightweight inline SVG outlines: baseball (diamond), softball (smaller diamond, no pitcher's mound), soccer (pitch), basketball (court), football (field) and volleyball (court). Football and volleyball are extra entries.
- Add a sport with `TheReadLineup.registerOutline(id, label, svg, aliases)`; the renderer needs no change. Unknown sports fall back to a plain white canvas.
- The pages choose the outline from the active coach sport. For any sport other than baseball, the page shows the outline plus a provisional notice, no position areas, no lane and no depth slot counts. Positions, slots, lineup rules and depth sizes for those sports are Requires Founder Decision.
- Interpretation: "softball, a soccer field" in the request was read as a typo for a softball field.
## User-approved scoped exception: LF, CF and RF
LF, CF and RF are selectable **display slots on these two pages only**. A player keeps the stored position OF; the tag shows OF and the slot shows LF, CF or RF. Everywhere else (Master Database, signup and validation, scoring, `benchmarks-config.js`, stored data, other imports, sort order, sport pages) positions remain P, C, 1B, 2B, 3B, SS, OF. DH and UT are not accepted. This is deliberately not recorded in `COPILOT_HANDOFF.md` or the bridge files.

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
- Whether tags should show grades for roster players (omitted for now).
- Whether recruits return to these pages later (removed for now).
- Lineup length and whether a DH is used (preview: 9 batters, no DH).
- Depth slots per position (preview: 5 for P, 3 elsewhere) and whether a player may appear in several positions (preview: yes, once per position).
- Who can edit and share lineups and depth charts.
- Class-year labeling and how recruits are timed against graduation (preview: the first season is next season, graduated players are flagged not blocked).
- Batting-order lane rule versus free tags, snap radius and stack order.
- Positions, slots and lineup rules for non-baseball sports.
- Saved-draft retention, XLSX support and roster-system integrations.
