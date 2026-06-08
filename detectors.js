// detectors.js — Dark Pattern Detection
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
      const urgencyRegex = /\b(only\s+\d+\s+(left|remaining|in\s+stock|rooms?|seats?|tickets?)|hurry[!]?|limited\s+time|ends?\s+(soon|in|today|tonight)|offer\s+expir|last\s+chance|act\s+now|don'?t\s+miss|selling\s+fast|almost\s+gone|going\s+fast|few\s+(left|rooms?|seats?)|low\s+stock|filling\s+fast|high\s+demand|book\s+fast|grab\s+(it|now)|price\s+(rise|hike|change)|left\s+at\s+this\s+price|rooms?\s+left|seats?\s+left|\d+\s+rooms?\s+left|\d+\s+seats?\s+left|sirf\s+\d+\s+(bacha?|left)|jaldi\s+karo|limited\s+stock)\b/gi;

      document.querySelectorAll('p,span,small,strong,b,label,div').forEach(el => {
        if (el.children.length > 2) return;
        if (el.closest('[class*="rating"],[class*="review"],[class*="spec"],[class*="feature"],[class*="description"],[class*="about"],[class*="footer"],[class*="nav"],[class*="menu"]')) return;
        const text = el.innerText?.trim();
        if (!text || text.length > 150 || text.length < 5) return;
        if (urgencyRegex.test(text)) {
          urgencyRegex.lastIndex = 0;
          found.push({ el, reason: `"${text.slice(0, 70)}"` });
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
      // CSS class/id based
      const timerSels = [
        '[class*="countdown"]','[class*="count-down"]','[class*="countDown"]',
        '[class*="timer"]','[class*="Timer"]','[id*="countdown"]','[id*="timer"]',
        '[data-countdown]','[data-timer]','[class*="offerTimer"]','[class*="deal-timer"]',
        '[class*="flash-timer"]','[class*="expire"]','[class*="clock"]',
      ];
      timerSels.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          if (el.offsetWidth > 0 && el.offsetHeight > 0)
            found.push({ el, reason: 'Countdown timer element detected' });
        });
      });

      // HH:MM:SS pattern in small text nodes
      document.querySelectorAll('span,div,p,b,strong').forEach(el => {
        if (el.children.length > 2) return;
        const text = el.innerText?.trim() || '';
        if (/\b\d{1,2}:\d{2}:\d{2}\b/.test(text) && text.length < 40)
          found.push({ el, reason: `Timer: "${text}"` });
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
      const socialRegex = /\b(\d+\s+(people|others|shoppers|users|guests?|travellers?|customers?)\s+(are\s+)?(currently\s+)?(viewing|watching|looking\s+at|checking|booking)\s*(this|it)?|(\d+)\s+(bought|purchased|ordered|booked)\s+(today|in\s+the\s+last\s+\d+\s+(hour|min)|this\s+hour|recently|tonight)|\d+\s+in\s+(their\s+)?cart(s)?|\d+\s+people\s+booked|booked\s+\d+\s+times?|(\d+)\s+views?\s+today)\b/gi;

      document.querySelectorAll('p,span,small,div').forEach(el => {
        if (el.children.length > 1) return;
        if (el.closest('[class*="rating"],[class*="review"],[class*="star"],[class*="score"],[class*="footer"],[class*="nav"]')) return;
        const text = el.innerText?.trim();
        if (!text || text.length > 120 || text.length < 10) return;
        if (socialRegex.test(text)) {
          socialRegex.lastIndex = 0;
          found.push({ el, reason: `"${text.slice(0, 60)}"` });
        }
      });
      return found;
    }
  },

  // ── 4. PRE-CHECKED BOXES ─────────────────────────────────────────
  preChecked: {
    label: 'Pre-Checked Boxes',
    emoji: '☑️',
    color: '#ec4899',
    desc: 'Boxes checked by default — often hides extra charges',
    detect() {
      const found = [];
      const chargeWords = /insurance|protect|warranty|donation|contribute|subscribe|newsletter|offer|promo|add.?on|extra|premium|secure|cover|guard|assist|waiver|cancellation|upgrade/i;

      document.querySelectorAll('input[type="checkbox"]:checked').forEach(el => {
        const label = el.closest('label') || document.querySelector(`label[for="${el.id}"]`);
        const text  = label?.innerText || el.name || el.id || el.getAttribute('aria-label') || '';
        if (chargeWords.test(text) || text.length < 2) {
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
      const shameRegex = /no,?\s+(i\s+)?(don'?t|hate|never|prefer\s+not|rather\s+not|don'?t\s+want|miss\s+out)|i\s+(don'?t\s+care|hate\s+saving|prefer\s+paying\s+more|give\s+up|don'?t\s+want\s+to\s+save|want\s+to\s+pay\s+more)/i;

      document.querySelectorAll('a,button,span,label').forEach(el => {
        const text = el.innerText?.trim();
        if (!text || text.length > 120) return;
        if (shameRegex.test(text))
          found.push({ el, reason: `"${text.slice(0, 80)}"` });
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
      const subRegex = /auto.?renew|recurring\s+(charge|billing|payment)|cancel\s+anytime|free\s+trial.{0,40}then|after\s+(trial|period).{0,40}(₹|\$|\d)|billed\s+(monthly|annually|yearly|every)|per\s+(month|year|week)\s+after|subscription\s+renew/gi;

      document.querySelectorAll('p,span,small,label,li,div').forEach(el => {
        if (el.children.length > 1) return;
        if (el.closest('[class*="review"],[class*="rating"],[class*="footer"],[class*="nav"],[class*="menu"]')) return;
        const text = el.innerText?.trim();
        if (!text || text.length > 350 || text.length < 15) return;
        if (subRegex.test(text)) {
          subRegex.lastIndex = 0;
          found.push({ el, reason: `"${text.slice(0, 80)}"` });
        }
      });
      return found;
    }
  },

  // ── 7. FINE PRINT ────────────────────────────────────────────────
  finePrint: {
    label: 'Fine Print / Hidden Info',
    emoji: '🔍',
    color: '#6b7280',
    desc: 'Important info hidden in tiny text',
    detect() {
      const found = [];
      const important = /terms|condition|charges?|fee|₹|\$|refund|cancel|policy|automatically|renew|binding|agree|consent/i;

      document.querySelectorAll('p,span,div,small,li').forEach(el => {
        if (el.children.length > 0) return;
        const style = window.getComputedStyle(el);
        const size  = parseFloat(style.fontSize);
        const text  = el.innerText?.trim();
        if (size < 11 && size > 0 && text?.length > 20 && important.test(text))
          found.push({ el, reason: `Tiny text (${size}px): "${text.slice(0, 60)}"` });
      });
      return found;
    }
  },

  // ── 8. ROACH MOTEL (Easy in, hard out) ──────────────────────────
  roachMotel: {
    label: 'Roach Motel',
    emoji: '🪤',
    color: '#84cc16',
    desc: 'Easy to sign up, very hard to cancel or unsubscribe',
    detect() {
      const found = [];
      // Hard cancel buttons — buried deep or styled to be invisible
      document.querySelectorAll('a,button').forEach(el => {
        const text = el.innerText?.trim().toLowerCase();
        if (!text) return;
        const isCancel = /\b(cancel|unsubscribe|delete\s+account|close\s+account|deactivate)\b/.test(text);
        if (!isCancel) return;
        const style = window.getComputedStyle(el);
        const size  = parseFloat(style.fontSize);
        const color = style.color;
        // Flag if cancel button is tiny or nearly invisible
        if (size < 11 || color === 'rgb(255, 255, 255)' || style.opacity < 0.4)
          found.push({ el, reason: `Hard to see cancel button: "${text}"` });
      });
      return found;
    }
  },

  // ── 9. MISLEADING ADS ────────────────────────────────────────────
  misleadingAds: {
    label: 'Disguised Ads',
    emoji: '🎭',
    color: '#f43f5e',
    desc: 'Ads styled to look like real content or results',
    detect() {
      const found = [];
      // Sponsored / Ad labels that are very small or hidden
      document.querySelectorAll('span,div,label,small').forEach(el => {
        if (el.children.length > 0) return;
        const text = el.innerText?.trim().toLowerCase();
        if (!/^(ad|ads|sponsored|advertisement|promoted|paid)$/.test(text)) return;
        const style = window.getComputedStyle(el);
        const size  = parseFloat(style.fontSize);
        if (size < 10 || parseFloat(style.opacity) < 0.5)
          found.push({ el, reason: `Hidden ad label: "${text}" (${size}px)` });
      });
      return found;
    }
  },
};

// Run all detectors
function runAllDetectors() {
  const results = {};
  let total = 0;
  for (const [key, p] of Object.entries(PATTERNS)) {
    try {
      const found = deduplicateEls(p.detect());
      results[key] = { ...p, found };
      total += found.length;
    } catch(_) {
      results[key] = { ...p, found: [] };
    }
  }
  return { results, total };
}

function deduplicateEls(arr) {
  const seen = new WeakSet();
  return arr.filter(({ el }) => {
    if (!el || seen.has(el)) return false;
    seen.add(el); return true;
  });
}
