# THE READ Athletics

Static recruiting-intelligence website for athletes, independent recruiting professionals, and athletic departments. Visit the [live site](https://thereadathletics.com).

## Pages

| Page | Purpose |
| --- | --- |
| `index.html` | Public landing page with platform details, recruiting workflow, access options, sport links, and entry points to each request flow. |
| `individual-signup.html` | Individual workspace request for coaches, scouts, instructors, and evaluators. |
| `institution-signup.html` | Athletic-department access request, sports selection, and upgrade support for individual accounts. |
| `player-signup.html` | Athlete profile request with graduation year, sports, positions, and college-role preferences. |
| `sport-guide.html` | Expandable recruiting terminology and evaluation context for eight sports. |
| `internal-preview.html` | Clearly labeled concept preview using fictional baseball recruiting data. |

## How the website works

Request forms validate in the browser and prepare a prefilled email to hello@thereadathletics.com. The site does not create accounts, process billing, or store form submissions. Institution request links can preselect a role, upgrade request, or sport with query parameters such as `?role=School%20Admin`, `?application=upgrade`, and `?sport=baseball`.

The institution form requires at least one sport and includes a select-all option. The internal preview changes its active navigation state and heading locally; it does not access real athlete data. The footer displays the current year automatically.

## Preview the website while editing

You can open `index.html` directly in a browser, use the VS Code Live Server extension for automatic refresh, or use GitHub Codespaces:

1. Open this repository on GitHub and select **Code** → **Codespaces** → **Create codespace**.
2. In the Codespaces window, open **Terminal** and run:

   ```sh
   python3 -m http.server 8000
   ```

3. Open the **Ports** tab, then click the link for port **8000** to open the preview.
4. Leave the terminal command running. After making a change, refresh the preview page to see it.

This is a static website, so no build or installation step is needed. You can ask Copilot Chat to make a change in plain language, then refresh the preview.

## Shared files

- `styles.css` — responsive scarlet, navy, and white visual system.
- `script.js` — request form, query parameter, preview navigation, and current-year behavior.

Each HTML page loads the shared stylesheet and script directly.
