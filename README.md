# Epstein Records Indicator

## What this does
- Adds a badge next to names on webpages when there is an exact normalized-name match labeled "Epstein Files".
- Links to the DOJ search page for that name.

<img width="1624" height="1061" alt="Screenshot 2026-02-18 at 2 07 00 PM" src="https://github.com/user-attachments/assets/4cd08627-d9ce-420c-8316-cab98c034b28" />


## Data sources
The extension can load records from two local files:
1. `data/records.js` (structured records with names + sources)
2. `data/names.txt` (one name per line)

`names.txt` is merged into in-memory records at runtime.

## names.txt format
- One name per line
- Empty lines ignored
- Lines starting with `#` are comments

Example:

```txt
# Epstein dataset names
First Last
Another Person
```

## Setup
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder: `epstein-web`
5. Click refresh after edits

## Notes
- Name-only matching can produce false positives.
- Matching is local; extension does not upload your dataset.
- Keep labels neutral and verify identity manually.
