// DarkShield — popup.js
// @codingbreaker

let _tabId = null;

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  _tabId = tab?.id;
  if (!_tabId) return;

  // Load toggle state
  chrome.storage.sync.get('dsEnabled', ({ dsEnabled }) => {
    const enabled = dsEnabled !== false;
    document.getElementById('toggle-enabled').checked = enabled;
  });

  // Get scan results from content script
  chrome.tabs.sendMessage(_tabId, { action: 'getScan' }, (resp) => {
    if (chrome.runtime.lastError || !resp) {
      // Content script not loaded yet — try injecting
      chrome.scripting.executeScript({ target: { tabId: _tabId }, files: ['detectors.js', 'content.js'] }, () => {
        setTimeout(() => {
          chrome.tabs.sendMessage(_tabId, { action: 'getScan' }, (r) => render(r));
        }, 800);
      });
      return;
    }
    render(resp);
  });
});

// Toggle highlights on/off
document.getElementById('toggle-enabled').addEventListener('change', (e) => {
  const enabled = e.target.checked;
  chrome.storage.sync.set({ dsEnabled: enabled });
  if (_tabId) chrome.tabs.sendMessage(_tabId, { action: 'toggle', enabled });
});

function render(data) {
  const el = document.getElementById('main-content');
  if (!data || data.total === 0) {
    el.innerHTML = `
      <div class="safe-state">
        <div class="safe-icon">✅</div>
        <div style="color:#4ade80;font-weight:700;margin-bottom:4px">No dark patterns found!</div>
        <div>This page looks clean.</div>
      </div>
      <div class="actions">
        <button class="btn btn-rescan" id="btn-rescan">🔍 Rescan</button>
      </div>
    `;
    bindRescan();
    return;
  }

  const { results, total } = data;
  const url = data.url ? new URL(data.url).hostname : 'this page';

  const statusClass = total > 5 ? 'status-danger' : total > 2 ? 'status-warn' : 'status-warn';
  const statusText  = total > 5 ? '🔴 High Risk' : total > 2 ? '🟡 Suspicious' : '🟡 Some Issues';
  const barColor    = total > 5 ? '#ef4444' : total > 2 ? '#f97316' : '#f59e0b';
  const barPct      = Math.min(100, total * 8);

  let patternHTML = '';
  for (const [key, p] of Object.entries(results)) {
    const hasFindings = p.count > 0;
    const itemsHTML = p.items?.length
      ? p.items.map(i => `<div class="pattern-item-text">→ ${i}</div>`).join('')
      : '';

    patternHTML += `
      <div class="pattern-item ${hasFindings ? 'has-findings' : ''}"
           style="--p-color:${p.color}" data-key="${key}">
        <div class="pattern-header">
          <div class="pattern-left">
            <span class="pattern-emoji">${p.emoji}</span>
            <span class="pattern-name">${p.label}</span>
          </div>
          <span class="pattern-count ${hasFindings ? '' : 'zero'}">${hasFindings ? p.count + ' found' : '✓ clean'}</span>
        </div>
        <div class="pattern-desc">${p.desc}</div>
        ${hasFindings && itemsHTML ? `<div class="pattern-items" id="items-${key}">${itemsHTML}</div>` : ''}
      </div>
    `;
  }

  el.innerHTML = `
    <div class="score-card">
      <div class="score-row">
        <div>
          <div class="score-num" style="color:${barColor}">${total}</div>
          <div class="score-label">dark patterns found</div>
        </div>
        <span class="score-status ${statusClass}">${statusText}</span>
      </div>
      <div class="bar"><div class="bar-fill" style="width:${barPct}%;background:${barColor}"></div></div>
      <div class="site-url">🌐 ${url}</div>
    </div>

    <div class="section-title">Detected Patterns</div>
    <div class="pattern-list">${patternHTML}</div>

    <div class="actions">
      <button class="btn btn-rescan" id="btn-rescan">🔍 Rescan</button>
      <button class="btn btn-clear" id="btn-clear">Hide Highlights</button>
    </div>
  `;

  bindRescan();

  // Expand/collapse pattern items on click
  document.querySelectorAll('.pattern-item[data-key]').forEach(item => {
    item.addEventListener('click', () => {
      const key = item.dataset.key;
      const itemsEl = document.getElementById(`items-${key}`);
      if (itemsEl) itemsEl.classList.toggle('open');

      // Scroll to first match on page
      if (_tabId) chrome.tabs.sendMessage(_tabId, { action: 'highlight', key });
    });
  });

  document.getElementById('btn-clear')?.addEventListener('click', () => {
    if (_tabId) chrome.tabs.sendMessage(_tabId, { action: 'toggle', enabled: false });
    document.getElementById('toggle-enabled').checked = false;
    chrome.storage.sync.set({ dsEnabled: false });
  });
}

function bindRescan() {
  document.getElementById('btn-rescan')?.addEventListener('click', () => {
    document.getElementById('main-content').innerHTML = `
      <div style="padding:24px;text-align:center;color:#4b5563;font-size:12px">🔍 Scanning…</div>
    `;
    if (_tabId) {
      chrome.tabs.sendMessage(_tabId, { action: 'rescan' }, () => {
        setTimeout(() => {
          chrome.tabs.sendMessage(_tabId, { action: 'getScan' }, render);
        }, 1200);
      });
    }
  });
}
