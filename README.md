# 🛡️ DarkShield — Dark Pattern Detector

> **See the web as it really is. Detects manipulative tricks websites use to fool you.**

Built by [@codingbreaker](https://github.com/codingbreaker)

---

## The Problem

Every day, websites manipulate you into:
- Buying faster with **fake "Only 2 left!"** warnings
- Paying extra with **pre-checked insurance/donation boxes**
- Forgetting to cancel with **hidden auto-renewal text**
- Feeling bad with **"No thanks, I hate saving money"** buttons
- Getting hit with **surprise fees at checkout**

**DarkShield catches all of this — automatically, on every website.**

---

## What It Detects (12 Pattern Types)

| Pattern | Example | Sites |
|---------|---------|-------|
| ⏰ **Fake Urgency** | "Hurry! Only 3 left!", "Urgently Hiring" | Amazon, Flipkart, Naukri |
| 🕐 **Fake Countdown** | Timer that resets on page reload | Swiggy, Zomato, travel sites |
| 💸 **Fake Discount** | 80% off — but MRP was inflated | Ajio, Myntra, Meesho |
| 👥 **Fake Social Proof** | "12 people viewing this right now" | Booking.com, hotels |
| ☑️ **Pre-Checked Boxes** | Insurance, donation added by default | Amazon, MakeMyTrip |
| 😔 **Confirm Shaming** | "No thanks, I prefer paying more" | Subscription sites |
| 🔄 **Hidden Subscription** | Free trial → auto-charge in fine print | Netflix, apps, streaming |
| 🔍 **Fine Print** | Important charges in tiny unreadable text | Any checkout page |
| 🚫 **Forced Overlay** | Popup covers 40%+ screen, no close button | News sites, e-commerce |
| 🎯 **Misdirection** | Accept button huge, decline button tiny | Cookie banners, popups |
| 🪤 **Roach Motel** | Easy to subscribe, impossible to cancel | SaaS, gyms, telecom |
| 💰 **Hidden Fees** | Convenience fee surprise at checkout | Zomato, travel, ticketing |

---

## Features

- ✅ **Auto floating card** — appears on every page load, no click needed
- ✅ **Works on ALL websites** — jobs, travel, shopping, streaming, news
- ✅ **Colored highlights** on detected elements — hover to see exactly why
- ✅ **Score card** — Clean / Suspicious / High Risk rating
- ✅ **Badge on icon** — see count at a glance
- ✅ **Draggable card** — move it anywhere, won't block content
- ✅ **Toggle highlights** on/off without losing scan results
- ✅ **Rescan button** — for SPAs that load content dynamically
- ✅ **SPA navigation** — auto re-scans on URL change (React, Next.js, etc.)
- ✅ **Zero tracking** — 100% local, no data sent anywhere

---

## Install (Chrome / Edge / Brave)

1. [Download this repo](https://github.com/codingbreaker/darkshield-extension/archive/refs/heads/main.zip) and unzip
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked**
5. Select the `darkshield-extension` folder
6. Done — visit any website and the card appears automatically

---

## How It Works

```
Page loads
    ↓
DarkShield runs 12 detectors on the DOM
    ↓
Floating card appears — Clean ✅ or patterns found ⚠️
    ↓
Suspicious elements get colored highlight + tooltip on hover
    ↓
Badge shows total count (🔴 red = high risk)
    ↓
Click "Show me" → jumps to flagged element
    ↓
Card minimizes to pill — tap to expand again
```

---

## Test It On

| Site | What You'll Find |
|------|-----------------|
| `amazon.in/prime` | Countdown timer, fine print, hidden subscription |
| `makemytrip.com` | Pre-checked insurance, urgency, hidden fees |
| `booking.com` | Fake social proof, "X rooms left" urgency |
| `ajio.com/sale` | Inflated MRP, fake discounts |
| `naukri.com` | Urgency in job listings |
| Any subscription site | Hidden auto-renewal, confirm shaming, roach motel |

---

## Tech Stack

- **Manifest V3** Chrome Extension
- **Content Scripts** (Isolated World) — chrome API access
- **Detectors** — 12 independent pattern detection strategies
- **MutationObserver** — SPA navigation detection (no reload needed)
- **Regex + DOM + Visual analysis** — behavior-based, not just text matching
- **Zero dependencies** — pure vanilla JS, no npm, no frameworks
- **Background Service Worker** — updates badge count per tab

---

## Detection Methods

DarkShield uses **behavior-based** detection, not just keyword matching:

- **Timer Reset Detection** — stores timer values in sessionStorage, flags if value increases on reload
- **Visual Size Analysis** — compares accept vs decline button dimensions
- **Price Math** — calculates actual % discount, flags >75% as likely inflated MRP
- **Viewport Coverage** — detects overlays covering >40% of screen
- **Text + Context** — ignores FAQ answers, job titles, benefit descriptions (reduces false positives)

---

## Privacy

- ❌ No data collection
- ❌ No external API calls
- ❌ No account required
- ✅ Everything runs locally in your browser
- ✅ No tracking, no analytics
- ✅ Open source — read every line

---

## License

MIT © [@codingbreaker](https://github.com/codingbreaker)
