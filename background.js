/**
 * ============================================================================
 * TubeIntent — Background Service Worker (Manifest V3)
 * ============================================================================
 *
 * ARCHITECTURAL ROLE:
 *   Handles background navigation routing for Shorts.
 *   Active only when extension is not paused and 'blockShorts' is enabled.
 * ============================================================================
 */

const SHORTS_PATTERN = /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/;

/**
 * Checks storage to determine if Shorts blocking is active.
 */
function isShortsBlockingActive(callback) {
  chrome.storage.local.get({ isPaused: false, blockShorts: true }, (res) => {
    if (chrome.runtime.lastError) {
      callback(false);
      return;
    }
    callback(!res.isPaused && Boolean(res.blockShorts));
  });
}

/**
 * 1. DIRECT / EXTERNAL URL NAVIGATION LISTENER
 */
chrome.webNavigation.onBeforeNavigate.addListener(
  (details) => {
    if (details.frameId !== 0) return;

    isShortsBlockingActive((active) => {
      if (!active) return;

      const match = details.url.match(SHORTS_PATTERN);
      if (match) {
        const videoId = match[1];
        const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
        chrome.tabs.update(details.tabId, { url: watchUrl }, () => {
          if (chrome.runtime.lastError) {
            // Suppress benign tab navigation race conditions
          }
        });
      } else if (details.url.includes("youtube.com/shorts")) {
        chrome.tabs.update(details.tabId, { url: "https://www.youtube.com/" }, () => {
          if (chrome.runtime.lastError) {
            // Suppress benign tab navigation race conditions
          }
        });
      }
    });
  },
  {
    url: [{ hostSuffix: "youtube.com", pathPrefix: "/shorts" }],
  }
);

/**
 * 2. SPA NAVIGATION FALLBACK (tabs.onUpdated)
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  // Only react when the URL property itself changes to avoid duplicate updates
  const url = changeInfo.url;
  if (!url || !url.includes("youtube.com/shorts")) return;

  isShortsBlockingActive((active) => {
    if (!active) return;

    const match = url.match(SHORTS_PATTERN);
    if (match) {
      const videoId = match[1];
      const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
      chrome.tabs.update(tabId, { url: watchUrl }, () => {
        if (chrome.runtime.lastError) {
          // Suppress benign tab navigation race conditions
        }
      });
    } else {
      chrome.tabs.update(tabId, { url: "https://www.youtube.com/" }, () => {
        if (chrome.runtime.lastError) {
          // Suppress benign tab navigation race conditions
        }
      });
    }
  });
});

/**
 * 3. INITIALIZATION ON INSTALL
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.storage.local.set({
      isPaused: false,
      zenModeEnabled: true,
      blockShorts: true,
      hideRecommendations: true,
      hideComments: true,
    });
  }
});
