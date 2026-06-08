// DarkShield — content.js
// Runs on every page, detects dark patterns, highlights them
// @codingbreaker

(function () {
  'use strict';

  // Inject detectors.js
  const s = document.createElement('script');
  s.src = chrome.runtime.getURL('detectors.js');
  s.onload = () => { s.remove(); init(); };
  (document.head || document.documentElement).appendChild(s);

  let _scanResults = null;
  let _enabled = true;
  let _highlighted = [];

  // ── Listen to popup messages ──────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
    if (msg.action === 'getScan')    { sendResponse(_scanResults); }
    if (msg.action === 'rescan')     { clearHighlights(); init(); sendResponse({ ok: true }); }
    if (msg.action === 'toggle')     { _enabled = msg.enabled; _enabled ? showHighlights() : clearHighlights(); sendResponse({ ok: true }); }
    if (msg.action === 'highlight')  { scrollToPattern(msg.key); sendResponse({ ok: true }); }
    return true;
  });

  function init() {
    chrome.storage.sync.get('dsEnabled', ({ dsEnabled }) => {
      _enabled = dsEnabled !== false;
      scan();
    });
  }

  // ── SCAN ──────────────────────────────────────────────────────────
  function scan() {
    if (typeof runAllDetectors === 'undefined') {
      setTimeout(scan, 300);
      return;
    }

    const { results, total } = runAllDetectors();
    _scanResults = { results: serializeResults(results), total, url: location.href, ts: Date.now() };

    // Update badge
    chrome.runtime.sendMessage({ action: 'setBadge', count: total });

    if (_enabled) showHighlights(results);
  }

  // Serialize for messaging (can't pass DOM elements)
  function serializeResults(results) {
    const out = {};
    for (const [key, p] of Object.entries(results)) {
      out[key] = {
        label: p.label, emoji: p.emoji, color: p.color,
        desc: p.desc, count: p.found.length,
        items: p.found.map(f => f.reason || ''),
      };
    }
    return out;
  }

  // ── HIGHLIGHT ─────────────────────────────────────────────────────
  function showHighlights(results) {
    if (!results) return;
    clearHighlights();

    for (const [key, p] of Object.entries(results)) {
      if (!p.found?.length) continue;
      p.found.forEach(({ el, reason }) => {
        if (!el || !document.body.contains(el)) return;

        // Make position relative if needed for tooltip
        const pos = window.getComputedStyle(el).position;
        if (pos === 'static') el.style.position = 'relative';

        el.classList.add('__ds_highlight');
        el.style.setProperty('--ds-color', p.color);

        // Tooltip on hover
        let tip = null;
        el.addEventListener('mouseenter', () => {
          tip = document.createElement('div');
          tip.className = '__ds_tooltip';
          tip.style.setProperty('--ds-color', p.color);
          tip.innerHTML = `<strong style="color:${p.color}">${p.emoji} ${p.label}</strong><br>${p.desc}<br><small style="color:#6b7280;margin-top:3px;display:block">${reason || ''}</small>`;
          el.appendChild(tip);
        });
        el.addEventListener('mouseleave', () => { tip?.remove(); tip = null; });

        _highlighted.push(el);
      });
    }
  }

  function clearHighlights() {
    _highlighted.forEach(el => {
      el.classList.remove('__ds_highlight');
      el.style.removeProperty('--ds-color');
      el.querySelectorAll('.__ds_tooltip,.__ds_badge_el').forEach(n => n.remove());
    });
    _highlighted = [];
  }

  function scrollToPattern(key) {
    if (!_scanResults?.results?.[key]) return;
    // Re-run detector to get fresh elements
    if (typeof PATTERNS !== 'undefined' && PATTERNS[key]) {
      const found = PATTERNS[key].detect();
      if (found[0]?.el) {
        found[0].el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        found[0].el.style.outline = `3px solid ${PATTERNS[key].color}`;
        setTimeout(() => { if (found[0].el) found[0].el.style.outline = ''; }, 2000);
      }
    }
  }

  // Re-scan on SPA navigation
  let _lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== _lastUrl) {
      _lastUrl = location.href;
      setTimeout(() => { clearHighlights(); scan(); }, 1000);
    }
  }).observe(document.body, { childList: true, subtree: false });

})();
