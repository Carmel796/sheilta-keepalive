# Sheilta Keepalive (Chrome Extension)

Keep your [Sheilta – Open University](https://sheilta.apps.openu.ac.il) session alive automatically.

This extension periodically sends a refresh request in the background so you don’t get logged out while the tab is open.

---

## ✨ Features

- ✅ Toggle keepalive on/off from the popup
- ✅ Configurable interval (in minutes, supports fractions like `0.5`)
- ✅ State is persisted (survives browser restart/reload)
- ✅ Automatically refreshes only if a Sheilta tab is open
- ✅ Light/Dark theme popup with modern UI

---

## 📸 Popup UI

- Toggle switch to enable/disable keepalive
- Input field + **SET** button to configure the refresh interval
- Inline error message for invalid intervals
- Current interval is displayed for reference

---

## 🛠 Technical Overview

- **Popup (`popup.html` + `popup.js`)**  
  UI for enabling/disabling and configuring the interval.  
  Communicates with background via `chrome.runtime.sendMessage`.

- **Background (`background.js`)**  
  Stores state in `chrome.storage.local` (`sheiltaEnabled`, `sheiltaIntervalMin`).  
  Manages a `chrome.alarms` task that periodically fetches:

  ```
  https://sheilta.apps.openu.ac.il/pls/dmyopt2/session_guard?p_refresh=1
  ```

  Only runs if:
  - keepalive is enabled, **and**
  - a Sheilta tab is open.

---

## 📂 Project Structure

```
sheilta-keepalive-extension/
├── manifest.json        # Chrome extension manifest (MV3)
├── background.js        # Background service worker
├── popup.html           # Popup UI markup
├── popup.js             # Popup UI logic
├── icons/               # Extension icons (optional)
└── docs/
    └── extension-flow.md # Flow diagrams (popup ↔ background)
```

---

## ⚙️ Installation (Development Mode)

1. Clone or download this repo.
2. Open **Chrome** and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the project folder.
5. You should see **Sheilta Keepalive** appear in the extension list.

---

## 🚀 Usage

1. Open the popup from the extensions toolbar.
2. Toggle **Keepalive Enabled** on/off.
3. Enter a refresh interval (e.g., `5`, `0.5`, etc.) and click **SET**.
4. As long as a Sheilta tab is open, the extension will keep your session refreshed.

---

## 🧩 Messaging Flow

See [`docs/extension-flow.md`](./docs/extension-flow.md) for full diagrams of how the popup and background communicate.

---

## ⚠️ Notes

- Minimum interval is `0.1` minutes (~6 seconds).  
- Chrome may clamp very small alarm intervals depending on platform. For stability, `≥ 1` minute is recommended in production.  
- This extension is a personal project and not officially affiliated with the Open University.

---

## 📄 License

MIT License © 2025
