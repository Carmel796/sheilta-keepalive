document.addEventListener("DOMContentLoaded", () => {
  const checkbox = document.getElementById("toggle");
  const stateText = document.getElementById("stateText");
  const toggleWrap = document.getElementById("toggleWrap");
  const intervalInput = document.getElementById("intervalInput");
  const setBtn = document.getElementById("setIntervalBtn");
  const currentInterval = document.getElementById("currentInterval");
  const errorMsg = document.getElementById("errorMsg");

  const setVisual = (on) => {
    toggleWrap.classList.toggle("on", !!on);
    stateText.textContent = on ? "Enabled" : "Disabled";
  };

  const setIntervalLabel = (val) => {
    const pretty = (Math.round(val * 10) / 10).toString();
    currentInterval.textContent = pretty;
    intervalInput.placeholder = `Current: ${pretty} min`;
  };

  function showError(text) {
    if (!errorMsg) return;
    errorMsg.textContent = text;
    errorMsg.style.display = "block";
  }

  function clearError() {
    if (!errorMsg) return;
    errorMsg.textContent = "";
    errorMsg.style.display = "none";
  }

  // 1) Initialize FIRST (no listeners yet)
  chrome.runtime.sendMessage({ getStatus: true }, (res) => {
    if (chrome.runtime.lastError) return;
    const on = !!(res && res.enabled);
    const minutes = Number(res && res.intervalMin) || 5;

    checkbox.checked = on;
    setVisual(on);
    setIntervalLabel(minutes);
  });

  // 2) Attach toggle listener AFTER init
  checkbox.addEventListener("change", () => {
    const next = checkbox.checked;
    chrome.runtime.sendMessage({ toggle: next }, (r) => {
      if (chrome.runtime.lastError) {
        // revert UI if background errored
        checkbox.checked = !next;
        setVisual(!next);
        return;
      }
      setVisual(!!(r && r.enabled));
    });
  });

  // 3) Set interval (minutes)
  setBtn.addEventListener("click", () => {
    clearError();

    const raw = intervalInput.value.trim();
    const v = Number(raw);

    // match background validation: must be a finite number >= 0.1
    if (!Number.isFinite(v) || v < 0.1) {
      showError("Please enter a number ≥ 0.1 minutes.");
      intervalInput.focus();
      intervalInput.select();
      return;
    }

    chrome.runtime.sendMessage({ setIntervalMin: v }, (r) => {
      if (chrome.runtime.lastError || !r) {
        showError("Background error. Try again.");
        return;
      }
      if (r.ok === false) {
        showError(r.error || "Invalid interval.");
        return;
      }

      // success
      setIntervalLabel(r.intervalMin);
      intervalInput.value = "";
      clearError();
    });
  });
});
