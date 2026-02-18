(() => {
  const BADGE_CLASS = 'lpri-epstein-badge';
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

      const normalizedRecord = {
        name: String(record.name),
        category: record.category ? String(record.category) : 'Epstein files',
        sources: Array.isArray(record.sources) ? record.sources.filter((s) => typeof s === 'string' && s.trim()) : [],
        notes: typeof record.notes === 'string' ? record.notes : ''
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
        font-size: inherit;
        line-height: 1.2;
        color: white;
        background-color: rgba(185, 28, 28, 1);
        border-radius: 4px;
        cursor: pointer;
        text-decoration: none;
        vertical-align: super;
        text-transform: lowercase;
        letter-spacing: 0.02em;
        font-weight: 700;
        font-family: sans-serif !important;
      }

      .${BADGE_CLASS}:visited,
      .${BADGE_CLASS}:active,
      .${BADGE_CLASS}:hover,
      .${BADGE_CLASS}:hover:visited {
        color: white;
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
    return words.every((w) => /^[A-Z][A-Za-z'-.]*$/.test(w));
  }

  function extractCandidateName(text) {
    const raw = String(text || '').replace(/\s+/g, ' ').trim();
    if (!looksLikeName(raw)) return '';
    return raw;
  }

  function isEligibleElement(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
    const tag = el.tagName;
    if (!tag) return false;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return false;
    if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return false;
    if (el.isContentEditable) return false;
    if (el.closest && el.closest('script,style,noscript,textarea,input,select,[contenteditable="true"]')) return false;
    return true;
  }

  function processNameNode(el, candidateText) {
    if (!el || hasBadge(el)) return;
    if (el.getAttribute && el.getAttribute(MARK_ATTR) === '1') return;

    const candidate = extractCandidateName(candidateText || el.textContent);
    if (!candidate) return;

    const key = normalizeName(candidate);
    if (!key) return;

    const matches = index.get(key);
    if (!matches || matches.length === 0) return;

    const badge = document.createElement('a');
    badge.className = BADGE_CLASS;
    badge.textContent = 'epstein files';
    badge.href = buildDojSearchUrl(candidate);
    badge.target = '_blank';
    badge.rel = 'noreferrer noopener';
    badge.title = 'Open DOJ Epstein files search for this name';

    try {
      const cs = window.getComputedStyle(el);
      if (cs && cs.fontSize) {
        const px = parseFloat(cs.fontSize);
        if (!Number.isNaN(px) && px > 0) badge.style.fontSize = String(Math.max(10, Math.round(px * 0.55))) + 'px';
      }
    } catch (err) {
      // Keep default badge sizing if computed style lookup fails.
    }

    badge.addEventListener('mouseenter', () => showTooltip(badge, matches));
    badge.addEventListener('mouseleave', hideTooltip);

    el.insertAdjacentElement('afterend', badge);
    if (el.setAttribute) el.setAttribute(MARK_ATTR, '1');
  }

  function scanTextNodes(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node || !node.parentElement) return NodeFilter.FILTER_REJECT;
        if (!isEligibleElement(node.parentElement)) return NodeFilter.FILTER_REJECT;

        const value = String(node.nodeValue || '').replace(/\s+/g, ' ').trim();
        if (!value) return NodeFilter.FILTER_REJECT;
        if (!looksLikeName(value)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    let textNode = walker.nextNode();
    while (textNode) {
      const parent = textNode.parentElement;
      if (parent) processNameNode(parent, textNode.nodeValue);
      textNode = walker.nextNode();
    }
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
