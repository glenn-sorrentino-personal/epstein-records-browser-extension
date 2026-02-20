(() => {
  const BADGE_CLASS = 'lpri-epstein-badge';
  const BADGE_MENTION_CLASS = 'lpri-epstein-badge-mentioned';
  const BADGE_COLLABORATOR_CLASS = 'lpri-epstein-badge-collaborator';
  const BADGE_ENEMY_CLASS = 'lpri-epstein-badge-enemy';
  const TOOLTIP_CLASS = 'lpri-epstein-tooltip';
  const MARK_ATTR = 'data-lpri-marked';
  const MAX_TEXT_LENGTH = 120;
  const MAX_NAME_WORDS = 5;
  const EPSTEIN_SEARCH_BASE = 'https://www.justice.gov/epstein';

  let index = new Map();

  function normalizeName(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z\s'-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function buildIndex(records) {
    const map = new Map();
    for (const record of records) {
      if (!record || typeof record !== 'object' || !record.name) continue;
      const key = normalizeName(record.name);
      if (!key) continue;

      const rawBadgeType = String(record.badgeType || '').toLowerCase().trim();
      const safeBadgeType = /^[a-z0-9-]+$/.test(rawBadgeType) ? rawBadgeType : '';
      const normalizedRecord = {
        name: String(record.name),
        category: record.category ? String(record.category) : 'Epstein files',
        sources: Array.isArray(record.sources) ? record.sources.filter((s) => typeof s === 'string' && s.trim()) : [],
        notes: typeof record.notes === 'string' ? record.notes : '',
        badgeText: typeof record.badgeText === 'string' ? record.badgeText : 'epstein files',
        badgeType: safeBadgeType || 'files'
      };

      if (!map.has(key)) map.set(key, []);
      map.get(key).push(normalizedRecord);
    }
    return map;
  }

  function setRecords(records) {
    index = buildIndex(Array.isArray(records) ? records : []);
    scheduleScan();
  }

  function loadRecordsFromWindow() {
    const records = Array.isArray(window.LINKED_PUBLIC_RECORDS) ? window.LINKED_PUBLIC_RECORDS : [];
    setRecords(records);
  }

  function buildDojSearchUrl(name) {
    const q = encodeURIComponent(String(name || '').trim());
    return EPSTEIN_SEARCH_BASE + '?search=' + q + '&q=' + q + '&search_api_fulltext=' + q;
  }

  function isDojEpsteinPage() {
    return /(^|\.)justice\.gov$/i.test(window.location.hostname) && window.location.pathname.toLowerCase().indexOf('/epstein') === 0;
  }

  function getDojSearchQueryFromUrl() {
    const params = new URLSearchParams(window.location.search || '');
    const raw = params.get('search') || params.get('q') || params.get('search_api_fulltext') || '';
    return String(raw).trim();
  }

  function applyDojSearchInputValue(value) {
    const input = document.getElementById('searchInput');
    if (!input) return null;

    try {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, value);
    } catch (err) {
      input.value = value;
    }

    input.dispatchEvent(new InputEvent('input', { bubbles: true, data: value, inputType: 'insertText' }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('search', { bubbles: true }));
    return input;
  }

  function executeDojSearch(input) {
    if (!input) return;

    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));

    const form = input.closest('form');
    if (form && typeof form.requestSubmit === 'function') {
      form.requestSubmit();
    } else if (form && typeof form.submit === 'function') {
      form.submit();
    }

    const nearButton = (form || input.parentElement || document).querySelector('button[type="submit"], input[type="submit"], .usa-search__submit, button[aria-label*="Search" i]');
    if (nearButton && typeof nearButton.click === 'function') nearButton.click();
  }

  function ensureStyles() {
    if (document.getElementById('lpri-style')) return;
    const style = document.createElement('style');
    style.id = 'lpri-style';
    style.textContent = `
      .${BADGE_CLASS} {
        display: inline-block;
        margin-left: 4px;
        padding: 2px 4px;
        font-size: 11px;
        line-height: 1.2;
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
        background-color: rgba(185, 28, 28, 1);
        border-radius: 4px;
        cursor: pointer;
        text-decoration: none !important;
        vertical-align: super;
        text-transform: lowercase;
        letter-spacing: 0.02em;
        font-weight: 700;
        font-family: sans-serif !important;
      }

      .${BADGE_CLASS}.${BADGE_MENTION_CLASS} {
        background-color: #ccc;
        color: #333 !important;
        -webkit-text-fill-color: #333 !important;
      }
      .${BADGE_CLASS}.${BADGE_COLLABORATOR_CLASS} {
        background-color: #800000;
      }
      .${BADGE_CLASS}.${BADGE_ENEMY_CLASS} {
        background-color: #15803d;
      }

      .${BADGE_CLASS}.${BADGE_MENTION_CLASS}:link,
      .${BADGE_CLASS}.${BADGE_MENTION_CLASS}:visited,
      .${BADGE_CLASS}.${BADGE_MENTION_CLASS}:hover,
      .${BADGE_CLASS}.${BADGE_MENTION_CLASS}:active,
      .${BADGE_CLASS}.${BADGE_MENTION_CLASS}:focus,
      .${BADGE_CLASS}.${BADGE_MENTION_CLASS}:focus-visible,
      .${BADGE_CLASS}.${BADGE_MENTION_CLASS}:hover:visited {
        color: #333 !important;
        -webkit-text-fill-color: #333 !important;
      }

      .${BADGE_CLASS}:link,
      .${BADGE_CLASS}:visited,
      .${BADGE_CLASS}:hover,
      .${BADGE_CLASS}:active,
      .${BADGE_CLASS}:focus,
      .${BADGE_CLASS}:focus-visible,
      .${BADGE_CLASS}:hover:visited {
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
        text-decoration: none !important;
      }
      .${TOOLTIP_CLASS} {
        position: absolute;
        z-index: 999999;
        max-width: 340px;
        padding: 8px 10px;
        border-radius: 8px;
        background: #111827;
        color: #f9fafb;
        font-size: 12px;
        line-height: 1.35;
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.24);
      }

      .${TOOLTIP_CLASS} a {
        color: #67e8f9;
        text-decoration: underline;
      }
    `;
    document.head.appendChild(style);
  }

  function buildTooltipContent() {
    const root = document.createElement('div');
    root.textContent = 'Public records available. Name match only.';
    return root;
  }

  let activeTip = null;

  function showTooltip(anchor, matches) {
    hideTooltip();
    const tip = document.createElement('div');
    tip.className = TOOLTIP_CLASS;
    tip.appendChild(buildTooltipContent());
    document.body.appendChild(tip);

    const r = anchor.getBoundingClientRect();
    const top = window.scrollY + r.bottom + 6;
    const left = window.scrollX + r.left;
    tip.style.top = `${top}px`;
    tip.style.left = `${left}px`;

    activeTip = tip;
  }

  function hideTooltip() {
    if (!activeTip) return;
    activeTip.remove();
    activeTip = null;
  }

  function hasBadge(el) {
    return el.nextElementSibling && el.nextElementSibling.classList && el.nextElementSibling.classList.contains(BADGE_CLASS);
  }

  function looksLikeName(raw) {
    if (!raw) return false;
    if (raw.length < 3 || raw.length > MAX_TEXT_LENGTH) return false;
    if (raw.indexOf('@') >= 0) return false;
    if (raw.indexOf('/') >= 0) return false;
    if (/\d/.test(raw)) return false;

    const words = raw.split(/\s+/).filter(Boolean);
    if (words.length < 2 || words.length > MAX_NAME_WORDS) return false;
    return words.every((w) => /^\p{Lu}[\p{L}\p{M}'-.]*$/u.test(w));
  }

  function findAllMatchedRecordsInText(text) {
    const raw = String(text || '').replace(/\s+/g, ' ').trim();
    if (!raw) return [];

    const out = [];
    const used = [];

    function overlaps(start, end) {
      for (let i = 0; i < used.length; i += 1) {
        const u = used[i];
        if (start < u.end && end > u.start) return true;
      }
      return false;
    }

    const tokenPattern = /\p{Lu}[\p{L}\p{M}'-.]*/gu;
    const tokens = [];
    let tm;
    while ((tm = tokenPattern.exec(raw)) !== null) {
      const word = String(tm[0] || '');
      if (!word) continue;
      tokens.push({ word, start: tm.index, end: tm.index + word.length });
    }

    function isContiguousWordRun(i, j) {
      for (let k = i; k < j; k += 1) {
        const gap = raw.slice(tokens[k].end, tokens[k + 1].start);
        if (!/^\s+$/.test(gap)) return false;
      }
      return true;
    }

    const maxWindow = 5;
    for (let i = 0; i < tokens.length; i += 1) {
      for (let size = maxWindow; size >= 1; size -= 1) {
        const j = i + size - 1;
        if (j >= tokens.length) continue;
        if (!isContiguousWordRun(i, j)) continue;

        const start = tokens[i].start;
        const end = tokens[j].end;
        if (overlaps(start, end)) continue;

        const candidate = raw.slice(start, end).trim();
        if (!candidate) continue;

        const key = normalizeName(candidate);
        if (!key || !index.has(key)) continue;

        used.push({ start, end });
        const recordsForKey = index.get(key);
        const badgeByType = new Map();
        for (let r = 0; r < recordsForKey.length; r += 1) {
          const rec = recordsForKey[r] || {};
          const type = String(rec.badgeType || 'files').toLowerCase().trim() || 'files';
          const text = typeof rec.badgeText === 'string' && rec.badgeText.trim() ? rec.badgeText.trim() : ('epstein ' + type);
          if (!badgeByType.has(type)) badgeByType.set(type, text);
        }

        const badges = [];
        const order = ['files', 'mentioned', 'collaborator', 'enemy'];
        for (let o = 0; o < order.length; o += 1) {
          const type = order[o];
          if (!badgeByType.has(type)) continue;
          badges.push({ type, text: badgeByType.get(type) });
          badgeByType.delete(type);
        }
        badgeByType.forEach((text, type) => badges.push({ type, text }));

        out.push({ candidate, key, matches: recordsForKey, start, end, badges });
        break;
      }
    }

    return out.sort((a, b) => a.start - b.start);
  }
  function isEligibleElement(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
    const tag = el.tagName;
    if (!tag) return false;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return false;
    if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return false;
    if (el.isContentEditable) return false;
    if (el.closest && el.closest('script,style,noscript,textarea,input,select,[contenteditable="true"], .' + BADGE_CLASS + ', [data-lpri-name-key]')) return false;
    return true;
  }

  function processNameNode(textNode) {
    if (!textNode || !textNode.parentElement) return;
    const el = textNode.parentElement;
    if (!isEligibleElement(el)) return;

    const text = String(textNode.nodeValue || '');
    if (!text.trim()) return;

    const matches = findAllMatchedRecordsInText(text);
    if (!matches || matches.length === 0) return;

    const frag = document.createDocumentFragment();
    let cursor = 0;

    for (let i = 0; i < matches.length; i += 1) {
      const match = matches[i];
      if (match.start > cursor) {
        frag.appendChild(document.createTextNode(text.slice(cursor, match.start)));
      }

      const nameSpan = document.createElement('span');
      nameSpan.setAttribute('data-lpri-name-key', match.key);
      nameSpan.textContent = match.candidate;
      frag.appendChild(nameSpan);

      const badges = Array.isArray(match.badges) && match.badges.length > 0
        ? match.badges
        : [{ type: 'files', text: 'epstein files' }];

      for (let b = 0; b < badges.length; b += 1) {
        const badgeInfo = badges[b];
        const badge = document.createElement('a');
        let extraClass = '';
        if (badgeInfo.type === 'mentioned') extraClass = BADGE_MENTION_CLASS;
        else if (badgeInfo.type === 'collaborator') extraClass = BADGE_COLLABORATOR_CLASS;
        else if (badgeInfo.type === 'enemy') extraClass = BADGE_ENEMY_CLASS;
        badge.className = BADGE_CLASS + (extraClass ? ' ' + extraClass : '');
        badge.textContent = badgeInfo.text;
        badge.href = buildDojSearchUrl(match.candidate);
        badge.target = '_blank';
        badge.rel = 'noreferrer noopener';
        badge.title = 'Open DOJ Epstein files search for this name';
        badge.addEventListener('mouseenter', () => showTooltip(badge, match.matches));
        badge.addEventListener('mouseleave', hideTooltip);
        frag.appendChild(badge);
      }

      cursor = match.end;
    }

    if (cursor < text.length) {
      frag.appendChild(document.createTextNode(text.slice(cursor)));
    }

    textNode.parentNode.replaceChild(frag, textNode);
  }
  function scanTextNodes(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node || !node.parentElement) return NodeFilter.FILTER_REJECT;
        if (!isEligibleElement(node.parentElement)) return NodeFilter.FILTER_REJECT;

        const value = String(node.nodeValue || '').replace(/\s+/g, ' ').trim();
        if (!value) return NodeFilter.FILTER_REJECT;
        if (findAllMatchedRecordsInText(value).length === 0) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes = [];
    let textNode = walker.nextNode();
    while (textNode) {
      nodes.push(textNode);
      textNode = walker.nextNode();
    }

    for (let i = 0; i < nodes.length; i += 1) processNameNode(nodes[i]);
  }
  function scan() {
    scanTextNodes(document.body || document.documentElement);
  }

  let scanTimer = null;
  function scheduleScan() {
    if (scanTimer) clearTimeout(scanTimer);
    scanTimer = setTimeout(() => {
      scanTimer = null;
      scan();
    }, 120);
  }

  function triggerDojSearchOnce() {
    if (!isDojEpsteinPage()) return;

    const query = getDojSearchQueryFromUrl();
    if (!query) return;

    const runKey = '__lpri_doj_search_ran__' + query.toLowerCase();
    if (window[runKey]) return;

    let tries = 0;
    const maxTries = 20;
    const timer = setInterval(function () {
      tries += 1;
      const input = applyDojSearchInputValue(query);
      if (input) {
        executeDojSearch(input);
        window[runKey] = true;
        clearInterval(timer);
        return;
      }
      if (tries >= maxTries) clearInterval(timer);
    }, 120);
  }

  function start() {
    triggerDojSearchOnce();
    ensureStyles();
    loadRecordsFromWindow();
    scan();

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList' || m.type === 'characterData') {
          scheduleScan();
          return;
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

    window.addEventListener('lpri-records-updated', loadRecordsFromWindow);
    window.addEventListener('scroll', hideTooltip, { passive: true });
    window.addEventListener('click', hideTooltip);
  }

  start();
})();
