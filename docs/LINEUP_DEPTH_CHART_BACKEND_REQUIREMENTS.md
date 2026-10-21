# Lineup and Depth Chart: Backend Requirements

`coach-lineup.html` and `coach-depth-chart.html` (logic in `lineup-depth.js`, interface in `lineup-depth-ui.js`) are a **front-end preview, baseball only**. The site has no backend, so none of the following is enforced today.

## What the preview does
- Lineup: up to 4 lineup pages, each with a name, opponent and date (free text), a 9-slot batting order, 9 defensive slots (P, C, 1B, 2B, 3B, SS, LF, CF, RF) and a bench pool. No DH.
- Depth Chart: 2 to 4 season tabs (default 4, first season = next season; July onward counts as next year). Each position has Starter and Backup slots (5 for P, 3 elsewhere). Open spots are shown. A Recruiting Targets pool comes from the existing Recruiting Board and uncommitted prospects.
- Players are the existing fictional preview players. Grades on tags come from the existing role-aware grade renderer; nothing is recomputed.
- Drag and drop, plus a select on every slot for keyboard use. Dropping on an occupied slot swaps. Changes are announced in an `aria-live` region.
- Persistence: drafts only in this browser (`localStorage` keys `theReadDemoLineups`, `theReadDemoDepthChart`, `theReadDemoLineupRoster`), labeled as a demo, with a reset button. Nothing is sent anywhere.

## User-approved scoped exception: LF, CF and RF
LF, CF and RF are selectable **display slots on these two pages only**. A player keeps the stored position OF; the tag shows OF and the slot shows LF, CF or RF. Everywhere else (Master Database, signup and validation, scoring, `benchmarks-config.js`, stored data, other imports, sort order, sport pages) positions remain P, C, 1B, 2B, 3B, SS, OF. DH and UT are not accepted. This is deliberately not recorded in `COPILOT_HANDOFF.md` or the bridge files.

## CSV roster import (client side only)
- Read locally in the browser (file picker or pasted text). Never uploaded.
- Required columns: Name, Position, Grad Year. Optional: Secondary Position, Two-Way. Limit 200 rows.
- Row status: OK, Needs Review, Error. LF, CF and RF are flagged for review with a suggested mapping to OF and are never converted silently. DH, UT and any other value are flagged with no suggestion. Duplicates (within the file, or the same name and grad year as an existing player) need review.
- Nothing is added until the coach ticks "I reviewed these rows" and chooses to add. Existing players are never modified or overwritten.
- XLSX is not supported (no dependency or remote script). It is a future backend requirement; save as CSV.

## Server requirements (future)
- **Persistence**: authenticated, per-program storage of lineups and depth charts with versioning and an audit trail; server-side validation of positions (P, C, 1B, 2B, 3B, SS, OF).
- **Roster import**: server-side CSV and XLSX parsing with virus and size limits, row-level validation, duplicate detection against the program roster, and a reviewed commit step with an audit record.
- **Integrations ("tying in")**: roster-system connectors (OAuth or API keys held server-side). Not simulated in the preview.
- **Sharing and permissions**: who can view or edit (head coach, staff, athletic department), share links with expiry, and no athlete private data in shared views (minors especially).

## Requires Founder Decision
- Lineup length and whether a DH is used (preview: 9 batters, no DH).
- Depth slots per position (preview: 5 for P, 3 elsewhere) and whether a player may appear in several positions (preview: yes, once per position).
- Who can edit and share lineups and depth charts.
- Class-year labeling and how recruits are timed against graduation (preview: the first season is next season, graduated players are flagged not blocked).
- Saved-draft retention, XLSX support and roster-system integrations.
