# THE READ Athletics Roadmap

## PRE-LAUNCH CHECKLIST (do not skip)

- [ ] **Re-enable sample-data labels or replace all sample data with real data before publishing. No fake players or stats may appear publicly.** Labels are hidden by one switch: `SHOW_SAMPLE_LABELS` in `site-config.js` (set it to `true` to show every Demo / Sample / Fictional / Preview label again).

Legend: `[x]` done · `[ ]` not done · *(placeholder)* means a page or section exists but its content is a placeholder or a demonstration only.

This site is plain HTML/CSS/JS with no build step. There is **no backend**: forms prepare an email to hello@thereadathletics.com, and the product preview uses **fictional data only**.

**Rule: No unverified claims or fake data; add popularity/social-proof labels only when backed by real data.** (The "Most Popular" pricing badge was removed for this reason.)

## Phase 1 — Front door

- [x] Three audience paths in the `index.html` hero (athlete, coach/program, institution), each linking to its own page
- [x] `player-signup.html` — graduation year, sports, positions, college-role preferences
- [x] `individual-signup.html` — coaches, scouts, instructors, evaluators
- [x] `institution-signup.html` — department details, sports multi-select (at least one required, select-all), `?role=`, `?application=upgrade`, `?sport=`
- [x] All forms validate required fields in the browser and prepare a prefilled mailto (no server storage)
- [x] Shared navigation to every page
- [x] Footer with Privacy, Terms, Contact
- [x] `privacy.html` and `terms.html` *(placeholder draft text — needs lawyer review)*
- [x] `contact.html` demo/contact request form (mailto)

## Phase 2 — Show the product

- [x] `internal-preview.html` with clearly labeled fictional baseball data (board, athlete profile, score breakdown; nav switches active state and heading)
- [x] `sport-guide.html` — expandable guide for eight sports
- [x] `scoring.html` — Recruit Score, Staff Score, Coach Fit, Team Need, Priority Score, Confidence; objective vs. subjective kept separate
- [x] `faq.html` with comparison vs. spreadsheets and other tools

## Phase 3 — Objective recruiting features (marketing + preview)

- [x] Verified measurables with source/date
- [x] Events and combines
- [x] Verified stats
- [x] Sport benchmarks and percentiles
- [x] Academic and NCAA/NAIA eligibility tracker
- [x] Video library with timestamped clips
- [x] Growth trends
- [x] Locked grades with audit trail
- Pages: `objective-features.html`, preview view "Objective data"

## Phase 4 — Subjective

- [x] Staff evaluation forms / scouting templates
- [x] Character, coachability, leadership ratings
- [x] Reference requests
- [x] Coach Fit and Team Need questionnaires
- [x] Multi-evaluator scores with disagreement flagged
- [x] Private notes and tags
- [x] Bias guardrails
- Pages: `evaluations.html`, preview view "Staff evaluations"

## Phase 5 — Workflow

- [x] Board stages: Discovered > Contacted > Visit > Offer > Committed
- [x] Communication log with NCAA contact/dead-period reminders (illustrative)
- [x] Visit scheduling and task calendar
- [x] Athlete/family portal and visibility controls
- [x] Commitment and transfer-portal tracking
- [x] Scholarship budget and roster planning
- Pages: `workflow.html`, preview views "Communication & calendar", "Commitments & portal", "Budget & roster"

## Phase 6 — Trust and growth

- [x] `security.html` — roles, minors' data protection, FERPA
- [x] `resources.html` with three starter articles
- [x] `success-stories.html` *(placeholder — no fake testimonials)*
- [x] Mobile-responsive layout (checked at 390 px and desktop widths)
- [x] Accessibility basics: skip link, labels, focus states, aria on forms and bars
- [x] SEO basics: unique titles and meta descriptions, `sitemap.xml`, `robots.txt`
- [x] `pricing.html` and index pricing summary rebuilt from the owner pricing document (athlete, coach, provider, institution standard/founding tables, price selector); no payments live

## Added along the way

