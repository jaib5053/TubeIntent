/**
 * ============================================================================
 * TubeIntent — Modern Futuristic Popup Controller
 * ============================================================================
 *
 * ARCHITECTURAL SPECIFICATION:
 *   - Zero manual "Save" buttons: All settings sync live to chrome.storage.local
 *     and directly dispatch to open YouTube tabs for instant 0ms response.
 *   - Bulletproof DOM Lifecycle: Uses defensive getters/setters guarded against
 *     any null references or asynchronous race conditions.
 *   - Strict Trusted Types compliance (zero innerHTML).
 * ============================================================================
 */

(function () {
  "use strict";

  function getEl(id) {
    return document.getElementById(id);
  }

  function setChecked(id, value) {
    const el = getEl(id);
    if (el) {
      el.checked = Boolean(value);
    }
  }

  function isChecked(id) {
    const el = getEl(id);
    return Boolean(el && el.checked);
  }

  function updateStatusUI(isPaused) {
    const statusText = getEl("status-text");
    const pauseDesc = getEl("pause-desc");

    if (isPaused) {
      document.body.classList.add("is-paused");
      if (statusText) statusText.textContent = "PAUSED";
      if (pauseDesc) pauseDesc.textContent = "Extension paused — Normal YouTube restored";
    } else {
      document.body.classList.remove("is-paused");
      if (statusText) statusText.textContent = "ACTIVE";
      if (pauseDesc) pauseDesc.textContent = "Temporarily restore normal YouTube";
    }
  }

  function flashSaveIndicator() {
    const saveStatus = getEl("save-status");
    if (!saveStatus) return;
    saveStatus.style.opacity = "1";
    saveStatus.style.color = "#00f5d4";
    setTimeout(() => {
      saveStatus.style.color = "";
    }, 400);
  }

  function broadcastToYouTubeTabs(settings) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!chrome.runtime.lastError && tabs && tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "syncSettings", settings }).catch(() => {
          // Tab may not have injected content script yet
        });
      }
    });
  }

  function saveCurrentState() {
    const isPaused = isChecked("toggle-pause");

    const updated = {
      isPaused: isPaused,
      zenModeEnabled: isChecked("toggle-zen"),
      blockShorts: isChecked("toggle-shorts"),
      hideRecommendations: isChecked("toggle-recommendations"),
      hideComments: isChecked("toggle-comments"),
    };

    updateStatusUI(isPaused);

    // Save persistently to storage
    chrome.storage.local.set(updated, () => {
      if (!chrome.runtime.lastError) {
        flashSaveIndicator();
      }
    });

    // Broadcast immediately to active tab
    broadcastToYouTubeTabs(updated);
  }

  function init() {
    // 1. Load initial state
    chrome.storage.local.get(
      {
        isPaused: false,
        zenModeEnabled: true,
        blockShorts: true,
        hideRecommendations: true,
        hideComments: true,
      },
      (settings) => {
        if (chrome.runtime.lastError) return;

        setChecked("toggle-pause", settings.isPaused);
        setChecked("toggle-zen", settings.zenModeEnabled);
        setChecked("toggle-shorts", settings.blockShorts);
        setChecked("toggle-recommendations", settings.hideRecommendations);
        setChecked("toggle-comments", settings.hideComments);

        updateStatusUI(settings.isPaused);
      }
    );

    // 2. Attach auto-sync listeners
    const toggleIds = [
      "toggle-pause",
      "toggle-zen",
      "toggle-shorts",
      "toggle-recommendations",
      "toggle-comments"
    ];

    toggleIds.forEach((id) => {
      const el = getEl(id);
      if (el) {
        el.addEventListener("change", saveCurrentState);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
