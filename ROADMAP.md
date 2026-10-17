# THE READ Athletics Roadmap

Legend: `[x]` done · `[ ]` not done · *(placeholder)* means a page or section exists but its content is a placeholder or a demonstration only.

This site is plain HTML/CSS/JS with no build step. There is **no backend**: forms prepare an email to hello@thereadathletics.com, and the product preview uses **fictional data only**.

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
- [x] `pricing.html` and index pricing section with free athlete profile and demo scheduling

## Added along the way

- [x] Navy secondary color added to the scarlet/white design system
- [x] Replaced unverifiable homepage statistics (92%, 3x faster, 100%) with factual counts
- [x] Homepage hero data labeled as a sample (later removed entirely, along with the homepage stats bar, so no sample numbers appear on the homepage)
- [x] Visual redesign: bright scarlet nav bar, notched-corner buttons, bold condensed italic headings, homepage sport tiles, bold scarlet "THE READ", shared mobile nav

- [x] Coach workspace preview (fictional baseball data, shared sub-navigation): dashboard, rankings (sortable/filterable), player card, H2H, team needs, coach fit, recruiting board, commitments, analytics, and regional insights
- [x] Department Overview page for athletic directors (who is recruiting whom, recruiting schedule, program needs) with links to the coach workspace from the institution signup page, header, and footer
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

## Open decisions (from the owner workbook; not built)

- [ ] Final weights for OPG, SOPG, DPG, SDPG, PPG and whether height is position-adjusted in Athletic Score
- [ ] How many metrics are expected for Confidence, and the final Low/Medium/High thresholds
- [ ] Priority Score weights (Recruit Score, Coach Fit, Confidence, Adjusted Recruit Score)
- [ ] Two-way players: manual vs automatic detection, how OPG/DPG/PPG interact, and a future two-way ranking
- [ ] Whether multiple versions of AI-generated summaries should exist

## Future ideas (not built)

- [ ] AI-generated "THE READ" summaries on Player Card, H2H, Dashboard, Analytics, and Regional Insights
- [ ] Subscription tiers: College, High School, and Summer Ball
- [ ] Pricing model questions: free version, premium version, team subscriptions
- [ ] Player Profiles and Coach Profiles