- [x] Navy secondary color added to the scarlet/white design system
- [x] Replaced unverifiable homepage statistics (92%, 3x faster, 100%) with factual counts
- [x] Homepage hero data labeled as a sample (later removed entirely, along with the homepage stats bar, so no sample numbers appear on the homepage)
- [x] Visual redesign: bright scarlet nav bar, notched-corner buttons, bold condensed italic headings, homepage sport tiles, bold scarlet "THE READ", shared mobile nav

- [x] Coach workspace preview (fictional baseball data, shared sub-navigation): dashboard, rankings (sortable/filterable), player card, H2H, team needs, coach fit, recruiting board, commitments, analytics, and regional insights
- [x] Department Overview page for athletic directors (who is recruiting whom, recruiting schedule, program needs) with links to the coach workspace from the institution signup page, header, and footer
- [x] Athletic Department Workspace: separate navy-band tabs (Overview, Programs, Finances, Schedule) with fictional sample data; coach workspace tabs restyled as notched buttons on a scarlet band that turn navy when selected
- [x] H2H page rebuilt to mirror the spreadsheet H2H tab (Player A | Advantage/Team Edge | Player B, same section order, The READ block beside Database Benchmarks)
- [ ] Department finances: real budget entry, saving, and import (currently a sample-data calculator only)
- [ ] Department schedule: editable recruiting calendar and compliance-period reminders from verified sources
- [x] Owner-only page (`owner.html`): unlinked, noindex, encrypted content behind an owner passphrase; internal reference material is kept off all public pages
- [x] "For Coaches" header link added to every page

## Next up (not started)

- [ ] Lawyer review of privacy and terms
- [ ] Real success stories (with permission)
- [ ] Real form handling / backend (currently mailto only)
- [ ] Real sport-specific benchmark data
- [ ] Final scoring formulas and weights
- [ ] Self-hosted fonts and analytics decision
- [ ] Add a social-share image and per-page Open Graph tags
- [ ] Data import (bulk upload of evaluations/measurables into the shared database)
- [ ] Per-sport scoring formulas for sports beyond baseball
- [ ] Real Master Database, accounts, and private team layers (shared database + private team data)

## Recruit Score, Player Tier, And Confidence system

- [x] Shared `classification.js` module: tier and confidence config, validation, formatting, sort and filter helpers, accessible badge renderers
- [x] Tiers: Platinum 95.0+, Gold 85.0+, Silver 70.0+, Bronze below 70.0, Not Rated when missing; derived from the full stored score before rounding (replaces the old Elite/High-End/Target labels)
- [x] Confidence levels: High 90.0%+, Medium 60.0%+, Low below 60.0%, Unknown when missing
- [x] Rankings: Recruit Score | Tier | Confidence columns, multi-select filters, Reset, semantic sorting, empty state, mobile card layout
- [x] Player Card, H2H (Confidence is never a talent winner), dashboard, board, commitments, analytics, regional insights, product preview, and scoring copy use the shared module
- [x] `tests.html` runs all boundary, validation, color, label, sort, filter, and sample-data tests
- [ ] Server-side derivation, persistence, and API validation of Tier and Confidence (documented for a future backend)

## Master Database

- [x] Master Database page (first coach tab): all sample players, every input column, search/filter/sort, Add Prospect demo form (college coaches only; private, coach-entered, unverified entries, separate from athlete signup) saved in localStorage; other coach pages read from it.
- [ ] Auto-calculate projection grades, Athletic Score, Recruit Score, Tier and Confidence for added players from raw inputs (owner Grade Tables and Build Notes formulas) server-side, so the owner-only formulas are not published in public JS. Add Player form already excludes these fields.
- [ ] Bulk import of a college coach's offline recruiting board (CSV/spreadsheet), kept private to that coach and marked unverified until the athlete verifies.
- [ ] Real storage needs a backend (accounts, shared database, per-coach private layers).
- [ ] Data import (CSV/spreadsheet), duplicate resolution, Event ID and Fieldleve columns.

## Program scores (no random numbers)

