# TubeIntent 🎯 — The Mindful YouTube Blocker

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-00f5d4?style=flat-square&logo=googlechrome&logoColor=black)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Microsoft Edge](https://img.shields.io/badge/Edge_Add--ons-v1.0.0-0078d7?style=flat-square&logo=microsoftedge&logoColor=white)](https://microsoftedge.microsoft.com/addons)
[![License: MIT](https://img.shields.io/badge/License-MIT-38bdf8?style=flat-square)](LICENSE)
[![Zero Telemetry](https://img.shields.io/badge/Privacy-Zero_Tracking-00f5d4?style=flat-square)](PRIVACY.md)

> **Reclaim your focus from the YouTube algorithm.**  
> TubeIntent replaces the addictive infinite homepage feed with a zen search bar, completely eradicates Shorts, and eliminates distracting recommendations and comments.

---

## ⚡ Features

- **🧘 Zen Mode:** Wipes the addictive infinite home feed and replaces it with a clean, focused search bar and quick access to your playlists.
- **⚡ Total Shorts Eradication:** Purges Shorts shelves, carousels, and channel tabs across search and home feeds, automatically redirecting any direct `/shorts/` links to the standard desktop player (`/watch?v=`).
- **🚫 Hide Recommendations:** Erases the "Up Next" sidebar on watch pages, centering and expanding the main video player for deep work.
- **💬 Hide Comments:** Completely removes video comment sections to eliminate doomscrolling flame wars.
- **⏸️ Instant Master Pause:** Need to unwind? Toggle master pause in the popup to instantly suspend all filters and restore full, normal YouTube without refreshing the page.
- **🛡️ 100% Client-Side:** Strict Trusted Types compliance, zero external dependencies, zero analytics, and minimum Manifest V3 permissions.

---

## 🚀 Installation & Local Development

### Microsoft Edge / Google Chrome (Developer Mode)

1. Clone or download this repository:
   ```bash
   git clone https://github.com/TubeIntent/TubeIntent.git
   cd TubeIntent
   ```
2. Open your browser and navigate to:
   - **Edge:** `edge://extensions`
   - **Chrome:** `chrome://extensions`
3. Toggle on **Developer mode** in the left sidebar or top right corner.
4. Click **Load unpacked** and select the `TubeIntent` folder.
5. Open [YouTube](https://www.youtube.com) and experience distraction-free browsing!

---

## 📂 Project Structure

```text
TubeIntent/
├── manifest.json        # Manifest V3 extension configuration
├── background.js       # Lightweight service worker for Shorts routing
├── content.js          # DOM & SPA navigation engine with MutationObserver
├── styles.css          # Declarative CSS overrides & Zen mode layout
├── popup.html          # Futuristic OLED glassmorphic extension popup
├── popup.js            # Live auto-sync popup controller (0ms tab broadcast)
├── icons/              # App icons (16px, 32px, 48px, 128px)
├── landing/            # High-converting SEO-optimized landing page
│   ├── index.html      # Self-contained landing page (HTML/CSS/JS)
│   └── icons/          # Landing page brand assets
├── TubeIntent-v1.0.0.zip# Production-ready package for Edge Add-ons Store
├── PRIVACY.md          # Zero-telemetry privacy policy
└── README.md           # Documentation
```

---

## 🔒 Security & Privacy Architecture

- **Zero Remote Code Execution:** TubeIntent does not load remote scripts, CDNs, or external stylesheets. All assets run strictly locally.
- **Trusted Types Compliant:** Every injected DOM element is created via `document.createElement` and `textContent`. Zero `innerHTML` or `eval`.
- **Minimal Permissions:** Only requests `storage` and `webNavigation` scoped to `youtube.com`.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.
