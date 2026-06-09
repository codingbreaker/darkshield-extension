// DarkShield — content.js
// @codingbreaker

(function () {
  'use strict';

  // Inject detectors.js into page world
  const s = document.createElement('script');
  s.src = chrome.runtime.getURL('detectors.js');
  s.onload = () => { s.remove(); init(); };
  (document.head || document.documentElement).appendChild(s);

  let _scanResults = null;
  let _enabled     = true;
  let _highlighted = [];
  let _cardDismissed = false;

  // ── Messages from popup ───────────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
    if (msg.action === 'getScan')   { sendResponse(_scanResults); }
    if (msg.action === 'rescan')    { _cardDismissed = false; clearHighlights(); removeFloatingCard(); init(); sendResponse({ ok: true }); }
    if (msg.action === 'toggle')    { _enabled = msg.enabled; _enabled ? showHighlights() : clearHighlights(); sendResponse({ ok: true }); }
    if (msg.action === 'highlight') { scrollToPattern(msg.key); sendResponse({ ok: true }); }
    return true;
  });

  function init() {
    chrome.storage.sync.get('dsEnabled', ({ dsEnabled }) => {
      _enabled = dsEnabled !== false;
      scan();
      // Re-scan after delay for dynamic/lazy-loaded content (silent — don't re-show card)
      setTimeout(() => { if(_scanResults?.total === 0) { _cardDismissed = true; scan(); _cardDismissed = false; } }, 2500);
      setTimeout(() => { if(_scanResults?.total === 0) scan(); }, 5000);
    });
  }

  // ── SCAN ──────────────────────────────────────────────────────────
  function scan() {
    if (typeof runAllDetectors === 'undefined') { setTimeout(scan, 300); return; }

    const { results, total } = runAllDetectors();
    _scanResults = { results: serializeResults(results), total, url: location.href, ts: Date.now() };

    chrome.runtime.sendMessage({ action: 'setBadge', count: total });

    if (_enabled) showHighlights(results);
    if (!_cardDismissed) showFloatingCard(total, results);
  }

  function serializeResults(results) {
    const out = {};
    for (const [key, p] of Object.entries(results)) {
      out[key] = { label:p.label, emoji:p.emoji, color:p.color, desc:p.desc, count:p.found.length, items:p.found.map(f=>f.reason||'') };
    }
    return out;
  }

  // ── FLOATING CARD (auto shows on page) ───────────────────────────
  function removeFloatingCard() {
    document.getElementById('__ds_card')?.remove();
  }

  function showFloatingCard(total, results) {
    removeFloatingCard();

    const isClean    = total === 0;
    const topPatterns = isClean ? [] : Object.values(results)
      .filter(p => p.found?.length > 0)
      .sort((a,b) => b.found.length - a.found.length)
      .slice(0, 3);

    const riskColor = isClean ? '#4ade80' : total > 5 ? '#ef4444' : total > 2 ? '#f97316' : '#f59e0b';
    const riskText  = isClean ? '✅ Clean Page' : total > 5 ? '🔴 High Risk' : total > 2 ? '🟡 Suspicious' : '🟡 Found';

    const card = document.createElement('div');
    card.id = '__ds_card';
    Object.assign(card.style, {
      position:       'fixed',
      bottom:         '20px',
      right:          '16px',
      zIndex:         '2147483647',
      background:     '#0d0d1af0',
      border:         `1px solid ${riskColor}55`,
      backdropFilter: 'blur(12px)',
      borderRadius:   '14px',
      padding:        '13px 15px',
      width:          '250px',
      boxShadow:      `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${riskColor}22`,
      fontFamily:     'system-ui,-apple-system,sans-serif',
      fontSize:       '13px',
      color:          '#e2e8f0',
      transition:     'opacity .2s',
      userSelect:     'none',
    });

    card.innerHTML = `
      <div id="__ds_drag_handle" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${isClean ? '0' : '10px'};cursor:grab">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:20px">🛡️</span>
          <div>
            <div style="font-size:12px;font-weight:800;color:#fca5a5">DarkShield</div>
            <div style="font-size:10px;color:#6b7280;margin-top:1px">
              <span style="color:${riskColor};font-weight:700">${isClean ? 'No dark patterns' : total + ' patterns'}</span> · ${riskText}
            </div>
          </div>
        </div>
        <button id="__ds_close" style="background:#1f2937;border:none;color:#6b7280;
          width:22px;height:22px;border-radius:6px;cursor:pointer;font-size:12px;
          display:flex;align-items:center;justify-content:center;flex-shrink:0">✕</button>
      </div>

      ${isClean ? `
        <div style="margin-top:10px;padding:10px;background:#14532d22;border-radius:9px;border:1px solid #4ade8033;text-align:center">
          <div style="font-size:11px;color:#4ade80">This page looks safe 👍</div>
          <div style="font-size:10px;color:#374151;margin-top:3px">No manipulative patterns detected</div>
        </div>
      ` : `
        <div style="display:flex;flex-direction:column;gap:5px;margin-bottom:11px">
          ${topPatterns.map(p => `
            <div style="display:flex;align-items:center;justify-content:space-between;
              background:#111827;border-radius:7px;padding:6px 9px;border:1px solid ${p.color}33">
              <span style="font-size:12px">${p.emoji} <span style="color:#e2e8f0;font-weight:600">${p.label}</span></span>
              <span style="background:${p.color}22;color:${p.color};font-size:10px;font-weight:700;
                padding:2px 7px;border-radius:99px;border:1px solid ${p.color}44">${p.found.length}</span>
            </div>
          `).join('')}
        </div>
        <div style="display:flex;gap:6px">
          <button id="__ds_scroll" style="flex:1;background:linear-gradient(135deg,${riskColor},${riskColor}99);
            color:#fff;border:none;border-radius:8px;padding:8px;font-size:11px;font-weight:700;
            cursor:pointer;font-family:inherit">🔍 Show me</button>
          <button id="__ds_dismiss" style="background:#111827;border:1px solid #1f2937;color:#6b7280;
            border-radius:8px;padding:8px 10px;font-size:11px;cursor:pointer;font-family:inherit">Ignore</button>
        </div>
      `}
    `;

    document.body.appendChild(card);

    // ── Draggable (drag handle = header row) ──────────────────────
    let dragging = false, ox = 0, oy = 0;
    const handle = document.getElementById('__ds_drag_handle');
    handle.addEventListener('mousedown', e => {
      if (e.target.id === '__ds_close') return;
      dragging = true;
      ox = e.clientX - card.getBoundingClientRect().left;
      oy = e.clientY - card.getBoundingClientRect().top;
      handle.style.cursor = 'grabbing';
      card.style.transition = 'none';
      card.style.bottom = 'auto';
      card.style.right  = 'auto';
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      card.style.left = (e.clientX - ox) + 'px';
      card.style.top  = (e.clientY - oy) + 'px';
    });
    document.addEventListener('mouseup', () => {
      dragging = false;
      handle.style.cursor = 'grab';
      card.style.transition = 'opacity .2s';
    });

    // Close
    document.getElementById('__ds_close').onclick = () => {
      _cardDismissed = true;
      card.style.opacity = '0';
      setTimeout(() => card.remove(), 200);
    };

    if (!isClean) {
      // Ignore
      document.getElementById('__ds_dismiss').onclick = () => {
        _cardDismissed = true;
        card.style.opacity = '0';
        setTimeout(() => card.remove(), 200);
      };

      // Show me — scroll to first detected element
      document.getElementById('__ds_scroll').onclick = () => {
        const firstKey = Object.keys(results).find(k => results[k].found?.length > 0);
        if (firstKey) scrollToPattern(firstKey);
        card.style.opacity = '0';
        setTimeout(() => card.remove(), 200);
      };
    }

    // Auto-minimize after 5s (clean) or 8s (patterns found)
    const miniDelay = isClean ? 5000 : 8000;
    setTimeout(() => {
      if (!document.body.contains(card)) return;
      card.style.opacity = '0';
      setTimeout(() => {
        if (!document.body.contains(card)) return;
        card.innerHTML = `
          <div style="display:flex;align-items:center;gap:7px;cursor:pointer" id="__ds_expand">
            <span style="font-size:16px">🛡️</span>
            <span style="font-size:11px;font-weight:700;color:${riskColor}">${isClean ? '✅ Safe' : total + ' patterns'}</span>
          </div>
        `;
        Object.assign(card.style, {
          padding:  '8px 12px',
          width:    'auto',
          opacity:  '1',
        });
        document.getElementById('__ds_expand').onclick = () => {
          _cardDismissed = false;
          card.remove();
          showFloatingCard(total, results);
        };
      }, 200);
    }, miniDelay);
  }

  // ── HIGHLIGHTS ────────────────────────────────────────────────────
  function showHighlights(results) {
    if (!results) return;
    clearHighlights();
    for (const [key, p] of Object.entries(results)) {
      if (!p.found?.length) continue;
      p.found.forEach(({ el, reason }) => {
        if (!el || !document.body.contains(el)) return;
        const pos = window.getComputedStyle(el).position;
        if (pos === 'static') el.style.position = 'relative';
        el.classList.add('__ds_highlight');
        el.style.setProperty('--ds-color', p.color);
        let tip = null;
        el.addEventListener('mouseenter', () => {
          tip = document.createElement('div');
          tip.className = '__ds_tooltip';
          tip.style.setProperty('--ds-color', p.color);
          tip.innerHTML = `<strong style="color:${p.color}">${p.emoji} ${p.label}</strong><br>${p.desc}<br><small style="color:#6b7280;margin-top:3px;display:block">${reason||''}</small>`;
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
    if (typeof PATTERNS !== 'undefined' && PATTERNS[key]) {
      const found = PATTERNS[key].detect();
      if (found[0]?.el) {
        found[0].el.scrollIntoView({ behavior:'smooth', block:'center' });
        const orig = found[0].el.style.outline;
        found[0].el.style.outline = `3px solid ${PATTERNS[key].color}`;
        setTimeout(() => { if(found[0].el) found[0].el.style.outline = orig; }, 2000);
      }
    }
  }

  // Re-scan on SPA navigation
  let _lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== _lastUrl) {
      _lastUrl = location.href;
      setTimeout(() => { _cardDismissed = false; clearHighlights(); removeFloatingCard(); scan(); }, 1000);
    }
  }).observe(document.body, { childList:true, subtree:false });

})();
