document.addEventListener("DOMContentLoaded", () => {
  const checkbox = document.getElementById("toggle");

  // Ask background for current status
  chrome.runtime.sendMessage({ getStatus: true }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn(
        "[Popup] getStatus error:",
        chrome.runtime.lastError.message
      );
      return;
    }
    checkbox.checked = !!(response && response.enabled);
  });

  checkbox.addEventListener("change", () => {
    chrome.runtime.sendMessage({ toggle: checkbox.checked }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("[Popup] toggle error:", chrome.runtime.lastError.message);
        return;
      }
      console.log("[Popup] Keepalive toggled:", response && response.enabled);
    });
  });
});
