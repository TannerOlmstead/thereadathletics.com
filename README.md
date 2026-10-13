THE READ Athletics

Static recruiting-intelligence website for athletes, independent recruiting professionals, and athletic departments.

Site functions

Page
Purpose
index.html
Public landing page with platform details, recruiting workflow, access options, sport links, and entry points to every request flow.
individual-signup.html
Individual workspace request for coaches, scouts, instructors, and evaluators.
institution-signup.html
Athletic-department access request with institution details, sports selection, and upgrade support for individual accounts.
player-signup.html
Athlete profile request that captures graduation year, sports, positions, and college-role preferences.
sport-guide.html
Expandable field guide with recruiting terminology and evaluation context for eight sports.
internal-preview.html
Clearly labeled fictional-data product preview of a baseball recruiting workspace.

Interactive behavior

All request forms validate required fields in the browser.
Submission prepares a prefilled email to hello@thereadathletics.com; no account, billing, or server-side data storage is created.
Institution links can preselect a role, upgrade request, or sport with query parameters such as ?role=School%20Admin, ?application=upgrade, or ?sport=baseball.
Institution sports selection requires at least one sport and supports a select-all option.
The internal preview switches its active navigation state and page heading without accessing real athlete data.
The footer automatically displays the current year.

Files

styles.css contains the responsive scarlet, navy, and white visual system.
script.js contains the form, query-parameter, and preview interactions.
Each HTML page loads the shared stylesheet and script directly, so no build step is required.

Local preview

Open index.html in a browser, or use the VS Code Live Server extension for automatic refresh while editing.
