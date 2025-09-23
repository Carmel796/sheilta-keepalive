# Sheilta Keepalive – Extension Flow

This document shows how the popup and background scripts communicate and how the alarm keeps the session alive.

---

## 1. Initialization (when popup opens)

```text
[Popup UI]               [Background]
    |  DOMContentLoaded      |
    |----------------------->|  chrome.runtime.onMessage
    | getStatus              |
    |                        |  Read {sheiltaEnabled, sheiltaIntervalMin}
    |                        |  from chrome.storage.local
    |                        |  (apply defaults if missing)
    |                        |  sendResponse({ enabled, intervalMin })
    |<-----------------------|
    | Update UI:
    |  - checkbox.checked = enabled
    |  - setVisual(enabled)
    |  - setIntervalLabel(intervalMin)
    v
 (Idle, ready)
```

## 2. Toggle ON/OFF (user flips the switch)

```text
[Popup UI]                          [Background]
    |  change event (checkbox)          |
    |---------------------------------->|  onMessage { toggle: next }
    |                                   |  if (next !== enabled) {
    |                                   |    enabled = next
    |                                   |    chrome.storage.local.set({ sheiltaEnabled: enabled })
    |                                   |    applyEnabledState(enabled)
    |                                   |      -> startAlarm() / stopAlarm()
    |                                   |  }
    |                                   |  sendResponse({ enabled, intervalMin })
    |<----------------------------------|
    | setVisual(enabled)                |
    v
```

## 3. Set Interval (user clicks “SET”)

```text
[Popup UI]                                       [Background]
    |  click SET                                     |
    |  Validate input (>= 0.1, finite)               |
    |----------------------------------------------->|  onMessage { setIntervalMin: v }
    |                                                |  if invalid: sendResponse({ ok:false, error:"Invalid interval" })
    |                                                |  else:
    |                                                |    intervalMin = v
    |                                                |    chrome.storage.local.set({ sheiltaIntervalMin: v }, () => {
    |                                                |      if (enabled) startAlarm()  // re-schedule with new period
    |                                                |      sendResponse({ ok:true, enabled, intervalMin })
    |                                                |    })
    |<-----------------------------------------------|
    | if ok:
    |   setIntervalLabel(intervalMin)
    |   clearError() / clear input
    | else:
    |   showError(error)
    v
```

## 4. Alarm tick (keepalive work)

```text
[Chrome Alarms]      [Background]                               [Browser Tabs] / Sheilta
       |                |
       |--------------->|  onAlarm(name === "sheiltaKeepAlive")
                        |  if (!enabled) return
                        |  hasSheiltaTab((has) => {
                        |    if (!has) return
                        |    fetch(SHEILTA_REFRESH_URL, { credentials: "include" })
                        |      .then(res => log OK/non-OK)
                        |      .catch(err => log error)
                        |  })
```

---
