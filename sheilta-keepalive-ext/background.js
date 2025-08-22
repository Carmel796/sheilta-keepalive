const KEEPALIVE_INTERVAL_MINUTES = 5; // 0.2 for testing
const SHEILTA_REFRESH_URL =
  "https://sheilta.apps.openu.ac.il/pls/dmyopt2/session_guard?p_refresh=1";

let keepaliveEnabled = true;

chrome.storage.local.get(
  { enabled: true },
  (d) => (keepaliveEnabled = d.enabled)
);

function ensureAlarm() {
  chrome.alarms.clear("sheiltaKeepAlive", () => {
    chrome.alarms.create("sheiltaKeepAlive", {
      periodInMinutes: KEEPALIVE_INTERVAL_MINUTES,
    });
    console.log("[KeepAlive] Alarm @", KEEPALIVE_INTERVAL_MINUTES, "min");
  });
}
chrome.runtime.onInstalled.addListener(ensureAlarm);
chrome.runtime.onStartup.addListener(ensureAlarm);

chrome.runtime.onMessage.addListener((msg, _s, sendResponse) => {
  if (msg.getStatus) return sendResponse({ enabled: keepaliveEnabled });
  if (typeof msg.toggle === "boolean") {
    keepaliveEnabled = msg.toggle;
    chrome.storage.local.set({ enabled: keepaliveEnabled }, () =>
      sendResponse({ enabled: keepaliveEnabled })
    );
    return true;
  }
});

function hasSheiltaTab(cb) {
  chrome.tabs.query({}, (tabs) => {
    cb(
      tabs.some((t) =>
        /^https:\/\/sheilta\.apps\.openu\.ac\.il/i.test(t.url || "")
      )
    );
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== "sheiltaKeepAlive") return;
  if (!keepaliveEnabled) {
    console.log("[KeepAlive] Disabled. Skip.");
    return;
  }

  hasSheiltaTab((has) => {
    if (!has) {
      console.log("[KeepAlive] No Sheilta tab. Skip.");
      return;
    }

    fetch(SHEILTA_REFRESH_URL, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (res.ok) console.log("[KeepAlive] refresh OK:", res.status);
        else console.warn("[KeepAlive] refresh non‑OK:", res.status);
      })
      .catch((err) => console.error("[KeepAlive] refresh error:", err));
  });
});
