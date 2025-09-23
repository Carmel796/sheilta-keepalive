document.addEventListener("DOMContentLoaded", () => {
  const checkbox = document.getElementById("toggle");
  const stateText = document.getElementById("stateText");
  const toggleWrap = document.getElementById("toggleWrap");
  const card = document.getElementById("card");

  const setVisual = (enabled, withPulse = false) => {
    toggleWrap.classList.toggle("on", !!enabled);
    stateText.textContent = enabled ? "Enabled" : "Disabled";
    if (withPulse) card.classList.add("pulse");
    // remove pulse class after animation
    setTimeout(() => card.classList.remove("pulse"), 400);
  };

  // Ask background for current status
  chrome.runtime.sendMessage({ getStatus: true }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn(
        "[Popup] getStatus error:",
        chrome.runtime.lastError.message
      );
      return;
    }
    const enabled = !!(response && response.enabled);
    checkbox.checked = enabled;
    setVisual(enabled);
  });

  // Toggle behavior (no feature change, just visuals)
  checkbox.addEventListener("change", () => {
    const next = checkbox.checked;
    chrome.runtime.sendMessage({ toggle: next }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("[Popup] toggle error:", chrome.runtime.lastError.message);
        // revert UI if background errored
        checkbox.checked = !next;
        setVisual(!next);
        return;
      }
      const enabled = !!(response && response.enabled);
      setVisual(enabled, true);
      console.log("[Popup] Keepalive toggled:", enabled);
    });
  });
});
