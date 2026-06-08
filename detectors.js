// detectors.js — All dark pattern detection logic
// @codingbreaker

const PATTERNS = {

  // ── 1. FAKE URGENCY ──────────────────────────────────────────────
  fakeUrgency: {
    label: 'Fake Urgency',
    emoji: '⏰',
    color: '#ef4444',
    desc: 'Pressure tactics to make you buy fast',
    detect() {
      const found = [];
      const urgencyRegex = /\b(only\s+\d+\s+(left|remaining|in\s+stock)|hurry|limited\s+time|ends?\s+(soon|in|today)|offer\s+expire|last\s+chance|act\s+now|don'?t\s+miss|selling\s+fast|almost\s+gone|going\s+fast|few\s+left|low\s+stock)\b/gi;

      document.querySelectorAll('p,span,div,h1,h2,h3,h4,strong,b,label').forEach(el => {
        if (el.children.length > 3) return; // skip containers
        const text = el.innerText?.trim();
        if (!text || text.length > 200) return;
        if (urgencyRegex.test(text)) {
          urgencyRegex.lastIndex = 0;
          found.push({ el, reason: `"${text.slice(0, 60)}"` });
        }
      });
      return found;
    }
  },

  // ── 2. FAKE COUNTDOWN TIMER ──────────────────────────────────────
  fakeTimer: {
    label: 'Fake Countdown Timer',
    emoji: '🕐',
    color: '#f97316',
    desc: 'Timer resets on reload — creates false urgency',
    detect() {
      const found = [];
      const timerSels = [
        '[class*="countdown"]', '[class*="count-down"]', '[class*="timer"]',
        '[id*="countdown"]', '[id*="timer"]', '[data-countdown]',
        '[class*="offerTimer"]', '[class*="deal-timer"]', '[class*="flash-timer"]'
      ];
      timerSels.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          if (el.offsetWidth > 0 && el.offsetHeight > 0) {
            found.push({ el, reason: 'Countdown timer detected' });
          }
        });
      });

      // Also detect HH:MM:SS patterns in text
      document.querySelectorAll('span,div,p').forEach(el => {
        if (el.children.length > 2) return;
        const text = el.innerText?.trim() || '';
        if (/\b\d{1,2}:\d{2}:\d{2}\b/.test(text) && text.length < 30) {
          found.push({ el, reason: `Timer: "${text}"` });
        }
      });
      return found;
    }
  },

  // ── 3. FAKE SOCIAL PROOF ─────────────────────────────────────────
  fakeSocial: {
    label: 'Fake Social Proof',
    emoji: '👥',
    color: '#a855f7',
    desc: 'Fake viewer/buyer counts to pressure you',
    detect() {
      const found = [];
      const socialRegex = /\b(\d+\s+(people|others|customers|shoppers|users)\s+(are\s+)?(viewing|watching|looking|checking)|(\d+)\s+(bought|purchased|ordered)\s+(today|this\s+hour|in\s+last|recently)|trending|bestseller|popular\s+choice|\d+\s+in\s+cart)\b/gi;

      document.querySelectorAll('p,span,div,small').forEach(el => {
        if (el.children.length > 2) return;
        const text = el.innerText?.trim();
        if (!text || text.length > 150) return;
        if (socialRegex.test(text)) {
          socialRegex.lastIndex = 0;
          found.push({ el, reason: `"${text.slice(0, 60)}"` });
        }
      });
      return found;
    }
  },

  // ── 4. PRE-CHECKED BOXES (Hidden charges) ───────────────────────
  preChecked: {
    label: 'Pre-Checked Boxes',
    emoji: '☑️',
    color: '#ec4899',
    desc: 'Boxes checked by default — often hides extra charges',
    detect() {
      const found = [];
      const chargeWords = /insurance|protect|warranty|donation|contribute|subscribe|newsletter|offer|promo|add-on|addon|extra|premium|secure|cover/i;

      document.querySelectorAll('input[type="checkbox"]:checked').forEach(el => {
        const label = el.closest('label') || document.querySelector(`label[for="${el.id}"]`);
        const text  = label?.innerText || el.name || el.id || '';
        if (chargeWords.test(text) || text.length < 3) {
          found.push({ el: label || el, reason: `Pre-checked: "${text.slice(0, 60) || 'checkbox'}"` });
        }
      });
      return found;
    }
  },

  // ── 5. CONFIRM SHAMING ───────────────────────────────────────────
  confirmShame: {
    label: 'Confirm Shaming',
    emoji: '😔',
    color: '#06b6d4',
    desc: 'No/Cancel buttons written to make you feel bad',
    detect() {
      const found = [];
      const shameRegex = /no,?\s+(i\s+)?(don'?t|hate|never|prefer\s+not|rather\s+not|don'?t\s+want|miss\s+out)|i\s+(don'?t\s+care|hate\s+saving|prefer\s+paying\s+more|give\s+up|don'?t\s+want\s+to\s+save)/i;

      document.querySelectorAll('a,button,span').forEach(el => {
        const text = el.innerText?.trim();
        if (!text || text.length > 120) return;
        if (shameRegex.test(text)) {
          found.push({ el, reason: `"${text.slice(0, 80)}"` });
        }
      });
      return found;
    }
  },

  // ── 6. HIDDEN SUBSCRIPTION ──────────────────────────────────────
  hiddenSub: {
    label: 'Hidden Subscription',
    emoji: '🔄',
    color: '#f59e0b',
    desc: 'Free trial or one-time price hides auto-renewal',
    detect() {
      const found = [];
      const subRegex = /auto.?renew|recurring\s+(charge|billing|payment)|cancel\s+anytime|free\s+trial.{0,30}then|after\s+(trial|period).{0,30}₹|\$\d+.{0,20}per\s+(month|year|week)|billed\s+(monthly|annually|yearly)/gi;

      document.querySelectorAll('p,span,div,small,label,li').forEach(el => {
        if (el.children.length > 2) return;
        const text = el.innerText?.trim();
        if (!text || text.length > 300) return;
        if (subRegex.test(text)) {
          subRegex.lastIndex = 0;
          found.push({ el, reason: `"${text.slice(0, 80)}"` });
        }
      });
      return found;
    }
  },

  // ── 7. MISDIRECTION / FINE PRINT ────────────────────────────────
  finePrint: {
    label: 'Fine Print / Hidden Info',
    emoji: '🔍',
    color: '#6b7280',
    desc: 'Important info hidden in tiny text',
    detect() {
      const found = [];
      document.querySelectorAll('p,span,div,small').forEach(el => {
        if (el.children.length > 0) return;
        const style   = window.getComputedStyle(el);
        const size    = parseFloat(style.fontSize);
        const text    = el.innerText?.trim();
        const important = /terms|condition|charges?|fee|₹|\$|refund|cancel|policy|automatically|renew/i;
        if (size < 11 && size > 0 && text?.length > 20 && important.test(text)) {
          found.push({ el, reason: `Tiny text (${size}px): "${text.slice(0, 60)}"` });
        }
      });
      return found;
    }
  },
};

// Run all detectors, return grouped results
function runAllDetectors() {
  const results = {};
  let total = 0;
  for (const [key, p] of Object.entries(PATTERNS)) {
    try {
      const found = p.detect();
      const unique = deduplicateEls(found);
      results[key] = { ...p, found: unique };
      total += unique.length;
    } catch(_) {
      results[key] = { ...p, found: [] };
    }
  }
  return { results, total };
}

// Remove duplicate elements
function deduplicateEls(arr) {
  const seen = new WeakSet();
  return arr.filter(({ el }) => {
    if (!el || seen.has(el)) return false;
    seen.add(el);
    return true;
  });
}
