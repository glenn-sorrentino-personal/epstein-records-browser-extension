# Epstein Records Indicator

## What this does
- Adds a badge next to names on webpages when there is an exact normalized-name match.
- Uses two badge variants:
  - `epstein files` (default)
  - `epstein mentioned` (maroon)
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
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder: `epstein-records-indicator`
5. Click refresh after edits

## Notes
- Name-only matching can produce false positives.
- Matching is local; extension does not upload your dataset.
- Keep labels neutral and verify identity manually.
