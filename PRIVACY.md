# Privacy Policy for TubeIntent

**Effective Date:** October 31, 2026  
**Version:** 1.0.0  

TubeIntent ("the extension") is developed as a free, open-source, client-side productivity tool designed to help users browse YouTube with intention.

---

### 1. Zero Data Collection
TubeIntent operates under a strict **Zero-Telemetry Policy**:
- We do **not** collect, store, record, transmit, or sell your personal information, browsing history, YouTube activity, IP address, search queries, or video interactions.
- We do **not** use third-party analytics (e.g., Google Analytics, Mixpanel, Sentry) or tracking pixels anywhere within the extension code.

---

### 2. Local Execution and Storage
All user preferences (such as enabling Zen Mode, blocking Shorts, or hiding recommendations) are stored exclusively on your local device using the browser's built-in `chrome.storage.local` API. This data:
- Remains entirely within your browser sandbox.
- Is never transmitted to external servers, cloud databases, or third-party entities.
- Is wiped automatically if you uninstall the extension.

---

### 3. Permissions Explanation
TubeIntent scopes its permissions strictly to what is required for core functionality:
- **`storage`**: Used to save your toggle preferences locally on your machine.
- **`webNavigation`**: Used solely to intercept and redirect YouTube Shorts (`/shorts/`) URLs into standard desktop watch pages (`/watch?v=`).
- **Host Permissions (`*://*.youtube.com/*`, `*://youtube.com/*`)**: Used exclusively to inject the declarative stylesheet and DOM filtering content script on YouTube.

---

### 4. Third-Party Services
TubeIntent does not communicate with any external APIs or third-party web services. The extension functions 100% offline relative to any external servers (aside from your direct connection to YouTube).

---

### 5. Open Source Transparency
TubeIntent is open source. You can independently review, audit, and verify the entire source code on GitHub at:  
[https://github.com/TubeIntent/TubeIntent](https://github.com/TubeIntent/TubeIntent)

---

### 6. Contact & Inquiries
If you have any questions about this Privacy Policy, please contact:  
**Email:** privacy@tubeintent.app  
**GitHub Issues:** [https://github.com/TubeIntent/TubeIntent/issues](https://github.com/TubeIntent/TubeIntent/issues)
