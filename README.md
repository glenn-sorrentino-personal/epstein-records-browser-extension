

# Epstein Records Indicator Browser Extension

Who's in your network? Which figures are journalists focusing on? Are there predators in your
inbox? Use this browser extension to display badges next to names appearing in the Epstein files.
The badge links to the Department of Justice search results for that person for easy auditing of
public records.

<img width="2332" height="1162" alt="Frame 5" src="https://github.com/user-attachments/assets/7ec126b5-7d56-4898-b9ea-b0b2130a6fe7" />

## What this does
- Adds a badge next to names on webpages when there is an exact normalized-name match.
- Uses four badge variants:
  - `epstein files` (default)
  - `epstein mentioned` (grey)
  - `epstein collaborator`
  - `epstein enemy`
- Links to the DOJ search page for that name.

## Local-first privacy
- All matching happens locally in your browser.
- The extension does not upload your page text, browsing history, or local dataset.
- The extension does not send collected data to any developer server.
- Data only leaves your browser if you explicitly click a badge link (which opens the DOJ website).

## Open source
- This project is open source.
- Source code, datasets, and workflows are publicly auditable on GitHub:
  `https://github.com/glenn-sorrentino-personal/epstein-records-browser-extension`

## Data sources
The extension loads records from local files:
1. `data/records.js` (structured records with names + sources)
2. `data/names.txt` (one name per line, badge: `epstein files`)
3. `data/mentions.txt` (one name per line, badge: `epstein mentioned`)
4. `data/collaborator.txt` (one name per line, badge: `epstein collaborator`)
5. `data/enemy.txt` (one name per line, badge: `epstein enemy`)

TXT files are merged into in-memory records at runtime.

## Single source of truth
Edit dataset files in one place only:
1. `source-data/records.js`
2. `source-data/names.txt`
3. `source-data/mentions.txt`
4. `source-data/collaborator.txt`
5. `source-data/enemy.txt`

Then sync browser folders:

```bash
scripts/sync-data.sh
```

Check sync status:

```
scripts/sync-data.sh --check
```

`scripts/sync-data.sh` updates:

- chrome/data/*
- firefox/data/*
- safari/Epstein Records Indicator Safari/Epstein Records Indicator Safari Extension/Resources/
  data/*

GitHub Actions workflow:

- .github/workflows/data-sync.yml (Data Sync)
- On same-repo PRs, it syncs and auto-commits mirrored data changes to the PR branch.
- On pushes to main, it opens/updates a PR with mirrored data changes when needed.

## TXT format

- One name per line
- Empty lines ignored
- Lines starting with # are comments

Example:

# Dataset names
```
First Last
Another Person
```

## Setup

### Chrome

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select the folder chrome.
5. Click refresh.

### Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click Load Temporary Add-on...
3. Select firefox/manifest.json from the firefox folder.
4. Open a test page and verify badges render.

## Notes

- Name-only matching can produce false positives.
- Matching is local; extension does not upload your dataset.
- Keep labels neutral and verify identity manually.
