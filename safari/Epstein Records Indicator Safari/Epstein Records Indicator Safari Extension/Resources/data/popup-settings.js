(() => {
  const BADGE_SETTINGS_STORAGE_KEY = 'lpriBadgeSettings';
  const DISABLED_NAMES_STORAGE_KEY = 'lpriDisabledNames';
  const CUSTOM_RECORDS_STORAGE_KEY = 'lpriCustomRecords';
  const DEFAULT_BADGE_SETTINGS = {
    files: true,
    mentioned: true,
    collaborator: true,
    enemy: true,
    'black-book': true
  };
  const EXT = typeof browser !== 'undefined' ? browser : chrome;
  const CATEGORY_FILE_BY_TYPE = {
    files: 'data/names.txt',
    mentioned: 'data/mentions.txt',
    collaborator: 'data/collaborator.txt',
    enemy: 'data/enemy.txt',
    'black-book': 'data/black-book.txt'
  };
  const REFERENCES_FILE = 'data/references.txt';
  const CATEGORY_LABEL_BY_TYPE = {
    files: 'epstein files',
    mentioned: 'epstein mentioned',
    collaborator: 'epstein collaborator',
    enemy: 'epstein enemy',
    'black-book': 'epstein black book'
  };
  const DEFAULT_CUSTOM_RECORDS = {
    files: [],
    mentioned: [],
    collaborator: [],
    enemy: [],
    'black-book': []
  };
  const cachedCategoryData = {};
  let disabledNames = {};
  let customRecords = Object.assign({}, DEFAULT_CUSTOM_RECORDS);

  const INPUT_BY_TYPE = {
    files: document.getElementById('toggle-files'),
    mentioned: document.getElementById('toggle-mentioned'),
    collaborator: document.getElementById('toggle-collaborator'),
    enemy: document.getElementById('toggle-enemy'),
    'black-book': document.getElementById('toggle-black-book')
  };
  const SHOW_BUTTON_BY_TYPE = {
    files: document.getElementById('show-files'),
    mentioned: document.getElementById('show-mentioned'),
    collaborator: document.getElementById('show-collaborator'),
    enemy: document.getElementById('show-enemy'),
    'black-book': document.getElementById('show-black-book')
  };
  const ADD_BUTTON_BY_TYPE = {
    files: document.getElementById('add-files'),
    mentioned: document.getElementById('add-mentioned'),
    collaborator: document.getElementById('add-collaborator'),
    enemy: document.getElementById('add-enemy'),
    'black-book': document.getElementById('add-black-book')
  };
  const PANEL_BY_TYPE = {
    files: document.getElementById('panel-files'),
    mentioned: document.getElementById('panel-mentioned'),
    collaborator: document.getElementById('panel-collaborator'),
    enemy: document.getElementById('panel-enemy'),
    'black-book': document.getElementById('panel-black-book')
  };
  const RESTORE_BUTTON = document.getElementById('restore-disabled');
  const REFERENCES_BUTTON = document.getElementById('show-references');
  const REFERENCES_PANEL = document.getElementById('panel-references');

  function normalizeBadgeSettings(input) {
    const next = Object.assign({}, DEFAULT_BADGE_SETTINGS);
    const raw = input && typeof input === 'object' ? input : {};
    Object.keys(next).forEach((key) => {
      if (typeof raw[key] === 'boolean') next[key] = raw[key];
    });
    return next;
  }

  function normalizeName(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z\s'-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeDisabledNames(input) {
    const out = {};
    const raw = input && typeof input === 'object' ? input : {};
    Object.keys(raw).forEach((key) => {
      const normalized = normalizeName(key);
      if (!normalized) return;
      if (raw[key] === true) out[normalized] = true;
    });
    return out;
  }

  function normalizeCustomRecords(input) {
    const out = {};
    const raw = input && typeof input === 'object' ? input : {};
    Object.keys(DEFAULT_CUSTOM_RECORDS).forEach((type) => {
      const source = Array.isArray(raw[type]) ? raw[type] : [];
      out[type] = source
        .map((item) => String(item || '').trim())
        .filter((item) => item.length > 0);
    });
    return out;
  }

  function updateRestoreVisibility() {
    if (!RESTORE_BUTTON) return;
    RESTORE_BUTTON.hidden = Object.keys(disabledNames).length === 0;
  }

  function getStorageValue(key) {
    return new Promise((resolve) => {
      try {
        EXT.storage.local.get([key], (result) => {
          const value = result && typeof result === 'object' ? result[key] : undefined;
          resolve(value);
        });
      } catch (err) {
        resolve(undefined);
      }
    });
  }

  function setStorageValues(values) {
    return new Promise((resolve) => {
      try {
        EXT.storage.local.set(values, () => resolve());
      } catch (err) {
        resolve();
      }
    });
  }

  function notifyContentRefresh(payload) {
    try {
      EXT.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = Array.isArray(tabs) && tabs.length > 0 ? tabs[0] : null;
        if (!tab || typeof tab.id !== 'number') return;
        const message = Object.assign({ type: 'lpri-refresh-record-settings' }, payload || {});
        EXT.tabs.sendMessage(tab.id, message, () => {
          // Ignore runtime errors on pages without content script access.
          void EXT.runtime.lastError;
        });
      });
    } catch (err) {
      // no-op
    }
  }

  function collectFromUI() {
    const out = {};
    Object.keys(DEFAULT_BADGE_SETTINGS).forEach((type) => {
      const input = INPUT_BY_TYPE[type];
      out[type] = input ? !!input.checked : true;
    });
    return out;
  }

  function applyToUI(settings) {
    Object.keys(DEFAULT_BADGE_SETTINGS).forEach((type) => {
      const input = INPUT_BY_TYPE[type];
      if (!input) return;
      input.checked = !!settings[type];
    });
  }

  async function saveFromUI() {
    const next = collectFromUI();
    await setStorageValues({ [BADGE_SETTINGS_STORAGE_KEY]: next });
  }

  function parseCategoryText(rawText) {
    return String(rawText || '')
      .split(/\r?\n/g)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));
  }

  function parseReferencesText(rawText) {
    return String(rawText || '')
      .split(/\r?\n/g)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));
  }

  async function loadCategoryData(type) {
    if (cachedCategoryData[type]) return cachedCategoryData[type];
    const relPath = CATEGORY_FILE_BY_TYPE[type];
    if (!relPath) return [];
    const url = EXT.runtime.getURL(relPath);
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch ' + relPath);
    const text = await response.text();
    const baseLines = parseCategoryText(text);
    const customLines = Array.isArray(customRecords[type]) ? customRecords[type] : [];
    const customSet = new Set(customLines.map((item) => normalizeName(item)));

    const all = baseLines.concat(customLines);
    const seen = new Set();
    const entries = [];
    for (let i = 0; i < all.length; i += 1) {
      const name = String(all[i] || '').trim();
      const normalized = normalizeName(name);
      if (!name || !normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      entries.push({
        name,
        normalized,
        custom: customSet.has(normalized)
      });
    }

    cachedCategoryData[type] = entries;
    return entries;
  }

  async function setNameDisabled(normalizedName, isDisabled) {
    if (!normalizedName) return;
    if (isDisabled) disabledNames[normalizedName] = true;
    else delete disabledNames[normalizedName];
    updateRestoreVisibility();
    await setStorageValues({ [DISABLED_NAMES_STORAGE_KEY]: disabledNames });
    notifyContentRefresh({ disabledNames });
  }

  function syncCheckboxesForName(normalizedName, enabled) {
    if (!normalizedName) return;
    const selectors = 'input[data-name-key="' + normalizedName.replace(/"/g, '\\"') + '"]';
    const checkboxes = document.querySelectorAll(selectors);
    for (let i = 0; i < checkboxes.length; i += 1) {
      checkboxes[i].checked = enabled;
    }
  }

  function renderCategoryPanel(type, entries) {
    const panel = PANEL_BY_TYPE[type];
    if (!panel) return;
    const meta = document.createElement('div');
    meta.className = 'data-meta';
    meta.textContent = entries.length + ' entries';
    const body = document.createElement('div');
    const frag = document.createDocumentFragment();
    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      const row = document.createElement('div');
      row.className = 'entry-row';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = !disabledNames[entry.normalized];
      checkbox.dataset.nameKey = entry.normalized;
      checkbox.addEventListener('change', async () => {
        const enabled = !!checkbox.checked;
        await setNameDisabled(entry.normalized, !enabled);
        syncCheckboxesForName(entry.normalized, enabled);
      });

      const name = document.createElement('span');
      name.className = 'entry-name';
      name.textContent = entry.name;

      row.appendChild(checkbox);
      row.appendChild(name);
      if (entry.custom) {
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'entry-delete';
        del.textContent = 'Delete';
        del.addEventListener('click', async () => {
          await deleteCustomRecord(type, entry.normalized);
        });
        row.appendChild(del);
      }
      frag.appendChild(row);
    }
    body.appendChild(frag);

    panel.innerHTML = '';
    panel.appendChild(meta);
    panel.appendChild(body);
  }

  async function deleteCustomRecord(type, normalizedName) {
    const current = Array.isArray(customRecords[type]) ? customRecords[type] : [];
    customRecords[type] = current.filter((item) => normalizeName(item) !== normalizedName);
    cachedCategoryData[type] = null;
    await setStorageValues({ [CUSTOM_RECORDS_STORAGE_KEY]: customRecords });
    notifyContentRefresh({ customRecords });

    const panel = PANEL_BY_TYPE[type];
    if (panel && !panel.hidden) {
      const entries = await loadCategoryData(type);
      renderCategoryPanel(type, entries);
    }
  }

  function setShowButtonLabel(type, expanded) {
    const btn = SHOW_BUTTON_BY_TYPE[type];
    if (!btn) return;
    btn.textContent = expanded ? 'Hide data' : 'Show data';
  }

  async function toggleCategoryPanel(type) {
    const panel = PANEL_BY_TYPE[type];
    if (!panel) return;

    const willOpen = !!panel.hidden;
    if (!willOpen) {
      panel.hidden = true;
      setShowButtonLabel(type, false);
      return;
    }

    if (!panel.dataset.loaded) {
      panel.innerHTML = '<div class="data-meta">Loading...</div>';
      panel.hidden = false;
      setShowButtonLabel(type, true);
      try {
        const lines = await loadCategoryData(type);
        renderCategoryPanel(type, lines);
        panel.dataset.loaded = 'true';
      } catch (err) {
        panel.innerHTML = '<div class="data-meta">Failed to load category data.</div>';
      }
      return;
    }

    panel.hidden = false;
    setShowButtonLabel(type, true);
  }

  async function addRecord(type) {
    const categoryLabel = CATEGORY_LABEL_BY_TYPE[type] || type;
    const raw = window.prompt('Add a Record to ' + categoryLabel, '');
    if (raw === null) return;
    const name = String(raw || '').trim();
    if (!name) return;
    if (!Array.isArray(customRecords[type])) customRecords[type] = [];

    const normalizedNew = normalizeName(name);
    const allEntries = await loadCategoryData(type);
    const alreadyExists = allEntries.some((entry) => entry.normalized === normalizedNew);
    if (!alreadyExists) customRecords[type].push(name);

    cachedCategoryData[type] = null;
    await setStorageValues({ [CUSTOM_RECORDS_STORAGE_KEY]: customRecords });
    notifyContentRefresh({ customRecords });

    const panel = PANEL_BY_TYPE[type];
    if (panel && !panel.hidden) {
      const entries = await loadCategoryData(type);
      renderCategoryPanel(type, entries);
    }
  }

  async function toggleReferencesPanel() {
    if (!REFERENCES_PANEL || !REFERENCES_BUTTON) return;
    if (!REFERENCES_PANEL.hidden) {
      REFERENCES_PANEL.hidden = true;
      REFERENCES_BUTTON.textContent = 'References';
      return;
    }

    REFERENCES_PANEL.hidden = false;
    REFERENCES_BUTTON.textContent = 'Hide references';
    REFERENCES_PANEL.innerHTML = '<div class="data-meta">Loading...</div>';
    try {
      const url = EXT.runtime.getURL(REFERENCES_FILE);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load references');
      const refs = parseReferencesText(await response.text());

      const meta = document.createElement('div');
      meta.className = 'data-meta';
      meta.textContent = refs.length + ' references';

      const body = document.createElement('div');
      for (let i = 0; i < refs.length; i += 1) {
        const href = refs[i];
        const a = document.createElement('a');
        a.className = 'ref-link';
        a.href = href;
        a.target = '_blank';
        a.rel = 'noreferrer noopener';
        a.textContent = href;
        body.appendChild(a);
      }

      REFERENCES_PANEL.innerHTML = '';
      REFERENCES_PANEL.appendChild(meta);
      REFERENCES_PANEL.appendChild(body);
    } catch (err) {
      REFERENCES_PANEL.innerHTML = '<div class="data-meta">Failed to load references.</div>';
    }
  }

  async function init() {
    const [rawSettings, rawDisabled] = await Promise.all([
      getStorageValue(BADGE_SETTINGS_STORAGE_KEY),
      getStorageValue(DISABLED_NAMES_STORAGE_KEY)
    ]);
    const rawCustom = await getStorageValue(CUSTOM_RECORDS_STORAGE_KEY);
    const settings = normalizeBadgeSettings(rawSettings);
    disabledNames = normalizeDisabledNames(rawDisabled);
    customRecords = normalizeCustomRecords(rawCustom);
    applyToUI(settings);
    updateRestoreVisibility();

    Object.values(INPUT_BY_TYPE).forEach((input) => {
      if (!input) return;
      input.addEventListener('change', saveFromUI);
    });

    Object.keys(SHOW_BUTTON_BY_TYPE).forEach((type) => {
      const button = SHOW_BUTTON_BY_TYPE[type];
      if (!button) return;
      button.addEventListener('click', () => {
        toggleCategoryPanel(type);
      });
      setShowButtonLabel(type, false);
    });

    Object.keys(ADD_BUTTON_BY_TYPE).forEach((type) => {
      const button = ADD_BUTTON_BY_TYPE[type];
      if (!button) return;
      button.addEventListener('click', () => {
        addRecord(type);
      });
    });

    if (RESTORE_BUTTON) {
      RESTORE_BUTTON.addEventListener('click', async () => {
        disabledNames = {};
        updateRestoreVisibility();
        await setStorageValues({ [DISABLED_NAMES_STORAGE_KEY]: disabledNames });
        notifyContentRefresh({ disabledNames });
        const allEntryCheckboxes = document.querySelectorAll('input[data-name-key]');
        for (let i = 0; i < allEntryCheckboxes.length; i += 1) {
          allEntryCheckboxes[i].checked = true;
        }
      });
    }

    if (REFERENCES_BUTTON) {
      REFERENCES_BUTTON.addEventListener('click', () => {
        toggleReferencesPanel();
      });
    }
  }

  init();
})();
