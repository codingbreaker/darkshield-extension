// detectors.js — Dark Pattern Detection (Behavior-Based + Text)
// Works on ANY website without knowing its specific wording
// @codingbreaker

const PATTERNS = {

  // ── 1. FAKE COUNTDOWN TIMER (Behavior: detects reset) ────────────
  fakeTimer: {
    label: 'Fake Countdown Timer',
    emoji: '🕐',
    color: '#f97316',
    desc: 'Timer resets on reload — pure fake urgency',
    detect() {
      const found = [];

      // A) Class/ID based timer elements
      const timerSels = [
        '[class*="countdown"],[class*="count-down"],[class*="countDown"]',
        '[class*="timer"],[class*="Timer"],[id*="countdown"],[id*="timer"]',
        '[data-countdown],[data-timer],[class*="offerTimer"],[class*="deal-timer"]',
        '[class*="flash-timer"],[class*="expire"],[class*="clock"],[class*="tick"]',
      ];
      timerSels.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          if (el.offsetWidth > 0 && el.offsetHeight > 0)
            found.push({ el, reason: 'Countdown timer element' });
        });
      });

      // B) Detect HH:MM:SS / MM:SS text pattern
      document.querySelectorAll('span,div,b,strong,p').forEach(el => {
        if (el.children.length > 2) return;
        const text = el.innerText?.trim() || '';
        if (/\b\d{1,2}:\d{2}(:\d{2})?\b/.test(text) && text.length < 30)
          found.push({ el, reason: `Timer text: "${text}"` });
      });

      // C) Behavior: compare timer value now vs 3s ago (reset = fake)
      const KEY = '__ds_timer_check';
      try {
        const prev = JSON.parse(sessionStorage.getItem(KEY) || '{}');
        const now  = {};
        document.querySelectorAll('span,div,b').forEach(el => {
          const t = el.innerText?.trim();
          if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) {
            const id = el.className + el.id + el.getBoundingClientRect().top;
            now[id] = t;
            if (prev[id] && prev[id] < t) // time INCREASED = reset
              found.push({ el, reason: `Timer reset detected! Was ${prev[id]}, now ${t}` });
          }
        });
        sessionStorage.setItem(KEY, JSON.stringify(now));
      } catch(_) {}

      return found;
    }
  },

  // ── 2. FAKE DISCOUNT / INFLATED MRP ─────────────────────────────
  fakeDiscount: {
    label: 'Fake / Inflated Discount',
    emoji: '💸',
    color: '#ef4444',
    desc: 'Original price inflated to make discount look huge',
    detect() {
      const found = [];
      // Find strikethrough prices
      document.querySelectorAll('del,s,[style*="line-through"],[class*="original"],[class*="mrp"],[class*="was-price"],[class*="old-price"],[class*="strike"]').forEach(el => {
        const text    = el.innerText?.trim();
        const origNum = parseFloat(text.replace(/[^0-9.]/g, ''));
        if (!origNum || origNum < 100) return;

        // Find nearest current price
        const parent  = el.closest('[class*="price"],[class*="product"],[class*="card"],[class*="item"]') || el.parentElement?.parentElement;
        if (!parent) return;
        const priceEls = parent.querySelectorAll('[class*="price"],[class*="amount"],[class*="cost"]');
        let minPrice = Infinity;
        priceEls.forEach(pe => {
          const n = parseFloat(pe.innerText?.replace(/[^0-9.]/g, '') || '0');
          if (n > 0 && n < origNum) minPrice = Math.min(minPrice, n);
        });

        if (minPrice < Infinity) {
          const discount = Math.round((1 - minPrice / origNum) * 100);
          if (discount > 75) // > 75% discount = likely fake MRP
            found.push({ el, reason: `${discount}% off — likely inflated MRP (₹${origNum} → ₹${minPrice})` });
        }
      });
      return found;
    }
  },

  // ── 3. PRE-CHECKED BOXES ─────────────────────────────────────────
  preChecked: {
    label: 'Pre-Checked Boxes',
    emoji: '☑️',
    color: '#ec4899',
    desc: 'Boxes checked by default — often hides extra charges',
    detect() {
      const found = [];
      const chargeWords = /insurance|protect|warranty|donation|contribute|subscribe|newsletter|offer|promo|add.?on|extra|premium|secure|cover|guard|assist|waiver|cancellation|upgrade|tip|convenience/i;
      document.querySelectorAll('input[type="checkbox"]:checked').forEach(el => {
        const label = el.closest('label') || document.querySelector(`label[for="${el.id}"]`);
        const text  = label?.innerText || el.name || el.id || el.getAttribute('aria-label') || '';
        if (chargeWords.test(text) || !text.trim())
          found.push({ el: label || el, reason: `Pre-checked: "${text.slice(0, 60) || 'unnamed checkbox'}"` });
      });
      return found;
    }
  },

  // ── 4. MISDIRECTION BUTTONS (visual camouflage) ──────────────────
  misdirection: {
    label: 'Misdirection Buttons',
    emoji: '🎯',
    color: '#06b6d4',
    desc: 'Accept button is big & bright, decline is tiny & gray',
    detect() {
      const found = [];
      const declineWords = /\b(no\s+thanks?|skip|decline|cancel|close|maybe\s+later|not\s+now|remind\s+me|no,\s+i|dismiss)\b/i;
      const acceptWords  = /\b(yes|accept|agree|get|start|subscribe|join|continue|proceed|confirm|ok|allow)\b/i;

      // Find button pairs in same container
      document.querySelectorAll('div,section,form,footer').forEach(container => {
        const btns = Array.from(container.querySelectorAll('button,a[role="button"],[class*="btn"],[class*="button"]'))
          .filter(b => b.offsetWidth > 0 && b.offsetHeight > 0);
        if (btns.length < 2) return;

        let acceptBtn = null, declineBtn = null;
        btns.forEach(b => {
          const t = b.innerText?.trim() || '';
          if (acceptWords.test(t))  acceptBtn  = b;
          if (declineWords.test(t)) declineBtn = b;
        });

        if (!acceptBtn || !declineBtn) return;

        const aSize = parseFloat(window.getComputedStyle(acceptBtn).fontSize);
        const dSize = parseFloat(window.getComputedStyle(declineBtn).fontSize);
        const aW    = acceptBtn.offsetWidth;
        const dW    = declineBtn.offsetWidth;

        // Decline button is significantly smaller
        if (aW > dW * 2.5 || aSize > dSize + 3) {
          found.push({ el: declineBtn, reason: `Decline button hidden: "${declineBtn.innerText?.trim()}" (${dW}px vs accept ${aW}px)` });
        }
      });
      return found;
    }
  },

  // ── 5. FORCED OVERLAY / POPUP ────────────────────────────────────
  forcedOverlay: {
    label: 'Forced Popup / Overlay',
    emoji: '🚫',
    color: '#a855f7',
    desc: 'Popup blocks content and is hard to close',
    detect() {
      const found = [];
      const vw = window.innerWidth, vh = window.innerHeight;

      document.querySelectorAll('*').forEach(el => {
        if (!el.offsetWidth) return;
        const style = window.getComputedStyle(el);
        if (!['fixed','sticky'].includes(style.position)) return;
        if (parseFloat(style.zIndex) < 100) return;

        const rect = el.getBoundingClientRect();
        const area = rect.width * rect.height;
        const viewArea = vw * vh;

        // Covers > 40% of viewport
        if (area / viewArea < 0.4) return;
        if (style.display === 'none' || style.visibility === 'hidden') return;

        // Check if it has a close button
        const hasClose = el.querySelector('[class*="close"],[class*="dismiss"],[aria-label*="close" i],[aria-label*="dismiss" i]');
        if (!hasClose)
          found.push({ el, reason: `Overlay covers ${Math.round(area/viewArea*100)}% of screen with no close button` });
      });
      return found;
    }
  },

  // ── 6. HIDDEN SUBSCRIPTION TEXT ──────────────────────────────────
  hiddenSub: {
    label: 'Hidden Subscription',
    emoji: '🔄',
    color: '#f59e0b',
    desc: 'Auto-renewal buried where you won\'t notice',
    detect() {
      const found = [];
      const subRegex = /auto.?renew|turn\s+off.{0,20}auto|recurring\s+(charge|billing|payment)|cancel\s+anytime|cancel\s+(your\s+)?(prime|subscription|membership|plan)|free\s+trial.{0,60}(then|after|₹|\$)|after\s+(your\s+)?(trial|free\s+period|30.day).{0,60}(₹|\$|\d)|billed\s+(monthly|annually|yearly|every)|per\s+(month|year|week)\s+after|subscription\s+renew|charged\s+after|just\s+₹.{0,20}(year|month|week)|only\s+₹.{0,20}(year|month)|automatically\s+(charged|billed|renewed)|will\s+be\s+(charged|billed)\s+after|converts?\s+to\s+(paid|premium)|unless\s+(you\s+)?(cancel|unsubscribe)|renews?\s+at\s+(₹|\$|\d)|membership\s+(fee|charge|renew)|plan\s+(auto|renew|extend)|trial\s+ends?.{0,30}(₹|\$|\d+)|introductory\s+(price|offer|rate)/gi;

      // Check leaf text nodes (no children) — catches inline text
      document.querySelectorAll('p,span,small,label,li').forEach(el => {
        if (el.children.length > 1) return;
        if (el.closest('[class*="review"],[class*="rating"],[class*="nav"],[class*="header"],[class*="footer"],[class*="faq"],[class*="help"],[class*="accordion"],[class*="support"],[class*="question"],[class*="answer"]')) return;
        const text = el.innerText?.trim();
        if (!text || text.length > 500 || text.length < 12) return;
        if (subRegex.test(text)) { subRegex.lastIndex = 0; found.push({ el, reason: `"${text.slice(0, 80)}"` }); }
      });

      // Also check larger containers — catches Amazon-style blocks
      document.querySelectorAll('div,section').forEach(el => {
        if (el.children.length > 6) return; // skip big wrappers
        if (el.closest('[class*="nav"],[class*="header"],[class*="footer"],[class*="review"],[class*="faq"],[class*="help"],[class*="accordion"],[class*="support"],[class*="question"],[class*="answer"]')) return;
        // Skip if text looks like a Q&A (starts with "Can I", "How", "What", "Yes,", "No,")
        const t0 = el.innerText?.trim() || '';
        if (/^(can\s+i|how\s+(do|can|to)|what\s+(is|are|happens)|yes,|no,\s+you)/i.test(t0)) return;
        const text = el.innerText?.trim();
        if (!text || text.length > 300 || text.length < 20) return;
        if (subRegex.test(text)) { subRegex.lastIndex = 0; found.push({ el, reason: `"${text.slice(0, 80)}"` }); }
      });

      return found;
    }
  },

  // ── 7. FINE PRINT ────────────────────────────────────────────────
  finePrint: {
    label: 'Fine Print / Hidden Info',
    emoji: '🔍',
    color: '#6b7280',
    desc: 'Important terms hidden in tiny unreadable text',
    detect() {
      const found = [];
      const important = /terms|condition|charges?|fee|₹|\$|refund|cancel|policy|automatically|renew|binding|agree|consent|applicable/i;

      document.querySelectorAll('p,span,div,small,li').forEach(el => {
        if (el.children.length > 0) return;
        const style = window.getComputedStyle(el);
        const size  = parseFloat(style.fontSize);
        const text  = el.innerText?.trim();
        if (size < 13 && size > 0 && text?.length > 20 && important.test(text))
          found.push({ el, reason: `${size}px text: "${text.slice(0, 60)}"` });
      });
      return found;
    }
  },

  // ── 8. FAKE URGENCY TEXT ─────────────────────────────────────────
  fakeUrgency: {
    label: 'Fake Urgency',
    emoji: '⏰',
    color: '#dc2626',
    desc: 'Pressure tactics to rush your decision',
    detect() {
      const found = [];
      // E-commerce + Travel + Jobs + Food + News — all site types
      const urgencyRegex = /\b(only\s+\d+\s+(left|remaining|rooms?|seats?|tickets?|spots?|openings?)|hurry[!]?|limited\s+time|ends?\s+(soon|today|tonight|midnight)|last\s+chance|act\s+now|selling\s+fast|almost\s+gone|filling\s+fast|high\s+demand|book\s+fast|\d+\s+(rooms?|seats?|tickets?|spots?)\s+left|sirf\s+\d+\s+bacha?|jaldi\s+karo|urgently\s+hiring|urgent(ly)?(\s+required)?|apply\s+(before|fast|now|immediately)|positions?\s+(filling|closing)\s+fast|deadline.{0,15}today|offer\s+expires?|deal\s+ends?|price\s+(goes?\s+up|rising|increase)|grab\s+(it\s+)?(now|fast|before)|don.t\s+miss|this\s+(won.t|will\s+not)\s+last|\d+\s+people?\s+(applied|viewed|watching|looking)\s+(in\s+the\s+)?(last\s+)?\d+\s+(hour|min|day)|be\s+the\s+first|early\s+access|flash\s+(sale|deal)|today\s+only|midnight\s+deal)\b/gi;

      document.querySelectorAll('p,span,small,strong,b,label,div,h1,h2,h3,h4').forEach(el => {
        if (el.children.length > 2) return;
        if (el.closest('[class*="rating"],[class*="review"],[class*="spec"],[class*="description"],[class*="footer"],[class*="nav"],[class*="menu"],[class*="sidebar"],[class*="job-title"],[class*="jobtitle"],[class*="title"],[class*="listing"],[class*="card-title"]')) return;
        const text = el.innerText?.trim();
        if (!text || text.length > 200 || text.length < 5) return;
        // Skip job titles and benefit/feature descriptions
        if (/urgent\s+(hiring|opening|requirement|vacancy)/i.test(text) && text.length > 40) return;
        // Skip benefit lists — "early access to X", "access to X events/deals"
        if (/^early\s+access\s+to\b/i.test(text)) return;
        if (/\baccess\s+to\s+(exclusive|shopping|prime|special|early)/i.test(text) && !/only\s+\d+/i.test(text)) return;
        if (urgencyRegex.test(text)) {
          urgencyRegex.lastIndex = 0;
          found.push({ el, reason: `"${text.slice(0, 70)}"` });
        }
      });
      return found;
    }
  },

  // ── 9. CONFIRM SHAMING ───────────────────────────────────────────
  confirmShame: {
    label: 'Confirm Shaming',
    emoji: '😔',
    color: '#7c3aed',
    desc: 'No/Cancel written to make you feel bad',
    detect() {
      const found = [];
      const shameRegex = /no,?\s+(i\s+)?(don'?t|hate|never|prefer\s+not|rather\s+not|don'?t\s+want|miss\s+out)|i\s+(don'?t\s+care|hate\s+saving|prefer\s+paying\s+more|give\s+up|want\s+to\s+pay\s+more)|no\s+thanks?,?\s+i.{0,30}(miss|lose|pay|risk|stay\s+broke|remain)/i;
      document.querySelectorAll('a,button,span,label').forEach(el => {
        const text = el.innerText?.trim();
        if (!text || text.length > 120) return;
        if (shameRegex.test(text))
          found.push({ el, reason: `"${text.slice(0, 80)}"` });
      });
      return found;
    }
  },

  // ── 10. FAKE SOCIAL PROOF ────────────────────────────────────────
  fakeSocialProof: {
    label: 'Fake Social Proof',
    emoji: '👥',
    color: '#0ea5e9',
    desc: 'Fake viewer counts and activity to pressure you',
    detect() {
      const found = [];
      // Explicit viewer/activity counts — all site types (jobs, travel, e-com, food)
      const socialRegex = /\b(\d+\s+(people?|users?|candidates?|applicants?|others?|visitors?)\s+(are\s+)?(viewing|watching|looking\s+at|applied|applied\s+for|checking|on\s+this\s+page|in\s+your\s+area)|\d+\s+(applied|viewed|saved|shortlisted)\s+(today|in\s+\d+\s+(hour|min|day)s?|this\s+week)|currently\s+\d+\s+(people?|users?)\s+(viewing|watching|on\s+this)|\d+\s+(job\s+seekers?|recruiters?)\s+(viewed|visited|applied)|in\s+your\s+city\s+\d+\s+(applied|are\s+applying)|trending\s+in\s+your\s+area)\b/gi;

      document.querySelectorAll('p,span,small,strong,b,div,li').forEach(el => {
        if (el.children.length > 2) return;
        if (el.closest('[class*="review"],[class*="rating"],[class*="comment"],[class*="testimonial"],[class*="nav"],[class*="footer"],[class*="header"]')) return;
        const text = el.innerText?.trim();
        if (!text || text.length > 150 || text.length < 8) return;
        if (socialRegex.test(text)) {
          socialRegex.lastIndex = 0;
          found.push({ el, reason: `"${text.slice(0, 70)}"` });
        }
      });
      return found;
    }
  },

  // ── 11. ROACH MOTEL (hard to cancel/leave) ───────────────────────
  roachMotel: {
    label: 'Roach Motel',
    emoji: '🪤',
    color: '#84cc16',
    desc: 'Easy to sign up, impossible to cancel',
    detect() {
      const found = [];
      // Signs: cancel buried in FAQ, no cancel button visible, call-to-cancel
      const roachRegex = /to\s+(cancel|unsubscribe|delete\s+(your\s+)?account|close\s+(your\s+)?account).{0,60}(call|email|contact|write|visit|chat\s+with|speak\s+to|reach\s+out)|cancel(l?ation)?\s+(is\s+)?(not|only)\s+(available|possible|accepted)\s+(by|via|through)\s+(phone|call|email)|cannot\s+(cancel|unsubscribe)\s+online|cancell?ation\s+fee|early\s+(exit|termination)\s+(fee|charge|penalty)/gi;

      document.querySelectorAll('p,span,small,li,div').forEach(el => {
        if (el.children.length > 2) return;
        if (el.closest('[class*="nav"],[class*="header"],[class*="footer"],[class*="menu"]')) return;
        const text = el.innerText?.trim();
        if (!text || text.length > 400 || text.length < 15) return;
        if (roachRegex.test(text)) {
          roachRegex.lastIndex = 0;
          found.push({ el, reason: `"${text.slice(0, 80)}"` });
        }
      });
      return found;
    }
  },

  // ── 12. HIDDEN FEES (price changes at checkout) ──────────────────
  hiddenFees: {
    label: 'Hidden Fees',
    emoji: '💰',
    color: '#f43f5e',
    desc: 'Extra charges added silently at checkout',
    detect() {
      const found = [];
      const feeRegex = /\b(convenience\s+fee|platform\s+fee|processing\s+fee|service\s+charge|handling\s+(fee|charge)|gst\s+extra|taxes?\s+(extra|not\s+included|applicable)|charges?\s+extra|additional\s+(fee|charge|tax)|booking\s+fee|gateway\s+fee|surcharge|resort\s+fee|facility\s+fee|environmental\s+levy)\b/gi;

      document.querySelectorAll('p,span,small,li,div,td,th').forEach(el => {
        if (el.children.length > 2) return;
        if (el.closest('[class*="nav"],[class*="header"],[class*="footer"],[class*="menu"]')) return;
        const text = el.innerText?.trim();
        if (!text || text.length > 200 || text.length < 5) return;
        if (feeRegex.test(text)) {
          feeRegex.lastIndex = 0;
          found.push({ el, reason: `"${text.slice(0, 70)}"` });
        }
      });
      return found;
    }
  },
};

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
  const seenEls  = new WeakSet();
  const seenText = new Set();
  return arr.filter(({ el, reason }) => {
    if (!el || seenEls.has(el)) return false;
    // Deduplicate by normalized text — same text in nested elements = one result
    const text = (el.innerText?.trim() || '').slice(0, 100).toLowerCase().replace(/\s+/g, ' ');
    if (text.length > 5 && seenText.has(text)) return false;
    seenEls.add(el);
    if (text.length > 5) seenText.add(text);
    return true;
  });
}
