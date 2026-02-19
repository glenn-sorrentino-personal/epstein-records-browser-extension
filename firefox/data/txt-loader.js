(() => {
  const DATASETS = [
    {
      path: 'data/names.txt',
      category: 'Epstein files',
      badgeText: 'epstein files',
      badgeType: 'files'
    },
    {
      path: 'data/mentions.txt',
      category: 'Epstein mentioned',
      badgeText: 'epstein mentioned',
      badgeType: 'mentioned'
    }
  ];

  function parseNamesTxt(text, cfg) {
    const lines = String(text || '').split(/\r?\n/);
    const out = [];

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (!line || line.charAt(0) === '#') continue;

      out.push({
        name: line,
        category: cfg.category,
        badgeText: cfg.badgeText,
        badgeType: cfg.badgeType,
        sources: [],
        notes: 'Loaded from local ' + cfg.path
      });
    }

    return out;
  }

  function mergeRecords(base, extra) {
    const merged = Array.isArray(base) ? base.slice() : [];
    const seen = new Set();

    for (let i = 0; i < merged.length; i += 1) {
      const rec = merged[i] || {};
      const key = String(rec.name || '').toLowerCase().trim();
      const type = String(rec.badgeType || '').toLowerCase().trim();
      if (key && type) seen.add(key + '|' + type);
    }

    for (let i = 0; i < extra.length; i += 1) {
      const rec = extra[i] || {};
      const key = String(rec.name || '').toLowerCase().trim();
      const type = String(rec.badgeType || '').toLowerCase().trim();
      if (!key || !type) continue;

      const compound = key + '|' + type;
      if (seen.has(compound)) continue;

      seen.add(compound);
      merged.push(rec);
    }

    return merged;
  }

  async function loadOneDataset(cfg) {
    try {
      const url = chrome.runtime.getURL(cfg.path);
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return [];
      return parseNamesTxt(await response.text(), cfg);
    } catch (err) {
      return [];
    }
  }

  async function loadTxtDatasets() {
    const loaded = [];
    for (let i = 0; i < DATASETS.length; i += 1) {
      const parsed = await loadOneDataset(DATASETS[i]);
      for (let j = 0; j < parsed.length; j += 1) loaded.push(parsed[j]);
    }

    if (loaded.length === 0) return;

    const current = Array.isArray(window.LINKED_PUBLIC_RECORDS) ? window.LINKED_PUBLIC_RECORDS : [];
    window.LINKED_PUBLIC_RECORDS = mergeRecords(current, loaded);

    window.dispatchEvent(new CustomEvent('lpri-records-updated', {
      detail: {
        source: 'names+mentions',
        added: loaded.length,
        total: window.LINKED_PUBLIC_RECORDS.length
      }
    }));
  }

  loadTxtDatasets();
})();
