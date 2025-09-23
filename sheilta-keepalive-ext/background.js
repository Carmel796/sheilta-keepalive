const ALARM_NAME = "sheiltaKeepAlive";
const SHEILTA_REFRESH_URL =
  "https://sheilta.apps.openu.ac.il/pls/dmyopt2/session_guard?p_refresh=1";

// Defaults
let enabled = true;
let intervalMin = 5;

// --- Restore persisted state on startup / install ---
chrome.storage.local.get(
  { sheiltaEnabled: enabled, sheiltaIntervalMin: intervalMin },
  ({ sheiltaEnabled, sheiltaIntervalMin }) => {
    enabled = !!sheiltaEnabled;
    intervalMin = Number(sheiltaIntervalMin) || intervalMin;
    applyEnabledState(enabled);
  }
);

// Ensure alarm exists (used at startup/install and when interval changes)
function startAlarm() {
  chrome.alarms.clear(ALARM_NAME, () => {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: intervalMin });
    console.log("[KeepAlive] Alarm @", intervalMin, "min");
  });
}

function stopAlarm() {
  chrome.alarms.clear(ALARM_NAME, () => {
    console.log("[KeepAlive] Alarm cleared");
  });
}

function applyEnabledState(on) {
  if (on) startAlarm();
  else stopAlarm();
}

// On extension install/startup, ensure the correct alarm is scheduled
chrome.runtime.onInstalled.addListener(() => applyEnabledState(enabled));
chrome.runtime.onStartup.addListener(() => applyEnabledState(enabled));

// Utility: detect open Sheilta tab
function hasSheiltaTab(cb) {
  chrome.tabs.query({}, (tabs) => {
    cb(
      tabs.some((t) =>
        /^https:\/\/sheilta\.apps\.openu\.ac\.il/i.test(t.url || "")
      )
    );
  });
}

// The actual keepalive action
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== ALARM_NAME) return;
  if (!enabled) {
    console.log("[KeepAlive] Disabled. Skip.");
    return;
  }

  hasSheiltaTab((has) => {
    if (!has) {
      console.log("[KeepAlive] No Sheilta tab. Skip.");
      return;
    }

    fetch(SHEILTA_REFRESH_URL, { method: "GET", credentials: "include" })
      .then((res) => {
        if (res.ok) console.log("[KeepAlive] refresh OK:", res.status);
        else console.warn("[KeepAlive] refresh non-OK:", res.status);
      })
      .catch((err) => console.error("[KeepAlive] refresh error:", err));
  });
});

// --- Message API for popup ---
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  // Read current status
  if (msg && msg.getStatus) {
    sendResponse({ enabled, intervalMin });
    return true;
  }

  // Toggle enabled
  if (msg && typeof msg.toggle === "boolean") {
    const next = !!msg.toggle;
    if (next !== enabled) {
      enabled = next;
      chrome.storage.local.set({ sheiltaEnabled: enabled }, () => {
        applyEnabledState(enabled);
        sendResponse({ enabled, intervalMin });
      });
      return true; // async
    }
    sendResponse({ enabled, intervalMin });
    return true;
  }

  // Update interval (minutes > 0). Fractions are allowed by chrome.alarms.
  if (msg && typeof msg.setIntervalMin === "number") {
    const v = Number(msg.setIntervalMin);
    if (!Number.isFinite(v) || v < 0.1) {
      sendResponse({ ok: false, error: "Invalid interval" });
      return true;
    }
    intervalMin = v;
    chrome.storage.local.set({ sheiltaIntervalMin: intervalMin }, () => {
      if (enabled) startAlarm(); // reapply with new period
      sendResponse({ ok: true, enabled, intervalMin });
    });
    return true; // async
  }
});
