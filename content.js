/**
 * ============================================================================
 * TubeIntent — Content Script (DOM & Navigation Engine)
 * ============================================================================
 *
 * STREAMLINED MODULAR CONTROL SYSTEM:
 *   1. isPaused: Master switch (instantly bypasses all rules when true).
 *   2. zenModeEnabled: Replaces homepage feed with minimalist search bar.
 *   3. blockShorts: Purges Shorts carousels/shelves & redirects /shorts/ URLs.
 *   4. hideRecommendations: Purges sidebar recommendations on watch pages.
 *   5. hideComments: Completely hides video comment sections.
 * ============================================================================
 */

(function () {
  "use strict";

  if (window.__TUBEINTENT_INITIALIZED__) return;
  window.__TUBEINTENT_INITIALIZED__ = true;

  function isExtensionValid() {
    return typeof chrome !== "undefined" && Boolean(chrome.runtime?.id);
  }

  let isStorageLoaded = false;
  let currentSettings = {
    isPaused: false,
    zenModeEnabled: true,
    blockShorts: true,
    hideRecommendations: true,
    hideComments: true,
  };

  /**
   * Applies declarative root attributes to <html>.
   */
  function syncRootAttributes() {
    const root = document.documentElement;
    if (!root) return;

    if (currentSettings.isPaused) {
      root.setAttribute("data-tubeintent-paused", "true");
      root.removeAttribute("data-tubeintent-zen");
      root.removeAttribute("data-tubeintent-block-shorts");
      root.removeAttribute("data-tubeintent-hide-recs");
      root.removeAttribute("data-tubeintent-hide-comments");
      return;
    }

    root.removeAttribute("data-tubeintent-paused");

    // 1. Zen Homepage
    const isHome = window.location.pathname === "/" || window.location.pathname === "/feed/trending";
    if (currentSettings.zenModeEnabled && isHome) {
      root.setAttribute("data-tubeintent-zen", "true");
    } else {
      root.removeAttribute("data-tubeintent-zen");
    }

    // 2. Block Shorts
    if (currentSettings.blockShorts) {
      root.setAttribute("data-tubeintent-block-shorts", "true");
    } else {
      root.removeAttribute("data-tubeintent-block-shorts");
    }

    // 3. Hide Recommendations
    if (currentSettings.hideRecommendations) {
      root.setAttribute("data-tubeintent-hide-recs", "true");
    } else {
      root.removeAttribute("data-tubeintent-hide-recs");
    }

    // 4. Hide Comments
    if (currentSettings.hideComments && window.location.pathname.startsWith("/watch")) {
      root.setAttribute("data-tubeintent-hide-comments", "true");
    } else {
      root.removeAttribute("data-tubeintent-hide-comments");
    }
  }

  // Pre-sync root attributes immediately so declarative CSS applies with 0ms flash
  syncRootAttributes();

  /**
   * Restores normal YouTube completely when paused.
   * Cleans up custom elements, inline styles, and kicks YouTube's virtual scroller.
   */
  function restoreNormalYouTube() {
    // 1. Remove Zen container if present
    const existingZen = document.getElementById(ZEN_CONTAINER_ID);
    if (existingZen) {
      existingZen.remove();
    }

    // 2. Unhide all elements hidden via TubeIntent
    document.querySelectorAll(".tubeintent-shorts-hidden, .tubeintent-recs-hidden").forEach((el) => {
      el.classList.remove("tubeintent-shorts-hidden", "tubeintent-recs-hidden");
      el.style.removeProperty("display");
    });

    document.querySelectorAll(".tubeintent-processed").forEach((el) => {
      el.classList.remove("tubeintent-processed");
    });

    // 3. Re-awaken YouTube's Polymer virtual scroller (iron-list / yt-virtual-list)
    window.dispatchEvent(new Event("resize"));
    window.dispatchEvent(new Event("scroll"));

    const scrollerElements = document.querySelectorAll(
      "iron-list, yt-virtual-list, ytd-rich-grid-renderer, ytd-section-list-renderer"
    );
    scrollerElements.forEach((el) => {
      if (typeof el.fire === "function") {
        try { el.fire("iron-resize"); } catch (_) {}
      }
      if (typeof el.notifyResize === "function") {
        try { el.notifyResize(); } catch (_) {}
      }
    });

    // Micro scroll nudge to trigger YouTube's lazy-loading observers
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
      if (window.scrollY === 0) {
        window.scrollBy(0, 1);
        window.scrollBy(0, -1);
      }
    }, 60);
  }

  // ==========================================================================
  // SECTION 2: SHORTS REDIRECT (ACTIVE ONLY IF BLOCK SHORTS IS ENABLED)
  // ==========================================================================

  function checkAndRedirectShorts() {
    if (currentSettings.isPaused || !currentSettings.blockShorts) return;
    const path = window.location.pathname;
    if (path.startsWith("/shorts/")) {
      const parts = path.split("/");
      const videoId = parts[2];
      if (videoId) {
        window.location.replace(`https://www.youtube.com/watch?v=${videoId}`);
      }
    }
  }

  // Capture phase click interceptor for Shorts navigation
  document.addEventListener(
    "click",
    (e) => {
      if (currentSettings.isPaused || !currentSettings.blockShorts) return;

      const link = e.target.closest('a[href*="/shorts/"], a[href^="/shorts"]');
      if (!link) return;

      const href = link.getAttribute("href") || link.href || "";
      const match = href.match(/\/shorts\/([a-zA-Z0-9_-]+)/);

      if (match) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        window.location.href = `https://www.youtube.com/watch?v=${match[1]}`;
      } else if (href === "/shorts" || href === "/shorts/") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        window.location.href = "https://www.youtube.com/";
      }
    },
    true
  );

  // ==========================================================================
  // SECTION 3: ZEN HOMEPAGE (TRUSTED TYPES COMPLIANT)
  // ==========================================================================

  const ZEN_CONTAINER_ID = "tubeintent-zen-container";
  let zenRetryTimer = null;

  function applyZenHomepage() {
    const isHome = window.location.pathname === "/" || window.location.pathname === "/feed/trending";

    if (!isHome || currentSettings.isPaused || !currentSettings.zenModeEnabled) {
      const existingZen = document.getElementById(ZEN_CONTAINER_ID);
      if (existingZen) existingZen.remove();
      return;
    }

    const browse = document.querySelector("ytd-browse");
    const primary = browse ? (browse.querySelector("#primary") || browse.querySelector("ytd-two-column-browse-results-renderer")) : null;
    const target = primary || browse || document.querySelector("ytd-page-manager") || document.body;

    if (!target) {
      if (document.readyState !== "complete") {
        clearTimeout(zenRetryTimer);
        zenRetryTimer = setTimeout(applyZenHomepage, 80);
      }
      return;
    }

    const existingZen = document.getElementById(ZEN_CONTAINER_ID);
    if (existingZen && target.contains(existingZen)) return;
    if (existingZen) existingZen.remove();

    // Pure createElement construction (Trusted Types compliant)
    const zenContainer = document.createElement("div");
    zenContainer.id = ZEN_CONTAINER_ID;
    zenContainer.className = "tubeintent-zen";

    const heading = document.createElement("h1");
    heading.className = "tubeintent-zen-heading";
    heading.textContent = "What do you want to learn today?";
    zenContainer.appendChild(heading);

    const form = document.createElement("form");
    form.className = "tubeintent-zen-form";
    form.action = "https://www.youtube.com/results";
    form.method = "GET";

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.name = "search_query";
    searchInput.className = "tubeintent-zen-input";
    searchInput.placeholder = "Search with intention...";
    searchInput.setAttribute("autocomplete", "off");

    const searchButton = document.createElement("button");
    searchButton.type = "submit";
    searchButton.className = "tubeintent-zen-button";
    searchButton.textContent = "Search";

    form.appendChild(searchInput);
    form.appendChild(searchButton);
    zenContainer.appendChild(form);

    const playlistLink = document.createElement("a");
    playlistLink.href = "https://www.youtube.com/feed/playlists";
    playlistLink.className = "tubeintent-zen-link";
    playlistLink.textContent = "📚 Go to your Playlists";
    zenContainer.appendChild(playlistLink);

    const tagline = document.createElement("p");
    tagline.className = "tubeintent-zen-tagline";
    tagline.textContent = "TubeIntent — Browse with purpose.";
    zenContainer.appendChild(tagline);

    target.prepend(zenContainer);
    setTimeout(() => {
      try { searchInput.focus(); } catch (_) {}
    }, 150);
  }

  // ==========================================================================
  // SECTION 4: PURGE SHORTS (ISOLATED SYSTEM)
  // ==========================================================================

  function purgeShorts() {
    if (currentSettings.isPaused || !currentSettings.blockShorts) {
      document.querySelectorAll(".tubeintent-shorts-hidden").forEach((el) => {
        el.classList.remove("tubeintent-shorts-hidden");
        el.style.removeProperty("display");
      });
      return;
    }

    // 1. Shorts shelves & carousels across search and home
    const directShelfSelectors = [
      "ytd-reel-shelf-renderer",
      "ytd-rich-shelf-renderer[is-shorts]",
      "grid-shelf-view-model",
      "yt-grid-shelf-view-model",
      "yt-shelf-view-model"
    ];
    document.querySelectorAll(directShelfSelectors.join(",")).forEach((shelf) => {
      shelf.style.setProperty("display", "none", "important");
      shelf.classList.add("tubeintent-shorts-hidden");
    });

    // 2. Search results shelves that contain Shorts
    document.querySelectorAll("ytd-shelf-renderer, ytd-rich-section-renderer").forEach((shelf) => {
      const hasShortsLink = shelf.querySelector('a[href*="/shorts/"], a[href^="/shorts"]');
      const headerTitle = shelf.querySelector("#title-container, #title, span.ytd-shelf-renderer, yt-formatted-string");
      const titleText = (headerTitle?.textContent || "").toLowerCase();
      if (hasShortsLink || titleText.includes("shorts")) {
        shelf.style.setProperty("display", "none", "important");
        shelf.classList.add("tubeintent-shorts-hidden");
      }
    });

    // 3. Individual Shorts cards (target unprocessed links to avoid redundant O(N) traversals)
    const shortsLinks = document.querySelectorAll(
      'a[href*="/shorts/"]:not(.tubeintent-processed), a[href^="/shorts"]:not(.tubeintent-processed)'
    );
    shortsLinks.forEach((link) => {
      link.classList.add("tubeintent-processed");
      const container = link.closest(
        [
          "ytd-reel-shelf-renderer",
          "ytd-shelf-renderer",
          "ytd-rich-section-renderer",
          "grid-shelf-view-model",
          "yt-grid-shelf-view-model",
          "yt-shelf-view-model",
          "ytd-reel-item-renderer",
          "yt-reel-item-view-model",
          "reel-item-view-model",
          "ytd-video-renderer",
          "ytd-compact-video-renderer",
          "ytd-rich-item-renderer",
          "yt-lockup-view-model"
        ].join(",")
      );

      if (container && !container.classList.contains("tubeintent-shorts-hidden")) {
        container.style.setProperty("display", "none", "important");
        container.classList.add("tubeintent-shorts-hidden");
      }
    });

    // 4. Sidebar guide navigation entries for Shorts
    document.querySelectorAll("ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer").forEach((entry) => {
      const link = entry.querySelector('a[href^="/shorts"], a[title="Shorts"]');
      if (link) {
        entry.style.setProperty("display", "none", "important");
        entry.classList.add("tubeintent-shorts-hidden");
      }
    });

    // 5. Channel page Shorts tabs
    document.querySelectorAll("yt-tab-shape, tp-yt-paper-tab").forEach((tab) => {
      const title = tab.getAttribute("tab-title") || tab.textContent || "";
      if (title.toLowerCase().includes("shorts")) {
        tab.style.setProperty("display", "none", "important");
        tab.classList.add("tubeintent-shorts-hidden");
      }
    });
  }

  // ==========================================================================
  // SECTION 5: PURGE RECOMMENDATIONS (WATCH PAGE SIDEBAR)
  // ==========================================================================

  function purgeRecommendations() {
    if (currentSettings.isPaused || !currentSettings.hideRecommendations) {
      document.querySelectorAll(".tubeintent-recs-hidden").forEach((el) => {
        el.classList.remove("tubeintent-recs-hidden");
        el.style.removeProperty("display");
      });
      return;
    }

    if (window.location.pathname.startsWith("/watch")) {
      const related = document.getElementById("related") || document.querySelector("ytd-watch-next-secondary-results-renderer");
      if (related) {
        related.style.setProperty("display", "none", "important");
        related.classList.add("tubeintent-recs-hidden");
      }
    }
  }

  // ==========================================================================
  // SECTION 6: MASTER EVALUATOR & LEADING-TRAILING THROTTLE
  // ==========================================================================

  function evaluateAllRules() {
    if (!isExtensionValid()) return;

    syncRootAttributes();

    if (currentSettings.isPaused) {
      restoreNormalYouTube();
      return;
    }

    checkAndRedirectShorts();
    applyZenHomepage();
    purgeShorts();
    purgeRecommendations();
  }

  let lastRunTimestamp = 0;
  let throttleTimer = null;

  function throttledEvaluate() {
    if (currentSettings.isPaused) return;

    const now = Date.now();
    const timeSinceLastRun = now - lastRunTimestamp;

    if (timeSinceLastRun >= 150) {
      lastRunTimestamp = now;
      evaluateAllRules();
    } else {
      clearTimeout(throttleTimer);
      throttleTimer = setTimeout(() => {
        lastRunTimestamp = Date.now();
        evaluateAllRules();
      }, 150 - timeSinceLastRun);
    }
  }

  // ==========================================================================
  // SECTION 7: RESILIENT OBSERVER (ACTIVE FROM ROOT IMMEDIATELY)
  // ==========================================================================

  const IGNORED_MUTATION_SELECTORS = [
    "#tubeintent-zen-container",
    ".html5-video-player",
    "ytd-live-chat-frame",
    "tp-yt-paper-tooltip"
  ];

  const observer = new MutationObserver((mutations) => {
    if (!isExtensionValid() || currentSettings.isPaused) return;

    let hasExternalMutation = false;
    for (let i = 0; i < mutations.length; i++) {
      const m = mutations[i];

      // Ignore our own injected nodes
      let isSelfNode = false;
      for (let j = 0; j < m.addedNodes.length; j++) {
        const node = m.addedNodes[j];
        if (node.id === ZEN_CONTAINER_ID || (node.classList && node.classList.contains("tubeintent-zen"))) {
          isSelfNode = true;
          break;
        }
      }
      if (isSelfNode) continue;

      const target = m.target;
      if (
        target &&
        target.nodeType === Node.ELEMENT_NODE &&
        !IGNORED_MUTATION_SELECTORS.some((sel) => target.closest?.(sel))
      ) {
        hasExternalMutation = true;
        break;
      }
    }

    if (hasExternalMutation) {
      throttledEvaluate();
    }
  });

  const rootTarget = document.documentElement || document.body;
  if (rootTarget) {
    observer.observe(rootTarget, {
      childList: true,
      subtree: true,
    });
  }

  // ==========================================================================
  // SECTION 8: LIFECYCLE & SYNCHRONIZATION
  // ==========================================================================

  // 1. Initial Storage Load
  if (isExtensionValid()) {
    chrome.storage.local.get(
      {
        isPaused: false,
        zenModeEnabled: true,
        blockShorts: true,
        hideRecommendations: true,
        hideComments: true,
      },
      (stored) => {
        if (!isExtensionValid() || chrome.runtime.lastError) return;
        isStorageLoaded = true;
        currentSettings = Object.assign(currentSettings, stored);
        evaluateAllRules();
      }
    );

    // 2. Storage Changed Listener (Sync across tabs)
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (!isExtensionValid() || areaName !== "local") return;
      for (const [key, change] of Object.entries(changes)) {
        currentSettings[key] = change.newValue;
      }
      evaluateAllRules();
    });

    // 3. Direct Message Listener (Instant 0ms sync from popup)
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!isExtensionValid() || !message) return;
      if (message.action === "syncSettings") {
        isStorageLoaded = true;
        currentSettings = Object.assign(currentSettings, message.settings);
        evaluateAllRules();
        sendResponse({ success: true });
      }
    });
  }

  // Document ready events to guarantee rules run when elements are parsed
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      evaluateAllRules();
    }, { once: true });
  } else {
    evaluateAllRules();
  }

  window.addEventListener("load", () => {
    evaluateAllRules();
  }, { once: true });

  // Native YouTube router lifecycle events
  window.addEventListener("yt-navigate-start", checkAndRedirectShorts, { passive: true });
  window.addEventListener(
    "yt-navigate-finish",
    () => {
      checkAndRedirectShorts();
      throttledEvaluate();
    },
    { passive: true }
  );
  window.addEventListener(
    "yt-page-data-updated",
    () => {
      throttledEvaluate();
    },
    { passive: true }
  );
  window.addEventListener("popstate", throttledEvaluate, { passive: true });
})();
