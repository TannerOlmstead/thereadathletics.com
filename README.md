# THE READ Athletics

Static recruiting-intelligence website for athletes, independent recruiting professionals, and athletic departments. Visit the [live site](https://thereadathletics.com).

## Pages

- `index.html` — public landing page and entry points to each request flow.
- `individual-signup.html` — workspace request for coaches, scouts, instructors, and evaluators.
- `institution-signup.html` — athletic-department access request, including sports selection and account upgrades.
- `player-signup.html` — athlete profile request with graduation year, sports, positions, and college-role preferences.
- `sport-guide.html` — expandable recruiting terminology and evaluation context for eight sports.
- `internal-preview.html` — clearly labeled concept preview using fictional baseball recruiting data.

Request forms validate in the browser and prepare a prefilled email to hello@thereadathletics.com. The site does not create accounts, process billing, or store form submissions. Institution request links can preselect values with query parameters, including `?role=School%20Admin`, `?application=upgrade`, and `?sport=baseball`.

## Preview the website while editing

You can use GitHub Codespaces to see your changes in a browser:

1. Open this repository on GitHub and select **Code** → **Codespaces** → **Create codespace**.
2. In the Codespaces window, open **Terminal** and run:

   ```sh
   python3 -m http.server 8000
   ```

3. Open the **Ports** tab, then click the link for port **8000** to open the preview.
4. Leave the terminal command running. After making a change, refresh the preview page to see it.

This is a static website, so no build or installation step is needed. You can ask Copilot Chat to make a change in plain language, then refresh the preview.

## Website files

- `styles.css` — shared responsive scarlet, navy, and white visual system.
- `script.js` — request form, query parameter, preview navigation, and current-year behavior.
