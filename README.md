# Epstein Records Indicator Browser Extension

Who's in your network? Are there predators in your inbox? Are you researching Epstein's reach in any capacity? Use this browser extension to display badges next to names appearing in the Epstein files. The badge links to the Department of Justice search results for that person for easy auditing of public records.

<img width="2400" height="1038" alt="Frame 4" src="https://github.com/user-attachments/assets/dfcb7d1e-93f4-4846-95af-03efe98406fe" />

## What this does
- Adds a badge next to names on webpages when there is an exact normalized-name match.
- Uses two badge variants:
  - `epstein files` (default)
  - `epstein mentioned` (grey)
- Links to the DOJ search page for that name.

## Data sources
The extension loads records from local files:
1. `data/records.js` (structured records with names + sources)
2. `data/names.txt` (one name per line, badge: `epstein files`)
3. `data/mentions.txt` (one name per line, badge: `epstein mentioned`)

`names.txt` and `mentions.txt` are merged into in-memory records at runtime.

## TXT format
- One name per line
- Empty lines ignored
- Lines starting with `#` are comments

Example:

```txt
# Dataset names
First Last
Another Person
```

## Setup

### Chrome
1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the folder `chrome`.
5. Click refresh

### Firefox
1. Open `about:debugging#/runtime/this-firefox`.
2. Click Load Temporary Add-on....
3. Select Firefox/manifest.json from the `firefox` folder.
4. Open a test page and verify badges render.

## Notes
- Name-only matching can produce false positives.
- Matching is local; extension does not upload your dataset.
- Keep labels neutral and verify identity manually.
