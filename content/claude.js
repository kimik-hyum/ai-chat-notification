(() => {
  /** @type {{ createCompletionWatcher?: (cfg: unknown) => void }} */
  // eslint-disable-next-line no-undef
  const api = self.AIAnswerNotifier || {};
  if (typeof api.createCompletionWatcher !== "function") return;

  const STOP_BUTTON_SELECTORS = [
    'button[aria-label*="Stop"]',
    'button[aria-label*="중지"]',
    'button[aria-label*="중단"]',
    'button[title*="Stop"]',
    'button[title*="중지"]',
    'button[data-testid*="stop"]'
  ];

  function hasStopButton() {
    for (const sel of STOP_BUTTON_SELECTORS) {
      if (document.querySelector(sel)) return true;
    }

    const buttons = Array.from(document.querySelectorAll("button"));
    return buttons.some((b) => {
      const t = (b.innerText || "").trim();
      if (!t) return false;
      return t.includes("Stop") || t.includes("중지") || t.includes("중단");
    });
  }

  /**
   * @param {() => void} notify
   * @returns {() => void}
   */
  function observeGenerating(notify) {
    const mo = new MutationObserver(() => notify());
    const root = document.documentElement;
    mo.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class", "aria-label", "title", "data-testid", "aria-disabled", "hidden"]
    });
    notify();
    return () => mo.disconnect();
  }

  api.createCompletionWatcher({
    site: "claude",
    siteName: "Claude",
    isGenerating: hasStopButton,
    observe: observeGenerating
  });
})();