- [x] Team Need, Coach Fit, Adjusted Recruit Score and Priority Score now use documented deterministic formulas (shown under How This Is Calculated); random sample scores removed.
- [x] Recruiting Philosophy is a 1-5 ranking (unique ranks) that feeds Coach Fit and Priority Score.
- [x] Coach Fit tab: Adjusted Priority Score column (average of Recruit Score, Coach Fit, Priority Score).
- [ ] Owner to confirm the weights (position/skill/philosophy) and the Long-Term Projection input; Staff Score and HC/PC/AC grades need real coach entry.

## Coach workspace batch (done in this PR)

- [x] Recruiting board "#" removed from Adjusted Recruit Score; Adjusted formula bounded (+/- 2.5) and documented.
- [x] Commitments: summary tables in a right sidebar.
- [x] THE READ AI context notes on every workspace tab except H2H.
- [x] Player-name pop-up card with optional athlete-provided photo.
- [x] Coach Grading tab (browser-saved demo) feeding Staff Score.
- [x] Coach Grading: Head Coach-only Grading Scale setting (Letter A+ to F or Numeric 0-100; one 0-100 storage basis so switching keeps grades); simple A+ to F dropdown with a conversion table; Head Coach weight settings per coach with per-position-group overrides (re-normalised among graders); Staff Score is the weighted average; Adjusted Recruit Score includes a bounded staff adjustment and updates live.
- [x] Connect tab with JUCO / transfer portal section (sample entries only).
- [x] Current Playing Level field, filters and columns.
- [x] Workspace header (no Sign In / Get Started).
- [x] Player Card Connect button (page and pop-up): athlete contact (shared fields only), school/club/level, metric verifiers (HS coach, private instructor, showcase staff) and Unverified / Coach-Entered labels; sample data only.
- [x] Connect tab rebuilt as a messaging inbox DEMO (threads, compose, filters, unread, block/report) with a MessageService interface; Player Card Connect opens a composer. Labeled "Demo - messages are not sent"; no encryption claim.
- [ ] Real secure messaging needs: accounts and auth, server-side message storage, TLS in transit and encryption at rest (decide end-to-end vs server-side), athlete-controlled message permissions, moderation and reporting workflow, audit log.
- [ ] Compliance for messaging: NCAA contact and recruiting rules (contact periods, dead periods), minor safety (under-18 contact restrictions, parent/guardian visibility, coach-to-minor contact windows), and a legal review before launch.
- [x] Recruiting Board is per program: coaches add prospects ONLY from the Master Database (per-row Add To Board or bulk select; the board page just manages them) and remove them; board stores only player ids plus program fields (demo, localStorage). Needs a backend for real per-program storage and sharing across staff.
- [x] Coach Grading grader is the signed-in coach (demo identity with a Demo Controls preview switch). Real version: grader and Head Coach permission come from accounts.
- [ ] Define contact-sharing rules for athletes under 18, and how verifiers are confirmed (needs backend, accounts and consent).
- [ ] Needs a backend: real grading storage per coach account, messaging, athlete photo upload, and whether Staff Score should weight into Priority Score.
## Open decisions (from the owner workbook; not built)

- [ ] Final weights for OPG, SOPG, DPG, SDPG, PPG and whether height is position-adjusted in Athletic Score
- [x] Confidence thresholds decided by the owner spec: High 90.0%+, Medium 60.0%+, Low below 60.0%, Unknown when missing (see Recruit Score, Player Tier, and Confidence system)
- [ ] How many metrics are expected for Confidence to be 100%
- [ ] Priority Score weights (Recruit Score, Coach Fit, Confidence, Adjusted Recruit Score)
- [ ] Two-way players: manual vs automatic detection, how OPG/DPG/PPG interact, and a future two-way ranking
- [ ] Whether multiple versions of AI-generated summaries should exist

## Future ideas (not built)

- [ ] AI-generated "THE READ" summaries on Player Card, H2H, Dashboard, Analytics, and Regional Insights
- [ ] Subscription tiers: College, High School, and Summer Ball
- [ ] Additional user pricing per sport (undecided; shown as "to be announced")
- [ ] Player Profiles and Coach Profiles

## Internal future ideas (not public, not built)

