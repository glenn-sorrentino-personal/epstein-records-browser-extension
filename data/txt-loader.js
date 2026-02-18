(() => {
  const TXT_PATH = 'data/names.txt';

  function parseNamesTxt(text) {
    const lines = String(text || '').split(/\r?\n/);
    const out = [];

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (!line) continue;
      if (line.charAt(0) === '#') continue;

      out.push({
        name: line,
        category: 'Epstein files',
        sources: [],
        notes: 'Loaded from local names.txt'
      });
    }

    return out;
  }

  function mergeRecords(base, extra) {
    const merged = Array.isArray(base) ? base.slice() : [];
    const seen = new Set();

    for (let i = 0; i < merged.length; i += 1) {
      const key = String(merged[i] && merged[i].name ? merged[i].name : '').toLowerCase().trim();
      if (key) seen.add(key);
    }

    for (let i = 0; i < extra.length; i += 1) {
      const rec = extra[i];
      const key = String(rec && rec.name ? rec.name : '').toLowerCase().trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(rec);
    }

    return merged;
  }

  async function loadTxtDataset() {
    try {
      const url = chrome.runtime.getURL(TXT_PATH);
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return;

      const text = await response.text();
      const parsed = parseNamesTxt(text);
      if (parsed.length === 0) return;

      const current = Array.isArray(window.LINKED_PUBLIC_RECORDS) ? window.LINKED_PUBLIC_RECORDS : [];
      window.LINKED_PUBLIC_RECORDS = mergeRecords(current, parsed);

      window.dispatchEvent(
        new CustomEvent('lpri-records-updated', {
          detail: {
            source: 'names.txt',
            added: parsed.length,
            total: window.LINKED_PUBLIC_RECORDS.length
          }
        })
      );
    } catch (err) {
      // Keep extension functional even if TXT loading fails.
    }
  }

  loadTxtDataset();
})();
