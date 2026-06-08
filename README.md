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

**DarkShield catches all of this — automatically.**

---

## What It Detects

| Pattern | Example | Sites |
|---------|---------|-------|
| ⏰ **Fake Urgency** | "Hurry! Only 3 left!", "Limited time offer" | Amazon, Flipkart, Myntra |
| 🕐 **Fake Countdown** | Timer that resets on page reload | Swiggy, Zomato, travel sites |
| 👥 **Fake Social Proof** | "12 people viewing this right now" | Hotels, e-commerce |
| ☑️ **Pre-Checked Boxes** | Insurance, donation added by default | Amazon, MakeMyTrip |
| 😔 **Confirm Shaming** | "No thanks, I prefer paying more" | Subscription sites |
| 🔄 **Hidden Subscription** | Free trial → auto-charge buried in fine print | Apps, streaming |
| 🔍 **Fine Print** | Important charges in tiny unreadable text | Any checkout page |

---

## Features

- ✅ **Works on ALL websites** — not just specific sites
- ✅ **Red highlight** on detected elements — hover to see why it's flagged
- ✅ **Score card** — total count + risk level (Clean / Suspicious / High Risk)
- ✅ **Badge on icon** — see count at a glance without opening popup
- ✅ **Toggle highlights** on/off without losing scan results
- ✅ **Rescan button** — for single-page apps that load content dynamically
- ✅ **Zero tracking** — no data sent anywhere, 100% local

---

## Install (Chrome / Edge / Brave)

1. [Download this repo](https://github.com/codingbreaker/darkshield-extension/archive/refs/heads/main.zip) and unzip
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked**
5. Select the `darkshield-extension` folder
6. Done — visit any shopping site and watch the badge light up

---

## How It Works

```
Page loads
    ↓
DarkShield runs 7 detectors on the DOM
    ↓
Suspicious elements get red highlight + tooltip
    ↓
Badge shows total count (🔴 red = high risk)
    ↓
Click extension icon → full breakdown
    ↓
Click any pattern → jumps to that element on page
```

---

## Tech Stack

- **Manifest V3** Chrome Extension
- **Content Scripts** — run on every page
- **MutationObserver** — detects SPA navigation (no page reload needed)
- **Regex + DOM analysis** — 7 independent detection strategies
- **Zero dependencies** — pure vanilla JS, no npm, no frameworks
- **Background Service Worker** — updates badge count per tab

---

## Test It On

| Site | What You'll Find |
|------|-----------------|
| Amazon.in | Fake urgency, countdown timers, pre-checked add-ons |
| Flipkart | "Only X left", social proof, fine print |
| Swiggy / Zomato | Countdown timers, hidden charges |
| MakeMyTrip | Pre-checked insurance, urgency text |
| Any subscription site | Hidden auto-renewal, confirm shaming |

---

## Privacy

- ❌ No data collection
- ❌ No external API calls
- ❌ No account required
- ✅ Everything runs locally in your browser
- ✅ No tracking, no analytics

---

## License

MIT © [@codingbreaker](https://github.com/codingbreaker)