- Trading cards (evaluation is earned; the card is purchased; athletes never pay to access their score), premium reports, API access, enterprise data partnerships, education licenses, marketplace opportunities. Internal planning only; do not publish as available.
- Document any complimentary access (demo, investor, employee, partner, founder) internally.


- [x] Sample data: every fictional position player now has a 60 Time (6.4-7.6 s, faster at OF/SS/2B, slower at C/1B); pitchers stay blank. Sample Data only.

- [x] Add To Board icon button (green + / green checkmark, accessible, remove with Undo toast)

- [x] Recruiting Board automation: row-selection checkboxes removed (the green +/check is the only add control). Priority Tier is computed and read-only: average of Coach Fit and Team Need, 85+ = Priority 1, 75-84.9 = Priority 2, below 75 = Priority 3, "Not Enough Data" if either is missing. Stage is derived from a timestamped per-prospect activity log (Added, Message Sent, Grade, Visit Scheduled, Visit Completed, Offer, Committed, Declined) stamped with the signed-in coach; no manual Stage control. Thresholds are proposed and need owner confirmation.
- [x] Calendar for all roles (coach, athletic department, athlete views): month/week/agenda, add/edit/delete events, linked player, role visibility, .ics export. "Schedule Visit" creates the event and logs Visit Scheduled; marking it completed logs Visit Completed. Demo only (localStorage).
- [ ] Calendar backend: shared accounts/storage, reminders, invites, time zones, and an NCAA contact/evaluation/quiet/dead-period layer (dates to be sourced from official NCAA calendars, none invented); under-18 contact rules to be defined.

- [x] Readability: long tab descriptions (Recruiting Board, Master Database, Coach Grading, Team Needs, Analytics, grade weights/conversion, Scoring page) converted to short bullet lists with a bold key term.
- [x] Level / Class column (HS 2027, JUCO 2028, Tr 2029, with a legend) and Eligibility Left column on the player lists: Master Database, Rankings (Grad Class kept), Recruiting Board, Coach Fit, Commitments, Coach Grading, Connect (JUCO/transfer list and athlete threads), calendar player picker, department list. Years Of Eligibility Left is an Add Prospect input (0-6, JUCO/college only); HS shows N/A and unknown shows Not Provided, never 0 or guessed. Sample values are fictional.
- [ ] Eligibility rules differ by association, sport and situation: add a verified eligibility source/ruleset once a backend and compliance review exist; until then it is entered, not calculated.

- [x] Recruiting Board THE READ AI panel now breaks down the program's actual board (position vs top Team Needs, Level/Class and eligibility, Priority mix, pipeline stages from the action log, Tier/Confidence mix, upcoming visits). Empty board prompts adding from the Master Database. Deterministic, live, sample-labeled; never changes scores.

- [x] Workflow page audit: added per-role workflows (athlete, parent/guardian, HS coach, instructor, verified data provider, JUCO, 4-year staff, athletic department, THE READ admin) and the automated action-logged Stage model; unbuilt items labeled Coming Soon (guardian accounts, compliance tools, admin/support, verifier data imports).

- [x] Athlete signup rebuilt as a 7-step demo wizard (account, age gate, profile, parent/guardian, metric verifier, privacy, review) plus `guardian-verify.html`. Under 18 requires guardian verification (demo code 000000, statuses Pending / Verified / Declined / Expired) before the athlete is listed or contactable. Athlete-created profiles appear in the Master Database flagged Athlete-Created / Guardian-Verified. Self-reported metrics stay Unverified until a verifier confirms (demo).
- [x] Baseball College Role Preference (two-way yes/no/open/not sure, preferred role and position) is an athlete preference, not a rating. Coaches get a separate coach-entered Projected College Role. Both show on the Player Card, Master Database (with filter) and Rankings filter; neither changes Recruit Score, Tier or Confidence. Missing = Not Provided.
- [ ] Real requirements for athlete signup: email/SMS verification service, identity verification options, consent records and audit log, COPPA / FERPA / state minor-privacy review with counsel (under-13 handling is a legal review item, no compliance is claimed), NCAA contact rules, account recovery, guardian revocation propagation, server-side password handling.