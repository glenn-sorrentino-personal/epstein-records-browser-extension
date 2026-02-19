# Epstein Records Indicator Browser Extension

[![Data Sync](https://github.com/glenn-sorrentino-personal/epstein-records-browser-extension/actions/workflows/data-sync.yml/badge.svg)](https://github.com/glenn-sorrentino-personal/epstein-records-browser-extension/actions/workflows/data-sync.yml)

Who's in your network? Which figures are journalists focusing on? Are there predators in your inbox? Use this browser extension to display badges next to names appearing in the Epstein files. The badge links to the Department of Justice search results for that person for easy auditing of public records.

<img width="2536" height="1162" alt="Frame 5" src="https://github.com/user-attachments/assets/88d12fc5-ee21-4bb7-87e0-8ede5df7b532" />

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

## Single source of truth
Edit dataset files in one place only:
1. `source-data/records.js`
2. `source-data/names.txt`
3. `source-data/mentions.txt`

Then sync browser folders:

```bash
bash scripts/sync-data.sh
```

Check sync status:

```bash
bash scripts/sync-data.sh --check
```

`scripts/sync-data.sh` updates:
- `chrome/data/*`
- `firefox/data/*`
- `safari/Epstein Records Indicator Safari/Epstein Records Indicator Safari Extension/Resources/data/*`

GitHub Actions workflow:
- `.github/workflows/data-sync.yml` (`Data Sync`)
- On PRs and pushes to `main`, it syncs and auto-commits mirrored data changes when possible.

### Single-source workflow
Use `source-data/` as the only place you edit dataset files:
1. `source-data/records.js`
2. `source-data/names.txt`
3. `source-data/mentions.txt`

Then sync to all browser folders:

```bash
scripts/sync-data.sh
```

Verify everything is in sync:

```bash
scripts/sync-data.sh --check
```

A GitHub Actions workflow (`.github/workflows/data-sync.yml`) runs this check on pushes/PRs.

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

## Next Steps
- More granular categories
  - epstein files
  - epstein mentioned
  - epstein collaborator
  - epstein enemy
